// server/trpc/routers/users.ts - User profile and usage management

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { updateProfileSchema } from '@/types/schemas';
import { userRowToUser } from '@/types/user';
import type { UserRow } from '@/types/user';

export const usersRouter = router({
  // Complete onboarding for new users
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete onboarding',
      });
    }

    return { success: true, user: userRowToUser(data as UserRow) };
  }),

  // Get user profile with comprehensive data
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select(
        `
        id, email, name, tier, subscription_status, subscription_period,
        subscription_started_at, subscription_expires_at,
        reflection_count_this_month, total_reflections,
        is_creator, is_admin, is_demo, language, timezone,
        preferences, last_reflection_at, created_at, last_sign_in_at
      `
      )
      .eq('id', ctx.user.id)
      .single();

    if (error || !userProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    // Calculate additional metrics
    const daysSinceJoining = Math.floor(
      (new Date().getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const averageReflectionsPerMonth = userProfile.total_reflections > 0
      ? Math.round((userProfile.total_reflections / Math.max(1, daysSinceJoining / 30)) * 10) / 10
      : 0;

    return {
      ...userProfile,
      memberSince: userProfile.created_at,
      daysSinceJoining,
      isSubscribed: userProfile.tier !== 'free',
      subscriptionActive: userProfile.subscription_status === 'active',
      averageReflectionsPerMonth,
      lastActiveDate: userProfile.last_reflection_at || userProfile.last_sign_in_at,
    };
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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return {
        user: userRowToUser(data as UserRow),
        message: 'Profile updated successfully',
      };
    }),

  // Get detailed usage statistics
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    // Get reflection statistics
    const { data: reflections, error: reflectionsError } = await supabase
      .from('reflections')
      .select('created_at, tone, is_premium, word_count')
      .eq('user_id', ctx.user.id);

    if (reflectionsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch usage statistics',
      });
    }

    // Calculate statistics
    const stats = {
      totalReflections: reflections?.length || 0,
      reflectionsByTone: {
        gentle: reflections?.filter(r => r.tone === 'gentle').length || 0,
        intense: reflections?.filter(r => r.tone === 'intense').length || 0,
        fusion: reflections?.filter(r => r.tone === 'fusion').length || 0,
      },
      premiumReflections: reflections?.filter(r => r.is_premium).length || 0,
      averageWordCount: reflections?.length
        ? Math.round(reflections.reduce((sum, r) => sum + (r.word_count || 0), 0) / reflections.length)
        : 0,
      thisMonth: ctx.user.reflectionCountThisMonth,
      tier: ctx.user.tier,
      currentMonthYear: ctx.user.currentMonthYear,
    };

    // Get monthly breakdown (last 6 months)
    const monthlyBreakdown = calculateMonthlyBreakdown(reflections || []);

    return {
      ...stats,
      monthlyBreakdown,
    };
  }),

  // Get complete dashboard data in one request
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    // Get recent reflections
    const { data: recentReflections, error: reflectionsError } = await supabase
      .from('reflections')
      .select('id, dream, title, tone, is_premium, created_at')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reflectionsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard data',
      });
    }

    // Get usage limits
    const TIER_LIMITS = {
      free: 1,
      essential: 5,
      premium: 10,
    };

    const limit = ctx.user.isCreator || ctx.user.isAdmin
      ? 999999
      : TIER_LIMITS[ctx.user.tier];

    const usage = {
      tier: ctx.user.tier,
      limit,
      used: ctx.user.reflectionCountThisMonth,
      remaining: Math.max(0, limit - ctx.user.reflectionCountThisMonth),
      canReflect: ctx.user.reflectionCountThisMonth < limit || ctx.user.isCreator || ctx.user.isAdmin,
      currentMonth: ctx.user.currentMonthYear,
    };

    return {
      user: {
        name: ctx.user.name,
        email: ctx.user.email,
        tier: ctx.user.tier,
        isCreator: ctx.user.isCreator,
      },
      usage,
      recentReflections: recentReflections || [],
      stats: {
        totalReflections: ctx.user.totalReflections,
        thisMonth: ctx.user.reflectionCountThisMonth,
      },
    };
  }),
});

// Helper function to calculate monthly breakdown
function calculateMonthlyBreakdown(reflections: any[]) {
  const monthlyData: Record<string, number> = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  // Count reflections by month
  reflections.forEach(r => {
    const date = new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData.hasOwnProperty(key)) {
      monthlyData[key]++;
    }
  });

  return Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .reverse();
}

export type UsersRouter = typeof usersRouter;
