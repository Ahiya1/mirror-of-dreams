/**
 * Visualizations Router (Iteration 3)
 * Generates AI-powered narrative visualizations of personal growth
 */

import Anthropic from '@anthropic-ai/sdk';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '../middleware';
import { router } from '../trpc';

import { withAIRetry } from '@/lib/utils/retry';
import { calculateCost, getModelIdentifier, getThinkingBudget } from '@/server/lib/cost-calculator';
import { supabase } from '@/server/lib/supabase';
import {
  selectTemporalContext,
  getContextLimit,
  type Reflection,
} from '@/server/lib/temporal-distribution';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Input schemas
const generateVisualizationSchema = z.object({
  dreamId: z.string().uuid().optional(), // null/undefined = cross-dream
  style: z.enum(['achievement', 'spiral', 'synthesis']),
});

const listVisualizationsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  dreamId: z.string().uuid().optional(),
});

const getVisualizationSchema = z.object({
  id: z.string().uuid(),
});

export const visualizationsRouter = router({
  /**
   * Generate narrative visualization
   * Creates a poetic narrative visualization of growth journey
   */
  generate: protectedProcedure
    .input(generateVisualizationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userTier = ctx.user.tier as 'free' | 'pro' | 'unlimited';
      const isDreamSpecific = !!input.dreamId;

      // 1. Check tier eligibility for cross-dream
      if (!isDreamSpecific && userTier === 'free') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cross-dream visualizations require Pro tier or higher',
        });
      }

      // 2. Check monthly limit
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const vizType = isDreamSpecific ? 'dream_specific' : 'cross_dream';
      const { data: canGenerate } = await supabase.rpc('check_visualization_limit', {
        p_user_id: userId,
        p_user_tier: userTier,
        p_viz_type: vizType,
      });

      if (!canGenerate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Monthly visualization limit reached for your ${userTier} tier`,
        });
      }

      // 3. Get reflections based on type
      let reflections: any[];
      let dreamTitle: string | null = null;

      if (isDreamSpecific) {
        // Get dream
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

        dreamTitle = dream.title;

        // Get reflections for this dream
        const { data: dreamReflections, error: reflectionsError } = await supabase
          .from('reflections')
          .select('*')
          .eq('dream_id', input.dreamId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (reflectionsError || !dreamReflections) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch reflections',
          });
        }

        reflections = dreamReflections;

        // Check minimum threshold (4 reflections)
        if (reflections.length < 4) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Need at least 4 reflections for visualization. You have ${reflections.length}.`,
          });
        }
      } else {
        // Cross-dream: Get all reflections
        const { data: allReflections, error: reflectionsError } = await supabase
          .from('reflections')
          .select('*, dreams!inner(title, category)')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (reflectionsError || !allReflections) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch reflections',
          });
        }

        reflections = allReflections;

        // Check minimum threshold (12 reflections)
        if (reflections.length < 12) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Need at least 12 total reflections for cross-dream visualization. You have ${reflections.length}.`,
          });
        }
      }

      // 4. Apply temporal distribution
      const contextLimit = getContextLimit(
        userTier,
        isDreamSpecific ? 'dream_specific' : 'cross_dream'
      );
      const selectedReflections = selectTemporalContext(reflections as Reflection[], contextLimit);

      // 5. Build visualization prompt
      const prompt = buildVisualizationPrompt(
        selectedReflections,
        input.style,
        isDreamSpecific,
        dreamTitle
      );

      // 6. Generate visualization with Claude
      const modelId = getModelIdentifier();
      const thinkingBudget = getThinkingBudget(userTier);

      const requestConfig: any = {
        model: modelId,
        max_tokens: 3000,
        temperature: 1,
        messages: [{ role: 'user', content: prompt }],
      };

      if (thinkingBudget > 0) {
        requestConfig.thinking = {
          type: 'enabled' as const,
          budget_tokens: thinkingBudget,
        };
      }

      let response;
      try {
        response = await withAIRetry(() => anthropic.messages.create(requestConfig), {
          operation: 'visualizations.generate',
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate visualization. Please try again.',
        });
      }

      // Extract narrative text
      const narrativeBlock = response.content.find((block) => block.type === 'text');
      const narrative = narrativeBlock && narrativeBlock.type === 'text' ? narrativeBlock.text : '';

      if (!narrative) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate visualization narrative',
        });
      }

      // Extract thinking tokens if present
      const thinkingBlock = response.content.find((block: any) => block.type === 'thinking');
      const thinkingTokens =
        thinkingBlock && 'thinking' in thinkingBlock ? thinkingBlock.thinking?.length || 0 : 0;

      // 7. Calculate cost
      const costBreakdown = calculateCost({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        thinkingTokens,
      });

      // 8. Store visualization
      const { data: visualization, error: vizError } = await supabase
        .from('visualizations')
        .insert({
          user_id: userId,
          dream_id: input.dreamId || null,
          style: input.style,
          narrative,
          reflections_analyzed: selectedReflections.map((r) => r.id),
          reflection_count: selectedReflections.length,
        })
        .select()
        .single();

      if (vizError || !visualization) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save visualization',
        });
      }

      // 9. Log API usage
      await supabase.from('api_usage_log').insert({
        user_id: userId,
        operation_type: 'visualization',
        model_used: modelId,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        thinking_tokens: thinkingTokens,
        cost_usd: costBreakdown.totalCost,
        dream_id: input.dreamId || null,
        metadata: {
          style: input.style,
          reflection_count: selectedReflections.length,
          context_limit: contextLimit,
        },
      });

      // 10. Update usage tracking
      const counterName = isDreamSpecific
        ? 'visualizations_dream_specific'
        : 'visualizations_cross_dream';
      await supabase.rpc('increment_usage_counter', {
        p_user_id: userId,
        p_month: currentMonth.toISOString().split('T')[0],
        p_counter_name: counterName,
      });

      return {
        visualization,
        message: 'Visualization generated successfully',
        cost: costBreakdown,
      };
    }),

  /**
   * List user's visualizations
   */
  list: protectedProcedure.input(listVisualizationsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { page, limit, dreamId } = input;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('visualizations')
      .select('*, dreams(title)', { count: 'exact' })
      .eq('user_id', userId);

    if (dreamId) {
      query = query.eq('dream_id', dreamId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch visualizations',
      });
    }

    return {
      items: data || [],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit,
    };
  }),

  /**
   * Get specific visualization
   */
  get: protectedProcedure.input(getVisualizationSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const { data: visualization, error } = await supabase
      .from('visualizations')
      .select('*, dreams(title, category)')
      .eq('id', input.id)
      .eq('user_id', userId)
      .single();

    if (error || !visualization) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Visualization not found',
      });
    }

    return visualization;
  }),
});

/**
 * Build visualization prompt based on style
 */
function buildVisualizationPrompt(
  reflections: any[],
  style: 'achievement' | 'spiral' | 'synthesis',
  isDreamSpecific: boolean,
  dreamTitle: string | null
): string {
  const styleInstructions = {
    achievement: `Create a LINEAR JOURNEY VISUALIZATION that shows progress like climbing steps or waypoints on a path.
Structure: Journey metaphor (path, river, ascent)
- Early reflections = Starting point/foundation
- Middle reflections = Challenges overcome/milestones
- Recent reflections = Current vantage point/achievements

Focus on forward momentum and concrete progress.`,

    spiral: `Create a GROWTH SPIRAL VISUALIZATION that shows deepening understanding in circular patterns.
Structure: Spiral/cyclical metaphor (seasons, orbit, helix)
- Show how themes return but at deeper levels
- Early reflections = First circle/outer ring
- Middle reflections = Tightening spiral/deepening
- Recent reflections = Inner core/center of understanding

Focus on recurring patterns and evolving depth.`,

    synthesis: `Create a SYNTHESIS MAP VISUALIZATION that shows interconnected insights like a constellation or web.
Structure: Network metaphor (stars, web, ecosystem)
- Each reflection cluster = A node/constellation
- Connections between themes = Lines/pathways
- Early + Middle + Recent = Different regions of the map

Focus on relationships between ideas and emergent patterns.`,
  };

  const reflectionSummaries = reflections
    .map((r, i) => {
      const period =
        i < reflections.length / 3
          ? 'EARLY'
          : i < (reflections.length * 2) / 3
            ? 'MIDDLE'
            : 'RECENT';
      return `[${period}] ${new Date(r.created_at).toLocaleDateString()}
Dream: ${r.dream || 'N/A'}
Relationship: ${r.relationship}
Offering: ${r.offering}`;
    })
    .join('\n\n');

  const context = isDreamSpecific
    ? `DREAM-SPECIFIC VISUALIZATION\nDream: "${dreamTitle}"\nReflections: ${reflections.length} on this specific dream`
    : `CROSS-DREAM VISUALIZATION\nReflections: ${reflections.length} across multiple dreams`;

  return `You are creating a poetic narrative visualization of personal growth and transformation.

${context}

VISUALIZATION STYLE: ${style.toUpperCase()}
${styleInstructions[style]}

REFLECTIONS TO VISUALIZE:
${reflectionSummaries}

Create a rich, evocative narrative (400-600 words) that:
1. Uses the ${style} metaphor consistently throughout
2. Weaves together insights from EARLY, MIDDLE, and RECENT periods
3. Shows transformation and evolution over time
4. Maintains a tone of wonder and recognition
5. Is beautiful to read and meaningful to the user

Write the visualization now:`;
}

export type VisualizationsRouter = typeof visualizationsRouter;
