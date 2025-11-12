// server/trpc/routers/reflections.ts - Reflection CRUD operations

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { protectedProcedure, usageLimitedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import {
  reflectionListSchema,
  updateReflectionSchema,
  submitFeedbackSchema,
  reflectionIdSchema,
  createReflectionSchema,
} from '@/types/schemas';
import { reflectionRowToReflection } from '@/types/reflection';
import type { ReflectionRow } from '@/types/reflection';

export const reflectionsRouter = router({
  // Get paginated reflection history
  list: protectedProcedure
    .input(reflectionListSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, tone, isPremium, search, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('reflections')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id);

      // Apply filters
      if (tone) {
        query = query.eq('tone', tone);
      }
      if (isPremium !== undefined) {
        query = query.eq('is_premium', isPremium);
      }
      if (search) {
        query = query.or(
          `dream.ilike.%${search}%,plan.ilike.%${search}%,relationship.ilike.%${search}%`
        );
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections',
        });
      }

      return {
        items: (data || []).map((row) => reflectionRowToReflection(row as ReflectionRow)),
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      };
    }),

  // Get single reflection by ID
  getById: protectedProcedure
    .input(reflectionIdSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id) // Ensure user owns reflection
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reflection not found',
        });
      }

      // Increment view count
      await supabase
        .from('reflections')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', input.id);

      return reflectionRowToReflection(data as ReflectionRow);
    }),

  // Update reflection (title/tags)
  update: protectedProcedure
    .input(updateReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('reflections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update reflection',
        });
      }

      return {
        reflection: reflectionRowToReflection(data as ReflectionRow),
        message: 'Reflection updated successfully',
      };
    }),

  // Delete reflection
  delete: protectedProcedure
    .input(reflectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before delete
      const { data: reflection } = await supabase
        .from('reflections')
        .select('id')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (!reflection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reflection not found',
        });
      }

      // Delete reflection
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete reflection',
        });
      }

      // Decrement usage counters
      await supabase
        .from('users')
        .update({
          reflection_count_this_month: Math.max(0, ctx.user.reflectionCountThisMonth - 1),
          total_reflections: Math.max(0, ctx.user.totalReflections - 1),
        })
        .eq('id', ctx.user.id);

      return {
        message: 'Reflection deleted successfully',
      };
    }),

  // Submit feedback for reflection
  submitFeedback: protectedProcedure
    .input(submitFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, rating, feedback } = input;

      const { data, error } = await supabase
        .from('reflections')
        .update({
          rating,
          user_feedback: feedback || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit feedback',
        });
      }

      return {
        reflection: reflectionRowToReflection(data as ReflectionRow),
        message: 'Feedback submitted successfully',
      };
    }),

  // Check current usage status
  checkUsage: protectedProcedure.query(async ({ ctx }) => {
    // Aligned with vision: Free tier gets 4 reflections/month
    const TIER_LIMITS = {
      free: 4,        // Vision: 4 reflections/month for Free tier
      essential: 10,   // Between free and optimal
      optimal: 30,     // Vision: 30 reflections/month for Optimal tier
      premium: 999999  // Unlimited for admin/creator
    };

    const limit = ctx.user.isCreator || ctx.user.isAdmin
      ? 999999
      : TIER_LIMITS[ctx.user.tier] || 0;

    const used = ctx.user.reflectionCountThisMonth;
    const remaining = Math.max(0, limit - used);
    const canReflect = remaining > 0;

    return {
      tier: ctx.user.tier,
      limit,
      used,
      remaining,
      canReflect,
      isCreator: ctx.user.isCreator,
      currentMonth: ctx.user.currentMonthYear,
    };
  }),
});

export type ReflectionsRouter = typeof reflectionsRouter;
