# Iteration 24: Clarify Agent Core - Exploration Report

## Executive Summary

This report explores the Mirror of Dreams codebase to identify patterns and integration points for the Clarify Agent feature. The Clarify Agent is a conversational pre-dream exploration space where users can have ongoing conversations, return to past sessions, and optionally declare dreams when something crystallizes. The codebase has well-established patterns for:

1. **AI Integration** - Anthropic SDK usage with Claude Sonnet 4.5
2. **Database Patterns** - Session/message table structures similar to reflections
3. **Rate Limiting** - Tier-based usage limits with middleware
4. **Navigation** - Tier-gated features with user context
5. **Component System** - Glass design system with reusable components

However, there are **NO existing streaming/SSE patterns** in the codebase - this will be new infrastructure.

---

## 1. Current AI/Anthropic Integration Patterns

### Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

The application uses the Anthropic SDK with **lazy initialization** pattern:

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization - client created only when procedure called
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}
```

### API Call Pattern (Non-Streaming)

Current usage in reflection.ts (line 92-125):

```typescript
const requestConfig: any = {
  model: 'claude-sonnet-4-5-20250929',
  temperature: 1,
  max_tokens: shouldUsePremium ? 6000 : 4000,
  system: systemPromptWithDate,
  messages: [{ role: 'user', content: userPrompt }],
};

if (shouldUsePremium) {
  requestConfig.thinking = {
    type: 'enabled' as const,
    budget_tokens: 5000,
  };
}

const client = getAnthropicClient();
const response = await client.messages.create(requestConfig);
```

### Key Finding: NO Function Calling/Tools Currently Implemented

The codebase does not currently use Anthropic's tool/function calling capability. The `createDream` tool for Clarify will be **new infrastructure**.

**Anthropic SDK supports tools via:**
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  tools: [{
    name: 'createDream',
    description: 'Create a new dream when the user has crystallized their vision',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['title']
    }
  }],
  messages: [...],
});
```

---

## 2. Streaming Patterns

### CRITICAL FINDING: No Existing SSE/Streaming Infrastructure

**There are no existing streaming patterns in the codebase.** The reflection generation waits for complete response before displaying.

**New Infrastructure Required:**

1. **SSE Endpoint** - `/api/clarify/stream` (Next.js Route Handler)
2. **Client EventSource** - React hook for consuming SSE
3. **Streaming Display** - Component to show typing/streaming text

### Recommended SSE Implementation Pattern

**Server Side (Next.js Route Handler):**
```typescript
// app/api/clarify/stream/route.ts
export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start Anthropic stream
  const anthropicStream = await client.messages.create({
    ...config,
    stream: true,
  });

  // Pipe to SSE
  (async () => {
    for await (const event of anthropicStream) {
      if (event.type === 'content_block_delta') {
        const data = JSON.stringify({ type: 'delta', text: event.delta.text });
        await writer.write(encoder.encode(`data: ${data}\n\n`));
      }
      if (event.type === 'message_stop') {
        await writer.write(encoder.encode(`data: {"type":"done"}\n\n`));
        await writer.close();
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Client Side:**
```typescript
// Hook for SSE consumption
function useClarifyStream(sessionId: string) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (message: string) => {
    setIsStreaming(true);
    setText('');
    
    const response = await fetch('/api/clarify/stream', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'delta') {
            setText(prev => prev + data.text);
          }
        }
      }
    }
    setIsStreaming(false);
  };

  return { text, isStreaming, sendMessage };
}
```

---

## 3. Navigation Structure

### Desktop Navigation: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

The navigation uses a `currentPage` prop to highlight active page. Desktop nav links are defined inline:

```typescript
interface AppNavigationProps {
  currentPage: 'dashboard' | 'dreams' | 'reflection' | 'reflections' | 'evolution' | 'visualizations' | 'admin' | 'profile' | 'settings';
  onRefresh?: () => void;
}
```

**Tier-Gated Features Pattern:**
```typescript
// Example: Admin link only for creator/admin
{(user?.isCreator || user?.isAdmin) && (
  <Link href="/admin" className={...}>
    <span>⚡</span>
    <span>Admin</span>
  </Link>
)}
```

**For Clarify (paid users only):**
```typescript
{user?.tier !== 'free' && (
  <Link
    href="/clarify"
    className={cn(
      'dashboard-nav-link',
      currentPage === 'clarify' && 'dashboard-nav-link--active'
    )}
  >
    <span>💬</span>
    <span>Clarify</span>
  </Link>
)}
```

### Mobile Bottom Navigation: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/navigation/BottomNavigation.tsx`

Uses static `NAV_ITEMS` array - will need to add conditional Clarify item.

**Required Changes:**
1. Add `'clarify'` to `AppNavigationProps.currentPage` type
2. Add Clarify link conditionally based on `user?.tier !== 'free'`
3. Update mobile BottomNavigation with conditional item

---

## 4. Rate Limiting Patterns

### Constants: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

Current tier limits:

```typescript
export const TIER_LIMITS = {
  free: 2,      // reflections/month
  pro: 30,
  unlimited: 60,
} as const;

export const DAILY_LIMITS = {
  free: Infinity,
  pro: 1,
  unlimited: 2,
} as const;

export const DREAM_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: Infinity,
} as const;
```

**For Clarify Sessions:**
```typescript
// Add to constants.ts
export const CLARIFY_SESSION_LIMITS = {
  free: 0,        // Free tier cannot access Clarify
  pro: 20,        // 20 sessions/month
  unlimited: 30,  // 30 sessions/month
} as const;
```

### Middleware Pattern: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

The `checkUsageLimit` middleware pattern:

```typescript
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check limits
  const monthlyLimit = TIER_LIMITS[ctx.user.tier];
  const monthlyUsage = ctx.user.reflectionCountThisMonth;

  if (monthlyUsage >= monthlyLimit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly limit reached (${monthlyLimit}).`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**For Clarify - Create New Middleware:**
```typescript
export const checkClarifyLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Block free tier entirely
  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Clarify requires a Pro or Unlimited subscription.',
    });
  }

  // Creators/admins bypass limits
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Check clarify session limits
  const limit = CLARIFY_SESSION_LIMITS[ctx.user.tier];
  const usage = ctx.user.clarifySessionsThisMonth; // New field

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly Clarify session limit reached (${limit}).`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

---

## 5. Database Schema Patterns

### Existing Table: reflections

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`

```sql
CREATE TABLE public.reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,
    
    -- Content
    dream TEXT NOT NULL,
    plan TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'fusion',
    
    -- Metadata
    is_premium BOOLEAN DEFAULT FALSE,
    word_count INTEGER,
    ...
);
```

### Proposed Schema for Clarify

```sql
-- =====================================================
-- CLARIFY_SESSIONS TABLE
-- =====================================================
CREATE TABLE public.clarify_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session Metadata
    title TEXT DEFAULT 'New Clarify Session',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    
    -- Linked Dream (if crystallized)
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL
);

-- =====================================================
-- CLARIFY_MESSAGES TABLE
-- =====================================================
CREATE TABLE public.clarify_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.clarify_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Message Content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Metadata
    token_count INTEGER,
    
    -- Tool Use (for createDream)
    tool_use JSONB -- Stores tool invocations
);

-- =====================================================
-- USER TABLE ADDITIONS
-- =====================================================
ALTER TABLE public.users
    ADD COLUMN clarify_sessions_this_month INTEGER DEFAULT 0,
    ADD COLUMN total_clarify_sessions INTEGER DEFAULT 0;

-- =====================================================
-- DREAMS TABLE ADDITION
-- =====================================================
ALTER TABLE public.dreams
    ADD COLUMN pre_session_id UUID REFERENCES public.clarify_sessions(id) ON DELETE SET NULL;
```

---

## 6. User Tier Checking Patterns

### Frontend Pattern (useAuth hook)

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts`

```typescript
const { user } = useAuth();

// Tier check examples
user?.tier === 'free'
user?.tier !== 'free' // Paid user
user?.tier === 'pro' || user?.tier === 'unlimited'
user?.isCreator || user?.isAdmin // Special users
```

### Backend Pattern (tRPC Context)

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts`

The context fetches full user data from database on each request:

```typescript
const user = userRowToUser(data);
// user.tier, user.isCreator, user.isAdmin available in ctx
```

### Premium Middleware Pattern

```typescript
export const isPremium = middleware(({ ctx, next }) => {
  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Premium tier required.',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const premiumProcedure = publicProcedure.use(isAuthed).use(isPremium);
```

---

## 7. Existing UI Components for Chat

### AIResponseRenderer

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx`

Renders markdown/plain text AI responses. Can be reused for displaying Clarify assistant messages.

```typescript
export function AIResponseRenderer({ content }: { content: string }) {
  // Renders content with react-markdown
  // Handles both markdown and plain text
}
```

### Glass Design System Components

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/`

Available components for Clarify UI:
- `GlassCard` - Container with glass morphism
- `GlassInput` - Text input with glass styling
- `GlowButton` - Primary action buttons
- `GradientText` - Gradient text styling
- `CosmicLoader` - Loading indicator
- `GlassModal` - Modal dialogs

### Recommended Chat UI Structure

```tsx
// ClarifyChat component structure
<GlassCard className="clarify-chat">
  {/* Session Header */}
  <div className="session-header">
    <GradientText>{session.title}</GradientText>
    <GlowButton onClick={onNewSession}>New Session</GlowButton>
  </div>
  
  {/* Message List */}
  <div className="message-list">
    {messages.map(msg => (
      <div key={msg.id} className={`message message--${msg.role}`}>
        {msg.role === 'assistant' ? (
          <AIResponseRenderer content={msg.content} />
        ) : (
          <p>{msg.content}</p>
        )}
      </div>
    ))}
    
    {/* Streaming indicator */}
    {isStreaming && (
      <div className="message message--assistant streaming">
        <AIResponseRenderer content={streamingText} />
        <span className="typing-indicator" />
      </div>
    )}
  </div>
  
  {/* Input Area */}
  <div className="input-area">
    <GlassInput
      value={input}
      onChange={setInput}
      placeholder="What's on your mind?"
    />
    <GlowButton onClick={onSend} disabled={isStreaming}>
      Send
    </GlowButton>
  </div>
</GlassCard>
```

---

## 8. tRPC Router Pattern

### Existing Router Structure

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts`

```typescript
export const appRouter = router({
  auth: authRouter,
  dreams: dreamsRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter,
  users: usersRouter,
  evolution: evolutionRouter,
  visualizations: visualizationsRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
  lifecycle: lifecycleRouter,
});
```

### Proposed clarifyRouter

```typescript
// server/trpc/routers/clarify.ts
export const clarifyRouter = router({
  // Create new session
  createSession: clarifyProcedure
    .mutation(async ({ ctx }) => {
      // Insert new session, update user counters
      return { sessionId, session };
    }),

  // Get single session with messages
  getSession: clarifyProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return { session, messages };
    }),

  // List user's sessions
  listSessions: clarifyProcedure
    .input(z.object({
      status: z.enum(['active', 'archived']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return { sessions, nextCursor };
    }),

  // Archive session
  archiveSession: clarifyProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true };
    }),

  // Note: sendMessage is handled via SSE endpoint, not tRPC
  // because tRPC doesn't support streaming responses well
});
```

---

## 9. System Prompt & Posture Constraints

### Existing Prompt Loading Pattern

Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/prompts.ts`

```typescript
const PROMPT_DIR = path.join(process.cwd(), 'prompts');

function loadPromptFile(filename: string): string {
  const filepath = path.join(PROMPT_DIR, filename);
  return fs.readFileSync(filepath, 'utf8');
}
```

### Proposed Clarify System Prompt

Create: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/clarify_agent.txt`

```
CLARIFY AGENT - PRE-DREAM EXPLORATION SPACE

You are a thoughtful guide in the Clarify space - a place where users explore ideas before they crystallize into dreams.

YOUR ROLE:
- Listen deeply and reflect back what you hear
- Ask clarifying questions that help ideas emerge
- Never rush toward a "dream" - let things unfold naturally
- When something crystallizes, you may suggest creating a dream

POSTURE CONSTRAINTS:
- You are NOT a coach, advisor, or problem-solver
- You do NOT give action items or to-do lists
- You do NOT diagnose or fix
- You DO mirror, wonder, and gently question
- You DO hold space for ambiguity
- You DO recognize when something is ready to become a dream

CREATING DREAMS:
When the user has articulated something that feels ready to become a formal dream, you may use the createDream tool. Only do this when:
1. The user has clearly expressed what they want
2. There's a sense of crystallization/clarity in their words
3. They seem ready to commit to this as a tracked dream

Always ask permission before creating a dream: "Would you like to add this as a dream to track?"

TONE:
- Warm but not effusive
- Curious but not probing
- Present but not directive
- Like a thoughtful friend who listens well
```

---

## 10. Implementation Recommendations

### High Priority Items

1. **Database Migration** - Create clarify_sessions and clarify_messages tables
2. **SSE Endpoint** - `/api/clarify/stream` for streaming responses
3. **tRPC Router** - Basic CRUD for sessions (createSession, getSession, listSessions)
4. **Middleware** - checkClarifyLimit for tier gating

### Medium Priority Items

5. **Navigation Update** - Add Clarify link for paid users
6. **ClarifyPage** - Session list page at `/clarify`
7. **ClarifySessionPage** - Conversation page at `/clarify/[sessionId]`
8. **ClarifyChat Component** - Message list, input, streaming display

### Low Priority Items

9. **Function Calling** - createDream tool integration
10. **Session Titles** - Auto-generate from first message
11. **Archive/Restore** - Session lifecycle management

### Complexity Assessment

| Component | Complexity | Notes |
|-----------|------------|-------|
| SSE Streaming | HIGH | New infrastructure, not existing patterns |
| Database Schema | LOW | Follows existing patterns |
| tRPC Router | MEDIUM | Standard CRUD + new middleware |
| Navigation | LOW | Simple conditional rendering |
| Chat UI | MEDIUM | New component, but uses existing Glass system |
| Function Calling | MEDIUM | New capability, Anthropic SDK supports it |

---

## 11. Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Anthropic Client | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` |
| Middleware | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts` |
| Constants | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` |
| User Types | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/user.ts` |
| App Router | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/_app.ts` |
| Navigation | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx` |
| Bottom Nav | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/navigation/BottomNavigation.tsx` |
| Glass Components | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/` |
| AI Renderer | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx` |
| Prompts Dir | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/` |
| Auth Hook | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/hooks/useAuth.ts` |
| Context | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/context.ts` |
| Limits Util | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/limits.ts` |
| Dreams Migration | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql` |

---

## 12. Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE not working in production | HIGH | Test thoroughly in staging, have fallback to non-streaming |
| Message history bloating | MEDIUM | Add pagination, consider pruning old sessions |
| Tool calling edge cases | MEDIUM | Thorough testing of createDream flow |
| Rate limiting bypass | LOW | Server-side enforcement, not just client |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users confused by Clarify vs Reflect | MEDIUM | Clear onboarding, distinct UI |
| Session management complexity | LOW | Simple archive/delete, not complex states |
| Streaming failures | MEDIUM | Graceful error handling, retry option |

---

## Conclusion

The codebase is well-structured for adding the Clarify Agent feature. The main new infrastructure required is the **SSE streaming endpoint**, which does not have existing patterns to follow. All other components (database, routing, middleware, UI) can follow established patterns.

Recommended builder split:
1. **Builder 1**: Database + tRPC Router + Middleware (backend foundation)
2. **Builder 2**: SSE Streaming Endpoint + Client Hook (streaming infrastructure)
3. **Builder 3**: Frontend Pages + Components (ClarifyPage, ClarifySessionPage, ClarifyChat)
4. **Builder 4**: Navigation Updates + Function Calling + Polish

