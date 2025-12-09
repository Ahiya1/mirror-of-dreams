// lib/clarify/consolidation.ts - Pattern extraction and consolidation

import Anthropic from '@anthropic-ai/sdk';

import type { ExtractedPattern, ConsolidationResult, PatternType } from '@/types/pattern';

import { PATTERN_CONSOLIDATION } from '@/lib/utils/constants';
import { supabase } from '@/server/lib/supabase';

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
  const userMessages = messages.filter((m) => m.role === 'user');

  if (userMessages.length < PATTERN_CONSOLIDATION.minMessagesForConsolidation) {
    return [];
  }

  // Format messages for the prompt
  const formattedMessages = userMessages.map((m) => m.content).join('\n---\n');

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system:
        'You are a pattern extraction assistant. Output valid JSON only. No markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: CONSOLIDATION_PROMPT.replace('{messages}', formattedMessages),
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
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
    const validTypes: PatternType[] = [
      'recurring_theme',
      'tension',
      'potential_dream',
      'identity_signal',
    ];
    const validPatterns: ExtractedPattern[] = parsed
      .filter(
        (p: any) =>
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

    const sessionIds = sessions.map((s) => s.id);

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
        const { error: insertError } = await supabase.from('clarify_patterns').insert({
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
    const messageIds = messages.map((m) => m.id);
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
