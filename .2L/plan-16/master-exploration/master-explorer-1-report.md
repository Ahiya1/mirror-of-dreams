# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Build a complete dream lifecycle system with pre-dream clarification (Clarify Agent), dream evolution tracking, achievement ceremonies, release rituals, and a memory layer that accumulates patterns across sessions - transforming Mirror of Dreams into a comprehensive identity companion.

---

## Requirements Analysis

### Scope Assessment
- **Total features identified:** 6 must-have features
  1. Clarify Agent (conversational AI for pre-dream exploration)
  2. Dream Evolution (transform dreams in place with history)
  3. Achievement Ceremony (journey synthesis for completed dreams)
  4. Release Ritual (dignified letting go of dreams)
  5. Memory Layer (pattern accumulation across Clarify sessions)
  6. Updated Rate Limits (new Clarify limits + existing adjustments)

- **User stories/acceptance criteria:** 47+ discrete acceptance criteria
- **Estimated total work:** 28-40 hours across multiple iterations

### Complexity Rating
**Overall Complexity: COMPLEX**

**Rationale:**
1. **Multiple new database entities (6 tables):** clarify_sessions, clarify_messages, clarify_patterns, evolution_events, achievement_ceremonies, release_rituals
2. **Real-time streaming chat interface:** Clarify Agent requires WebSocket-like streaming for responsive UX
3. **Background job infrastructure:** Nightly consolidation for pattern extraction (new architectural pattern)
4. **Function calling integration:** Claude API function calling for dream creation from Clarify
5. **Multiple tier-specific features:** Extended thinking for Unlimited tier, rate limits per tier
6. **Significant frontend work:** New navigation item, chat interface, ceremony/ritual flows, evolution history UI

---

## Architectural Analysis

### Major Components Identified

#### 1. **Clarify Agent System** (NEW - HIGHEST COMPLEXITY)
- **Purpose:** Conversational AI interface for pre-dream exploration
- **Complexity:** HIGH
- **Subcomponents:**
  - Chat interface with streaming responses
  - Session management (create, list, resume)
  - Message persistence
  - System prompt injection with accumulated context
  - Function calling for `createDream`
  - Tier-based rate limiting (Pro: 20/mo, Unlimited: 30/mo)
  - Extended thinking toggle (Unlimited only)
- **Why critical:** Core value proposition - addresses "dream fog" problem

#### 2. **Memory Layer** (NEW - HIGH COMPLEXITY)
- **Purpose:** Pattern accumulation across Clarify sessions and reflections
- **Complexity:** HIGH
- **Subcomponents:**
  - Pattern extraction using Claude Haiku (cost-efficient)
  - Nightly/on-demand consolidation job
  - Context injection into system prompts
  - Pattern types: recurring_themes, tensions, potential_dreams, identity_signals
- **Why critical:** Enables continuity and pattern recognition over time

#### 3. **Dream Evolution** (EXTENSION - MEDIUM COMPLEXITY)
- **Purpose:** Allow dreams to transform while maintaining identity
- **Complexity:** MEDIUM
- **Subcomponents:**
  - Evolution modal UI
  - Evolution event logging
  - History display on dream detail
  - Dream mutation (same ID, new content)
- **Why critical:** Addresses stale dream problem - dreams change, system should track

#### 4. **Achievement Ceremony** (NEW - MEDIUM COMPLEXITY)
- **Purpose:** Transform achievement from toggle to meaningful journey synthesis
- **Complexity:** MEDIUM
- **Subcomponents:**
  - Journey synthesis generation (AI-powered)
  - "Who you were" vs "who you became" reflection
  - Closing words input
  - Ceremony storage and display
  - Fallback for dreams with few reflections
- **Why critical:** Psychological completion - users feel seen and honored

#### 5. **Release Ritual** (NEW - MEDIUM COMPLEXITY)
- **Purpose:** Dignified letting go with gratitude
- **Complexity:** MEDIUM
- **Subcomponents:**
  - Multi-step guided prompts
  - Progress persistence (resume abandoned rituals)
  - Dream sealing (no more reflections)
  - Ritual storage and display
- **Why critical:** Psychological closure - honor what was, release cleanly

#### 6. **Rate Limit System Enhancement** (EXTENSION - LOW COMPLEXITY)
- **Purpose:** Sustainable AI costs with 70% margin
- **Complexity:** LOW
- **Changes:**
  - Add `clarify_sessions_this_month` tracking
  - Update constants with new limits
  - Extend middleware for Clarify usage checks
- **Why critical:** Business sustainability

---

### Technology Stack Analysis

**Existing Stack (Detected):**
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React 18 + Tailwind CSS |
| API | tRPC (type-safe) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude (via @anthropic-ai/sdk) |
| State | TanStack Query (React Query) |
| Auth | Custom JWT + bcrypt |
| Payments | PayPal |
| Styling | Framer Motion, Tailwind |

**Stack Implications for New Features:**

| Feature | Tech Consideration |
|---------|-------------------|
| Clarify Chat | May need streaming tRPC (subscriptions) or API route with SSE |
| Memory Consolidation | Supabase Edge Functions or external cron (Vercel cron) |
| Function Calling | Claude API tool_use feature |
| Pattern Storage | JSONB columns for flexible schema |

**Technology Decisions Required:**

1. **Streaming Responses:**
   - Option A: tRPC subscriptions (complex setup)
   - Option B: Next.js API route with Server-Sent Events (simpler)
   - **Recommendation:** API route with SSE for Clarify (similar to existing reflection.ts pattern)

2. **Background Jobs:**
   - Option A: Supabase Edge Functions (pg_cron)
   - Option B: Vercel cron jobs
   - Option C: External service (not preferred - adds complexity)
   - **Recommendation:** Vercel cron jobs (already using Vercel for hosting)

3. **Function Calling:**
   - Use Claude's native tool_use API
   - Define `createDream` tool with structured parameters
   - Handle tool results gracefully

---

## Database Schema Changes

### New Tables Required

```sql
-- 1. clarify_sessions (stores conversation sessions)
CREATE TABLE clarify_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  dream_created_id UUID REFERENCES dreams(id) ON DELETE SET NULL
);

-- 2. clarify_messages (individual messages in sessions)
CREATE TABLE clarify_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES clarify_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  consolidated BOOLEAN DEFAULT FALSE
);

-- 3. clarify_patterns (extracted patterns from conversations)
CREATE TABLE clarify_patterns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
  content TEXT NOT NULL,
  strength INTEGER CHECK (strength BETWEEN 1 AND 10),
  source_message_ids UUID[],
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. evolution_events (dream evolution history)
CREATE TABLE evolution_events (
  id UUID PRIMARY KEY,
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE,
  old_title TEXT NOT NULL,
  old_description TEXT,
  new_title TEXT NOT NULL,
  new_description TEXT,
  reflection TEXT, -- user's words on why it evolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. achievement_ceremonies (journey synthesis for achieved dreams)
CREATE TABLE achievement_ceremonies (
  id UUID PRIMARY KEY,
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE UNIQUE,
  journey_synthesis JSONB, -- {first_reflection, struggles, breakthroughs, final_reflection}
  who_you_were TEXT, -- AI-generated
  who_you_became TEXT, -- AI-generated
  user_closing_words TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. release_rituals (letting go ceremony for released dreams)
CREATE TABLE release_rituals (
  id UUID PRIMARY KEY,
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE UNIQUE,
  what_it_protected_you_from TEXT,
  what_it_gave_you TEXT,
  why_no_longer_alive TEXT,
  gratitude_statement TEXT,
  closing_words TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Schema Modifications Required

```sql
-- users table additions
ALTER TABLE users ADD COLUMN clarify_sessions_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_clarify_sessions INTEGER DEFAULT 0;

-- dreams table additions
ALTER TABLE dreams ADD COLUMN evolution_count INTEGER DEFAULT 0;
ALTER TABLE dreams ADD COLUMN has_ceremony BOOLEAN DEFAULT FALSE;
ALTER TABLE dreams ADD COLUMN has_ritual BOOLEAN DEFAULT FALSE;
ALTER TABLE dreams ADD COLUMN clarify_session_id UUID REFERENCES clarify_sessions(id);
```

---

## New API Routes Required

### tRPC Routers to Create

| Router | Procedures | Complexity |
|--------|------------|------------|
| `clarify` | `createSession`, `listSessions`, `getSession`, `sendMessage`, `deleteSession` | HIGH |
| `patterns` | `list`, `getForUser` (internal use mainly) | LOW |
| `ceremonies` | `startAchievement`, `generateSynthesis`, `saveClosingWords`, `getCeremony` | MEDIUM |
| `rituals` | `startRelease`, `saveProgress`, `completeRelease`, `getRitual` | MEDIUM |

### Router Details

**clarify.ts (NEW):**
```typescript
// createSession - starts new Clarify session, checks rate limit
// listSessions - returns user's sessions (paginated)
// getSession - returns session with messages
// sendMessage - streams response, handles function calling
// deleteSession - removes session and messages
```

**ceremonies.ts (NEW):**
```typescript
// startAchievement - initiates ceremony flow, generates synthesis
// generateSynthesis - AI generates journey synthesis and who_you_were/became
// saveClosingWords - user adds optional closing words
// getCeremony - returns ceremony for display
```

**rituals.ts (NEW):**
```typescript
// startRelease - initiates ritual flow
// saveProgress - saves partial answers (resume support)
// completeRelease - seals dream, stores ritual
// getRitual - returns ritual for display
```

### Existing Router Modifications

| Router | Changes |
|--------|---------|
| `dreams.ts` | Add `evolve` procedure, modify `updateStatus` to trigger ceremony/ritual flows |
| `users.ts` | Add Clarify usage tracking to `getMe` response |
| `middleware.ts` | Add `checkClarifyLimit` middleware |

---

## Frontend Components Required

### New Pages

| Page | Route | Complexity |
|------|-------|------------|
| Clarify Sessions List | `/clarify` | LOW |
| Clarify Chat | `/clarify/[sessionId]` | HIGH |
| Achievement Ceremony | `/dreams/[id]/ceremony` | MEDIUM |
| Release Ritual | `/dreams/[id]/ritual` | MEDIUM |
| Dream History (Evolution) | `/dreams/[id]/history` | LOW |

### New Components

| Component | Location | Complexity |
|-----------|----------|------------|
| `ClarifySessionList` | `components/clarify/` | LOW |
| `ClarifyChat` | `components/clarify/` | HIGH |
| `MessageBubble` | `components/clarify/` | LOW |
| `StreamingMessage` | `components/clarify/` | MEDIUM |
| `DreamSuggestionCard` | `components/clarify/` | LOW |
| `EvolutionModal` | `components/dreams/` | MEDIUM |
| `EvolutionHistory` | `components/dreams/` | LOW |
| `AchievementCeremony` | `components/ceremonies/` | MEDIUM |
| `JourneySynthesis` | `components/ceremonies/` | MEDIUM |
| `ReleaseRitual` | `components/rituals/` | MEDIUM |
| `RitualPromptStep` | `components/rituals/` | LOW |

### Navigation Updates

- Add "Clarify" to `BottomNavigation.tsx` NAV_ITEMS
- Add "Clarify" to `AppNavigation.tsx` (desktop)
- Consider replacing one existing item or adding 7th tab

---

## Complexity Assessment by Feature

| Feature | Backend | Frontend | Database | AI | Overall |
|---------|---------|----------|----------|-----|---------|
| Clarify Agent | HIGH | HIGH | MEDIUM | HIGH | **HIGH** |
| Memory Layer | HIGH | LOW | MEDIUM | MEDIUM | **HIGH** |
| Dream Evolution | LOW | MEDIUM | LOW | NONE | **MEDIUM** |
| Achievement Ceremony | MEDIUM | MEDIUM | LOW | MEDIUM | **MEDIUM** |
| Release Ritual | LOW | MEDIUM | LOW | NONE | **LOW-MEDIUM** |
| Rate Limits | LOW | LOW | LOW | NONE | **LOW** |

---

## Iteration Breakdown Recommendation

### Recommendation: MULTI-ITERATION (3 phases)

Given the complexity and interdependencies, a 3-iteration approach ensures:
1. Solid foundation before building features on top
2. Testable milestones at each phase
3. Risk mitigation through incremental delivery

---

### Suggested Iteration Phases

**Iteration 1: Foundation & Dream Lifecycle Completion**
- **Vision:** Complete the dream lifecycle with evolution, achievement, and release flows
- **Scope:**
  - Database schema for evolution_events, achievement_ceremonies, release_rituals
  - Dream Evolution modal and history display
  - Achievement Ceremony flow and UI
  - Release Ritual flow and UI
  - Update dreams.ts router with evolve, ceremony, ritual procedures
- **Why first:**
  - Lower complexity than Clarify
  - Can be tested independently
  - Provides immediate value to existing users
  - Establishes patterns for ceremony/ritual UI
- **Estimated duration:** 8-10 hours
- **Risk level:** LOW-MEDIUM
- **Success criteria:**
  - Dreams can be evolved with history preserved
  - Achievement triggers ceremony flow with AI synthesis
  - Release triggers ritual flow with guided prompts
  - All ceremonies/rituals stored and viewable

**Iteration 2: Clarify Agent Core**
- **Vision:** Introduce pre-dream exploration through conversational AI
- **Scope:**
  - Database schema for clarify_sessions, clarify_messages
  - Clarify router with session management
  - Streaming chat interface
  - Function calling for dream creation
  - Navigation updates (add "Clarify" tab)
  - Rate limit enforcement
  - User usage tracking
- **Dependencies from Iteration 1:**
  - Dreams router patterns (for createDream function call)
  - UI patterns from ceremony/ritual flows
- **Estimated duration:** 12-16 hours
- **Risk level:** HIGH
- **Success criteria:**
  - Users can start Clarify sessions
  - Streaming responses work smoothly
  - Agent can propose and create dreams
  - Sessions persist and can be resumed
  - Rate limits enforced per tier

**Iteration 3: Memory Layer & Polish**
- **Vision:** Enable pattern recognition and continuity across sessions
- **Scope:**
  - Database schema for clarify_patterns
  - Pattern consolidation job (Claude Haiku)
  - Context injection into system prompts
  - Cron job setup (Vercel cron or Supabase)
  - Extended thinking for Unlimited tier
  - Polish and edge case handling
- **Dependencies from Iteration 2:**
  - Clarify sessions and messages exist
  - Chat flow is working
- **Estimated duration:** 6-8 hours
- **Risk level:** MEDIUM
- **Success criteria:**
  - Nightly consolidation extracts patterns
  - Returning users get context-aware greetings
  - Patterns surface appropriately in conversation
  - Extended thinking works for Unlimited tier

---

## Dependency Graph

```
Iteration 1: Dream Lifecycle Completion
├── evolution_events table
├── achievement_ceremonies table
├── release_rituals table
├── dreams.evolve procedure
├── ceremonies router
├── rituals router
├── EvolutionModal component
├── AchievementCeremony page
└── ReleaseRitual page
    ↓
Iteration 2: Clarify Agent Core
├── clarify_sessions table
├── clarify_messages table
├── users.clarify tracking columns
├── clarify router (uses dreams.create pattern)
├── ClarifySessionList page
├── ClarifyChat page (uses ceremony UI patterns)
├── Navigation updates
└── StreamingMessage component
    ↓
Iteration 3: Memory Layer & Polish
├── clarify_patterns table
├── patterns router
├── Consolidation job (Vercel cron)
├── Context injection (builds on clarify router)
├── Extended thinking toggle
└── Edge case handling
```

---

## Risk Assessment

### High Risks

**1. Streaming Chat Implementation**
- **Impact:** Poor UX if streaming doesn't work smoothly; potential timeout issues
- **Mitigation:**
  - Use proven patterns (SSE via Next.js API routes)
  - Implement client-side streaming with proper error handling
  - Add reconnection logic for dropped connections
- **Recommendation:** Address in Iteration 2 with dedicated focus

**2. Function Calling Reliability**
- **Impact:** Dreams may not be created correctly from Clarify
- **Mitigation:**
  - Test Claude tool_use extensively before integrating
  - Add confirmation step before creating dream
  - Implement fallback (manual creation if function fails)
- **Recommendation:** Build robust error handling into Iteration 2

### Medium Risks

**1. Background Job Reliability (Consolidation)**
- **Impact:** Patterns may not update, stale context
- **Mitigation:**
  - Implement on-demand consolidation as backup
  - Add monitoring/alerting for job failures
  - Design for eventual consistency
- **Recommendation:** Keep consolidation simple in Iteration 3

**2. Cost Overrun with Clarify Sessions**
- **Impact:** AI costs exceed projections
- **Mitigation:**
  - Strict rate limits enforced server-side
  - Monitor actual usage vs projections
  - Use Haiku for consolidation (not Sonnet)
- **Recommendation:** Build cost tracking dashboard

### Low Risks

**1. UI Complexity for Ceremonies/Rituals**
- **Impact:** Flows may feel clunky
- **Mitigation:** Follow existing glass morphism patterns
- **Recommendation:** Keep flows simple, add polish iteratively

---

## Integration Considerations

### Cross-Phase Integration Points

**1. Dream Creation Pattern**
- Used by: Clarify function calling (Iter 2), existing dreams page
- Must maintain: Consistent validation, rate limit checks
- Recommendation: Extract shared dream creation logic

**2. AI Generation Pattern**
- Used by: Reflections, Ceremonies, Clarify
- Must maintain: Consistent prompt structure, error handling
- Recommendation: Extend prompts.ts with new prompt types

**3. Usage Tracking**
- Used by: All tier-limited features
- Must maintain: Consistent monthly reset, accurate counts
- Recommendation: Centralize usage tracking in middleware

### Potential Integration Challenges

**1. Navigation Space**
- Challenge: 6 items already in bottom nav, adding Clarify = 7
- Solution options:
  - Replace "Visual" with "Clarify" (combine with Evolution)
  - Add "Clarify" and use overflow menu
  - Make Clarify accessible from dashboard, not main nav
- Recommendation: Add "Clarify" as prominent nav item, consider reducing existing items

**2. System Prompt Complexity**
- Challenge: Clarify prompts need patterns + dreams + reflections context
- Solution: Build context builder function that assembles from multiple sources
- Recommendation: Keep context injection under 2000 tokens to maintain response quality

---

## Recommendations for Master Plan

1. **Start with Dream Lifecycle (Iteration 1)**
   - Lower risk, immediate user value
   - Establishes UI patterns for later iterations
   - Can be released independently

2. **Allocate most time to Clarify (Iteration 2)**
   - Core differentiating feature
   - Highest technical complexity
   - Plan for 12-16 hours minimum

3. **Keep Memory Layer simple (Iteration 3)**
   - Nightly batch is fine for MVP
   - Real-time patterns can come later
   - Focus on reliable basic functionality

4. **Consider mobile-first for Clarify**
   - Chat is naturally mobile-friendly
   - Test streaming on mobile devices early
   - Ensure bottom nav works with chat input

5. **Plan for cost monitoring**
   - Build usage dashboard for creator
   - Track actual vs projected costs
   - Have circuit breakers for runaway usage

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14, tRPC, Supabase, React Query, Tailwind, Framer Motion
- **Patterns observed:**
  - Protected procedures in middleware.ts
  - Zod schemas in types/schemas.ts
  - Glass morphism UI components in components/ui/glass/
  - Sacred/cosmic design language throughout
- **Opportunities:**
  - Good component library to extend
  - Clear middleware patterns for rate limiting
  - Established prompt loading system
- **Constraints:**
  - Must maintain existing user experience
  - Must work within Supabase (no additional services)
  - Must maintain 70% margin on AI costs

### Specific Recommendations

1. **For Streaming:** Use Next.js API route with `TextEncoderStream` (similar pattern to reflection generation but with SSE)

2. **For Function Calling:** Use Claude's tool_use with typed schema matching dreams.create input

3. **For Background Jobs:** Use Vercel cron jobs with `/api/cron/consolidate` endpoint

4. **For Context Building:** Create `lib/clarify/context-builder.ts` that assembles system prompt components

---

## Notes & Observations

1. **Philosophical Alignment:** The vision document has deep philosophical grounding ("dream fog", "mirror not guide"). Implementation should honor this - Clarify should feel contemplative, not transactional.

2. **Existing Dreams Router:** Already has `status` enum with 'achieved', 'archived', 'released' - foundation exists for ceremonies/rituals.

3. **Tier Naming:** Vision uses "Pro" and "Unlimited" but codebase has "pro" and "unlimited" - need to ensure consistency.

4. **Safety Boundary:** Clarify agent needs crisis detection and appropriate response. Consider adding content filtering or escalation logic.

5. **Session Persistence:** Vision says sessions persist indefinitely - need cleanup strategy for very old sessions or implement archiving.

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
