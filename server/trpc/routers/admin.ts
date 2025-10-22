// server/trpc/routers/admin.ts - Admin operations

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { creatorProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { adminCreatorAuthSchema } from '@/types/schemas';

export const adminRouter = router({
  // Authenticate as creator/admin
  authenticate: publicProcedure
    .input(adminCreatorAuthSchema)
    .mutation(async ({ input }) => {
      const { creatorSecret } = input;

      if (creatorSecret === process.env.CREATOR_SECRET_KEY) {
        return {
          success: true,
          authenticated: true,
          message: 'Creator authenticated successfully',
        };
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid creator secret',
      });
    }),

  // Check if authenticated (for persistent sessions)
  checkAuth: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      return {
        authenticated: input.key === process.env.CREATOR_SECRET_KEY,
      };
    }),

  // Get all users (creator/admin only)
  getAllUsers: creatorProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        tier: z.enum(['free', 'essential', 'premium']).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, tier } = input;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('users')
        .select(
          `
          id, email, name, tier, subscription_status,
          total_reflections, reflection_count_this_month,
          created_at, last_sign_in_at, is_creator, is_admin
        `,
          { count: 'exact' }
        );

      if (tier) {
        query = query.eq('tier', tier);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        });
      }

      return {
        items: data || [],
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }),

  // Get all reflections (creator/admin only)
  getAllReflections: creatorProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, userId } = input;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('reflections')
        .select('*', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections',
        });
      }

      return {
        items: data || [],
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }),

  // Get system stats
  getStats: creatorProcedure.query(async () => {
    // Get user counts by tier
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('tier, subscription_status');

    if (usersError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user stats',
      });
    }

    const userStats = {
      total: users?.length || 0,
      free: users?.filter(u => u.tier === 'free').length || 0,
      essential: users?.filter(u => u.tier === 'essential').length || 0,
      premium: users?.filter(u => u.tier === 'premium').length || 0,
      active: users?.filter(u => u.subscription_status === 'active').length || 0,
    };

    // Get reflection counts
    const { count: totalReflections } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true });

    // Get evolution report counts
    const { count: totalEvolutionReports } = await supabase
      .from('evolution_reports')
      .select('*', { count: 'exact', head: true });

    // Get artifact counts
    const { count: totalArtifacts } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true });

    return {
      users: userStats,
      reflections: {
        total: totalReflections || 0,
      },
      evolutionReports: {
        total: totalEvolutionReports || 0,
      },
      artifacts: {
        total: totalArtifacts || 0,
      },
    };
  }),

  // Get user by email (for admin support)
  getUserByEmail: creatorProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', input.email)
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  // Update user tier manually (creator/admin only)
  updateUserTier: creatorProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        tier: z.enum(['free', 'essential', 'premium']),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, tier } = input;

      const { data, error } = await supabase
        .from('users')
        .update({
          tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user tier',
        });
      }

      return {
        user: data,
        message: `User tier updated to ${tier}`,
      };
    }),

  // Get API usage stats (Iteration 3)
  getApiUsageStats: creatorProcedure
    .input(
      z.object({
        month: z.string().optional(), // Format: YYYY-MM
      })
    )
    .query(async ({ input }) => {
      // Default to current month
      const targetMonth = input.month || new Date().toISOString().slice(0, 7);
      const monthStart = `${targetMonth}-01`;
      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthEnd = nextMonth.toISOString().slice(0, 10);

      // Get all API usage for the month
      const { data: usageLogs, error } = await supabase
        .from('api_usage_log')
        .select('*')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch API usage logs',
        });
      }

      // Calculate totals
      const totalCost = usageLogs?.reduce((sum, log) => sum + parseFloat(String(log.cost_usd || 0)), 0) || 0;
      const totalInputTokens = usageLogs?.reduce((sum, log) => sum + (log.input_tokens || 0), 0) || 0;
      const totalOutputTokens = usageLogs?.reduce((sum, log) => sum + (log.output_tokens || 0), 0) || 0;
      const totalThinkingTokens = usageLogs?.reduce((sum, log) => sum + (log.thinking_tokens || 0), 0) || 0;

      // Group by operation type
      const byOperationType: Record<string, { count: number; cost: number; inputTokens: number; outputTokens: number; thinkingTokens: number }> = {};

      usageLogs?.forEach((log) => {
        const opType = log.operation_type || 'unknown';
        if (!byOperationType[opType]) {
          byOperationType[opType] = {
            count: 0,
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            thinkingTokens: 0,
          };
        }
        byOperationType[opType].count++;
        byOperationType[opType].cost += parseFloat(String(log.cost_usd || 0));
        byOperationType[opType].inputTokens += log.input_tokens || 0;
        byOperationType[opType].outputTokens += log.output_tokens || 0;
        byOperationType[opType].thinkingTokens += log.thinking_tokens || 0;
      });

      return {
        month: targetMonth,
        summary: {
          totalCost,
          totalOperations: usageLogs?.length || 0,
          totalInputTokens,
          totalOutputTokens,
          totalThinkingTokens,
          totalTokens: totalInputTokens + totalOutputTokens + totalThinkingTokens,
        },
        byOperationType,
        recentLogs: usageLogs?.slice(0, 100) || [],
      };
    }),
});

export type AdminRouter = typeof adminRouter;
