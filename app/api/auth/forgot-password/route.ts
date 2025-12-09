// app/api/auth/forgot-password/route.ts - Request password reset

import { NextRequest, NextResponse } from 'next/server';

import { withRateLimit } from '@/server/lib/api-rate-limit';
import { sendPasswordResetEmail, generateResetToken, getTokenExpiration } from '@/server/lib/email';
import { supabase } from '@/server/lib/supabase';

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const body = await request.json();
      const { email } = body;

      // Validate email
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', normalizedEmail)
        .single();

      // Always return success to prevent email enumeration attacks
      // But only send email if user actually exists
      if (userError || !user) {
        // Return success anyway to prevent enumeration
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a reset link has been sent.',
        });
      }

      // Invalidate any existing tokens for this user
      await supabase.from('password_reset_tokens').delete().eq('user_id', user.id);

      // Generate new token
      const token = generateResetToken();
      const expiresAt = getTokenExpiration();

      // Store token in database
      const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

      if (tokenError) {
        console.error('Failed to create reset token:', tokenError);
        return NextResponse.json(
          { success: false, error: 'Failed to process request' },
          { status: 500 }
        );
      }

      // Send email
      const emailResult = await sendPasswordResetEmail(user.email, token, user.name);

      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error);
        // Clean up the token since email failed
        await supabase.from('password_reset_tokens').delete().eq('token', token);

        return NextResponse.json(
          { success: false, error: 'Failed to send reset email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}
