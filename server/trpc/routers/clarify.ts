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
import { buildClarifyContext, getUserPatterns } from '@/lib/clarify/context-builder';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { type ClarifyToolUse } from '@/types/clarify';

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
// CREATEDREAM TOOL DEFINITION
// =====================================================

const createDreamTool = {
  name: 'createDream',
  description: 'Creates a new dream for the user when they have clearly articulated what they want to pursue and are ready to commit to tracking it. Only use this when the user has expressed genuine clarity and readiness, and after asking their permission.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'A concise, meaningful title for the dream (max 200 characters)'
      },
      description: {
        type: 'string',
        description: 'Optional longer description capturing the essence of the dream (max 2000 characters)'
      },
      category: {
        type: 'string',
        enum: ['health', 'career', 'relationships', 'financial', 'personal_growth', 'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'],
        description: 'The category that best fits this dream'
      }
    },
    required: ['title']
  }
} as const;

// =====================================================
// TOOL EXECUTION HELPERS
// =====================================================

interface CreateDreamToolInput {
  title: string;
  description?: string;
  category?: string;
}

interface ToolExecutionResult {
  dreamId: string;
  dreamTitle: string;
  success: boolean;
}

async function executeCreateDreamTool(
  userId: string,
  sessionId: string,
  toolInput: CreateDreamToolInput
): Promise<ToolExecutionResult> {
  try {
    // Create the dream
    const { data: dream, error } = await supabase
      .from('dreams')
      .insert({
        user_id: userId,
        title: toolInput.title,
        description: toolInput.description || null,
        category: toolInput.category || 'other',
        status: 'active',
        priority: 5,
      })
      .select('id, title')
      .single();

    if (error) {
      console.error('Failed to create dream via tool:', error);
      return { dreamId: '', dreamTitle: '', success: false };
    }

    // Link session to dream
    await supabase
      .from('clarify_sessions')
      .update({ dream_id: dream.id })
      .eq('id', sessionId);

    return {
      dreamId: dream.id,
      dreamTitle: dream.title,
      success: true,
    };
  } catch (error) {
    console.error('Tool execution error:', error);
    return { dreamId: '', dreamTitle: '', success: false };
  }
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
      let initialToolUseResult: ClarifyToolUse['result'] | null = null;
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

        // Generate AI response with context and tools
        try {
          const client = getAnthropicClient();

          // Build context for this user
          const context = await buildClarifyContext(userId, session.id);
          const systemPrompt = context + getClarifySystemPrompt();

          const response = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1500,
            system: systemPrompt,
            messages: [
              { role: 'user', content: input.initialMessage }
            ],
            tools: [createDreamTool],
          });

          let toolUseRecord: ClarifyToolUse | null = null;
          let tokenCount = response.usage?.output_tokens || 0;

          // Check for tool_use
          const toolUseBlock = response.content.find(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          );

          if (toolUseBlock && toolUseBlock.name === 'createDream') {
            const toolInput = toolUseBlock.input as CreateDreamToolInput;
            const toolResult = await executeCreateDreamTool(userId, session.id, toolInput);

            toolUseRecord = {
              name: 'createDream',
              input: toolInput,
              result: {
                dreamId: toolResult.dreamId,
                success: toolResult.success,
              },
            };
            initialToolUseResult = toolUseRecord.result;

            // Get Claude's acknowledgment with tool result
            const followUp = await client.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 1500,
              system: systemPrompt,
              messages: [
                { role: 'user', content: input.initialMessage },
                { role: 'assistant', content: response.content },
                {
                  role: 'user',
                  content: [{
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify({
                      success: toolResult.success,
                      dreamId: toolResult.dreamId,
                      dreamTitle: toolResult.dreamTitle,
                    })
                  }]
                }
              ],
              tools: [createDreamTool],
            });

            const followUpText = followUp.content.find(
              (b): b is Anthropic.TextBlock => b.type === 'text'
            );
            initialResponse = followUpText?.text || 'I\'ve created that dream for you.';
            tokenCount += followUp.usage?.output_tokens || 0;
          } else {
            // Standard text response
            const textBlock = response.content.find(
              (block): block is Anthropic.TextBlock => block.type === 'text'
            );
            if (textBlock) {
              initialResponse = textBlock.text;
            }
          }

          // Store AI response with tool_use if applicable
          if (initialResponse) {
            await supabase
              .from('clarify_messages')
              .insert({
                session_id: session.id,
                role: 'assistant',
                content: initialResponse,
                token_count: tokenCount || null,
                tool_use: toolUseRecord,
              });
          }
        } catch (aiError) {
          console.error('Failed to generate initial response:', aiError);
        }
      }

      return {
        session: clarifySessionRowToSession(session),
        initialResponse,
        toolUseResult: initialToolUseResult,
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

      // Build context for this user
      const context = await buildClarifyContext(userId, input.sessionId);
      const systemPrompt = context + getClarifySystemPrompt();

      // Generate AI response with tools
      let aiResponse: string;
      let tokenCount: number | null = null;
      let toolUseRecord: ClarifyToolUse | null = null;

      try {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1500,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: [createDreamTool],
        });

        // Check for tool_use
        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        if (toolUseBlock && toolUseBlock.name === 'createDream') {
          const toolInput = toolUseBlock.input as CreateDreamToolInput;
          const toolResult = await executeCreateDreamTool(userId, input.sessionId, toolInput);

          toolUseRecord = {
            name: 'createDream',
            input: toolInput,
            result: {
              dreamId: toolResult.dreamId,
              success: toolResult.success,
            },
          };

          // Get Claude's acknowledgment with tool result
          const followUp = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1500,
            system: systemPrompt,
            messages: [
              ...anthropicMessages,
              { role: 'assistant', content: response.content },
              {
                role: 'user',
                content: [{
                  type: 'tool_result',
                  tool_use_id: toolUseBlock.id,
                  content: JSON.stringify({
                    success: toolResult.success,
                    dreamId: toolResult.dreamId,
                    dreamTitle: toolResult.dreamTitle,
                  })
                }]
              }
            ],
            tools: [createDreamTool],
          });

          const followUpText = followUp.content.find(
            (b): b is Anthropic.TextBlock => b.type === 'text'
          );
          aiResponse = followUpText?.text || 'I\'ve created that dream for you.';
          tokenCount = (response.usage?.output_tokens || 0) + (followUp.usage?.output_tokens || 0);
        } else {
          // Standard text response
          const textBlock = response.content.find(
            (block): block is Anthropic.TextBlock => block.type === 'text'
          );
          if (!textBlock) {
            throw new Error('No text response from Claude');
          }
          aiResponse = textBlock.text;
          tokenCount = response.usage?.output_tokens || null;
        }
      } catch (aiError: unknown) {
        console.error('Claude API error:', aiError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate response. Please try again.',
        });
      }

      // Store AI response with tool_use if applicable
      const { data: assistantMsg, error: assistantMsgError } = await supabase
        .from('clarify_messages')
        .insert({
          session_id: input.sessionId,
          role: 'assistant',
          content: aiResponse,
          token_count: tokenCount,
          tool_use: toolUseRecord, // Will be null if no tool was used
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
          toolUse: toolUseRecord,
        },
        toolUseResult: toolUseRecord?.result || null,
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

  // Get user's extracted patterns
  getPatterns: clarifyProcedure
    .query(async ({ ctx }) => {
      const patterns = await getUserPatterns(ctx.user.id);
      return { patterns };
    }),
});

export type ClarifyRouter = typeof clarifyRouter;
