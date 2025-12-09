# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Fix critical bugs in the Clarify Agent (tier mismatch, broken createDream tool) and enhance UX with streaming responses, toast notifications, improved onboarding, and demo data seeding.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 7 Must-Have features
- **User stories/acceptance criteria:** 25+ acceptance criteria across all features
- **Estimated total work:** 16-24 hours

### Complexity Rating
**Overall Complexity: MEDIUM-HIGH**

**Rationale:**
- Feature 4 (Streaming) requires new API endpoint outside tRPC, Claude API streaming integration, and SSE handling
- Feature 2 (createDream tool) requires Claude tool_use integration which is a new pattern for this codebase
- Multiple features touch the same files (clarify.ts router, Clarify UI pages)
- Database schema already supports tool_use and dream_id linking (lower risk)

---

## Dependency Analysis

### Feature Dependency Graph

```
+------------------+        +------------------+
|  1. Tier Fix     |        |  5. Onboarding   |
| (Independent)    |        |   (Independent)  |
+------------------+        +------------------+

+------------------+        +------------------+
|6. Re-enter Onb.  |        |  7. Demo Data    |
| (Independent)    |        | (Depends on 2)   |
+------------------+        +------------------+
                                    |
                                    v
+------------------+    +------------------+    +------------------+
| 2. createDream   |--->|  3. Toast/Banner |    | 4. Streaming     |
|   Tool           |    |  (Depends on 2)  |    | (Can parallelize)|
+------------------+    +------------------+    +------------------+
        |                       ^
        +-----------------------+
```

### Critical Path Analysis

**Phase 1: Independent Bug Fixes & UI (Can parallelize)**
1. **Tier Name Mismatch Fix** - 1-2 hours
   - File: `/server/trpc/routers/dreams.ts`
   - Change: Update TIER_LIMITS keys from `essential/optimal/premium` to `free/pro/unlimited`
   - No dependencies, can be done immediately

2. **Add Clarify to Onboarding** - 2-3 hours
   - File: `/app/onboarding/page.tsx`
   - Add step 4 (or insert as step 2)
   - No dependencies

3. **Re-enter Onboarding Button** - 1 hour
   - File: `/app/profile/page.tsx`
   - Add button linking to `/onboarding`
   - No dependencies

**Phase 2: Core Integration (Sequential)**
4. **createDream Tool Implementation** - 6-8 hours (CRITICAL PATH)
   - Files: `/server/trpc/routers/clarify.ts`, new streaming endpoint
   - Requires: Claude API tool_use integration
   - Must complete before toast/banner feature

5. **Toast/Banner for Dream Creation** - 2-3 hours
   - Files: `/app/clarify/[sessionId]/page.tsx`, uses existing `/contexts/ToastContext.tsx`
   - Requires: createDream tool to be working
   - Toast system already exists and is robust

**Phase 3: Streaming (Can parallelize with Phase 2)**
6. **Streaming AI Responses** - 6-8 hours (HIGH COMPLEXITY)
   - New file: `/app/api/clarify/stream/route.ts`
   - Modify: `/app/clarify/[sessionId]/page.tsx`
   - Can be developed in parallel with tool_use

**Phase 4: Demo Data (Depends on Phase 2)**
7. **Demo User Clarify Conversations** - 2-3 hours
   - New file: `/scripts/seed-clarify-demo.ts` or extend existing
   - Requires: createDream tool schema to be finalized
   - Should show tool_use in seeded conversations

### Feature Dependencies Table

| Feature | Depends On | Blocks | Risk Level |
|---------|------------|--------|------------|
| 1. Tier Fix | None | None | LOW |
| 2. createDream Tool | Claude API | 3, 7 | HIGH |
| 3. Toast/Banner | 2, ToastContext | None | LOW |
| 4. Streaming | Claude SDK | None | MEDIUM-HIGH |
| 5. Onboarding Step | None | None | LOW |
| 6. Re-enter Onboarding | None | None | LOW |
| 7. Demo Data | 2 | None | LOW |

---

## External Dependencies

### Claude API Dependencies
1. **@anthropic-ai/sdk v0.52.0** - Already installed
   - Supports streaming: YES (MessageStream class available)
   - Supports tool_use: YES (standard feature)
   - Documentation: https://docs.anthropic.com/claude/docs/tool-use

2. **Tool Definition Format Required:**
   ```typescript
   {
     name: 'createDream',
     description: 'Create a new dream for the user',
     input_schema: {
       type: 'object',
       properties: {
         title: { type: 'string', description: 'Dream title' },
         description: { type: 'string', description: 'Dream description' },
         category: { type: 'string', enum: [...categories] }
       },
       required: ['title']
     }
   }
   ```

### Database Dependencies
1. **clarify_messages.tool_use** - JSONB column already exists
2. **clarify_sessions.dream_id** - Foreign key to dreams already exists
3. **dreams.pre_session_id** - Links dream back to originating session

### Internal Dependencies
1. **ToastContext** (`/contexts/ToastContext.tsx`) - Fully implemented, supports success/error/warning/info
2. **Toast Component** (`/components/shared/Toast.tsx`) - Styled with cosmic glass design
3. **useAuth hook** - Provides user context including tier information
4. **dreams.create router** - Can be reused from clarify tool execution

---

## Risk Assessment

### High Risks

#### Risk 1: Streaming + Tool Use Interaction
- **Description:** Claude streaming with tool_use has specific handling requirements - tool_use blocks appear mid-stream
- **Impact:** If not handled correctly, dreams might be created multiple times or not at all
- **Likelihood:** MEDIUM
- **Mitigation:**
  1. Use Claude SDK's `MessageStream` class which handles tool_use blocks
  2. Buffer tool_use events and execute after stream completes
  3. Implement idempotency check (dreamId stored in session prevents duplicate creation)
- **Recommendation:** Implement streaming without tool_use first, then add tool_use handling

#### Risk 2: tRPC Incompatibility with SSE
- **Description:** tRPC doesn't natively support Server-Sent Events for streaming
- **Impact:** Requires separate API route, diverges from existing patterns
- **Likelihood:** CERTAIN (known limitation)
- **Mitigation:**
  1. Create new Next.js API route at `/app/api/clarify/stream/route.ts`
  2. Keep non-streaming fallback in tRPC router
  3. Frontend detects streaming support and chooses endpoint
- **Recommendation:** Accept this as necessary architectural divergence

### Medium Risks

#### Risk 3: Tier Name Mismatch Could Exist Elsewhere
- **Description:** The mismatch between `essential/optimal/premium` and `free/pro/unlimited` might exist in other places
- **Impact:** Partial fix if other locations missed
- **Likelihood:** LOW-MEDIUM
- **Mitigation:**
  1. Global search for all tier name usages before fixing
  2. Create single source of truth for tier names
  3. Add TypeScript types to enforce consistency
- **Recommendation:** Audit all tier references before implementing fix

#### Risk 4: Demo Data Seeding Complexity
- **Description:** Seeding Clarify conversations with realistic tool_use examples requires understanding the exact format
- **Impact:** Demo might not accurately represent the feature
- **Likelihood:** LOW
- **Mitigation:**
  1. Define tool_use JSON schema explicitly
  2. Base demo data on actual Claude responses captured during development
  3. Include both successful and "declined" dream creation conversations
- **Recommendation:** Create demo data after manual testing confirms tool_use format

### Low Risks

#### Risk 5: Onboarding State Management
- **Description:** Users re-entering onboarding after already completing it
- **Impact:** Minimal - timestamp update is fine, no blocking issues
- **Likelihood:** LOW
- **Mitigation:** Already handled - onboarding works even if already completed
- **Recommendation:** No special handling needed

#### Risk 6: Toast Positioning on Mobile
- **Description:** Toast container positioned at `bottom-6 right-6` may conflict with BottomNavigation
- **Impact:** Visual overlap on mobile devices
- **Likelihood:** LOW
- **Mitigation:** Adjust toast position for mobile (above bottom nav)
- **Recommendation:** Test on mobile, adjust z-index or position if needed

---

## Implementation Order Recommendation

### Recommended Iteration Breakdown: SINGLE ITERATION with Phased Internal Order

**Rationale:** All features are closely related to the Clarify Agent. Features are small enough to complete in one iteration with careful ordering.

### Internal Phase Order

**Phase A: Quick Wins (2-3 hours)**
1. Tier Name Mismatch Fix - 1 hour
2. Re-enter Onboarding Button - 1 hour
3. Add Clarify to Onboarding - 2 hours

**Phase B: Core Integration (8-12 hours)**
4. createDream Tool Implementation - 6-8 hours
   - Add tool definition to Claude API call
   - Handle tool_use response blocks
   - Execute dream creation via dreams router
   - Store tool_use result in clarify_messages
   - Link session to created dream
5. Toast/Banner for Dream Creation - 2-3 hours
   - Detect tool_use result in frontend
   - Show toast with "View Dream" link
   - Handle navigation

**Phase C: Streaming (6-8 hours, can parallelize)**
6. Streaming AI Responses - 6-8 hours
   - Create SSE endpoint
   - Implement frontend streaming display
   - Handle stream interruption
   - Integrate tool_use with streaming
   - Save final message after stream completes

**Phase D: Demo Data (2-3 hours)**
7. Demo User Clarify Conversations - 2-3 hours
   - Create seed script
   - Include tool_use examples
   - Realistic conversation flow

---

## Technical Integration Points

### Files That Will Change

1. **`/server/trpc/routers/dreams.ts`**
   - Update TIER_LIMITS keys only

2. **`/server/trpc/routers/clarify.ts`**
   - Add tools parameter to Claude API call
   - Handle tool_use response blocks
   - Execute dream creation
   - Store tool_use in database

3. **`/app/api/clarify/stream/route.ts`** (NEW)
   - SSE streaming endpoint
   - Authentication handling
   - Tool_use execution during stream

4. **`/app/clarify/[sessionId]/page.tsx`**
   - Add streaming message display
   - Add toast trigger for dream creation
   - Update typing indicator for streaming

5. **`/app/onboarding/page.tsx`**
   - Add Clarify step (step 4)
   - Update ProgressOrbs for 4 steps

6. **`/app/profile/page.tsx`**
   - Add "View Tutorial" button

7. **`/scripts/seed-clarify-demo.ts`** (NEW)
   - Demo conversation seeding

### Shared Types to Define

```typescript
// types/clarify.ts - ClarifyToolUse already defined
export interface ClarifyToolUse {
  name: 'createDream';
  input: {
    title: string;
    description?: string;
    category?: string;
  };
  result?: {
    dreamId: string;
    success: boolean;
  };
}
```

---

## Parallelization Opportunities

### Can Be Parallelized
1. **Phase A features** - All independent, different files
2. **Streaming (Phase C)** - Can develop SSE endpoint while tool_use is being implemented
3. **Onboarding changes** - Independent of Clarify backend work

### Must Be Sequential
1. **createDream Tool** must complete before **Toast/Banner**
2. **Demo Data Seeding** must wait for **createDream Tool** to finalize schema

### Builder Task Distribution (if 2 builders)

**Builder 1: Backend & Integration**
- Tier Fix (30 min)
- createDream Tool (6-8 hours)
- Streaming Endpoint (6-8 hours)

**Builder 2: Frontend & Demo**
- Onboarding Step (2 hours)
- Re-enter Onboarding (1 hour)
- Toast/Banner (2-3 hours) - wait for Builder 1's createDream
- Demo Data (2-3 hours)

---

## Fallback Strategies

### If Streaming Fails
- Keep existing non-streaming `sendMessage` tRPC mutation
- Frontend can fall back to polling or full-message display
- No critical functionality lost

### If Tool Use Integration Fails
- Claude can still describe what dream it would create
- User can manually create dream from the description
- Log the issue for debugging

### If SSE Not Supported (Edge cases)
- Long-polling fallback
- WebSocket alternative (more complex)
- Accept slight degradation for rare browsers

---

## Success Criteria Mapping

| Feature | Metric | Target |
|---------|--------|--------|
| Tier Fix | Unlimited users see correct limits | 100% |
| createDream | Dreams created when AI uses tool | 100% |
| Toast | Toast appears on dream creation | 100% |
| Streaming | First token < 500ms | 90% of requests |
| Onboarding | Clarify step visible | 100% new users |
| Re-enter | Button works from profile | 100% |
| Demo | 2+ Clarify sessions seeded | 100% |

---

## Recommendations for Master Plan

1. **Prioritize Tier Fix First**
   - Quick win, high visibility fix
   - Unblocks users seeing "0/0 Dreams"

2. **Tackle createDream Tool Before Streaming**
   - More critical for user value (dreams actually created)
   - Streaming is UX enhancement, tool_use is core functionality

3. **Consider Streaming as Optional Enhancement**
   - If time is tight, streaming can ship in a follow-up iteration
   - Non-streaming Clarify still works well

4. **Test Tool Use Thoroughly**
   - Claude's tool_use behavior can vary
   - Test edge cases: user declines, limit reached, network error

5. **Use Existing Toast System**
   - ToastContext and Toast component are production-ready
   - Just trigger from Clarify page when tool_use detected

---

## Notes & Observations

- The existing clarify.ts router is well-structured and follows consistent patterns
- Database schema already supports all needed fields (tool_use JSONB, dream_id FK)
- Prompt at `/prompts/clarify_agent.txt` already mentions createDream tool - just needs to be wired up
- Seed script pattern exists in `/scripts/seed-demo-user.ts` - can extend for Clarify data
- ToastContext uses 5-second auto-dismiss - matches vision requirement
- ProgressOrbs component already supports variable step counts

---

*Exploration completed: 2025-12-09T18:00:00Z*
*This report informs master planning decisions*
