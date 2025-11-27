# Explorer 1 Report: Architecture & Structure Analysis

**Explorer ID:** Explorer-1  
**Iteration:** 10 (Global)  
**Plan:** plan-6  
**Focus Area:** Architecture & Structure  
**Created:** 2025-11-28  
**Status:** COMPLETE

---

## Executive Summary

Mirror of Dreams has a **solid, well-architected foundation** ready for Iteration 2's transformation. The current architecture follows Next.js 14 App Router patterns with tRPC for type-safe APIs, a modular component structure, and established design system. **All four features in Iteration 2 scope have clear architectural homes:**

1. **Dashboard Richness (Feature 2):** Extend existing DashboardGrid + 6 card components
2. **Reflection Page Depth (Feature 3):** Enhance MirrorExperience.tsx with state transitions
3. **Individual Reflection Display (Feature 4):** Transform /reflections/[id]/page.tsx with markdown rendering
4. **Reflections Collection View (Feature 5):** Already exists at /reflections/page.tsx, needs UI enhancement

**Key Finding:** Zero breaking changes required. All enhancements are additive transformations of existing patterns.

---

## Discoveries

### Current Application Architecture

**Pattern:** Server Components + Client Components (Next.js 14 App Router)

```
app/
├── dashboard/page.tsx          ← CLIENT: Main hub (Feature 2 target)
├── reflection/
│   ├── page.tsx                ← CLIENT: Wrapper for MirrorExperience
│   └── MirrorExperience.tsx    ← CLIENT: Form + state machine (Feature 3 target)
├── reflections/
│   ├── page.tsx                ← CLIENT: Collection view (Feature 5 target)
│   └── [id]/page.tsx           ← CLIENT: Individual display (Feature 4 target)
├── dreams/page.tsx             ← CLIENT: Dreams list
├── evolution/page.tsx          ← CLIENT: Evolution reports
└── visualizations/page.tsx     ← CLIENT: Visual analytics
```

**Discovery:** All pages are client components using tRPC for data fetching. Server components not used for authenticated routes.

### Component Organization

**Dashboard Components:**
```
components/dashboard/
├── shared/
│   ├── DashboardCard.tsx       ← Reusable card wrapper
│   ├── DashboardGrid.tsx       ← 2x3 responsive grid (already exists!)
│   ├── WelcomeSection.tsx      ← Personalized greeting (already exists!)
│   ├── ProgressRing.tsx        ← Progress visualization
│   ├── ReflectionItem.tsx      ← Recent reflection display
│   └── TierBadge.tsx           ← Subscription tier badge
└── cards/
    ├── UsageCard.tsx           ← Monthly usage stats
    ├── DreamsCard.tsx          ← Active dreams (3 max) ← ENHANCE for Feature 2
    ├── ReflectionsCard.tsx     ← Recent 3 reflections ← ENHANCE for Feature 2
    ├── EvolutionCard.tsx       ← Evolution insights preview
    ├── VisualizationCard.tsx   ← Visualization preview
    └── SubscriptionCard.tsx    ← Tier info + upgrade CTA
```

**Reflection Components:**
```
components/reflections/
├── ReflectionCard.tsx          ← Grid item for collection view ← ENHANCE for Feature 5
├── ReflectionFilters.tsx       ← Filter/sort controls (already exists!)
└── FeedbackForm.tsx            ← Rating + feedback
```

**Discovery:** Dashboard infrastructure already 80% complete. Feature 2 needs **enhancement**, not creation.

### Data Flow Architecture

**Pattern:** tRPC Queries → React Query → Client Components

```typescript
// Example: Dashboard card data flow
const { data: dreams, isLoading } = trpc.dreams.list.useQuery({
  status: 'active',
  includeStats: true,
});
```

**tRPC Routers (server/trpc/routers/):**
- `dreams.ts` → Active dreams, stats, limits
- `reflections.ts` → List (paginated), getById, filters
- `reflection.ts` → Create mutation (POST reflection)
- `evolution.ts` → Evolution reports
- `visualizations.ts` → Visual analytics

**Discovery:** All data queries already exist. Zero backend changes needed for Iteration 2.

### Navigation & Layout System

**AppNavigation Component** (components/shared/AppNavigation.tsx):
- **Fixed positioning** with `z-index: 100`
- **CSS Variable:** `--nav-height` (measured dynamically, currently ~72px desktop, ~140px mobile with menu)
- **Padding Pattern:** All pages use `padding-top: var(--nav-height)`
- **Mobile:** Hamburger menu (AnimatePresence for smooth transitions)

**Current Issue (Iteration 1 fixes this):**
```typescript
// Line 85-110: Navigation height measurement
useEffect(() => {
  const measureNavHeight = () => {
    const nav = document.querySelector('[data-nav-container]');
    if (nav) {
      const height = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  };
  measureNavHeight();
}, [showMobileMenu]);
```

**Discovery:** Navigation architecture solid. `--nav-height` variable exists but not consistently applied across all pages.

### Reflection Experience State Machine

**MirrorExperience.tsx** (816 lines):

**States:**
1. **Dream Selection** (no selectedDreamId) → Shows dream list
2. **Questionnaire** (selectedDreamId set) → One-page scrollable form (4 questions + tone)
3. **Submitting** (isSubmitting = true) → CosmicLoader overlay with status text
4. **Output** (viewMode = 'output') → AI response display

**State Transitions:**
```typescript
// Form submission flow
handleSubmit() 
  → setIsSubmitting(true) 
  → createReflection.mutate() 
  → onSuccess: router.push('/reflection?id={id}') 
  → viewMode = 'output'
```

**Discovery:** State machine already sophisticated. Feature 3 needs **visual enhancement** (atmosphere, transitions), not structural changes.

### Reflection Display Architecture

**Individual Reflection Page** (/reflections/[id]/page.tsx):

**Current Structure:**
```tsx
<div className="max-w-4xl mx-auto">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Main content (2/3 width) */}
    <div className="lg:col-span-2">
      <div className="rounded-xl border bg-slate-900/90 p-6">
        <h2>AI Reflection</h2>
        <div dangerouslySetInnerHTML={{ __html: reflection.aiResponse }} />
      </div>
      <div>Original Answers</div>
    </div>
    {/* Sidebar (1/3 width) */}
    <div>Metadata, Actions</div>
  </div>
</div>
```

**Discovery:** Layout exists but lacks:
- Centered reading column (720px max-width per vision)
- Markdown parsing (`dangerouslySetInnerHTML` used instead of react-markdown)
- Visual hierarchy (gradient headings, blockquote accents)

### Reflections Collection Page

**Collection View** (/reflections/page.tsx):

**Current Features:**
- Filters: search, tone, isPremium, sortBy, sortOrder
- Pagination: 12 per page
- Grid: `md:grid-cols-2 lg:grid-cols-3`
- Empty state: Already using EmptyState component

**Discovery:** Architecture complete. Feature 5 needs **card enhancement** and **filter refinement**, not rebuilding.

---

## Patterns Identified

### Pattern 1: Dashboard Card Pattern

**Description:** Reusable card wrapper with loading, error, and animation states

**File:** `components/dashboard/shared/DashboardCard.tsx`

**Structure:**
```tsx
<DashboardCard
  isLoading={isLoading}
  hasError={!!error}
  animated={true}
  animationDelay={100}
  hoverable={true}
>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <HeaderAction href="/link">View All →</HeaderAction>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</DashboardCard>
```

**Use Case:** All 6 dashboard cards (Usage, Dreams, Reflections, Evolution, Visualization, Subscription)

**Recommendation:** **REUSE** for Feature 2. Enhance cards, don't recreate.

### Pattern 2: tRPC Query + Loading + Empty State

**Description:** Standard data fetching pattern with loading and empty states

**Example (DreamsCard.tsx):**
```tsx
const { data: dreams, isLoading, error } = trpc.dreams.list.useQuery({
  status: 'active',
  includeStats: true,
});

if (isLoading) return <LoadingState />;
if (dreams.length === 0) return <EmptyState />;
return <div className="dreams-list">{/* Render dreams */}</div>;
```

**Recommendation:** **APPLY** to all new components. Already established pattern.

### Pattern 3: Stagger Animation

**Description:** Sequential fade-in for list items

**File:** `hooks/useStaggerAnimation.ts`

**Usage (Dashboard):**
```tsx
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});

<div ref={containerRef}>
  {items.map((item, i) => (
    <div style={getItemStyles(i)}>{item}</div>
  ))}
</div>
```

**Recommendation:** **USE** for Feature 2 (dashboard sections), Feature 5 (reflection cards).

### Pattern 4: Framer Motion State Transitions

**Description:** Smooth transitions between view states

**Example (MirrorExperience.tsx):**
```tsx
<AnimatePresence>
  {isSubmitting && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CosmicLoader />
    </motion.div>
  )}
</AnimatePresence>
```

**Recommendation:** **EXTEND** for Feature 3 (form → loading → output transitions).

### Pattern 5: CSS Custom Properties

**Description:** Design tokens via CSS variables

**File:** `styles/variables.css`

**Defined Variables:**
```css
--nav-height: 72px (dynamic)
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
--cosmic-text: rgba(255, 255, 255, 0.95)
--cosmic-text-muted: rgba(255, 255, 255, 0.6)
--cosmic-text-secondary: rgba(255, 255, 255, 0.4)
```

**Recommendation:** **REFERENCE** for Feature 2 spacing, Feature 4 typography.

---

## Complexity Assessment

### Feature 2: Dashboard Richness Transformation (MEDIUM COMPLEXITY)

**Components Affected:**
- `/app/dashboard/page.tsx` (enhance layout)
- `components/dashboard/cards/DreamsCard.tsx` (add dream metadata)
- `components/dashboard/cards/ReflectionsCard.tsx` (enhance snippets)
- New: `components/dashboard/cards/ProgressStatsCard.tsx` (create)
- New: `components/dashboard/shared/HeroSection.tsx` (optional, can enhance WelcomeSection)

**Data Integration:**
- Existing queries: `trpc.dreams.list`, `trpc.reflections.list`
- New query needed: `trpc.usage.getStats` (monthly reflections, weekly dreams)

**Complexity Drivers:**
- **Data orchestration:** 6 tRPC queries must load efficiently (batching needed)
- **Visual hierarchy:** Primary → Secondary → Tertiary (design-heavy)
- **Responsive layout:** Mobile stacks, desktop 2-3 column grid

**Estimate:** 8-12 hours (1 builder, 1.5 days)

### Feature 3: Reflection Page Depth & Immersion (MEDIUM-HIGH COMPLEXITY)

**Components Affected:**
- `/app/reflection/MirrorExperience.tsx` (enhance atmosphere)
- New: `components/reflection/ReflectionQuestionCard.tsx` (extract question UI)
- New: `components/reflection/ToneSelectionCard.tsx` (extract tone UI)

**State Transitions:**
1. **Form → Loading:** Fade out form, expand cosmic loader
2. **Loading → Output:** Fade out loader, fade in reflection content

**Complexity Drivers:**
- **Atmosphere:** Darker background, vignette effect, centered narrow content (800px)
- **Animations:** Smooth crossfades (300-500ms) using Framer Motion
- **Tone selection:** Visual cards (not buttons) with descriptions
- **Progress indicator:** "Question 1 of 4" visual steps

**Estimate:** 10-14 hours (1 builder, 2 days)

### Feature 4: Individual Reflection Display Enhancement (MEDIUM COMPLEXITY)

**Components Affected:**
- `/app/reflections/[id]/page.tsx` (restructure layout)
- New: `components/reflections/ReflectionDisplay.tsx` (reading layout)
- New: `components/reflections/AIResponseRenderer.tsx` (markdown parser)

**Markdown Integration:**
- **Library:** `react-markdown` v10.1.0 (already installed!)
- **Plugin:** `remark-gfm` v4.0.1 (already installed!)
- **Security:** XSS protection via react-markdown's built-in sanitization

**Complexity Drivers:**
- **Markdown parsing:** Headings, bold, lists, blockquotes
- **Typography system:** 18px body, line-height 1.8, gradient headings
- **Reading column:** 720px max-width, generous line-height
- **Visual accents:** Cosmic glow on AI container, dream badge, gradient text

**Estimate:** 6-10 hours (1 builder, 1 day)

### Feature 5: Reflection Page Collection View (LOW-MEDIUM COMPLEXITY)

**Components Affected:**
- `/app/reflections/page.tsx` (enhance header, filters)
- `components/reflections/ReflectionCard.tsx` (enhance card design)
- `components/reflections/ReflectionFilters.tsx` (already exists, minor tweaks)

**Current State:** 90% complete
- Filters: ✅ Implemented
- Pagination: ✅ Implemented (20 per page logic exists, vision says 20 too)
- Empty state: ✅ Using EmptyState component

**Complexity Drivers:**
- **Card enhancement:** Add tone badge, improve snippet display (120 chars)
- **Hover states:** Lift + glow effect (CSS transitions)
- **Header:** "Your Reflections" with count, filter dropdown

**Estimate:** 4-6 hours (1 builder, 0.5 day)

---

## Integration Points

### tRPC Data Layer

**Existing Endpoints (server/trpc/routers/):**

**dreams.ts:**
```typescript
list: publicProcedure.input(z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  includeStats: z.boolean().optional(),
})).query(async ({ input, ctx }) => { /* ... */ })
```

**reflections.ts:**
```typescript
list: publicProcedure.input(z.object({
  page: z.number().default(1),
  limit: z.number().default(12),
  search: z.string().optional(),
  tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
  isPremium: z.boolean().optional(),
  sortBy: z.enum(['created_at', 'word_count', 'rating']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})).query(async ({ input, ctx }) => { /* ... */ })

getById: publicProcedure.input(z.object({
  id: z.string(),
})).query(async ({ input, ctx }) => { /* ... */ })
```

**reflection.ts:**
```typescript
create: publicProcedure.input(z.object({
  dreamId: z.string(),
  dream: z.string(),
  plan: z.string(),
  relationship: z.string(),
  offering: z.string(),
  tone: z.enum(['gentle', 'intense', 'fusion']),
})).mutation(async ({ input, ctx }) => { /* ... */ })
```

**New Endpoints Needed:**

**usage.ts (for Feature 2 - Progress Stats):**
```typescript
getStats: publicProcedure.query(async ({ ctx }) => {
  return {
    thisMonthReflections: 12,
    thisWeekDreams: 3,
    totalReflections: 45,
    totalDreams: 8,
  };
})
```

**Recommendation:** Create `server/trpc/routers/usage.ts` for dashboard stats.

### Design System Integration

**CSS Variables (styles/variables.css):**

**Spacing Scale:**
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
```

**Typography:**
```css
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px)
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 1.875rem (30px)
--text-4xl: 2.25rem (36px)
```

**Colors:**
```css
--cosmic-text: rgba(255, 255, 255, 0.95)
--cosmic-text-muted: rgba(255, 255, 255, 0.6)
--cosmic-text-secondary: rgba(255, 255, 255, 0.4)
--mirror-purple: #8B5CF6
--mirror-violet: #A855F7
--mirror-blue: #3B82F6
--mirror-gold: #FBBF24
```

**Recommendation:** Zero new variables needed. All exist.

### React Markdown Integration

**Library:** `react-markdown` v10.1.0 (package.json line 71)  
**Plugin:** `remark-gfm` v4.0.1 (package.json line 73)

**Usage Pattern (for Feature 4):**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => <h1 className="text-4xl font-bold gradient-text-cosmic" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-3xl font-semibold text-mirror-purple" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-2xl font-medium text-mirror-violet" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-mirror-purple pl-4 italic text-white/80" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-semibold gradient-text-cosmic" {...props} />
    ),
  }}
>
  {reflection.aiResponse}
</ReactMarkdown>
```

**Security:** XSS protection built-in (no `dangerouslySetInnerHTML`).

---

## Risks & Challenges

### Technical Risks

**Risk 1: Dashboard Data Fetching Performance Degradation**
- **Impact:** HIGH (affects primary landing page)
- **Probability:** 60%
- **Details:** 6 tRPC queries firing on dashboard mount could cause waterfall
- **Mitigation:**
  1. **Batched tRPC queries:** Use `trpc.useQueries()` to parallelize
  2. **Loading skeletons:** Show DashboardCard with `isLoading={true}` immediately
  3. **Stale-while-revalidate:** Cache recent data, refresh in background
  4. **Monitor LCP:** Lighthouse CI to track "Largest Contentful Paint" (target: <2.5s)

**Risk 2: Markdown Rendering XSS Vulnerabilities**
- **Impact:** CRITICAL (security breach)
- **Probability:** 20%
- **Details:** AI response parsing could inject malicious HTML/scripts
- **Mitigation:**
  1. **Use react-markdown:** Built-in sanitization (already installed!)
  2. **Avoid `dangerouslySetInnerHTML`:** Replace in reflections/[id]/page.tsx line 229
  3. **Security review:** Validate AI response before rendering
  4. **Content Security Policy:** Set strict CSP headers

**Risk 3: Animation Performance on Low-End Devices**
- **Impact:** MEDIUM (affects user experience)
- **Probability:** 40%
- **Details:** Framer Motion transitions + cosmic particles could drop below 60fps
- **Mitigation:**
  1. **Respect `prefers-reduced-motion`:** Disable animations except opacity fades
  2. **60fps profiling:** Chrome DevTools Performance tab
  3. **Reduce particles on mobile:** Conditional rendering based on screen width
  4. **Use `will-change` CSS:** Optimize transform/opacity animations

### Complexity Risks

**Risk 4: Subjective UX Quality (Dashboard & Reflection)**
- **Impact:** MEDIUM (affects product quality perception)
- **Probability:** 50%
- **Details:** "Dashboard feels complete" and "Reflection experience sacred" are subjective
- **Mitigation:**
  1. **User feedback loops:** Test with Ahiya (creator) after each builder completes
  2. **Iterate on feel:** Allow 2-3 rounds of polish adjustments
  3. **Reference designs:** Use vision.md mockups as north star
  4. **Measure engagement:** Session time on reflection page (target: 5+ minutes)

---

## Recommendations for Planner

### 1. Feature 2 (Dashboard) - Split into 2 Sub-Builders

**Rationale:** 7 sections (Hero, Dreams, Reflections, Progress, Insights, Visual Hierarchy, Responsive) = 10-12 hours. Too much for one builder.

**Sub-Builder A (6 hours):**
- Enhance WelcomeSection (personalized greeting)
- Create ProgressStatsCard (monthly/weekly stats)
- Enhance DreamsCard (add metadata: days remaining, reflection count)
- Enhance ReflectionsCard (add snippets: first 120 chars)

**Sub-Builder B (6 hours):**
- Create InsightsPreviewCard (latest evolution snippet)
- Implement visual hierarchy (primary/secondary/tertiary)
- Responsive layout (mobile stacks, desktop 2-3 column)
- Stagger animations (useStaggerAnimation hook)

### 2. Feature 3 (Reflection Page) - Single Builder with Clear Milestones

**Rationale:** State machine already solid. Focus on visual enhancements + smooth transitions.

**Milestones:**
1. **Visual Atmosphere (4 hours):** Darker background, vignette, centered narrow content (800px)
2. **Form Presentation (3 hours):** Guiding text, progress indicator, character counters
3. **Tone Selection (2 hours):** Visual cards with descriptions
4. **Transitions (3 hours):** form → loading → output (Framer Motion crossfades)

### 3. Feature 4 (Individual Reflection) - Markdown Parsing Critical Path

**Rationale:** react-markdown already installed. Security-first implementation.

**Critical Path:**
1. **Replace `dangerouslySetInnerHTML`** (Line 229 in reflections/[id]/page.tsx)
2. **Create AIResponseRenderer.tsx** with react-markdown + remarkGfm
3. **Style custom components** (h1, h2, h3, blockquote, strong)
4. **Layout transformation** (centered 720px reading column)

**Security Checklist:**
- ✅ Use react-markdown (not `dangerouslySetInnerHTML`)
- ✅ Enable remarkGfm for GitHub Flavored Markdown
- ✅ Custom component renderers (no raw HTML)
- ✅ Test with malicious input: `<script>alert('XSS')</script>`

### 4. Feature 5 (Reflections Collection) - Quick Win, Minimal Scope

**Rationale:** 90% complete. Focus on card enhancement + filter polish.

**Scope (4-6 hours):**
- Enhance ReflectionCard: tone badge, snippet display (120 chars)
- Add hover states: lift + glow (CSS transitions)
- Polish header: "Your Reflections" with count
- Test pagination: 20 per page (already implemented)

### 5. Create New tRPC Router for Dashboard Stats

**Recommendation:** Before Feature 2 builder starts, create `server/trpc/routers/usage.ts`

**Endpoint:**
```typescript
export const usageRouter = router({
  getStats: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    
    // Query Supabase for stats
    const thisMonthReflections = await ctx.db
      .from('reflections')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
      .count();
    
    const thisWeekDreams = await ctx.db
      .from('dreams')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfWeek)
      .count();
    
    return {
      thisMonthReflections,
      thisWeekDreams,
      totalReflections: totalCount,
      totalDreams: dreamCount,
    };
  }),
});
```

### 6. Document Markdown Pattern in patterns.md

**Recommendation:** After Feature 4 completes, document react-markdown usage pattern

**Pattern:**
```markdown
## Markdown Rendering Pattern

**Use Case:** Rendering AI responses with rich formatting

**Files:**
- `components/reflections/AIResponseRenderer.tsx`
- `app/reflections/[id]/page.tsx`

**Libraries:**
- `react-markdown` v10.1.0
- `remark-gfm` v4.0.1

**Security:**
- Never use `dangerouslySetInnerHTML` for AI content
- Always use react-markdown with custom component renderers
- Test with malicious input before production

**Example:** [Link to AIResponseRenderer.tsx]
```

---

## Resource Map

### Critical Files for Iteration 2

**Dashboard (Feature 2):**
- `/app/dashboard/page.tsx` (main assembly)
- `components/dashboard/cards/DreamsCard.tsx` (enhance)
- `components/dashboard/cards/ReflectionsCard.tsx` (enhance)
- `components/dashboard/shared/DashboardGrid.tsx` (reuse)
- `components/dashboard/shared/WelcomeSection.tsx` (enhance)

**Reflection Experience (Feature 3):**
- `/app/reflection/MirrorExperience.tsx` (enhance atmosphere)
- `hooks/useStaggerAnimation.ts` (reuse for transitions)
- `components/ui/glass.tsx` (GlassCard, GlowButton, CosmicLoader)

**Individual Reflection (Feature 4):**
- `/app/reflections/[id]/page.tsx` (restructure layout)
- Create: `components/reflections/AIResponseRenderer.tsx`
- Create: `components/reflections/ReflectionDisplay.tsx`

**Reflections Collection (Feature 5):**
- `/app/reflections/page.tsx` (enhance header)
- `components/reflections/ReflectionCard.tsx` (enhance card)
- `components/reflections/ReflectionFilters.tsx` (minor tweaks)
- `components/shared/EmptyState.tsx` (reuse)

### Key Dependencies

**tRPC Routers:**
- `server/trpc/routers/dreams.ts` (Feature 2)
- `server/trpc/routers/reflections.ts` (Features 4, 5)
- `server/trpc/routers/reflection.ts` (Feature 3)
- Create: `server/trpc/routers/usage.ts` (Feature 2 - stats)

**Design System:**
- `styles/variables.css` (spacing, typography, colors)
- `styles/globals.css` (base styles, cosmic theme)
- `styles/dashboard.css` (dashboard-specific styles)
- `components/ui/glass.tsx` (GlassCard, GlowButton, CosmicLoader)

**Hooks:**
- `hooks/useStaggerAnimation.ts` (stagger animations)
- `hooks/useAuth.ts` (user context)
- `hooks/useDashboard.ts` (dashboard refresh)

**Libraries:**
- `react-markdown` v10.1.0 (Feature 4 - markdown parsing)
- `remark-gfm` v4.0.1 (Feature 4 - GitHub Flavored Markdown)
- `framer-motion` v11.18.2 (Features 3, 5 - transitions)

### Testing Infrastructure

**Manual Testing (required for all features):**
- Dashboard: Test with 0 dreams, 1 dream, 3+ dreams (DreamsCard variations)
- Reflection: Test form → loading → output transitions (Feature 3)
- Markdown: Test with headings, bold, lists, blockquotes, malicious input (Feature 4)
- Collection: Test with 0 reflections, 1-19 reflections, 20+ reflections (pagination)

**Browser Testing:**
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile: iOS Safari, Chrome Android

**Accessibility Testing:**
- Keyboard navigation: All interactive elements focusable
- Screen reader: ARIA labels on icons/buttons
- Color contrast: WCAG AA (95% white minimum on dark)

---

## Questions for Planner

### 1. Should Dashboard Show Analytics Graphs or Keep Simple Stats?

**Context:** Vision.md says "This month: X reflections" (simple stats), but could show frequency graph.

**Recommendation:** Simple stats for Iteration 2 (faster, less scope). Graphs in post-MVP.

**Impact:** +4 hours if graphs required (charting library, data processing).

### 2. Do We Want Reflection Reminders in MVP?

**Context:** Vision.md lists "Reflection Reminders" as Should-Have (Post-MVP).

**Recommendation:** No. Focus on in-app experience (Iteration 2 scope).

**Impact:** If included: +8 hours (notification system, email templates, user preferences).

### 3. Should Reflections Have Edit Capability?

**Context:** Vision.md says "preserve integrity of moment" (no edits).

**Recommendation:** No edits. Aligns with sacred reflection philosophy.

**Impact:** If included: +6 hours (edit UI, mutation, optimistic updates).

### 4. What Tone for Evolution Page Empty State - Encouraging or Patient?

**Context:** Vision.md asks: "encouraging or patient?"

**Recommendation:** Patient. "Your evolution story unfolds after 4 reflections" (2/4 progress indicator).

**Impact:** Copy + progress ring component (1 hour).

### 5. Should We Add Reflection Export (PDF/Markdown)?

**Context:** Vision.md lists "Export Reflections" as Should-Have (Post-MVP).

**Recommendation:** No. Post-MVP to gauge user demand.

**Impact:** If included: +10 hours (PDF generation, markdown formatting, download UX).

---

## Architecture Diagrams

### Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Page                          │
│                  (app/dashboard/page.tsx)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Renders
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DashboardGrid                          │
│         (components/dashboard/shared/DashboardGrid.tsx)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Contains
                              ▼
┌───────────────┬───────────────┬───────────────┬─────────────┐
│   UsageCard   │  DreamsCard   │ReflectionsCard│EvolutionCard│
│               │               │               │             │
│ tRPC:         │ tRPC:         │ tRPC:         │ tRPC:       │
│ usage.        │ dreams.list   │ reflections.  │ evolution.  │
│ getStats()    │ (active,      │ list(limit:3) │ latest()    │
│               │  stats=true)  │               │             │
└───────────────┴───────────────┴───────────────┴─────────────┘
                              │
                              │ Data from
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       tRPC Layer                            │
│              (server/trpc/routers/*.ts)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                       │
│         (reflections, dreams, evolution_reports)            │
└─────────────────────────────────────────────────────────────┘
```

### Reflection Experience State Machine

```
┌──────────────────┐
│ Dream Selection  │
│ (no dreamId)     │
└────────┬─────────┘
         │ Select dream
         ▼
┌──────────────────┐
│  Questionnaire   │
│ (dreamId set)    │
│ - 4 Questions    │
│ - Tone selector  │
└────────┬─────────┘
         │ Submit
         ▼
┌──────────────────┐
│   Submitting     │
│ (isSubmitting)   │
│ - CosmicLoader   │
│ - Status text    │
└────────┬─────────┘
         │ Success (tRPC mutation)
         ▼
┌──────────────────┐
│  Output View     │
│ (viewMode='out') │
│ - AI response    │
│ - Metadata       │
└──────────────────┘
```

### Reflection Display Layout (Feature 4 Target)

```
┌─────────────────────────────────────────────────────────────┐
│                  Centered Container (720px)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Dream Badge (purple pill)                          │   │
│  │  "Launch YouTube Channel"                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Date: June 15, 2025 • Tone: Sacred Fusion                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  User's Questions & Answers                         │   │
│  │  (collapsible section)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI Mirror Response (Markdown Rendered)             │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ## Your Journey Unfolds                            │   │
│  │                                                      │   │
│  │  You stand at a **threshold of creation**...        │   │
│  │                                                      │   │
│  │  > "The mirror reflects not what is, but what       │   │
│  │  >  could be if you dare to gaze deeply."           │   │
│  │                                                      │   │
│  │  ### Three Steps Forward:                           │   │
│  │  1. Define your channel's sacred purpose            │   │
│  │  2. Create your first video as ritual               │   │
│  │  3. Share with intention, not expectation           │   │
│  │                                                      │   │
│  │  (18px font, 1.8 line-height, gradient headings)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Back to Reflections]  [Share]  [Download]         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## File & Folder Structure Recommendations

### New Files Needed

**For Feature 2 (Dashboard Richness):**
```
components/dashboard/cards/
  ProgressStatsCard.tsx       ← NEW (monthly/weekly stats)
  
server/trpc/routers/
  usage.ts                    ← NEW (dashboard stats endpoint)
```

**For Feature 3 (Reflection Page Depth):**
```
components/reflection/
  ReflectionQuestionCard.tsx  ← NEW (optional, can stay inline)
  ToneSelectionCard.tsx       ← NEW (optional, can stay inline)
  
styles/
  reflection.css              ← NEW (atmosphere-specific styles)
```

**For Feature 4 (Individual Reflection Display):**
```
components/reflections/
  ReflectionDisplay.tsx       ← NEW (reading layout wrapper)
  AIResponseRenderer.tsx      ← NEW (markdown parser component)
  
styles/
  reflection-display.css      ← NEW (typography, reading width)
```

**For Feature 5 (Reflections Collection):**
```
(No new files - enhance existing)
```

### Directory Structure (Post-Iteration 2)

```
mirror-of-dreams/
├── app/
│   ├── dashboard/
│   │   └── page.tsx                    ← Enhanced (Feature 2)
│   ├── reflection/
│   │   ├── page.tsx                    ← Wrapper
│   │   └── MirrorExperience.tsx        ← Enhanced (Feature 3)
│   └── reflections/
│       ├── page.tsx                    ← Enhanced (Feature 5)
│       └── [id]/page.tsx               ← Transformed (Feature 4)
├── components/
│   ├── dashboard/
│   │   ├── cards/
│   │   │   ├── DreamsCard.tsx          ← Enhanced
│   │   │   ├── ReflectionsCard.tsx     ← Enhanced
│   │   │   ├── ProgressStatsCard.tsx   ← NEW
│   │   │   ├── UsageCard.tsx
│   │   │   ├── EvolutionCard.tsx
│   │   │   ├── VisualizationCard.tsx
│   │   │   └── SubscriptionCard.tsx
│   │   └── shared/
│   │       ├── DashboardGrid.tsx       ← Reused
│   │       ├── WelcomeSection.tsx      ← Enhanced
│   │       └── ...
│   ├── reflections/
│   │   ├── ReflectionCard.tsx          ← Enhanced
│   │   ├── ReflectionFilters.tsx       ← Minor tweaks
│   │   ├── ReflectionDisplay.tsx       ← NEW
│   │   ├── AIResponseRenderer.tsx      ← NEW
│   │   └── FeedbackForm.tsx
│   ├── reflection/
│   │   ├── ReflectionQuestionCard.tsx  ← NEW (optional)
│   │   └── ToneSelectionCard.tsx       ← NEW (optional)
│   └── shared/
│       ├── AppNavigation.tsx
│       ├── CosmicBackground.tsx
│       └── EmptyState.tsx              ← Reused
├── server/trpc/routers/
│   ├── dreams.ts
│   ├── reflections.ts
│   ├── reflection.ts
│   ├── evolution.ts
│   ├── usage.ts                        ← NEW
│   └── _app.ts
├── styles/
│   ├── globals.css
│   ├── variables.css
│   ├── dashboard.css
│   ├── reflection.css                  ← NEW
│   └── reflection-display.css          ← NEW
└── hooks/
    ├── useStaggerAnimation.ts          ← Reused
    ├── useAuth.ts
    └── useDashboard.ts
```

---

## Entry Points and Boundaries

### Page Entry Points

**Dashboard:** `/dashboard` → `app/dashboard/page.tsx`
- **Boundary:** User must be authenticated (redirects to `/auth/signin` if not)
- **Data Dependencies:** dreams, reflections, usage stats
- **Exit Points:** Navigation to `/reflection`, `/dreams`, `/reflections`

**Reflection Experience:** `/reflection` → `app/reflection/page.tsx` → `MirrorExperience.tsx`
- **Boundary:** User must be authenticated
- **URL Params:** `?dreamId={id}` (pre-select dream), `?id={id}` (view output)
- **Exit Points:** Submit → `/reflection?id={reflectionId}` (output view)

**Individual Reflection:** `/reflections/{id}` → `app/reflections/[id]/page.tsx`
- **Boundary:** User must own reflection (403 if not)
- **Data Dependencies:** Single reflection by ID
- **Exit Points:** Back to `/reflections`, Delete → `/reflections`

**Reflections Collection:** `/reflections` → `app/reflections/page.tsx`
- **Boundary:** User must be authenticated
- **URL Params:** `?page={n}`, `?search={query}`, `?tone={tone}`
- **Exit Points:** Click card → `/reflections/{id}`, "New Reflection" → `/reflection`

### Component Boundaries

**DashboardGrid:**
- **Input:** `isLoading` (boolean), `children` (React.ReactNode)
- **Output:** 2x3 responsive grid container
- **Boundary:** Pure presentational, no data fetching

**DashboardCard:**
- **Input:** `isLoading`, `hasError`, `animated`, `animationDelay`, `hoverable`
- **Output:** Card wrapper with loading/error states
- **Boundary:** Each card fetches own data via tRPC

**MirrorExperience:**
- **Input:** URL params (`?dreamId`, `?id`)
- **Output:** Full-screen experience (questionnaire or output)
- **Boundary:** Manages entire reflection creation flow

**ReflectionCard (collection):**
- **Input:** `reflection` object (id, dream, snippet, tone, date)
- **Output:** Clickable card in grid
- **Boundary:** Click → navigates to `/reflections/{id}`

**AIResponseRenderer:**
- **Input:** `aiResponse` (string with markdown)
- **Output:** Formatted markdown with custom components
- **Boundary:** Pure rendering, no mutations

---

## Builder Task Allocation (Recommendations)

### Iteration 2 Builder Breakdown

**Builder-1: Dashboard Richness (10-12 hours)**
- Enhance `/app/dashboard/page.tsx` layout
- Create `ProgressStatsCard.tsx` (monthly/weekly stats)
- Enhance `DreamsCard.tsx` (add metadata: days left, reflection count)
- Enhance `ReflectionsCard.tsx` (add snippets: first 120 chars)
- Create `server/trpc/routers/usage.ts` (stats endpoint)
- Implement visual hierarchy (primary/secondary/tertiary)
- Responsive layout (mobile stacks, desktop 2-3 column)
- Stagger animations (useStaggerAnimation hook)

**Builder-2: Reflection Page Depth (10-14 hours)**
- Enhance `/app/reflection/MirrorExperience.tsx` atmosphere
- Darker background, vignette effect, centered narrow content (800px)
- Add guiding text above each question
- Create progress indicator ("Question 1 of 4")
- Enhance tone selection (visual cards with descriptions)
- Implement smooth transitions (form → loading → output)
- Framer Motion crossfades (300-500ms)
- Mobile: all questions scrollable on one page

**Builder-3: Reflection Display + Collection (10-16 hours)**
- **Part A: Individual Display (6-10 hours)**
  - Restructure `/app/reflections/[id]/page.tsx` layout
  - Create `AIResponseRenderer.tsx` (react-markdown + remarkGfm)
  - Create `ReflectionDisplay.tsx` (reading layout wrapper)
  - Replace `dangerouslySetInnerHTML` with react-markdown
  - Implement centered 720px reading column
  - Style markdown components (h1, h2, h3, blockquote, strong)
  - Add visual accents (cosmic glow, dream badge, gradient headings)
- **Part B: Collection View (4-6 hours)**
  - Enhance `/app/reflections/page.tsx` header
  - Enhance `ReflectionCard.tsx` (tone badge, snippet display)
  - Add hover states (lift + glow)
  - Polish filters (minor tweaks to `ReflectionFilters.tsx`)

**Total Estimated Hours:** 30-42 hours (1.5-2 weeks for 3 builders in parallel)

---

## Success Criteria Validation

### How to Measure Success

**Feature 2: Dashboard Feels Complete (9/10)**
- **Metric:** User says "I know what to do and where I am" immediately
- **Test:** Show dashboard to Ahiya (creator), ask "What's your next action?"
- **Pass:** Clear answer within 5 seconds ("Reflect on [dream]" or "View recent reflection")
- **Validation:** All 6 cards visible, no empty states feel broken

**Feature 3: Reflection Experience is Sacred (10/10)**
- **Metric:** User reports feeling focused and that the process matters
- **Test:** Session time on reflection page (target: 5+ minutes)
- **Pass:** User completes form without distraction, reads AI response fully
- **Validation:** Transitions smooth (no jarring jumps), atmosphere immersive

**Feature 4: Individual Reflections Shine (9/10)**
- **Metric:** User re-reads past reflections and feels connection
- **Test:** Reflection view rates (how often users return to /reflections/[id])
- **Pass:** Time on page >2 minutes, scrolling behavior (reads full response)
- **Validation:** Markdown renders correctly, reading column optimal (720px)

**Feature 5: Reflections Collection Usable (8/10)**
- **Metric:** Users create reflections without confusion
- **Test:** Conversion rate from collection page to /reflection (new reflection)
- **Pass:** >60% of users who view collection page click "New Reflection"
- **Validation:** Filters work, pagination smooth, cards clickable

---

## Limitations & Constraints

### What This Iteration Does NOT Include

**Explicitly Out of Scope (from vision.md):**
- ❌ New features (Dreams, Reflections, Evolution already exist)
- ❌ Backend changes (purely frontend polish)
- ❌ Database migrations
- ❌ Email templates
- ❌ Marketing pages beyond landing
- ❌ Admin dashboard
- ❌ Mobile native apps
- ❌ SEO optimization (separate effort)
- ❌ A/B testing infrastructure
- ❌ Analytics beyond basic tracking
- ❌ Payment/subscription changes
- ❌ Third-party integrations

**Deferred to Post-MVP (Should-Have):**
- Reflection Analytics (patterns over time, frequency graphs)
- Dream Templates (pre-written categories)
- Reflection Reminders (email/in-app notifications)
- Export Reflections (PDF/markdown download)
- Reflection Search (full-text search)
- Tags/Categories (user-defined tags)
- Reflection Streaks (gamification)
- Custom Backgrounds (user preference)

### Technical Constraints

**Performance Budget:**
- LCP (Largest Contentful Paint): <2.5s (currently ~1.8s, must maintain)
- FID (First Input Delay): <100ms (currently ~50ms, must maintain)
- Bundle size: Keep increase <20KB (code splitting required)

**Browser Support:**
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile: iOS Safari 14+, Chrome Android 90+
- No IE11 support

**Accessibility:**
- WCAG 2.1 AA maintained (keyboard nav, screen reader, contrast)
- `prefers-reduced-motion` respected (disable animations except opacity)

**Existing Libraries (no new dependencies if possible):**
- ✅ react-markdown v10.1.0 (already installed)
- ✅ remark-gfm v4.0.1 (already installed)
- ✅ framer-motion v11.18.2 (already installed)

---

## Final Recommendations Summary

### For Planner

1. **Split Feature 2 (Dashboard) into 2 sub-builders** (6 hours each) for parallel execution
2. **Create `usage.ts` tRPC router BEFORE Feature 2 builder starts** (prevents blocking)
3. **Assign Feature 4 + Feature 5 to same builder** (related components, shared patterns)
4. **Prioritize security review for markdown rendering** (XSS risk mitigation)
5. **Document react-markdown pattern in patterns.md** (for future builders)

### For Builders

**Builder-1 (Dashboard):**
- Reuse existing DashboardGrid, WelcomeSection, DashboardCard
- Implement tRPC batched queries (prevent waterfall)
- Focus on visual hierarchy (primary/secondary/tertiary)
- Test with 0 dreams, 1 dream, 3+ dreams (empty state variations)

**Builder-2 (Reflection Page):**
- Enhance atmosphere (darker background, vignette, centered 800px)
- Implement smooth Framer Motion transitions (300-500ms)
- Extract tone selection UI (can stay inline if preferred)
- Test form → loading → output flow (all 3 states smooth)

**Builder-3 (Reflection Display + Collection):**
- **CRITICAL:** Replace `dangerouslySetInnerHTML` with react-markdown
- Create AIResponseRenderer.tsx with custom component renderers
- Test markdown: headings, bold, lists, blockquotes, **malicious input**
- Implement centered 720px reading column (optimal line length)
- Enhance ReflectionCard (tone badge, snippet, hover states)

### For Validation

**Test Checklist:**
- [ ] Dashboard loads <2.5s (LCP budget)
- [ ] All 6 dashboard cards show data (no infinite loading)
- [ ] Reflection form → loading → output transitions smooth (60fps)
- [ ] Markdown renders headings, bold, lists, blockquotes correctly
- [ ] Malicious markdown input (`<script>alert('XSS')</script>`) sanitized
- [ ] Reflections collection filters work (search, tone, sort)
- [ ] Pagination works (20 per page, page numbers, prev/next)
- [ ] Mobile responsive (all features work on 375px width)
- [ ] Keyboard navigation (all interactive elements focusable)
- [ ] Screen reader announces card titles, buttons correctly

---

## Conclusion

Mirror of Dreams has a **robust architectural foundation** ready for Iteration 2's polish. The codebase follows consistent patterns (tRPC queries, DashboardCard wrapper, Framer Motion transitions, CSS custom properties), making enhancements **additive rather than disruptive**.

**Zero breaking changes required.** All four features transform existing components:
- Dashboard: Enhance cards, add stats
- Reflection page: Deepen atmosphere, smooth transitions
- Individual reflection: Parse markdown, center reading column
- Collection view: Polish cards, refine filters

**Critical path:** Markdown security (replace `dangerouslySetInnerHTML`) and dashboard data fetching performance (batched tRPC queries).

**Estimated total effort:** 30-42 hours (3 builders, 1.5-2 weeks parallel execution).

The architecture is ready. The patterns are established. The builders can execute with confidence.

---

**Report Status:** COMPLETE  
**Next Step:** Planner synthesizes this report with Explorer-2, Explorer-3 reports for master iteration plan  
**Builder Readiness:** HIGH (clear scope, existing patterns, minimal unknowns)
