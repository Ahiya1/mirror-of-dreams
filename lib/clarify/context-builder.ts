// lib/clarify/context-builder.ts - Build context for Clarify conversations

import type { ClarifyPattern, ClarifyPatternRow } from '@/types/pattern';

import { CLARIFY_CONTEXT_LIMITS, PATTERN_CONSOLIDATION } from '@/lib/utils/constants';
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from '@/server/lib/cache';
import { dbLogger } from '@/server/lib/logger';
import { supabase } from '@/server/lib/supabase';

// =====================================================
// TYPES FOR CACHED DATA
// =====================================================

/**
 * Cached user context data (minimal user info for Clarify)
 */
interface CachedUserContext {
  name: string | null;
  tier: string;
  total_reflections: number;
  total_clarify_sessions: number;
}

/**
 * Cached dream data
 */
interface CachedDream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
}

/**
 * Cached pattern data
 */
interface CachedPattern {
  id: string;
  user_id: string;
  pattern_type: string;
  content: string;
  strength: number;
}

/**
 * Cached session data
 */
interface CachedSession {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

/**
 * Cached reflection data
 */
interface CachedReflection {
  id: string;
  tone: string;
  created_at: string;
}

// =====================================================
// TOKEN ESTIMATION
// =====================================================

/**
 * Estimate token count for text (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// =====================================================
// CONTEXT SECTIONS
// =====================================================

/**
 * Context sections with priority levels
 */
interface ContextSection {
  priority: number;
  content: string;
  tokens: number;
}

// =====================================================
// MAIN CONTEXT BUILDER
// =====================================================

/**
 * Build the full context for a Clarify conversation
 * Returns a string to prepend to the system prompt
 *
 * Optimizations:
 * - Cache-aside pattern for all data types
 * - Parallel query execution via Promise.all()
 * - Performance timing and logging
 */
export async function buildClarifyContext(
  userId: string,
  currentSessionId: string
): Promise<string> {
  const startTime = performance.now();
  let cacheHits = 0;
  let cacheMisses = 0;

  const budget = CLARIFY_CONTEXT_LIMITS.maxContextTokens;
  const sections: ContextSection[] = [];

  // =====================================================
  // PHASE 1: Try cache first for all data types (parallel)
  // =====================================================

  const [cachedUser, cachedDreams, cachedPatterns, cachedSessions, cachedReflections] =
    await Promise.all([
      cacheGet<CachedUserContext>(cacheKeys.userContext(userId)),
      cacheGet<CachedDream[]>(cacheKeys.dreams(userId)),
      cacheGet<CachedPattern[]>(cacheKeys.patterns(userId)),
      cacheGet<CachedSession[]>(cacheKeys.sessions(userId)),
      cacheGet<CachedReflection[]>(cacheKeys.reflections(userId)),
    ]);

  // Track hits/misses
  if (cachedUser) cacheHits++;
  else cacheMisses++;
  if (cachedDreams) cacheHits++;
  else cacheMisses++;
  if (cachedPatterns) cacheHits++;
  else cacheMisses++;
  if (cachedSessions) cacheHits++;
  else cacheMisses++;
  if (cachedReflections) cacheHits++;
  else cacheMisses++;

  // =====================================================
  // PHASE 2: Fetch missing data from database (parallel)
  // =====================================================

  const dbQueries: PromiseLike<any>[] = [];
  const queryIndices: string[] = [];

  if (!cachedUser) {
    queryIndices.push('user');
    dbQueries.push(
      supabase
        .from('users')
        .select('name, tier, total_reflections, total_clarify_sessions')
        .eq('id', userId)
        .single()
        .then((result) => result)
    );
  }

  if (!cachedDreams) {
    queryIndices.push('dreams');
    dbQueries.push(
      supabase
        .from('dreams')
        .select('id, title, description, status, category')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(CLARIFY_CONTEXT_LIMITS.maxDreams)
        .then((result) => result)
    );
  }

  if (!cachedPatterns) {
    queryIndices.push('patterns');
    dbQueries.push(
      supabase
        .from('clarify_patterns')
        .select('id, user_id, pattern_type, content, strength')
        .eq('user_id', userId)
        .gte('strength', PATTERN_CONSOLIDATION.minStrengthThreshold)
        .order('strength', { ascending: false })
        .limit(CLARIFY_CONTEXT_LIMITS.maxPatterns)
        .then((result) => result)
    );
  }

  if (!cachedSessions) {
    queryIndices.push('sessions');
    dbQueries.push(
      supabase
        .from('clarify_sessions')
        .select('id, title, created_at, message_count')
        .eq('user_id', userId)
        .neq('id', currentSessionId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(CLARIFY_CONTEXT_LIMITS.maxCrossSessions)
        .then((result) => result)
    );
  }

  if (!cachedReflections) {
    queryIndices.push('reflections');
    dbQueries.push(
      supabase
        .from('reflections')
        .select('id, tone, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(CLARIFY_CONTEXT_LIMITS.maxReflections)
        .then((result) => result)
    );
  }

  // Execute all DB queries in parallel
  const dbResults = dbQueries.length > 0 ? await Promise.all(dbQueries) : [];

  // =====================================================
  // PHASE 3: Map results and populate cache
  // =====================================================

  let user = cachedUser;
  let dreams = cachedDreams;
  let patterns = cachedPatterns;
  let recentSessions = cachedSessions;
  let reflections = cachedReflections;

  for (let i = 0; i < queryIndices.length; i++) {
    const type = queryIndices[i];
    const result = dbResults[i];

    if (type === 'user' && result.data) {
      user = result.data as CachedUserContext;
      // Fire-and-forget cache population
      cacheSet(cacheKeys.userContext(userId), result.data, { ttl: CACHE_TTL.USER_CONTEXT });
    } else if (type === 'dreams' && result.data) {
      dreams = result.data as CachedDream[];
      cacheSet(cacheKeys.dreams(userId), result.data, { ttl: CACHE_TTL.DREAMS });
    } else if (type === 'patterns' && result.data) {
      patterns = result.data as CachedPattern[];
      cacheSet(cacheKeys.patterns(userId), result.data, { ttl: CACHE_TTL.PATTERNS });
    } else if (type === 'sessions' && result.data) {
      recentSessions = result.data as CachedSession[];
      cacheSet(cacheKeys.sessions(userId), result.data, { ttl: CACHE_TTL.SESSIONS });
    } else if (type === 'reflections' && result.data) {
      reflections = result.data as CachedReflection[];
      cacheSet(cacheKeys.reflections(userId), result.data, { ttl: CACHE_TTL.REFLECTIONS });
    }
  }

  // =====================================================
  // PHASE 4: Build context sections
  // =====================================================

  // 1. User context (always include - minimal tokens)
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

  // 2. Active dreams (high priority)
  if (dreams && dreams.length > 0) {
    const dreamsContext = `[Active Dreams]
${dreams.map((d) => `- "${d.title}" (${d.category || 'general'}): ${d.description?.slice(0, 100) || 'No description'}${d.description && d.description.length > 100 ? '...' : ''}`).join('\n')}`;
    sections.push({
      priority: 2,
      content: dreamsContext,
      tokens: estimateTokens(dreamsContext),
    });
  }

  // 3. Patterns (high priority - the memory layer)
  if (patterns && patterns.length > 0) {
    const patternLabels: Record<string, string> = {
      recurring_theme: 'Recurring Theme',
      tension: 'Inner Tension',
      potential_dream: 'Potential Dream',
      identity_signal: 'Identity Signal',
    };

    const patternsContext = `[Patterns Observed]
${patterns.map((p) => `- ${patternLabels[p.pattern_type] || p.pattern_type}: ${p.content}`).join('\n')}`;
    sections.push({
      priority: 2,
      content: patternsContext,
      tokens: estimateTokens(patternsContext),
    });
  }

  // 4. Recent sessions (medium priority)
  if (recentSessions && recentSessions.length > 0) {
    const sessionsContext = `[Recent Conversations]
${recentSessions.map((s) => `- "${s.title}" (${s.message_count} messages)`).join('\n')}`;
    sections.push({
      priority: 3,
      content: sessionsContext,
      tokens: estimateTokens(sessionsContext),
    });
  }

  // 5. Recent reflections (medium priority)
  if (reflections && reflections.length > 0) {
    const reflectionsContext = `[Recent Reflections]
${reflections.length} reflection${reflections.length > 1 ? 's' : ''} in the last period, using tones: ${[...new Set(reflections.map((r) => r.tone))].join(', ')}`;
    sections.push({
      priority: 4,
      content: reflectionsContext,
      tokens: estimateTokens(reflectionsContext),
    });
  }

  // =====================================================
  // PHASE 5: Build final context respecting token budget
  // =====================================================

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

  // =====================================================
  // PHASE 6: Log performance metrics
  // =====================================================

  const duration = Math.round(performance.now() - startTime);

  dbLogger.info(
    {
      operation: 'clarify.buildContext',
      userId,
      sessionId: currentSessionId,
      durationMs: duration,
      cacheHits,
      cacheMisses,
      sectionsIncluded: includedSections.length,
      tokensUsed: usedTokens,
    },
    'Context build complete'
  );

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

// =====================================================
// PATTERN RETRIEVAL
// =====================================================

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

// =====================================================
// EXPORTED TYPES FOR TESTS
// =====================================================

export type { CachedUserContext, CachedDream, CachedPattern, CachedSession, CachedReflection };
