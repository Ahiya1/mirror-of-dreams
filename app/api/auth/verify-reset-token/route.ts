// app/api/auth/verify-reset-token/route.ts - Verify password reset token validity

import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/server/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate token
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    // Look up token
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (error || !resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired token',
      });
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json({
        valid: false,
        error: 'This reset link has already been used',
      });
    }

    // Check if token is expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        expired: true,
        error: 'This reset link has expired',
      });
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
