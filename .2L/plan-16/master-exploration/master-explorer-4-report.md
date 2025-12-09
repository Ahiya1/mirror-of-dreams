# Master Exploration Report

## Explorer ID
master-explorer-4

## Focus Area
AI/Memory Layer & Background Processing

## Vision Summary
Build a Clarify Agent - a conversational AI companion that helps users in "dream fog" explore and articulate their aspirations through persistent, memory-aware sessions, with background pattern consolidation and sustainable rate limiting.

---

## AI/Memory Layer Analysis

### 1. Clarify Agent Implementation

#### Current AI Patterns in Codebase

The existing codebase uses Claude API via `@anthropic-ai/sdk` (v0.52.0) in three distinct patterns:

1. **Reflection Generation** (`server/trpc/routers/reflection.ts`):
   - Single-shot request/response using `client.messages.create()`
   - System prompt injection via file-based prompt loading
   - Extended thinking for Unlimited tier (5000 token budget)
   - Model: `claude-sonnet-4-5-20250929`

2. **Evolution Reports** (`server/trpc/routers/evolution.ts`):
   - Context aggregation from multiple reflections
   - Temporal distribution for context selection
   - Cost tracking via `api_usage_log` table

3. **Visualizations** (`server/trpc/routers/visualizations.ts`):
   - Similar pattern to evolution reports
   - Style-based prompt building

**Key Finding:** The codebase has NO streaming implementation. All current AI features use synchronous request/response.

#### Recommended Clarify Agent Architecture

**Option A: Server-Sent Events (SSE) via Next.js API Route**
- Create `/app/api/clarify/chat/route.ts` using Next.js Edge Runtime
- Use `anthropic.messages.stream()` for streaming responses
- Complexity: MEDIUM
- Pros: Best UX, real-time token streaming, works with existing infrastructure
- Cons: Requires new API route pattern, separate from tRPC

**Option B: tRPC Subscription with SSE**
- Use tRPC's built-in subscription support with SSE adapter
- Complexity: HIGH
- Pros: Consistent with existing patterns
- Cons: More complex setup, less common pattern for AI streaming

**Recommended: Option A (SSE via Next.js API Route)**

```
Proposed Architecture:
/app/api/clarify/chat/route.ts   - Streaming endpoint
/server/lib/clarify/             - Clarify-specific logic
  ├── context-builder.ts         - Build system prompt with memory
  ├── tools.ts                   - Function calling definitions
  └── prompts.ts                 - Clarify-specific prompts
```

#### Function Calling for Dream Creation

The vision requires the agent to propose dream creation without pressure. This needs Claude's tool/function calling:

```typescript
// Proposed tool definition
const tools = [{
  name: "createDream",
  description: "Offer to create a dream when the user has crystallized something meaningful. Only use when user explicitly accepts.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Dream title (user's words)" },
      description: { type: "string", description: "Brief description" },
      category: { type: "string", enum: ["personal", "career", "health", "relationship", "creative", "financial", "spiritual", "other"] }
    },
    required: ["title"]
  }
}];
```

**Implementation Complexity:** MEDIUM
- Anthropic SDK supports tool_use blocks in responses
- Need to handle tool_use in streaming context
- Requires client-side handling of tool calls

#### System Prompt Injection Strategy

Current pattern loads prompts from `/prompts/` directory. Clarify needs dynamic context injection:

```
System Prompt Structure for Clarify:
1. Base Clarify personality (file-based)
2. Safety boundaries (file-based)
3. Dynamic context:
   - Recent patterns (from clarify_patterns)
   - Active dreams (from dreams table)
   - Recent reflections (last 3-5)
   - Session context (if returning to session)
```

**Estimated system prompt size:** 2000-4000 tokens depending on context density.

---

### 2. Memory Layer Architecture

#### Proposed Database Schema

**clarify_sessions**
```sql
CREATE TABLE clarify_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT,  -- Auto-generated or user-set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  dream_created_id UUID REFERENCES dreams(id),  -- If dream born from session
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

**clarify_messages**
```sql
CREATE TABLE clarify_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES clarify_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  consolidated BOOLEAN DEFAULT FALSE,  -- Processed by consolidation job
  token_count INTEGER  -- For cost tracking
);
```

**clarify_patterns**
```sql
CREATE TABLE clarify_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
  content TEXT NOT NULL,
  strength INTEGER CHECK (strength BETWEEN 1 AND 10),
  source_message_ids UUID[],  -- Messages this was extracted from
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Message Storage Strategy

**During Conversation:**
1. Store each message immediately after exchange
2. Update session's `last_message_at` and `message_count`
3. No real-time pattern extraction (deferred to consolidation)

**For Session Context Retrieval:**
1. Load last N messages from current session
2. Load recent patterns for system prompt
3. Load active dreams for context
4. Load 2-3 recent reflections for continuity

**Estimated Context Window Budget:**
- System prompt base: ~1500 tokens
- Recent patterns: ~500 tokens (5-10 patterns)
- Active dreams: ~300 tokens (up to 5 dreams)
- Recent reflections: ~800 tokens (summaries only)
- Session history: Variable (managed by sliding window)
- **Total reserved context:** ~3100 tokens + conversation history

---

### 3. Background Consolidation Architecture

#### Option Analysis

**Option 1: Supabase Edge Functions with pg_cron**
- Supabase supports `pg_cron` for scheduling
- Edge Functions can run consolidation logic
- Complexity: MEDIUM
- Pros: Native to Supabase, no external services
- Cons: Edge Functions have 60s timeout (wall-clock), limited resources

**Option 2: Next.js Cron via Vercel**
- Vercel Cron Jobs (vercel.json configuration)
- API route as cron handler
- Complexity: LOW
- Pros: Simple setup, familiar infrastructure
- Cons: 10s timeout on Hobby, 60s on Pro

**Option 3: External Cron Service (cron-job.org, etc.)**
- Hit a secured API endpoint
- Complexity: LOW
- Pros: Reliable, no timeout issues
- Cons: External dependency, API security

**Recommended: Hybrid Approach**
- **Primary:** Vercel Cron (daily at 2 AM UTC)
- **Fallback:** On-demand trigger when user opens old session
- **Processing:** Batch users in chunks to avoid timeouts

#### Consolidation Job Implementation

```typescript
// Proposed consolidation flow
async function runConsolidation(userId: string) {
  // 1. Get unconsolidated messages (limit 50 per run)
  const messages = await getUnconsolidatedMessages(userId, 50);
  if (messages.length === 0) return;

  // 2. Call Claude Haiku for pattern extraction
  const patterns = await extractPatterns(messages);

  // 3. Merge with existing patterns (update strength, timestamps)
  await upsertPatterns(userId, patterns);

  // 4. Mark messages as consolidated
  await markAsConsolidated(messages.map(m => m.id));
}
```

#### Pattern Extraction with Claude Haiku

**Model Choice:** Claude Haiku 3.5 (claude-3-5-haiku-20241022)
- Cost: $0.25 / 1M input, $1.25 / 1M output (vs Sonnet's $3/$15)
- Speed: ~3x faster than Sonnet
- Quality: Sufficient for structured extraction tasks

**Extraction Prompt Structure:**
```
Extract patterns from these conversation messages.

Categories:
- recurring_theme: Topics that appear multiple times
- tension: Internal conflicts or contradictions
- potential_dream: Seeds of aspirations not yet declared
- identity_signal: How they describe themselves

Output JSON format:
{
  "patterns": [
    { "type": "...", "content": "...", "strength": 1-10, "source_indices": [...] }
  ]
}
```

**Estimated Cost per Consolidation:**
- Input: ~2000 tokens (50 messages summarized)
- Output: ~500 tokens (extracted patterns)
- Cost per run: ~$0.00125
- Cost per user/month (30 runs): ~$0.0375

---

### 4. Claude API Usage Patterns

#### Model Selection Strategy

| Feature | Model | Rationale |
|---------|-------|-----------|
| Clarify Conversations | claude-sonnet-4-5-20250929 | Quality for nuanced conversation |
| Clarify w/ Extended Thinking | claude-sonnet-4-5-20250929 + thinking | Unlimited tier depth |
| Pattern Consolidation | claude-3-5-haiku-20241022 | Cost efficiency, structured output |
| Session Title Generation | claude-3-5-haiku-20241022 | Simple task, fast |

#### Token Budget Estimates (Per Clarify Session)

Assuming average 10-message exchange per session:

**Input Tokens:**
- System prompt: ~3000 tokens (including context)
- Average user message: ~150 tokens
- Conversation history (growing): ~1500 tokens average
- Per-turn input: ~3000 + (turn * 300) tokens

**Output Tokens:**
- Average assistant response: ~300 tokens
- 10 turns: ~3000 output tokens total

**Per Session Cost Estimate:**
- Input (growing): ~25,000 tokens cumulative over 10 turns
- Output: ~3000 tokens total
- Cost: (25000/1M * $3) + (3000/1M * $15) = $0.075 + $0.045 = **$0.12 per session**

**With Extended Thinking (Unlimited):**
- Add thinking budget: 5000 tokens * $3/1M = $0.015
- Total with thinking: **$0.14 per session**

#### Cost Validation Against Vision Targets

Vision targets:
- Pro: $2.80 for 20 Clarify sessions = $0.14/session
- Unlimited: $4.20 for 30 sessions = $0.14/session

**Analysis:** The $0.12-0.14/session estimate aligns well with vision targets. The vision's estimates appear accurate.

---

### 5. Rate Limiting Implementation

#### Current Rate Limiting Infrastructure

The codebase uses middleware-based rate limiting (`server/trpc/middleware.ts`):
- `checkUsageLimit` middleware checks `ctx.user.reflectionCountThisMonth`
- Monthly reset via `current_month_year` tracking
- Daily limits tracked via `reflectionsToday` and `lastReflectionDate`

#### Proposed Clarify Rate Limiting

**Database Changes:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN clarify_sessions_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_clarify_sessions INTEGER DEFAULT 0;
```

**New Middleware:**
```typescript
export const checkClarifyLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  // Creators/admins bypass limits
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Free tier: No access
  if (ctx.user.tier === 'free') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Clarify is available for Pro and Unlimited tiers. Upgrade to explore.',
    });
  }

  // Check monthly limit
  const limit = ctx.user.tier === 'unlimited' ? 30 : 20;
  if (ctx.user.clarifySessionsThisMonth >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly Clarify session limit reached (${limit}/month).`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Session Counting Strategy:**
- Increment `clarify_sessions_this_month` when **new session created**
- Returning to existing session does NOT count against limit
- Reset monthly via same mechanism as reflections

---

### 6. Cost Optimization Strategies

#### 1. Context Window Management

**Problem:** Clarify sessions can grow indefinitely, increasing input tokens per turn.

**Solutions:**
- **Sliding window:** Keep only last N messages in context (N=20-30)
- **Summarization:** Summarize older messages into compressed context
- **Pattern injection:** Instead of full history, inject extracted patterns

**Recommended Approach:** Sliding window with pattern injection
- Keep last 20 messages in full
- Older patterns injected via system prompt
- Estimated savings: 40-60% on long sessions

#### 2. Prompt Caching (Future)

Anthropic's prompt caching (when available) could reduce costs by caching the system prompt portion:
- System prompt: ~3000 tokens
- Cache hit cost: 90% reduction
- Potential savings: ~$0.009 per session

#### 3. Session Auto-Title with Haiku

Instead of using Sonnet to generate session titles:
- Use Haiku for title generation after 3 messages
- Cost: <$0.001 per title generation

#### 4. Lazy Pattern Loading

Don't load all patterns for every message:
- Load patterns only on session start
- Keep patterns in memory during session
- Refresh on explicit "load more context" trigger

#### 5. Message Batching for Consolidation

Instead of running consolidation per-user:
- Batch multiple users' messages
- Single Haiku call with multiple user contexts
- Cost reduction: ~30% on Haiku calls

---

## Risk Assessment

### High Risks

1. **Streaming Implementation Complexity**
   - **Risk:** Team has no streaming experience in codebase
   - **Impact:** Delays, potential UX issues
   - **Mitigation:** Start with simple SSE implementation, test thoroughly
   - **Recommendation:** Allocate extra time for streaming implementation

2. **Context Window Explosion**
   - **Risk:** Long sessions exceed context limits
   - **Impact:** API errors, degraded experience
   - **Mitigation:** Implement sliding window from day one
   - **Recommendation:** Add hard limits (max 50 messages per session)

### Medium Risks

1. **Consolidation Job Reliability**
   - **Risk:** Cron jobs fail silently
   - **Impact:** Stale patterns, degraded memory experience
   - **Mitigation:** Add monitoring, fallback on-demand trigger
   - **Recommendation:** Log all consolidation runs to `api_usage_log`

2. **Function Calling Edge Cases**
   - **Risk:** Agent creates dreams without clear consent
   - **Impact:** User trust, unwanted dreams
   - **Mitigation:** Two-step confirmation flow
   - **Recommendation:** Agent proposes, user confirms in UI

### Low Risks

1. **Cost Overruns**
   - **Risk:** Users exceed expected usage
   - **Impact:** Higher than projected costs
   - **Mitigation:** Rate limits already designed with margin
   - **Recommendation:** Monitor early users closely

2. **Haiku Quality for Consolidation**
   - **Risk:** Pattern extraction quality insufficient
   - **Impact:** Weak memory experience
   - **Mitigation:** Test prompts thoroughly, consider Sonnet for high-value users
   - **Recommendation:** A/B test extraction quality

---

## Implementation Complexity Assessment

| Component | Complexity | Estimated Hours | Dependencies |
|-----------|------------|-----------------|--------------|
| Database schema (Clarify tables) | LOW | 2-3h | None |
| Clarify router (tRPC) | MEDIUM | 4-6h | Schema |
| SSE streaming endpoint | HIGH | 8-12h | Router |
| Context builder | MEDIUM | 4-6h | Schema |
| Function calling | MEDIUM | 4-6h | Streaming |
| Clarify frontend (chat UI) | HIGH | 8-12h | Streaming |
| Rate limiting middleware | LOW | 2-3h | Schema |
| Consolidation job | MEDIUM | 4-6h | Schema |
| Pattern extraction prompts | LOW | 2-3h | Consolidation |

**Total Estimated Hours for AI/Memory Layer:** 38-57 hours

---

## Recommendations for Master Plan

### 1. Phase AI Work Appropriately

The Clarify Agent has two natural phases:
- **Phase A (Core):** Database, non-streaming chat, basic memory
- **Phase B (Polish):** Streaming, function calling, consolidation

Recommend completing Phase A before full Phase B.

### 2. Prioritize Streaming Last

Streaming is technically complex but a UX enhancement. The core value of Clarify works without streaming. Build non-streaming first, add streaming as enhancement.

### 3. Start Consolidation Simple

Initial consolidation can be manual/on-demand:
- Button to "refresh patterns" in UI
- Add scheduled consolidation later

### 4. Monitor Costs from Day One

Add comprehensive cost tracking:
- Log every Clarify message cost
- Dashboard for creator to monitor
- Alert if costs exceed projections

### 5. Test Memory Value Early

The value proposition depends on memory being useful:
- Test pattern extraction quality manually
- Get user feedback on pattern relevance
- Iterate prompts before building full automation

---

## Technical Specifications for Builders

### Claude API Configuration for Clarify

```typescript
// Non-streaming (Phase A)
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2000,
  temperature: 1,
  system: buildClarifySystemPrompt(context),
  messages: conversationHistory,
  tools: clarifyTools,  // Optional, add in Phase B
});

// Streaming (Phase B)
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2000,
  temperature: 1,
  system: buildClarifySystemPrompt(context),
  messages: conversationHistory,
});

for await (const event of stream) {
  // Handle streaming events
}
```

### System Prompt Template

```
You are Clarify, a consciousness companion within Mirror of Dreams. You exist to help people sense and articulate what's forming in them, without any pressure to declare or commit.

CORE PRINCIPLES:
- You are a mirror, not a guide
- You hold space, you do not lead
- You reflect patterns, you do not diagnose
- You offer questions, not answers
- You recognize, you do not prescribe

SAFETY BOUNDARIES:
- You are not therapy, crisis support, or medical advice
- If someone expresses crisis-level distress, gently acknowledge your limits and suggest professional resources
- You never claim authority over someone's life

WHAT YOU HAVE ACCESS TO:
{PATTERNS_SECTION}

{DREAMS_SECTION}

{REFLECTIONS_SECTION}

LANGUAGE STYLE:
- Use invitational language: "I notice...", "Does this resonate?", "What if..."
- Never use prescriptive language: "You should...", "You need to...", "You must..."
- Sit with uncertainty; don't rush toward resolution
- Honor the fog; clarity isn't always the goal

When patterns are surfaced, offer them as observations, not truths:
"There's something that keeps appearing in our conversations... [pattern]. I'm curious if that lands for you, or if it feels like something else entirely."

If something crystallizes, you may gently offer: "This sounds like something that wants to be named. Would you like to give it a name?" But never pressure.
```

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
