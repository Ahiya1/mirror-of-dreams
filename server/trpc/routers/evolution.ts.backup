// server/trpc/routers/evolution.ts - Evolution report generation and history

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { evolutionReportInputSchema } from '@/types/schemas';
import { loadEvolutionPrompt } from '@/server/lib/prompts';
import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization - client created only when procedure called
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// Evolution report thresholds - every N reflections
const REPORT_THRESHOLDS = {
  essential: 4, // Every 4 reflections
  premium: 6,   // Every 6 reflections
};

export const evolutionRouter = router({
  // Generate evolution report
  generate: protectedProcedure
    .input(evolutionReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { reportType = 'deep-pattern' } = input;

      // Check tier eligibility
      if (ctx.user.tier === 'free') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Evolution reports are available for Essential and Premium tiers only',
        });
      }

      // Get reflection count since last evolution report
      const { data: lastReport } = await supabase
        .from('evolution_reports')
        .select('created_at, reflections_analyzed')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get reflections for analysis
      let query = supabase
        .from('reflections')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: true });

      if (lastReport) {
        query = query.gt('created_at', lastReport.created_at);
      }

      const { data: reflections, error: reflectionsError } = await query;

      if (reflectionsError || !reflections) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections for analysis',
        });
      }

      // Check if enough reflections exist
      const threshold = REPORT_THRESHOLDS[ctx.user.tier as 'essential' | 'premium'] || 6;
      if (reflections.length < threshold && !ctx.user.isCreator) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Need at least ${threshold} reflections since last report. You have ${reflections.length}.`,
        });
      }

      // Build evolution prompt
      const systemPrompt = await loadEvolutionPrompt(ctx.user.tier === 'premium');

      // Build user prompt with reflection data
      const userPrompt = buildEvolutionPrompt(reflections, reportType);

      // Generate evolution report with Claude
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: ctx.user.tier === 'premium' ? 6000 : 4000,
        temperature: 1,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        ...(ctx.user.tier === 'premium' && {
          thinking: {
            type: 'enabled' as const,
            budget_tokens: 5000,
          },
        }),
      });

      const reportContent = response.content[0].type === 'text' ? response.content[0].text : '';

      // Store evolution report
      const { data: evolutionReport, error: reportError } = await supabase
        .from('evolution_reports')
        .insert({
          user_id: ctx.user.id,
          report_content: reportContent,
          report_type: reportType,
          reflections_analyzed: reflections.length,
          reflection_ids: reflections.map(r => r.id),
          analysis_period_start: reflections[0].created_at,
          analysis_period_end: reflections[reflections.length - 1].created_at,
        })
        .select()
        .single();

      if (reportError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save evolution report',
        });
      }

      return {
        report: evolutionReport,
        message: 'Evolution report generated successfully',
      };
    }),

  // Get evolution reports list
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('evolution_reports')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch evolution reports',
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

  // Get single evolution report by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('evolution_reports')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Evolution report not found',
        });
      }

      return data;
    }),

  // Check eligibility for next evolution report
  checkEligibility: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.tier === 'free') {
      return {
        eligible: false,
        reason: 'Evolution reports require Essential or Premium tier',
        threshold: 0,
        reflectionsSinceLastReport: 0,
      };
    }

    // Get last report
    const { data: lastReport } = await supabase
      .from('evolution_reports')
      .select('created_at')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count reflections since last report
    let query = supabase
      .from('reflections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id);

    if (lastReport) {
      query = query.gt('created_at', lastReport.created_at);
    }

    const { count } = await query;
    const reflectionsSinceLastReport = count || 0;
    const threshold = REPORT_THRESHOLDS[ctx.user.tier as 'essential' | 'premium'] || 6;

    return {
      eligible: reflectionsSinceLastReport >= threshold || ctx.user.isCreator,
      reason: reflectionsSinceLastReport < threshold
        ? `Need ${threshold - reflectionsSinceLastReport} more reflections`
        : 'Ready to generate evolution report',
      threshold,
      reflectionsSinceLastReport,
    };
  }),
});

// Helper function to build evolution user prompt
function buildEvolutionPrompt(reflections: any[], reportType: string): string {
  const reflectionSummaries = reflections.map((r, i) => `
REFLECTION ${i + 1} (${new Date(r.created_at).toLocaleDateString()}):
Dream: ${r.dream}
Plan: ${r.plan}
Relationship: ${r.relationship}
Offering: ${r.offering}
Tone: ${r.tone}
AI Response: ${r.ai_response}
  `).join('\n---\n');

  return `
EVOLUTION REPORT REQUEST

Report Type: ${reportType}
Number of Reflections: ${reflections.length}

REFLECTIONS TO ANALYZE:
${reflectionSummaries}

Please analyze the evolution of consciousness, patterns, and growth across these reflections. Recognize how their relationship with their dreams has deepened, what recurring themes emerge, and how their self-understanding has evolved.
  `.trim();
}

export type EvolutionRouter = typeof evolutionRouter;
