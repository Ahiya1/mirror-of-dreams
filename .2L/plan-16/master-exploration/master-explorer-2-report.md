# Master Exploration Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Build a complete Dream Lifecycle system including a Clarify Agent (conversational AI for pre-dream exploration), Dream Evolution (in-place mutation with history), Achievement Ceremony (journey synthesis), Release Ritual (dignified letting go), and a Memory Layer for pattern accumulation across Clarify sessions.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features (Clarify Agent, Dream Evolution, Achievement Ceremony, Release Ritual, Memory Layer, Updated Rate Limits)
- **User stories/acceptance criteria:** 41 acceptance criteria across all features
- **Estimated total work:** 35-50 hours

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
- Real-time streaming chat interface with Claude API (new pattern for codebase)
- Function calling for dream creation from Clarify (novel Claude SDK integration)
- Background consolidation job for memory layer (new infrastructure pattern)
- 6 new database tables + modifications to existing tables
- Multi-turn conversation state management
- Rate limiting on a new resource type (Clarify sessions)

---

## Dependency Analysis

### Feature Dependency Chain

```
FOUNDATION LAYER (Must be built first)
    |
    +-- Database Schema (6 new tables, 2 modified tables)
    |       Required by: ALL features
    |
    +-- Rate Limit Constants & Middleware Extension
            Required by: Clarify Agent, Memory Layer
            |
            v
CORE FEATURES LAYER (Depends on Foundation)
    |
    +-- Clarify Agent (chat interface + Claude streaming)
    |       Required by: Memory Layer (messages source)
    |       Required by: Dream creation via function calling
    |
    +-- Dream Evolution (standalone, needs dreams table modification)
    |       Required by: Achievement/Release ceremonies (evolution history)
    |
    +-- Achievement Ceremony (standalone, needs ceremony table)
    |
    +-- Release Ritual (standalone, needs ritual table)
            |
            v
ADVANCED LAYER (Depends on Core)
    |
    +-- Memory Layer / Pattern Consolidation
            Depends on: Clarify messages existing in DB
            Depends on: clarify_patterns table
            Depends on: Background job infrastructure
```

### Critical Path Analysis

**Critical Path 1: Clarify Agent Chain**
1. Database schema (clarify_sessions, clarify_messages) - BLOCKS ALL
2. Rate limit extension for Clarify sessions - BLOCKS Clarify
3. Clarify tRPC router (create session, send message) - BLOCKS UI
4. Clarify streaming chat interface - BLOCKS end-to-end
5. Function calling for dream creation - BLOCKS dream-from-clarify flow

**Critical Path 2: Dream Lifecycle Chain**
1. Database schema (evolution_events, achievement_ceremonies, release_rituals) - BLOCKS ALL
2. Dreams table modifications (evolution_count, has_ceremony, has_ritual) - BLOCKS features
3. Evolution API endpoint - BLOCKS Evolution UI
4. Achievement Ceremony API endpoint - BLOCKS Ceremony UI
5. Release Ritual API endpoint - BLOCKS Ritual UI

**Critical Path 3: Memory Layer (Highest Risk)**
1. clarify_patterns table - BLOCKS consolidation
2. Clarify messages marked as consolidated (boolean flag) - BLOCKS tracking
3. Background job infrastructure (Supabase Edge Function or Vercel Cron) - BLOCKS consolidation
4. Haiku consolidation logic - BLOCKS pattern extraction
5. System prompt injection with patterns - BLOCKS memory-aware conversations

---

## External Dependencies Assessment

### 1. Claude API (Anthropic)
**Usage in this plan:**
- Clarify conversations (Claude Sonnet 4.5)
- Memory consolidation (Claude Haiku 4.5)
- Achievement ceremony generation (Claude Sonnet 4.5)
- Function calling for dream creation

**Risk Level: MEDIUM**

**Current State:** Already integrated for reflections and evolution reports. Uses `@anthropic-ai/sdk` v0.52.0.

**New Requirements:**
- **Streaming responses:** NOT currently implemented in codebase. Will require new API route pattern with Server-Sent Events or ReadableStream.
- **Function calling:** NOT currently implemented. Requires adding `tools` parameter to API requests.
- **Haiku model:** New model usage for cost optimization.

**Mitigation:**
- Start with non-streaming implementation, add streaming as enhancement
- Function calling is well-documented in Anthropic SDK; test thoroughly before UI integration
- Haiku pricing is stable; budget already calculated in vision

### 2. Supabase
**Usage in this plan:**
- 6 new tables, 2 modified tables
- Background job execution (Edge Functions or pg_cron)
- All CRUD operations for sessions, messages, patterns

**Risk Level: MEDIUM**

**Current State:** Well-integrated via `@supabase/supabase-js` v2.50.4. tRPC routers use direct Supabase client.

**New Requirements:**
- **Background jobs:** Supabase Edge Functions recommended for nightly consolidation
- **Array columns:** `source_message_ids` in clarify_patterns is ARRAY type
- **JSONB columns:** `journey_synthesis` in achievement_ceremonies

**Mitigation:**
- Start with manual consolidation trigger, add scheduled job later
- Test array operations in development before production
- Use Zod validation on JSONB data

### 3. Vercel (Deployment)
**Risk Level: LOW**

**Current State:** Next.js app deployed on Vercel.

**New Requirements:**
- Streaming API routes may need edge runtime configuration
- Cron job alternative to Supabase Edge Functions

**Mitigation:**
- Use `export const runtime = 'edge'` for streaming routes if needed
- Vercel Cron is available on Pro plan if Supabase Edge Functions prove difficult

---

## Risk Assessment by Feature

### 1. Clarify Agent - HIGHEST RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Streaming implementation complexity | HIGH | HIGH | Start non-streaming, iterate to streaming |
| Session state management | MEDIUM | MEDIUM | Use React Query for optimistic updates |
| Context window limits | MEDIUM | LOW | Limit injected context, summarize old messages |
| Rate limit edge cases | MEDIUM | MEDIUM | Test concurrent session scenarios |
| Mobile keyboard handling | LOW | MEDIUM | Use existing mobile patterns from MobileReflectionFlow |

**Technical Challenges:**
1. **Streaming:** Current reflection.ts uses `client.messages.create()` without streaming. Clarify needs `client.messages.stream()` with SSE handling.
2. **Function Calling:** New pattern - requires adding `tools` array to API request and handling `tool_use` blocks in response.
3. **Context Injection:** Must build system prompt dynamically from patterns, dreams, reflections without exceeding context limits.

**Recommended Approach:**
- Phase 1: Non-streaming chat with basic session persistence
- Phase 2: Add streaming for better UX
- Phase 3: Add function calling for dream creation
- Phase 4: Refine context injection based on usage

### 2. Memory Layer - HIGH RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Background job reliability | HIGH | MEDIUM | Start manual, add automation |
| Pattern extraction quality | MEDIUM | MEDIUM | Iterate on Haiku prompt |
| Consolidation cost creep | MEDIUM | LOW | Batch processing, Haiku pricing |
| Pattern staleness | LOW | LOW | Nightly is sufficient per vision |

**Technical Challenges:**
1. **Background Job Infrastructure:** No existing cron/scheduled job pattern in codebase.
2. **Pattern Extraction Logic:** Haiku prompt needs careful design to extract meaningful patterns.
3. **Source Tracking:** Linking patterns back to source messages requires array operations.

**Recommended Approach:**
- Build consolidation as a tRPC endpoint first (manual trigger)
- Add admin UI to trigger consolidation
- Later: Add Supabase Edge Function for nightly automation

### 3. Dream Evolution - MEDIUM RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data migration complexity | MEDIUM | LOW | Add columns as nullable |
| UI modal complexity | LOW | LOW | Follow existing modal patterns |
| Evolution history display | LOW | LOW | Simple list view |

**Technical Challenges:**
- Minimal - this is mostly CRUD with a new table
- existing `dreams.ts` router provides clear pattern

**Recommended Approach:**
- Single iteration, straightforward implementation

### 4. Achievement Ceremony - MEDIUM RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI journey synthesis quality | MEDIUM | MEDIUM | Test with various reflection counts |
| Dreams with few reflections | MEDIUM | LOW | Handle gracefully with simpler ceremony |
| UI presentation | LOW | LOW | Use existing card components |

**Technical Challenges:**
1. **Journey Synthesis:** Gathering first/last reflections, identifying "struggles" and "breakthroughs" from text.
2. **"Who you were vs became" generation:** Requires careful prompt engineering.

**Recommended Approach:**
- Start with simpler ceremony (just user closing words)
- Add AI generation as enhancement
- Graceful fallback if AI fails

### 5. Release Ritual - LOW RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Multi-step form state | LOW | LOW | Use existing form patterns |
| Progress persistence | LOW | LOW | Save to localStorage or draft table |

**Technical Challenges:**
- Minimal - guided form with sequential prompts
- No AI generation required

**Recommended Approach:**
- Single iteration, straightforward implementation

### 6. Rate Limits Update - LOW RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing limits | MEDIUM | LOW | Careful constant updates |
| New Clarify limit enforcement | LOW | LOW | Follow existing pattern |

**Technical Challenges:**
- Extend existing `TIER_LIMITS` and middleware pattern
- Add `clarify_sessions_this_month` tracking to users table

**Recommended Approach:**
- Update constants first, test thoroughly
- Add new middleware for Clarify-specific limits

---

## Database Migration Strategy

### New Tables (6)
1. `clarify_sessions` - Session metadata
2. `clarify_messages` - Individual messages
3. `clarify_patterns` - Extracted patterns
4. `evolution_events` - Dream evolution history
5. `achievement_ceremonies` - Journey synthesis storage
6. `release_rituals` - Release ceremony answers

### Modified Tables (2)
1. `dreams` - Add: evolution_count, has_ceremony, has_ritual, pre_session_id
2. `users` - Add: clarify_sessions_this_month, total_clarify_sessions

### Migration Order
1. First: Add columns to existing tables (non-breaking)
2. Second: Create new tables (isolated)
3. Third: Add foreign key constraints
4. Fourth: Create indexes
5. Fifth: Add RLS policies

### Rollback Plan
- All new tables can be dropped without affecting existing features
- New columns on existing tables should be nullable with defaults

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

### Suggested Iteration Phases

**Iteration 1: Foundation + Core UI (Backend-Heavy)**
- **Vision:** Establish database schema and basic Clarify chat without streaming
- **Scope:**
  - All 6 new database tables + 2 table modifications
  - Rate limit constants update
  - Clarify session CRUD endpoints (create session, list sessions, get session)
  - Basic Clarify message endpoint (non-streaming)
  - Dream Evolution endpoint + basic modal
  - Rate limit middleware extension
- **Why first:** Everything else depends on schema and Clarify backbone
- **Estimated duration:** 12-16 hours
- **Risk level:** MEDIUM-HIGH
- **Success criteria:**
  - Can create Clarify session and send/receive messages (non-streaming)
  - Can evolve a dream and see history
  - Rate limits enforced for Clarify

**Iteration 2: Clarify Polish + Dream Lifecycle Completion**
- **Vision:** Complete Clarify UX with streaming and build ceremony/ritual flows
- **Scope:**
  - Streaming chat implementation
  - Function calling for dream creation
  - Achievement Ceremony (API + UI)
  - Release Ritual (API + UI)
  - Clarify session list UI
  - Context injection (dreams, reflections into Clarify prompt)
- **Dependencies:**
  - Requires: All tables from Iteration 1
  - Requires: Clarify session endpoints from Iteration 1
- **Estimated duration:** 14-18 hours
- **Risk level:** MEDIUM
- **Success criteria:**
  - Streaming chat works smoothly
  - Can create dream from Clarify conversation
  - Can complete Achievement Ceremony flow
  - Can complete Release Ritual flow

**Iteration 3: Memory Layer + Polish**
- **Vision:** Add pattern accumulation and refine the complete experience
- **Scope:**
  - Memory consolidation endpoint (manual trigger)
  - Pattern extraction with Haiku
  - System prompt injection with patterns
  - Session title auto-generation
  - Admin consolidation trigger
  - Edge case handling
  - Mobile optimization
  - End-to-end testing
- **Dependencies:**
  - Requires: Clarify messages in DB from Iteration 2
  - Requires: clarify_patterns table from Iteration 1
- **Estimated duration:** 10-14 hours
- **Risk level:** MEDIUM
- **Success criteria:**
  - Patterns extracted from messages
  - Returning users see pattern-aware responses
  - Full dream lifecycle works end-to-end

---

## Dependency Graph

```
Iteration 1: Foundation
    |
    +-- Database Schema (6 new tables)
    |       |
    |       +-- clarify_sessions
    |       +-- clarify_messages
    |       +-- clarify_patterns
    |       +-- evolution_events
    |       +-- achievement_ceremonies
    |       +-- release_rituals
    |
    +-- Users table modifications
    |       +-- clarify_sessions_this_month
    |       +-- total_clarify_sessions
    |
    +-- Dreams table modifications
    |       +-- evolution_count, has_ceremony, has_ritual, pre_session_id
    |
    +-- Rate Limit Constants
    |       |
    |       v
    +-- Clarify Session Endpoints (CRUD)
    |       |
    |       v
    +-- Clarify Message Endpoint (non-streaming)
    |
    +-- Dream Evolution Endpoint + Modal
            |
            v
Iteration 2: Core Features
    |
    +-- Streaming Chat Implementation
    |       |
    |       v
    +-- Function Calling (dream creation)
    |
    +-- Context Injection (dreams, reflections)
    |
    +-- Achievement Ceremony (API + UI)
    |
    +-- Release Ritual (API + UI)
    |
    +-- Clarify Session List UI
            |
            v
Iteration 3: Memory & Polish
    |
    +-- Consolidation Endpoint
    |       |
    |       v
    +-- Pattern Extraction (Haiku)
    |       |
    |       v
    +-- System Prompt with Patterns
    |
    +-- Session Title Auto-generation
    |
    +-- Admin Consolidation UI
    |
    +-- Mobile Optimization
    |
    +-- End-to-End Testing
```

---

## High Risks

### 1. Streaming Chat Implementation
- **Risk:** No existing streaming pattern in codebase. SSE/ReadableStream handling is non-trivial.
- **Impact:** Poor UX without streaming (long waits), potential timeout issues
- **Mitigation:**
  - Start non-streaming, add streaming as Phase 2
  - Study Anthropic SDK streaming examples thoroughly
  - Consider `ai` package (Vercel AI SDK) as alternative abstraction
- **Recommendation:** Budget extra time for streaming; have non-streaming fallback ready

### 2. Function Calling Reliability
- **Risk:** First use of Claude function calling in codebase. Prompt must be carefully designed.
- **Impact:** Failed dream creation attempts, broken user flow
- **Mitigation:**
  - Design clear, minimal tool schema for `createDream`
  - Test edge cases (user says "no" to dream suggestion)
  - Graceful degradation if tool call fails
- **Recommendation:** Allocate dedicated testing time for function calling scenarios

### 3. Background Job Infrastructure
- **Risk:** No existing scheduled job pattern. Supabase Edge Functions are new territory.
- **Impact:** Memory layer won't update automatically
- **Mitigation:**
  - Start with manual trigger (admin can consolidate)
  - Add automation as Phase 3 enhancement
  - Alternative: Vercel Cron on Pro plan
- **Recommendation:** Don't block on automation; manual trigger is acceptable for MVP

---

## Medium Risks

### 4. Context Window Management
- **Risk:** Injecting patterns + dreams + reflections may exceed context limits
- **Impact:** Truncated context, degraded agent quality
- **Mitigation:**
  - Prioritize recent context
  - Summarize old messages
  - Set hard token limits per section
- **Recommendation:** Start conservative, expand context based on testing

### 5. Pattern Extraction Quality
- **Risk:** Haiku may extract low-quality or irrelevant patterns
- **Impact:** Memory layer adds noise instead of value
- **Mitigation:**
  - Iterate on extraction prompt
  - Include confidence scoring
  - Allow manual pattern curation later
- **Recommendation:** Accept imperfect patterns initially; refine with real data

### 6. Multi-turn Conversation State
- **Risk:** Complex state management for ongoing conversations
- **Impact:** Lost context, repeated agent responses
- **Mitigation:**
  - Store full message history in DB
  - Rebuild context on each request
  - Use React Query for UI state
- **Recommendation:** Keep state in DB, not client

---

## Low Risks

### 7. Database Migration Complexity
- **Risk:** Schema changes might conflict with existing data
- **Impact:** Migration failures
- **Mitigation:** All new columns nullable with defaults; thorough testing in staging
- **Recommendation:** Run migrations in off-peak hours

### 8. Mobile UX
- **Risk:** Chat interface may not work well on mobile
- **Impact:** Poor mobile experience
- **Mitigation:** Use existing MobileReflectionFlow patterns; keyboard handling
- **Recommendation:** Test on real devices early

---

## Integration Considerations

### Cross-Phase Integration Points

1. **Clarify -> Dreams Integration**
   - Clarify agent can create dreams via function calling
   - New dream records `pre_session_id` to link back to Clarify
   - Session records `dream_created_id` for bi-directional linking

2. **Reflections -> Clarify Context**
   - Clarify reads recent reflections to inform conversations
   - No write back (Clarify doesn't create reflections)

3. **Dreams -> Ceremony/Ritual**
   - Achievement/Release ceremonies reference dream ID
   - Dream status updated after ceremony completion
   - Dream becomes "sealed" after release

4. **Messages -> Patterns**
   - Consolidation reads unconsolidated messages
   - Marks messages as consolidated after processing
   - Patterns reference source message IDs

### Potential Integration Challenges

1. **Real-time vs Background Data**
   - Patterns update nightly but conversations happen real-time
   - User may create patterns that aren't reflected until next day
   - Solution: Accept delay; mention in UX

2. **Transaction Boundaries**
   - Dream creation from Clarify spans message + dream + session update
   - Need atomic operations or graceful partial failure handling
   - Solution: Use Supabase transactions where possible

3. **Rate Limit Enforcement Timing**
   - New session count vs message count
   - When exactly to increment (start of session vs first message)
   - Solution: Increment on session creation, not message send

---

## Recommendations for Master Plan

1. **Start with Database Schema**
   - Deploy all tables in Iteration 1 even if some features come later
   - Avoids migration conflicts between iterations

2. **Non-Streaming First**
   - Get Clarify working without streaming
   - Add streaming as explicit enhancement in Iteration 2
   - Reduces risk of blocking on streaming complexity

3. **Function Calling as Enhancement**
   - Clarify can work without dream creation initially
   - Add function calling after basic chat works
   - Test thoroughly before enabling in production

4. **Manual Consolidation for MVP**
   - Don't block on background job automation
   - Admin-triggered consolidation is acceptable
   - Automate in future iteration

5. **Consider Vercel AI SDK**
   - Package `ai` provides streaming abstractions
   - May simplify streaming implementation
   - Already supports Anthropic provider

6. **Budget for Testing**
   - Allocate 15-20% of time for integration testing
   - Function calling and streaming need real-world testing
   - Mobile testing essential for chat interface

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14, tRPC, Supabase, @anthropic-ai/sdk
- **Patterns observed:**
  - tRPC routers in `/server/trpc/routers/`
  - Protected procedures via middleware
  - Supabase client singleton pattern
  - React Query for data fetching
  - Mobile-first responsive design
- **Opportunities:**
  - Streaming API routes (new capability)
  - Edge runtime for chat endpoints
  - Vercel AI SDK for streaming abstraction
- **Constraints:**
  - Must maintain existing reflection/evolution flows
  - Must stay within Supabase (no additional services)
  - Must maintain 70% margin on AI costs

### New Technology Considerations

| Need | Options | Recommendation |
|------|---------|----------------|
| Streaming Chat | Raw SSE, Vercel AI SDK, Custom ReadableStream | Vercel AI SDK (simplest abstraction) |
| Background Jobs | Supabase Edge Functions, Vercel Cron, pg_cron | Start manual, add Edge Functions later |
| State Management | React Query, Zustand, Context | React Query (already in use) |

---

## Notes & Observations

1. **Vision document is exceptionally detailed** - acceptance criteria are clear and comprehensive. This reduces risk of scope creep.

2. **Cost model is pre-calculated** - margin targets (68-72%) are specified with per-feature breakdowns. Monitor actual usage against estimates.

3. **Safety boundaries defined** - Clarify agent posture is explicitly constrained (no therapy replacement, no pressure). Include in system prompt.

4. **Open questions in vision** - Session title generation, pattern threshold, ceremony skip-ability. Decide early in Iteration 1.

5. **Existing codebase is mature** - Clear patterns for routers, middleware, UI components. New features should follow existing conventions.

6. **No existing chat pattern** - This is genuinely new functionality. Budget extra time for architectural decisions.

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
