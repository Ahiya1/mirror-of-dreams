// app/api/auth/verify-email/route.ts - Verify email with token

import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/server/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate token
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Look up token
    const { data: verificationToken, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !verificationToken) {
      return NextResponse.json({
        success: false,
        invalid: true,
        error: 'Invalid or expired verification link',
      });
    }

    // Check if token is expired
    const expiresAt = new Date(verificationToken.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired token
      await supabase.from('email_verification_tokens').delete().eq('id', verificationToken.id);

      return NextResponse.json({
        success: false,
        expired: true,
        error: 'This verification link has expired. Please request a new one.',
      });
    }

    // Get user to check current status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, email_verified')
      .eq('id', verificationToken.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already verified
    if (user.email_verified) {
      // Clean up token
      await supabase.from('email_verification_tokens').delete().eq('id', verificationToken.id);

      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Email is already verified',
      });
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', verificationToken.user_id);

    if (updateError) {
      console.error('Failed to verify email:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    // Delete the used token and any other tokens for this user
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', verificationToken.user_id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for direct link clicks (redirects to the HTML page)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    // Redirect to error page or signin
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Redirect to the verify-email HTML page with the token
  return NextResponse.redirect(new URL(`/auth/verify-email.html?token=${token}`, request.url));
}
