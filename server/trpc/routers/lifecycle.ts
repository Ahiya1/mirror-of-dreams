// server/trpc/routers/lifecycle.ts - Dream Lifecycle: Evolution, Ceremony, Ritual

import * as fs from 'fs';
import * as path from 'path';

import Anthropic from '@anthropic-ai/sdk';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '../middleware';
import { router } from '../trpc';

import { withAIRetry } from '@/lib/utils/retry';
import { aiLogger, dbLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// =====================================================
// ANTHROPIC CLIENT (Lazy initialization)
// =====================================================

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

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const evolveSchema = z.object({
  dreamId: z.string().uuid(),
  newTitle: z.string().min(1).max(200),
  newDescription: z.string().max(2000).optional(),
  newTargetDate: z.string().nullable().optional(),
  newCategory: z
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
  evolutionReflection: z.string().min(10).max(2000),
});

const achieveSchema = z.object({
  dreamId: z.string().uuid(),
  personalNote: z.string().max(2000).optional(),
});

const releaseSchema = z.object({
  dreamId: z.string().uuid(),
  whatILearned: z.string().min(10).max(2000),
  whatImGratefulFor: z.string().min(10).max(2000),
  whatIRelease: z.string().min(10).max(2000),
  finalMessage: z.string().max(2000).optional(),
  reason: z
    .enum([
      'evolved_beyond',
      'no_longer_resonates',
      'completed_differently',
      'circumstances_changed',
      'other',
    ])
    .optional(),
});

const dreamIdSchema = z.object({
  dreamId: z.string().uuid(),
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function loadCeremonyPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), 'prompts', 'ceremony_synthesis.txt');
  return fs.readFileSync(promptPath, 'utf-8');
}

function toSacredHTML(md: string): string {
  const wrap = "font-family:'Inter',sans-serif;font-size:1.05rem;line-height:1.7;color:#333;";
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

// =====================================================
// ROUTER DEFINITION
// =====================================================

export const lifecycleRouter = router({
  // =====================================================
  // EVOLUTION: Transform dream in-place
  // =====================================================
  evolve: protectedProcedure.input(evolveSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId, newTitle, newDescription, newTargetDate, newCategory, evolutionReflection } =
      input;

    // 1. Fetch current dream state
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

    // 2. Only active dreams can be evolved
    if (dream.status !== 'active') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be evolved',
      });
    }

    // 3. Create evolution event (captures before/after)
    const { data: evolutionEvent, error: evolutionError } = await supabase
      .from('evolution_events')
      .insert({
        user_id: userId,
        dream_id: dreamId,
        old_title: dream.title,
        old_description: dream.description,
        old_target_date: dream.target_date,
        old_category: dream.category,
        new_title: newTitle,
        new_description: newDescription || null,
        new_target_date: newTargetDate || null,
        new_category: newCategory || dream.category,
        evolution_reflection: evolutionReflection,
      })
      .select()
      .single();

    if (evolutionError) {
      dbLogger.error(
        { err: evolutionError, operation: 'lifecycle.evolve', userId, dreamId },
        'Failed to create evolution event'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record evolution',
      });
    }

    // 4. Update dream with new values (trigger auto-increments evolution_count)
    const { data: updatedDream, error: updateError } = await supabase
      .from('dreams')
      .update({
        title: newTitle,
        description: newDescription || null,
        target_date: newTargetDate || null,
        category: newCategory || dream.category,
      })
      .eq('id', dreamId)
      .select()
      .single();

    if (updateError) {
      dbLogger.error(
        { err: updateError, operation: 'lifecycle.evolve.update', userId, dreamId },
        'Failed to update dream'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dream',
      });
    }

    return {
      evolutionEvent,
      dream: updatedDream,
      message: 'Dream evolved successfully',
    };
  }),

  // =====================================================
  // GET EVOLUTION HISTORY: Timeline of dream transformations
  // =====================================================
  getEvolutionHistory: protectedProcedure.input(dreamIdSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId } = input;

    // Verify dream ownership
    const { data: dream, error: dreamError } = await supabase
      .from('dreams')
      .select('id, title')
      .eq('id', dreamId)
      .eq('user_id', userId)
      .single();

    if (dreamError || !dream) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dream not found',
      });
    }

    // Fetch all evolution events
    const { data: events, error: eventsError } = await supabase
      .from('evolution_events')
      .select('*')
      .eq('dream_id', dreamId)
      .order('created_at', { ascending: true });

    if (eventsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch evolution history',
      });
    }

    return {
      dreamId,
      dreamTitle: dream.title,
      events: events || [],
      evolutionCount: events?.length || 0,
    };
  }),

  // =====================================================
  // ACHIEVE: Create achievement ceremony and mark dream achieved
  // =====================================================
  achieve: protectedProcedure.input(achieveSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId, personalNote } = input;

    // 1. Fetch dream
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

    // 2. Only active dreams can be achieved
    if (dream.status !== 'active') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be marked as achieved',
      });
    }

    // 3. Check if ceremony already exists
    const { data: existingCeremony } = await supabase
      .from('achievement_ceremonies')
      .select('id')
      .eq('dream_id', dreamId)
      .single();

    if (existingCeremony) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Achievement ceremony already exists for this dream',
      });
    }

    // 4. Fetch reflections for this dream
    const { data: reflections, error: reflectionsError } = await supabase
      .from('reflections')
      .select('id, dream, plan, relationship, offering, ai_response, created_at')
      .eq('dream_id', dreamId)
      .order('created_at', { ascending: true });

    const reflectionCount = reflections?.length || 0;
    const reflectionIds = reflections?.map((r) => r.id) || [];

    // 5. Generate AI synthesis if we have reflections
    let whoYouWere: string | null = null;
    let whoYouBecame: string | null = null;
    let journeySynthesis: string | null = null;

    if (reflectionCount > 0) {
      try {
        const client = getAnthropicClient();
        const systemPrompt = await loadCeremonyPrompt();

        // Build context from reflections
        const reflectionContext = reflections!
          .map((r, i) => {
            const date = new Date(r.created_at).toLocaleDateString();
            return `**Reflection ${i + 1} (${date}):**
Dream: ${r.dream}
Plan: ${r.plan}
Relationship: ${r.relationship}
Offering: ${r.offering}`;
          })
          .join('\n\n---\n\n');

        const userPrompt = `The dream "${dream.title}" has been achieved.

Dream Description: ${dream.description || 'No description provided.'}

Here are the reflections from this journey (oldest to newest):

${reflectionContext}

Please generate:
1. WHO_YOU_WERE: A paragraph about who they were when they started this dream journey
2. WHO_YOU_BECAME: A paragraph about who they became through achieving this dream
3. JOURNEY_SYNTHESIS: A flowing narrative synthesizing the key moments, struggles, and breakthroughs

Format your response exactly like this:
---WHO_YOU_WERE---
[your paragraph here]
---WHO_YOU_BECAME---
[your paragraph here]
---JOURNEY_SYNTHESIS---
[your narrative here]`;

        const response = await withAIRetry(
          () =>
            client.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 3000,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          { operation: 'lifecycle.achieve' }
        );

        const textBlock = response.content.find((block) => block.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          const text = textBlock.text;

          // Parse the response
          const whoYouWereMatch = text.match(
            /---WHO_YOU_WERE---\n([\s\S]*?)(?=---WHO_YOU_BECAME---|$)/
          );
          const whoYouBecameMatch = text.match(
            /---WHO_YOU_BECAME---\n([\s\S]*?)(?=---JOURNEY_SYNTHESIS---|$)/
          );
          const journeySynthesisMatch = text.match(/---JOURNEY_SYNTHESIS---\n([\s\S]*?)$/);

          whoYouWere = whoYouWereMatch ? toSacredHTML(whoYouWereMatch[1].trim()) : null;
          whoYouBecame = whoYouBecameMatch ? toSacredHTML(whoYouBecameMatch[1].trim()) : null;
          journeySynthesis = journeySynthesisMatch
            ? toSacredHTML(journeySynthesisMatch[1].trim())
            : null;
        }
      } catch (aiError) {
        aiLogger.error(
          { err: aiError, operation: 'lifecycle.achieve.synthesis', userId, dreamId },
          'Failed to generate ceremony synthesis'
        );
        // Continue without AI synthesis - ceremony still gets created
      }
    }

    // 6. Create ceremony record
    const { data: ceremony, error: ceremonyError } = await supabase
      .from('achievement_ceremonies')
      .insert({
        user_id: userId,
        dream_id: dreamId,
        dream_title: dream.title,
        dream_description: dream.description,
        dream_category: dream.category,
        who_you_were: whoYouWere,
        who_you_became: whoYouBecame,
        journey_synthesis: journeySynthesis,
        personal_note: personalNote || null,
        reflections_analyzed: reflectionIds,
        reflection_count: reflectionCount,
      })
      .select()
      .single();

    if (ceremonyError) {
      dbLogger.error(
        { err: ceremonyError, operation: 'lifecycle.achieve.ceremony', userId, dreamId },
        'Failed to create ceremony'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create achievement ceremony',
      });
    }

    // 7. Update dream status to achieved
    const { error: statusError } = await supabase
      .from('dreams')
      .update({
        status: 'achieved',
        achieved_at: new Date().toISOString(),
        has_ceremony: true,
      })
      .eq('id', dreamId);

    if (statusError) {
      dbLogger.error(
        { err: statusError, operation: 'lifecycle.achieve.status', userId, dreamId },
        'Failed to update dream status'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dream status',
      });
    }

    return {
      ceremonyId: ceremony.id,
      ceremony,
      hasSynthesis: !!journeySynthesis,
      reflectionCount,
      message: 'Achievement ceremony created successfully',
    };
  }),

  // =====================================================
  // GET CEREMONY: Retrieve achievement ceremony for a dream
  // =====================================================
  getCeremony: protectedProcedure.input(dreamIdSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId } = input;

    const { data: ceremony, error } = await supabase
      .from('achievement_ceremonies')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (error || !ceremony) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Ceremony not found',
      });
    }

    return ceremony;
  }),

  // =====================================================
  // UPDATE CEREMONY: Add or update personal note
  // =====================================================
  updateCeremonyNote: protectedProcedure
    .input(
      z.object({
        dreamId: z.string().uuid(),
        personalNote: z.string().max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { dreamId, personalNote } = input;

      const { data: ceremony, error } = await supabase
        .from('achievement_ceremonies')
        .update({ personal_note: personalNote })
        .eq('dream_id', dreamId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update ceremony note',
        });
      }

      return ceremony;
    }),

  // =====================================================
  // RELEASE: Create release ritual and mark dream released
  // =====================================================
  release: protectedProcedure.input(releaseSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId, whatILearned, whatImGratefulFor, whatIRelease, finalMessage, reason } = input;

    // 1. Fetch dream
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

    // 2. Only active dreams can be released
    if (dream.status !== 'active') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only active dreams can be released',
      });
    }

    // 3. Check if ritual already exists
    const { data: existingRitual } = await supabase
      .from('release_rituals')
      .select('id')
      .eq('dream_id', dreamId)
      .single();

    if (existingRitual) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Release ritual already exists for this dream',
      });
    }

    // 4. Get reflection count
    const { count: reflectionCount } = await supabase
      .from('reflections')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dreamId);

    // 5. Create ritual record
    const { data: ritual, error: ritualError } = await supabase
      .from('release_rituals')
      .insert({
        user_id: userId,
        dream_id: dreamId,
        dream_title: dream.title,
        dream_description: dream.description,
        dream_category: dream.category,
        what_i_learned: whatILearned,
        what_im_grateful_for: whatImGratefulFor,
        what_i_release: whatIRelease,
        final_message: finalMessage || null,
        reason: reason || null,
        reflection_count: reflectionCount || 0,
      })
      .select()
      .single();

    if (ritualError) {
      dbLogger.error(
        { err: ritualError, operation: 'lifecycle.release.ritual', userId, dreamId },
        'Failed to create ritual'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create release ritual',
      });
    }

    // 6. Update dream status to released
    const { error: statusError } = await supabase
      .from('dreams')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        has_ritual: true,
      })
      .eq('id', dreamId);

    if (statusError) {
      dbLogger.error(
        { err: statusError, operation: 'lifecycle.release.status', userId, dreamId },
        'Failed to update dream status'
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dream status',
      });
    }

    return {
      ritualId: ritual.id,
      ritual,
      message: 'Release ritual completed successfully',
    };
  }),

  // =====================================================
  // GET RITUAL: Retrieve release ritual for a dream
  // =====================================================
  getRitual: protectedProcedure.input(dreamIdSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { dreamId } = input;

    const { data: ritual, error } = await supabase
      .from('release_rituals')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (error || !ritual) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Ritual not found',
      });
    }

    return ritual;
  }),
});

export type LifecycleRouter = typeof lifecycleRouter;
