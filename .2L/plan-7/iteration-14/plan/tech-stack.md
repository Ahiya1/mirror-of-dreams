# Technology Stack - Plan-7 Iteration 14

## Core Framework

**Decision:** Next.js 14 (App Router) - ALREADY IN USE

**Rationale:**
- Established in Plan-6, proven stable and performant
- No changes needed to framework
- Leverages existing patterns (Server Components, tRPC integration)

**Alternatives Considered:** None - framework decision already made

---

## Styling & Design System

**Decision:** Tailwind CSS 3.4 + Custom Mirror Theme - ALREADY IN USE

**Rationale:**
- Extensive cosmic theme already configured (`mirror-*`, `cosmic-*` color classes)
- Purple, gold, and amethyst gradients match brand identity
- No new color variables needed for iteration 14
- Utility-first approach proven fast and maintainable

**Custom Colors Available:**
```javascript
// Purple layers (primary)
mirror-amethyst: #7c3aed
mirror-amethyst-bright: #9333ea
mirror-purple: Alias for primary

// Gold accents (warmth)
mirror-warning: #fbbf24 (used for character counter)
mirror-gold-ambient: rgba(251, 191, 36, 0.05)

// Semantic colors
mirror-success: #34d399
mirror-error: #f87171 (avoid using for warnings)
```

**Character Counter Color Progression:**
- 0-50%: `text-white/70` (encouraging to write more)
- 50-90%: `text-amber-400` (gold, celebrating depth)
- 90-100%: `text-purple-400` (almost there!)
- NO red warnings (avoid punitive UX)

**Recommendation:** Continue using existing classes, no custom CSS needed for iteration 14.

---

## Animation System

**Decision:** Framer Motion 11.18.2 - ALREADY IN USE

**Rationale:**
- Comprehensive variant library in `/lib/animations/variants.ts` (332 lines)
- Reduced motion support built-in (`useReducedMotion` hook)
- Proven patterns: card hover, input focus, character counter color shifts
- Zero scale animations (Plan-6 policy: restrained, elegant)

**Existing Variants to Leverage:**
```typescript
// Character counter color shift (extend for word counter)
characterCounterVariants: {
  safe: { color: 'rgba(255, 255, 255, 0.7)' },
  warning: { color: '#fbbf24' },  // GOLD
  danger: { color: '#f87171' },   // Change to purple
}

// Card hover (subtle lift, no scale)
cardVariants: {
  hover: { y: -2, transition: { duration: 0.25 } }
}

// Input focus glow
inputFocusVariants: {
  focus: { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }
}
```

**New Variants Needed:**
- Update `characterCounterVariants.danger` to use purple instead of red
- Add `toneHoverVariants` for tone selection card glow

**Reduced Motion Pattern:**
```typescript
const prefersReducedMotion = useReducedMotion();

<motion.div
  variants={prefersReducedMotion ? undefined : cardVariants}
  animate={prefersReducedMotion ? false : 'hover'}
>
```

**Recommendation:** Extend existing variants, maintain accessibility-first approach.

---

## Markdown Rendering

**Decision:** react-markdown 10.1.0 + remark-gfm 4.0.1 - ALREADY IN USE

**Rationale:**
- XSS-safe by default (no dangerouslySetInnerHTML)
- Proven in production (Evolution page, individual reflections)
- Custom component mapping allows cosmic theme styling
- GitHub-flavored markdown support (tables, strikethrough)

**Current Implementation:** `/components/reflections/AIResponseRenderer.tsx`

**Iteration 14 Enhancements:**
```typescript
// Change <strong> from purple to gold
strong: ({ node, ...props }) => (
  <strong className="font-semibold text-amber-400 bg-amber-400/10 px-1 rounded" {...props} />
)

// Larger first paragraph (detect via :first-child CSS)
p: ({ node, ...props }) => (
  <p className="text-lg leading-[1.8] text-white/95 mb-4 first:text-xl first:text-white" {...props} />
)
```

**Security:** No changes to security model, react-markdown continues to sanitize.

**Recommendation:** Extend custom components, no library changes needed.

---

## Date & Time Handling

**Decision:** Native JavaScript (Intl.DateTimeFormat) - NO LIBRARY

**Rationale:**
- Zero dependencies, lightweight
- Already working well (`formatDate`, `timeAgo` utilities in `/lib/utils.ts`)
- Locale-aware for future internationalization
- Covers 100% of iteration 14 needs

**Utilities Available:**
```typescript
// Full date: "November 28, 2025"
formatDate(date: string | Date): string

// Relative: "3 days ago"
timeAgo(date: string | Date): string
```

**Iteration 14 Addition:**
```typescript
// Ordinal suffix: "November 28th, 2025"
formatDateWithOrdinal(date: string | Date): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));

  const day = new Date(date).getDate();
  const ordinal = getOrdinalSuffix(day); // "st", "nd", "rd", "th"

  return formatted.replace(/\d+/, `${day}${ordinal}`);
}
```

**Recommendation:** Add ordinal suffix helper, no external library needed (moment.js, date-fns overkill).

---

## State Management

**Decision:** React useState (Local Component State) - SIMPLE

**Rationale:**
- Filters, modals, UI state all local to pages
- No global state needed (reflection form state ephemeral)
- Proven pattern in reflection filters (simple, predictable)
- No Zustand, Redux, or complex state management needed

**Pattern Example:**
```typescript
// Page manages filter state locally
const [filters, setFilters] = useState({
  search: '',
  tone: undefined,
  dateRange: 'all',
});

// Pass to tRPC query
const { data } = trpc.reflections.list.useQuery({ ...filters, page, limit: 20 });
```

**Recommendation:** Continue local state pattern, no new dependencies.

---

## Form Handling

**Decision:** Native React (Controlled Components) - NO LIBRARY

**Rationale:**
- Reflection form already works well with controlled inputs
- GlassInput component handles validation states
- No complex multi-step wizard (single-page form)
- React Hook Form or Formik unnecessary complexity

**Pattern:**
```typescript
const [formData, setFormData] = useState({ dream: '', plan: '', ... });

<GlassInput
  value={formData.dream}
  onChange={(value) => setFormData(prev => ({ ...prev, dream: value }))}
  error={errors.dream}
/>
```

**Recommendation:** Keep existing pattern, no library needed.

---

## Collapsible UI

**Decision:** Native HTML5 `<details>/<summary>` - ZERO DEPENDENCIES

**Rationale:**
- Already implemented in individual reflection page
- Accessible by default (keyboard navigation, screen readers)
- No JavaScript state needed
- Semantic HTML5

**Pattern:**
```typescript
<details className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6">
  <summary className="cursor-pointer text-lg font-medium text-white/90">
    Show Your Original Reflection
  </summary>
  <div className="mt-6">
    {/* Collapsible content */}
  </div>
</details>
```

**CSS Enhancement (Optional):**
```css
/* Rotate arrow on open */
details[open] > summary svg {
  transform: rotate(180deg);
}
```

**Recommendation:** Use native `<details>`, only add React state if programmatic control needed.

---

## Word Counting

**Decision:** Native JavaScript Regex - NO LIBRARY

**Rationale:**
- Simple algorithm: `value.trim().split(/\s+/).filter(Boolean).length`
- No external library needed (word-count package overkill)
- Handles edge cases: empty strings, multiple spaces, line breaks

**Implementation:**
```typescript
const countWords = (text: string): number => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};
```

**Edge Cases Handled:**
- Empty string: 0 words
- Multiple spaces: "hello    world" = 2 words
- Line breaks: "hello\n\nworld" = 2 words
- Punctuation: "hello, world!" = 2 words

**Limitation:** Non-English text (CJK languages) may not count accurately (acceptable for MVP, document behavior).

**Recommendation:** Build utility function, no library dependency.

---

## Class Name Utility

**Decision:** clsx 2.1.0 + tailwind-merge 2.2.1 - ALREADY IN USE

**Rationale:**
- Combined in `/lib/utils.ts` as `cn()` helper
- Handles conditional classes and Tailwind conflicts
- Used throughout codebase, proven pattern

**Pattern:**
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isFocused && 'focus-classes',
  error ? 'error-classes' : 'normal-classes'
)} />
```

**Recommendation:** Continue using `cn()` helper, no changes needed.

---

## Performance Monitoring

**Decision:** Built-in Next.js Web Vitals - NO ADDITIONAL TOOLING

**Rationale:**
- Core Web Vitals already tracked in `/app/layout.tsx`
- Vercel Analytics provides production metrics
- Bundle size monitoring via `next build` output
- No need for complex APM tools for iteration 14

**Metrics Monitored:**
- LCP (Largest Contentful Paint): Target <2.5s
- FID (First Input Delay): Target <100ms
- CLS (Cumulative Layout Shift): Target <0.1
- Bundle size: Must stay under +30KB for Plan-7

**Recommendation:** Continue existing monitoring, add bundle size baseline check.

---

## Testing Strategy

**Decision:** Manual Testing + Lighthouse Audits - NO AUTOMATED TESTS THIS ITERATION

**Rationale:**
- Iteration 14 is polish/UX work (visual changes)
- Manual testing faster than writing component tests
- Accessibility audited via Lighthouse + manual keyboard testing
- Automated tests deferred to future iterations

**Manual Testing Checklist:**
- Reflection form on desktop + mobile
- Individual reflection display with varied AI responses
- Reflection collection filters (all combinations)
- Empty states on all 5 pages
- Keyboard navigation (tab through all forms)
- Screen reader basics (VoiceOver/NVDA spot check)
- Reduced motion (toggle system preference, verify animations disable)

**Recommendation:** Manual testing sufficient for polish iteration, document test cases.

---

## Environment Variables

No new environment variables needed for iteration 14. All changes are UI-only.

Existing variables continue to be used:
- `DATABASE_URL` (Supabase PostgreSQL)
- `ANTHROPIC_API_KEY` (Claude AI)
- `NEXTAUTH_SECRET` (authentication)

---

## Dependencies Summary

**No new dependencies added in iteration 14.**

All enhancements leverage existing packages:
- Next.js 14 (framework)
- Tailwind CSS 3.4 (styling)
- Framer Motion 11.18.2 (animations)
- react-markdown 10.1.0 + remark-gfm 4.0.1 (AI response rendering)
- clsx + tailwind-merge (class utilities)

**Bundle Size Impact:**
- Estimated <5KB (micro-copy strings, minimal new code)
- Well within 30KB budget for Plan-7

---

## Performance Targets

- **First Contentful Paint (FCP):** <1.8s (maintain from Plan-6)
- **Largest Contentful Paint (LCP):** <2.5s (maintain from Plan-6)
- **Time to Interactive (TTI):** <3.5s (maintain from Plan-6)
- **Bundle size increase:** <30KB total for Plan-7 (currently ~22KB used)
- **Lighthouse Performance:** >90 (currently 97, maintain)

---

## Security Considerations

**No security changes in iteration 14.** All enhancements are UI polish.

Existing security maintained:
- react-markdown sanitizes AI responses (no XSS risk)
- tRPC endpoints remain unchanged (no new attack surface)
- Form validation unchanged (backend still validates)

---

## Accessibility Standards

**Target:** WCAG 2.1 AA (maintain from Plan-6)

**Key Requirements:**
- Color contrast: All text meets 4.5:1 ratio (verify gold highlights)
- Keyboard navigation: All interactive elements accessible via Tab
- Focus indicators: Visible focus rings on all inputs/buttons
- Reduced motion: All animations respect `prefers-reduced-motion` (already implemented)
- Screen reader: Semantic HTML, proper ARIA labels
- Form labels: All inputs have associated labels

**Iteration 14 Accessibility Additions:**
- Character counter announces changes to screen readers (aria-live)
- Empty state illustrations have `aria-hidden="true"` (decorative)
- Collapsible sections use semantic `<details>` (accessible by default)

**Recommendation:** Maintain existing accessibility patterns, add ARIA where needed.
