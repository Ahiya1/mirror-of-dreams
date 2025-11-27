// server/trpc/routers/reflection.ts - AI reflection generation router

import { z } from 'zod';
import { router } from '../trpc';
import { usageLimitedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { createReflectionSchema } from '@/types/schemas';
import { loadPrompts, buildReflectionUserPrompt } from '@/server/lib/prompts';
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

// Evolution report thresholds
const EVOLUTION_THRESHOLDS = {
  essential: 4,
  premium: 6,
};

export const reflectionRouter = router({
  // Generate AI reflection
  create: usageLimitedProcedure
    .input(createReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      console.log('🔍 Reflection.create called');
      console.log('📥 Input received:', JSON.stringify(input, null, 2));
      console.log('👤 User:', ctx.user.email, 'Tier:', ctx.user.tier);

      const {
        dreamId,
        dream,
        plan,
        relationship,
        offering,
        tone = 'fusion',
        isPremium: requestedPremium = false,
      } = input;

      // Determine if premium features should be used
      const shouldUsePremium =
        requestedPremium || ctx.user.tier === 'premium' || ctx.user.isCreator;

      // Get current date for date awareness
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Load system prompt
      const systemPrompt = await loadPrompts(
        tone,
        shouldUsePremium,
        ctx.user.isCreator
      );

      // Add date awareness to system prompt
      const systemPromptWithDate = systemPrompt + `\n\nCURRENT DATE AWARENESS:\nToday's date is ${currentDate}. Be aware of this when reflecting on their plans, timing, and relationship with their dreams. Consider seasonal context, time of year, and how timing relates to their consciousness journey.`;

      // Build user prompt (4-question format)
      const userName = ctx.user.name || 'Friend';
      const intro = userName ? `My name is ${userName}.\n\n` : '';

      const userPrompt = `${intro}**My dream:** ${dream}

**My plan:** ${plan}

**My relationship with this dream:** ${relationship}

**What I'm willing to give:** ${offering}

Please mirror back what you see, in a flowing reflection I can return to months from now.`;

      console.log('🤖 Calling Anthropic API...');
      console.log('📝 Prompt length:', userPrompt.length, 'characters');

      // Call Claude API (using Sonnet 4.5)
      const requestConfig: any = {
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
        const response = await client.messages.create(requestConfig);

        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text response from Claude');
        }

        aiResponse = textBlock.text;
        console.log('✅ AI response generated:', aiResponse.length, 'characters');
      } catch (error: any) {
        console.error('❌ Claude API error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate reflection: ${error.message}`,
        });
      }

      // Format as sacred HTML
      const formattedReflection = toSacredHTML(aiResponse);

      // Calculate word count and estimated read time
      const wordCount = aiResponse.split(/\s+/).length;
      const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

      // Store reflection in database
      console.log('💾 Saving to database...');
      const { data: reflectionRecord, error: reflectionError } = await supabase
        .from('reflections')
        .insert({
          user_id: ctx.user.id,
          dream_id: dreamId, // Link to dream
          dream,
          plan,
          relationship,
          offering,
          ai_response: formattedReflection,
          tone,
          is_premium: shouldUsePremium,
          word_count: wordCount,
          estimated_read_time: estimatedReadTime,
          title: dream.slice(0, 100), // First 100 chars of dream as title
          tags: [],
        })
        .select()
        .single();

      if (reflectionError) {
        console.error('❌ Database error:', reflectionError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save reflection',
        });
      }

      console.log('✅ Reflection created:', reflectionRecord.id);

      // Update user usage counters
      const { error: updateError } = await supabase
        .from('users')
        .update({
          reflection_count_this_month: ctx.user.reflectionCountThisMonth + 1,
          total_reflections: ctx.user.totalReflections + 1,
          last_reflection_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      if (updateError) {
        console.error('Failed to update user usage:', updateError);
      }

      // Check if evolution report should be triggered
      const shouldTriggerEvolution = await checkEvolutionEligibility(ctx.user.id, ctx.user.tier);

      console.log(
        `✨ Reflection created: ${ctx.user.email} (${
          shouldUsePremium ? 'Premium' : 'Standard'
        }) - ID: ${reflectionRecord.id} - Tone: ${tone}`
      );

      return {
        reflection: formattedReflection,
        reflectionId: reflectionRecord.id,
        isPremium: shouldUsePremium,
        shouldTriggerEvolution,
        wordCount,
        estimatedReadTime,
        message: 'Reflection generated successfully',
      };
    }),
});

// Helper: Format markdown to sacred HTML
function toSacredHTML(md: string): string {
  const wrap =
    "font-family:'Inter',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;";
  const pStyle = 'margin:0 0 1.4rem 0;';
  const strong = 'font-weight:600;color:#16213e;';
  const em = 'font-style:italic;color:#444;';

  const html = md
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((p) => {
      let h = p.replace(/\r?\n/g, '<br>');
      h = h.replace(/\*\*(.*?)\*\*/g, (_, t) => `<span style="${strong}">${t}</span>`);
      h = h.replace(/\*(.*?)\*/g, (_, t) => `<span style="${em}">${t}</span>`);
      return `<p style="${pStyle}">${h}</p>`;
    })
    .join('');

  return `<div class="mirror-reflection" style="${wrap}">${html}</div>`;
}

// Helper: Check evolution report eligibility
async function checkEvolutionEligibility(
  userId: string,
  tier: string
): Promise<boolean> {
  if (tier === 'free') return false;

  const threshold = EVOLUTION_THRESHOLDS[tier as 'essential' | 'premium'] || 6;

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
