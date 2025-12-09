# Technology Stack

## Overview

This iteration builds on the existing Mirror of Dreams stack. No new major dependencies are introduced. The focus is on correctly integrating existing technologies (Claude API tool_use, SSE streaming).

---

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**No changes needed.** The project already uses Next.js 14 with the App Router pattern.

**Key files:**
- API routes: `/app/api/`
- Pages: `/app/`
- Server components where applicable

---

## Database

**Decision:** Supabase PostgreSQL (existing)

**No schema changes needed.** The database already has:

| Table | Relevant Columns |
|-------|------------------|
| `clarify_sessions` | `dream_id UUID REFERENCES dreams(id)` |
| `clarify_messages` | `tool_use JSONB` |

**Supabase Client:** `/server/lib/supabase.ts`

---

## API Layer

**Decision:** Hybrid approach

### tRPC (existing, for non-streaming)
- Location: `/server/trpc/`
- Used for: All existing Clarify operations, dream CRUD
- Keep `sendMessage` mutation as non-streaming fallback

### Raw Next.js API Route (new, for streaming)
- Location: `/app/api/clarify/stream/route.ts`
- Used for: SSE streaming endpoint
- Reason: tRPC does not support Server-Sent Events

**Rationale:** tRPC provides excellent DX for standard request/response patterns, but SSE requires a raw API route. This hybrid approach is the standard pattern for streaming in tRPC-based apps.

---

## Anthropic SDK

**Decision:** `@anthropic-ai/sdk` v0.52.0 (existing)

**Package.json line 44:** `"@anthropic-ai/sdk": "^0.52.0"`

**Key capabilities we use:**

### Non-streaming with tools
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
  tools: [createDreamTool],  // NEW
});
```

### Streaming with tools
```typescript
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
  tools: [createDreamTool],
});

// Event-based processing
for await (const event of stream) {
  // Handle content_block_delta (text tokens)
  // Handle content_block_start (tool_use detection)
}

const finalMessage = await stream.finalMessage();
```

---

## Authentication

**Decision:** JWT via Authorization header (existing)

**Pattern:**
```typescript
// Client-side (TRPCProvider.tsx)
const token = localStorage.getItem('token');
headers: { Authorization: `Bearer ${token}` }

// Server-side verification (context.ts)
const decoded = jwt.verify(token, JWT_SECRET);
const payload = decoded as { userId: string };
```

**For streaming endpoint:** Replicate the same JWT verification pattern. Extract `verifyAndGetUser` into shared utility.

---

## Frontend State Management

**Decision:** React useState + tRPC hooks (existing)

**New streaming state:**
```typescript
const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'error'>('idle');
const [streamingContent, setStreamingContent] = useState('');
const [toolUseResult, setToolUseResult] = useState<{ dreamId: string; dreamTitle: string } | null>(null);
```

**No new state management libraries needed.** The existing pattern works well.

---

## Toast Notifications

**Decision:** Custom ToastContext (existing)

**Location:**
- `/contexts/ToastContext.tsx`
- `/components/shared/Toast.tsx`

**Enhancement needed:** Add `action` support to ToastMessage interface.

**Current interface:**
```typescript
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
```

**Enhanced interface:**
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

---

## External Integrations

### Anthropic Claude API

**Purpose:** AI conversation and tool execution

**SDK:** `@anthropic-ai/sdk`

**Model:** `claude-sonnet-4-5-20250929`

**Tool Definition Format:**
```typescript
const createDreamTool = {
  name: 'createDream',
  description: '...',
  input_schema: {
    type: 'object' as const,
    properties: { ... },
    required: ['title']
  }
};
```

**Response handling:**
- Check for `tool_use` content blocks
- Execute tool server-side
- Return `tool_result` to Claude for acknowledgment

---

## Environment Variables

No new environment variables required. Existing variables used:

| Variable | Purpose | Location |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API access | Used in clarify.ts |
| `JWT_SECRET` | Token verification | Used in context.ts |
| `SUPABASE_URL` | Database connection | Used in supabase.ts |
| `SUPABASE_SERVICE_ROLE_KEY` | Database auth | Used in supabase.ts |

---

## Dependencies Overview

No new dependencies. Key existing packages:

| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.52.0 | Claude API (streaming + tools) |
| `jsonwebtoken` | ^9.0.2 | JWT verification |
| `@supabase/supabase-js` | ^2.x | Database client |
| `framer-motion` | ^11.18.2 | Toast animations |
| `lucide-react` | ^0.x | Icons (Loader2, Send, etc.) |
| `date-fns` | ^3.x | Time formatting |

---

## Performance Targets

| Metric | Target | How Measured |
|--------|--------|--------------|
| First token latency | < 500ms | Time from send to first token displayed |
| Stream completion | < 30s | Max response time before timeout |
| Toast appearance | < 100ms | After tool_use_result received |
| Dream creation | < 2s | Time from tool execution to database insert |

---

## Security Considerations

### Authentication
- All streaming requests require valid JWT
- Token verified server-side before processing
- User ID extracted from verified token, not from request body

### Input Validation
- Message content validated (1-4000 characters)
- Session ID validated as UUID
- Tool input validated against schema

### Database Access
- All queries scoped to authenticated user's ID
- Session ownership verified before operations
- No direct client-side database access

### Rate Limiting
- Existing Clarify session limits apply
- Streaming endpoint should respect same limits
- Consider adding rate limiting middleware (post-MVP)

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types except for JSONB parsing
- All API responses typed

### Linting
- ESLint with Next.js config
- Run `npm run lint` before commit

### Type Checking
- Run `npm run typecheck` before commit
- No TypeScript errors in production code

---

## File Structure

No structural changes. Relevant directories:

```
/server/trpc/routers/
  clarify.ts          # Add tools param, tool execution
  dreams.ts           # Fix TIER_LIMITS

/app/api/clarify/
  stream/
    route.ts          # NEW: SSE streaming endpoint

/app/clarify/[sessionId]/
  page.tsx            # Update for streaming UI

/contexts/
  ToastContext.tsx    # Add action support

/components/shared/
  Toast.tsx           # Add action button rendering

/types/
  clarify.ts          # Already has ClarifyToolUse type
```
