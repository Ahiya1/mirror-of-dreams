// server/trpc/routers/reflection.ts - AI reflection generation router

import Anthropic from '@anthropic-ai/sdk';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { usageLimitedProcedure } from '../middleware';
import { router } from '../trpc';

import { withAIRetry } from '@/lib/utils/retry';
import { cacheDelete, cacheKeys } from '@/server/lib/cache';
import { aiLogger, dbLogger } from '@/server/lib/logger';
import { loadPrompts, buildReflectionUserPrompt } from '@/server/lib/prompts';
import { supabase } from '@/server/lib/supabase';
import { createReflectionSchema } from '@/types/schemas';

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

// Evolution report thresholds
const EVOLUTION_THRESHOLDS = {
  pro: 4,
  unlimited: 6,
};

export const reflectionRouter = router({
  // Generate AI reflection
  create: usageLimitedProcedure.input(createReflectionSchema).mutation(async ({ ctx, input }) => {
    const {
      dreamId,
      dream,
      plan,
      relationship,
      offering,
      tone = 'fusion',
      isPremium: requestedPremium = false,
    } = input;

    // Get the dream title from linked dream if dreamId provided, otherwise use first 100 chars of dream answer
    let reflectionTitle = dream.slice(0, 100);
    if (dreamId) {
      const { data: linkedDream } = await supabase
        .from('dreams')
        .select('title')
        .eq('id', dreamId)
        .single();

      if (linkedDream?.title) {
        reflectionTitle = linkedDream.title;
      }
    }

    // Determine if premium features should be used (extended thinking for unlimited tier)
    const shouldUsePremium =
      requestedPremium || ctx.user.tier === 'unlimited' || ctx.user.isCreator;

    // Get current date for date awareness
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Load system prompt
    const systemPrompt = await loadPrompts(tone, shouldUsePremium, ctx.user.isCreator);

    // Add date awareness to system prompt
    const systemPromptWithDate =
      systemPrompt +
      `\n\nCURRENT DATE AWARENESS:\nToday's date is ${currentDate}. Be aware of this when reflecting on their plans, timing, and relationship with their dreams. Consider seasonal context, time of year, and how timing relates to their consciousness journey.`;

    // Build user prompt (4-question format)
    const userName = ctx.user.name || 'Friend';
    const intro = userName ? `My name is ${userName}.\n\n` : '';

    const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, in a flowing reflection I can return to months from now.`;

    // Call Claude API (using Sonnet 4.5)
    const requestConfig: Anthropic.MessageCreateParams = {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 1,
      max_tokens: shouldUsePremium ? 6000 : 4000,
      system: systemPromptWithDate,
      messages: [{ role: 'user', content: userPrompt }],
    };

    if (shouldUsePremium) {
      requestConfig.thinking = {
        type: 'enabled' as const,
        budget_tokens: 5000,
      };
    }

    let aiResponse: string;
    try {
      const client = getAnthropicClient();
      const response = await withAIRetry(() => client.messages.create(requestConfig), {
        operation: 'reflection.create',
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      aiResponse = textBlock.text;
    } catch (error: unknown) {
      aiLogger.error(
        { err: error, operation: 'reflection.create', userId: ctx.user.id },
        'Claude API error'
      );
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to generate reflection: ${message}`,
      });
    }

    // Calculate word count and estimated read time
    const wordCount = aiResponse.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Store reflection in database (raw markdown - client handles rendering)
    const { data: reflectionRecord, error: reflectionError } = await supabase
      .from('reflections')
      .insert({
        user_id: ctx.user.id,
        dream_id: dreamId, // Link to dream
        dream,
        plan,
        relationship,
        offering,
        ai_response: aiResponse, // Store raw markdown, client renders with proper styling
        tone,
        is_premium: shouldUsePremium,
        word_count: wordCount,
        estimated_read_time: estimatedReadTime,
        title: reflectionTitle, // Use dream name if linked, otherwise first 100 chars of dream answer
        tags: [],
      })
      .select()
      .single();

    if (reflectionError) {
      dbLogger.error(
        { err: reflectionError, operation: 'reflection.save', userId: ctx.user.id, dreamId },
        'Database error saving reflection'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save reflection',
      });
    }

    // Update user usage counters (both daily and monthly)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reflection_count_this_month: ctx.user.reflectionCountThisMonth + 1,
        reflections_today:
          ctx.user.lastReflectionDate === today ? ctx.user.reflectionsToday + 1 : 1,
        last_reflection_date: today,
        total_reflections: ctx.user.totalReflections + 1,
        last_reflection_at: new Date().toISOString(),
      })
      .eq('id', ctx.user.id);

    // Invalidate reflections cache after successful create
    await cacheDelete(cacheKeys.reflections(ctx.user.id));

    // Check if evolution report should be triggered
    const shouldTriggerEvolution = await checkEvolutionEligibility(ctx.user.id, ctx.user.tier);

    return {
      reflection: aiResponse,
      reflectionId: reflectionRecord.id,
      isPremium: shouldUsePremium,
      shouldTriggerEvolution,
      wordCount,
      estimatedReadTime,
      message: 'Reflection generated successfully',
    };
  }),
});

// Helper: Check evolution report eligibility
async function checkEvolutionEligibility(userId: string, tier: string): Promise<boolean> {
  if (tier === 'free') return false;

  const threshold = EVOLUTION_THRESHOLDS[tier as 'pro' | 'unlimited'] || 6;

  // Get last evolution report
  const { data: lastReport } = await supabase
    .from('evolution_reports')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Count reflections since last report
  let query = supabase
    .from('reflections')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (lastReport) {
    query = query.gt('created_at', lastReport.created_at);
  }

  const { count } = await query;

  return (count || 0) >= threshold;
}

export type ReflectionRouter = typeof reflectionRouter;
