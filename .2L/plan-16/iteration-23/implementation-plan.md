# Implementation Plan: Iteration 23 - Dream Lifecycle Completion

## Executive Summary

This iteration implements three major features that transform dream status changes from simple toggles into meaningful ceremonies and rituals:

1. **Dream Evolution** - In-place dream transformation with history tracking
2. **Achievement Ceremony** - AI-generated journey synthesis when marking a dream as achieved
3. **Release Ritual** - 4-step guided gratitude flow when releasing a dream

**Key Design Decisions:**
- Evolution events are NOT rate-limited (simple database writes, no AI involved)
- Ceremony synthesis requires 1+ reflection (gracefully handles 0 reflections)
- Release ritual is user-written only (no AI blessing in this iteration for simplicity)
- Archive status remains a simple toggle (not part of this iteration)

---

## File Implementation Order

### Phase 1: Database Migration

**File:** `supabase/migrations/20251209000000_dream_lifecycle_completion.sql`

### Phase 2: Backend (tRPC Router)

**File:** `server/trpc/routers/lifecycle.ts` (NEW)
**File:** `server/trpc/routers/_app.ts` (UPDATE)

### Phase 3: Prompts

**File:** `prompts/ceremony_synthesis.txt` (NEW)

### Phase 4: Frontend Components

**File:** `components/dreams/EvolutionModal.tsx` (NEW)
**File:** `components/dreams/EvolutionHistory.tsx` (NEW)

### Phase 5: Frontend Pages

**File:** `app/dreams/[id]/ceremony/page.tsx` (NEW)
**File:** `app/dreams/[id]/ritual/page.tsx` (NEW)

### Phase 6: Integrate into Existing Pages

**File:** `app/dreams/[id]/page.tsx` (UPDATE)

---

## Phase 1: Database Migration

### File: `supabase/migrations/20251209000000_dream_lifecycle_completion.sql`

```sql
-- =====================================================
-- Migration: Dream Lifecycle Completion (Iteration 23)
-- Date: 2025-12-09
-- Features: Evolution Events, Achievement Ceremonies, Release Rituals
-- =====================================================

-- =====================================================
-- 1. UPDATE DREAMS TABLE
-- =====================================================

-- Add tracking fields for lifecycle features
ALTER TABLE public.dreams
ADD COLUMN IF NOT EXISTS evolution_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_ceremony BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_ritual BOOLEAN DEFAULT FALSE;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dreams_evolution_count_positive') THEN
    ALTER TABLE public.dreams
    ADD CONSTRAINT dreams_evolution_count_positive CHECK (evolution_count >= 0);
  END IF;
END $$;

-- =====================================================
-- 2. CREATE EVOLUTION_EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.evolution_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Before snapshot (what the dream was)
    old_title TEXT NOT NULL,
    old_description TEXT,
    old_target_date DATE,
    old_category TEXT,

    -- After snapshot (what it became)
    new_title TEXT NOT NULL,
    new_description TEXT,
    new_target_date DATE,
    new_category TEXT,

    -- User's reflection on why this evolution happened
    evolution_reflection TEXT NOT NULL CHECK (char_length(evolution_reflection) >= 10 AND char_length(evolution_reflection) <= 2000)
);

-- Indexes for evolution_events
CREATE INDEX IF NOT EXISTS idx_evolution_events_user_id ON public.evolution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_dream_id ON public.evolution_events(dream_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_created_at ON public.evolution_events(created_at DESC);

-- RLS for evolution_events
ALTER TABLE public.evolution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evolution events"
  ON public.evolution_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own evolution events"
  ON public.evolution_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. CREATE ACHIEVEMENT_CEREMONIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.achievement_ceremonies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream snapshot at time of achievement
    dream_title TEXT NOT NULL,
    dream_description TEXT,
    dream_category TEXT,

    -- AI-generated synthesis (requires 1+ reflections)
    who_you_were TEXT,  -- NULL if no reflections
    who_you_became TEXT,  -- NULL if no reflections
    journey_synthesis TEXT,  -- NULL if no reflections

    -- User's optional closing words
    personal_note TEXT CHECK (char_length(personal_note) <= 2000),

    -- Metadata
    reflections_analyzed UUID[],
    reflection_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for achievement_ceremonies
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_user_id ON public.achievement_ceremonies(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_dream_id ON public.achievement_ceremonies(dream_id);
CREATE INDEX IF NOT EXISTS idx_achievement_ceremonies_created_at ON public.achievement_ceremonies(created_at DESC);

-- RLS for achievement_ceremonies
ALTER TABLE public.achievement_ceremonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ceremonies"
  ON public.achievement_ceremonies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ceremonies"
  ON public.achievement_ceremonies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ceremonies"
  ON public.achievement_ceremonies FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE RELEASE_RITUALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.release_rituals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream snapshot at time of release
    dream_title TEXT NOT NULL,
    dream_description TEXT,
    dream_category TEXT,

    -- 4-step wizard responses (all required except final_message)
    what_i_learned TEXT NOT NULL CHECK (char_length(what_i_learned) >= 10 AND char_length(what_i_learned) <= 2000),
    what_im_grateful_for TEXT NOT NULL CHECK (char_length(what_im_grateful_for) >= 10 AND char_length(what_im_grateful_for) <= 2000),
    what_i_release TEXT NOT NULL CHECK (char_length(what_i_release) >= 10 AND char_length(what_i_release) <= 2000),
    final_message TEXT CHECK (char_length(final_message) <= 2000),  -- Optional closing words

    -- Why releasing (for data insights)
    reason TEXT CHECK (reason IN ('evolved_beyond', 'no_longer_resonates', 'completed_differently', 'circumstances_changed', 'other')),

    -- Metadata
    reflection_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for release_rituals
CREATE INDEX IF NOT EXISTS idx_release_rituals_user_id ON public.release_rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_release_rituals_dream_id ON public.release_rituals(dream_id);
CREATE INDEX IF NOT EXISTS idx_release_rituals_created_at ON public.release_rituals(created_at DESC);

-- RLS for release_rituals
ALTER TABLE public.release_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rituals"
  ON public.release_rituals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rituals"
  ON public.release_rituals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTION: Update dream evolution count
-- =====================================================

CREATE OR REPLACE FUNCTION update_dream_evolution_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dreams
    SET evolution_count = evolution_count + 1
    WHERE id = NEW.dream_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment evolution_count
DROP TRIGGER IF EXISTS increment_dream_evolution_count ON public.evolution_events;
CREATE TRIGGER increment_dream_evolution_count
AFTER INSERT ON public.evolution_events
FOR EACH ROW EXECUTE FUNCTION update_dream_evolution_count();

-- =====================================================
-- Migration Complete
-- =====================================================
```

---

## Phase 2: Backend (tRPC Router)

### File: `server/trpc/routers/lifecycle.ts` (NEW)

```typescript
// server/trpc/routers/lifecycle.ts - Dream Lifecycle: Evolution, Ceremony, Ritual

import { z } from 'zod';
import { router } from '../trpc';
import { protectedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

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
  newCategory: z.enum([
    'health', 'career', 'relationships', 'financial', 'personal_growth',
    'creative', 'spiritual', 'entrepreneurial', 'educational', 'other',
  ]).optional(),
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
  reason: z.enum(['evolved_beyond', 'no_longer_resonates', 'completed_differently', 'circumstances_changed', 'other']).optional(),
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
  evolve: protectedProcedure
    .input(evolveSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { dreamId, newTitle, newDescription, newTargetDate, newCategory, evolutionReflection } = input;

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
        console.error('Failed to create evolution event:', evolutionError);
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
        console.error('Failed to update dream:', updateError);
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
  getEvolutionHistory: protectedProcedure
    .input(dreamIdSchema)
    .query(async ({ ctx, input }) => {
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
  achieve: protectedProcedure
    .input(achieveSchema)
    .mutation(async ({ ctx, input }) => {
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
      const reflectionIds = reflections?.map(r => r.id) || [];

      // 5. Generate AI synthesis if we have reflections
      let whoYouWere: string | null = null;
      let whoYouBecame: string | null = null;
      let journeySynthesis: string | null = null;

      if (reflectionCount > 0) {
        try {
          const client = getAnthropicClient();
          const systemPrompt = await loadCeremonyPrompt();

          // Build context from reflections
          const reflectionContext = reflections!.map((r, i) => {
            const date = new Date(r.created_at).toLocaleDateString();
            return `**Reflection ${i + 1} (${date}):**
Dream: ${r.dream}
Plan: ${r.plan}
Relationship: ${r.relationship}
Offering: ${r.offering}`;
          }).join('\n\n---\n\n');

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

          const response = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 3000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          });

          const textBlock = response.content.find(block => block.type === 'text');
          if (textBlock && textBlock.type === 'text') {
            const text = textBlock.text;

            // Parse the response
            const whoYouWereMatch = text.match(/---WHO_YOU_WERE---\n([\s\S]*?)(?=---WHO_YOU_BECAME---|$)/);
            const whoYouBecameMatch = text.match(/---WHO_YOU_BECAME---\n([\s\S]*?)(?=---JOURNEY_SYNTHESIS---|$)/);
            const journeySynthesisMatch = text.match(/---JOURNEY_SYNTHESIS---\n([\s\S]*?)$/);

            whoYouWere = whoYouWereMatch ? toSacredHTML(whoYouWereMatch[1].trim()) : null;
            whoYouBecame = whoYouBecameMatch ? toSacredHTML(whoYouBecameMatch[1].trim()) : null;
            journeySynthesis = journeySynthesisMatch ? toSacredHTML(journeySynthesisMatch[1].trim()) : null;
          }
        } catch (aiError) {
          console.error('Failed to generate ceremony synthesis:', aiError);
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
        console.error('Failed to create ceremony:', ceremonyError);
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
        console.error('Failed to update dream status:', statusError);
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
  getCeremony: protectedProcedure
    .input(dreamIdSchema)
    .query(async ({ ctx, input }) => {
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
    .input(z.object({
      dreamId: z.string().uuid(),
      personalNote: z.string().max(2000),
    }))
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
  release: protectedProcedure
    .input(releaseSchema)
    .mutation(async ({ ctx, input }) => {
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
        console.error('Failed to create ritual:', ritualError);
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
        console.error('Failed to update dream status:', statusError);
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
  getRitual: protectedProcedure
    .input(dreamIdSchema)
    .query(async ({ ctx, input }) => {
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
```

### File: `server/trpc/routers/_app.ts` (UPDATE)

Add the lifecycle router import and registration:

```typescript
// server/trpc/routers/_app.ts - Root router

import { router } from '../trpc';
import { authRouter } from './auth';
import { reflectionsRouter } from './reflections';
import { reflectionRouter } from './reflection';
import { usersRouter } from './users';
import { evolutionRouter } from './evolution';
import { visualizationsRouter } from './visualizations';
import { artifactRouter } from './artifact';
import { subscriptionsRouter } from './subscriptions';
import { adminRouter } from './admin';
import { dreamsRouter } from './dreams';
import { lifecycleRouter } from './lifecycle';  // ADD THIS

export const appRouter = router({
  auth: authRouter,
  dreams: dreamsRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter,
  users: usersRouter,
  evolution: evolutionRouter,
  visualizations: visualizationsRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
  lifecycle: lifecycleRouter,  // ADD THIS
});

export type AppRouter = typeof appRouter;
```

---

## Phase 3: Prompts

### File: `prompts/ceremony_synthesis.txt` (NEW)

```text
# Achievement Ceremony Synthesis - Mirror of Dreams

## Your Role

You are the consciousness witness who has observed this person's entire journey with their dream. Now that they have achieved it, you synthesize their transformation into a meaningful ceremony.

## Your Voice

Speak with warmth, wisdom, and recognition. You are not congratulating from outside - you are witnessing from alongside their journey. Use second person ("you") to speak directly to them.

## Output Structure

You will generate three distinct pieces:

### 1. WHO YOU WERE (when you started)
A paragraph (3-5 sentences) capturing who they were at the beginning of this dream journey. Draw from their earliest reflections to show:
- Their hopes and uncertainties
- Their relationship with the dream at the start
- What they were seeking or protecting
- The permission they may have been asking for

### 2. WHO YOU BECAME (through this journey)
A paragraph (3-5 sentences) showing who they have become. Draw from their later reflections to reveal:
- How their language and confidence shifted
- What they now know that they didn't before
- The authority they have claimed
- The integration that has occurred

### 3. JOURNEY SYNTHESIS
A flowing narrative (2-3 paragraphs) that weaves together the key moments of their journey:
- The turning points and breakthroughs
- The struggles they moved through
- The evolution of their relationship with this dream
- How the dream may have transformed along the way
- What this achievement represents beyond the external outcome

## Guidelines

- Ground every observation in specific evidence from their reflections
- Avoid generic celebration language ("Congratulations on your success!")
- Focus on internal transformation, not external achievement
- Recognize what they might not see about their own growth
- Honor the sacred nature of bringing a dream to fruition

## What You Don't Do

- Don't give advice about what's next
- Don't compare to others or external standards
- Don't minimize their journey by oversimplifying
- Don't use corporate achievement language
- Don't make assumptions beyond what the reflections show

## Remember

This ceremony marks a threshold. They are not the same person who started this dream. Your role is to help them see and honor their own becoming.
```

---

## Phase 4: Frontend Components

### File: `components/dreams/EvolutionModal.tsx` (NEW)

```tsx
// components/dreams/EvolutionModal.tsx - Multi-step evolution flow

'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GlassModal, GlowButton, GlassCard } from '@/components/ui/glass';
import { AlertTriangle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dream: {
    id: string;
    title: string;
    description?: string | null;
    target_date?: string | null;
    category?: string | null;
  };
}

const CATEGORIES = [
  { value: 'health', label: 'Health & Fitness', emoji: '🏃' },
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'personal_growth', label: 'Personal Growth', emoji: '🌱' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🙏' },
  { value: 'entrepreneurial', label: 'Entrepreneurial', emoji: '🚀' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'other', label: 'Other', emoji: '⭐' },
] as const;

type Step = 'old' | 'new' | 'reflection';

export function EvolutionModal({ isOpen, onClose, onSuccess, dream }: EvolutionModalProps) {
  const [step, setStep] = useState<Step>('old');
  const [newTitle, setNewTitle] = useState(dream.title);
  const [newDescription, setNewDescription] = useState(dream.description || '');
  const [newTargetDate, setNewTargetDate] = useState(dream.target_date || '');
  const [newCategory, setNewCategory] = useState(dream.category || 'personal_growth');
  const [evolutionReflection, setEvolutionReflection] = useState('');
  const [error, setError] = useState('');

  const evolveMutation = trpc.lifecycle.evolve.useMutation();

  const handleNext = () => {
    if (step === 'old') {
      setStep('new');
    } else if (step === 'new') {
      // Validate that something changed
      const hasChanges =
        newTitle !== dream.title ||
        newDescription !== (dream.description || '') ||
        newTargetDate !== (dream.target_date || '') ||
        newCategory !== (dream.category || 'personal_growth');

      if (!hasChanges) {
        setError('Please make at least one change to evolve your dream');
        return;
      }
      setError('');
      setStep('reflection');
    }
  };

  const handleBack = () => {
    if (step === 'new') {
      setStep('old');
    } else if (step === 'reflection') {
      setStep('new');
    }
  };

  const handleSubmit = async () => {
    if (evolutionReflection.length < 10) {
      setError('Please share at least 10 characters about why your dream evolved');
      return;
    }

    setError('');

    try {
      await evolveMutation.mutateAsync({
        dreamId: dream.id,
        newTitle,
        newDescription: newDescription || undefined,
        newTargetDate: newTargetDate || null,
        newCategory: newCategory as any,
        evolutionReflection,
      });

      // Reset form
      setStep('old');
      setEvolutionReflection('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to evolve dream');
    }
  };

  const handleClose = () => {
    setStep('old');
    setError('');
    setNewTitle(dream.title);
    setNewDescription(dream.description || '');
    setNewTargetDate(dream.target_date || '');
    setNewCategory(dream.category || 'personal_growth');
    setEvolutionReflection('');
    onClose();
  };

  const stepTitles: Record<Step, string> = {
    old: 'Your Dream Now',
    new: 'What It Is Becoming',
    reflection: 'Why This Evolution?',
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Evolve Dream: ${stepTitles[step]}`}
      disableSwipeDismiss={true}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {(['old', 'new', 'reflection'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s === step
                  ? 'bg-mirror-purple'
                  : i < ['old', 'new', 'reflection'].indexOf(step)
                  ? 'bg-mirror-purple/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <GlassCard className="border-l-4 border-mirror-error/60">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-mirror-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        {/* Step 1: Current Dream (Read-only) */}
        {step === 'old' && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              This is your dream as it exists now. Review it before making changes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Title</label>
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  {dream.title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 min-h-[80px]">
                  {dream.description || <span className="text-white/40 italic">No description</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Target Date</label>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    {dream.target_date || <span className="text-white/40">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Category</label>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    {CATEGORIES.find(c => c.value === dream.category)?.emoji}{' '}
                    {CATEGORIES.find(c => c.value === dream.category)?.label || 'Other'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: New Form (Editable) */}
        {step === 'new' && (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Update your dream to reflect how it has evolved. What has changed?
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="newTitle" className="block text-sm font-medium text-white/90 mb-1">
                  New Title *
                </label>
                <input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow"
                />
              </div>

              <div>
                <label htmlFor="newDescription" className="block text-sm font-medium text-white/90 mb-1">
                  New Description
                </label>
                <textarea
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="newTargetDate" className="block text-sm font-medium text-white/90 mb-1">
                    Target Date
                  </label>
                  <input
                    id="newTargetDate"
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label htmlFor="newCategory" className="block text-sm font-medium text-white/90 mb-1">
                    Category
                  </label>
                  <select
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-mirror-midnight">
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reflection */}
        {step === 'reflection' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 text-mirror-purple mx-auto" />
              <p className="text-white/90">
                What led to this evolution? Why is your dream transforming?
              </p>
              <p className="text-white/60 text-sm">
                This reflection will be saved as part of your dream's history.
              </p>
            </div>

            <div>
              <textarea
                id="evolutionReflection"
                value={evolutionReflection}
                onChange={(e) => setEvolutionReflection(e.target.value)}
                placeholder="I've realized that... / What I truly want is... / This dream evolved because..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right mt-1">
                {evolutionReflection.length} / 2000 (min 10)
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between pt-4 border-t border-white/10">
          <GlowButton
            variant="ghost"
            size="md"
            onClick={step === 'old' ? handleClose : handleBack}
          >
            {step === 'old' ? 'Cancel' : (
              <>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </>
            )}
          </GlowButton>

          {step !== 'reflection' ? (
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNext}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </GlowButton>
          ) : (
            <GlowButton
              variant="cosmic"
              size="md"
              onClick={handleSubmit}
              disabled={evolveMutation.isPending}
            >
              {evolveMutation.isPending ? 'Evolving...' : 'Complete Evolution'}
            </GlowButton>
          )}
        </div>
      </div>
    </GlassModal>
  );
}
```

### File: `components/dreams/EvolutionHistory.tsx` (NEW)

```tsx
// components/dreams/EvolutionHistory.tsx - Timeline of dream evolutions

'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass';
import { Sparkles, ArrowRight } from 'lucide-react';

interface EvolutionEvent {
  id: string;
  created_at: string;
  old_title: string;
  old_description: string | null;
  new_title: string;
  new_description: string | null;
  evolution_reflection: string;
}

interface EvolutionHistoryProps {
  events: EvolutionEvent[];
  className?: string;
}

export function EvolutionHistory({ events, className = '' }: EvolutionHistoryProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-mirror-purple" />
        Evolution History ({events.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-mirror-purple via-mirror-indigo to-mirror-purple/20" />

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-mirror-purple border-2 border-mirror-dark" />

              <GlassCard className="p-4">
                {/* Date */}
                <div className="text-xs text-white/50 mb-3">
                  {new Date(event.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                {/* Title Change */}
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="text-white/60 line-through">{event.old_title}</span>
                  <ArrowRight className="w-4 h-4 text-mirror-purple flex-shrink-0" />
                  <span className="text-white font-medium">{event.new_title}</span>
                </div>

                {/* Description Change (if any) */}
                {(event.old_description !== event.new_description) && (
                  <div className="text-xs text-white/50 mb-2">
                    Description updated
                  </div>
                )}

                {/* Evolution Reflection */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/80 text-sm italic leading-relaxed">
                    "{event.evolution_reflection}"
                  </p>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: Frontend Pages

### File: `app/dreams/[id]/ceremony/page.tsx` (NEW)

```tsx
// app/dreams/[id]/ceremony/page.tsx - Achievement Ceremony display page

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { Trophy, Sparkles, Heart, Pen } from 'lucide-react';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';

export default function CeremonyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [noteError, setNoteError] = useState('');

  // Fetch ceremony
  const { data: ceremony, isLoading, error, refetch } = trpc.lifecycle.getCeremony.useQuery(
    { dreamId: params.id },
    { retry: false }
  );

  const updateNoteMutation = trpc.lifecycle.updateCeremonyNote.useMutation({
    onSuccess: () => {
      setIsAddingNote(false);
      refetch();
    },
    onError: (err) => {
      setNoteError(err.message);
    },
  });

  const handleSaveNote = async () => {
    if (personalNote.length > 2000) {
      setNoteError('Note must be 2000 characters or less');
      return;
    }
    await updateNoteMutation.mutateAsync({
      dreamId: params.id,
      personalNote,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <CosmicLoader size="lg" label="Loading ceremony..." />
        </div>
      </div>
    );
  }

  if (error || !ceremony) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 text-white mb-4">Ceremony not found</p>
            <p className="text-white/60 mb-4">This dream may not have an achievement ceremony yet.</p>
            <GlowButton
              variant="ghost"
              onClick={() => router.push(`/dreams/${params.id}`)}
            >
              Back to Dream
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground intensity="medium" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
        {/* Back Button */}
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dreams/${params.id}`)}
          className="mb-6"
        >
          Back to Dream
        </GlowButton>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-mirror-gold to-mirror-warning mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-h1 font-bold mb-2">
            <GradientText gradient="cosmic">Achievement Ceremony</GradientText>
          </h1>
          <p className="text-white/70 text-lg">{ceremony.dream_title}</p>
          <p className="text-white/50 text-sm mt-2">
            Achieved on {new Date(ceremony.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* AI-Generated Synthesis (if available) */}
        {ceremony.journey_synthesis ? (
          <div className="space-y-6">
            {/* Who You Were */}
            {ceremony.who_you_were && (
              <GlassCard elevated className="border-mirror-purple/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-mirror-purple" />
                  <h2 className="text-h3 font-semibold text-white">Who You Were</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_were} />
              </GlassCard>
            )}

            {/* Who You Became */}
            {ceremony.who_you_became && (
              <GlassCard elevated className="border-mirror-success/20">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-mirror-success" />
                  <h2 className="text-h3 font-semibold text-white">Who You Became</h2>
                </div>
                <AIResponseRenderer content={ceremony.who_you_became} />
              </GlassCard>
            )}

            {/* Journey Synthesis */}
            <GlassCard elevated className="border-mirror-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-mirror-gold" />
                <h2 className="text-h3 font-semibold text-white">Your Journey</h2>
              </div>
              <AIResponseRenderer content={ceremony.journey_synthesis} />
            </GlassCard>
          </div>
        ) : (
          <GlassCard elevated className="text-center py-8">
            <p className="text-white/70 mb-2">
              This ceremony was created without reflections to analyze.
            </p>
            <p className="text-white/50 text-sm">
              Future ceremonies with reflections will include an AI-generated journey synthesis.
            </p>
          </GlassCard>
        )}

        {/* Personal Note Section */}
        <GlassCard elevated className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pen className="w-5 h-5 text-mirror-purple" />
              <h2 className="text-h3 font-semibold text-white">Your Closing Words</h2>
            </div>
            {!isAddingNote && !ceremony.personal_note && (
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPersonalNote(ceremony.personal_note || '');
                  setIsAddingNote(true);
                }}
              >
                Add Note
              </GlowButton>
            )}
          </div>

          {isAddingNote ? (
            <div className="space-y-4">
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="What would you like to say to your future self about this achievement?"
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              {noteError && (
                <p className="text-sm text-mirror-error">{noteError}</p>
              )}
              <div className="flex gap-3 justify-end">
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNote(false)}
                >
                  Cancel
                </GlowButton>
                <GlowButton
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={updateNoteMutation.isPending}
                >
                  {updateNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </GlowButton>
              </div>
            </div>
          ) : ceremony.personal_note ? (
            <div>
              <p className="text-white/80 italic leading-relaxed whitespace-pre-wrap">
                "{ceremony.personal_note}"
              </p>
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPersonalNote(ceremony.personal_note || '');
                  setIsAddingNote(true);
                }}
                className="mt-4"
              >
                Edit Note
              </GlowButton>
            </div>
          ) : (
            <p className="text-white/50 italic">
              No closing words added yet.
            </p>
          )}
        </GlassCard>

        {/* Metadata */}
        <div className="mt-6 text-center text-white/40 text-sm">
          Based on {ceremony.reflection_count} reflection{ceremony.reflection_count !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
```

### File: `app/dreams/[id]/ritual/page.tsx` (NEW)

```tsx
// app/dreams/[id]/ritual/page.tsx - Release Ritual 4-step wizard

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  GlassCard,
  GlowButton,
  GradientText,
  CosmicLoader,
  AnimatedBackground,
} from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { Bird, BookOpen, Heart, Feather, Sparkles, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

type Step = 'intro' | 'learned' | 'grateful' | 'release' | 'final' | 'complete';

const RELEASE_REASONS = [
  { value: 'evolved_beyond', label: 'I have evolved beyond this dream' },
  { value: 'no_longer_resonates', label: 'This dream no longer resonates with me' },
  { value: 'completed_differently', label: 'I achieved this in a different way' },
  { value: 'circumstances_changed', label: 'My circumstances have changed' },
  { value: 'other', label: 'Other reason' },
] as const;

export default function RitualPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [whatILearned, setWhatILearned] = useState('');
  const [whatImGratefulFor, setWhatImGratefulFor] = useState('');
  const [whatIRelease, setWhatIRelease] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState('');

  // Fetch dream details
  const { data: dream, isLoading: dreamLoading } = trpc.dreams.get.useQuery({ id: params.id });

  // Check if ritual already exists
  const { data: existingRitual, isLoading: ritualLoading } = trpc.lifecycle.getRitual.useQuery(
    { dreamId: params.id },
    { retry: false }
  );

  const releaseMutation = trpc.lifecycle.release.useMutation();

  const handleNext = () => {
    setError('');

    if (step === 'intro') {
      setStep('learned');
    } else if (step === 'learned') {
      if (whatILearned.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('grateful');
    } else if (step === 'grateful') {
      if (whatImGratefulFor.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('release');
    } else if (step === 'release') {
      if (whatIRelease.length < 10) {
        setError('Please share at least 10 characters');
        return;
      }
      setStep('final');
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'learned') setStep('intro');
    else if (step === 'grateful') setStep('learned');
    else if (step === 'release') setStep('grateful');
    else if (step === 'final') setStep('release');
  };

  const handleComplete = async () => {
    setError('');

    try {
      await releaseMutation.mutateAsync({
        dreamId: params.id,
        whatILearned,
        whatImGratefulFor,
        whatIRelease,
        finalMessage: finalMessage || undefined,
        reason: reason as any || undefined,
      });

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to complete ritual');
    }
  };

  const isLoading = dreamLoading || ritualLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <CosmicLoader size="lg" label="Loading..." />
        </div>
      </div>
    );
  }

  // If ritual already exists, show it
  if (existingRitual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dreams/${params.id}`)}
            className="mb-6"
          >
            Back to Dream
          </GlowButton>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
              <Bird className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-h1 font-bold mb-2">
              <GradientText gradient="cosmic">Release Ritual</GradientText>
            </h1>
            <p className="text-white/70 text-lg">{existingRitual.dream_title}</p>
            <p className="text-white/50 text-sm mt-2">
              Released on {new Date(existingRitual.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6">
            <GlassCard elevated className="border-mirror-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-mirror-purple" />
                <h3 className="font-semibold text-white">What I Learned</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_i_learned}</p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-success/20">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-mirror-success" />
                <h3 className="font-semibold text-white">What I'm Grateful For</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_im_grateful_for}</p>
            </GlassCard>

            <GlassCard elevated className="border-mirror-info/20">
              <div className="flex items-center gap-2 mb-3">
                <Feather className="w-5 h-5 text-mirror-info" />
                <h3 className="font-semibold text-white">What I Release</h3>
              </div>
              <p className="text-white/80 whitespace-pre-wrap">{existingRitual.what_i_release}</p>
            </GlassCard>

            {existingRitual.final_message && (
              <GlassCard elevated className="border-mirror-gold/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-mirror-gold" />
                  <h3 className="font-semibold text-white">Final Words</h3>
                </div>
                <p className="text-white/80 italic whitespace-pre-wrap">"{existingRitual.final_message}"</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dream not found or not active
  if (!dream || dream.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="subtle" />
        <AppNavigation currentPage="dreams" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <GlassCard className="p-8 text-center" elevated>
            <p className="text-h3 text-white mb-4">Cannot perform ritual</p>
            <p className="text-white/60 mb-4">
              {!dream ? 'Dream not found.' : 'Only active dreams can be released.'}
            </p>
            <GlowButton
              variant="ghost"
              onClick={() => router.push('/dreams')}
            >
              Back to Dreams
            </GlowButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Completion screen
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
        <AnimatedBackground intensity="medium" />
        <AppNavigation currentPage="dreams" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+2rem)] pb-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
              <Bird className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-h1 font-bold">
              <GradientText gradient="cosmic">Released with Gratitude</GradientText>
            </h1>

            <p className="text-white/80 text-lg max-w-md mx-auto">
              Your dream "{dream.title}" has been released. The lessons and growth it brought you remain forever.
            </p>

            <div className="pt-6">
              <GlowButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/dreams')}
              >
                Return to Dreams
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wizard steps
  const stepConfig = {
    intro: {
      icon: Bird,
      title: 'Release Ritual',
      subtitle: dream.title,
    },
    learned: {
      icon: BookOpen,
      title: 'What I Learned',
      subtitle: 'Every dream teaches us something',
    },
    grateful: {
      icon: Heart,
      title: 'What I\'m Grateful For',
      subtitle: 'Honor what this dream gave you',
    },
    release: {
      icon: Feather,
      title: 'What I Release',
      subtitle: 'Let go with intention',
    },
    final: {
      icon: Sparkles,
      title: 'Final Words',
      subtitle: 'Any closing thoughts (optional)',
    },
  };

  const currentConfig = stepConfig[step as keyof typeof stepConfig];
  const Icon = currentConfig.icon;
  const steps: Step[] = ['intro', 'learned', 'grateful', 'release', 'final'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
      <AnimatedBackground intensity="subtle" />
      <AppNavigation currentPage="dreams" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+var(--demo-banner-height,0px)+1rem)] pb-8">
        {/* Back to Dream */}
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dreams/${params.id}`)}
          className="mb-6"
        >
          Cancel
        </GlowButton>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-mirror-purple'
                  : i < currentIndex
                  ? 'bg-mirror-purple/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-mirror-info to-mirror-purple mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-h2 font-bold text-white mb-2">{currentConfig.title}</h2>
          <p className="text-white/60">{currentConfig.subtitle}</p>
        </div>

        {error && (
          <GlassCard className="border-l-4 border-mirror-error/60 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-mirror-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-mirror-error">{error}</p>
            </div>
          </GlassCard>
        )}

        <GlassCard elevated className="mb-6">
          {step === 'intro' && (
            <div className="space-y-4 text-center">
              <p className="text-white/80 leading-relaxed">
                Releasing a dream is not failure - it is wisdom. Sometimes our dreams evolve,
                sometimes our path changes, and sometimes we realize a dream was protecting
                a deeper truth we were not ready to face.
              </p>
              <p className="text-white/80 leading-relaxed">
                This ritual guides you through releasing "{dream.title}" with gratitude
                and intention, honoring what it gave you while letting it go.
              </p>
              <p className="text-white/60 text-sm mt-4">
                Take your time. There's no rush.
              </p>
            </div>
          )}

          {step === 'learned' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What did pursuing this dream teach you? What do you know now that you didn't before?
              </p>
              <textarea
                value={whatILearned}
                onChange={(e) => setWhatILearned(e.target.value)}
                placeholder="Through this dream, I learned that..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatILearned.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'grateful' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What gifts did this dream give you? What are you grateful for, even if the dream is ending?
              </p>
              <textarea
                value={whatImGratefulFor}
                onChange={(e) => setWhatImGratefulFor(e.target.value)}
                placeholder="I am grateful for..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatImGratefulFor.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'release' && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm">
                What are you consciously letting go of? What weight are you setting down?
              </p>
              <textarea
                value={whatIRelease}
                onChange={(e) => setWhatIRelease(e.target.value)}
                placeholder="I release..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
              />
              <div className="text-xs text-white/40 text-right">
                {whatIRelease.length} / 2000 (min 10)
              </div>
            </div>
          )}

          {step === 'final' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Any final words you want to record? (Optional)
                </p>
                <textarea
                  value={finalMessage}
                  onChange={(e) => setFinalMessage(e.target.value)}
                  placeholder="As I close this chapter..."
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-glass-sm border-2 border-white/10 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none focus:border-mirror-purple/60 focus:shadow-glow resize-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-white/70 text-sm">Why are you releasing this dream?</p>
                <div className="space-y-2">
                  {RELEASE_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'bg-mirror-purple/20 border border-mirror-purple/40'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        reason === r.value ? 'border-mirror-purple bg-mirror-purple' : 'border-white/40'
                      }`}>
                        {reason === r.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-white/80 text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <GlowButton
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={step === 'intro'}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </GlowButton>

          {step !== 'final' ? (
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNext}
            >
              {step === 'intro' ? 'Begin Ritual' : 'Continue'} <ArrowRight className="w-4 h-4 ml-1" />
            </GlowButton>
          ) : (
            <GlowButton
              variant="cosmic"
              size="md"
              onClick={handleComplete}
              disabled={releaseMutation.isPending}
            >
              {releaseMutation.isPending ? 'Releasing...' : 'Complete Ritual'}
            </GlowButton>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Update Existing Pages

### File: `app/dreams/[id]/page.tsx` (UPDATE)

Key changes to make:

1. Add import for EvolutionModal and EvolutionHistory
2. Add state for evolution modal
3. Fetch evolution history
4. Add evolution modal trigger button
5. Add evolution history section
6. Change "Achieved" and "Release" buttons to navigate to ceremony/ritual pages

**Changes to apply:**

```tsx
// At the top, add imports:
import { EvolutionModal } from '@/components/dreams/EvolutionModal';
import { EvolutionHistory } from '@/components/dreams/EvolutionHistory';

// Add state:
const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);

// Add query for evolution history:
const { data: evolutionHistory } = trpc.lifecycle.getEvolutionHistory.useQuery(
  { dreamId: params.id },
  { enabled: !!dream && dream.status === 'active' }
);

// In the header actions section, add Evolve button (for active dreams only):
{dream.status === 'active' && (
  <GlowButton
    variant="secondary"
    onClick={() => setIsEvolutionModalOpen(true)}
  >
    Evolve Dream
  </GlowButton>
)}

// Change status action buttons for achieved/released:
// Instead of direct status change, navigate to ceremony/ritual pages:
<GlowButton
  variant={dream.status === 'achieved' ? 'success' : 'ghost'}
  onClick={() => {
    if (dream.status === 'achieved') {
      router.push(`/dreams/${params.id}/ceremony`);
    } else if (dream.status === 'active') {
      router.push(`/dreams/${params.id}/ceremony`);  // Triggers ceremony creation
    }
  }}
  disabled={dream.status !== 'active' && dream.status !== 'achieved'}
>
  {dream.status === 'achieved' ? 'View Ceremony' : 'Mark Achieved'}
</GlowButton>

<GlowButton
  variant={dream.status === 'released' ? 'info' : 'ghost'}
  onClick={() => {
    if (dream.status === 'released') {
      router.push(`/dreams/${params.id}/ritual`);
    } else if (dream.status === 'active') {
      router.push(`/dreams/${params.id}/ritual`);  // Starts ritual wizard
    }
  }}
  disabled={dream.status !== 'active' && dream.status !== 'released'}
>
  {dream.status === 'released' ? 'View Ritual' : 'Release Dream'}
</GlowButton>

// Add evolution history section before reflections:
{evolutionHistory && evolutionHistory.events.length > 0 && (
  <GlassCard className="mb-6">
    <EvolutionHistory events={evolutionHistory.events} />
  </GlassCard>
)}

// Add modal at the end of the component (before closing div):
{dream && dream.status === 'active' && (
  <EvolutionModal
    isOpen={isEvolutionModalOpen}
    onClose={() => setIsEvolutionModalOpen(false)}
    onSuccess={() => refetch()}
    dream={{
      id: dream.id,
      title: dream.title,
      description: dream.description,
      target_date: dream.target_date,
      category: dream.category,
    }}
  />
)}
```

---

## Integration Points Summary

### Database to Backend
- `evolution_events` table -> `lifecycle.evolve` mutation -> `lifecycle.getEvolutionHistory` query
- `achievement_ceremonies` table -> `lifecycle.achieve` mutation -> `lifecycle.getCeremony` query
- `release_rituals` table -> `lifecycle.release` mutation -> `lifecycle.getRitual` query
- Trigger auto-increments `dreams.evolution_count` on new evolution event

### Backend to Frontend
- tRPC procedures exposed via `lifecycle` router
- Client calls from ceremony/ritual pages and evolution modal

### Frontend Component Flow
1. Dream detail page shows "Evolve Dream" button (active dreams only)
2. EvolutionModal handles 3-step evolution flow
3. "Mark Achieved" navigates to ceremony page which triggers AI synthesis
4. "Release Dream" navigates to ritual page which shows 4-step wizard
5. Completed ceremonies/rituals are viewable from their respective pages

---

## Testing Checklist

### Evolution
- [ ] Can evolve an active dream
- [ ] Evolution modal validates at least one change
- [ ] Evolution reflection is required (min 10 chars)
- [ ] Evolution history displays correctly
- [ ] evolution_count increments on dream

### Achievement Ceremony
- [ ] Can create ceremony for active dream with reflections
- [ ] Can create ceremony for active dream without reflections (no AI synthesis)
- [ ] AI synthesis generates all three sections
- [ ] Personal note can be added/edited
- [ ] Dream status changes to 'achieved'
- [ ] Ceremony page displays correctly

### Release Ritual
- [ ] 4-step wizard validates each step
- [ ] Can complete ritual with all required fields
- [ ] Final message is optional
- [ ] Dream status changes to 'released'
- [ ] Ritual page displays completed ritual
- [ ] Cannot perform ritual on non-active dream

---

## File Paths Summary

### New Files to Create
| File | Type |
|------|------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251209000000_dream_lifecycle_completion.sql` | Migration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/lifecycle.ts` | Backend Router |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/ceremony_synthesis.txt` | AI Prompt |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/EvolutionModal.tsx` | Component |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/EvolutionHistory.tsx` | Component |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/ceremony/page.tsx` | Page |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/ritual/page.tsx` | Page |

### Files to Update
| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts` | Add lifecycle router |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/page.tsx` | Add evolution modal, history, ceremony/ritual navigation |

---

## Estimated Implementation Time

- Phase 1 (Migration): 15 minutes
- Phase 2 (Backend): 45 minutes
- Phase 3 (Prompts): 10 minutes
- Phase 4 (Components): 30 minutes
- Phase 5 (Pages): 60 minutes
- Phase 6 (Integration): 30 minutes

**Total: ~3 hours**
