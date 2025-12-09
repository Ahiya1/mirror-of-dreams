# Implementation Plan - Iteration 25: Memory Layer & Polish

## Executive Summary

This iteration completes the Clarify Agent by adding the memory layer that transforms it from a stateless chatbot into a context-aware companion. The implementation adds pattern extraction (via Haiku), cross-session context building, and integration with the broader Mirror of Dreams experience.

**Estimated Time:** 8-12 hours across 4 parallel builders
**Risk Level:** MEDIUM
**Dependencies:** Iteration 24 (Clarify Agent Core) - COMPLETE

---

## Success Criteria

- [ ] Patterns are extracted from Clarify sessions via Haiku
- [ ] Context builder injects user history into each conversation
- [ ] Cron job runs nightly to consolidate patterns
- [ ] Dashboard shows Clarify stats for paid users
- [ ] Profile page displays Clarify usage
- [ ] Mobile experience is polished

---

## 1. Database Migration

**File:** `supabase/migrations/20251211000000_clarify_memory_layer.sql`

### Schema Changes

```sql
-- =====================================================
-- CLARIFY PATTERNS TABLE
-- Stores extracted patterns from user conversations
-- =====================================================

CREATE TABLE public.clarify_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.clarify_sessions(id) ON DELETE SET NULL,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
    content TEXT NOT NULL,
    strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_clarify_patterns_user_id ON public.clarify_patterns(user_id);
CREATE INDEX idx_clarify_patterns_type ON public.clarify_patterns(pattern_type);
CREATE INDEX idx_clarify_patterns_strength ON public.clarify_patterns(strength DESC);
CREATE INDEX idx_clarify_patterns_session ON public.clarify_patterns(session_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.clarify_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own patterns
CREATE POLICY "Users can view own patterns"
  ON public.clarify_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all patterns (for consolidation job)
CREATE POLICY "Service can insert patterns"
  ON public.clarify_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update patterns"
  ON public.clarify_patterns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can delete patterns"
  ON public.clarify_patterns FOR DELETE
  USING (true);

-- =====================================================
-- ADD CONSOLIDATED FLAG TO MESSAGES
-- =====================================================

ALTER TABLE public.clarify_messages
ADD COLUMN IF NOT EXISTS consolidated BOOLEAN DEFAULT FALSE;

-- Index for finding unconsolidated messages
CREATE INDEX IF NOT EXISTS idx_clarify_messages_consolidated
ON public.clarify_messages(consolidated) WHERE consolidated = FALSE;

-- =====================================================
-- UPDATE TRIGGER FOR PATTERNS
-- =====================================================

CREATE OR REPLACE FUNCTION update_clarify_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clarify_patterns_updated_at
    BEFORE UPDATE ON public.clarify_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_clarify_patterns_updated_at();
```

---

## 2. Type Definitions

**File:** `types/pattern.ts`

```typescript
// types/pattern.ts - Clarify pattern types

export type PatternType = 'recurring_theme' | 'tension' | 'potential_dream' | 'identity_signal';

/**
 * Clarify Pattern - Extracted insight from conversations
 */
export interface ClarifyPattern {
  id: string;
  userId: string;
  sessionId: string | null;
  patternType: PatternType;
  content: string;
  strength: number;
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row type
 */
export interface ClarifyPatternRow {
  id: string;
  user_id: string;
  session_id: string | null;
  pattern_type: string;
  content: string;
  strength: number;
  extracted_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to ClarifyPattern
 */
export function clarifyPatternRowToPattern(row: ClarifyPatternRow): ClarifyPattern {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    patternType: row.pattern_type as PatternType,
    content: row.content,
    strength: row.strength,
    extractedAt: row.extracted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Pattern extraction result from Haiku
 */
export interface ExtractedPattern {
  type: PatternType;
  content: string;
  strength: number;
}

/**
 * Consolidation result
 */
export interface ConsolidationResult {
  userId: string;
  patternsExtracted: number;
  messagesProcessed: number;
  success: boolean;
  error?: string;
}
```

---

## 3. Constants Update

**File:** `lib/utils/constants.ts` (ADD to existing file)

```typescript
// Add after CLARIFY_SESSION_LIMITS

/**
 * Clarify context limits for token budget management
 */
export const CLARIFY_CONTEXT_LIMITS = {
  maxContextTokens: 8000,      // Max tokens for injected context
  maxRecentMessages: 20,       // Recent messages from current session (already handled)
  maxCrossSessions: 3,         // Other sessions to reference
  maxPatterns: 10,             // Patterns to include
  maxDreams: 5,                // Active dreams to include
  maxReflections: 3,           // Recent reflections to include
} as const;

/**
 * Pattern consolidation settings
 */
export const PATTERN_CONSOLIDATION = {
  minMessagesForConsolidation: 5,  // Minimum user messages before consolidation
  maxMessagesPerBatch: 50,         // Max messages to process at once
  strengthDecayDays: 30,           // Days before strength starts decaying
  minStrengthThreshold: 3,         // Minimum strength to include in context
} as const;
```

---

## 4. Pattern Consolidation Library

**File:** `lib/clarify/consolidation.ts`

### Implementation

```typescript
// lib/clarify/consolidation.ts - Pattern extraction and consolidation

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/server/lib/supabase';
import { PATTERN_CONSOLIDATION } from '@/lib/utils/constants';
import type { ExtractedPattern, ConsolidationResult, PatternType } from '@/types/pattern';

// Lazy Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// Pattern extraction prompt for Haiku
const CONSOLIDATION_PROMPT = `You are analyzing Clarify conversation messages to extract patterns.

Review these messages from a user exploring their dreams and aspirations. Identify:

1. RECURRING_THEMES: Topics, ideas, or concerns that appear multiple times
2. TENSIONS: Internal conflicts, contradictions, or stuck points the user is wrestling with
3. POTENTIAL_DREAMS: Aspirations or goals that haven't been formally declared as dreams
4. IDENTITY_SIGNALS: How they see themselves, their values, their growth edges

For each pattern found, provide:
- type: One of the four types above (use snake_case)
- content: A brief description (1-2 sentences max)
- strength: 1-10 based on frequency/intensity in the messages

Return ONLY a valid JSON array of patterns. No explanation, no markdown:
[
  {"type": "recurring_theme", "content": "...", "strength": 7},
  {"type": "tension", "content": "...", "strength": 5}
]

If no clear patterns emerge, return an empty array: []

MESSAGES TO ANALYZE:
{messages}`;

/**
 * Extract patterns from a batch of messages using Haiku
 */
export async function extractPatternsFromSession(
  sessionId: string,
  messages: Array<{ id: string; content: string; role: string }>
): Promise<ExtractedPattern[]> {
  // Filter to user messages only (assistant messages don't reveal patterns)
  const userMessages = messages.filter(m => m.role === 'user');

  if (userMessages.length < PATTERN_CONSOLIDATION.minMessagesForConsolidation) {
    return [];
  }

  // Format messages for the prompt
  const formattedMessages = userMessages
    .map(m => m.content)
    .join('\n---\n');

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system: 'You are a pattern extraction assistant. Output valid JSON only. No markdown, no explanation.',
      messages: [{
        role: 'user',
        content: CONSOLIDATION_PROMPT.replace('{messages}', formattedMessages)
      }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error('No text response from Haiku');
      return [];
    }

    // Parse and validate patterns
    const parsed = JSON.parse(textBlock.text);
    if (!Array.isArray(parsed)) {
      console.error('Invalid pattern response: not an array');
      return [];
    }

    // Validate each pattern
    const validTypes: PatternType[] = ['recurring_theme', 'tension', 'potential_dream', 'identity_signal'];
    const validPatterns: ExtractedPattern[] = parsed
      .filter((p: any) =>
        p.type &&
        validTypes.includes(p.type) &&
        p.content &&
        typeof p.content === 'string' &&
        typeof p.strength === 'number' &&
        p.strength >= 1 &&
        p.strength <= 10
      )
      .map((p: any) => ({
        type: p.type as PatternType,
        content: p.content.slice(0, 500), // Limit content length
        strength: Math.round(p.strength),
      }));

    return validPatterns;
  } catch (error) {
    console.error('Pattern extraction failed:', error);
    return [];
  }
}

/**
 * Consolidate patterns for a specific user
 */
export async function consolidateUserPatterns(userId: string): Promise<ConsolidationResult> {
  try {
    // 1. Get user's sessions with unconsolidated messages
    const { data: sessions, error: sessionsError } = await supabase
      .from('clarify_sessions')
      .select('id')
      .eq('user_id', userId);

    if (sessionsError || !sessions?.length) {
      return {
        userId,
        patternsExtracted: 0,
        messagesProcessed: 0,
        success: true,
      };
    }

    const sessionIds = sessions.map(s => s.id);

    // 2. Get unconsolidated messages
    const { data: messages, error: messagesError } = await supabase
      .from('clarify_messages')
      .select('id, content, role, session_id')
      .in('session_id', sessionIds)
      .eq('consolidated', false)
      .order('created_at', { ascending: true })
      .limit(PATTERN_CONSOLIDATION.maxMessagesPerBatch);

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    if (!messages || messages.length === 0) {
      return {
        userId,
        patternsExtracted: 0,
        messagesProcessed: 0,
        success: true,
      };
    }

    // 3. Group messages by session and extract patterns
    const messagesBySession = new Map<string, typeof messages>();
    for (const msg of messages) {
      const sessionMessages = messagesBySession.get(msg.session_id) || [];
      sessionMessages.push(msg);
      messagesBySession.set(msg.session_id, sessionMessages);
    }

    let totalPatterns = 0;

    // 4. Extract patterns from each session
    for (const [sessionId, sessionMessages] of messagesBySession) {
      const patterns = await extractPatternsFromSession(sessionId, sessionMessages);

      // 5. Insert patterns into database
      for (const pattern of patterns) {
        const { error: insertError } = await supabase
          .from('clarify_patterns')
          .insert({
            user_id: userId,
            session_id: sessionId,
            pattern_type: pattern.type,
            content: pattern.content,
            strength: pattern.strength,
          });

        if (insertError) {
          console.error('Failed to insert pattern:', insertError);
        } else {
          totalPatterns++;
        }
      }
    }

    // 6. Mark messages as consolidated
    const messageIds = messages.map(m => m.id);
    const { error: updateError } = await supabase
      .from('clarify_messages')
      .update({ consolidated: true })
      .in('id', messageIds);

    if (updateError) {
      console.error('Failed to mark messages as consolidated:', updateError);
    }

    return {
      userId,
      patternsExtracted: totalPatterns,
      messagesProcessed: messages.length,
      success: true,
    };
  } catch (error) {
    console.error(`Consolidation failed for user ${userId}:`, error);
    return {
      userId,
      patternsExtracted: 0,
      messagesProcessed: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark specific messages as consolidated
 */
export async function markMessagesConsolidated(messageIds: string[]): Promise<boolean> {
  if (messageIds.length === 0) return true;

  const { error } = await supabase
    .from('clarify_messages')
    .update({ consolidated: true })
    .in('id', messageIds);

  if (error) {
    console.error('Failed to mark messages as consolidated:', error);
    return false;
  }

  return true;
}
```

---

## 5. Context Builder

**File:** `lib/clarify/context-builder.ts`

### Implementation

```typescript
// lib/clarify/context-builder.ts - Build context for Clarify conversations

import { supabase } from '@/server/lib/supabase';
import { CLARIFY_CONTEXT_LIMITS, PATTERN_CONSOLIDATION } from '@/lib/utils/constants';
import type { ClarifyPattern, ClarifyPatternRow, clarifyPatternRowToPattern } from '@/types/pattern';

/**
 * Estimate token count for text (rough approximation)
 * ~4 characters per token for English text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Context sections with priority levels
 */
interface ContextSection {
  priority: number;
  content: string;
  tokens: number;
}

/**
 * Build the full context for a Clarify conversation
 * Returns a string to prepend to the system prompt
 */
export async function buildClarifyContext(
  userId: string,
  currentSessionId: string
): Promise<string> {
  const budget = CLARIFY_CONTEXT_LIMITS.maxContextTokens;
  const sections: ContextSection[] = [];

  // 1. Fetch user data (always include - minimal tokens)
  const { data: user } = await supabase
    .from('users')
    .select('name, tier, total_reflections, total_clarify_sessions')
    .eq('id', userId)
    .single();

  if (user) {
    const userContext = `[User Context]
Name: ${user.name}
Experience: ${user.total_reflections || 0} reflections, ${user.total_clarify_sessions || 0} Clarify sessions`;
    sections.push({
      priority: 1,
      content: userContext,
      tokens: estimateTokens(userContext),
    });
  }

  // 2. Fetch active dreams (high priority)
  const { data: dreams } = await supabase
    .from('dreams')
    .select('id, title, description, status, category')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxDreams);

  if (dreams && dreams.length > 0) {
    const dreamsContext = `[Active Dreams]
${dreams.map(d => `- "${d.title}" (${d.category || 'general'}): ${d.description?.slice(0, 100) || 'No description'}${d.description && d.description.length > 100 ? '...' : ''}`).join('\n')}`;
    sections.push({
      priority: 2,
      content: dreamsContext,
      tokens: estimateTokens(dreamsContext),
    });
  }

  // 3. Fetch patterns (high priority - the memory layer)
  const { data: patterns } = await supabase
    .from('clarify_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('strength', PATTERN_CONSOLIDATION.minStrengthThreshold)
    .order('strength', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxPatterns);

  if (patterns && patterns.length > 0) {
    const patternLabels: Record<string, string> = {
      recurring_theme: 'Recurring Theme',
      tension: 'Inner Tension',
      potential_dream: 'Potential Dream',
      identity_signal: 'Identity Signal',
    };

    const patternsContext = `[Patterns Observed]
${patterns.map(p => `- ${patternLabels[p.pattern_type] || p.pattern_type}: ${p.content}`).join('\n')}`;
    sections.push({
      priority: 2,
      content: patternsContext,
      tokens: estimateTokens(patternsContext),
    });
  }

  // 4. Fetch recent sessions (medium priority)
  const { data: recentSessions } = await supabase
    .from('clarify_sessions')
    .select('id, title, created_at, message_count')
    .eq('user_id', userId)
    .neq('id', currentSessionId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxCrossSessions);

  if (recentSessions && recentSessions.length > 0) {
    const sessionsContext = `[Recent Conversations]
${recentSessions.map(s => `- "${s.title}" (${s.message_count} messages)`).join('\n')}`;
    sections.push({
      priority: 3,
      content: sessionsContext,
      tokens: estimateTokens(sessionsContext),
    });
  }

  // 5. Fetch recent reflections (medium priority)
  const { data: reflections } = await supabase
    .from('reflections')
    .select('id, tone, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(CLARIFY_CONTEXT_LIMITS.maxReflections);

  // Get associated dreams for context
  if (reflections && reflections.length > 0) {
    const reflectionsContext = `[Recent Reflections]
${reflections.length} reflection${reflections.length > 1 ? 's' : ''} in the last period, using tones: ${[...new Set(reflections.map(r => r.tone))].join(', ')}`;
    sections.push({
      priority: 4,
      content: reflectionsContext,
      tokens: estimateTokens(reflectionsContext),
    });
  }

  // 6. Build final context respecting token budget
  // Sort by priority (lower number = higher priority)
  sections.sort((a, b) => a.priority - b.priority);

  let usedTokens = 0;
  const includedSections: string[] = [];

  for (const section of sections) {
    if (usedTokens + section.tokens <= budget) {
      includedSections.push(section.content);
      usedTokens += section.tokens;
    } else {
      // Try to include a truncated version if high priority
      if (section.priority <= 2 && usedTokens < budget * 0.9) {
        const availableTokens = budget - usedTokens;
        const truncatedContent = section.content.slice(0, availableTokens * 4);
        if (truncatedContent.length > 50) {
          includedSections.push(truncatedContent + '...');
          usedTokens += estimateTokens(truncatedContent);
        }
      }
      // Skip lower priority sections if budget exceeded
    }
  }

  if (includedSections.length === 0) {
    return '';
  }

  return `
---
CONTEXT ABOUT THIS USER (use naturally, don't mention explicitly):
${includedSections.join('\n\n')}
---

`;
}

/**
 * Get user's patterns for display
 */
export async function getUserPatterns(userId: string): Promise<ClarifyPattern[]> {
  const { data, error } = await supabase
    .from('clarify_patterns')
    .select('*')
    .eq('user_id', userId)
    .order('strength', { ascending: false })
    .limit(20);

  if (error || !data) {
    console.error('Failed to fetch patterns:', error);
    return [];
  }

  return data.map((row: ClarifyPatternRow) => ({
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    patternType: row.pattern_type as any,
    content: row.content,
    strength: row.strength,
    extractedAt: row.extracted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
```

---

## 6. Cron Job

**File:** `app/api/cron/consolidate-patterns/route.ts`

### Implementation

```typescript
// app/api/cron/consolidate-patterns/route.ts
// Vercel cron job for nightly pattern consolidation

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase';
import { consolidateUserPatterns } from '@/lib/clarify/consolidation';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

/**
 * GET /api/cron/consolidate-patterns
 *
 * Vercel cron job that runs nightly to extract patterns from
 * Clarify conversations. Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[Consolidation] Starting pattern consolidation job');

  try {
    // Find users with unconsolidated messages
    const { data: usersWithMessages, error: queryError } = await supabase
      .from('clarify_messages')
      .select(`
        session:clarify_sessions!inner(user_id)
      `)
      .eq('consolidated', false)
      .limit(100);

    if (queryError) {
      throw new Error(`Failed to query users: ${queryError.message}`);
    }

    // Extract unique user IDs
    const userIds = [...new Set(
      (usersWithMessages || [])
        .map((m: any) => m.session?.user_id)
        .filter(Boolean)
    )];

    console.log(`[Consolidation] Found ${userIds.length} users with unconsolidated messages`);

    // Process each user
    const results = [];
    for (const userId of userIds) {
      const result = await consolidateUserPatterns(userId as string);
      results.push(result);

      // Log progress
      if (result.success) {
        console.log(`[Consolidation] User ${userId}: ${result.patternsExtracted} patterns from ${result.messagesProcessed} messages`);
      } else {
        console.error(`[Consolidation] User ${userId}: FAILED - ${result.error}`);
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalPatterns = results.reduce((sum, r) => sum + r.patternsExtracted, 0);
    const totalMessages = results.reduce((sum, r) => sum + r.messagesProcessed, 0);

    console.log(`[Consolidation] Complete in ${duration}ms: ${successCount}/${userIds.length} users, ${totalPatterns} patterns, ${totalMessages} messages`);

    return NextResponse.json({
      success: true,
      duration,
      usersProcessed: userIds.length,
      successCount,
      totalPatterns,
      totalMessages,
      results: results.map(r => ({
        userId: r.userId.slice(0, 8) + '...', // Truncate for privacy
        success: r.success,
        patterns: r.patternsExtracted,
        messages: r.messagesProcessed,
      })),
    });
  } catch (error) {
    console.error('[Consolidation] Job failed:', error);
    return NextResponse.json(
      {
        error: 'Consolidation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### Vercel Configuration Update

**File:** `vercel.json` (UPDATE)

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/consolidate-patterns",
      "schedule": "0 3 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Required Environment Variable:** Add `CRON_SECRET` to Vercel environment.

---

## 7. Router Updates

**File:** `server/trpc/routers/clarify.ts` (UPDATE)

### Changes Required

1. **Import context builder:**
```typescript
import { buildClarifyContext, getUserPatterns } from '@/lib/clarify/context-builder';
```

2. **Update sendMessage mutation to include context:**

In the `sendMessage` mutation, after getting messages and before calling Claude:

```typescript
// After: const anthropicMessages = messages.map(...)
// Before: const client = getAnthropicClient();

// Build context for this user
const context = await buildClarifyContext(userId, input.sessionId);

// Modify system prompt with context
const systemPrompt = context + getClarifySystemPrompt();

// Then use systemPrompt instead of getClarifySystemPrompt() in the Claude call
```

3. **Add getPatterns query:**

```typescript
// Get user's extracted patterns
getPatterns: clarifyProcedure
  .query(async ({ ctx }) => {
    const patterns = await getUserPatterns(ctx.user.id);
    return { patterns };
  }),
```

4. **Update createSession to use context for initial message:**

Similar to sendMessage - inject context when generating initial response.

---

## 8. Frontend Components

### 8.1 ClarifyCard Component

**File:** `components/dashboard/cards/ClarifyCard.tsx`

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  HeaderAction,
} from '@/components/dashboard/shared/DashboardCard';
import { CosmicLoader, GlowButton } from '@/components/ui/glass';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { CLARIFY_SESSION_LIMITS } from '@/lib/utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ClarifyCardProps {
  animated?: boolean;
  className?: string;
}

/**
 * Clarify sessions card for dashboard
 * Only shown to paid users (Pro/Unlimited)
 */
const ClarifyCard: React.FC<ClarifyCardProps> = ({ animated = true, className = '' }) => {
  const { user } = useAuth();

  // Don't render for free tier
  if (!user || (user.tier === 'free' && !user.isCreator && !user.isAdmin)) {
    return null;
  }

  // Fetch limits and recent sessions
  const { data: limits, isLoading: limitsLoading } = trpc.clarify.getLimits.useQuery();
  const { data: sessionsData, isLoading: sessionsLoading } = trpc.clarify.listSessions.useQuery({
    status: 'active',
    limit: 3,
  });

  const isLoading = limitsLoading || sessionsLoading;
  const sessions = sessionsData?.sessions || [];
  const limit = CLARIFY_SESSION_LIMITS[user.tier];

  // Empty state
  const EmptyState = () => (
    <div className="empty-state">
      <Sparkles className="w-8 h-8 text-purple-400/60 mb-2" />
      <h4>Start Exploring</h4>
      <p>Begin a Clarify session to explore what's emerging.</p>
      <Link href="/clarify">
        <GlowButton variant="cosmic" size="sm">Start Session</GlowButton>
      </Link>
    </div>
  );

  return (
    <DashboardCard
      className={`clarify-card ${className}`}
      isLoading={isLoading}
      animated={animated}
      animationDelay={300}
      hoverable={true}
    >
      <CardHeader>
        <CardTitle>
          <MessageCircle className="w-5 h-5 inline-block mr-2 text-purple-400" />
          Clarify Sessions
        </CardTitle>
        <HeaderAction href="/clarify">
          View All <span className="ml-1">→</span>
        </HeaderAction>
      </CardHeader>

      <CardContent>
        {/* Usage indicator */}
        <div className="usage-bar">
          <div className="usage-text">
            <span className="usage-count">{limits?.sessionsUsed || 0}</span>
            <span className="usage-limit"> / {limit} this month</span>
          </div>
          <div className="usage-progress">
            <div
              className="usage-fill"
              style={{
                width: `${Math.min(100, ((limits?.sessionsUsed || 0) / limit) * 100)}%`
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <CosmicLoader size="sm" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/clarify/${session.id}`}
                className="session-item"
              >
                <div className="session-title">{session.title}</div>
                <div className="session-meta">
                  {session.messageCount} messages
                  <span className="session-dot">·</span>
                  {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .usage-bar {
          margin-bottom: var(--space-4);
        }

        .usage-text {
          display: flex;
          align-items: baseline;
          margin-bottom: var(--space-2);
        }

        .usage-count {
          font-size: var(--text-2xl);
          font-weight: var(--font-semibold);
          color: var(--cosmic-text);
        }

        .usage-limit {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin-left: var(--space-1);
        }

        .usage-progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--purple-500), var(--purple-400));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .session-item {
          display: block;
          padding: var(--space-3);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
        }

        .session-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .session-title {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--cosmic-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: var(--space-1);
        }

        .session-meta {
          font-size: var(--text-xs);
          color: var(--cosmic-text-muted);
        }

        .session-dot {
          margin: 0 var(--space-1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-lg) var(--space-md);
          min-height: 150px;
        }

        .empty-state h4 {
          font-size: var(--text-base);
          color: var(--cosmic-text);
          margin: var(--space-2) 0;
        }

        .empty-state p {
          font-size: var(--text-sm);
          color: var(--cosmic-text-muted);
          margin-bottom: var(--space-4);
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: var(--space-lg);
        }
      `}</style>
    </DashboardCard>
  );
};

export default ClarifyCard;
```

### 8.2 Dashboard Update

**File:** `app/dashboard/page.tsx` (UPDATE)

Add import:
```typescript
import ClarifyCard from '@/components/dashboard/cards/ClarifyCard';
```

Add to grid (after VisualizationCard, before SubscriptionCard):
```tsx
{/* Clarify Card - paid users only */}
{user && user.tier !== 'free' && (
  <div style={getItemStyles(6)}>
    <ClarifyCard animated={true} />
  </div>
)}

<div style={getItemStyles(user && user.tier !== 'free' ? 7 : 6)}>
  <SubscriptionCard animated={true} />
</div>
```

Update stagger animation count:
```typescript
// Update the count based on user tier
const itemCount = user && user.tier !== 'free' ? 8 : 7;
const { containerRef, getItemStyles } = useStaggerAnimation(itemCount, {
```

### 8.3 Profile Page Update

**File:** `app/profile/page.tsx` (UPDATE)

Add Clarify stats to Usage Statistics section:

```tsx
{/* Inside Usage Statistics GlassCard, after Total Reflections */}

{user?.tier !== 'free' && (
  <>
    <div>
      <label className="text-sm text-white/60 block mb-1">Clarify Sessions This Month</label>
      <p className="text-lg text-white">
        {user?.clarifySessionsThisMonth} / {user?.tier === 'pro' ? '20' : '30'}
      </p>
    </div>

    <div>
      <label className="text-sm text-white/60 block mb-1">Total Clarify Sessions</label>
      <p className="text-lg text-white">{user?.totalClarifySessions}</p>
    </div>
  </>
)}
```

### 8.4 Mobile Polish

**File:** `app/clarify/[sessionId]/page.tsx` (UPDATE)

Update input area for better mobile experience:

```tsx
{/* Input Area - UPDATED */}
<div className="px-4 sm:px-8 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6">
  <div className="max-w-3xl mx-auto">
    <GlassCard className="flex items-end gap-3">
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind?"
        rows={1}
        inputMode="text"
        enterKeyHint="send"
        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 resize-none max-h-32 text-base"
        style={{
          minHeight: '24px',
          fontSize: '16px', // Prevents iOS zoom on focus
        }}
        disabled={sendMessage.isPending}
      />
      <GlowButton
        variant="primary"
        size="sm"
        onClick={handleSend}
        disabled={!inputValue.trim() || sendMessage.isPending}
        className="shrink-0 min-w-[44px] min-h-[44px]"
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
```

---

## 9. Builder Assignments

### Builder 1: Database + Types + Constants
**Complexity:** LOW
**Estimated Time:** 1-2 hours

**Files to create/modify:**
- `supabase/migrations/20251211000000_clarify_memory_layer.sql` (NEW)
- `types/pattern.ts` (NEW)
- `lib/utils/constants.ts` (UPDATE - add CLARIFY_CONTEXT_LIMITS, PATTERN_CONSOLIDATION)

**Success Criteria:**
- [ ] Migration creates clarify_patterns table with correct schema
- [ ] Migration adds consolidated column to clarify_messages
- [ ] RLS policies are correct
- [ ] Type definitions match database schema
- [ ] Constants are exported correctly

**Dependencies:** None
**Blocks:** Builder 2, Builder 3

---

### Builder 2: Context Builder + Consolidation Library
**Complexity:** HIGH
**Estimated Time:** 3-4 hours

**Files to create:**
- `lib/clarify/consolidation.ts` (NEW)
- `lib/clarify/context-builder.ts` (NEW)

**Success Criteria:**
- [ ] extractPatternsFromSession calls Haiku and parses response
- [ ] consolidateUserPatterns processes messages and creates patterns
- [ ] buildClarifyContext respects token budget
- [ ] Context includes user, dreams, patterns, sessions, reflections
- [ ] Error handling is robust

**Dependencies:** Builder 1 (types, constants)
**Blocks:** Builder 3

---

### Builder 3: Cron Job + Router Updates
**Complexity:** MEDIUM
**Estimated Time:** 2-3 hours

**Files to create/modify:**
- `app/api/cron/consolidate-patterns/route.ts` (NEW)
- `vercel.json` (UPDATE - add crons)
- `server/trpc/routers/clarify.ts` (UPDATE - add context, getPatterns)

**Success Criteria:**
- [ ] Cron endpoint validates CRON_SECRET
- [ ] Cron processes users with unconsolidated messages
- [ ] vercel.json has correct cron configuration
- [ ] sendMessage injects context into system prompt
- [ ] getPatterns query returns user's patterns

**Dependencies:** Builder 2 (consolidation, context-builder)
**Blocks:** None

---

### Builder 4: Frontend (ClarifyCard, Dashboard, Profile, Mobile)
**Complexity:** MEDIUM
**Estimated Time:** 2-3 hours

**Files to create/modify:**
- `components/dashboard/cards/ClarifyCard.tsx` (NEW)
- `app/dashboard/page.tsx` (UPDATE - add ClarifyCard)
- `app/profile/page.tsx` (UPDATE - add Clarify stats)
- `app/clarify/[sessionId]/page.tsx` (UPDATE - mobile polish)

**Success Criteria:**
- [ ] ClarifyCard shows usage and recent sessions
- [ ] ClarifyCard only renders for paid users
- [ ] Dashboard includes ClarifyCard in grid
- [ ] Profile shows Clarify session stats
- [ ] Mobile input has proper safe area padding
- [ ] Mobile input prevents iOS zoom (16px font)
- [ ] Touch targets are at least 44px

**Dependencies:** None (can work in parallel)
**Blocks:** None

---

## 10. Integration Notes

### Environment Variables Required
- `CRON_SECRET` - Random string for cron authentication (add to Vercel)

### Testing Checklist
- [ ] Run migration locally and verify tables created
- [ ] Test pattern extraction with sample messages
- [ ] Test context builder output format
- [ ] Test cron endpoint with valid/invalid auth
- [ ] Test ClarifyCard rendering for each tier
- [ ] Test mobile input on iOS Safari
- [ ] Test full flow: messages -> consolidation -> context injection

### Post-Deployment
1. Set `CRON_SECRET` in Vercel environment
2. Verify cron job appears in Vercel dashboard
3. Monitor first cron run in logs
4. Verify patterns are being extracted

---

## 11. Risk Assessment

### High Risk
**Pattern Quality from Haiku**
- Mitigation: Validate JSON structure, cap content length, filter invalid patterns
- Fallback: Empty patterns don't break anything

### Medium Risk
**Token Budget Overflow**
- Mitigation: Hard cap at 8000 tokens, priority-based inclusion
- Monitoring: Log when budget is exceeded

### Low Risk
**Cron Job Timing**
- Mitigation: 60-second timeout, batch processing
- Monitoring: Log duration and results

---

## 12. File Summary

### New Files (6)
1. `supabase/migrations/20251211000000_clarify_memory_layer.sql`
2. `types/pattern.ts`
3. `lib/clarify/consolidation.ts`
4. `lib/clarify/context-builder.ts`
5. `app/api/cron/consolidate-patterns/route.ts`
6. `components/dashboard/cards/ClarifyCard.tsx`

### Modified Files (5)
1. `lib/utils/constants.ts`
2. `vercel.json`
3. `server/trpc/routers/clarify.ts`
4. `app/dashboard/page.tsx`
5. `app/profile/page.tsx`
6. `app/clarify/[sessionId]/page.tsx`

---

**Plan Status:** COMPLETE
**Created:** 2025-12-09
**Iteration:** 25 - Memory Layer & Polish
