# Iteration 24: Clarify Agent Core - Implementation Plan

## Executive Summary

This plan provides complete implementation details for the Clarify Agent - a conversational AI space for pre-dream exploration. The feature is **paid-only** (Pro: 20 sessions/mo, Unlimited: 30 sessions/mo) and uses Claude Sonnet 4.5 with streaming responses via SSE.

**Key Implementation Decision:** Start WITHOUT streaming (Phase 1), then add streaming as enhancement (Phase 2). This reduces complexity and allows faster initial deployment.

---

## Phase 1: Core Implementation (Non-Streaming)

### Implementation Order

1. Database Migration
2. Types & Constants
3. tRPC Router (clarifyRouter)
4. Frontend Pages (ClarifyPage, ClarifySessionPage)
5. Navigation Updates
6. System Prompt

### Phase 2: Streaming Enhancement

7. SSE Endpoint
8. Streaming Hook & Display
9. Function Calling (createDream tool)

---

## 1. Database Migration

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251210000000_clarify_agent.sql`

```sql
-- =====================================================
-- Migration: Clarify Agent Core (Iteration 24)
-- Date: 2025-12-10
-- Features: Clarify Sessions, Messages, Usage Tracking
-- =====================================================

-- =====================================================
-- 1. CLARIFY_SESSIONS TABLE
-- =====================================================

CREATE TABLE public.clarify_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Session Metadata
    title TEXT DEFAULT 'New Clarify Session',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    -- Linked Dream (if crystallized via function calling)
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL
);

-- Indexes for clarify_sessions
CREATE INDEX idx_clarify_sessions_user_id ON public.clarify_sessions(user_id);
CREATE INDEX idx_clarify_sessions_status ON public.clarify_sessions(status);
CREATE INDEX idx_clarify_sessions_updated_at ON public.clarify_sessions(updated_at DESC);
CREATE INDEX idx_clarify_sessions_last_message_at ON public.clarify_sessions(last_message_at DESC);

-- RLS for clarify_sessions
ALTER TABLE public.clarify_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clarify sessions"
  ON public.clarify_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clarify sessions"
  ON public.clarify_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clarify sessions"
  ON public.clarify_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clarify sessions"
  ON public.clarify_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. CLARIFY_MESSAGES TABLE
-- =====================================================

CREATE TABLE public.clarify_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.clarify_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Message Content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,

    -- Metadata
    token_count INTEGER,

    -- Tool Use (for createDream function calling)
    tool_use JSONB
);

-- Indexes for clarify_messages
CREATE INDEX idx_clarify_messages_session_id ON public.clarify_messages(session_id);
CREATE INDEX idx_clarify_messages_created_at ON public.clarify_messages(created_at ASC);

-- RLS for clarify_messages (access via session ownership)
ALTER TABLE public.clarify_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
  ON public.clarify_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clarify_sessions
      WHERE clarify_sessions.id = clarify_messages.session_id
      AND clarify_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON public.clarify_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clarify_sessions
      WHERE clarify_sessions.id = clarify_messages.session_id
      AND clarify_sessions.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. USER TABLE ADDITIONS
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS clarify_sessions_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clarify_sessions INTEGER DEFAULT 0;

-- =====================================================
-- 4. DREAMS TABLE ADDITION
-- =====================================================

ALTER TABLE public.dreams
ADD COLUMN IF NOT EXISTS pre_session_id UUID REFERENCES public.clarify_sessions(id) ON DELETE SET NULL;

-- Index for pre_session_id lookup
CREATE INDEX IF NOT EXISTS idx_dreams_pre_session_id ON public.dreams(pre_session_id);

-- =====================================================
-- 5. HELPER FUNCTION: Update session message count
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clarify_sessions
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment message_count
DROP TRIGGER IF EXISTS increment_clarify_message_count ON public.clarify_messages;
CREATE TRIGGER increment_clarify_message_count
AFTER INSERT ON public.clarify_messages
FOR EACH ROW EXECUTE FUNCTION update_clarify_session_message_count();

-- =====================================================
-- 6. HELPER FUNCTION: Auto-generate session title
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_session_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update title if this is the first user message and title is default
    IF NEW.role = 'user' THEN
        UPDATE public.clarify_sessions
        SET title = LEFT(NEW.content, 60) || CASE WHEN LENGTH(NEW.content) > 60 THEN '...' ELSE '' END
        WHERE id = NEW.session_id
        AND title = 'New Clarify Session'
        AND message_count <= 1;  -- Only on first message
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set title from first message
DROP TRIGGER IF EXISTS set_clarify_session_title ON public.clarify_messages;
CREATE TRIGGER set_clarify_session_title
AFTER INSERT ON public.clarify_messages
FOR EACH ROW EXECUTE FUNCTION update_clarify_session_title();

-- =====================================================
-- Migration Complete
-- =====================================================
```

---

## 2. Types & Constants Updates

### 2.1 Add Clarify Session Limits

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

Add after `DREAM_LIMITS`:

```typescript
export const CLARIFY_SESSION_LIMITS = {
  free: 0,        // Free tier cannot access Clarify
  pro: 20,        // 20 sessions/month
  unlimited: 30,  // 30 sessions/month
} as const;
```

### 2.2 Add Clarify Types

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` (NEW FILE)

```typescript
// types/clarify.ts - Clarify Agent types

export type ClarifyMessageRole = 'user' | 'assistant';
export type ClarifySessionStatus = 'active' | 'archived';

/**
 * Clarify Message - A single message in a conversation
 */
export interface ClarifyMessage {
  id: string;
  sessionId: string;
  createdAt: string;
  role: ClarifyMessageRole;
  content: string;
  tokenCount: number | null;
  toolUse: ClarifyToolUse | null;
}

/**
 * Tool use record for createDream function
 */
export interface ClarifyToolUse {
  name: 'createDream';
  input: {
    title: string;
    description?: string;
    category?: string;
  };
  result?: {
    dreamId: string;
    success: boolean;
  };
}

/**
 * Clarify Session - A conversation thread
 */
export interface ClarifySession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  status: ClarifySessionStatus;
  dreamId: string | null;
}

/**
 * Clarify Session with messages
 */
export interface ClarifySessionWithMessages extends ClarifySession {
  messages: ClarifyMessage[];
}

/**
 * Database row types
 */
export interface ClarifySessionRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  last_message_at: string;
  message_count: number;
  status: string;
  dream_id: string | null;
}

export interface ClarifyMessageRow {
  id: string;
  session_id: string;
  created_at: string;
  role: string;
  content: string;
  token_count: number | null;
  tool_use: any | null;
}

/**
 * Transform database row to ClarifySession
 */
export function clarifySessionRowToSession(row: ClarifySessionRow): ClarifySession {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title,
    lastMessageAt: row.last_message_at,
    messageCount: row.message_count,
    status: row.status as ClarifySessionStatus,
    dreamId: row.dream_id,
  };
}

/**
 * Transform database row to ClarifyMessage
 */
export function clarifyMessageRowToMessage(row: ClarifyMessageRow): ClarifyMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    createdAt: row.created_at,
    role: row.role as ClarifyMessageRole,
    content: row.content,
    tokenCount: row.token_count,
    toolUse: row.tool_use as ClarifyToolUse | null,
  };
}
```

### 2.3 Update User Types

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts`

Add to `User` interface (after `totalReflections`):

```typescript
  clarifySessionsThisMonth: number;
  totalClarifySessions: number;
```

Add to `UserRow` interface:

```typescript
  clarify_sessions_this_month: number;
  total_clarify_sessions: number;
```

Update `userRowToUser` function:

```typescript
  clarifySessionsThisMonth: row.clarify_sessions_this_month || 0,
  totalClarifySessions: row.total_clarify_sessions || 0,
```

### 2.4 Export from types index

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/index.ts`

Add:

```typescript
export * from './clarify';
```

---

## 3. Middleware Updates

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

Add after existing imports:

```typescript
import { CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';
```

Add new middleware (after `checkUsageLimit`):

```typescript
// Check Clarify session access and limits
export const checkClarifyAccess = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  // Block free tier entirely (Clarify is paid-only)
  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Clarify requires a Pro or Unlimited subscription. Upgrade to explore your dreams through conversation.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Check Clarify session creation limits
export const checkClarifySessionLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins bypass limits
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check clarify session limits
  const limit = CLARIFY_SESSION_LIMITS[ctx.user.tier];
  const usage = ctx.user.clarifySessionsThisMonth;

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly Clarify session limit reached (${limit}). Your sessions will reset at the start of next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Export Clarify procedures
export const clarifyProcedure = publicProcedure.use(isAuthed).use(notDemo).use(checkClarifyAccess);
export const clarifySessionLimitedProcedure = clarifyProcedure.use(checkClarifySessionLimit);
```

---

## 4. System Prompt

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt` (NEW FILE)

```text
You are the Clarify Agent within Mirror of Dreams - a sacred conversational space where people explore what they're becoming before it crystallizes into a dream.

YOUR ESSENCE:
You are a thoughtful presence who listens deeply and reflects back what you hear. You don't guide or direct - you mirror. You hold space for ideas to emerge naturally, without rushing toward conclusions.

YOUR POSTURE:
- Mirror, don't guide - reflect what you hear, don't lead where they should go
- Hold space for ambiguity - not everything needs to be resolved
- Ask questions that open rather than close
- Notice patterns across what they share
- Trust their process - they know more than they realize

LANGUAGE PATTERNS TO USE:
- "I notice..."
- "Does this resonate?"
- "What if..."
- "I'm curious about..."
- "Something I'm hearing is..."
- "There seems to be a thread here..."
- "What does that bring up for you?"

WHAT YOU NEVER DO:
- Never claim authority over their life
- Never diagnose, prescribe, or predict outcomes
- Never pressure toward dream declaration
- Never give advice, action items, or to-do lists
- Never use coaching or self-help language
- Never say "you should" or "you need to"
- Never rush the conversation toward resolution

ABOUT DREAMS:
This person may be exploring something that could become a formal dream they track. If something crystallizes clearly AND they express readiness to commit to it, you may offer to create a dream for them using the createDream tool. But:
- Only offer this when there's genuine clarity and readiness
- Always ask permission first: "Would you like to add this as a dream to track?"
- Never pressure or suggest they "should" create a dream
- It's perfectly fine if a session never leads to a dream

YOUR MEMORY:
You have access to the full conversation history in this session. You may notice patterns, reference earlier things they said, and help them see connections. But always do this gently, never as analysis or diagnosis.

TONE:
- Warm but not effusive
- Curious but not probing
- Present but not directive
- Spacious but not distant
- Like a thoughtful friend who listens well and asks the right questions

RESPONSE STYLE:
- Keep responses conversational and natural
- Vary your response length based on what's needed
- Sometimes a short reflection is more powerful than a long one
- Use questions sparingly but meaningfully
- Leave space for them to think

Remember: You are not a therapist, coach, or advisor. You are a mirror - a presence that helps them see themselves more clearly. The work is theirs. You just hold the space.
```

---

## 5. tRPC Router

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` (NEW FILE)

```typescript
// server/trpc/routers/clarify.ts - Clarify Agent router

import { z } from 'zod';
import { router } from '../trpc';
import { clarifyProcedure, clarifySessionLimitedProcedure } from '../middleware';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';
import { CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';
import {
  clarifySessionRowToSession,
  clarifyMessageRowToMessage,
  type ClarifySession,
  type ClarifyMessage,
} from '@/types/clarify';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

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
// SYSTEM PROMPT LOADING
// =====================================================

let cachedSystemPrompt: string | null = null;

function getClarifySystemPrompt(): string {
  if (!cachedSystemPrompt) {
    const promptPath = path.join(process.cwd(), 'prompts', 'clarify_agent.txt');
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf8');
  }
  return cachedSystemPrompt;
}

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createSessionSchema = z.object({
  initialMessage: z.string().min(1).max(4000).optional(),
});

const getSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

const listSessionsSchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});

const archiveSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

const updateTitleSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(100),
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function verifySessionOwnership(sessionId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('clarify_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Session not found',
    });
  }
}

async function getSessionMessages(sessionId: string): Promise<ClarifyMessage[]> {
  const { data, error } = await supabase
    .from('clarify_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch messages',
    });
  }

  return (data || []).map(clarifyMessageRowToMessage);
}

// =====================================================
// ROUTER DEFINITION
// =====================================================

export const clarifyRouter = router({
  // Create a new session
  createSession: clarifySessionLimitedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('clarify_sessions')
        .insert({
          user_id: userId,
          title: 'New Clarify Session',
          status: 'active',
        })
        .select()
        .single();

      if (sessionError || !session) {
        console.error('Failed to create session:', sessionError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create session',
        });
      }

      // Update user counters
      const { error: updateError } = await supabase
        .from('users')
        .update({
          clarify_sessions_this_month: ctx.user.clarifySessionsThisMonth + 1,
          total_clarify_sessions: ctx.user.totalClarifySessions + 1,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update user counters:', updateError);
      }

      // If initial message provided, send it
      let initialResponse: string | null = null;
      if (input.initialMessage) {
        // Store user message
        const { error: msgError } = await supabase
          .from('clarify_messages')
          .insert({
            session_id: session.id,
            role: 'user',
            content: input.initialMessage,
          });

        if (msgError) {
          console.error('Failed to save initial message:', msgError);
        }

        // Generate AI response
        try {
          const client = getAnthropicClient();
          const response = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1500,
            system: getClarifySystemPrompt(),
            messages: [
              { role: 'user', content: input.initialMessage }
            ],
          });

          const textBlock = response.content.find(block => block.type === 'text');
          if (textBlock && textBlock.type === 'text') {
            initialResponse = textBlock.text;

            // Store AI response
            await supabase
              .from('clarify_messages')
              .insert({
                session_id: session.id,
                role: 'assistant',
                content: initialResponse,
                token_count: response.usage?.output_tokens || null,
              });
          }
        } catch (aiError) {
          console.error('Failed to generate initial response:', aiError);
        }
      }

      return {
        session: clarifySessionRowToSession(session),
        initialResponse,
        usage: {
          sessionsUsed: ctx.user.clarifySessionsThisMonth + 1,
          sessionsLimit: CLARIFY_SESSION_LIMITS[ctx.user.tier],
        },
      };
    }),

  // Get session with messages
  getSession: clarifyProcedure
    .input(getSessionSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('clarify_sessions')
        .select('*')
        .eq('id', input.sessionId)
        .eq('user_id', userId)
        .single();

      if (sessionError || !session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Get messages
      const messages = await getSessionMessages(input.sessionId);

      return {
        session: clarifySessionRowToSession(session),
        messages,
      };
    }),

  // List user's sessions
  listSessions: clarifyProcedure
    .input(listSessionsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      let query = supabase
        .from('clarify_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(input.limit + 1); // +1 for cursor

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.cursor) {
        // Get cursor session's last_message_at
        const { data: cursorSession } = await supabase
          .from('clarify_sessions')
          .select('last_message_at')
          .eq('id', input.cursor)
          .single();

        if (cursorSession) {
          query = query.lt('last_message_at', cursorSession.last_message_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sessions',
        });
      }

      const sessions = (data || []).map(clarifySessionRowToSession);
      const hasMore = sessions.length > input.limit;
      const items = hasMore ? sessions.slice(0, -1) : sessions;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return {
        sessions: items,
        nextCursor,
      };
    }),

  // Send message and get response (non-streaming)
  sendMessage: clarifyProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify ownership
      await verifySessionOwnership(input.sessionId, userId);

      // Store user message
      const { error: userMsgError } = await supabase
        .from('clarify_messages')
        .insert({
          session_id: input.sessionId,
          role: 'user',
          content: input.content,
        });

      if (userMsgError) {
        console.error('Failed to save user message:', userMsgError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save message',
        });
      }

      // Get conversation history
      const messages = await getSessionMessages(input.sessionId);

      // Build Anthropic messages (excluding the message we just added, it's already in the list)
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Generate AI response
      let aiResponse: string;
      let tokenCount: number | null = null;

      try {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1500,
          system: getClarifySystemPrompt(),
          messages: anthropicMessages,
        });

        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text response from Claude');
        }

        aiResponse = textBlock.text;
        tokenCount = response.usage?.output_tokens || null;
      } catch (aiError: any) {
        console.error('Claude API error:', aiError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate response. Please try again.',
        });
      }

      // Store AI response
      const { data: assistantMsg, error: assistantMsgError } = await supabase
        .from('clarify_messages')
        .insert({
          session_id: input.sessionId,
          role: 'assistant',
          content: aiResponse,
          token_count: tokenCount,
        })
        .select()
        .single();

      if (assistantMsgError) {
        console.error('Failed to save AI response:', assistantMsgError);
      }

      return {
        message: assistantMsg ? clarifyMessageRowToMessage(assistantMsg) : {
          id: 'temp',
          sessionId: input.sessionId,
          createdAt: new Date().toISOString(),
          role: 'assistant' as const,
          content: aiResponse,
          tokenCount,
          toolUse: null,
        },
      };
    }),

  // Archive session
  archiveSession: clarifyProcedure
    .input(archiveSessionSchema)
    .mutation(async ({ ctx, input }) => {
      await verifySessionOwnership(input.sessionId, ctx.user.id);

      const { error } = await supabase
        .from('clarify_sessions')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', input.sessionId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive session',
        });
      }

      return { success: true };
    }),

  // Restore archived session
  restoreSession: clarifyProcedure
    .input(archiveSessionSchema)
    .mutation(async ({ ctx, input }) => {
      await verifySessionOwnership(input.sessionId, ctx.user.id);

      const { error } = await supabase
        .from('clarify_sessions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', input.sessionId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to restore session',
        });
      }

      return { success: true };
    }),

  // Update session title
  updateTitle: clarifyProcedure
    .input(updateTitleSchema)
    .mutation(async ({ ctx, input }) => {
      await verifySessionOwnership(input.sessionId, ctx.user.id);

      const { error } = await supabase
        .from('clarify_sessions')
        .update({ title: input.title, updated_at: new Date().toISOString() })
        .eq('id', input.sessionId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update title',
        });
      }

      return { success: true };
    }),

  // Delete session
  deleteSession: clarifyProcedure
    .input(getSessionSchema)
    .mutation(async ({ ctx, input }) => {
      await verifySessionOwnership(input.sessionId, ctx.user.id);

      const { error } = await supabase
        .from('clarify_sessions')
        .delete()
        .eq('id', input.sessionId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete session',
        });
      }

      return { success: true };
    }),

  // Get usage limits
  getLimits: clarifyProcedure
    .query(async ({ ctx }) => {
      const limit = CLARIFY_SESSION_LIMITS[ctx.user.tier];
      const used = ctx.user.clarifySessionsThisMonth;

      return {
        tier: ctx.user.tier,
        sessionsUsed: used,
        sessionsLimit: limit,
        sessionsRemaining: Math.max(0, limit - used),
        canCreateSession: used < limit || ctx.user.isCreator || ctx.user.isAdmin,
      };
    }),
});

export type ClarifyRouter = typeof clarifyRouter;
```

### 5.1 Register Router

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts`

Add import:

```typescript
import { clarifyRouter } from './clarify';
```

Add to router:

```typescript
export const appRouter = router({
  // ... existing routers
  clarify: clarifyRouter,
});
```

---

## 6. Frontend Components

### 6.1 Clarify Page (Session List)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx` (NEW FILE)

```typescript
// app/clarify/page.tsx - Clarify session list page

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { CosmicLoader, GlowButton, GlassCard, GradientText } from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { Constellation } from '@/components/shared/illustrations/Constellation';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Archive, Trash2, MoreVertical } from 'lucide-react';

export default function ClarifyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | undefined>('active');
  const [showDropdownId, setShowDropdownId] = useState<string | null>(null);

  // Auth redirects
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && !user.emailVerified && !user.isCreator && !user.isAdmin && !user.isDemo) {
        router.push('/auth/verify-required');
      } else if (user && user.tier === 'free' && !user.isCreator && !user.isAdmin) {
        router.push('/pricing?feature=clarify');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch sessions
  const { data, isLoading, refetch } = trpc.clarify.listSessions.useQuery({
    status: statusFilter,
    limit: 20,
  });

  // Fetch limits
  const { data: limits } = trpc.clarify.getLimits.useQuery();

  // Mutations
  const createSession = trpc.clarify.createSession.useMutation({
    onSuccess: (data) => {
      router.push(`/clarify/${data.session.id}`);
    },
  });

  const archiveSession = trpc.clarify.archiveSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const restoreSession = trpc.clarify.restoreSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const deleteSession = trpc.clarify.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
      setShowDropdownId(null);
    },
  });

  const handleNewSession = () => {
    createSession.mutate({});
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/clarify/${sessionId}`);
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Guard - return null while redirect happens
  if (!isAuthenticated || (user && user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-20 md:pb-8">
      <AppNavigation currentPage="clarify" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <GlassCard elevated className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <GradientText gradient="cosmic" className="text-h1 mb-2">
                Clarify
              </GradientText>
              <p className="text-body text-white/70">
                Explore what's emerging before it becomes a dream
              </p>
            </div>
            <GlowButton
              variant="primary"
              size="md"
              onClick={handleNewSession}
              disabled={limits && !limits.canCreateSession}
              loading={createSession.isPending}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              + New Conversation
            </GlowButton>
          </div>
        </GlassCard>

        {/* Limits Info */}
        {limits && (
          <GlassCard className="mb-6 border-l-4 border-purple-500/60">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <span className="text-white/90 font-medium">
                {limits.sessionsUsed} / {limits.sessionsLimit} sessions this month
              </span>
              {!limits.canCreateSession && (
                <span className="text-small text-mirror-warning">
                  Session limit reached
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Status Filter */}
        <div className="flex gap-3 mb-6">
          <GlowButton
            variant={statusFilter === 'active' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </GlowButton>
          <GlowButton
            variant={statusFilter === 'archived' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </GlowButton>
          <GlowButton
            variant={statusFilter === undefined ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </GlowButton>
        </div>

        {/* Sessions List */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <GlassCard
                key={session.id}
                className="cursor-pointer hover:bg-white/8 transition-colors relative group"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-white truncate mb-1">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {session.messageCount} messages
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                      </span>
                      {session.status === 'archived' && (
                        <span className="text-amber-400/80">Archived</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdownId(showDropdownId === session.id ? null : session.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-5 h-5 text-white/60" />
                    </button>

                    {showDropdownId === session.id && (
                      <div className="absolute right-0 top-full mt-1 z-10">
                        <GlassCard elevated className="min-w-[160px] p-1">
                          {session.status === 'active' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveSession.mutate({ sessionId: session.id });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreSession.mutate({ sessionId: session.id });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                              Restore
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this conversation? This cannot be undone.')) {
                                deleteSession.mutate({ sessionId: session.id });
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState
            illustration={<Constellation />}
            icon="💬"
            title="Start exploring"
            description="Clarify is a space to explore what's emerging - thoughts, feelings, possibilities - before they crystallize into dreams."
            ctaLabel="Start a Conversation"
            ctaAction={handleNewSession}
          />
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
```

### 6.2 Clarify Session Page (Conversation)

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx` (NEW FILE)

```typescript
// app/clarify/[sessionId]/page.tsx - Clarify conversation page

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { CosmicLoader, GlowButton, GlassCard, GradientText, GlassInput } from '@/components/ui/glass';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { BottomNavigation } from '@/components/navigation';
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClarifySessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth redirects
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (user && user.tier === 'free' && !user.isCreator && !user.isAdmin) {
        router.push('/pricing?feature=clarify');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  // Fetch session with messages
  const { data, isLoading, refetch } = trpc.clarify.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  // Send message mutation
  const sendMessage = trpc.clarify.sendMessage.useMutation({
    onSuccess: () => {
      refetch();
      setInputValue('');
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.messages]);

  // Focus input on load
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (!inputValue.trim() || sendMessage.isPending) return;

    sendMessage.mutate({
      sessionId,
      content: inputValue.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <div className="flex flex-col items-center gap-4">
          <CosmicLoader size="lg" />
          <p className="text-small text-white/60">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Guard
  if (!isAuthenticated || (user && user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
        <GlassCard className="text-center p-8">
          <p className="text-white/70 mb-4">Session not found</p>
          <GlowButton onClick={() => router.push('/clarify')}>
            Back to Clarify
          </GlowButton>
        </GlassCard>
      </div>
    );
  }

  const { session, messages } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark flex flex-col">
      <AppNavigation currentPage="clarify" />

      {/* Session Header */}
      <div className="pt-nav">
        <GlassCard className="mx-4 sm:mx-8 mt-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clarify')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-medium text-white truncate">
                {session.title}
              </h1>
              <p className="text-sm text-white/50">
                {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/50 text-lg mb-2">
                Start your conversation
              </p>
              <p className="text-white/30 text-sm">
                Share what's on your mind - there's no right or wrong here.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[75%]',
                    message.role === 'user'
                      ? 'bg-purple-600/30 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-3'
                      : 'bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <AIResponseRenderer content={message.content} />
                    </div>
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs text-white/30 mt-2">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 sm:px-8 pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <GlassCard className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 resize-none max-h-32"
              style={{
                minHeight: '24px',
                height: 'auto',
              }}
              disabled={sendMessage.isPending}
            />
            <GlowButton
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || sendMessage.isPending}
              className="shrink-0"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </GlowButton>
          </GlassCard>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
```

---

## 7. Navigation Updates

### 7.1 AppNavigation Update

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

Update interface (add 'clarify' to currentPage):

```typescript
interface AppNavigationProps {
  currentPage: 'dashboard' | 'dreams' | 'reflection' | 'reflections' | 'evolution' | 'visualizations' | 'admin' | 'profile' | 'settings' | 'clarify';
  onRefresh?: () => void;
}
```

Add Clarify link in desktop nav (after Dreams link, around line 152):

```typescript
{user?.tier !== 'free' && (
  <Link
    href="/clarify"
    className={cn(
      'dashboard-nav-link',
      currentPage === 'clarify' && 'dashboard-nav-link--active'
    )}
  >
    <span>💬</span>
    <span>Clarify</span>
  </Link>
)}
```

Add Clarify link in mobile nav (after Dreams link, around line 360):

```typescript
{user?.tier !== 'free' && (
  <Link
    href="/clarify"
    className={cn(
      'px-4 py-3 rounded-lg transition-all duration-300',
      currentPage === 'clarify'
        ? 'bg-white/12 text-white font-medium'
        : 'bg-white/4 text-white/70 hover:bg-white/8 hover:text-white'
    )}
  >
    <span className="mr-2">💬</span>
    Clarify
  </Link>
)}
```

### 7.2 BottomNavigation Update

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/navigation/BottomNavigation.tsx`

This component uses static NAV_ITEMS. For paid-only features, we need to make it dynamic. Update the component:

Add to imports:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare } from 'lucide-react';
```

Replace static `NAV_ITEMS` with dynamic items inside the component:

```typescript
export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const { showBottomNav } = useNavigation();
  const { user } = useAuth();

  // Build nav items dynamically based on user tier
  const navItems: NavItem[] = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dreams', icon: Sparkles, label: 'Dreams' },
    // Include Clarify only for paid users
    ...(user?.tier !== 'free' ? [{ href: '/clarify', icon: MessageSquare, label: 'Clarify' }] : []),
    { href: '/reflection', icon: Layers, label: 'Reflect' },
    { href: '/evolution', icon: TrendingUp, label: 'Evolution' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // ... rest of component, but use navItems instead of NAV_ITEMS
```

Update the map to use `navItems`:

```typescript
{navItems.map((item) => {
  // ... existing code
})}
```

---

## 8. Context Reset for Monthly Limits

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`

Update the monthly reset logic to include clarify sessions (around line 39-52):

```typescript
// Check if monthly usage needs reset
const currentMonthYear = new Date().toISOString().slice(0, 7); // "2025-01"
if (data.current_month_year !== currentMonthYear) {
  // Reset monthly counters
  await supabase
    .from('users')
    .update({
      reflection_count_this_month: 0,
      clarify_sessions_this_month: 0, // ADD THIS LINE
      current_month_year: currentMonthYear,
    })
    .eq('id', data.id);

  data.reflection_count_this_month = 0;
  data.clarify_sessions_this_month = 0; // ADD THIS LINE
  data.current_month_year = currentMonthYear;
}
```

---

## 9. File Creation Summary

### New Files to Create:

1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251210000000_clarify_agent.sql`
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts`
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt`
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`
5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx`
6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx`

### Files to Modify:

1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` - Add CLARIFY_SESSION_LIMITS
2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` - Add clarify fields
3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/index.ts` - Export clarify types
4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` - Add clarify middleware
5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts` - Register clarify router
6. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` - Add monthly reset
7. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` - Add Clarify nav link
8. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/navigation/BottomNavigation.tsx` - Add Clarify nav item

---

## 10. Implementation Order (Recommended)

### Builder 1: Database & Types (30 min)
1. Create migration file
2. Create `types/clarify.ts`
3. Update `types/user.ts`
4. Update `types/index.ts`
5. Add constants to `lib/utils/constants.ts`

### Builder 2: Backend (45 min)
1. Update `server/trpc/middleware.ts` with clarify middleware
2. Create `server/trpc/routers/clarify.ts`
3. Update `server/trpc/routers/_app.ts`
4. Update `server/trpc/context.ts`
5. Create `prompts/clarify_agent.txt`

### Builder 3: Frontend (45 min)
1. Create `app/clarify/page.tsx`
2. Create `app/clarify/[sessionId]/page.tsx`
3. Update `components/shared/AppNavigation.tsx`
4. Update `components/navigation/BottomNavigation.tsx`

---

## 11. Testing Checklist

### Database
- [ ] Migration runs without errors
- [ ] Tables created with correct columns
- [ ] RLS policies work correctly
- [ ] Triggers update message_count and title

### Backend
- [ ] Free tier blocked from all clarify endpoints
- [ ] Pro/Unlimited can create sessions
- [ ] Session limits enforced correctly
- [ ] Messages saved to database
- [ ] AI responses generated and saved
- [ ] Monthly reset works

### Frontend
- [ ] Clarify hidden from free tier navigation
- [ ] Session list loads correctly
- [ ] New session creation works
- [ ] Conversation flows smoothly
- [ ] Messages display correctly
- [ ] Input sends on Enter
- [ ] Archive/restore/delete work

---

## 12. Phase 2: Streaming Enhancement (Future)

After Phase 1 is stable, add streaming support:

### SSE Endpoint

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` (NEW FILE)

```typescript
// app/api/clarify/stream/route.ts - SSE streaming endpoint for Clarify

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET!;

// Lazy anthropic client
let anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return anthropic;
}

// Cached system prompt
let cachedSystemPrompt: string | null = null;
function getClarifySystemPrompt(): string {
  if (!cachedSystemPrompt) {
    const promptPath = path.join(process.cwd(), 'prompts', 'clarify_agent.txt');
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf8');
  }
  return cachedSystemPrompt;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Authenticate
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  // Parse request
  const { sessionId, content } = await request.json();
  if (!sessionId || !content) {
    return new Response('Missing sessionId or content', { status: 400 });
  }

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('clarify_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !session) {
    return new Response('Session not found', { status: 404 });
  }

  // Save user message
  await supabase
    .from('clarify_messages')
    .insert({
      session_id: sessionId,
      role: 'user',
      content,
    });

  // Get conversation history
  const { data: messages } = await supabase
    .from('clarify_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  const anthropicMessages = (messages || []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start streaming
  (async () => {
    let fullResponse = '';
    try {
      const client = getAnthropicClient();
      const anthropicStream = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: getClarifySystemPrompt(),
        messages: anthropicMessages,
        stream: true,
      });

      for await (const event of anthropicStream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          const data = JSON.stringify({ type: 'delta', text });
          await writer.write(encoder.encode(`data: ${data}\n\n`));
        }
      }

      // Save complete response
      await supabase
        .from('clarify_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: fullResponse,
        });

      await writer.write(encoder.encode(`data: {"type":"done"}\n\n`));
    } catch (error) {
      console.error('Streaming error:', error);
      await writer.write(encoder.encode(`data: {"type":"error","message":"Stream failed"}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Streaming Hook

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useClarifyStream.ts` (NEW FILE)

```typescript
// hooks/useClarifyStream.ts - Custom hook for SSE streaming

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseClarifyStreamResult {
  streamingText: string;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
}

export function useClarifyStream(): UseClarifyStreamResult {
  const { token } = useAuth();
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (sessionId: string, content: string) => {
    setIsStreaming(true);
    setStreamingText('');
    setError(null);

    try {
      const response = await fetch('/api/clarify/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'delta') {
                setStreamingText((prev) => prev + data.text);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Streaming failed');
    } finally {
      setIsStreaming(false);
    }
  }, [token]);

  return {
    streamingText,
    isStreaming,
    error,
    sendMessage,
  };
}
```

---

## 13. Function Calling (Phase 2)

Add `createDream` tool to the Anthropic call in `clarify.ts`:

```typescript
const tools = [{
  name: 'createDream',
  description: 'Create a new dream when the user has crystallized their vision and expressed readiness to track it. Only use when the user has explicitly agreed to create a dream.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A clear, concise title for the dream (max 200 chars)',
      },
      description: {
        type: 'string',
        description: 'A fuller description of the dream (optional, max 2000 chars)',
      },
      category: {
        type: 'string',
        enum: ['health', 'career', 'relationships', 'financial', 'personal_growth', 'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'],
        description: 'Category that best fits this dream',
      },
    },
    required: ['title'],
  },
}];
```

Handle tool use in the response:

```typescript
// Check for tool use in response
const toolUseBlock = response.content.find(block => block.type === 'tool_use');
if (toolUseBlock && toolUseBlock.type === 'tool_use' && toolUseBlock.name === 'createDream') {
  const toolInput = toolUseBlock.input as { title: string; description?: string; category?: string };

  // Create the dream
  const { data: dream, error: dreamError } = await supabase
    .from('dreams')
    .insert({
      user_id: userId,
      title: toolInput.title,
      description: toolInput.description,
      category: toolInput.category,
      pre_session_id: sessionId,
      status: 'active',
    })
    .select()
    .single();

  if (!dreamError && dream) {
    // Link dream to session
    await supabase
      .from('clarify_sessions')
      .update({ dream_id: dream.id })
      .eq('id', sessionId);
  }
}
```

---

## Conclusion

This implementation plan provides complete, copy-pasteable code for the Clarify Agent Core feature. The phased approach ensures we have a working feature quickly (non-streaming) with the option to enhance with streaming later.

Key decisions:
- Start without streaming for simplicity
- Use tRPC for main CRUD, SSE for streaming (Phase 2)
- Paid-only feature with tier-based limits
- Session titles auto-generated from first message
- Posture constraints embedded in system prompt

Follow the implementation order for best results. Each builder can work on their section independently, with minimal coordination needed.
