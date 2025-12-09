// app/api/auth/send-verification/route.ts - Send/resend email verification

import { NextRequest, NextResponse } from 'next/server';

import { withRateLimit } from '@/server/lib/api-rate-limit';
import {
  sendVerificationEmail,
  generateToken,
  getVerificationTokenExpiration,
} from '@/server/lib/email';
import { supabase } from '@/server/lib/supabase';

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const body = await request.json();
      const { email, userId } = body;

      // Need either email or userId
      if (!email && !userId) {
        return NextResponse.json(
          { success: false, error: 'Email or user ID is required' },
          { status: 400 }
        );
      }

      // Find user
      let user;
      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, email_verified')
          .eq('id', userId)
          .single();

        if (error || !data) {
          return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }
        user = data;
      } else {
        const normalizedEmail = email.toLowerCase().trim();
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, email_verified')
          .eq('email', normalizedEmail)
          .single();

        if (error || !data) {
          // Return success to prevent email enumeration
          return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a verification link has been sent.',
          });
        }
        user = data;
      }

      // Check if already verified
      if (user.email_verified) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: 'Email is already verified',
        });
      }

      // Delete any existing verification tokens for this user
      await supabase.from('email_verification_tokens').delete().eq('user_id', user.id);

      // Generate new token
      const token = generateToken();
      const expiresAt = getVerificationTokenExpiration();

      // Store token
      const { error: tokenError } = await supabase.from('email_verification_tokens').insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

      if (tokenError) {
        console.error('Failed to create verification token:', tokenError);
        return NextResponse.json(
          { success: false, error: 'Failed to process request' },
          { status: 500 }
        );
      }

      // Send email
      const emailResult = await sendVerificationEmail(user.email, token, user.name);

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Clean up token
        await supabase.from('email_verification_tokens').delete().eq('token', token);

        return NextResponse.json(
          { success: false, error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Send verification error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}
