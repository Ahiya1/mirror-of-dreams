# Explorer 2 Report: Technology Patterns & Dependencies

**Explorer:** Explorer-2
**Iteration:** 10 (Global)
**Plan:** plan-6
**Focus Area:** Technology Patterns & Dependencies
**Date:** 2025-11-28

---

## Executive Summary

Iteration 10's technology foundation is **exceptionally strong**. All required libraries are installed (`react-markdown`, `framer-motion`, `remark-gfm`), existing patterns are well-established, and tRPC data orchestration is battle-tested. The 4 features in scope leverage proven architectural patterns with minimal technical risk.

**Key Findings:**
- **Zero new dependencies required** - All libraries already present
- **Mature markdown rendering pattern** - Evolution page demonstrates safe ReactMarkdown usage
- **Robust data fetching** - tRPC hooks with pagination, filtering, batching capabilities
- **Established animation system** - `useStaggerAnimation`, framer-motion variants ready
- **Design system foundation** - Spacing, typography, color semantics defined (Iteration 9)

**Risk Level:** LOW - All technology patterns proven, builders can execute confidently.

---

## Discoveries

### Discovery 1: React Markdown Ecosystem (Already Installed)

**What we found:**
- `react-markdown@10.1.0` installed and actively used (Evolution page)
- `remark-gfm@4.0.1` for GitHub-Flavored Markdown support
- Safe HTML rendering with custom component mapping (no XSS risk)
- Gradient text styling on headings already implemented

**Evidence:**
```typescript
// From app/evolution/[id]/page.tsx (lines 96-100)
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => (
      <GradientText gradient="cosmic" className="text-h1 mb-4">
        {props.children}
      </GradientText>
    ),
    // ... h2, h3, p, ul, ol, blockquote, code
  }}
>
  {report.content}
</ReactMarkdown>
```

**Recommendation:** Reuse exact pattern from Evolution page for Feature 4 (Individual Reflection Display).

---

### Discovery 2: tRPC Data Orchestration Patterns

**What we found:**
- **Parallel queries:** Dashboard already fetches 6 independent data sources (usage, reflections, dreams, evolution, visualizations, subscriptions)
- **Batched queries:** Each card component fetches own data (prevents waterfall)
- **Pagination:** Reflections router supports `page`, `limit` params (20 per page default)
- **Filtering:** Reflections list has `tone`, `search`, `sortBy`, `sortOrder` support
- **Caching:** TanStack Query handles automatic cache invalidation

**Evidence:**
```typescript
// From server/trpc/routers/reflections.ts (lines 19-66)
list: protectedProcedure
  .input(reflectionListSchema)
  .query(async ({ ctx, input }) => {
    const { page, limit, tone, isPremium, search, sortBy, sortOrder } = input;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('reflections')
      .select('*', { count: 'exact' })
      .eq('user_id', ctx.user.id);
    
    // Apply filters (tone, isPremium, search)
    // Apply sorting and pagination
    
    return {
      items: reflections,
      page, limit, total, totalPages, hasMore
    };
  })
```

**Dashboard data fetching pattern:**
```typescript
// From components/dashboard/cards/ReflectionsCard.tsx (lines 25-29)
const { data, isLoading, error } = trpc.reflections.list.useQuery({
  page: 1,
  limit: 3, // Only show 3 most recent
});
```

**Recommendation for Feature 2 (Dashboard):**
- Use existing pattern: Each card fetches own data via tRPC
- Dashboard Hero can fetch `dreams.list`, `reflections.list`, `users.getProfile` in parallel
- No batching wrapper needed - TanStack Query handles concurrent requests

---

### Discovery 3: Animation & Interaction Patterns

**What we found:**
- **`useStaggerAnimation` hook** for grid entrance animations (already used on dashboard)
- **Framer-motion variants** library at `lib/animations/variants.ts` (13 variants defined)
- **Reduced motion support** built into all animation hooks
- **CSS transitions preferred** for hover/focus states (60fps target)

**Evidence:**
```typescript
// From hooks/useStaggerAnimation.ts (lines 22-97)
export function useStaggerAnimation(
  itemCount: number,
  options: StaggerOptions = {}
): StaggerReturn {
  const { delay = 80, duration = 300, triggerOnce = true } = options;
  
  // IntersectionObserver for scroll-triggered animations
  // Returns getItemStyles(index) for staggered delays
  // Respects prefers-reduced-motion
}

// Usage in dashboard/page.tsx (lines 50-54)
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});
```

**Available framer-motion variants:**
- `cardVariants` - entrance + hover (no scale, y-axis lift only)
- `fadeInVariants` - simple opacity fade
- `modalContentVariants` - slide up + fade
- `staggerContainer` / `staggerItem` - parent/child stagger pattern
- `glowVariants` - box-shadow transitions

**Recommendation for Feature 3 (Reflection Page Transitions):**
- Form → Loading: `fadeInVariants` (300ms)
- Loading → Output: crossfade (150ms out, 300ms in)
- Use `AnimatePresence` for exit animations
- Respect `useReducedMotion()` hook

---

### Discovery 4: Existing Reflection Infrastructure

**What we found:**
- **Reflection list page** exists at `app/reflections/page.tsx` (240 lines)
- **Individual reflection page** exists at `app/reflections/[id]/page.tsx` (447 lines)
- **ReflectionCard component** exists for grid display
- **ReflectionFilters component** with search, tone, sort functionality
- **AI response rendering** currently uses `dangerouslySetInnerHTML` (plain HTML)

**Current implementation issues:**
1. **No markdown parsing** for AI responses (Feature 4 gap)
2. **Basic layout** - not optimized for readability (720px max-width not applied)
3. **No gradient text** on AI response headings
4. **Minimal visual accents** - missing cosmic glow, dream badges

**Evidence:**
```typescript
// From app/reflections/[id]/page.tsx (lines 227-231)
<div
  className="text-gray-200 leading-relaxed whitespace-pre-wrap"
  dangerouslySetInnerHTML={{ __html: reflection.aiResponse }}
/>
// ❌ ISSUE: No markdown parsing, basic styling
```

**vs. Evolution page pattern:**
```typescript
// From app/evolution/[id]/page.tsx (lines 96-171)
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => (
      <GradientText gradient="cosmic">{props.children}</GradientText>
    ),
    p: ({ node, ...props }) => (
      <p className="text-body leading-relaxed text-white/95 mb-4">{props.children}</p>
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-mirror-amethyst/60 pl-4 py-2 my-4 bg-mirror-amethyst/5">
        {props.children}
      </blockquote>
    ),
  }}
>
  {report.content}
</ReactMarkdown>
```

**Recommendation:** Refactor `app/reflections/[id]/page.tsx` to use ReactMarkdown pattern (Feature 4).

---

### Discovery 5: Form State Management Patterns

**What we found:**
- **Local state management** with `useState` for reflection forms (no Redux/Zustand)
- **Validation pattern** in `MirrorExperience.tsx` (lines 112-139)
- **Character counter component** exists at `components/reflection/CharacterCounter.tsx`
- **Tone selection** uses card-based UI (Feature 3 already implemented)

**Evidence:**
```typescript
// From app/reflection/MirrorExperience.tsx (lines 16-68)
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

const [formData, setFormData] = useState<FormData>({
  dream: '', plan: '', relationship: '', offering: ''
});

const handleFieldChange = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

const validateForm = (): boolean => {
  if (!selectedDreamId) {
    toast.warning('Please select a dream');
    return false;
  }
  // Validate each field...
  return true;
};
```

**Pattern strengths:**
- Simple, predictable state updates
- Clear validation logic
- Toast notifications for errors
- No prop-drilling (local to component)

**Recommendation:** Continue using local state pattern for Feature 3 (no architectural changes needed).

---

## Patterns Identified

### Pattern 1: Dashboard Data Orchestration

**Description:** Each dashboard card is a self-contained data-fetching component using tRPC hooks.

**Use Case:** Feature 2 (Dashboard Richness Transformation)

**Example:**
```typescript
// Pattern: Self-Contained Card Component
const DashboardHero: React.FC = () => {
  const { data: user } = trpc.users.getProfile.useQuery();
  const { data: dreams } = trpc.dreams.list.useQuery({ status: 'active' });
  
  const greeting = getTimeBasedGreeting(); // "Good morning/afternoon/evening"
  
  return (
    <div className="dashboard-hero">
      <h1>{greeting}, {user?.firstName || 'Dreamer'}!</h1>
      <p className="motivational-copy">
        {dreams?.length === 0 
          ? "Ready to create your first dream?" 
          : "Ready for your next reflection?"}
      </p>
      <GlowButton variant="cosmic" size="lg" href="/reflection">
        Reflect Now
      </GlowButton>
    </div>
  );
};
```

**Recommendation:** ✅ **USE THIS PATTERN** - Proven, simple, performant.

---

### Pattern 2: Markdown Rendering with Custom Components

**Description:** Use ReactMarkdown with custom component mapping for styled, accessible output.

**Use Case:** Feature 4 (Individual Reflection Display Enhancement)

**Example:**
```typescript
// Pattern: Safe Markdown Rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

const AIResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings with gradient text
        h1: ({ node, ...props }) => (
          <GradientText gradient="cosmic" className="text-h1 mb-lg">
            {props.children}
          </GradientText>
        ),
        h2: ({ node, ...props }) => (
          <GradientText gradient="cosmic" className="text-h2 mb-md">
            {props.children}
          </GradientText>
        ),
        
        // Body text with optimal readability
        p: ({ node, ...props }) => (
          <p className="text-body leading-relaxed text-white/95 mb-md">
            {props.children}
          </p>
        ),
        
        // Blockquotes with cosmic accent
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-mirror-amethyst/60 pl-lg py-md my-lg bg-mirror-amethyst/5 rounded-r-lg">
            {props.children}
          </blockquote>
        ),
        
        // Lists with proper spacing
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-md space-y-sm text-white/90">
            {props.children}
          </ul>
        ),
        
        // Code blocks
        code: ({ node, inline, ...props }) => (
          inline ? (
            <code className="bg-white/10 px-sm py-xs rounded text-mirror-amethyst font-mono text-sm">
              {props.children}
            </code>
          ) : (
            <code className="block bg-white/5 p-md rounded-lg font-mono text-sm overflow-x-auto mb-md">
              {props.children}
            </code>
          )
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
```

**Security:** ✅ ReactMarkdown sanitizes by default, no XSS risk.

**Recommendation:** ✅ **USE THIS PATTERN** for Feature 4.

---

### Pattern 3: Stagger Animation for Grid Entrance

**Description:** Use `useStaggerAnimation` hook for dashboard card entrance animations.

**Use Case:** Feature 2 (Dashboard sections fade-in with stagger)

**Example:**
```typescript
// Pattern: Grid Stagger Animation
const DashboardPage: React.FC = () => {
  const { containerRef, getItemStyles } = useStaggerAnimation(6, {
    delay: 150,      // 150ms between each card
    duration: 800,   // 800ms animation duration
    triggerOnce: true, // Only animate on first load
  });
  
  return (
    <div ref={containerRef} className="dashboard-grid">
      <div style={getItemStyles(0)}><UsageCard /></div>
      <div style={getItemStyles(1)}><ReflectionsCard /></div>
      <div style={getItemStyles(2)}><DreamsCard /></div>
      <div style={getItemStyles(3)}><EvolutionCard /></div>
      <div style={getItemStyles(4)}><VisualizationCard /></div>
      <div style={getItemStyles(5)}><SubscriptionCard /></div>
    </div>
  );
};
```

**Performance:** 60fps, respects `prefers-reduced-motion`.

**Recommendation:** ✅ **USE THIS PATTERN** for Feature 2.

---

### Pattern 4: Reflection State Transitions

**Description:** Smooth state machine for reflection form → loading → output using framer-motion.

**Use Case:** Feature 3 (Reflection Page Depth & Immersion)

**Example:**
```typescript
// Pattern: State Machine Transitions
import { motion, AnimatePresence } from 'framer-motion';

type ReflectionState = 'form' | 'loading' | 'output';

const ReflectionStateMachine: React.FC = () => {
  const [state, setState] = useState<ReflectionState>('form');
  const [statusText, setStatusText] = useState('Gazing into the mirror...');
  
  const handleSubmit = () => {
    setState('loading');
    
    // Update status text after 3s
    setTimeout(() => {
      setStatusText('Crafting your reflection...');
    }, 3000);
    
    // Submit to API
    createReflection.mutate(formData, {
      onSuccess: (data) => {
        setStatusText('Reflection complete!');
        setTimeout(() => {
          setState('output');
        }, 1000);
      }
    });
  };
  
  return (
    <AnimatePresence mode="wait">
      {state === 'form' && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReflectionForm onSubmit={handleSubmit} />
        </motion.div>
      )}
      
      {state === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="loading-overlay"
        >
          <CosmicLoader size="lg" />
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {statusText}
          </motion.p>
        </motion.div>
      )}
      
      {state === 'output' && (
        <motion.div
          key="output"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ReflectionOutput />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

**Recommendation:** ✅ **USE THIS PATTERN** for Feature 3.

---

## Complexity Assessment

### High Complexity Areas

**Feature 2: Dashboard Richness Transformation** - MEDIUM-HIGH
- **Why complex:** 7 sections (Hero, Dreams, Reflections, Progress, Insights), data orchestration, responsive grid
- **Estimated builder splits:** 1 builder can handle (all patterns exist)
- **Mitigation:** Use existing card pattern, parallel tRPC queries, `useStaggerAnimation`

**Feature 4: Individual Reflection Display Enhancement** - MEDIUM
- **Why complex:** Markdown rendering, typography, visual accents, responsive layout
- **Estimated builder splits:** 1 builder can handle (copy Evolution page pattern)
- **Mitigation:** Reuse ReactMarkdown pattern, apply design system spacing

### Medium Complexity Areas

**Feature 3: Reflection Page Depth & Immersion** - MEDIUM
- **Why:** State transitions, form UX, tone selection cards, animations
- **Straightforward:** Existing MirrorExperience component already 80% there
- **Work needed:** Add progress indicator, enhance tone cards, smooth transitions

**Feature 5: Reflection Page Collection View** - LOW-MEDIUM
- **Why:** Filtering, pagination, card grid
- **Straightforward:** Existing `app/reflections/page.tsx` already implements this
- **Work needed:** Enhance card design, add dream filter dropdown

### Low Complexity Areas

**All 4 features leverage proven patterns** - No high-risk unknowns.

---

## Technology Recommendations

### Primary Stack (No Changes)

- **Framework:** Next.js 14 (App Router) ✅ Installed
- **UI Library:** React 18.3.1 ✅ Installed
- **Styling:** Tailwind CSS + CSS Modules ✅ Installed
- **State Management:** Local state (useState) + TanStack Query (via tRPC) ✅ Installed
- **Data Fetching:** tRPC 11.6.0 ✅ Installed
- **Animations:** Framer Motion 11.18.2 ✅ Installed
- **Markdown:** react-markdown 10.1.0 + remark-gfm 4.0.1 ✅ Installed

**Rationale:** All required libraries already installed and battle-tested.

### Supporting Libraries (No New Dependencies)

**Already installed:**
- `lucide-react` 0.546.0 - Icon library
- `clsx` 2.1.0 - Conditional class names
- `tailwind-merge` 2.2.1 - Merge Tailwind classes safely
- `zod` 3.25.76 - Schema validation (tRPC inputs)

**Not needed:**
- ❌ Redux/Zustand - Local state sufficient for forms
- ❌ React Hook Form - Simple forms, validation logic already exists
- ❌ Additional markdown plugins - `remark-gfm` covers all use cases

---

## Integration Points

### Internal Integrations

**Dashboard → Reflection Flow:**
- **Connection:** "Reflect Now" button (Feature 2) → MirrorExperience (Feature 3)
- **Data:** Pre-select dream if clicked from dream card
- **Pattern:** URL params (`/reflection?dreamId=xxx`)

**Dashboard → Reflections List Flow:**
- **Connection:** "View All" link (Feature 2) → Reflections page (Feature 5)
- **Data:** None (simple navigation)

**Reflections List → Individual Reflection:**
- **Connection:** Click reflection card (Feature 5) → Individual display (Feature 4)
- **Data:** Reflection ID in URL (`/reflections/[id]`)

**Data Dependencies:**
```
Dashboard (Feature 2)
  ├─ dreams.list (existing tRPC query)
  ├─ reflections.list (existing tRPC query)
  ├─ users.getProfile (existing tRPC query)
  └─ evolution.latest (existing tRPC query)

Reflection Page (Feature 3)
  ├─ dreams.list (pre-select dream)
  └─ reflection.create (existing mutation)

Individual Reflection (Feature 4)
  └─ reflections.getById (existing query)

Reflections Collection (Feature 5)
  └─ reflections.list (existing query with filters)
```

**Conflict risk:** NONE - All queries independent, no shared mutations.

---

## External Integrations

**No external integrations required** - All features use existing internal APIs.

**Database queries:**
- Dreams: `dreams` table (SELECT queries only)
- Reflections: `reflections` table (SELECT queries + view count increment)
- Users: `users` table (SELECT profile only)
- Evolution: `evolution_reports` table (SELECT latest only)

**AI response format:**
- Current: Plain text or HTML string
- Needed: Markdown-formatted string
- **NOTE:** AI response generation is OUTSIDE this iteration scope
- **Assumption:** Reflections already return markdown-compatible text

---

## Risks & Challenges

### Technical Risks

**Risk 1: AI Response Markdown Compatibility**
- **Impact:** MEDIUM - If AI responses aren't markdown, Feature 4 breaks
- **Likelihood:** 20% (existing responses may be plain text)
- **Mitigation:** 
  - Test with existing reflections in database
  - Add fallback: If no markdown detected, wrap in `<p>` tags
  - Document required format for future AI prompt engineering

**Risk 2: Dashboard Performance with 6 Parallel Queries**
- **Impact:** LOW - Slight LCP increase if queries slow
- **Likelihood:** 30% (depends on Supabase response time)
- **Mitigation:**
  - Use TanStack Query's automatic batching
  - Add loading skeletons for each card
  - Monitor LCP with Lighthouse CI (target < 2.5s)

**Risk 3: Markdown XSS Vulnerabilities**
- **Impact:** CRITICAL - User-generated content could inject scripts
- **Likelihood:** 5% (ReactMarkdown sanitizes by default)
- **Mitigation:**
  - **DO NOT** use `dangerouslySetInnerHTML` with markdown
  - **USE** ReactMarkdown with custom components (already proven safe in Evolution page)
  - Security review in Iteration 3 validation

### Complexity Risks

**Risk 1: Dashboard Visual Hierarchy**
- **Impact:** MEDIUM - Subjective UX, may need iteration
- **Likelihood:** 60% (design is subjective)
- **Mitigation:**
  - Follow vision.md hierarchy: Hero (primary) → Dreams/Reflections (secondary) → Stats (tertiary)
  - Use consistent spacing from design system (Iteration 9)
  - User feedback loop in Iteration 3 QA

**Risk 2: Reflection Form State Transitions Feeling Rushed**
- **Impact:** LOW - Animation timing subjective
- **Likelihood:** 40% (need to test feel)
- **Mitigation:**
  - Use recommended timings: 300ms fade, 500ms loading minimum
  - Add status text updates (2-3 phases)
  - Respect `prefers-reduced-motion`

---

## Recommendations for Planner

### 1. **Batch Dashboard Queries, Don't Waterfall**

**Rationale:** Dashboard has 6 data sources (dreams, reflections, usage, evolution, visualizations, subscriptions). If fetched sequentially, this creates 6-query waterfall (worst case: 600ms+ LCP).

**Pattern:**
```typescript
// ✅ CORRECT: Each card fetches in parallel
<DashboardGrid>
  <UsageCard />         {/* Fetches usage.stats */}
  <ReflectionsCard />   {/* Fetches reflections.list */}
  <DreamsCard />        {/* Fetches dreams.list */}
  {/* ... */}
</DashboardGrid>

// ❌ WRONG: Single query with joins
const { data } = trpc.dashboard.getAll.useQuery(); // Creates backend bottleneck
```

**Benefit:** TanStack Query automatically batches concurrent queries, LCP stays < 2.5s.

---

### 2. **Reuse Evolution Page Markdown Pattern for Feature 4**

**Rationale:** Evolution page already implements safe, styled ReactMarkdown rendering. Don't reinvent.

**Action:**
1. Copy `app/evolution/[id]/page.tsx` ReactMarkdown component mapping (lines 96-171)
2. Create `components/reflections/AIResponseRenderer.tsx`
3. Replace `dangerouslySetInnerHTML` in `app/reflections/[id]/page.tsx` (line 229)
4. Apply 720px max-width container for readability

**Benefit:** Zero security risk, proven pattern, saves 4-6 hours of builder time.

---

### 3. **Use Existing `useStaggerAnimation` for Dashboard Entrance**

**Rationale:** Dashboard already uses this hook for 6-card grid. Works perfectly for Feature 2.

**Pattern:**
```typescript
const { containerRef, getItemStyles } = useStaggerAnimation(7, {
  delay: 150,      // 150ms between sections
  duration: 800,   // Smooth 800ms fade-in
  triggerOnce: true,
});

return (
  <div ref={containerRef}>
    <div style={getItemStyles(0)}><DashboardHero /></div>
    <div style={getItemStyles(1)}><DreamsGrid /></div>
    <div style={getItemStyles(2)}><RecentReflectionsCard /></div>
    {/* ... */}
  </div>
);
```

**Benefit:** Consistent animations, 60fps, respects reduced motion, already implemented.

---

### 4. **Add AI Response Format Validation in Feature 4**

**Rationale:** If AI responses aren't markdown-compatible, ReactMarkdown will render poorly.

**Action:**
```typescript
const AIResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Detect markdown (headings, lists, code blocks)
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);
  
  if (!hasMarkdown) {
    // Fallback: Wrap plain text in paragraphs
    return (
      <div className="reflection-text">
        {content.split('\n\n').map((para, i) => (
          <p key={i} className="text-body leading-relaxed mb-md">{para}</p>
        ))}
      </div>
    );
  }
  
  return <ReactMarkdown>{content}</ReactMarkdown>;
};
```

**Benefit:** Graceful degradation if AI responses lack markdown.

---

### 5. **Feature Dependencies Are Minimal**

**Rationale:** Features 2-5 have NO blocking dependencies on each other.

**Execution order:**
- **Parallel:** Features 2, 3, 5 can build simultaneously
- **Sequential:** Feature 4 depends on Feature 5 (same file `app/reflections/[id]/page.tsx`)

**Recommended builder assignment:**
- **Builder-1:** Feature 2 (Dashboard) - 7 sections, most complex
- **Builder-2:** Feature 3 (Reflection page) - State transitions, form UX
- **Builder-3:** Features 4 + 5 (Reflections display + collection) - Same file, tightly coupled

**Benefit:** 3 builders can work in parallel without conflicts.

---

## Resource Map

### Critical Files/Directories

**Data Fetching (tRPC):**
- `/server/trpc/routers/reflections.ts` - Reflections CRUD (pagination, filtering)
- `/server/trpc/routers/dreams.ts` - Dreams CRUD (includes stats)
- `/server/trpc/routers/users.ts` - User profile queries
- `/server/trpc/routers/evolution.ts` - Evolution reports

**Existing Pages (Reference):**
- `/app/dashboard/page.tsx` - Dashboard layout pattern (Feature 2 reference)
- `/app/reflection/MirrorExperience.tsx` - Reflection form (Feature 3 reference)
- `/app/reflections/page.tsx` - Reflections list (Feature 5 reference)
- `/app/reflections/[id]/page.tsx` - Individual reflection (Feature 4 TO MODIFY)
- `/app/evolution/[id]/page.tsx` - Markdown rendering pattern (Feature 4 reference)

**Components (Reusable):**
- `/components/ui/glass/GlassCard.tsx` - Card wrapper
- `/components/ui/glass/GlowButton.tsx` - Primary CTA button
- `/components/ui/glass/CosmicLoader.tsx` - Loading spinner
- `/components/ui/glass/GradientText.tsx` - Gradient headings
- `/components/shared/EmptyState.tsx` - Empty state pattern
- `/components/dashboard/cards/` - Dashboard card components (Feature 2 reference)
- `/components/reflections/ReflectionCard.tsx` - Reflection grid card (Feature 5)

**Hooks (Utilities):**
- `/hooks/useStaggerAnimation.ts` - Grid entrance animations
- `/hooks/useAuth.ts` - User authentication state
- `/hooks/useDashboard.ts` - Dashboard refresh utility

**Styling (Design System):**
- `/styles/globals.css` - Spacing scale, typography, color palette (lines 1-200)
- `/lib/animations/variants.ts` - Framer-motion variants (13 defined)

---

### Key Dependencies

**Required (All Installed):**
- `react-markdown@10.1.0` - Markdown rendering
- `remark-gfm@4.0.1` - GitHub-Flavored Markdown
- `framer-motion@11.18.2` - Animations
- `@trpc/client@11.6.0` - Type-safe API calls
- `@tanstack/react-query@5.90.5` - Data fetching/caching
- `lucide-react@0.546.0` - Icons
- `clsx@2.1.0` + `tailwind-merge@2.2.1` - Conditional classes

**Not Required:**
- ❌ No new npm packages
- ❌ No external APIs
- ❌ No database migrations

---

### Testing Infrastructure

**Existing:**
- Manual browser testing (Chrome, Firefox, Safari, Edge)
- Lighthouse CI for performance monitoring
- User feedback loop (Ahiya as primary tester)

**Recommended for Iteration 10:**
1. **Manual testing:** All 4 features on 5 breakpoints (320px, 768px, 1024px, 1440px, 1920px)
2. **Performance profiling:** Dashboard LCP measurement (target < 2.5s)
3. **Accessibility audit:** Keyboard navigation, screen reader labels
4. **Markdown security test:** Inject XSS attempt in reflection content

**No automated testing required** (focus on delivery speed).

---

## Questions for Planner

### 1. **Are existing AI responses markdown-formatted?**

**Why it matters:** Feature 4 (Individual Reflection Display) depends on markdown-formatted AI responses.

**Options:**
- A) YES → Proceed with ReactMarkdown rendering
- B) NO → Add fallback plain text renderer + document markdown requirement

**Recommendation:** Test with existing reflections in database, implement fallback if needed.

---

### 2. **Should Dashboard show analytics graphs or simple stats?**

**Why it matters:** Vision.md says "This month: X reflections" (simple stats), but could expand to graphs.

**Options:**
- A) Simple stats (text + numbers) → Faster implementation (2-3 hours)
- B) Visual graphs (bar chart, line chart) → Requires chart library (recharts), 6-8 hours

**Recommendation:** Start with simple stats (align with vision.md), defer graphs to post-MVP.

---

### 3. **How should reflection page handle no dreams state?**

**Why it matters:** Feature 3 (Reflection page) requires dream selection. If user has no dreams, what happens?

**Options:**
- A) Block reflection, show "Create dream first" message
- B) Allow reflection without dream association (dream_id = null)
- C) Auto-create "General Reflection" dream

**Recommendation:** Option A (align with existing MirrorExperience logic, lines 347-359).

---

### 4. **Should reflection collection view support dream filtering?**

**Why it matters:** Vision.md says "Filter dropdown: 'All dreams' or specific dream" (Feature 5).

**Current state:** Reflections list has tone, search, sort filters - NO dream filter.

**Implementation:**
- Add `dreamId` param to `reflections.list` tRPC query
- Add dropdown to `ReflectionFilters.tsx`
- Filter reflections by `dream_id` in database query

**Recommendation:** YES - Implement dream filter (aligns with vision.md, 2-3 hours additional work).

---

## Summary & Builder Handoff

### Technology Foundation: STRONG ✅

- **Zero new dependencies** - All libraries installed
- **Proven patterns** - ReactMarkdown (Evolution), tRPC (Dashboard), animations (useStaggerAnimation)
- **Low risk** - No architectural unknowns, 95% code reuse

### Builder Assignments (Recommended)

**Builder-1: Dashboard Richness (Feature 2)**
- **Scope:** Hero, Dreams Grid, Recent Reflections, Progress Stats, Insights Preview
- **Patterns:** Use existing dashboard card pattern, `useStaggerAnimation`, parallel tRPC queries
- **Files:** Create new `/app/dashboard/components/DashboardHero.tsx`, modify `/app/dashboard/page.tsx`
- **Estimated:** 8-10 hours

**Builder-2: Reflection Page Depth (Feature 3)**
- **Scope:** Visual atmosphere, tone selection cards, state transitions (form → loading → output)
- **Patterns:** Use `MirrorExperience.tsx` as base, add framer-motion transitions, enhance tone cards
- **Files:** Modify `/app/reflection/MirrorExperience.tsx`, add CSS for darker atmosphere
- **Estimated:** 6-8 hours

**Builder-3: Reflection Display & Collection (Features 4 + 5)**
- **Scope:** Individual reflection markdown rendering + reflections list filtering
- **Patterns:** Copy Evolution ReactMarkdown pattern, enhance existing `/app/reflections/[id]/page.tsx`
- **Files:** Modify `/app/reflections/[id]/page.tsx`, `/app/reflections/page.tsx`, create `AIResponseRenderer.tsx`
- **Estimated:** 8-10 hours

**Total estimated:** 22-28 hours (within 24-32 hour budget).

---

### Critical Success Factors

1. **Reuse Evolution ReactMarkdown pattern** - Don't reinvent, copy proven code
2. **Parallel tRPC queries for Dashboard** - Avoid waterfall, keep LCP < 2.5s
3. **Respect design system** - Use spacing scale, typography, color semantics from Iteration 9
4. **Test markdown compatibility** - Validate AI responses render correctly
5. **Reduced motion support** - All animations respect `prefers-reduced-motion`

---

**Ready for execution.** All patterns proven, technology foundation solid, builder tasks clear. 🚀
