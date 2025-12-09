# Code Patterns & Conventions

This document provides copy-pasteable code patterns for all builders. Follow these patterns exactly to ensure consistency and smooth integration.

---

## File Structure

```
/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/
├── app/
│   ├── api/
│   │   ├── clarify/
│   │   │   └── stream/
│   │   │       └── route.ts       # NEW: SSE streaming endpoint
│   │   └── trpc/[trpc]/route.ts
│   └── clarify/
│       └── [sessionId]/
│           └── page.tsx            # MODIFY: Add streaming UI
├── components/
│   └── shared/
│       └── Toast.tsx               # MODIFY: Add action button
├── contexts/
│   └── ToastContext.tsx            # MODIFY: Add action support
├── server/
│   └── trpc/
│       ├── context.ts              # Reference for auth pattern
│       └── routers/
│           ├── clarify.ts          # MODIFY: Add tools param
│           └── dreams.ts           # MODIFY: Fix TIER_LIMITS
├── lib/
│   ├── clarify/
│   │   └── context-builder.ts      # Reference: buildClarifyContext
│   └── utils/
│       └── constants.ts            # Reference: DREAM_LIMITS
├── types/
│   └── clarify.ts                  # Reference: ClarifyToolUse type
└── prompts/
    └── clarify_agent.txt           # Reference: System prompt
```

---

## Naming Conventions

- **Components:** PascalCase (`Toast.tsx`, `ToastProvider`)
- **Files:** camelCase for utilities (`context-builder.ts`), kebab-case for config
- **Types/Interfaces:** PascalCase (`ClarifyToolUse`, `ToastMessage`)
- **Functions:** camelCase (`executeCreateDreamTool`, `verifySessionOwnership`)
- **Constants:** SCREAMING_SNAKE_CASE (`TIER_LIMITS`, `JWT_SECRET`)
- **Event types:** snake_case for SSE events (`tool_use_start`, `tool_use_result`)

---

## API Patterns

### Pattern 1: Tier Limits Fix (dreams.ts)

**When to use:** Fixing the tier name mismatch bug

**Location:** `/server/trpc/routers/dreams.ts` lines 12-17

**Current (buggy):**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },    // BUG: Should be 'pro'
  optimal: { dreams: 7 },      // BUG: Remove
  premium: { dreams: 999999 }, // BUG: Should be 'unlimited'
} as const;
```

**Fixed version:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 }, // Effectively unlimited
} as const;
```

**Key points:**
- Use `pro` not `essential`
- Use `unlimited` not `premium`
- Remove `optimal` (not a valid tier)

---

### Pattern 2: createDream Tool Definition

**When to use:** Adding tools parameter to Claude API calls

**Location:** Add near top of `/server/trpc/routers/clarify.ts` after imports

**Full code:**
```typescript
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
```

**Key points:**
- `type: 'object' as const` required for TypeScript
- `required: ['title']` - only title is mandatory
- Description guides Claude on when to use the tool

---

### Pattern 3: Tool Execution Helper

**When to use:** Executing createDream after Claude returns tool_use block

**Location:** Add as helper function in `/server/trpc/routers/clarify.ts`

**Full code:**
```typescript
// =====================================================
// TOOL EXECUTION HELPERS
// =====================================================

import { type ClarifyToolUse } from '@/types/clarify';

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
```

**Key points:**
- Returns both `dreamId` and `dreamTitle` for toast notification
- Links session to dream via `dream_id` foreign key
- Graceful error handling - never throws

---

### Pattern 4: Handling Tool Use in sendMessage

**When to use:** Processing Claude response that may contain tool_use blocks

**Location:** Replace existing Claude API call block in `sendMessage` mutation

**Full code:**
```typescript
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
```

**Key points:**
- Type guards with `is` for proper TypeScript narrowing
- Two API calls when tool_use: first for tool, second for acknowledgment
- Store tool_use in database for history
- Return follow-up text as the user-visible response

---

## Streaming Patterns

### Pattern 5: SSE Endpoint Structure

**When to use:** Creating the streaming endpoint

**Location:** New file `/app/api/clarify/stream/route.ts`

**Full code:**
```typescript
// app/api/clarify/stream/route.ts - SSE streaming for Clarify
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/server/lib/supabase';
import { type User, userRowToUser } from '@/types';
import { buildClarifyContext } from '@/lib/clarify/context-builder';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET!;

// =====================================================
// AUTHENTICATION
// =====================================================

async function verifyAndGetUser(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as { userId: string };

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !data) return null;
    return userRowToUser(data);
  } catch {
    return null;
  }
}

// =====================================================
// TOOL DEFINITION
// =====================================================

const createDreamTool = {
  name: 'createDream',
  description: 'Creates a new dream for the user when they have clearly articulated what they want to pursue and are ready to commit to tracking it.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Dream title (max 200 chars)' },
      description: { type: 'string', description: 'Optional description (max 2000 chars)' },
      category: {
        type: 'string',
        enum: ['health', 'career', 'relationships', 'financial', 'personal_growth', 'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'],
      }
    },
    required: ['title']
  }
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
  // 1. Authenticate
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

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
  const body = await request.json();
  const { sessionId, content } = body as { sessionId: string; content: string };

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
  await supabase.from('clarify_messages').insert({
    session_id: sessionId,
    role: 'user',
    content,
  });

  // 5. Get conversation history
  const { data: messages } = await supabase
    .from('clarify_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  const anthropicMessages = (messages || []).map(msg => ({
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
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1500,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: [createDreamTool],
        });

        let fullText = '';
        let toolUseBlock: Anthropic.ToolUseBlock | null = null;
        let toolUseRecord: object | null = null;

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              fullText += event.delta.text;
              sendEvent('token', { text: event.delta.text });
            }
          }

          if (event.type === 'content_block_start') {
            if (event.content_block.type === 'tool_use') {
              toolUseBlock = event.content_block as Anthropic.ToolUseBlock;
            }
          }

          if (event.type === 'content_block_stop' && toolUseBlock) {
            // Tool use detected - execute it
            sendEvent('tool_use_start', { name: toolUseBlock.name, input: toolUseBlock.input });

            if (toolUseBlock.name === 'createDream') {
              const toolInput = toolUseBlock.input as { title: string; description?: string; category?: string };

              // Execute dream creation
              const { data: dream, error } = await supabase
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

              if (dream && !error) {
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
              } else {
                sendEvent('tool_use_result', { success: false });
              }
            }

            toolUseBlock = null;
          }
        }

        const finalMessage = await stream.finalMessage();
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
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Key points:**
- POST method (not GET) for sending message content
- JWT verification before processing
- SSE format: `event: <type>\ndata: <json>\n\n`
- Event types: `token`, `tool_use_start`, `tool_use_result`, `done`, `error`
- Tool execution happens mid-stream
- Message saved after stream completes

---

## Frontend Patterns

### Pattern 6: Streaming State Management

**When to use:** Adding streaming to Clarify chat page

**Location:** `/app/clarify/[sessionId]/page.tsx`

**State additions:**
```typescript
// Add these state variables
const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'error'>('idle');
const [streamingContent, setStreamingContent] = useState('');
const [toolUseResult, setToolUseResult] = useState<{
  dreamId: string;
  dreamTitle: string;
} | null>(null);
```

---

### Pattern 7: Streaming Request with Fetch

**When to use:** Initiating streaming request from frontend

**Location:** `/app/clarify/[sessionId]/page.tsx`

**Full code:**
```typescript
const handleSendStreaming = async () => {
  const content = inputValue.trim();
  if (!content || streamState === 'streaming') return;

  // Optimistic update
  setPendingMessage(content);
  setInputValue('');
  setStreamingContent('');
  setToolUseResult(null);
  setStreamState('streaming');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/clarify/stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, content }),
    });

    if (!response.ok) {
      throw new Error('Stream request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          const dataLine = lines[i + 1];
          if (dataLine?.startsWith('data: ')) {
            const data = JSON.parse(dataLine.slice(6));
            handleStreamEvent(eventType, data);
            i++; // Skip data line
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    setStreamState('error');
    // Fallback to non-streaming
    if (pendingMessage) {
      setInputValue(pendingMessage);
    }
    setPendingMessage(null);
  }
};

const handleStreamEvent = (eventType: string, data: any) => {
  switch (eventType) {
    case 'token':
      setStreamingContent(prev => prev + data.text);
      break;
    case 'tool_use_result':
      if (data.success) {
        setToolUseResult({
          dreamId: data.dreamId,
          dreamTitle: data.dreamTitle,
        });
      }
      break;
    case 'done':
      setStreamState('idle');
      setPendingMessage(null);
      setStreamingContent('');
      refetch(); // Refresh messages from server
      break;
    case 'error':
      setStreamState('error');
      setPendingMessage(null);
      break;
  }
};
```

**Key points:**
- Use Fetch API with ReadableStream (not EventSource)
- Parse SSE format manually
- Buffer incomplete lines
- Handle each event type appropriately
- Fallback to non-streaming on error

---

### Pattern 8: Streaming Message Bubble

**When to use:** Displaying streaming content in chat

**Location:** Add after pending message, before typing indicator

**Full code:**
```typescript
{/* Streaming assistant message */}
{streamState === 'streaming' && streamingContent && (
  <div className="flex justify-start">
    <div className="max-w-[85%] sm:max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
      <div className="prose prose-invert prose-sm max-w-none">
        <p className="text-white whitespace-pre-wrap">{streamingContent}</p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span className="text-xs text-white/30">Streaming...</span>
      </div>
    </div>
  </div>
)}

{/* Typing indicator - updated text */}
{streamState === 'streaming' && !streamingContent && (
  <div className="flex justify-start">
    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex items-center gap-2 text-white/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Mirror is reflecting...</span>
      </div>
    </div>
  </div>
)}
```

**Key points:**
- Show streaming bubble when content is available
- Show "Mirror is reflecting..." when waiting for first token
- Use same styling as assistant messages

---

## Toast Patterns

### Pattern 9: Enhanced Toast Interface

**When to use:** Adding action button support to Toast

**Location:** `/contexts/ToastContext.tsx`

**Updated interface:**
```typescript
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (
    type: ToastMessage['type'],
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ) => void;
  dismissToast: (id: string) => void;
}
```

**Updated showToast:**
```typescript
const showToast = useCallback(
  (
    type: ToastMessage['type'],
    message: string,
    options?: { duration?: number; action?: ToastMessage['action'] }
  ) => {
    const id = Math.random().toString(36).substring(7);
    const duration = options?.duration ?? 5000;
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration,
      action: options?.action,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  },
  []
);
```

**Updated useToast hook:**
```typescript
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return {
    success: (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) =>
      context.showToast('success', message, options),
    error: (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) =>
      context.showToast('error', message, options),
    warning: (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) =>
      context.showToast('warning', message, options),
    info: (message: string, options?: { duration?: number; action?: ToastMessage['action'] }) =>
      context.showToast('info', message, options),
  };
}
```

---

### Pattern 10: Toast Component with Action Button

**When to use:** Rendering action button in Toast

**Location:** `/components/shared/Toast.tsx`

**Updated interface and component:**
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ type, message, onDismiss, action }: ToastProps) {
  // ... existing icons and colors ...

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'border backdrop-blur-xl shadow-2xl',
        'max-w-sm w-full',
        colors[type]
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Message */}
        <p className="text-sm text-white/90 leading-relaxed">{message}</p>

        {/* Action Button */}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="mt-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>
    </motion.div>
  );
}
```

**Update ToastProvider to pass action:**
```typescript
<Toast
  key={toast.id}
  type={toast.type}
  message={toast.message}
  onDismiss={() => dismissToast(toast.id)}
  action={toast.action}
/>
```

---

### Pattern 11: Dream Creation Toast Usage

**When to use:** Showing toast when dream is created

**Location:** `/app/clarify/[sessionId]/page.tsx`

**Full code:**
```typescript
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

// In component
const toast = useToast();
const router = useRouter();

// In handleStreamEvent, inside tool_use_result case:
case 'tool_use_result':
  if (data.success && data.dreamId) {
    setToolUseResult({
      dreamId: data.dreamId,
      dreamTitle: data.dreamTitle,
    });
    toast.success(`Dream created: "${data.dreamTitle}"`, {
      duration: 8000,
      action: {
        label: 'View Dream',
        onClick: () => router.push(`/dreams/${data.dreamId}`),
      },
    });
  }
  break;
```

**Key points:**
- 8 second duration (longer for important action)
- Action dismisses toast on click
- Navigate to dream detail page

---

## Import Order Convention

Follow this import order in all files:

```typescript
// 1. React/Next.js core
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// 2. External packages
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// 3. Internal: Server/lib
import { supabase } from '@/server/lib/supabase';
import { buildClarifyContext } from '@/lib/clarify/context-builder';
import { cn } from '@/lib/utils';

// 4. Internal: Components
import { CosmicLoader, GlowButton, GlassCard } from '@/components/ui/glass';
import { Toast } from '@/components/shared/Toast';

// 5. Internal: Contexts/Hooks
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';

// 6. Internal: Types
import { type User, type ClarifyToolUse } from '@/types';

// 7. Icons (last)
import { ArrowLeft, Send, Loader2, X } from 'lucide-react';
```

---

## Error Handling Patterns

### API Errors
```typescript
try {
  // API call
} catch (error: unknown) {
  console.error('Operation failed:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to complete operation. Please try again.',
  });
}
```

### Streaming Errors
```typescript
// Send error event
sendEvent('error', { message: 'Failed to generate response' });

// Frontend handling
case 'error':
  setStreamState('error');
  toast.error('Something went wrong. Please try again.');
  // Restore input for retry
  if (pendingMessage) {
    setInputValue(pendingMessage);
  }
  setPendingMessage(null);
  break;
```

---

## Testing Patterns

### Manual Test Cases

**Test 1: Tier Limits**
1. Log in as unlimited tier user
2. Navigate to Dreams page
3. Verify limit shows "X / infinity" not "0 / 0"

**Test 2: Dream Creation**
1. Open Clarify session
2. Type: "I want to start a daily meditation practice"
3. Continue conversation until Claude offers to create dream
4. Accept the offer
5. Verify: Toast appears with dream title
6. Verify: Click "View Dream" navigates correctly
7. Verify: Dream appears in Dreams tab

**Test 3: Streaming**
1. Open Clarify session
2. Send a message
3. Verify: "Mirror is reflecting..." appears
4. Verify: Text streams in token by token
5. Verify: Message saves after completion
6. Verify: Refreshing shows the message

---

## Security Patterns

### JWT Verification
```typescript
async function verifyAndGetUser(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const payload = decoded as { userId: string };
    // Fetch user from database
    // Return user or null
  } catch {
    return null; // Invalid token
  }
}
```

### Session Ownership Check
```typescript
const { data: session, error } = await supabase
  .from('clarify_sessions')
  .select('id')
  .eq('id', sessionId)
  .eq('user_id', user.id)  // IMPORTANT: scope to user
  .single();

if (!session) {
  // Not found OR not owned by user
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
}
```
