// app/api/clarify/stream/route.ts - SSE streaming for Clarify conversations
import fs from 'fs';
import path from 'path';

import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { buildClarifyContext } from '@/lib/clarify/context-builder';
import { AUTH_COOKIE_NAME } from '@/server/lib/cookies';
import { supabase } from '@/server/lib/supabase';
import { type User, userRowToUser } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET!;

// =====================================================
// AUTHENTICATION
// =====================================================

async function verifyAndGetUser(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as { userId: string; exp?: number };

    // Explicit expiry check with logging
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[Clarify Stream] JWT token expired', {
        userId: payload.userId,
        expiredAt: new Date(payload.exp * 1000).toISOString(),
        expiredAgo: `${Math.floor((now - payload.exp) / 60)} minutes`,
      });
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !data) return null;
    return userRowToUser(data);
  } catch (e) {
    // Handle specific JWT errors with appropriate log levels
    if (e instanceof jwt.TokenExpiredError) {
      console.warn('[Clarify Stream] JWT token expired (caught by jwt.verify)', {
        expiredAt: e.expiredAt?.toISOString(),
        message: e.message,
      });
    } else if (e instanceof jwt.JsonWebTokenError) {
      console.warn('[Clarify Stream] Invalid JWT token', {
        message: (e as Error).message,
      });
    } else if (e instanceof jwt.NotBeforeError) {
      console.warn('[Clarify Stream] JWT token not yet valid', {
        date: (e as jwt.NotBeforeError).date?.toISOString(),
      });
    } else {
      // Unexpected error
      console.error('[Clarify Stream] Token verification error:', e);
    }
    return null;
  }
}

// =====================================================
// TOOL DEFINITION
// =====================================================

const createDreamTool = {
  name: 'createDream',
  description:
    'Creates a new dream for the user when they have clearly articulated what they want to pursue and are ready to commit to tracking it. Only use this when the user has expressed genuine clarity and readiness, and after asking their permission.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'A concise, meaningful title for the dream (max 200 characters)',
      },
      description: {
        type: 'string',
        description:
          'Optional longer description capturing the essence of the dream (max 2000 characters)',
      },
      category: {
        type: 'string',
        enum: [
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
        ],
        description: 'The category that best fits this dream',
      },
    },
    required: ['title'],
  },
} as const;

// =====================================================
// SYSTEM PROMPT
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
// STREAMING ENDPOINT
// =====================================================

export async function POST(request: NextRequest) {
  // 1. Authenticate - try cookie first, fallback to header
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await verifyAndGetUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse request body
  let body: { sessionId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sessionId, content } = body;

  if (!sessionId || !content) {
    return new Response(JSON.stringify({ error: 'Missing sessionId or content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('clarify_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Save user message
  const { error: userMsgError } = await supabase.from('clarify_messages').insert({
    session_id: sessionId,
    role: 'user',
    content,
  });

  if (userMsgError) {
    console.error('Failed to save user message:', userMsgError);
    return new Response(JSON.stringify({ error: 'Failed to save message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Get conversation history
  const { data: messages } = await supabase
    .from('clarify_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  const anthropicMessages = (messages || []).map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // 6. Build context
  const context = await buildClarifyContext(user.id, sessionId);
  const systemPrompt = context + getClarifySystemPrompt();

  // 7. Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(event: string, data: object) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

        const anthropicStream = await client.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1500,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: [createDreamTool],
        });

        let fullText = '';
        let toolUseBlock: {
          id: string;
          name: string;
          input: Record<string, unknown>;
        } | null = null;
        let toolUseRecord: {
          name: string;
          input: Record<string, unknown>;
          result: { dreamId: string; success: boolean };
        } | null = null;
        let currentToolInput = '';

        for await (const event of anthropicStream) {
          // Handle text content streaming
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              fullText += event.delta.text;
              sendEvent('token', { text: event.delta.text });
            }
            // Accumulate tool input JSON
            if (event.delta.type === 'input_json_delta') {
              currentToolInput += event.delta.partial_json;
            }
          }

          // Handle tool use block start
          if (event.type === 'content_block_start') {
            if (event.content_block.type === 'tool_use') {
              toolUseBlock = {
                id: event.content_block.id,
                name: event.content_block.name,
                input: {},
              };
              currentToolInput = '';
            }
          }

          // Handle tool use block completion
          if (event.type === 'content_block_stop' && toolUseBlock) {
            // Parse the accumulated input JSON
            try {
              if (currentToolInput) {
                toolUseBlock.input = JSON.parse(currentToolInput);
              }
            } catch (e) {
              console.error('Failed to parse tool input JSON:', e);
            }

            // Execute the tool
            sendEvent('tool_use_start', {
              name: toolUseBlock.name,
              input: toolUseBlock.input,
            });

            if (toolUseBlock.name === 'createDream') {
              const toolInput = toolUseBlock.input as {
                title: string;
                description?: string;
                category?: string;
              };

              // Execute dream creation
              const { data: dream, error: dreamError } = await supabase
                .from('dreams')
                .insert({
                  user_id: user.id,
                  title: toolInput.title,
                  description: toolInput.description || null,
                  category: toolInput.category || 'other',
                  status: 'active',
                  priority: 5,
                })
                .select('id, title')
                .single();

              if (dream && !dreamError) {
                // Link session to dream
                await supabase
                  .from('clarify_sessions')
                  .update({ dream_id: dream.id })
                  .eq('id', sessionId);

                toolUseRecord = {
                  name: 'createDream',
                  input: toolInput,
                  result: { dreamId: dream.id, success: true },
                };

                sendEvent('tool_use_result', {
                  success: true,
                  dreamId: dream.id,
                  dreamTitle: dream.title,
                });

                // Now we need to send tool_result back to Claude and continue streaming
                // Create a follow-up stream with the tool result
                const followUpStream = await client.messages.stream({
                  model: 'claude-sonnet-4-5-20250929',
                  max_tokens: 1500,
                  system: systemPrompt,
                  messages: [
                    ...anthropicMessages,
                    {
                      role: 'assistant',
                      content: [
                        ...(fullText ? [{ type: 'text' as const, text: fullText }] : []),
                        {
                          type: 'tool_use' as const,
                          id: toolUseBlock.id,
                          name: toolUseBlock.name,
                          input: toolInput,
                        },
                      ],
                    },
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'tool_result' as const,
                          tool_use_id: toolUseBlock.id,
                          content: JSON.stringify({
                            success: true,
                            dreamId: dream.id,
                            dreamTitle: dream.title,
                          }),
                        },
                      ],
                    },
                  ],
                  tools: [createDreamTool],
                });

                // Stream the follow-up response
                for await (const followUpEvent of followUpStream) {
                  if (followUpEvent.type === 'content_block_delta') {
                    if (followUpEvent.delta.type === 'text_delta') {
                      fullText += followUpEvent.delta.text;
                      sendEvent('token', { text: followUpEvent.delta.text });
                    }
                  }
                }

                // Get final message from follow-up for token count
                const followUpFinal = await followUpStream.finalMessage();
                const tokenCount = followUpFinal.usage?.output_tokens || null;

                // Save assistant message
                const { data: savedMsg } = await supabase
                  .from('clarify_messages')
                  .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: fullText,
                    token_count: tokenCount,
                    tool_use: toolUseRecord,
                  })
                  .select('id')
                  .single();

                sendEvent('done', { messageId: savedMsg?.id || '', tokenCount });
                controller.close();
                return;
              } else {
                console.error('Failed to create dream:', dreamError);
                sendEvent('tool_use_result', { success: false });
              }
            }

            toolUseBlock = null;
          }
        }

        // If we reach here, no tool was used - save the message directly
        const finalMessage = await anthropicStream.finalMessage();
        const tokenCount = finalMessage.usage?.output_tokens || null;

        // Save assistant message
        const { data: savedMsg } = await supabase
          .from('clarify_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullText,
            token_count: tokenCount,
            tool_use: toolUseRecord,
          })
          .select('id')
          .single();

        sendEvent('done', { messageId: savedMsg?.id || '', tokenCount });
      } catch (error) {
        console.error('Streaming error:', error);
        sendEvent('error', { message: 'Failed to generate response' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
