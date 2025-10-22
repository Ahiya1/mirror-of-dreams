/**
 * Evolution Reports Router (Iteration 3)
 * Generates AI-powered evolution reports using temporal distribution
 */

import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/server/lib/supabase';
import {
  selectTemporalContext,
  meetsEvolutionThreshold,
  getContextLimit,
  type Reflection,
} from '@/server/lib/temporal-distribution';
import {
  calculateCost,
  getModelIdentifier,
  getThinkingBudget,
} from '@/server/lib/cost-calculator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Input schemas
const generateDreamEvolutionSchema = z.object({
  dreamId: z.string().uuid(),
});

const listEvolutionReportsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  dreamId: z.string().uuid().optional(),
});

const getEvolutionReportSchema = z.object({
  id: z.string().uuid(),
});

export const evolutionRouter = router({
  /**
   * Generate dream-specific evolution report
   * Threshold: >= 4 reflections on a single dream
   */
  generateDreamEvolution: protectedProcedure
    .input(generateDreamEvolutionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userTier = ctx.user.tier as 'free' | 'essential' | 'optimal' | 'premium';

      // 1. Get the dream
      const { data: dream, error: dreamError } = await supabase
        .from('dreams')
        .select('*')
        .eq('id', input.dreamId)
        .eq('user_id', userId)
        .single();

      if (dreamError || !dream) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dream not found',
        });
      }

      // 2. Get all reflections for this dream
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflections')
        .select('*')
        .eq('dream_id', input.dreamId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (reflectionsError || !reflections) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections',
        });
      }

      // 3. Check threshold (>= 4 reflections)
      if (!meetsEvolutionThreshold(reflections.length, 'dream_specific')) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Need at least 4 reflections on this dream to generate an evolution report. Currently have ${reflections.length}.`,
        });
      }

      // 4. Check monthly limit
      const { data: canGenerate, error: limitError } = await supabase
        .rpc('check_evolution_limit', {
          p_user_id: userId,
          p_user_tier: userTier,
          p_report_type: 'dream_specific',
        });

      if (limitError || !canGenerate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Monthly limit for dream evolution reports reached. Upgrade to generate more.',
        });
      }

      // 5. Apply temporal distribution
      const contextLimit = getContextLimit(userTier, 'dream_specific');
      const selectedReflections = selectTemporalContext(
        reflections as Reflection[],
        contextLimit
      );

      // 6. Build context for Claude
      const contextText = selectedReflections
        .map((r, i) => {
          const date = new Date(r.created_at).toLocaleDateString();
          return `
Reflection ${i + 1} (${date}):
Dream: ${r.dream}
Plan: ${r.plan}
Relationship: ${r.relationship}
Offering: ${r.offering}
${r.dream_date ? `Target Date: ${r.dream_date}` : ''}
---`;
        })
        .join('\n\n');

      // 7. Call Claude with extended thinking if Optimal/Premium
      const thinkingBudget = getThinkingBudget(userTier);
      const modelId = getModelIdentifier();

      const prompt = `You are analyzing someone's journey with a specific dream: "${dream.title}".

They have made ${selectedReflections.length} reflections over time (selected from ${reflections.length} total using temporal distribution to show their evolution).

Here are their reflections in chronological order:

${contextText}

Please create a deeply insightful evolution report that:
1. Traces how their relationship with this dream has evolved over time
2. Identifies key turning points, shifts in perspective, or deepening commitment
3. Notes patterns in their planning, obstacles faced, and growth shown
4. Offers wisdom about where they are now and what their journey reveals
5. Provides gentle, empowering guidance for continuing forward

Write as if you're a wise mentor who has witnessed their entire journey. Be specific to their actual words and experiences. Make it personal, not generic.

Length: 800-1200 words. Tone: Warm, insightful, empowering.`;

      const requestConfig: any = {
        model: modelId,
        max_tokens: 4000,
        temperature: 1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // Add extended thinking if available
      if (thinkingBudget > 0) {
        requestConfig.thinking = {
          type: 'enabled',
          budget_tokens: thinkingBudget,
        };
      }

      const response = await anthropic.messages.create(requestConfig);

      // Extract text and thinking
      const contentBlock = response.content.find((block) => block.type === 'text');
      const thinkingBlock = response.content.find((block) => block.type === 'thinking');

      if (!contentBlock || contentBlock.type !== 'text') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No text response from Claude',
        });
      }

      const evolutionText = contentBlock.text;

      // 8. Calculate cost
      const costBreakdown = calculateCost({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        thinkingTokens: thinkingBlock && 'thinking' in thinkingBlock ?
          (response.usage as any).thinking_tokens || 0 : 0,
      });

      // 9. Store evolution report
      const { data: evolutionReport, error: insertError } = await supabase
        .from('evolution_reports')
        .insert({
          user_id: userId,
          dream_id: input.dreamId,
          report_category: 'dream-specific',
          evolution: evolutionText,
          reflections_analyzed: selectedReflections.map((r) => r.id),
          reflection_count: selectedReflections.length,
        })
        .select()
        .single();

      if (insertError || !evolutionReport) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to store evolution report',
        });
      }

      // 10. Log API usage and cost
      await supabase.from('api_usage_log').insert({
        user_id: userId,
        operation_type: 'evolution_dream',
        model_used: modelId,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        thinking_tokens: thinkingBlock && 'thinking' in thinkingBlock ?
          (response.usage as any).thinking_tokens || 0 : 0,
        cost_usd: costBreakdown.totalCost,
        dream_id: input.dreamId,
        metadata: {
          reflections_analyzed: selectedReflections.length,
          total_reflections: reflections.length,
          context_limit: contextLimit,
          thinking_enabled: thinkingBudget > 0,
        },
      });

      // 11. Update usage tracking
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      await supabase.rpc('increment_usage_counter', {
        p_user_id: userId,
        p_month: currentMonth.toISOString().split('T')[0],
        p_counter_name: 'evolution_dream_specific',
      });

      return {
        evolutionId: evolutionReport.id,
        evolution: evolutionText,
        reflectionsAnalyzed: selectedReflections.length,
        totalReflections: reflections.length,
        cost: costBreakdown.totalCost,
      };
    }),

  /**
   * Generate cross-dream evolution report
   * Threshold: >= 12 total reflections across all dreams
   */
  generateCrossDreamEvolution: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      const userTier = ctx.user.tier as 'free' | 'essential' | 'optimal' | 'premium';

      // 1. Check if cross-dream is available for this tier
      if (userTier === 'free') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cross-dream evolution reports are not available on the Free tier. Please upgrade to Essential or higher.',
        });
      }

      // 2. Get all reflections across all dreams
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflections')
        .select('*, dreams!inner(title, category)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (reflectionsError || !reflections) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections',
        });
      }

      // 3. Check threshold (>= 12 total reflections)
      if (!meetsEvolutionThreshold(reflections.length, 'cross_dream')) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Need at least 12 total reflections to generate a cross-dream evolution report. Currently have ${reflections.length}.`,
        });
      }

      // 4. Check monthly limit
      const { data: canGenerate, error: limitError } = await supabase
        .rpc('check_evolution_limit', {
          p_user_id: userId,
          p_user_tier: userTier,
          p_report_type: 'cross_dream',
        });

      if (limitError || !canGenerate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Monthly limit for cross-dream evolution reports reached. Upgrade to generate more.',
        });
      }

      // 5. Apply temporal distribution
      const contextLimit = getContextLimit(userTier, 'cross_dream');
      const selectedReflections = selectTemporalContext(
        reflections as Reflection[],
        contextLimit
      );

      // 6. Build context for Claude (grouped by dream)
      const dreamGroups = new Map<string, any[]>();
      selectedReflections.forEach((r: any) => {
        const dreamId = r.dream_id;
        if (!dreamGroups.has(dreamId)) {
          dreamGroups.set(dreamId, []);
        }
        dreamGroups.get(dreamId)!.push(r);
      });

      const contextText = Array.from(dreamGroups.entries())
        .map(([dreamId, refs]) => {
          const dreamTitle = (refs[0] as any).dreams?.title || 'Unknown Dream';
          const dreamCategory = (refs[0] as any).dreams?.category || 'other';
          const reflectionsText = refs
            .map((r, i) => {
              const date = new Date(r.created_at).toLocaleDateString();
              return `  Reflection ${i + 1} (${date}): ${r.dream.substring(0, 200)}...`;
            })
            .join('\n');

          return `Dream: "${dreamTitle}" (${dreamCategory})\n${reflectionsText}`;
        })
        .join('\n\n---\n\n');

      // 7. Call Claude with extended thinking
      const thinkingBudget = getThinkingBudget(userTier);
      const modelId = getModelIdentifier();

      const prompt = `You are analyzing someone's journey across multiple life dreams. They have made ${selectedReflections.length} reflections across ${dreamGroups.size} different dreams (selected from ${reflections.length} total using temporal distribution).

Here are their reflections organized by dream:

${contextText}

Please create a deeply insightful cross-dream evolution report that:
1. Identifies meta-patterns across all their dreams - how do they interconnect?
2. Traces their overall growth trajectory as a person
3. Notes recurring themes, values, or obstacles across different areas of life
4. Reveals how progress in one dream may influence others
5. Offers wisdom about their unique life journey and direction

Write as if you're a wise mentor seeing the full tapestry of their aspirations. Be specific to their actual journey. Look for the connections they may not see.

Length: 1000-1500 words. Tone: Profound, holistic, empowering.`;

      const requestConfig: any = {
        model: modelId,
        max_tokens: 4000,
        temperature: 1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      if (thinkingBudget > 0) {
        requestConfig.thinking = {
          type: 'enabled',
          budget_tokens: thinkingBudget,
        };
      }

      const response = await anthropic.messages.create(requestConfig);

      const contentBlock = response.content.find((block) => block.type === 'text');
      const thinkingBlock = response.content.find((block) => block.type === 'thinking');

      if (!contentBlock || contentBlock.type !== 'text') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No text response from Claude',
        });
      }

      const evolutionText = contentBlock.text;

      // 8. Calculate cost
      const costBreakdown = calculateCost({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        thinkingTokens: thinkingBlock && 'thinking' in thinkingBlock ?
          (response.usage as any).thinking_tokens || 0 : 0,
      });

      // 9. Store evolution report (dream_id = NULL for cross-dream)
      const { data: evolutionReport, error: insertError } = await supabase
        .from('evolution_reports')
        .insert({
          user_id: userId,
          dream_id: null,
          report_category: 'cross-dream',
          evolution: evolutionText,
          reflections_analyzed: selectedReflections.map((r) => r.id),
          reflection_count: selectedReflections.length,
        })
        .select()
        .single();

      if (insertError || !evolutionReport) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to store evolution report',
        });
      }

      // 10. Log API usage
      await supabase.from('api_usage_log').insert({
        user_id: userId,
        operation_type: 'evolution_cross',
        model_used: modelId,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        thinking_tokens: thinkingBlock && 'thinking' in thinkingBlock ?
          (response.usage as any).thinking_tokens || 0 : 0,
        cost_usd: costBreakdown.totalCost,
        metadata: {
          reflections_analyzed: selectedReflections.length,
          total_reflections: reflections.length,
          dreams_analyzed: dreamGroups.size,
          context_limit: contextLimit,
          thinking_enabled: thinkingBudget > 0,
        },
      });

      // 11. Update usage tracking
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      await supabase.rpc('increment_usage_counter', {
        p_user_id: userId,
        p_month: currentMonth.toISOString().split('T')[0],
        p_counter_name: 'evolution_cross_dream',
      });

      return {
        evolutionId: evolutionReport.id,
        evolution: evolutionText,
        reflectionsAnalyzed: selectedReflections.length,
        totalReflections: reflections.length,
        dreamsAnalyzed: dreamGroups.size,
        cost: costBreakdown.totalCost,
      };
    }),

  /**
   * List user's evolution reports
   */
  list: protectedProcedure
    .input(listEvolutionReportsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      let query = supabase
        .from('evolution_reports')
        .select('*, dreams(title)', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      // Filter by dream if specified
      if (input.dreamId) {
        query = query.eq('dream_id', input.dreamId);
      }

      const { data: reports, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch evolution reports',
        });
      }

      return {
        reports: reports || [],
        page: input.page,
        limit: input.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / input.limit),
      };
    }),

  /**
   * Get specific evolution report
   */
  get: protectedProcedure
    .input(getEvolutionReportSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const { data: report, error } = await supabase
        .from('evolution_reports')
        .select('*, dreams(title, category)')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();

      if (error || !report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Evolution report not found',
        });
      }

      return report;
    }),

  /**
   * Check eligibility for evolution reports (backward compatibility)
   * Note: This is simplified for Iteration 3 - checks if user has any dreams with >= 4 reflections
   */
  checkEligibility: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userTier = ctx.user.tier as 'free' | 'essential' | 'optimal' | 'premium';

    // Free tier has no access
    if (userTier === 'free') {
      return {
        eligible: false,
        reason: 'Upgrade to Essential tier or higher for evolution reports',
        threshold: 0,
        reflectionsSinceLastReport: 0,
      };
    }

    // Get total reflection count
    const { count: totalReflections } = await supabase
      .from('reflections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Check if any dream has >= 4 reflections for dream-specific report
    const { data: dreams } = await supabase
      .from('reflections')
      .select('dream_id')
      .eq('user_id', userId)
      .not('dream_id', 'is', null);

    const dreamReflectionCounts = new Map<string, number>();
    dreams?.forEach((r) => {
      if (r.dream_id) {
        dreamReflectionCounts.set(r.dream_id, (dreamReflectionCounts.get(r.dream_id) || 0) + 1);
      }
    });

    const hasDreamEligible = Array.from(dreamReflectionCounts.values()).some(count => count >= 4);
    const hasCrossDreamEligible = (totalReflections || 0) >= 12;

    const eligible = hasDreamEligible || hasCrossDreamEligible;

    return {
      eligible,
      reason: eligible
        ? 'You can generate an evolution report'
        : 'Create more reflections to unlock evolution reports (need 4 on one dream or 12 total)',
      threshold: 4,
      reflectionsSinceLastReport: totalReflections || 0,
    };
  }),
});
