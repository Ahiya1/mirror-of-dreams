// server/trpc/routers/dreams.ts - Dreams CRUD operations

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';

// =====================================================
// TIER LIMITS CONFIGURATION
// =====================================================
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },
  optimal: { dreams: 7 },
  premium: { dreams: 999999 }, // Unlimited
} as const;

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
  const tier = userTier as keyof typeof TIER_LIMITS;
  const limit = TIER_LIMITS[tier]?.dreams || 0;

  if (limit === 999999) return true; // Unlimited

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
  // Get dream
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

  // Get reflection count and last reflection
  const { count: reflectionCount, error: countError } = await supabase
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('dream_id', dreamId);

  const { data: lastReflection, error: lastError } = await supabase
    .from('reflections')
    .select('created_at')
    .eq('dream_id', dreamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    ...dream,
    daysLeft: calculateDaysLeft(dream.target_date),
    reflectionCount: reflectionCount || 0,
    lastReflectionAt: lastReflection?.created_at || null,
  };
}

// =====================================================
// ROUTER DEFINITION
// =====================================================

export const dreamsRouter = router({
  // Create a new dream
  create: protectedProcedure
    .input(createDreamSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userTier = ctx.user.tier;

      // Check tier limit
      const canCreate = await checkDreamLimit(userId, userTier);
      if (!canCreate) {
        const limit = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]?.dreams || 0;
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
        console.error('Failed to create dream:', error);
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

      return {
        dream: data,
        usage: {
          dreamsUsed: activeCount || 0,
          dreamsLimit: TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]?.dreams || 0,
          dreamLimitReached: (activeCount || 0) >= (TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]?.dreams || 0),
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

    // If includeStats, get reflection counts for each dream
    if (input.includeStats && data) {
      const dreamsWithStats = await Promise.all(
        data.map(async (dream) => {
          const { count: reflectionCount } = await supabase
            .from('reflections')
            .select('*', { count: 'exact', head: true })
            .eq('dream_id', dream.id);

          const { data: lastReflection } = await supabase
            .from('reflections')
            .select('created_at')
            .eq('dream_id', dream.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...dream,
            daysLeft: calculateDaysLeft(dream.target_date),
            reflectionCount: reflectionCount || 0,
            lastReflectionAt: lastReflection?.created_at || null,
          };
        })
      );

      return dreamsWithStats;
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

    return data;
  }),

  // Update dream status
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
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
      const updateData: any = { status: input.status };

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

    return { success: true };
  }),

  // Get dream limits for current user
  getLimits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userTier = ctx.user.tier as keyof typeof TIER_LIMITS;

    const { count: activeCount } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const limit = TIER_LIMITS[userTier]?.dreams || 0;

    return {
      tier: userTier,
      dreamsUsed: activeCount || 0,
      dreamsLimit: limit,
      dreamsRemaining: limit === 999999 ? 999999 : Math.max(0, limit - (activeCount || 0)),
      canCreate: (activeCount || 0) < limit,
    };
  }),
});
