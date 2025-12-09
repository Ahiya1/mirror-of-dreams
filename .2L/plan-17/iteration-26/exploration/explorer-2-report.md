# Explorer-2 Report: Streaming Implementation & Frontend

## Executive Summary

The Clarify chat system has a well-structured foundation in `/app/clarify/[sessionId]/page.tsx` with optimistic UI updates and tRPC mutations. Streaming implementation requires a new SSE API route at `/app/api/clarify/stream/route.ts` since tRPC does not support Server-Sent Events. The Toast notification system is production-ready and needs only minor enhancement to support action buttons. The Anthropic SDK v0.52.0 fully supports `client.messages.stream()` for real-time token streaming.

---

## Discoveries

### 1. Existing Clarify Chat UI Structure

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx`

**Key State Management (lines 25-28):**
```typescript
const [inputValue, setInputValue] = useState('');
const [pendingMessage, setPendingMessage] = useState<string | null>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLTextAreaElement>(null);
```

**Current Message Flow:**
1. User types message in textarea
2. `handleSend()` sets `pendingMessage` for optimistic UI (line 96)
3. tRPC mutation `sendMessage.mutate()` called (line 99-102)
4. On success: `await refetch()` then clear `pendingMessage` (lines 51-54)
5. Messages rendered from `data.messages` with AIResponseRenderer

**Typing Indicator Implementation (lines 225-235):**
```typescript
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
```

**Streaming Integration Points:**
- Replace `sendMessage.isPending` check with new streaming state
- Add state for streaming content: `const [streamingContent, setStreamingContent] = useState('')`
- Insert streaming message bubble between messages and typing indicator
- Keep existing flow as fallback when streaming fails

### 2. Toast Notification System

**Context File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx`

**Current Interface (lines 13-18):**
```typescript
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
```

**Toast API (lines 72-83):**
```typescript
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return {
    success: (message: string, duration?: number) => context.showToast('success', message, duration),
    error: (message: string, duration?: number) => context.showToast('error', message, duration),
    warning: (message: string, duration?: number) => context.showToast('warning', message, duration),
    info: (message: string, duration?: number) => context.showToast('info', message, duration),
  };
}
```

**Component File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/Toast.tsx`

**Current Props (lines 13-17):**
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}
```

**Changes Required for Action Button Support:**

1. Extend `ToastMessage` interface:
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
```

2. Extend `ToastContextValue.showToast`:
```typescript
showToast: (
  type: ToastMessage['type'],
  message: string,
  options?: { duration?: number; action?: ToastMessage['action'] }
) => void;
```

3. Add action button to Toast component (after message, before dismiss):
```typescript
{action && (
  <button
    onClick={action.onClick}
    className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
  >
    {action.label}
  </button>
)}
```

### 3. Anthropic SDK Streaming Capabilities

**Package Version:** `@anthropic-ai/sdk: ^0.52.0` (from package.json line 44)

**Current Non-Streaming Usage (clarify.ts lines 351-356):**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
});
```

**Streaming API (sdk supports this):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
  tools: [...] // When tool_use is added
});

// Event-based streaming
stream.on('text', (text) => {
  // Send via SSE: token content
});

stream.on('contentBlock', (block) => {
  // Handle tool_use blocks
  if (block.type === 'tool_use') {
    // Execute tool, return result
  }
});

const finalMessage = await stream.finalMessage();
// Save to database
```

**Alternative Iterator Pattern:**
```typescript
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    sendSSE({ type: 'token', data: event.delta.text });
  }
  if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
    // Handle tool_use start
  }
}
```

### 4. Next.js API Route Patterns

**Existing API Routes Found:**
- `/app/api/trpc/[trpc]/route.ts` - tRPC handler
- `/app/api/auth/*/route.ts` - Auth endpoints
- `/app/api/cron/consolidate-patterns/route.ts` - Cron job
- `/app/api/webhooks/paypal/route.ts` - PayPal webhooks

**Common Pattern (from cron/consolidate-patterns/route.ts):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Auth check
  // Logic
  return NextResponse.json({ ... });
}
```

**No Existing SSE Endpoints Found**

**SSE Endpoint Pattern Required:**
```typescript
// app/api/clarify/stream/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Max stream duration

export async function POST(request: NextRequest) {
  // 1. Extract JWT from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // 2. Verify token and get user (reuse logic from server/trpc/context.ts)
  // 3. Parse request body (sessionId, content)
  
  // 4. Create ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      function sendEvent(event: string, data: any) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }
      
      try {
        // Save user message to DB
        // Start Claude stream
        // Send tokens via sendEvent('token', { text })
        // Handle tool_use
        // Save final message
        sendEvent('done', { messageId });
      } catch (error) {
        sendEvent('error', { message: error.message });
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

---

## Patterns Identified

### Pattern 1: Authentication Token Flow

**Description:** JWT token stored in localStorage, passed via Authorization header

**Current Implementation (TRPCProvider.tsx lines 30-33):**
```typescript
headers() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
},
```

**Recommendation:** Streaming endpoint must replicate this pattern for authentication

### Pattern 2: Message Rendering with AIResponseRenderer

**Description:** All assistant messages use AIResponseRenderer for markdown support

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx`

**Usage (page.tsx lines 200-203):**
```typescript
{message.role === 'assistant' ? (
  <div className="prose prose-invert prose-sm max-w-none">
    <AIResponseRenderer content={message.content} />
  </div>
) : ...}
```

**Recommendation:** Streaming content should also use AIResponseRenderer once complete, but show raw text during streaming for performance

### Pattern 3: Optimistic UI with Pending State

**Description:** User messages shown immediately with "Just now" timestamp

**Implementation (page.tsx lines 216-223):**
```typescript
{pendingMessage && (
  <div className="flex justify-end">
    <div className="max-w-[85%] sm:max-w-[75%] bg-purple-600/30 ...">
      <p className="text-white whitespace-pre-wrap">{pendingMessage}</p>
      <p className="text-xs text-white/30 mt-2">Just now</p>
    </div>
  </div>
)}
```

**Recommendation:** Keep this pattern, add streaming assistant bubble below it

---

## Complexity Assessment

### High Complexity Areas

**1. Streaming SSE Endpoint with Tool Use**
- **Why complex:** Must handle mid-stream tool_use blocks, execute createDream, return result to Claude, continue streaming
- **Estimated effort:** 5-7 hours
- **Files involved:**
  - New: `/app/api/clarify/stream/route.ts`
  - Reference: `/server/trpc/routers/clarify.ts` for logic reuse
  - Reference: `/server/trpc/context.ts` for auth pattern

### Medium Complexity Areas

**2. Frontend Streaming Integration**
- **Why medium:** Need to manage multiple states (idle, connecting, streaming, error), handle EventSource lifecycle, update UI incrementally
- **Estimated effort:** 3-4 hours
- **Files involved:**
  - Modify: `/app/clarify/[sessionId]/page.tsx`
  - Reference: AIResponseRenderer for final render

### Low Complexity Areas

**3. Toast Enhancement for Actions**
- **Why low:** Simple interface extension, minimal UI changes
- **Estimated effort:** 1 hour
- **Files involved:**
  - Modify: `/contexts/ToastContext.tsx`
  - Modify: `/components/shared/Toast.tsx`

---

## Technology Recommendations

### SSE Event Types

```typescript
// Event types to implement
type StreamEvent = 
  | { type: 'token'; data: { text: string } }
  | { type: 'tool_use_start'; data: { name: string; input: any } }
  | { type: 'tool_use_result'; data: { success: boolean; dreamId?: string; dreamTitle?: string } }
  | { type: 'done'; data: { messageId: string; tokenCount: number } }
  | { type: 'error'; data: { message: string; code?: string } };
```

### Frontend EventSource Pattern

```typescript
// In page.tsx
const [streamState, setStreamState] = useState<'idle' | 'connecting' | 'streaming' | 'error'>('idle');
const [streamingContent, setStreamingContent] = useState('');
const [toolUseResult, setToolUseResult] = useState<{ dreamId: string; dreamTitle: string } | null>(null);

const startStreaming = async (content: string) => {
  setStreamState('connecting');
  setPendingMessage(content);
  setInputValue('');
  setStreamingContent('');
  
  const token = localStorage.getItem('token');
  const eventSource = new EventSource(`/api/clarify/stream?sessionId=${sessionId}&content=${encodeURIComponent(content)}`);
  
  // Or use fetch with ReadableStream for POST:
  const response = await fetch('/api/clarify/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, content }),
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    // Parse SSE events from chunk
    // Update streamingContent
  }
};
```

### Streaming Message Bubble

```typescript
{/* Streaming assistant message */}
{streamState === 'streaming' && streamingContent && (
  <div className="flex justify-start">
    <div className="max-w-[85%] sm:max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
      <p className="text-white whitespace-pre-wrap">{streamingContent}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span className="text-xs text-white/30">Streaming...</span>
      </div>
    </div>
  </div>
)}
```

---

## Integration Points

### Authentication Flow for SSE

**From:** `/server/trpc/context.ts` (lines 22-55)

**Reusable Logic:**
```typescript
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';
import { type User, userRowToUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;

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
```

### Context Builder Integration

**From:** `/lib/clarify/context-builder.ts`

**Must use `buildClarifyContext(userId, sessionId)` in streaming endpoint to maintain consistency with non-streaming behavior.**

### Toast Integration from Clarify Page

```typescript
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

// In component
const toast = useToast();
const router = useRouter();

// When tool_use_result event received
if (toolUseResult?.dreamId) {
  toast.success(`Dream created: "${toolUseResult.dreamTitle}"`, {
    action: {
      label: 'View Dream',
      onClick: () => router.push(`/dreams/${toolUseResult.dreamId}`),
    },
  });
}
```

---

## Risks & Challenges

### Technical Risks

**1. SSE Connection Drops**
- **Impact:** User sees partial response, message not saved
- **Mitigation:** 
  - Save message on stream completion only
  - Implement retry logic with exponential backoff
  - Keep non-streaming fallback for error recovery

**2. ReadableStream Memory Management**
- **Impact:** Memory leaks on long streams
- **Mitigation:** 
  - Ensure controller.close() called in finally block
  - Implement maxDuration limit (60s)
  - Clean up EventSource on component unmount

**3. EventSource vs Fetch for POST**
- **Issue:** EventSource only supports GET requests
- **Solution:** Use Fetch API with ReadableStream response instead
- **Code pattern:** See "Frontend EventSource Pattern" above

### Complexity Risks

**1. Tool Use Mid-Stream**
- **Challenge:** When Claude returns tool_use, need to pause streaming, execute tool, return result, continue
- **Mitigation:** Buffer tool_use events, execute after text streaming, send separate event types

---

## Recommendations for Planner

1. **Create shared auth utility** - Extract JWT verification from context.ts to reusable function for SSE endpoint

2. **Implement streaming without tool_use first** - Get basic token streaming working, then add tool_use handling as separate step

3. **Use Fetch API not EventSource** - POST request is cleaner for sending message content and session ID

4. **Keep sendMessage mutation as fallback** - If streaming fails, automatically retry with non-streaming mutation

5. **Add streaming toggle to preferences** - Some users may prefer non-streaming for accessibility (screen readers)

6. **Toast action API should be backward compatible** - Existing `toast.success(message)` calls should continue working

---

## Resource Map

### Critical Files for Builder-2 (Streaming) and Builder-3 (Frontend/Toast)

| File | Purpose | Builder |
|------|---------|---------|
| `/app/api/clarify/stream/route.ts` | New SSE endpoint | Builder-2 |
| `/server/trpc/context.ts` | Auth logic to reuse | Builder-2 |
| `/lib/clarify/context-builder.ts` | Context builder to reuse | Builder-2 |
| `/server/trpc/routers/clarify.ts` | sendMessage logic reference | Builder-2 |
| `/app/clarify/[sessionId]/page.tsx` | Chat UI updates | Builder-3 |
| `/contexts/ToastContext.tsx` | Toast action support | Builder-3 |
| `/components/shared/Toast.tsx` | Toast UI changes | Builder-3 |

### Key Dependencies

- `@anthropic-ai/sdk: ^0.52.0` - Stream support confirmed
- `jsonwebtoken: ^9.0.2` - JWT verification
- `framer-motion: ^11.18.2` - Toast animations

### Types to Reference

| Type | File | Line |
|------|------|------|
| `ClarifyToolUse` | `/types/clarify.ts` | 22-33 |
| `ClarifyMessage` | `/types/clarify.ts` | 9-17 |
| `User` | `/types/index.ts` | varies |

---

## Questions for Planner

1. **Streaming toggle preference** - Should users be able to disable streaming in settings?

2. **Stream timeout handling** - If Claude takes > 60s, should we split response or fail gracefully?

3. **Error recovery UX** - When streaming fails, show error toast or automatically retry with non-streaming?

4. **Tool use notification timing** - Show toast immediately when dream created, or wait until stream completes?

---

*Exploration completed: 2025-12-09*
*Explorer-2: Streaming Implementation & Frontend*
