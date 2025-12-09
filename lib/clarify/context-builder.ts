// lib/clarify/context-builder.ts - Build context for Clarify conversations

import { supabase } from '@/server/lib/supabase';
import { CLARIFY_CONTEXT_LIMITS, PATTERN_CONSOLIDATION } from '@/lib/utils/constants';
import type { ClarifyPattern, ClarifyPatternRow } from '@/types/pattern';

/**
 * Estimate token count for text (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
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
