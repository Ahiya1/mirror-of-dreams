# Exploration Report: Iteration 23 - Dream Lifecycle Completion

## Executive Summary

This report explores the existing codebase to prepare for implementing the Dream Lifecycle Completion features: Evolution (in-place dream updates), Achievement Ceremony (celebration flow), and Release Ritual (gratitude-based release). The codebase has mature patterns for dreams, reflections, AI generation, and rate limiting that can be followed. The implementation will require new database tables, tRPC mutations/queries, and frontend pages/components.

---

## 1. Current Dream Schema

### Database Schema Location
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql`

### Existing Dreams Table Fields

```sql
CREATE TABLE public.dreams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Dream Content
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT CHECK (char_length(description) <= 2000),

    -- Timeline
    target_date DATE,

    -- Status Management
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived', 'released')),
    achieved_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,

    -- Organization
    category TEXT CHECK (category IN (
        'health', 'career', 'relationships', 'financial', 'personal_growth',
        'creative', 'spiritual', 'entrepreneurial', 'educational', 'other'
    )),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

    -- Metadata
    reflection_count INTEGER DEFAULT 0,
    last_reflection_at TIMESTAMP WITH TIME ZONE
);
```

### Current Status Enum
Status values: `'active'`, `'achieved'`, `'archived'`, `'released'`

### Fields to ADD for Iteration 23
The master plan requires:
- `evolution_count INTEGER DEFAULT 0` - track number of evolutions
- `has_ceremony BOOLEAN DEFAULT FALSE` - whether achievement ceremony was performed
- `has_ritual BOOLEAN DEFAULT FALSE` - whether release ritual was performed

---

## 2. Current Dream Router

### File Location
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`

### Existing Mutations/Queries

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | mutation | Create new dream with tier limit checking |
| `list` | query | List user dreams with optional status filter and stats |
| `get` | query | Get single dream by ID with stats |
| `update` | mutation | Update dream title/description/targetDate/category/priority |
| `updateStatus` | mutation | Change dream status (active/achieved/archived/released) |
| `delete` | mutation | Delete dream |
| `getLimits` | query | Get user's dream limits based on tier |

### Tier Limits for Dreams
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  essential: { dreams: 5 },
  optimal: { dreams: 7 },
  premium: { dreams: 999999 }, // Unlimited
};
```

### Router Pattern
- Uses `protectedProcedure` from middleware
- Zod schemas for validation
- Supabase for database operations
- Returns usage stats with mutations

### Procedures to ADD for Iteration 23
- `evolve` mutation - create evolution event, update dream
- `achieve` mutation - trigger ceremony flow
- `release` mutation - trigger ritual flow
- `getEvolutionHistory` query - get evolution events for dream
- `getCeremony` query - get ceremony data
- `getRitual` query - get ritual data

---

## 3. Current Dream Pages

### App Directory Structure
The app uses Next.js App Router pattern.

### Existing Dream Pages

| Path | File | Description |
|------|------|-------------|
| `/dreams` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx` | Dreams list with grid of DreamCards |
| `/dreams/[id]` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/page.tsx` | Dream detail with actions |

### Dream Detail Page Features
Current `/dreams/[id]/page.tsx` includes:
- Dream header with emoji, title, status badge
- Description section
- Evolution Report generation section (requires 4+ reflections)
- Visualization generation section (requires 4+ reflections)
- Status Actions buttons (Active/Achieved/Archive/Release)
- Reflections list with links to individual reflections

### Key UI Patterns
- Uses `GlassCard`, `GlowButton`, `GradientText`, `CosmicLoader`
- Progress bar showing reflections needed for features
- Loading states with `CosmicLoader`
- Status change handled via `updateStatus` mutation

### Pages to ADD for Iteration 23
- `/dreams/[id]/ceremony` - Achievement Ceremony page
- `/dreams/[id]/ritual` - Release Ritual page (4-step wizard)

---

## 4. Current Dream Components

### Component Locations

| Component | File | Purpose |
|-----------|------|---------|
| `DreamCard` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/DreamCard.tsx` | Grid card for dream lists |
| `CreateDreamModal` | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/CreateDreamModal.tsx` | Modal for creating new dreams |

### DreamCard Props
```typescript
interface DreamCardProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  status: 'active' | 'achieved' | 'archived' | 'released';
  category?: string;
  reflectionCount: number;
  lastReflectionAt?: string | null;
  onReflect?: () => void;
  onEvolution?: () => void;
  onVisualize?: () => void;
}
```

### DreamCard Features
- Category emoji display
- Status badge with color coding
- Days left calculation
- Reflection count display
- Action buttons: Reflect, Evolution (4+ reflections), Visualize (4+ reflections)

### Components to ADD for Iteration 23
- `EvolutionModal` - multi-step modal (old form → new form → reflection)
- Evolution history display component
- Update `DreamCard` to show evolution count

---

## 5. Reflection Implementation Pattern

### File Location
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`

This is the key pattern to follow for evolution events as they're similar - user provides input, AI generates response.

### Reflection Creation Flow

1. **Validation**: Zod schema validates input
2. **Premium Check**: Determines if extended thinking is used
3. **Prompt Building**: Load system prompt from `/prompts/` directory + user input
4. **AI Call**: Claude API with optional extended thinking
5. **Response Formatting**: `toSacredHTML()` converts markdown to styled HTML
6. **Database Storage**: Insert into `reflections` table
7. **Usage Update**: Increment user counters

### Key Code Patterns

**Anthropic Client Lazy Initialization:**
```typescript
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}
```

**Extended Thinking Configuration:**
```typescript
if (shouldUsePremium) {
  requestConfig.thinking = {
    type: 'enabled' as const,
    budget_tokens: 5000,
  };
}
```

**HTML Formatting Helper:**
```typescript
function toSacredHTML(md: string): string {
  // Converts markdown to styled HTML paragraphs
}
```

### Reflections Display
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflections/AIResponseRenderer.tsx` - Renders formatted AI responses

---

## 6. Rate Limit Patterns

### Constants File
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts`

### Current Limit Constants
```typescript
export const TIER_LIMITS = {
  free: 2,        // Monthly reflections
  pro: 30,
  unlimited: 60,
};

export const DAILY_LIMITS = {
  free: Infinity,
  pro: 1,         // Daily limit
  unlimited: 2,
};

export const DREAM_LIMITS = {
  free: 2,
  pro: 5,
  unlimited: Infinity,
};
```

### Middleware Pattern
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`

```typescript
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  // Check daily limit first (Pro and Unlimited only)
  if (ctx.user.tier === 'pro' || ctx.user.tier === 'unlimited') {
    const dailyLimit = DAILY_LIMITS[ctx.user.tier];
    // ... check today's count vs limit
  }

  // Check monthly limit
  const monthlyLimit = TIER_LIMITS[ctx.user.tier];
  // ... check monthly count vs limit

  return next({ ctx });
});
```

### Database-Level Limits (Evolution/Visualization)
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022210000_add_evolution_visualizations.sql`

```sql
CREATE OR REPLACE FUNCTION check_evolution_limit(
  p_user_id UUID,
  p_user_tier TEXT,
  p_report_type TEXT
) RETURNS BOOLEAN AS $$
-- Checks usage_tracking table against tier limits
$$;
```

### Limits to ADD for Iteration 23
Add to `constants.ts`:
```typescript
export const EVOLUTION_LIMITS = {
  free: 0,
  pro: 4,         // Per month
  unlimited: 8,
};

export const VISUALIZATION_LIMITS = {
  free: 0,
  pro: 4,         // Per month
  unlimited: 8,
};
```

Also need database functions to check these limits.

---

## 7. AI Generation Patterns

### Model Configuration
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/cost-calculator.ts`

Model identifier: `'claude-sonnet-4-5-20250929'`

### Prompt Loading System
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/prompts.ts`

```typescript
export async function loadPrompts(
  tone: 'gentle' | 'intense' | 'fusion' = 'fusion',
  isPremium: boolean = false,
  isCreator: boolean = false
): Promise<string> {
  // Load base_instructions.txt + tone file + premium enhancement
}
```

### Prompt Files Location
Directory: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/prompts/`

Files used:
- `base_instructions.txt`
- `gentle_clarity.txt`
- `luminous_intensity.txt`
- `sacred_fusion.txt`
- `evolution_instructions.txt`
- `creator_context.txt`

### AI Response Handling Pattern
1. Build system prompt from files
2. Build user prompt from input data
3. Call Claude with configuration
4. Extract text block from response
5. Format to HTML
6. Store in database
7. Log API usage and costs

### For Ceremony Synthesis
Need new prompts for:
- "Who you were when you started"
- "Who you became through this journey"

---

## 8. Database Migration Patterns

### Migration Location
Directory: `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/`

### Naming Convention
Format: `YYYYMMDDHHMMSS_description.sql`
Example: `20251022210000_add_evolution_visualizations.sql`

### Migration Structure Pattern
```sql
-- =====================================================
-- Migration: [Description] (Iteration N)
-- Date: YYYY-MM-DD
-- =====================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.table_name (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ... fields
);

-- 2. Add RLS policies
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON public.table_name FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON public.table_name(user_id);

-- 4. Create helper functions
CREATE OR REPLACE FUNCTION helper_function(...)
RETURNS ... AS $$
-- ...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Tables to CREATE for Iteration 23

**1. evolution_events table:**
```sql
CREATE TABLE public.evolution_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Before snapshot
    old_title TEXT NOT NULL,
    old_description TEXT,
    old_target_date DATE,
    old_category TEXT,
    
    -- After snapshot
    new_title TEXT NOT NULL,
    new_description TEXT,
    new_target_date DATE,
    new_category TEXT,
    
    -- User reflection on the evolution
    evolution_reflection TEXT,
    
    -- AI-generated insight (optional)
    ai_insight TEXT
);
```

**2. achievement_ceremonies table:**
```sql
CREATE TABLE public.achievement_ceremonies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI-generated synthesis
    who_you_were TEXT NOT NULL,
    who_you_became TEXT NOT NULL,
    journey_synthesis TEXT NOT NULL,
    
    -- User additions (optional)
    personal_note TEXT,
    
    -- Metadata
    reflections_analyzed UUID[],
    reflection_count INTEGER NOT NULL
);
```

**3. release_rituals table:**
```sql
CREATE TABLE public.release_rituals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dream_id UUID UNIQUE NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 4-step wizard responses
    what_i_learned TEXT NOT NULL,
    what_im_grateful_for TEXT NOT NULL,
    what_i_release TEXT NOT NULL,
    final_message TEXT, -- Optional closing words
    
    -- AI-generated blessing (optional)
    ai_blessing TEXT,
    
    -- Metadata
    reason TEXT CHECK (reason IN ('evolved_beyond', 'no_longer_resonates', 'completed_differently', 'other'))
);
```

---

## 9. UI Component Patterns

### GlassModal Pattern
**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/glass/GlassModal.tsx`

Features:
- Full-screen on mobile, centered card on desktop
- Swipe-to-dismiss on mobile
- Focus trap with `react-focus-lock`
- Escape key closes modal
- Framer Motion animations

```typescript
<GlassModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  disableSwipeDismiss={true} // For multi-step forms
>
  {children}
</GlassModal>
```

### Multi-Step Form Pattern
See `MobileReflectionFlow` for step-by-step wizard pattern on mobile.

### Page Layout Pattern
```typescript
<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-nav px-4 sm:px-8 pb-8">
  <AppNavigation currentPage="dreams" />
  <div className="max-w-4xl mx-auto">
    {/* Back button */}
    {/* Header card */}
    {/* Content sections */}
  </div>
</div>
```

---

## 10. Implementation Recommendations

### Migration File
Create: `supabase/migrations/YYYYMMDD000000_dream_lifecycle_completion.sql`

Include:
1. ALTER dreams table: add `evolution_count`, `has_ceremony`, `has_ritual`
2. CREATE evolution_events table
3. CREATE achievement_ceremonies table
4. CREATE release_rituals table
5. RLS policies for all new tables
6. Limit checking functions for evolution/ceremony/ritual

### Router Updates
Extend `server/trpc/routers/dreams.ts` with new procedures:
- `evolve` - protected, creates evolution event
- `achieve` - protected, triggers ceremony
- `release` - protected, triggers ritual
- `getEvolutionHistory` - protected
- `getCeremony` - protected
- `getRitual` - protected

Or create separate routers:
- `server/trpc/routers/lifecycle.ts` - for evolution/ceremony/ritual

### Frontend Components
1. `components/dreams/EvolutionModal.tsx` - multi-step evolution flow
2. `components/dreams/EvolutionHistory.tsx` - timeline of evolutions
3. Update `DreamCard.tsx` - show evolution count badge

### Frontend Pages
1. `app/dreams/[id]/ceremony/page.tsx` - Achievement Ceremony
2. `app/dreams/[id]/ritual/page.tsx` - Release Ritual (4-step wizard)

### Prompts
Create new prompt files:
- `prompts/ceremony_synthesis.txt` - for who you were/who you became
- `prompts/release_blessing.txt` - for gratitude blessing

### Constants
Add to `lib/utils/constants.ts`:
```typescript
export const EVOLUTION_LIMITS = {
  free: 0,
  pro: 4,
  unlimited: 8,
};

export const CEREMONY_ENABLED = {
  free: false,
  pro: true,
  unlimited: true,
};
```

---

## 11. Complexity Assessment

### High Complexity
- **EvolutionModal**: Multi-step flow (old form → new form → reflection), requires careful state management
- **AchievementCeremony page**: AI synthesis generation, narrative display

### Medium Complexity
- **ReleaseRitual page**: 4-step wizard, but straightforward form steps
- **Evolution history display**: Timeline component, but data is simple
- **Rate limit enforcement**: Following existing patterns

### Low Complexity
- **Database migrations**: Straightforward table creation
- **DreamCard updates**: Adding evolution count badge
- **Status update modifications**: Minor changes to existing flow

---

## 12. File Path Summary

### Key Files to Modify
| File | Changes |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts` | Add evolve, achieve, release mutations |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/[id]/page.tsx` | Add evolution history, update action buttons |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dreams/DreamCard.tsx` | Show evolution count |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/utils/constants.ts` | Add limit constants |

### New Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/20251209000000_dream_lifecycle_completion.sql` | Schema changes |
| `components/dreams/EvolutionModal.tsx` | Evolution flow modal |
| `components/dreams/EvolutionHistory.tsx` | Timeline display |
| `app/dreams/[id]/ceremony/page.tsx` | Achievement ceremony page |
| `app/dreams/[id]/ritual/page.tsx` | Release ritual wizard |
| `prompts/ceremony_synthesis.txt` | AI prompt for ceremony |
| `prompts/release_blessing.txt` | AI prompt for ritual |

---

## 13. Questions for Planner

1. Should evolution events be rate-limited separately, or share limits with evolution reports?
2. Should the ceremony be auto-generated when dream is marked achieved, or require explicit trigger?
3. For release ritual, should AI blessing be optional premium feature or included for all tiers?
4. Should evolution history be paginated, or show all events (typically low count)?
5. Should ceremony and ritual be accessible from dream detail page, or only via navigation?

