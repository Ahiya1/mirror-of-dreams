# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Enhance the Clarify Agent feature by fixing critical bugs (createDream tool, tier limits), adding streaming responses, improving onboarding, and seeding demo data.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 7 must-have features (MVP)
- **User stories/acceptance criteria:** 28 specific acceptance criteria across all features
- **Estimated total work:** 16-24 hours

### Complexity Rating
**Overall Complexity: MEDIUM**

**Rationale:**
- Mix of simple bug fixes (tier mismatch) and moderately complex implementations (streaming, tool_use)
- Well-defined existing architecture in place - extending rather than creating from scratch
- SSE streaming requires stepping outside tRPC (moderate complexity)
- Most changes are additive, not refactors of core systems

---

## Architectural Analysis

### Major Components Identified

1. **Tier Limits Bug Fix**
   - **Purpose:** Align tier names between dreams.ts TIER_LIMITS (`essential`, `optimal`, `premium`) and constants.ts (`free`, `pro`, `unlimited`)
   - **Complexity:** LOW
   - **Why critical:** Currently displays "0/0 Dreams" for users on `unlimited` tier because `TIER_LIMITS['unlimited']` returns undefined

2. **Claude API Tool Integration (createDream)**
   - **Purpose:** Wire up Claude's `tools` parameter in the Anthropic API call so AI can actually create dreams
   - **Complexity:** MEDIUM
   - **Why critical:** Currently AI says "I've created a dream" but nothing happens - core user experience bug
   - **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` (lines 188-195, 351-371)

3. **Streaming Implementation (SSE)**
   - **Purpose:** Stream Claude responses token-by-token for real-time chat experience
   - **Complexity:** HIGH (relative to other features)
   - **Why critical:** Modern chat UX expectation, currently responses load all at once
   - **Constraint:** tRPC doesn't natively support SSE - will need separate API route

4. **Toast Notification System (Already Exists!)**
   - **Purpose:** Show visual feedback when dreams are created
   - **Complexity:** LOW (infrastructure exists)
   - **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx`
   - **Note:** Just need to import `useToast()` and call `toast.success()` - no new component needed

5. **Onboarding Enhancement**
   - **Purpose:** Add Clarify explanation step to onboarding wizard
   - **Complexity:** LOW
   - **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/onboarding/page.tsx`
   - **Current state:** 3 steps array, need to add 4th step + update ProgressOrbs

6. **Re-enter Onboarding Button**
   - **Purpose:** Add button to profile page to revisit onboarding
   - **Complexity:** LOW
   - **Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx`

7. **Demo User Clarify Conversations**
   - **Purpose:** Seed demo user with example Clarify sessions
   - **Complexity:** LOW-MEDIUM
   - **Existing pattern:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/seed-demo-user.ts` shows exact seeding pattern

### Technology Stack Implications

**Streaming Endpoint Decision**
- **Options:** (1) Raw Next.js API route with SSE, (2) tRPC experimental subscriptions, (3) WebSocket
- **Recommendation:** Raw Next.js API route (`/api/clarify/stream`)
- **Rationale:** SSE is simpler than WebSocket for one-way streaming, tRPC SSE support is experimental. Next.js API routes are production-ready and well-documented.

**Claude Tool Use Implementation**
- **Options:** Already using `@anthropic-ai/sdk` with `claude-sonnet-4-5-20250929`
- **Recommendation:** Add `tools` parameter to existing `client.messages.create()` calls
- **Rationale:** SDK fully supports tool_use, just needs to be wired up. Tool definition type exists in `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` (ClarifyToolUse interface)

---

## Iteration Breakdown Recommendation

### Recommendation: **SINGLE ITERATION** (Recommended) or **2 ITERATIONS** (Optional Split)

### Why Single Iteration Works

1. **No blocking dependencies between features** - All 7 features can be built in parallel
2. **Reasonable scope** - 16-24 hours is achievable in one focused iteration
3. **Shared context** - All features relate to Clarify enhancement
4. **Testing efficiency** - Better to test integrated system once than in phases

### If Client Prefers 2 Iterations

**Iteration 1: Core Fixes & Infrastructure (8-12 hours)**
- Vision: Fix critical bugs and establish streaming infrastructure
- Scope:
  - Fix tier name mismatch bug (1 hour)
  - Implement createDream tool with Claude API (4-6 hours)
  - Add streaming endpoint with SSE (3-4 hours)
  - Add dream creation toast notification (1 hour)
- Dependencies: None - these are foundational
- Risk level: MEDIUM (streaming is moderately complex)
- Success criteria: Dreams created from Clarify appear in Dreams tab, responses stream in real-time

**Iteration 2: UX & Demo Polish (6-8 hours)**
- Vision: Improve discoverability and demo experience
- Scope:
  - Add Clarify step to onboarding (2 hours)
  - Add re-enter onboarding button (1 hour)
  - Seed demo user Clarify conversations (3-4 hours)
- Dependencies:
  - Requires: Iteration 1 complete (working createDream for realistic demo data)
  - Imports: ClarifyToolUse type for seeding tool_use data
- Risk level: LOW
- Success criteria: New users see Clarify in onboarding, demo has realistic conversations

---

## Dependency Graph

```
TIER FIX (standalone)
    |
    v
No dependencies - can start immediately

STREAMING ENDPOINT (standalone)
    |
    v
No dependencies - can start immediately
    |
    +--> CLARIFY UI (consumes stream)

CREATE_DREAM TOOL (standalone)
    |
    +--> TOAST NOTIFICATION (shows when dream created)
    |
    +--> DEMO SEEDING (needs realistic tool_use data)

ONBOARDING STEP (standalone)
    |
    v
No dependencies - can start immediately

RE-ENTER ONBOARDING (standalone)
    |
    v
No dependencies - can start immediately
```

**Critical Path:** createDream tool --> Demo seeding (demo needs real tool_use structure)

---

## Risk Assessment

### High Risks
None - all features are well-scoped extensions of existing systems.

### Medium Risks

- **SSE Streaming with Tool Use:** Stream needs to handle `tool_use` content blocks gracefully
  - **Impact:** If mishandled, tool calls might not execute or stream might break
  - **Mitigation:** Handle `content_block_delta` events, detect tool_use blocks, pause stream for tool execution, then continue
  - **Recommendation:** Implement non-streaming tool_use first, then add streaming layer

### Low Risks

- **Tier mismatch fix:** Simple string changes, very low risk
- **Toast notification:** Infrastructure exists, just needs integration
- **Onboarding step:** Array addition, trivial
- **Demo seeding:** Existing pattern in seed-demo-user.ts

---

## Integration Considerations

### Cross-Phase Integration Points

- **Clarify Router + Streaming:** New streaming endpoint needs to share authentication logic with existing tRPC procedures
- **Dream Creation + Toast:** Frontend needs to detect tool_use result and show toast

### Potential Integration Challenges

- **SSE Auth:** Need to handle authentication outside tRPC context (can reuse JWT validation logic from existing middleware)
- **Tool Result Flow:** When Claude returns `tool_use`, need to:
  1. Execute dream creation via dreams router
  2. Return result to Claude for acknowledgment
  3. Show toast to user
  4. Continue streaming if more response follows

---

## Recommendations for Master Plan

1. **Start with tier fix** - Immediate user-facing bug fix, builds confidence

2. **Implement createDream tool non-streaming first** - Get tool_use working before adding streaming complexity

3. **Add streaming as enhancement** - Once tool_use works without streaming, layer streaming on top

4. **Onboarding and demo are fully parallelizable** - Can be built by separate builders simultaneously

5. **Consider 3 builders:**
   - Builder 1: Tier fix + createDream tool + toast integration
   - Builder 2: Streaming endpoint + Clarify UI updates
   - Builder 3: Onboarding + re-enter button + demo seeding

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14 App Router, tRPC, Supabase, Anthropic SDK, Tailwind
- **Patterns observed:**
  - tRPC routers with middleware for auth
  - Glass UI component system
  - Toast context already implemented
  - Demo seeding script exists as template
- **Opportunities:**
  - Toast system ready to use
  - ClarifyToolUse type already defined
  - Clarify prompt already mentions createDream tool
- **Constraints:**
  - Must use separate API route for SSE (tRPC limitation)
  - Claude model is `claude-sonnet-4-5-20250929`

---

## Detailed Feature Analysis

### Feature 1: Tier Name Mismatch Fix

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` (lines 12-17)

**Current State:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },
  optimal: { dreams: 7 },
  premium: { dreams: 999999 },
} as const;
```

**Required Change:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
} as const;
```

**Complexity:** 15 minutes
**Risk:** None

---

### Feature 2: createDream Tool Implementation

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts`

**Current State (lines 188-195, 351-355):**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1500,
  system: systemPrompt,
  messages: anthropicMessages,
  // NO tools parameter!
});
```

**Required Changes:**
1. Add `tools` parameter with createDream tool definition
2. Handle `tool_use` content blocks in response
3. Execute dream creation when tool is called
4. Return tool result to Claude
5. Store tool_use in clarify_messages.tool_use column
6. Update clarify_sessions.dream_id foreign key

**Complexity:** 4-6 hours
**Risk:** Medium (multi-turn tool conversation flow)

---

### Feature 3: Streaming Implementation

**New File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/api/clarify/stream/route.ts`

**Key Implementation Points:**
1. SSE endpoint with `text/event-stream` content type
2. Authentication via JWT in request headers
3. Use `client.messages.stream()` from Anthropic SDK
4. Handle `content_block_delta` events for text streaming
5. Handle `tool_use` blocks by pausing stream, executing tool, returning result
6. Save final message to database after stream completes

**Client Updates:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx`
- Replace `sendMessage.mutate()` with fetch to streaming endpoint
- Display tokens as they arrive (use useState with append)
- Show typing indicator during stream

**Complexity:** 3-4 hours backend, 2-3 hours frontend
**Risk:** Medium (SSE error handling, stream interruption)

---

### Feature 4: Dream Creation Toast

**Already Implemented:** Toast context at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx`

**Required Change:**
1. Import `useToast` in Clarify session page
2. When tool_use result indicates dream created, call `toast.success()`
3. Include "View Dream" link in toast message

**Complexity:** 1 hour
**Risk:** None

---

### Feature 5: Onboarding Clarify Step

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/onboarding/page.tsx` (lines 29-48)

**Current State:** 3 steps

**Required Change:** Add 4th step:
```typescript
{
  title: 'Explore with Clarify',
  content: 'Before committing to a dream, explore what\'s emerging in your mind.\n\nClarify is your AI conversation partner - a space to think out loud, explore possibilities, and let ideas crystallize naturally.\n\nAvailable on Pro and Unlimited tiers.',
  visual: '...',
}
```

**Complexity:** 1-2 hours
**Risk:** None

---

### Feature 6: Re-enter Onboarding Button

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx`

**Required Change:** Add button in Account Actions section that links to `/onboarding`

**Complexity:** 30 minutes
**Risk:** None

---

### Feature 7: Demo User Clarify Sessions

**Existing Pattern:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/seed-demo-user.ts`

**Required:** Create similar script or extend existing to add:
1. 2-3 clarify_sessions for demo user
2. clarify_messages with realistic conversation
3. At least one session with tool_use showing dream creation

**Database Tables:**
- `clarify_sessions` (existing)
- `clarify_messages` (existing, has tool_use column)

**Complexity:** 3-4 hours (writing realistic demo content)
**Risk:** Low

---

## Notes & Observations

- The Clarify system prompt (`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt`) already mentions offering to create dreams - the tool just isn't wired up
- The `ClarifyToolUse` type is already defined in `types/clarify.ts` - good forward planning
- Demo user email is `demo@mirrorofdreams.com` (found in seed script)
- The existing `sendMessage` mutation returns immediately after AI response - streaming will be a new parallel endpoint, not a replacement

---

*Exploration completed: 2025-12-09T15:55:00Z*
*This report informs master planning decisions*
