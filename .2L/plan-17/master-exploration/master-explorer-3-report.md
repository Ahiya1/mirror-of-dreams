# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points

## Vision Summary
Fix the Clarify Agent's critical bugs (createDream tool, tier limits) and add streaming responses, visual feedback, onboarding step, and demo data to transform it from buggy to polished.

---

## Existing UI Component Analysis

### 1. Toast/Notification System - EXISTS AND READY

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/contexts/ToastContext.tsx` and `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/Toast.tsx`

**Current Implementation:**
- Full toast notification system with types: `success`, `error`, `warning`, `info`
- Auto-dismisses after configurable duration (default 5 seconds)
- Cosmic glass design with backdrop blur and gradient borders
- Animated with Framer Motion (slide in from right)
- Positioned at bottom-right: `fixed bottom-6 right-6 z-[9999]`
- Supports multiple stacked toasts with AnimatePresence

**Usage Pattern:**
```typescript
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();
toast.success('Dream created: My New Dream');
toast.error('Failed to create dream');
toast.info('Processing your request...');
```

**Integration for Dream Creation:**
The existing toast system is perfect for dream creation feedback. No new component needed - just:
```typescript
toast.success(`Dream created: ${dreamTitle}`);
// Could extend message to include a link, but current Toast only shows text
```

**Enhancement Opportunity:**
Current toast only supports plain text messages. For "View Dream" link functionality, the Toast component would need minor enhancement to accept React nodes or an action button.

---

### 2. Clarify Chat UI - DETAILED ANALYSIS

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx`

**Current Message Display Structure:**
```tsx
// User messages (right-aligned)
<div className="flex justify-end">
  <div className="max-w-[85%] sm:max-w-[75%] bg-purple-600/30 border border-purple-500/30 rounded-2xl rounded-br-md px-4 py-3">
    <p className="text-white whitespace-pre-wrap">{message.content}</p>
    <p className="text-xs text-white/30 mt-2">{timestamp}</p>
  </div>
</div>

// Assistant messages (left-aligned)
<div className="flex justify-start">
  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
    <AIResponseRenderer content={message.content} />
    <p className="text-xs text-white/30 mt-2">{timestamp}</p>
  </div>
</div>
```

**Current Typing Indicator:**
```tsx
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

**Optimistic UI Pattern:**
Already implements optimistic UI for user messages via `pendingMessage` state - user message appears immediately while API call is in flight.

**AIResponseRenderer:**
- Location: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx`
- Uses ReactMarkdown with GFM plugin
- Custom styling for headings (GradientText), blockquotes, lists, code blocks
- Automatically detects markdown vs plain text
- Ready to render streaming content as it arrives

---

### 3. Onboarding Flow - CURRENT STATE

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/onboarding/page.tsx`

**Current Steps (3 total):**
1. "Welcome to Mirror of Dreams" (visual: moon emoji)
   - Consciousness companion introduction
2. "How Reflections Work" (visual: sparkles emoji)
   - 5 questions explanation, Mirror reveals patterns
3. "Your Free Tier" (visual: seedling emoji)
   - Free tier limits, Optimal tier benefits

**Current Components Used:**
- `ProgressOrbs` - Shows step progress (currently 3 orbs)
- `GlassCard` - Container
- `GradientText` - Step titles
- `GlowButton` - Skip and Next buttons
- `AnimatedBackground` - Cosmic background

**Structure for Adding Clarify Step:**
```typescript
const steps: OnboardingStep[] = [
  { title: '...', content: '...', visual: 'emoji' },
  // Each step has: title, content (multi-line text), visual (emoji)
];
```

**Insertion Point:**
The Clarify step should be inserted as Step 3 (before "Your Free Tier") or as Step 2 (after Welcome). Suggested placement: **Step 3** to maintain current flow and mention Clarify as a paid feature before discussing tiers.

**Proposed New Step:**
```typescript
{
  title: 'Clarify: Your Exploration Space',
  content: 'Before a dream crystallizes, there's a space for exploration.\n\nClarify is your AI-powered reflection partner. Talk through what's emerging - ideas, feelings, possibilities - without commitment.\n\nWhen something is ready, Clarify can help you crystallize it into a dream.\n\n(Available on Pro and Unlimited tiers)',
  visual: '🔮', // or '💬'
}
```

---

### 4. Profile Page - CURRENT STATE

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/profile/page.tsx`

**Current Sections:**
1. Account Information (name, email, member since)
2. Subscription & Billing (`SubscriptionStatusCard`)
3. Usage Statistics (reflections, Clarify sessions for paid users)
4. Account Actions (change password)
5. Danger Zone (delete account)

**Insertion Point for "View Tutorial" Button:**
Should be added to **Account Actions** section, below the password change option. Pattern:

```tsx
<GlassCard elevated className="mb-6">
  <h2 className="text-xl font-semibold text-white mb-4">Account Actions</h2>

  {/* Change Password - existing */}
  <div className="mb-4">...</div>

  {/* NEW: View Tutorial Button */}
  <div>
    <label className="text-sm text-white/60 block mb-2">Tutorial</label>
    <GlowButton
      variant="secondary"
      onClick={() => router.push('/onboarding')}
    >
      View Tutorial
    </GlowButton>
  </div>
</GlassCard>
```

---

## Streaming UX Integration Strategy

### Visual Appearance Recommendations

**1. Typing Indicator During Streaming:**
Replace current "Thinking..." with "Mirror is reflecting...":
```tsx
// Before any tokens arrive
<div className="flex items-center gap-2 text-white/50">
  <span className="flex gap-1">
    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
  </span>
  <span className="text-sm italic">Mirror is reflecting...</span>
</div>
```

**2. Streaming Content Display:**
- Show assistant message bubble immediately when first token arrives
- Content builds up token-by-token
- AIResponseRenderer can render partial markdown (already works incrementally)
- Subtle cursor or fade effect at end of content

**3. State Machine for Streaming:**
```typescript
type StreamingState =
  | 'idle'           // No active request
  | 'sending'        // User message sent, waiting for response
  | 'connecting'     // SSE connection establishing
  | 'streaming'      // Tokens arriving
  | 'completing'     // Final token received, saving to DB
  | 'error';         // Stream failed
```

**4. Frontend Streaming Implementation Pattern:**
```typescript
const [streamingContent, setStreamingContent] = useState('');
const [streamingState, setStreamingState] = useState<StreamingState>('idle');

const handleStreamMessage = async (content: string) => {
  setStreamingState('connecting');

  const eventSource = new EventSource(`/api/clarify/stream?sessionId=${sessionId}&message=${encodeURIComponent(content)}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'token') {
      setStreamingState('streaming');
      setStreamingContent(prev => prev + data.content);
    } else if (data.type === 'done') {
      setStreamingState('completing');
      eventSource.close();
      // Refetch to get saved message from DB
      await refetch();
      setStreamingContent('');
      setStreamingState('idle');
    }
  };

  eventSource.onerror = () => {
    setStreamingState('error');
    eventSource.close();
  };
};
```

---

## Toast Enhancement for Dream Creation

### Current Toast Limitation
Current toast only accepts string messages, not interactive elements.

### Recommended Enhancement
Extend Toast to support action buttons:

```typescript
// ToastContext.tsx enhancement
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {           // NEW
    label: string;
    onClick: () => void;
  };
}

// Usage for dream creation:
toast.success('Dream created: My New Dream', 5000, {
  label: 'View Dream',
  onClick: () => router.push(`/dreams/${dreamId}`)
});
```

### Toast Styling for Dream Creation
Keep existing cosmic glass styling. Add button styling:
```tsx
{action && (
  <button
    onClick={action.onClick}
    className="ml-auto text-sm font-medium text-purple-300 hover:text-purple-200 underline transition-colors"
  >
    {action.label}
  </button>
)}
```

---

## Demo Data Strategy

### Demo User Identification

**Demo User Email:** `demo@mirrorofdreams.com`

**Location of Demo Login:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/auth.ts` (line 386-414)

**Existing Seed Script:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/scripts/seed-demo-user.ts`

The existing seed script creates:
- 5 dreams (SaaS, Marathon, Piano, Relationships, Financial)
- 15 reflections with detailed AI responses
- 1 evolution report
- 1 visualization

**It does NOT currently seed Clarify sessions.**

### Demo Clarify Session Content

**Session 1: Exploration that doesn't crystallize** (shows that's okay)

```typescript
const DEMO_CLARIFY_SESSION_1 = {
  title: "Late-night thoughts about work",
  status: 'active',
  messages: [
    {
      role: 'user',
      content: "I keep thinking about starting my own thing. But I'm not sure if it's a real dream or just escapism from my current job.",
      daysAgo: 5
    },
    {
      role: 'assistant',
      content: `That's such an honest distinction to make - the line between genuine aspiration and escapism isn't always clear, especially late at night.

**Let's sit with that question together.**

What is it about your current job that makes you want to escape? And more importantly - if those frustrations disappeared tomorrow, would you still be drawn to "starting your own thing"?

Sometimes the impulse to create something new comes from a deep need to express ourselves, to build something that matters. Other times, it's our mind's way of avoiding something uncomfortable in our present situation.

Both are valid. Both are worth examining.

What does "your own thing" look like in your imagination? Is it vivid and specific, or more of a feeling?`,
      daysAgo: 5
    },
    {
      role: 'user',
      content: "Honestly, when I imagine it, it's mostly a feeling. Freedom. Not having someone else decide what I work on. But the specifics are fuzzy.",
      daysAgo: 5
    },
    {
      role: 'assistant',
      content: `The feeling of freedom - that's significant. It tells us something is constrained right now.

**The fuzziness is actually information too.**

A crystal-clear vision often means we've been obsessing over something specific. Fuzziness might mean this is still forming, still emerging. It's not ready to be a dream yet - and that's perfectly okay.

Some questions to carry with you:
- What specifically feels constrained in your current situation?
- When do you feel most free, even now?
- Is there a small way to create more autonomy without making a big leap?

This doesn't need to crystallize into a formal dream today. Sometimes the most important work is just noticing what's stirring. You're doing that work right now.`,
      daysAgo: 5
    },
    {
      role: 'user',
      content: "Thanks for not pushing me to make this a 'thing'. I think I just needed to voice it.",
      daysAgo: 5
    },
    {
      role: 'assistant',
      content: `That's exactly what this space is for.

Not everything that stirs in us needs to become a project or a goal. Some thoughts just need to be witnessed. Some feelings just need to be named.

**You said something important: "I just needed to voice it."**

That's already movement. That's already clarity. The dream - if there is one - will find its shape when it's ready. And if it never does, that's okay too. Sometimes the exploration *is* the destination.

Come back whenever something else is stirring. I'm here.`,
      daysAgo: 5
    }
  ]
};
```

**Session 2: Exploration that crystallizes into a dream** (with tool_use)

```typescript
const DEMO_CLARIFY_SESSION_2 = {
  title: "Something is emerging about writing",
  status: 'active',
  dreamId: null, // Will be linked after creation
  messages: [
    {
      role: 'user',
      content: "I've been writing in my journal every morning for 6 months. Something is shifting. I think I want to share what I'm learning.",
      daysAgo: 3
    },
    {
      role: 'assistant',
      content: `Six months of morning pages. That's not a casual habit - that's a practice. Something is clearly alive in you around writing.

**Tell me more about what's shifting.**

When you say you want to share what you're learning - what comes up? Excitement? Fear? Both?

And what have you been learning that feels worth sharing?`,
      daysAgo: 3
    },
    {
      role: 'user',
      content: "Both, definitely both. I've learned so much about myself through writing. How it helps me process things, see patterns I couldn't see before. I think others might benefit from starting their own practice. Maybe I want to teach this somehow.",
      daysAgo: 3
    },
    {
      role: 'assistant',
      content: `Now we're getting somewhere.

**Let me reflect back what I'm hearing:**

You've discovered something valuable through personal practice. Writing has become a tool for self-understanding, pattern recognition, processing. And now you feel called to share this with others - not just the outputs of your writing, but the practice itself.

This is moving from private journaling to potentially helping others start their own practice.

**Some clarifying questions:**
- Who do you imagine teaching? Beginners? People already journaling who want to go deeper?
- What format calls to you? A course? A book? Workshops? A community?
- What's the first tiny step you could imagine taking?

I'm curious if this is feeling more concrete now...`,
      daysAgo: 3
    },
    {
      role: 'user',
      content: "I think... people like me. People who are skeptical of 'woo-woo' self-help but still want to understand themselves better. A course feels right. Something practical, with prompts, not fluffy. And I think I could start by just writing a few guides.",
      daysAgo: 3
    },
    {
      role: 'assistant',
      content: `**There it is.**

You've just articulated something specific:
- **Who:** Skeptics who want self-understanding without the woo-woo
- **What:** A practical journaling course with concrete prompts
- **How:** Starting with guides, then building into a full course

This has crystallized from "something is shifting" to a clear direction.

**Would you like me to create this as a dream to track?**

I'd frame it as something like:
- Title: "Create a Practical Journaling Course"
- Description: Build a no-nonsense journaling course for skeptics who want self-understanding without the fluffy self-help language
- Category: Creative

This way you can reflect on it, track your progress, and let it evolve. Only if you're ready - no pressure.`,
      daysAgo: 3
    },
    {
      role: 'user',
      content: "Yes. Yes, I think I'm ready. Please create it.",
      daysAgo: 3
    },
    {
      role: 'assistant',
      content: `I've created your dream: **"Create a Practical Journaling Course"**

It's now in your Dreams tab, ready for you to start reflecting on.

**What just happened is significant.** Six months ago, you started journaling. You didn't know where it would lead. And now, through exploration, something has crystallized into a direction.

This is exactly how dreams emerge - not from forcing clarity, but from patient attention to what's stirring.

Your next step could be as simple as:
- Write one guide on "How to start a journaling practice"
- Share it with one person and notice their response

But for now, just sit with the fact that this exists. You named it. You made it real.

I'm genuinely excited for you.`,
      daysAgo: 3,
      toolUse: {
        name: 'createDream',
        input: {
          title: 'Create a Practical Journaling Course',
          description: 'Build a no-nonsense journaling course for skeptics who want self-understanding without the fluffy self-help language. Start with guides, build into full course.',
          category: 'creative'
        },
        result: {
          success: true,
          dreamId: 'demo-dream-journaling-course-uuid'
        }
      }
    }
  ]
};
```

**Session 3: Brief check-in (shows variety)**

```typescript
const DEMO_CLARIFY_SESSION_3 = {
  title: "Quick thought about the marathon training",
  status: 'archived',
  messages: [
    {
      role: 'user',
      content: "Just wanted to process something quick. I skipped my long run yesterday and I'm beating myself up about it.",
      daysAgo: 10
    },
    {
      role: 'assistant',
      content: `Thank you for bringing this here instead of just letting the self-criticism spiral in your head.

**One skipped run is data, not a verdict.**

Why did you skip it? Body needed rest? Life got in the way? Lost motivation? Each of these points to something different.

And here's a question worth sitting with: Is beating yourself up helping you prepare for the next run, or is it just adding suffering without purpose?`,
      daysAgo: 10
    },
    {
      role: 'user',
      content: "It was raining and cold and I just... didn't feel like it. Which makes me feel worse because it's such a weak excuse.",
      daysAgo: 10
    },
    {
      role: 'assistant',
      content: `"Didn't feel like it" is one of the most honest reasons there is.

**Here's the thing about marathon training:** It's months long. There will be days you don't feel like it. The question isn't whether you'll have those days - you will - but how you relate to them.

One option: Beat yourself up, add shame, make the next run feel even harder.

Another option: Notice the skip, notice the feelings, notice the pattern (rain + cold = resistance), and move on. Maybe Sunday's run happens rain or shine, just to prove something to yourself.

You didn't skip because you're weak. You skipped because you're human. Now the run is behind you. What's in front of you?`,
      daysAgo: 10
    }
  ]
};
```

### Migration Script Structure

Create new migration: `20251209100000_seed_demo_clarify_sessions.sql`

```sql
-- Seed demo Clarify sessions
-- This should run AFTER the demo user exists

-- Session 1: Exploration without crystallization
INSERT INTO public.clarify_sessions (id, user_id, title, status, message_count, created_at, last_message_at)
SELECT
  'demo-clarify-session-1'::uuid,
  id,
  'Late-night thoughts about work',
  'active',
  5,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM public.users WHERE email = 'demo@mirrorofdreams.com';

-- [Insert messages for session 1...]

-- Session 2: Exploration that crystallizes
INSERT INTO public.clarify_sessions (id, user_id, title, status, message_count, created_at, last_message_at, dream_id)
SELECT
  'demo-clarify-session-2'::uuid,
  id,
  'Something is emerging about writing',
  'active',
  7,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NULL -- Will link to dream after creation
FROM public.users WHERE email = 'demo@mirrorofdreams.com';

-- [Insert messages for session 2, including one with tool_use...]

-- Session 3: Archived session
INSERT INTO public.clarify_sessions (id, user_id, title, status, message_count, created_at, last_message_at)
SELECT
  'demo-clarify-session-3'::uuid,
  id,
  'Quick thought about the marathon training',
  'archived',
  3,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
FROM public.users WHERE email = 'demo@mirrorofdreams.com';

-- [Insert messages for session 3...]
```

**Alternative: Extend seed-demo-user.ts script**

Add to existing script:
```typescript
// 8. Create Clarify sessions and messages
console.log('Creating demo Clarify sessions...');
await seedClarifySessions(demoUser.id);
```

---

## Data Flow Analysis

### createDream Tool Flow

**Current State (broken):**
1. User asks AI to create dream
2. AI pretends to create dream (no actual tool_use)
3. Nothing happens in database
4. User confused

**Fixed Flow:**
1. User asks AI to create dream
2. Claude API called with `tools` parameter including createDream definition
3. Claude returns `tool_use` block in response
4. Server intercepts tool_use, calls dreams.create mutation
5. Dream created in database
6. Tool result returned to Claude
7. Claude acknowledges creation
8. Frontend shows toast with dream link
9. Session's dream_id updated for linking

**API Contract for createDream:**
```typescript
// Tool definition for Claude
const createDreamTool = {
  name: 'createDream',
  description: 'Create a new dream in the user\'s dream journal. Use this when the user has clarified what they want to work towards and explicitly agrees to create it as a dream.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A concise, meaningful title for the dream'
      },
      description: {
        type: 'string',
        description: 'A fuller description of what this dream represents'
      },
      category: {
        type: 'string',
        enum: ['career', 'health', 'creative', 'relationships', 'financial', 'personal'],
        description: 'The life area this dream relates to'
      }
    },
    required: ['title', 'description', 'category']
  }
};
```

### Streaming Data Flow

**Endpoint:** `/api/clarify/stream` (new Next.js API route, not tRPC)

**Request:**
```
GET /api/clarify/stream?sessionId=xxx&message=yyy
Headers: Authorization: Bearer <token>
```

**SSE Response Events:**
```typescript
// Token event
{ type: 'token', content: 'string' }

// Tool use event (mid-stream)
{ type: 'tool_use', toolName: 'createDream', toolInput: {...} }

// Tool result event
{ type: 'tool_result', toolName: 'createDream', result: { success: true, dreamId: 'xxx', dreamTitle: 'yyy' } }

// Done event
{ type: 'done', messageId: 'xxx' }

// Error event
{ type: 'error', message: 'string' }
```

---

## Integration Points Summary

### Cross-Component Integration

| Component | Integrates With | Integration Type |
|-----------|----------------|------------------|
| Clarify chat UI | Toast system | Dream creation feedback |
| Clarify chat UI | Streaming endpoint | Real-time AI responses |
| Clarify router | Dreams router | createDream tool execution |
| Onboarding page | ProgressOrbs | Step count update (3 -> 4) |
| Profile page | Router | Navigate to /onboarding |
| Toast component | Router | "View Dream" navigation |

### State Management Integration

**New State in Clarify Session Page:**
```typescript
// Streaming state
const [streamingContent, setStreamingContent] = useState('');
const [streamingState, setStreamingState] = useState<StreamingState>('idle');

// Dream creation state
const [newlyCreatedDream, setNewlyCreatedDream] = useState<{id: string, title: string} | null>(null);
```

**Toast Context Enhancement:**
```typescript
// Add action support to ToastMessage interface
action?: { label: string; onClick: () => void };
```

---

## Recommendations for Master Plan

1. **Toast Enhancement First**
   - Extend Toast component to support action buttons before implementing dream creation feedback
   - This is a small change that unblocks the "View Dream" functionality

2. **Streaming as Separate API Route**
   - SSE doesn't work well with tRPC; create `/api/clarify/stream` as raw Next.js API route
   - Keep existing `sendMessage` mutation for non-streaming fallback

3. **Onboarding Step Placement**
   - Insert Clarify step as Step 3 (between "How Reflections Work" and "Your Free Tier")
   - This maintains logical flow: learn about feature before learning it's paid

4. **Demo Data via Script Extension**
   - Extend existing `seed-demo-user.ts` rather than creating new migration
   - Script is already well-structured and handles user lookup

5. **createDream Tool Implementation Order**
   - First: Add tool definition to Claude API call
   - Second: Handle tool_use in response
   - Third: Execute dream creation
   - Fourth: Add toast notification
   - Fifth: Update session dream_id

---

## Risk Assessment

### Low Risks

- **Toast enhancement**: Small, isolated change
- **Onboarding step addition**: Just array modification
- **Profile button**: Simple navigation

### Medium Risks

- **Streaming implementation**: SSE outside tRPC is less familiar pattern
  - Mitigation: Keep non-streaming fallback, test thoroughly
- **Tool use handling**: Anthropic API patterns may have edge cases
  - Mitigation: Handle tool_use blocks explicitly, log thoroughly

### Integration Challenges

- **Streaming + Tool Use**: When Claude uses a tool mid-stream, need to pause streaming, execute tool, then resume with tool result
  - Recommendation: Research Anthropic's streaming with tools documentation before implementing

---

## Technology Recommendations

### Existing Patterns to Follow

- Toast system uses Framer Motion for animations - maintain consistency
- Glass design system CSS variables for styling
- tRPC for most endpoints, raw Next.js API only for streaming

### Libraries Already Available

- `@anthropic-ai/sdk` - Already installed and used in clarify router
- `framer-motion` - Already used for animations
- `react-markdown` - Already used in AIResponseRenderer

### No New Dependencies Required

All features can be implemented with existing dependencies.

---

## Notes & Observations

1. **The existing Clarify UI is well-structured** - The optimistic update pattern and message styling are already solid. Streaming will enhance, not replace.

2. **AIResponseRenderer handles partial content** - ReactMarkdown can render incomplete markdown, which is important for streaming.

3. **Demo user infrastructure is mature** - The seed script pattern is proven and extensible.

4. **Toast positioning may conflict with BottomNavigation on mobile** - Current toast is `bottom-6 right-6`, which could overlap with `pb-20` bottom nav padding. May need adjustment to `bottom-24` on mobile.

5. **onboarding already handles re-entry** - The `completeOnboarding` mutation just updates timestamp, doesn't block subsequent visits.

---

*Exploration completed: 2025-12-09*
*This report informs master planning decisions*
