// server/trpc/routers/dreams.ts - Dreams CRUD operations

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '../middleware';
import { router } from '../trpc';

import { DREAM_LIMITS } from '@/lib/utils/constants';
import { cacheDelete, cacheKeys } from '@/server/lib/cache';
import { dbLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createDreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(), // ISO date string
  category: z
    .enum([
      'health',
      'career',
      'relationships',
      'financial',
      'personal_growth',
      'creative',
      'spiritual',
      'entrepreneurial',
      'educational',
      'other',
    ])
    .optional(),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

const updateDreamSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  targetDate: z.string().nullable().optional(), // ISO date string or null to clear
  category: z
    .enum([
      'health',
      'career',
      'relationships',
      'financial',
      'personal_growth',
      'creative',
      'spiritual',
      'entrepreneurial',
      'educational',
      'other',
    ])
    .optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'achieved', 'archived', 'released']),
});

const dreamIdSchema = z.object({
  id: z.string().uuid(),
});

const listDreamsSchema = z.object({
  status: z.enum(['active', 'achieved', 'archived', 'released']).optional(),
  includeStats: z.boolean().optional().default(true),
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function checkDreamLimit(userId: string, userTier: string): Promise<boolean> {
  const tier = userTier as keyof typeof DREAM_LIMITS;
  const limit = DREAM_LIMITS[tier] ?? 0;

  if (!Number.isFinite(limit)) return true; // Unlimited

  const { count, error } = await supabase
    .from('dreams')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check dream limit',
    });
  }

  return (count || 0) < limit;
}

function calculateDaysLeft(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function getDreamWithStats(dreamId: string, userId: string) {
  // Query 1: Get dream (must complete first to verify access)
  const { data: dream, error: dreamError } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', dreamId)
    .eq('user_id', userId)
    .single();

  if (dreamError || !dream) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Dream not found',
    });
  }

  // Queries 2 & 3: Run in parallel to fix N+1 query pattern
  const [countResult, lastReflectionResult] = await Promise.all([
    supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dreamId),
    supabase
      .from('reflections')
      .select('created_at')
      .eq('dream_id', dreamId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    ...dream,
    daysLeft: calculateDaysLeft(dream.target_date),
    reflectionCount: countResult.count || 0,
    lastReflectionAt: lastReflectionResult.data?.created_at || null,
  };
}

// =====================================================
// ROUTER DEFINITION
// =====================================================

export const dreamsRouter = router({
  // Create a new dream
  create: protectedProcedure.input(createDreamSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const userTier = ctx.user.tier;

    // Check tier limit
    const canCreate = await checkDreamLimit(userId, userTier);
    if (!canCreate) {
      const limit = DREAM_LIMITS[userTier as keyof typeof DREAM_LIMITS] ?? 0;
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Dream limit reached for ${userTier} tier. Maximum: ${limit} active dreams. Upgrade to create more dreams.`,
      });
    }

    // Create dream
    const { data, error } = await supabase
      .from('dreams')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        target_date: input.targetDate,
        category: input.category,
        priority: input.priority,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      dbLogger.error({ err: error, operation: 'dreams.create', userId }, 'Failed to create dream');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create dream',
      });
    }

    // Get current dream count for usage response
    const { count: activeCount } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Invalidate dreams cache after successful create
    await cacheDelete(cacheKeys.dreams(userId));

    const tierLimit = DREAM_LIMITS[userTier as keyof typeof DREAM_LIMITS] ?? 0;
    return {
      dream: data,
      usage: {
        dreamsUsed: activeCount || 0,
        dreamsLimit: tierLimit,
        dreamLimitReached: Number.isFinite(tierLimit) && (activeCount || 0) >= tierLimit,
      },
    };
  }),

  // List user's dreams
  list: protectedProcedure.input(listDreamsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    let query = supabase
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (input.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dreams',
      });
    }

    // If includeStats, get reflection counts for all dreams in a single batch query
    // This replaces the N+1 pattern (2N queries) with a single query approach
    if (input.includeStats && data && data.length > 0) {
      // Get all dream IDs for batch query
      const dreamIds = data.map((d) => d.id);

      // Single query to get all reflections for all dreams (ordered by created_at desc)
      const { data: allReflections } = await supabase
        .from('reflections')
        .select('dream_id, created_at')
        .in('dream_id', dreamIds)
        .order('created_at', { ascending: false });

      // Group reflections by dream_id and calculate stats in memory
      const statsByDream = (allReflections || []).reduce(
        (acc, reflection) => {
          const dreamId = reflection.dream_id;
          if (!dreamId) return acc; // Skip if dream_id is null

          if (!acc[dreamId]) {
            // First reflection we encounter is the most recent (ordered desc)
            acc[dreamId] = {
              count: 0,
              lastReflectionAt: reflection.created_at,
            };
          }
          acc[dreamId].count++;
          return acc;
        },
        {} as Record<string, { count: number; lastReflectionAt: string | null }>
      );

      // Merge stats with dreams
      const dreamsWithStats = data.map((dream) => ({
        ...dream,
        daysLeft: calculateDaysLeft(dream.target_date),
        reflectionCount: statsByDream[dream.id]?.count || 0,
        lastReflectionAt: statsByDream[dream.id]?.lastReflectionAt || null,
      }));

      return dreamsWithStats;
    }

    // Handle empty data array with includeStats
    if (input.includeStats && data && data.length === 0) {
      return [];
    }

    // Even without stats, add daysLeft
    return (data || []).map((dream) => ({
      ...dream,
      daysLeft: calculateDaysLeft(dream.target_date),
    }));
  }),

  // Get single dream by ID
  get: protectedProcedure.input(dreamIdSchema).query(async ({ ctx, input }) => {
    return getDreamWithStats(input.id, ctx.user.id);
  }),

  // Update dream
  update: protectedProcedure.input(updateDreamSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { id, ...updateData } = input;

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('dreams')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    }

    // Update dream
    const { data, error } = await supabase
      .from('dreams')
      .update({
        title: updateData.title,
        description: updateData.description,
        target_date: updateData.targetDate,
        category: updateData.category,
        priority: updateData.priority,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dream',
      });
    }

    // Invalidate dreams cache after successful update
    await cacheDelete(cacheKeys.dreams(userId));

    return data;
  }),

  // Update dream status
  updateStatus: protectedProcedure.input(updateStatusSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('dreams')
      .select('id')
      .eq('id', input.id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    }

    // Prepare update data with timestamp
    const updateData: {
      status: 'active' | 'achieved' | 'archived' | 'released';
      achieved_at?: string;
      archived_at?: string;
      released_at?: string;
    } = { status: input.status };

    if (input.status === 'achieved') {
      updateData.achieved_at = new Date().toISOString();
    } else if (input.status === 'archived') {
      updateData.archived_at = new Date().toISOString();
    } else if (input.status === 'released') {
      updateData.released_at = new Date().toISOString();
    }

    // Update status
    const { data, error } = await supabase
      .from('dreams')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dream status',
      });
    }

    // Invalidate dreams cache after successful status update
    await cacheDelete(cacheKeys.dreams(userId));

    return data;
  }),

  // Delete dream
  delete: protectedProcedure.input(dreamIdSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('dreams')
      .select('id')
      .eq('id', input.id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    }

    // Delete dream (reflections will have dream_id set to NULL due to ON DELETE SET NULL)
    const { error } = await supabase.from('dreams').delete().eq('id', input.id);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete dream',
      });
    }

    // Invalidate dreams cache after successful delete
    await cacheDelete(cacheKeys.dreams(userId));

    return { success: true };
  }),

  // Get dream limits for current user
  getLimits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userTier = ctx.user.tier as keyof typeof DREAM_LIMITS;

    const { count: activeCount } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const limit = DREAM_LIMITS[userTier] ?? 0;

    return {
      tier: userTier,
      dreamsUsed: activeCount || 0,
      dreamsLimit: limit,
      dreamsRemaining: !Number.isFinite(limit) ? Infinity : Math.max(0, limit - (activeCount || 0)),
      canCreate: !Number.isFinite(limit) || (activeCount || 0) < limit,
    };
  }),
});
