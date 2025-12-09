# Exploration Report - Iteration 25: Memory Layer & Polish

## Executive Summary

Iteration 25 completes the Clarify Agent with the memory layer that makes conversations truly powerful - pattern extraction, cross-session context, and integration with the broader Mirror of Dreams experience. The existing Clarify implementation from Iteration 24 provides a solid foundation: complete CRUD operations, Claude Sonnet 4.5 integration, and proper tier-gating. This iteration adds the "brain" behind the agent.

## Scope Analysis

### Features to Implement

1. **Pattern Consolidation Function (Haiku-powered)**
   - Extract recurring themes, tensions, and potential dreams from messages
   - Use Claude Haiku 3.5 for cost efficiency (~$0.02 per run)
   - Mark messages as consolidated after processing

2. **Vercel Cron Job for Nightly Consolidation**
   - Schedule via vercel.json crons configuration
   - Process users with unconsolidated messages
   - Handle rate limits and errors gracefully

3. **Context Builder for System Prompt Injection**
   - Fetch recent sessions, patterns, dreams, reflections
   - Build structured context for each session
   - Manage token budget (stay within limits)

4. **Token Budget Management**
   - Estimate token counts for context components
   - Prioritize what to include when budget is tight
   - Graceful degradation when context is large

5. **Session Title Auto-generation**
   - Already partially implemented via database trigger
   - Enhance with AI-generated summaries for older sessions

6. **Integration with Dashboard/Profile**
   - Add Clarify stats to dashboard
   - Show usage in profile

7. **Mobile Polish for Clarify**
   - Improve input area on mobile
   - Fix any layout issues
   - Enhance touch interactions

---

## Existing Implementation Analysis

### Clarify Router (`server/trpc/routers/clarify.ts`)

**Strengths:**
- Complete CRUD operations (createSession, getSession, listSessions, sendMessage, etc.)
- Lazy Anthropic client initialization
- Cached system prompt loading
- Proper session ownership verification
- Usage tracking (sessions this month)

**Extension Points for Memory Layer:**
```typescript
// Current sendMessage flow:
1. Store user message
2. Fetch ALL session messages (no limit!)
3. Call Claude with full conversation history
4. Store AI response

// CHANGE NEEDED: Inject context builder before Claude call
const context = await buildClarifyContext(userId, sessionId);
// Then prepend to system prompt
```

**Key Files:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/clarify.ts` (14,132 bytes)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/clarify.ts` (2,377 bytes)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt` (2,581 bytes)

### System Prompt Pattern

Current system prompt is static, loaded from file:
```typescript
function getClarifySystemPrompt(): string {
  if (!cachedSystemPrompt) {
    const promptPath = path.join(process.cwd(), 'prompts', 'clarify_agent.txt');
    cachedSystemPrompt = fs.readFileSync(promptPath, 'utf8');
  }
  return cachedSystemPrompt;
}
```

**Change Needed:** Create context builder that appends dynamic context to static prompt.

### Database Schema

**Existing tables:**
- `clarify_sessions` - id, user_id, title, status, message_count, last_message_at, dream_id
- `clarify_messages` - id, session_id, role, content, token_count, tool_use

**Missing for Iteration 25:**
```sql
-- clarify_patterns table (NEW)
CREATE TABLE public.clarify_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
    content TEXT NOT NULL,
    strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
    source_message_ids UUID[] DEFAULT '{}',
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add consolidated flag to messages
ALTER TABLE public.clarify_messages
ADD COLUMN IF NOT EXISTS consolidated BOOLEAN DEFAULT FALSE;
```

### Current Constants (`lib/utils/constants.ts`)

```typescript
export const CLARIFY_SESSION_LIMITS = {
  free: 0,        // Free tier cannot access Clarify
  pro: 20,        // 20 sessions/month
  unlimited: 30,  // 30 sessions/month
} as const;
```

**Token Limits Needed (NEW):**
```typescript
export const CLARIFY_CONTEXT_LIMITS = {
  maxContextTokens: 8000,      // Max tokens for injected context
  maxRecentMessages: 20,       // Recent messages from current session
  maxCrossSessions: 3,         // Other sessions to reference
  maxPatterns: 10,             // Patterns to include
  maxDreams: 5,                // Active dreams to include
  maxReflections: 3,           // Recent reflections to include
} as const;
```

---

## Vercel Cron Jobs Pattern

**Current vercel.json:**
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "headers": [...]
}
```

**Add crons configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/consolidate-patterns",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**API Route Pattern:**
```typescript
// app/api/cron/consolidate-patterns/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run consolidation
  try {
    const result = await consolidatePatterns();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: 'Consolidation failed' }, { status: 500 });
  }
}
```

---

## Context Builder Design

### Token Budget Strategy

**Model limits:**
- Claude Sonnet 4.5: 200k context window
- Safe budget for user context: ~8,000 tokens
- Reserve ~150k for conversation history
- Leave room for response generation

**Priority order for context injection:**
1. **Critical (always include):**
   - User name
   - Active dreams (titles only)
   - Current session context

2. **High priority (include if space):**
   - Top 5 patterns with strength > 5
   - Recent reflection themes (titles/tags only)

3. **Medium priority (include if space):**
   - Summaries of last 3 sessions
   - Dream descriptions (truncated)

4. **Low priority (skip if tight):**
   - Full pattern descriptions
   - Older session details

### Token Estimation Function

```typescript
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}
```

### Context Builder Implementation Sketch

```typescript
interface ClarifyContext {
  userContext: string;      // Name, tier, stats
  dreamsContext: string;    // Active dreams
  patternsContext: string;  // Extracted patterns
  sessionsContext: string;  // Recent session summaries
  reflectionsContext: string; // Recent reflection themes
}

async function buildClarifyContext(
  userId: string, 
  currentSessionId: string
): Promise<string> {
  const budget = CLARIFY_CONTEXT_LIMITS.maxContextTokens;
  let usedTokens = 0;
  const parts: string[] = [];
  
  // 1. User context (always include)
  const user = await getUser(userId);
  const userContext = `User: ${user.name}`;
  parts.push(userContext);
  usedTokens += estimateTokens(userContext);
  
  // 2. Active dreams (always include)
  const dreams = await getActiveDreams(userId, 5);
  const dreamsContext = formatDreamsContext(dreams);
  parts.push(dreamsContext);
  usedTokens += estimateTokens(dreamsContext);
  
  // 3. Patterns (if space)
  if (usedTokens < budget * 0.6) {
    const patterns = await getTopPatterns(userId, 10);
    const patternsContext = formatPatternsContext(patterns);
    parts.push(patternsContext);
    usedTokens += estimateTokens(patternsContext);
  }
  
  // 4. Recent sessions (if space)
  if (usedTokens < budget * 0.8) {
    const sessions = await getRecentSessions(userId, currentSessionId, 3);
    const sessionsContext = formatSessionsContext(sessions);
    parts.push(sessionsContext);
    usedTokens += estimateTokens(sessionsContext);
  }
  
  // 5. Recent reflections (if space)
  if (usedTokens < budget * 0.95) {
    const reflections = await getRecentReflections(userId, 3);
    const reflectionsContext = formatReflectionsContext(reflections);
    parts.push(reflectionsContext);
  }
  
  return parts.join('\n\n');
}
```

---

## Pattern Consolidation Design

### Consolidation Prompt (Haiku)

```typescript
const CONSOLIDATION_PROMPT = `
You are analyzing Clarify conversation messages to extract patterns.

Review these messages and identify:
1. RECURRING_THEMES: Topics, ideas, or concerns that appear multiple times
2. TENSIONS: Internal conflicts, contradictions, or stuck points
3. POTENTIAL_DREAMS: Aspirations that haven't been formally declared
4. IDENTITY_SIGNALS: How they see themselves, their values, their growth

For each pattern, provide:
- type: One of the four types above
- content: A brief description (1-2 sentences)
- strength: 1-10 based on frequency/intensity

Return JSON array of patterns:
[
  {"type": "recurring_theme", "content": "...", "strength": 7},
  {"type": "tension", "content": "...", "strength": 5}
]

MESSAGES TO ANALYZE:
{messages}
`;
```

### Consolidation Function

```typescript
async function consolidateUserPatterns(userId: string): Promise<number> {
  // 1. Get unconsolidated messages
  const { data: messages } = await supabase
    .from('clarify_messages')
    .select('id, content, role, session_id')
    .eq('consolidated', false)
    .in('session_id', 
      supabase.from('clarify_sessions')
        .select('id')
        .eq('user_id', userId)
    )
    .order('created_at', { ascending: true })
    .limit(50);
  
  if (!messages || messages.length < 5) {
    return 0; // Not enough messages to consolidate
  }
  
  // 2. Format for Haiku
  const formattedMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n---\n');
  
  // 3. Call Claude Haiku
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000,
    system: 'You are a pattern extraction assistant. Output valid JSON only.',
    messages: [{
      role: 'user',
      content: CONSOLIDATION_PROMPT.replace('{messages}', formattedMessages)
    }]
  });
  
  // 4. Parse patterns
  const textBlock = response.content.find(b => b.type === 'text');
  const patterns = JSON.parse(textBlock.text);
  
  // 5. Upsert patterns (merge with existing)
  for (const pattern of patterns) {
    await upsertPattern(userId, pattern, messages.map(m => m.id));
  }
  
  // 6. Mark messages as consolidated
  await supabase
    .from('clarify_messages')
    .update({ consolidated: true })
    .in('id', messages.map(m => m.id));
  
  return patterns.length;
}
```

---

## Dashboard Integration

### Current Dashboard Cards

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/`

**Available cards:**
- DreamsCard.tsx
- ReflectionsCard.tsx
- ProgressStatsCard.tsx
- EvolutionCard.tsx
- VisualizationCard.tsx
- SubscriptionCard.tsx
- UsageCard.tsx

**Option A: Add ClarifyCard**
```tsx
// components/dashboard/cards/ClarifyCard.tsx
const ClarifyCard = () => {
  const { data: limits } = trpc.clarify.getLimits.useQuery();
  const { data: sessions } = trpc.clarify.listSessions.useQuery({ limit: 3 });
  
  return (
    <DashboardCard>
      <CardHeader>
        <CardTitle>Clarify Sessions</CardTitle>
        <HeaderAction href="/clarify">View All</HeaderAction>
      </CardHeader>
      <CardContent>
        {/* Sessions used this month */}
        <div className="stat-primary">
          {limits?.sessionsUsed} / {limits?.sessionsLimit}
        </div>
        {/* Recent sessions list */}
        {sessions?.sessions.slice(0, 3).map(session => (
          <SessionItem key={session.id} session={session} />
        ))}
      </CardContent>
    </DashboardCard>
  );
};
```

**Option B: Integrate into ProgressStatsCard**
Add Clarify stats alongside reflection stats.

**Recommendation:** Option A - Dedicated ClarifyCard, shown only to paid users.

---

## Profile Integration

### Current Profile Stats

```tsx
// From app/profile/page.tsx
<div>
  <label>Reflections This Month</label>
  <p>{user?.reflectionCountThisMonth} / {user?.tier === 'free' ? '2' : '30'}</p>
</div>
```

**Add Clarify stats:**
```tsx
{user?.tier !== 'free' && (
  <div>
    <label>Clarify Sessions This Month</label>
    <p>{user?.clarifySessionsThisMonth} / {CLARIFY_SESSION_LIMITS[user.tier]}</p>
  </div>
)}

<div>
  <label>Total Clarify Sessions</label>
  <p>{user?.totalClarifySessions}</p>
</div>
```

---

## Mobile Polish Analysis

### Current Clarify Session Page Issues

From `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx`:

**Input Area:**
```tsx
<div className="px-4 sm:px-8 pb-20 md:pb-6">
  <GlassCard className="flex items-end gap-3">
    <textarea ... />
    <GlowButton ... />
  </GlassCard>
</div>
```

**Issues to address:**
1. `pb-20` is hardcoded for bottom nav - should use safe-area-inset
2. Textarea doesn't have proper mobile keyboard handling
3. Send button could be larger on mobile

**Fixes:**
```tsx
// Fix 1: Safe area inset
<div className="px-4 sm:px-8 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6">

// Fix 2: Textarea improvements
<textarea
  inputMode="text"
  enterKeyHint="send"
  className="... text-base" // At least 16px to prevent zoom
/>

// Fix 3: Larger touch target on mobile
<GlowButton className="min-w-[44px] min-h-[44px]">
```

### Bottom Navigation Integration

Already handled in `BottomNavigation.tsx`:
```typescript
const navItems: NavItem[] = [
  ...BASE_NAV_ITEMS,
  ...(user?.tier !== 'free' ? [CLARIFY_NAV_ITEM] : []),
  ...REMAINING_NAV_ITEMS,
];
```

---

## Implementation Plan

### Database Migration (5 min)
```sql
-- 20251211000000_memory_layer.sql

-- 1. Clarify patterns table
CREATE TABLE public.clarify_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring_theme', 'tension', 'potential_dream', 'identity_signal')),
    content TEXT NOT NULL,
    strength INTEGER DEFAULT 1 CHECK (strength BETWEEN 1 AND 10),
    source_message_ids UUID[] DEFAULT '{}',
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clarify_patterns_user_id ON public.clarify_patterns(user_id);
CREATE INDEX idx_clarify_patterns_type ON public.clarify_patterns(pattern_type);
CREATE INDEX idx_clarify_patterns_strength ON public.clarify_patterns(strength DESC);

-- RLS
ALTER TABLE public.clarify_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns"
  ON public.clarify_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert/update patterns (via service role)
CREATE POLICY "Service can manage patterns"
  ON public.clarify_patterns FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Add consolidated flag to messages
ALTER TABLE public.clarify_messages
ADD COLUMN IF NOT EXISTS consolidated BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clarify_messages_consolidated 
ON public.clarify_messages(consolidated) WHERE consolidated = FALSE;
```

### Backend Implementation Order

1. **Context Builder** (`server/lib/clarify-context.ts`)
   - Token estimation function
   - Context fetching functions
   - Priority-based context assembly

2. **Pattern Consolidation** (`server/lib/pattern-consolidation.ts`)
   - Haiku prompt
   - Pattern extraction function
   - Pattern upsert logic

3. **Cron Job** (`app/api/cron/consolidate-patterns/route.ts`)
   - Auth verification
   - Batch user processing
   - Error handling

4. **Update Clarify Router**
   - Integrate context builder into sendMessage
   - Add manual consolidation endpoint for testing

### Frontend Implementation Order

1. **Dashboard Card** (`components/dashboard/cards/ClarifyCard.tsx`)
   - Session stats
   - Recent sessions preview
   - Paid-only gate

2. **Profile Updates** (`app/profile/page.tsx`)
   - Add Clarify usage section
   - Show patterns discovered (optional)

3. **Mobile Polish** (`app/clarify/[sessionId]/page.tsx`)
   - Fix safe area padding
   - Improve textarea UX
   - Larger touch targets

---

## Complexity Assessment

### High Complexity

**Context Builder**
- Token budget management across multiple data sources
- Priority-based inclusion logic
- Graceful degradation when context is large
- Estimated: 2-3 hours

**Pattern Consolidation**
- Haiku integration
- JSON parsing with error handling
- Pattern merging/deduplication
- Estimated: 2-3 hours

### Medium Complexity

**Cron Job**
- Vercel cron configuration
- Batch processing
- Error handling
- Estimated: 1-2 hours

**Dashboard Card**
- Follow existing card patterns
- tRPC integration
- Conditional rendering
- Estimated: 1 hour

### Low Complexity

**Profile Updates**
- Add stats display
- Conditional rendering
- Estimated: 30 min

**Mobile Polish**
- CSS fixes
- Input improvements
- Estimated: 30 min

**Total Estimate:** 8-12 hours

---

## Technical Risks

### 1. Token Budget Overflow
**Risk:** Context injection exceeds model limits
**Mitigation:** 
- Hard cap at 8000 tokens
- Progressive truncation
- Log warnings when approaching limit

### 2. Pattern Quality
**Risk:** Haiku extracts low-quality patterns
**Mitigation:**
- Require minimum message count (5+)
- Add strength decay over time
- Allow manual pattern review later

### 3. Cron Job Reliability
**Risk:** Vercel cron misses runs or times out
**Mitigation:**
- Add fallback: consolidate on session start if stale
- Log all consolidation runs
- Monitor via Vercel dashboard

### 4. Context Staleness
**Risk:** Patterns not updated frequently enough
**Mitigation:**
- Nightly consolidation for most users
- Consider on-demand consolidation for Unlimited tier

---

## Open Questions

1. **Should patterns be visible to users?**
   - Option A: Hidden, only used for context
   - Option B: Visible in a "Patterns Discovered" section
   - **Recommendation:** Start with A, add B later

2. **How to handle first-time users with no patterns?**
   - Agent works without patterns
   - Encourage more exploration

3. **Should session titles be AI-generated?**
   - Current: First 60 chars of first message (database trigger)
   - Alternative: Generate with Haiku after 3+ messages
   - **Recommendation:** Keep simple for now, enhance later

4. **Manual consolidation endpoint for testing?**
   - Useful for development
   - Should be protected (creator/admin only)
   - **Recommendation:** Yes, add clarify.consolidatePatterns

---

## Files to Create/Modify

### New Files
- `supabase/migrations/20251211000000_memory_layer.sql`
- `server/lib/clarify-context.ts`
- `server/lib/pattern-consolidation.ts`
- `types/pattern.ts`
- `app/api/cron/consolidate-patterns/route.ts`
- `components/dashboard/cards/ClarifyCard.tsx`

### Modified Files
- `vercel.json` (add crons)
- `lib/utils/constants.ts` (add context limits)
- `server/trpc/routers/clarify.ts` (integrate context builder)
- `app/clarify/[sessionId]/page.tsx` (mobile polish)
- `app/profile/page.tsx` (add Clarify stats)
- `app/dashboard/page.tsx` (add ClarifyCard)

---

## Testing Plan

### Unit Tests
- Token estimation accuracy
- Context priority logic
- Pattern extraction parsing

### Integration Tests
- Context builder with database
- Consolidation with Haiku
- Cron job authentication

### Manual Tests
1. Create session, send messages, verify context in logs
2. Trigger manual consolidation, verify patterns created
3. Return to session, verify patterns reflected in responses
4. Test mobile input on iOS/Android

---

## Summary

Iteration 25 adds the "memory" that transforms Clarify from a simple chatbot into a true companion that knows the user across time. The implementation builds on solid foundations from Iteration 24:

1. **Context Builder:** Injects dreams, patterns, and history into each conversation
2. **Pattern Consolidation:** Extracts recurring themes via Haiku (cost-efficient)
3. **Cron Job:** Automates nightly pattern extraction
4. **Integration:** Dashboard card and profile stats
5. **Polish:** Mobile UX improvements

The primary challenge is managing token budgets effectively while maintaining valuable context injection.

---

**Report Status:** COMPLETE
**Exploration Date:** 2025-12-09
**Explorer Agent:** Memory Layer & Polish Analysis
