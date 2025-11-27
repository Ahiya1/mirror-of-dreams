# Technology Stack - Iteration 2

**No framework changes required.** Iteration 2 uses the same stack as Iteration 1, with usage pattern adjustments for restraint.

---

## Core Framework

**Decision:** Next.js 14 App Router (current version)

**Rationale:**
- Already implemented and working well
- Server Components reduce bundle size for dashboard-heavy app
- App Router provides clean page transitions
- No issues identified during exploration

**Alternatives Considered:**
- None - stack is proven and appropriate

**Implementation Notes:**
- Continue using App Router patterns
- Maintain server/client component separation
- No migration needed

---

## Database

**Decision:** Supabase PostgreSQL (local instance on port 54331)

**Rationale:**
- Working correctly for reflections, dreams, users
- Local development setup stable
- No database changes needed for iteration 2

**Schema Strategy:**
- No changes required
- Iteration 1 established clean schema
- Focus is UI/UX, not data model

**Implementation Notes:**
- Database remains on `localhost:54331`
- Admin user: `ahiya.butman@gmail.com`
- Premium tier with creator access

---

## API Layer

**Decision:** tRPC with React Query (current implementation)

**Rationale:**
- Type-safe API calls working well
- No API changes needed for iteration 2
- Dashboard cards use tRPC queries correctly

**Implementation Notes:**
- Keep all existing tRPC routers
- No new endpoints needed
- Data fetching patterns remain unchanged

---

## Frontend Framework

**Decision:** React 18 with TypeScript

**UI Component Library:** Custom glass components (to be simplified)

**Styling:** Tailwind CSS + CSS Modules

**Rationale:**
- Current setup works well
- Focus is restraint patterns, not framework changes
- Glass components need simplification, not replacement

**Implementation Notes:**
- Preserve React component structure
- Simplify component APIs (remove decorative props)
- Update styling for restraint, not rewrite

---

## Animation Library

**Decision:** Framer Motion 11.x (restrained usage) + CSS Transitions

**Rationale:**
- Framer Motion excellent for page transitions
- Problem is overuse, not the library itself
- CSS transitions better for hover/tap interactions

**Current Issues:**
- Scale effects on 67 components (remove)
- Continuous breathing animations (remove)
- Durations too long (600ms → 200-300ms)

**Restrained Usage Pattern:**

**USE Framer Motion for:**
- Page transitions (fade in/out between routes)
- Modal open/close (fade + slide, NO scale)
- Loading states (spinners, progress indicators)
- Stagger animations (dashboard card entrance, reduced duration)

**USE CSS Transitions for:**
- Button hover states (`transition-opacity duration-200`)
- Card hover effects (`transition-transform duration-250`)
- Input focus states
- Active state changes

**NEVER use:**
- Scale effects (`scale: 1.02`, `scale: 0.98`)
- Continuous animations (`repeat: Infinity` on foreground elements)
- Bounce/spring effects
- Breathing/pulsing (except background atmospheric layers)

**Implementation Strategy:**

```typescript
// BEFORE (decorative)
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  ✨ Reflect Now
</motion.button>

// AFTER (restrained)
<button className="transition-opacity duration-200 hover:opacity-90">
  Reflect Now
</button>
```

**Files to Modify:**
- `lib/animations/variants.ts` - Remove scale from all variants
- `components/ui/glass/GlowButton.tsx` - Remove whileHover/whileTap
- `components/ui/glass/GlassCard.tsx` - Remove hover scale
- `styles/animations.css` - Delete decorative keyframes

**Duration Guidelines:**
- Page transitions: 300ms
- Button hover: 200ms
- Card hover: 250ms
- Modal open: 250ms
- Stagger delay: 80-100ms (down from 150ms)

---

## Design System Components

### Glass Component Library

**Current Components:**
- `GlassCard` - Multi-layer backdrop blur container
- `GlowButton` - Button with optional glow effects
- `GlowBadge` - Badge with status colors
- `AnimatedBackground` - 4-layer atmospheric background
- `ProgressOrbs` - Progress indicator with orbs

**Simplification Strategy:**

**Keep (Earned Beauty):**
- `backdrop-blur-crystal` (2px sharp blur - functional clarity)
- Multi-layer gradients in glass (functional depth)
- `AnimatedBackground` with `intensity="subtle"` (ambient atmosphere)
- Active state indicators (border/background color changes)

**Remove (Decorative Flash):**
- `breathe-slow` class (continuous scale animation)
- `amethyst-breathing` glow (continuous pulse)
- `hover-glow` drop-shadow (decorative)
- Multiple glow color variants (simplify to one)
- Continuous pulsing in badges/orbs

**Updated Component APIs:**

```typescript
// GlassCard - SIMPLIFIED
interface GlassCardProps {
  children: ReactNode;
  elevated?: boolean;      // Simple boolean (not variant enum)
  interactive?: boolean;   // Enables subtle hover lift (no scale)
  className?: string;
}

// GlowButton - SIMPLIFIED
interface GlowButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  // REMOVED: glowColor, animated, scale props
}

// GlowBadge - SIMPLIFIED
interface GlowBadgeProps {
  children: ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info';
  // REMOVED: glowing prop (no pulse animation)
}
```

**Implementation Notes:**
- Update all 30+ usages of these components
- Remove decorative props from component interfaces
- Keep glass effect utilities in Tailwind config

---

## Icon System

**Decision:** Emoji for functional icons, SVG for UI controls

**Current Issues:**
- 150+ emoji instances (mostly decorative)
- Password toggles use emoji (should be SVG)
- Button decorations use emoji (remove entirely)

**Restrained Icon Strategy:**

**Functional Emojis (KEEP - Max 24 app-wide):**
- Dream category icons (10 types): 🏃💼❤️💰🌱🎨🙏🚀📚⭐
- Dream status icons (4 types): ✨🎉📦🕊️
- Use in: Dream cards, dream detail, dream selection

**Decorative Emojis (REMOVE - 130+ instances):**
- Button decorations: ✨💎🦋🏔️🌱
- Badge decorations: "Free Forever ✨"
- Header icons: 📊🌙💎
- Tone selectors: ⚡🌸🔥

**SVG Icons (NEW - for UI controls):**
- Password visibility toggle (replace 👁️🙈)
- Navigation icons (if needed)
- Action icons (edit, delete, share)

**Implementation Pattern:**

```typescript
// components/icons/DreamCategoryIcon.tsx
export function DreamCategoryIcon({ category }: { category: DreamCategory }) {
  const icons: Record<DreamCategory, string> = {
    health: '🏃',
    career: '💼',
    relationships: '❤️',
    financial: '💰',
    personal_growth: '🌱',
    creative: '🎨',
    spiritual: '🙏',
    adventure: '🚀',
    learning: '📚',
    other: '⭐',
  };

  return (
    <span className="text-xl" role="img" aria-label={category}>
      {icons[category]}
    </span>
  );
}

// Usage
<DreamCategoryIcon category={dream.category} />
```

**Benefits:**
- Centralized icon management
- Easy to swap emoji for SVG later
- Enforces functional-only icon usage
- Clear semantic meaning

---

## Styling System

**Decision:** Tailwind CSS + CSS Modules (current implementation)

**Custom Utilities (Keep):**
- `backdrop-blur-crystal` - 2px sharp blur
- `crystal-glass` - Multi-layer gradient background
- `mirror-corner` - Border treatment
- Custom color palette (amethyst, cosmic blue, etc.)

**Custom Utilities (Remove/Simplify):**
- `.animate-breathe` - DELETE
- `.animate-breathe-subtle` - DELETE
- `.animate-pulse-glow` - DELETE
- `.animate-float` - DELETE
- `.animate-bob` - DELETE
- `.hover-glow` - DELETE
- `.hover-scale` - DELETE

**Animation Duration Variables (NEW):**

```css
/* styles/animations.css */
:root {
  --transition-fast: 200ms;
  --transition-normal: 250ms;
  --transition-slow: 300ms;
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Use in components */
.button {
  transition: opacity var(--transition-fast) var(--ease-standard);
}
```

**Glass Effect Utilities (Keep):**

```css
/* Functional depth - KEEP */
.crystal-glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.02)
  ),
  linear-gradient(
    225deg,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Elevated state - KEEP */
.crystal-glass-elevated {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

---

## Copy Management

**Decision:** Inline strings (no i18n for iteration 2)

**Forbidden Words/Phrases:**
- "Sacred" (unless literally religious)
- "Journey" (use "reflections" or "progress")
- "Consciousness" / "soul" / "mystical"
- "Transform" / "transformation" (unless proven)
- "Unlock" / "reveal" (gamification)
- "Deep wisdom" / "inner landscape"
- "Embrace" / "embark" (marketing verbs)

**Approved Patterns:**
- Direct: "Reflections" not "journey"
- Specific: "8 reflections this month" not "weaving patterns"
- Honest: "Understand" not "unlock deep wisdom"
- Action-oriented: "Create" not "embark on"

**Implementation:**
- All user-facing strings in component files
- Update in-place (no translation layer yet)
- Document voice & tone guidelines post-iteration

---

## Development Tools

### Code Quality

**Linter:** ESLint (current config)
**Formatter:** Prettier (current config)
**Type Checking:** TypeScript strict mode

**No changes needed** - focus is design/copy, not code quality tools

### Testing Strategy

**Manual Testing (Primary):**
- Visual review of all pages
- Emoji count validation (grep + manual)
- Copy audit (search for forbidden words)
- Animation check (no scale/bounce visible)
- Full user flow (sign in → reflect → view)

**Validation Checklist:**
- [ ] Max 2 emojis per page (decorative)
- [ ] No pop-up animations
- [ ] Landing page: "Reflect. Understand. Evolve."
- [ ] Dashboard greeting: "Good evening, [Name]"
- [ ] "Free Forever" badge removed
- [ ] Auth pages identical styling

**Automated Testing (Future):**
- Component snapshot tests
- Visual regression tests
- Accessibility tests

---

## Environment Variables

**No changes required.**

Current environment variables remain:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`

---

## Dependencies Overview

**No new dependencies.** All changes use existing packages.

**Key Packages (Current Versions):**
- `next@14.x` - App Router framework
- `react@18.x` - UI library
- `framer-motion@11.x` - Animation (restrained usage)
- `@trpc/client@10.x` - Type-safe API
- `@tanstack/react-query@4.x` - Data fetching
- `tailwindcss@3.x` - Styling
- `typescript@5.x` - Type safety

**Usage Pattern Changes:**
- Framer Motion: Page transitions only (not hover/tap)
- Tailwind: More custom utilities for transitions
- CSS Modules: Simplify decorative animations

---

## Performance Targets

**Improvements Expected from Iteration 2:**

- **Bundle Size:** Slight reduction (fewer animation variants imported)
- **CPU Usage:** Significant reduction (no continuous breathing/pulsing)
- **First Contentful Paint:** No change (same framework)
- **Interaction Responsiveness:** Improvement (200ms vs 600ms transitions)

**Metrics to Track:**
- CPU usage on dashboard (should drop with removed animations)
- Animation frame rate (should improve)
- Perceived performance (faster due to shorter durations)

**No performance testing required** - improvements are side effects of simplification.

---

## Security Considerations

**No changes to security model.**

Iteration 2 is UI/UX focused:
- No API changes
- No authentication changes
- No database schema changes
- No new external dependencies

**Focus:** Visual restraint and copy clarity only.

---

## Browser Support

**Target:** Modern browsers (Chrome, Firefox, Safari, Edge - latest versions)

**Considerations:**
- `backdrop-filter` requires modern browser (already in use)
- CSS custom properties widely supported
- Framer Motion has good browser support
- No additional compatibility concerns

---

## Accessibility

**Preserve Existing Features:**
- `prefers-reduced-motion` support (already implemented in `useReducedMotion`)
- Keyboard navigation (ensure remains functional after changes)
- Focus states (keep `:focus-visible` styles)
- Screen reader compatibility (test after icon changes)

**Improvements:**
- Faster animations more accessible (200ms vs 600ms)
- Clearer copy more accessible (direct language)
- Simpler layouts more accessible (clear hierarchy)

**Testing:**
- Keyboard navigation after animation changes
- Screen reader announces buttons correctly
- Color contrast remains WCAG AA compliant

---

## Tech Stack Summary

**Core Decision:** NO framework changes. Restrain usage patterns, not replace technology.

**Key Adjustments:**
1. Framer Motion: Page transitions only, not interactions
2. CSS Transitions: Hover/tap states
3. Animation Durations: 200-300ms (down from 600ms)
4. Glass Components: Simplify APIs, keep effects
5. Icon System: Functional emojis only, SVG for controls
6. Copy: Direct language, no marketing speak

**Implementation Focus:**
- Simplify existing components
- Remove decorative props/animations
- Update copy in-place
- Preserve functional depth (glass effects, backgrounds)

**No new packages. No migrations. Focus on restraint.**
