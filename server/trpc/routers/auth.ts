// server/trpc/routers/auth.ts - Authentication router

import { router, publicProcedure } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';
import { type JWTPayload, type UserRow, userRowToUser } from '@/types';
import {
  signupSchema,
  signinSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '@/types/schemas';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_EXPIRY_DAYS = 30;

export const authRouter = router({
  // Sign up new user
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      const { email, password, name, language } = input;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name,
          language,
          tier: 'free',
          subscription_status: 'active',
          reflection_count_this_month: 0,
          total_reflections: 0,
          current_month_year: new Date().toISOString().slice(0, 7),
          last_sign_in_at: new Date().toISOString(),
          email_verified: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Signup error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }

      // Generate JWT
      const payload: JWTPayload = {
        userId: newUser.id,
        email: newUser.email,
        tier: newUser.tier,
        isCreator: newUser.is_creator || false,
        isAdmin: newUser.is_admin || false,
        isDemo: newUser.is_demo || false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * JWT_EXPIRY_DAYS,
      };

      const token = jwt.sign(payload, JWT_SECRET);

      // Include onboarding_completed flag (new users always need onboarding unless admin/creator)
      const userResponse = userRowToUser(newUser);

      return {
        user: {
          ...userResponse,
          onboardingCompleted: newUser.onboarding_completed || false,
        },
        token,
        message: 'Account created successfully',
      };
    }),

  // Sign in existing user
  signin: publicProcedure
    .input(signinSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Fetch user with password hash
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if monthly usage needs reset
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      if (user.current_month_year !== currentMonthYear) {
        await supabase
          .from('users')
          .update({
            reflection_count_this_month: 0,
            current_month_year: currentMonthYear,
            last_sign_in_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        user.reflection_count_this_month = 0;
        user.current_month_year = currentMonthYear;
      } else {
        // Update last sign in
        await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Generate JWT
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        isCreator: user.is_creator || false,
        isAdmin: user.is_admin || false,
        isDemo: user.is_demo || false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * JWT_EXPIRY_DAYS,
      };

      const token = jwt.sign(payload, JWT_SECRET);

      return {
        user: userRowToUser(user),
        token,
        message: 'Signed in successfully',
      };
    }),

  // Verify token and get current user
  verifyToken: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    return {
      user: ctx.user,
      message: 'Token valid',
    };
  }),

  // Sign out (client-side token removal, no server action needed)
  signout: publicProcedure.mutation(async () => {
    return {
      success: true,
      message: 'Signed out successfully',
    };
  }),

  // Get current user (protected)
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return {
        user: userRowToUser(data),
        message: 'Profile updated successfully',
      };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch user with password hash
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(
        input.currentPassword,
        user.password_hash
      );

      if (!passwordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      // Check if new password is different
      const samePassword = await bcrypt.compare(
        input.newPassword,
        user.password_hash
      );

      if (samePassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'New password must be different from current password',
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

      // Update password
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      if (error) {
        console.error('Change password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }

      return {
        message: 'Password changed successfully',
      };
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(deleteAccountSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify email matches
      if (input.confirmEmail.toLowerCase() !== ctx.user.email.toLowerCase()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email confirmation does not match',
        });
      }

      // Fetch user with password hash
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(input.password, user.password_hash);

      if (!passwordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password is incorrect',
        });
      }

      // Delete user (cascade deletes reflections)
      const { error } = await supabase.from('users').delete().eq('id', ctx.user.id);

      if (error) {
        console.error('Delete account error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        });
      }

      return {
        message: 'Account deleted successfully',
      };
    }),

  // Demo login (no password required)
  loginDemo: publicProcedure.mutation(async () => {
    // Fetch demo user from database
    const { data: demoUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_demo', true)
      .single();

    if (error || !demoUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Demo user not found. Please contact support.',
      });
    }

    // Generate JWT with isDemo flag
    const payload: JWTPayload = {
      userId: demoUser.id,
      email: demoUser.email,
      tier: demoUser.tier,
      isCreator: demoUser.is_creator || false,
      isAdmin: demoUser.is_admin || false,
      isDemo: true, // Demo user flag
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    const token = jwt.sign(payload, JWT_SECRET);

    return {
      user: userRowToUser(demoUser),
      token,
      message: 'Welcome to the demo!',
    };
  }),
});
