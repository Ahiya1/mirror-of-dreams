# Builder Task Breakdown - Iteration 10

## Overview

**3 primary builders** will work in parallel on 4 features (Dashboard, Reflection Page, Individual Reflection Display, Reflection Collection View).

**Total estimated time:** 24-32 hours builder time, **2 days calendar time** (parallel execution)

**Builder coordination:** Minimal conflicts (each builder owns isolated directories)

---

## Builder Assignment Strategy

### Parallel Execution Groups

**Group 1 (No Dependencies):**
- Builder-1: Dashboard Richness (Feature 2)
- Builder-2: Reflection Page Depth (Feature 3)

**Group 2 (Depends on Group 1):**
- Builder-3: Individual Reflection Display + Collection View (Features 4 + 5)

**Integration:** Sequential merges (Builder-1 → Builder-2 → Builder-3)

---

## Builder-1: Dashboard Richness Transformation

### Scope

Transform dashboard from sparse to rich, motivating hub with:
- Personalized hero section with time-based greeting
- Active dreams grid (up to 3 dreams with metadata)
- Recent reflections preview (last 3 with snippets)
- Progress stats card (monthly reflections count)
- Visual hierarchy (primary → secondary → tertiary)
- Responsive layout (mobile stack, desktop 2-3 column grid)
- Stagger entrance animations

**Feature:** Dashboard Richness Transformation (Feature 2)

---

### Complexity Estimate

**MEDIUM-HIGH**

**Rationale:**
- 7 sections to implement (Hero, Dreams, Reflections, Progress, Evolution, Visualizations, Subscription)
- Data orchestration: 6 tRPC queries must load efficiently
- Visual hierarchy requires design decisions
- Responsive layout across 5 breakpoints

**Recommendation:** Single builder can handle (all patterns exist in codebase)

---

### Success Criteria

- [x] Hero section displays personalized greeting ("Good morning/afternoon/evening, [Name]!")
- [x] "Reflect Now" primary CTA is prominent, cosmic styling, disabled if no dreams
- [x] Active Dreams section shows up to 3 dreams with title, days remaining, reflection count
- [x] Each dream card has "Reflect on this dream" button linking to `/reflection?dreamId={id}`
- [x] Recent Reflections shows last 3 reflections with dream name, snippet (120 chars), time ago
- [x] Click reflection card navigates to `/reflections/{id}`
- [x] Progress Stats card shows "This month: X reflections"
- [x] Evolution insights preview appears if evolution reports exist
- [x] Visual hierarchy clear: Hero (primary) → Dreams/Reflections (secondary) → Stats (tertiary)
- [x] Responsive layout: mobile stacks vertically, desktop 2-3 column grid
- [x] Stagger animation on entrance (150ms delay between sections, 800ms duration)
- [x] Dashboard loads in < 2.5s (LCP budget maintained)
- [x] Empty states inviting: "Create your first dream", "Your first reflection awaits"
- [x] All tRPC queries parallel (no waterfall, TanStack Query batches)

---

### Files to Create

**New Components:**
- `components/dashboard/DashboardHero.tsx` - Hero section with greeting + primary CTA
- `components/dashboard/cards/ProgressStatsCard.tsx` - Monthly reflection stats

**Modified Files:**
- `app/dashboard/page.tsx` - Main dashboard layout with stagger animation
- `components/dashboard/cards/DreamsCard.tsx` - Enhance to show days remaining, reflection count
- `components/dashboard/cards/ReflectionsCard.tsx` - Enhance to show snippets (120 chars)

**Potential New tRPC Endpoint (Optional):**
- `server/trpc/routers/usage.ts` - Dashboard stats endpoint (`getStats` query)

---

### Dependencies

**Depends on:** None (can start immediately)

**Blocks:** None (Builder-2 and Builder-3 work in parallel)

**Data Dependencies:**
- `trpc.dreams.list` (existing query) - Active dreams
- `trpc.reflections.list` (existing query) - Recent reflections
- `trpc.users.getProfile` (existing query) - User name for greeting
- `trpc.evolution.latest` (existing query) - Insights preview
- `trpc.usage.getStats` (NEW, optional) - Monthly reflection count

**If usage.getStats doesn't exist:**
- Alternative: Calculate from `reflections.list` with filter `created_at >= startOfMonth()`
- Backend team creates endpoint (10 minutes)

---

### Implementation Notes

#### Data Orchestration Pattern

**Use self-contained cards (Pattern 1 from patterns.md):**

```typescript
// app/dashboard/page.tsx
const { containerRef, getItemStyles } = useStaggerAnimation(6, {
  delay: 150,
  duration: 800,
  triggerOnce: true,
});

return (
  <div ref={containerRef} className="space-y-2xl">
    <div style={getItemStyles(0)}>
      <DashboardHero />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      <div style={getItemStyles(1)}><DreamsCard /></div>
      <div style={getItemStyles(2)}><ReflectionsCard /></div>
      <div style={getItemStyles(3)}><ProgressStatsCard /></div>
      {/* ... */}
    </div>
  </div>
);
```

**Each card fetches own data:**
```typescript
const DreamsCard = () => {
  const { data, isLoading } = trpc.dreams.list.useQuery({
    status: 'active',
    includeStats: true,
  });

  if (isLoading) return <DashboardCard isLoading />;
  // ...
};
```

**Benefit:** TanStack Query batches concurrent queries, preventing waterfall.

#### Empty State Handling

**Dashboard with no dreams:**
```typescript
if (!dreams || dreams.length === 0) {
  return (
    <EmptyState
      icon="✨"
      title="Create your first dream to begin your journey"
      description="Dreams are the seeds of transformation. Start by defining what you want to manifest."
      ctaText="Create Dream"
      ctaHref="/dreams/new"
    />
  );
}
```

**Recent Reflections with no reflections:**
```typescript
if (!reflections || reflections.length === 0) {
  return (
    <EmptyState
      icon="🪞"
      title="Your first reflection awaits"
      description="Reflection is how you water your dreams. Begin your journey of self-discovery."
      ctaText="Reflect Now"
      ctaHref="/reflection"
    />
  );
}
```

#### Visual Hierarchy

**Primary (Hero Section):**
- Largest text: h1 (48px) with gradient
- Primary CTA: GlowButton variant="cosmic" size="lg"
- Centered layout

**Secondary (Dreams/Reflections):**
- Medium text: h3 (24px)
- Hover states: lift + glow
- Grid layout

**Tertiary (Stats):**
- Smaller text: body (18px)
- Muted colors: text-white/60
- Single column

#### Responsive Breakpoints

**Mobile (< 768px):**
- Single column stack
- Full-width cards
- Hero text scales down 20% (h1: 38px)

**Tablet (768px - 1024px):**
- 2 column grid
- Hero section full-width

**Desktop (> 1024px):**
- 3 column grid
- Hero section full-width
- Some cards span 2 columns (Evolution)

---

### Patterns to Follow

**From patterns.md:**
- **Pattern 1:** Self-Contained Dashboard Card (parallel tRPC queries)
- **Pattern 2:** Dashboard Grid with Stagger Animation (useStaggerAnimation hook)
- **Pattern 3:** Dashboard Hero with Time-Based Greeting (getTimeOfDay utility)

**Key conventions:**
- Use DashboardCard wrapper for all cards
- Handle loading, error, empty, success states
- Limit displays to 3 items with "View All" links
- Apply spacing scale: --space-lg (24px) gap, --space-2xl (48px) sections

---

### Testing Requirements

**Manual Testing:**
1. **Empty state:** User with 0 dreams, 0 reflections
   - Dashboard shows inviting empty states
   - "Reflect Now" button disabled with explanation

2. **Partial state:** User with 1 dream, 3 reflections
   - Dreams card shows 1 dream with metadata
   - Reflections card shows 3 reflections with snippets
   - Progress stats show accurate count

3. **Full state:** User with 3+ dreams, 20+ reflections
   - Dreams card shows 3 dreams (with "View All" link)
   - Reflections card shows 3 most recent
   - Evolution preview shows if available

**Performance Testing:**
- Measure LCP (Largest Contentful Paint): target < 2.5s
- Check Network tab: 6 queries should batch (not waterfall)
- Lighthouse score: maintain 90+ performance

**Responsive Testing:**
- Test at 375px, 768px, 1024px, 1440px, 1920px
- All sections stack/grid correctly
- Text scales appropriately

**Accessibility Testing:**
- Keyboard navigation: Tab through all interactive elements
- Screen reader: "Reflect Now" announces correctly
- Focus indicators visible (2px outline)

---

### Potential Split Strategy

**If complexity proves too high, split into 2 sub-builders:**

**Foundation (Builder-1A: 6 hours):**
- Create DashboardHero component
- Enhance DreamsCard (metadata: days remaining, reflection count)
- Enhance ReflectionsCard (snippets: first 120 chars)
- Implement stagger animation

**Polish (Builder-1B: 6 hours):**
- Create ProgressStatsCard
- Add Evolution insights preview
- Implement visual hierarchy (CSS)
- Responsive layout adjustments
- Empty state polish

**Integration:** Builder-1A completes, Builder-1B builds on top (sequential, not parallel)

---

## Builder-2: Reflection Page Depth & Immersion

### Scope

Enhance reflection experience to feel sacred, focused, and intentional:
- Darker, more focused visual atmosphere (background vignette, centered 800px content)
- Progress indicator showing "Question 1 of 4" visual steps
- Guiding text above each question
- Tone selection as visual cards (not plain buttons) with descriptions
- "Gaze into the Mirror" submit button with cosmic styling
- Smooth state transitions: form → loading → output (300-500ms crossfades)
- Status text updates during loading ("Gazing into the mirror..." → "Crafting your insight...")
- Mobile: all questions on one scrollable page

**Feature:** Reflection Page Depth & Immersion (Feature 3)

---

### Complexity Estimate

**MEDIUM**

**Rationale:**
- Existing MirrorExperience component already 80% complete
- Primarily visual enhancements (CSS, animations)
- State transitions using Framer Motion (existing pattern)
- No new data fetching (uses existing reflection.create mutation)

**Recommendation:** Single builder can handle (1.5 days)

---

### Success Criteria

- [x] Visual atmosphere: darker background (bg-slate-950 or darker), subtle vignette effect
- [x] Content centered, narrow (800px max-width)
- [x] Progress indicator: 4 dots/bars showing current question (1 of 4, 2 of 4, etc.)
- [x] Guiding text above each question: "Take a moment to describe your dream..."
- [x] Character counters subtle (bottom-right of textarea)
- [x] Tone selection: visual cards (not buttons) with icon, label, description
- [x] Selected tone card highlighted (border-mirror-purple, bg-mirror-purple/10)
- [x] Submit button: "Gaze into the Mirror" central, GlowButton variant="cosmic" size="lg"
- [x] Form → Loading transition: smooth fade out (300ms), cosmic loader expands
- [x] Loading state: CosmicLoader with status text, breathing animation
- [x] Status text updates: "Gazing..." (0-3s) → "Crafting..." (3s+)
- [x] Loading → Output transition: fade out loader, fade in reflection content (500ms)
- [x] Mobile: all 4 questions visible on one scrollable page (no pagination)
- [x] Textarea inputs sized for mobile typing (min-height: 120px)
- [x] Tone cards stack vertically on mobile

---

### Files to Create

**New Components (Optional):**
- `components/reflection/ReflectionQuestionCard.tsx` - Question wrapper with guiding text (can stay inline)
- `components/reflection/ToneSelectionCard.tsx` - Tone card UI (can stay inline)

**New Styles:**
- `styles/reflection.css` - Atmosphere-specific styles (vignette, darker background)

**Modified Files:**
- `app/reflection/MirrorExperience.tsx` - Enhance atmosphere, add progress indicator, smooth transitions

---

### Dependencies

**Depends on:** None (can start in parallel with Builder-1)

**Blocks:** None

**Data Dependencies:**
- `trpc.dreams.list` (existing query) - Pre-select dream
- `trpc.reflection.create` (existing mutation) - Submit reflection

---

### Implementation Notes

#### Visual Atmosphere

**Darker background with vignette:**
```css
/* styles/reflection.css */
.reflection-experience {
  background: radial-gradient(
    ellipse at center,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(2, 6, 23, 1) 100%
  );
  min-height: 100vh;
}

.reflection-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl);
}
```

**Centered narrow content:**
```typescript
<div className="reflection-experience">
  <div className="reflection-form-container">
    {/* Form content */}
  </div>
</div>
```

#### Progress Indicator

**Visual steps pattern:**
```typescript
const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  return (
    <div className="flex items-center justify-center gap-sm mb-2xl">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current
              ? 'w-12 bg-mirror-purple'
              : 'w-8 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
};

// Usage
<ProgressIndicator current={currentQuestion} total={4} />
```

#### State Transitions

**Form → Loading → Output (Pattern 4 from patterns.md):**
```typescript
type ReflectionState = 'form' | 'loading' | 'output';

const [state, setState] = useState<ReflectionState>('form');
const [statusText, setStatusText] = useState('Gazing into the mirror...');

const handleSubmit = () => {
  setState('loading');

  // Update status after 3s
  setTimeout(() => {
    setStatusText('Crafting your insight...');
  }, 3000);

  createReflection.mutate(formData, {
    onSuccess: () => {
      setStatusText('Reflection complete!');
      setTimeout(() => setState('output'), 1000);
    },
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
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
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
  </AnimatePresence>
);
```

#### Tone Selection Cards (Pattern 5 from patterns.md)

**Use visual cards with descriptions:**
```typescript
const TONE_OPTIONS = [
  { value: 'gentle', label: 'Gentle', description: 'Compassionate, nurturing guidance', icon: '🌸' },
  { value: 'intense', label: 'Intense', description: 'Direct, challenging insights', icon: '⚡' },
  { value: 'fusion', label: 'Sacred Fusion', description: 'Balanced wisdom and truth', icon: '✨' },
];

<div className="grid grid-cols-1 md:grid-cols-3 gap-md">
  {TONE_OPTIONS.map(option => (
    <button
      key={option.value}
      onClick={() => setSelectedTone(option.value)}
      className={`p-lg rounded-xl border-2 transition-all ${
        selectedTone === option.value
          ? 'border-mirror-purple bg-mirror-purple/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      <div className="text-4xl mb-md">{option.icon}</div>
      <h4 className="font-semibold mb-sm">{option.label}</h4>
      <p className="text-sm text-white/60">{option.description}</p>
    </button>
  ))}
</div>
```

---

### Patterns to Follow

**From patterns.md:**
- **Pattern 4:** Reflection State Transitions (form → loading → output)
- **Pattern 5:** Tone Selection Cards (visual cards with descriptions)

**Key conventions:**
- Use AnimatePresence with `mode="wait"` for state transitions
- Respect `useReducedMotion()` hook
- Apply 800px max-width for form container
- Use GlowButton variant="cosmic" for submit

---

### Testing Requirements

**Manual Testing:**
1. **Form validation:**
   - Submit with empty fields → shows validation errors
   - Character counters update as user types

2. **State transitions:**
   - Form → Loading: smooth fade out, loader appears
   - Status text updates after 3 seconds
   - Loading → Output: smooth fade in

3. **Tone selection:**
   - Click each tone card → visual feedback (border, background)
   - Selected state persists during form editing

4. **Mobile:**
   - All 4 questions visible on one scrollable page
   - Tone cards stack vertically
   - Inputs sized appropriately (min-height: 120px)

**Performance Testing:**
- Animations at 60fps (Chrome DevTools Performance tab)
- Transition timing feels smooth (300-500ms)
- Reduced motion respected (`prefers-reduced-motion: reduce`)

**Accessibility Testing:**
- Keyboard navigation through form fields
- Focus indicators visible on all inputs
- Submit button keyboard-accessible (Enter key)

---

### Potential Split Strategy

**Not recommended** - Complexity is manageable for single builder.

If needed:
- **Foundation:** Visual atmosphere + progress indicator (3 hours)
- **Polish:** Tone cards + state transitions (4 hours)

---

## Builder-3: Individual Reflection Display + Collection View

### Scope

Two related features in same directory (`app/reflections/`):

**Part A: Individual Reflection Display Enhancement (Feature 4)**
- Centered reading column (720px max-width)
- Markdown parsing with react-markdown + remark-gfm
- Custom component styling (gradient headings, styled blockquotes, proper lists)
- Dream badge at top
- Metadata display (date, tone)
- Typography optimization (18px body, line-height 1.8)
- Visual accents (cosmic glow on AI container)
- Back navigation button

**Part B: Reflection Page Collection View (Feature 5)**
- Header with "Your Reflections" + count
- Dream filter dropdown ("All dreams" or specific dream)
- Sort options (most recent, oldest)
- Enhanced reflection cards (tone badge, snippet, hover states)
- Empty state ("Your reflection journey begins here")
- Pagination (20 per page)

---

### Complexity Estimate

**MEDIUM (Part A + Part B combined)**

**Rationale:**
- Part A: Copy Evolution page markdown pattern (proven code)
- Part B: Existing reflections page 90% complete (minor enhancements)
- Security critical: Replace `dangerouslySetInnerHTML` with react-markdown
- Both features in same directory (tight coupling)

**Recommendation:** Single builder handles both (tightly coupled, shared patterns)

---

### Success Criteria

**Part A: Individual Reflection Display**
- [x] Layout uses centered 720px reading column
- [x] Markdown parsing implemented with react-markdown + remark-gfm
- [x] `dangerouslySetInnerHTML` replaced (security fix)
- [x] AI response formatted: gradient headings (h1, h2), styled blockquotes, proper lists
- [x] Dream badge displayed at top (purple pill with dream title)
- [x] Metadata clear: date formatted ("November 28, 2025"), tone ("Gentle" / "Intense" / "Fusion")
- [x] Typography readable: 18px body, line-height 1.8, proper heading hierarchy
- [x] Visual accents: cosmic glow on AI container (bg-gradient, border-mirror-purple)
- [x] User's questions/answers collapsible (details/summary element)
- [x] Back button to `/reflections` (GlowButton variant="ghost")
- [x] XSS security validated: malicious markdown (`<script>alert('XSS')</script>`) sanitized

**Part B: Reflection Collection View**
- [x] Header shows "Your Reflections" with count (e.g., "Your Reflections (12)")
- [x] Filter dropdown: "All dreams" or specific dream (fetches user's dreams)
- [x] Sort dropdown: "Most recent", "Oldest first"
- [x] Reflection cards show: dream badge, date (relative time), snippet (120 chars), tone indicator
- [x] Click card navigates to `/reflections/[id]`
- [x] Hover states smooth: lift (-translate-y-1) + glow (shadow-mirror-purple)
- [x] Empty state: "Your reflection journey begins here" + "Create your first reflection" CTA
- [x] Pagination works: 20 per page, page numbers or "Load More" button
- [x] Responsive: desktop 2-3 column grid, mobile single column

---

### Files to Create

**New Components:**
- `components/reflections/AIResponseRenderer.tsx` - Markdown renderer (Pattern 6 from patterns.md)
- `components/reflections/ReflectionDisplay.tsx` - Reading layout wrapper (optional, can inline)

**Modified Files:**
- `app/reflections/[id]/page.tsx` - Individual reflection display (restructure, add markdown)
- `app/reflections/page.tsx` - Collection view (add dream filter, enhance cards)
- `components/reflections/ReflectionCard.tsx` - Enhance card design (tone badge, snippet, hover states)
- `components/reflections/ReflectionFilters.tsx` - Add dream filter dropdown

---

### Dependencies

**Depends on:** None (can start in parallel with Builder-1 and Builder-2)

**Blocks:** None

**Data Dependencies:**
- `trpc.reflections.getById` (existing query) - Individual reflection
- `trpc.reflections.list` (existing query) - Collection view with pagination, filtering
- `trpc.dreams.list` (existing query) - Dream filter dropdown

**Potential tRPC Enhancement (Optional):**
- Add `dreamId` filter to `reflections.list` input schema (if not already exists)

---

### Implementation Notes

#### Part A: Markdown Rendering Security

**CRITICAL: Replace dangerouslySetInnerHTML (Line 229 in app/reflections/[id]/page.tsx)**

**Current (UNSAFE):**
```typescript
<div dangerouslySetInnerHTML={{ __html: reflection.aiResponse }} />
```

**New (SAFE) - Pattern 6 from patterns.md:**
```typescript
import { AIResponseRenderer } from '@/components/reflections/AIResponseRenderer';

<AIResponseRenderer content={reflection.aiResponse} />
```

**AIResponseRenderer implementation:**
```typescript
// components/reflections/AIResponseRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientText } from '@/components/ui/glass/GradientText';

export const AIResponseRenderer: React.FC<{ content: string }> = ({ content }) => {
  const hasMarkdown = /^#{1,3}\s|^\*\s|^-\s|^>\s|```/.test(content);

  // Fallback for plain text
  if (!hasMarkdown) {
    return (
      <div className="max-w-[720px] mx-auto">
        {content.split('\n\n').map((para, i) => (
          <p key={i} className="text-body leading-relaxed text-white/95 mb-md">
            {para}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
          p: ({ node, ...props }) => (
            <p className="text-body leading-relaxed text-white/95 mb-md">
              {props.children}
            </p>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-mirror-amethyst/60 pl-lg py-md my-lg bg-mirror-amethyst/5 rounded-r-lg">
              {props.children}
            </blockquote>
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-md space-y-sm text-white/90">
              {props.children}
            </ul>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

**Copy from Evolution page:** `app/evolution/[id]/page.tsx` lines 96-171 (proven pattern)

#### Part A: Reading Column Layout

**Centered 720px container (Pattern 7 from patterns.md):**
```typescript
<div className="container mx-auto px-lg py-2xl max-w-screen-md">
  {/* Dream badge */}
  <div className="mb-md">
    <span className="inline-block px-md py-sm bg-mirror-purple/20 border border-mirror-purple/40 rounded-full text-sm text-mirror-purple">
      {reflection.dream.title}
    </span>
  </div>

  {/* Metadata */}
  <div className="flex items-center gap-lg text-sm text-white/40 mb-2xl">
    <span>{formatDate(reflection.createdAt)}</span>
    <span>•</span>
    <span className="capitalize">{reflection.tone}</span>
  </div>

  {/* User's answers (collapsible) */}
  <details className="mb-2xl">
    <summary className="cursor-pointer text-body font-medium text-white/80 mb-md">
      Your original answers
    </summary>
    {/* ... */}
  </details>

  {/* AI response */}
  <div className="bg-gradient-to-br from-mirror-purple/10 to-mirror-violet/10 rounded-2xl p-xl border border-mirror-purple/20">
    <h2 className="text-h2 mb-xl">Your Mirror's Reflection</h2>
    <AIResponseRenderer content={reflection.aiResponse} />
  </div>
</div>
```

#### Part B: Dream Filter Dropdown

**Add to ReflectionFilters component (Pattern 9 from patterns.md):**
```typescript
// Fetch user's dreams
const { data: dreams } = trpc.dreams.list.useQuery({ status: 'active' });

<select
  value={filters.dreamId || ''}
  onChange={(e) => handleFilterUpdate({ dreamId: e.target.value || undefined })}
  className="px-md py-sm bg-white/5 border border-white/10 rounded-lg"
>
  <option value="">All dreams</option>
  {dreams?.map(dream => (
    <option key={dream.id} value={dream.id}>
      {dream.title}
    </option>
  ))}
</select>
```

**Update tRPC query:**
```typescript
const { data: reflections } = trpc.reflections.list.useQuery({
  page: currentPage,
  limit: 20,
  dreamId: filters.dreamId, // Add dream filter
  tone: filters.tone,
  sortBy: filters.sortBy,
  sortOrder: filters.sortOrder,
});
```

#### Part B: Reflection Card Enhancements

**Add tone badge, snippet, hover states (Pattern 8 from patterns.md):**
```typescript
<Link href={`/reflections/${reflection.id}`}>
  <div className="group bg-white/5 rounded-xl p-lg border border-white/10 transition-all hover:bg-white/10 hover:border-mirror-purple/40 hover:shadow-lg hover:shadow-mirror-purple/20 hover:-translate-y-1">
    {/* Dream badge */}
    <span className="inline-block px-sm py-xs bg-mirror-purple/20 rounded-full text-xs text-mirror-purple">
      {reflection.dream.title}
    </span>

    {/* Date + tone */}
    <div className="flex items-center gap-md text-xs text-white/40 mt-md">
      <span>{formatRelativeTime(reflection.createdAt)}</span>
      <span>•</span>
      <span className="px-sm py-xs rounded bg-purple-500/20 text-purple-400">
        {reflection.tone}
      </span>
    </div>

    {/* Snippet */}
    <p className="text-sm text-white/80 line-clamp-3 mt-md">
      {reflection.aiResponse.substring(0, 120)}...
    </p>

    {/* Read more (appears on hover) */}
    <div className="mt-md text-sm text-mirror-purple opacity-0 group-hover:opacity-100 transition-opacity">
      Read full reflection →
    </div>
  </div>
</Link>
```

---

### Patterns to Follow

**From patterns.md:**
- **Pattern 6:** Safe Markdown Rendering (react-markdown with custom components)
- **Pattern 7:** Individual Reflection Display Layout (centered 720px, metadata, collapsible)
- **Pattern 8:** Reflection Card with Hover States (lift + glow)
- **Pattern 9:** Reflections Filter with Dream Dropdown (controlled components)

**Key conventions:**
- Use 720px max-width for reading column (optimal line length)
- 18px body text, line-height 1.8 for readability
- Gradient text on headings (GradientText component)
- Respect spacing scale (--space-md, --space-lg, --space-xl)

---

### Testing Requirements

**Part A: Individual Reflection Display**

1. **Markdown rendering:**
   - Test with heading: `# Heading` → renders as GradientText h1
   - Test with list: `- Item 1\n- Item 2` → renders as styled ul
   - Test with blockquote: `> Quote` → renders with cosmic accent
   - Test with bold: `**bold**` → renders as gradient strong

2. **XSS security:**
   - Inject malicious markdown: `<script>alert('XSS')</script>`
   - Expected: Renders as plain text, no script execution
   - Inject image XSS: `<img src="x" onerror="alert('XSS')">`
   - Expected: Sanitized, no onerror execution

3. **Fallback for plain text:**
   - Reflection with no markdown (plain text paragraphs)
   - Expected: Wrapped in `<p>` tags with proper spacing

4. **Responsive:**
   - Test at 375px, 768px, 1024px
   - Reading column centers correctly
   - Text remains readable (no overflow)

**Part B: Reflection Collection View**

1. **Filtering:**
   - Select dream from dropdown → only shows reflections for that dream
   - Change sort order → reflections re-order correctly
   - Clear filters → shows all reflections

2. **Pagination:**
   - User with < 20 reflections → no pagination shown
   - User with 20+ reflections → page numbers or "Load More" appears
   - Navigate to page 2 → shows next 20 reflections

3. **Empty state:**
   - User with 0 reflections → shows inviting empty state
   - Empty state CTA links to `/reflection`

4. **Hover states:**
   - Hover over reflection card → lifts and glows
   - Animation smooth (60fps)

**Accessibility Testing:**
- Keyboard navigation through reflection cards
- Screen reader announces card titles
- Filter dropdowns keyboard-accessible

---

### Potential Split Strategy

**If complexity proves too high (10-14 hours is upper limit):**

**Part A: Individual Display (Builder-3A: 6-8 hours):**
- Create AIResponseRenderer.tsx
- Replace dangerouslySetInnerHTML in [id]/page.tsx
- Implement centered reading layout
- Test markdown rendering + XSS security

**Part B: Collection View (Builder-3B: 4-6 hours):**
- Add dream filter dropdown to ReflectionFilters.tsx
- Enhance ReflectionCard with tone badge, snippet, hover states
- Test filtering, pagination, responsive layout

**Integration:** Builder-3A completes first (blocking), Builder-3B builds on top (sequential)

---

## Builder Execution Order

### Parallel Group 1 (No Dependencies)
- **Builder-1** (Dashboard)
- **Builder-2** (Reflection Page)
- **Builder-3** (Reflection Display + Collection)

**All 3 builders can start simultaneously.**

### Integration Phase (Sequential Merges)

**Step 1:** Builder-1 merges dashboard changes
- **Files:** `app/dashboard/page.tsx`, `components/dashboard/cards/*`
- **Test:** Dashboard loads, all cards display, stagger animation works

**Step 2:** Builder-2 merges reflection page changes
- **Files:** `app/reflection/MirrorExperience.tsx`, `styles/reflection.css`
- **Test:** Reflection form → loading → output transitions smooth

**Step 3:** Builder-3 merges reflection display + collection changes
- **Files:** `app/reflections/[id]/page.tsx`, `app/reflections/page.tsx`, `components/reflections/*`
- **Test:** Individual reflection displays correctly, collection filters work

**Step 4:** Final smoke test
- Test all 3 user flows: Dashboard → Reflection → Individual Display
- Verify no regressions in existing features

---

## Integration Notes

### Shared Files (Potential Conflicts)

**None** - All builders work in isolated directories:
- Builder-1: `app/dashboard/`, `components/dashboard/`
- Builder-2: `app/reflection/`, `styles/reflection.css`
- Builder-3: `app/reflections/`, `components/reflections/`

### Shared Components (Read-Only)

**Used by multiple builders:**
- `components/ui/glass/GlassCard.tsx` (Builder-1, Builder-2, Builder-3)
- `components/ui/glass/GlowButton.tsx` (Builder-1, Builder-2, Builder-3)
- `components/ui/glass/GradientText.tsx` (Builder-1, Builder-3)
- `components/ui/glass/CosmicLoader.tsx` (Builder-2)

**Strategy:** Builders use existing components (no modifications)

### Conflict Prevention

**Git Strategy:**
- Each builder creates feature branch: `iteration-10-builder-1`, `iteration-10-builder-2`, `iteration-10-builder-3`
- Merge order: Builder-1 → Builder-2 → Builder-3
- Resolve conflicts during merge (minimal expected)

---

## Estimated Timeline

### Builder Hours (Parallel Execution)

**Builder-1 (Dashboard):** 8-10 hours
- DashboardHero: 2 hours
- DreamsCard enhancement: 2 hours
- ReflectionsCard enhancement: 2 hours
- ProgressStatsCard: 1.5 hours
- Layout + stagger animation: 1.5 hours
- Testing: 1 hour

**Builder-2 (Reflection Page):** 6-8 hours
- Visual atmosphere (CSS): 1.5 hours
- Progress indicator: 1 hour
- Tone selection cards: 2 hours
- State transitions: 2 hours
- Testing: 1.5 hours

**Builder-3 (Reflection Display + Collection):** 10-14 hours
- AIResponseRenderer: 3 hours
- Individual display layout: 3 hours
- Dream filter dropdown: 2 hours
- ReflectionCard enhancements: 2 hours
- Testing (XSS, markdown, filtering): 2-4 hours

**Total Builder Hours:** 24-32 hours

### Calendar Time (Parallel Execution)

**Day 1:**
- All 3 builders start
- Builder-2 finishes first (6-8 hours)
- Builder-1 finishes second (8-10 hours)

**Day 2:**
- Builder-3 continues (10-14 hours total, 4-6 hours remaining)
- Integration phase (30 minutes)
- Final testing (2 hours)

**Total Calendar Time:** 2 days (assumes 8-hour workdays)

---

## Validation Checklist

Before marking iteration complete:

**Functionality:**
- [x] Dashboard displays all 6 sections (Hero, Dreams, Reflections, Progress, Evolution, Visualizations)
- [x] Reflection form → loading → output transitions smooth
- [x] Individual reflection displays markdown correctly
- [x] Reflection collection filters by dream, sorts correctly

**Performance:**
- [x] Dashboard LCP < 2.5s (Lighthouse CI)
- [x] FID < 100ms (Chrome DevTools)
- [x] Animations at 60fps (Performance profiling)

**Security:**
- [x] XSS test passed: `<script>alert('XSS')</script>` in reflection → sanitized
- [x] No `dangerouslySetInnerHTML` usage for AI content

**Accessibility:**
- [x] Keyboard navigation works (all interactive elements focusable)
- [x] Screen reader announces cards, buttons correctly
- [x] Color contrast WCAG AA (automated checks)
- [x] `prefers-reduced-motion` respected

**Responsive:**
- [x] All pages tested at 375px, 768px, 1024px, 1440px
- [x] Dashboard grid stacks correctly on mobile
- [x] Reflection form scrollable on mobile
- [x] Reading column centers on all screen sizes

**Cross-Browser:**
- [x] Chrome (primary)
- [x] Firefox
- [x] Safari
- [x] Edge

---

**Builder Task Status:** COMPREHENSIVE
**Total Builders:** 3 (parallel execution)
**Estimated Time:** 24-32 hours builder time, 2 days calendar time
**Risk Level:** LOW (clear tasks, proven patterns, minimal conflicts)
**Integration Strategy:** Sequential merges (Builder-1 → Builder-2 → Builder-3)
