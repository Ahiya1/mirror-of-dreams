# Builder Task Breakdown

## Overview

**3 primary builders** will work in parallel on this iteration.

| Builder | Focus Area | Estimated Time |
|---------|------------|----------------|
| Builder-1 | Backend Core Fixes | 6-8 hours |
| Builder-2 | Streaming Endpoint | 5-7 hours |
| Builder-3 | Frontend & Toast | 4-5 hours |

**Parallelization Strategy:**
- Builder-1 and Builder-2 can start simultaneously
- Builder-3 can start Toast work immediately, then integrate with Builder-2's endpoint
- All builders reference `patterns.md` for code patterns

---

## Builder-1: Backend Core Fixes

### Scope

Fix the tier name mismatch bug and implement the createDream tool with Claude API tool_use support. This builder focuses on making dream creation actually work when Claude uses the tool.

### Complexity Estimate

**MEDIUM-HIGH**

Primary complexity is in handling the tool_use response flow with Claude API.

### Success Criteria

- [ ] TIER_LIMITS in dreams.ts uses `free`, `pro`, `unlimited` (not `essential`, `optimal`, `premium`)
- [ ] Unlimited tier users see correct dream limits in UI
- [ ] Claude API calls include `tools` parameter with createDream definition
- [ ] When Claude returns tool_use block, dream is created in database
- [ ] tool_use record stored in clarify_messages.tool_use column
- [ ] clarify_sessions.dream_id updated when dream created
- [ ] Claude receives tool_result and generates acknowledgment message
- [ ] TypeScript types pass without errors

### Files to Modify

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` | Fix TIER_LIMITS (lines 12-17) |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` | Add createDreamTool definition, tool execution helper, modify sendMessage and createSession |

### Dependencies

**Depends on:** Nothing - can start immediately
**Blocks:** Builder-2 (references tool definition pattern)

### Implementation Notes

**Step 1: Fix Tier Limits (15 minutes)**

File: `/server/trpc/routers/dreams.ts`

Change lines 12-17 from:
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },
  optimal: { dreams: 7 },
  premium: { dreams: 999999 },
} as const;
```

To:
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
} as const;
```

**Step 2: Add createDream Tool Definition (30 minutes)**

Add after line 18 in clarify.ts (after imports):

See `patterns.md` Pattern 2 for full code.

**Step 3: Add Tool Execution Helper (45 minutes)**

Add the `executeCreateDreamTool` function.

See `patterns.md` Pattern 3 for full code.

**Step 4: Modify sendMessage Mutation (3-4 hours)**

This is the main work. Replace the Claude API call block (around lines 349-371) with the full tool_use handling pattern.

See `patterns.md` Pattern 4 for full code.

Key changes:
- Add `tools: [createDreamTool]` to API call
- Check for tool_use blocks in response
- Execute tool and get result
- Send tool_result back to Claude
- Store tool_use in database

**Step 5: Modify createSession Mutation (1-2 hours)**

Apply similar changes to the `createSession` mutation (around lines 185-215) for initial messages that might trigger tool use.

**Step 6: Type Imports (15 minutes)**

Add required type imports at top of clarify.ts:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { type ClarifyToolUse } from '@/types/clarify';
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Pattern 1: Tier Limits Fix
- Pattern 2: createDream Tool Definition
- Pattern 3: Tool Execution Helper
- Pattern 4: Handling Tool Use in sendMessage

### Testing Requirements

- Manual test: Create a dream via Clarify conversation
- Manual test: Verify unlimited tier user sees correct limits
- Run `npm run typecheck` - must pass
- Run `npm run lint` - must pass

### Gotchas

1. **Type narrowing:** Use type guards like `block.type === 'tool_use'` with TypeScript
2. **Two API calls:** Tool use requires initial call + follow-up with tool_result
3. **Token counting:** Sum tokens from both API calls when tool is used
4. **Error handling:** Never throw from executeCreateDreamTool - return failure result

---

## Builder-2: Streaming Endpoint

### Scope

Create a new SSE (Server-Sent Events) streaming endpoint that handles real-time token streaming from Claude, including mid-stream tool execution for dream creation.

### Complexity Estimate

**HIGH**

Streaming with tool_use requires careful event handling and state management.

### Success Criteria

- [ ] New endpoint at `/app/api/clarify/stream/route.ts` responds to POST requests
- [ ] JWT authentication verifies user before processing
- [ ] User message saved to database before streaming
- [ ] Tokens streamed via SSE as they arrive from Claude
- [ ] tool_use blocks detected and executed mid-stream
- [ ] `tool_use_result` event sent with dreamId and dreamTitle
- [ ] Final assistant message saved after stream completes
- [ ] `done` event sent with messageId
- [ ] Errors handled gracefully with `error` event

### Files to Create

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts` | SSE streaming endpoint |

### Files to Reference (read-only)

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` | JWT verification pattern |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` | sendMessage logic reference |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/clarify/context-builder.ts` | buildClarifyContext function |

### Dependencies

**Depends on:** Builder-1's createDreamTool definition pattern (for consistency)
**Blocks:** Builder-3's frontend streaming integration

### Implementation Notes

**Step 1: Create New File (30 minutes)**

Create `/app/api/clarify/stream/route.ts` with:
- Runtime and maxDuration config
- Required imports

**Step 2: Authentication Helper (45 minutes)**

Extract JWT verification logic from context.ts pattern:
```typescript
async function verifyAndGetUser(token: string): Promise<User | null>
```

**Step 3: Tool Definition (15 minutes)**

Copy the createDreamTool definition (same as Builder-1).

**Step 4: System Prompt Loading (15 minutes)**

Copy the getClarifySystemPrompt function from clarify.ts.

**Step 5: POST Handler Structure (1 hour)**

Implement the main POST handler with:
1. Auth header extraction
2. Token verification
3. Request body parsing
4. Session ownership check
5. User message save

**Step 6: Streaming Logic (3-4 hours)**

This is the main work:
1. Create ReadableStream
2. Initialize Anthropic client with stream mode
3. Process events from stream
4. Send SSE events for tokens
5. Detect and execute tool_use
6. Save final message
7. Send done event

See `patterns.md` Pattern 5 for complete implementation.

### Event Format

SSE events follow this format:
```
event: <event_type>
data: <json_payload>

```

| Event | Data | When |
|-------|------|------|
| `token` | `{ text: string }` | Each text token |
| `tool_use_start` | `{ name: string, input: object }` | Tool execution begins |
| `tool_use_result` | `{ success: boolean, dreamId?: string, dreamTitle?: string }` | Tool execution complete |
| `done` | `{ messageId: string, tokenCount: number }` | Stream complete |
| `error` | `{ message: string }` | Error occurred |

### Patterns to Follow

Reference patterns from `patterns.md`:
- Pattern 2: createDream Tool Definition
- Pattern 5: SSE Endpoint Structure

### Testing Requirements

- Manual test with curl:
```bash
curl -X POST http://localhost:3000/api/clarify/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "<uuid>", "content": "Hello"}' \
  --no-buffer
```
- Verify events stream correctly
- Verify authentication fails without token
- Run `npm run typecheck` - must pass

### Gotchas

1. **POST not GET:** Use POST for request body
2. **ReadableStream:** Use Node.js ReadableStream pattern
3. **Event parsing:** Buffer incomplete lines
4. **Tool execution timing:** Execute after content_block_stop, not content_block_start
5. **maxDuration:** Set to 60 seconds for long responses
6. **finalMessage():** Wait for this before saving to database

---

## Builder-3: Frontend & Toast

### Scope

Enhance the Toast component to support action buttons, update the Clarify chat UI for streaming display, and integrate the dream creation toast notification.

### Complexity Estimate

**MEDIUM**

Mostly UI changes with some async state management.

### Success Criteria

- [ ] ToastMessage interface includes optional `action` property
- [ ] Toast component renders action button when provided
- [ ] Action button click triggers onClick and dismisses toast
- [ ] toast.success() accepts options object with action
- [ ] Clarify page has streaming state management
- [ ] Streaming content displays in real-time
- [ ] "Mirror is reflecting..." shows while waiting for first token
- [ ] Dream creation triggers toast with "View Dream" action
- [ ] Clicking "View Dream" navigates to dream page
- [ ] Non-streaming fallback works if streaming fails

### Files to Modify

| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx` | Add action support to interface and hook |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/Toast.tsx` | Add action button rendering |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx` | Add streaming state and UI |

### Dependencies

**Depends on:** Builder-2's streaming endpoint (for integration)
**Blocks:** Nothing

**Note:** Toast enhancement can start immediately. Streaming integration waits for Builder-2.

### Implementation Notes

**Phase A: Toast Enhancement (1-1.5 hours)**

**Step 1: Update ToastContext (30 minutes)**

File: `/contexts/ToastContext.tsx`

1. Update ToastMessage interface:
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

2. Update showToast function signature and implementation
3. Update useToast hook to accept options object

See `patterns.md` Pattern 9 for full code.

**Step 2: Update Toast Component (30 minutes)**

File: `/components/shared/Toast.tsx`

1. Add action prop to ToastProps
2. Render action button between message and dismiss button
3. On action click, call onClick and dismiss toast

See `patterns.md` Pattern 10 for full code.

**Step 3: Update ToastProvider (15 minutes)**

Pass action prop to Toast component:
```typescript
<Toast
  key={toast.id}
  type={toast.type}
  message={toast.message}
  onDismiss={() => dismissToast(toast.id)}
  action={toast.action}
/>
```

**Phase B: Streaming UI (3-3.5 hours)**

**Step 4: Add Streaming State (30 minutes)**

File: `/app/clarify/[sessionId]/page.tsx`

Add new state variables after existing state:
```typescript
const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'error'>('idle');
const [streamingContent, setStreamingContent] = useState('');
const [toolUseResult, setToolUseResult] = useState<{
  dreamId: string;
  dreamTitle: string;
} | null>(null);
```

Add imports:
```typescript
import { useToast } from '@/contexts/ToastContext';
```

**Step 5: Implement Streaming Handler (1.5-2 hours)**

Add handleSendStreaming and handleStreamEvent functions.

See `patterns.md` Patterns 7 and 11 for full code.

**Step 6: Update handleSend (15 minutes)**

Replace existing handleSend to use streaming:
```typescript
const handleSend = () => {
  const content = inputValue.trim();
  if (!content || streamState === 'streaming') return;
  handleSendStreaming();
};
```

**Step 7: Add Streaming UI Elements (45 minutes)**

Add streaming message bubble and update typing indicator.

See `patterns.md` Pattern 8 for full code.

Location: After pending message, before existing typing indicator.

**Step 8: Update Typing Indicator (15 minutes)**

Change "Thinking..." to "Mirror is reflecting...":
```typescript
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

Remove or update the existing `sendMessage.isPending` check.

### Patterns to Follow

Reference patterns from `patterns.md`:
- Pattern 6: Streaming State Management
- Pattern 7: Streaming Request with Fetch
- Pattern 8: Streaming Message Bubble
- Pattern 9: Enhanced Toast Interface
- Pattern 10: Toast Component with Action Button
- Pattern 11: Dream Creation Toast Usage

### Testing Requirements

- Manual test: Toast with action button appears correctly
- Manual test: Action click navigates and dismisses
- Manual test: Existing toast.success() without action still works
- Manual test: Streaming response displays token by token
- Manual test: Dream creation shows toast with "View Dream"
- Run `npm run typecheck` - must pass
- Run `npm run lint` - must pass

### Gotchas

1. **Backwards compatibility:** Existing `toast.success(message)` must still work
2. **Action dismissal:** Clicking action should dismiss toast
3. **Stream parsing:** Buffer incomplete SSE lines
4. **Fallback:** If streaming fails, restore input for retry
5. **Scroll behavior:** Scroll to bottom during streaming

---

## Builder Execution Order

### Parallel Group 1 (Can start immediately)

| Builder | Task | Notes |
|---------|------|-------|
| Builder-1 | Tier fix + Tool definition | No dependencies |
| Builder-2 | Streaming endpoint structure | Can parallel with Builder-1 |
| Builder-3 | Toast enhancement | Independent of others |

### Parallel Group 2 (After initial setup)

| Builder | Task | Dependency |
|---------|------|------------|
| Builder-1 | sendMessage tool handling | After tool definition |
| Builder-2 | Streaming with tool_use | Aligns with Builder-1's pattern |
| Builder-3 | Streaming UI integration | After Builder-2 completes endpoint |

---

## Integration Notes

### Merge Order

1. **Builder-1 first:** Commits tier fix + createDream tool implementation
2. **Builder-2 second:** Commits streaming endpoint (no conflicts)
3. **Builder-3 third:** Commits Toast + frontend changes

### Potential Conflict Areas

| File | Risk | Resolution |
|------|------|------------|
| `/server/trpc/routers/clarify.ts` | Low - Builder-1 only | No conflict |
| `/contexts/ToastContext.tsx` | Low - Builder-3 only | No conflict |
| `/app/clarify/[sessionId]/page.tsx` | Low - Builder-3 only | No conflict |

### Shared Patterns

All builders should use the same createDreamTool definition. Builder-1 defines it in clarify.ts, Builder-2 copies it to stream/route.ts.

### Post-Integration Verification

After all merges:
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Test full flow: Send message -> Stream response -> Create dream -> See toast -> Click "View Dream"

---

## Acceptance Criteria Summary

| Criterion | Builder | Verification |
|-----------|---------|--------------|
| Tier limits correct | Builder-1 | Check unlimited user's dream display |
| Dreams created from Clarify | Builder-1 | Dream appears in Dreams tab |
| tool_use stored in DB | Builder-1 | Check clarify_messages.tool_use |
| Streaming endpoint works | Builder-2 | curl test returns SSE events |
| Tokens stream to frontend | Builder-3 | Visual observation |
| Toast shows dream creation | Builder-3 | Toast appears with action |
| "View Dream" navigates | Builder-3 | Click navigates to dream |

---

## Time Budget

| Builder | Estimated | Buffer | Maximum |
|---------|-----------|--------|---------|
| Builder-1 | 6-8 hours | +2 hours | 10 hours |
| Builder-2 | 5-7 hours | +2 hours | 9 hours |
| Builder-3 | 4-5 hours | +1 hour | 6 hours |
| Integration | 30 min | +30 min | 1 hour |
| Validation | 30 min | +30 min | 1 hour |
| **Total** | **16-21 hours** | | **27 hours** |

**Note:** Builders work in parallel, so wall-clock time is approximately 8-10 hours.
