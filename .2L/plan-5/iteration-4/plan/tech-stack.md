# Technology Stack - Iteration 4

## Overview

Iteration 4 uses the **existing tech stack** with strategic extensions to CSS variables and Tailwind configuration. No new dependencies are added. All changes build on the solid foundation established in previous iterations.

**Key Principle:** Leverage existing design system (variables.css, Tailwind) while unifying inconsistent patterns into a single source of truth.

---

## Core Framework

**Decision:** Next.js 14.3.1 (App Router)

**Rationale:**
- Already established in project
- Server Components reduce client-side bundle
- App Router provides excellent routing patterns
- No framework changes needed for this iteration

**Version:** 14.3.1 (no upgrade needed)

**Implementation Notes:**
- All pages remain in `app/` directory
- No routing changes required
- Server/client components already well-separated

---

## Styling System

### CSS Custom Properties (CSS Variables)

**Decision:** Extend existing variables.css with typography adjustments

**Current State:**
- Comprehensive design system in `styles/variables.css`
- 126+ CSS variables covering colors, spacing, typography, shadows
- Responsive typography using `clamp()` functions
- Well-established spacing scale (--space-xs through --space-3xl)

**Changes for Iteration 4:**

```css
/* ADJUSTMENT 1: Increase --text-xs minimum for accessibility */
/* Before */
--text-xs: clamp(0.7rem, 1.8vw, 0.85rem);

/* After */
--text-xs: clamp(0.85rem, 1.8vw, 0.9rem);
/* Rationale: 11.2px was below 14.4px accessibility minimum */

/* ADJUSTMENT 2: Fine-tune --text-base for 1.1rem target */
/* Before */
--text-base: clamp(1rem, 2.5vw, 1.2rem);

/* After */
--text-base: clamp(1.05rem, 2.5vw, 1.15rem);
/* Rationale: Closer to master plan target of 1.1rem body text */

/* ADJUSTMENT 3: Increase body line-height for readability */
/* Before */
--leading-relaxed: 1.625;

/* After */
--leading-relaxed: 1.75;
/* Rationale: Closer to 1.8 target, improves reading comfort */
```

**Implementation Strategy:**
- Update `styles/variables.css` (3 variable adjustments)
- No breaking changes (all existing references remain valid)
- Test mobile typography at 320px width after changes

---

### Tailwind CSS Configuration

**Decision:** Extend Tailwind config to map CSS spacing variables

**Current State:**
- Tailwind CSS 3.4.1 installed
- Custom colors already configured (mirror-purple, mirror-indigo, etc.)
- Custom spacing NOT mapped to CSS variables (gap-4 = 1rem, not var(--space-4))

**Extension for Iteration 4:**

```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      // Map CSS spacing variables to Tailwind classes
      spacing: {
        'xs': 'var(--space-xs)',   // clamp(0.5rem, 1vw, 0.75rem)
        'sm': 'var(--space-sm)',   // clamp(0.75rem, 1.5vw, 1rem)
        'md': 'var(--space-md)',   // clamp(1rem, 2.5vw, 1.5rem)
        'lg': 'var(--space-lg)',   // clamp(1.5rem, 3vw, 2rem)
        'xl': 'var(--space-xl)',   // clamp(2rem, 4vw, 3rem)
        '2xl': 'var(--space-2xl)', // clamp(3rem, 6vw, 4rem)
        '3xl': 'var(--space-3xl)', // clamp(4rem, 8vw, 6rem)
      }
    }
  }
}
```

**Benefits:**
- Tailwind classes (gap-xl, p-lg) now reference responsive CSS variables
- Single source of truth for spacing
- No hardcoded px values in JSX
- Responsive by default (clamp values scale automatically)

**Migration Pattern:**

```tsx
/* Before */
<div className="gap-4 p-8">  {/* 16px gap, 32px padding */}

/* After */
<div className="gap-md p-xl">  {/* Responsive gap/padding via CSS variables */}
```

**Rationale:**
- Maintains Tailwind's utility-first approach
- Eliminates hardcoded Tailwind values (gap-4, p-8)
- Ensures all spacing is responsive
- Makes spacing system visible and intentional

---

### Typography Utility Classes

**Decision:** Create semantic typography utilities in globals.css

**Implementation:**

```css
/* styles/globals.css */
@layer utilities {
  /* Typography Scale Utilities */
  .text-h1 {
    font-size: var(--text-4xl);      /* 3rem max */
    font-weight: var(--font-semibold); /* 600 */
    line-height: var(--leading-tight); /* 1.25 */
  }

  .text-h2 {
    font-size: var(--text-2xl);      /* 2rem max */
    font-weight: var(--font-semibold); /* 600 */
    line-height: var(--leading-tight); /* 1.25 */
  }

  .text-h3 {
    font-size: var(--text-xl);       /* 1.5rem max */
    font-weight: var(--font-medium);  /* 500 */
    line-height: var(--leading-snug); /* 1.375 */
  }

  .text-body {
    font-size: var(--text-base);     /* 1.1rem target */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-relaxed); /* 1.75 */
  }

  .text-small {
    font-size: var(--text-sm);       /* 0.9rem min */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-normal); /* 1.5 */
  }

  .text-tiny {
    font-size: var(--text-xs);       /* 0.85rem min (adjusted) */
    font-weight: var(--font-normal);  /* 400 */
    line-height: var(--leading-snug); /* 1.375 */
  }
}
```

**Usage Pattern:**

```tsx
/* Before (Inconsistent) */
<h1 className="text-3xl sm:text-4xl font-bold">Your Dreams</h1>

/* After (Unified) */
<h1 className="text-h1">Your Dreams</h1>
```

**Benefits:**
- Single class applies font-size, weight, AND line-height
- Responsive by default (CSS variables use clamp)
- Semantic naming (text-h1 vs text-4xl)
- Consistent across all pages
- No breakpoint management needed

**Rationale:**
- Eliminates inconsistency between Tailwind classes and CSS variables
- Enforces typography hierarchy automatically
- Reduces JSX verbosity (one class vs three)
- Makes typography system explicit and discoverable

---

## Component Library

### Existing Glass Components

**No Changes Required:**

All glass components (`components/ui/glass/`) remain unchanged:
- `CosmicLoader.tsx` - Already production-ready
- `GlowButton.tsx` - Already has cosmic variant
- `GlassCard.tsx` - Solid implementation
- `GlassModal.tsx` - Working well
- `GlassInput.tsx` - Good implementation

**Usage Expansion:**

**CosmicLoader** - Apply consistently:
```tsx
// Evolution page (NEW)
if (dreamsLoading || reportsLoading || eligibilityLoading) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CosmicLoader size="lg" />
      <p className="text-white/60 text-sm">Loading your evolution reports...</p>
    </div>
  );
}

// Visualizations page (NEW)
if (dreamsLoading || visualizationsLoading) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CosmicLoader size="lg" />
      <p className="text-white/60 text-sm">Loading visualizations...</p>
    </div>
  );
}
```

**GlowButton** - Use for "Reflect Now" CTA:
```tsx
// Dashboard page (UPDATED)
<GlowButton
  variant="cosmic"
  size="lg"
  onClick={handleReflectNow}
  className="w-full sm:w-auto min-w-[280px]"
>
  ✨ Reflect Now
</GlowButton>
```

**Rationale:**
- Existing components are well-designed
- No need to create new components
- Focus on consistent usage, not new features

---

### EmptyState Component

**Decision:** Enhance with personality, keep structure simple

**Current Implementation:**
```tsx
// components/shared/EmptyState.tsx
export function EmptyState({ icon, title, description, ctaLabel, ctaAction }) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <GlassCard elevated className="text-center max-w-md">
        <div className="text-6xl mb-4">{icon}</div>
        <GradientText gradient="cosmic" className="text-2xl font-bold mb-4">
          {title}
        </GradientText>
        <p className="text-white/60 text-base mb-6 leading-relaxed">
          {description}
        </p>
        {ctaLabel && ctaAction && (
          <GlowButton variant="primary" size="lg" onClick={ctaAction} className="w-full">
            {ctaLabel}
          </GlowButton>
        )}
      </GlassCard>
    </div>
  );
}
```

**Changes for Iteration 4:**

1. **Add emojis to all usage sites** (component unchanged)
2. **Update copy to be personality-driven** (usage sites only)
3. **Use new typography utilities** (text-h2, text-body)

**Updated Usage Pattern:**

```tsx
// Dreams page (UPDATED COPY)
<EmptyState
  icon="✨"  // Added emoji
  title="Your Dream Journey Awaits"  // Personality
  description="Every great journey begins with a single dream. What will yours be?"
  ctaLabel="Create My First Dream"  // Personalized
  ctaAction={() => setIsCreateModalOpen(true)}
/>
```

**Implementation Notes:**
- NO component refactor needed
- Update only the copy at usage sites
- Add emojis via icon prop
- Test personality level with stakeholders

---

## Loading State Pattern

### CosmicLoader Implementation

**Existing Component:**
```tsx
// components/ui/glass/CosmicLoader.tsx
export function CosmicLoader({ size = 'md', className, label = 'Loading content' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <motion.div
        animate={!prefersReducedMotion ? { rotate: 360 } : undefined}
        transition={!prefersReducedMotion ? { duration: 2, repeat: Infinity, ease: 'linear' } : undefined}
        className="rounded-full w-16 h-16 border-4 border-transparent border-t-mirror-purple border-r-mirror-indigo border-b-mirror-violet shadow-glow"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
```

**Strengths:**
- Respects prefers-reduced-motion (accessibility)
- Proper ARIA labels (screen reader support)
- Three size variants (sm, md, lg)
- GPU-accelerated rotation (60fps)
- Matches cosmic design aesthetic

**Usage Pattern (With 300ms Minimum Display):**

```tsx
// Add minimum display time to prevent flash
const [showLoading, setShowLoading] = useState(false);

useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => setShowLoading(true), 0);
    return () => clearTimeout(timer);
  } else {
    // Keep loader visible for at least 300ms
    const timer = setTimeout(() => setShowLoading(false), 300);
    return () => clearTimeout(timer);
  }
}, [isLoading]);

if (showLoading) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CosmicLoader size="lg" />
      <p className="text-white/60 text-sm">Loading your dreams...</p>
    </div>
  );
}
```

**Rationale:**
- 300ms minimum prevents flash on fast networks
- Descriptive text provides context
- Consistent pattern across all pages

---

## Animation Library

**Decision:** Framer Motion 11.18.2 (existing)

**Current Usage:**
- CosmicLoader rotation animation
- Stagger animations on dashboard cards
- Modal animations (slide-in, fade-in)

**Performance Considerations:**
- All animations GPU-accelerated (transform, opacity only)
- Respects prefers-reduced-motion
- 60fps target on all devices
- No jank during hover states (tested on Safari)

**No Changes Needed:**
- Existing animations are performant
- Dashboard stagger timing is good (150ms delays)
- CosmicLoader is smooth (2s linear rotation)

---

## Data Fetching (tRPC)

**Decision:** No changes to tRPC implementation

**Current State:**
- tRPC integrated with Next.js App Router
- All queries return `{ data, isLoading, error }` states
- Loading states NOT consistently used (55% coverage)

**Changes for Iteration 4:**

**Systematic Loading State Addition:**

```tsx
// BEFORE: Evolution page (no loading states)
const { data: dreamsData } = trpc.dreams.list.useQuery();
const { data: reportsData } = trpc.evolution.list.useQuery();

// AFTER: Evolution page (with loading states)
const { data: dreamsData, isLoading: dreamsLoading } = trpc.dreams.list.useQuery();
const { data: reportsData, isLoading: reportsLoading } = trpc.evolution.list.useQuery();
const { data: eligibility, isLoading: eligibilityLoading } = trpc.evolution.checkEligibility.useQuery();

if (dreamsLoading || reportsLoading || eligibilityLoading) {
  return (
    <div className="flex flex-col items-center gap-4 min-h-screen justify-center">
      <CosmicLoader size="lg" />
      <p className="text-white/60 text-sm">Loading your evolution reports...</p>
    </div>
  );
}
```

**Coverage Target:** 100% (all tRPC queries)

**Rationale:**
- Users need feedback during 2-5 second data fetches
- Eliminates "frozen" UI perception
- Improves perceived performance
- Critical for UX on slow networks

---

## Development Tools

### Testing

**Framework:** No formal testing framework (manual QA)

**Testing Strategy for Iteration 4:**
1. **Manual QA:** Test all pages on Chrome, Safari, Firefox
2. **Mobile Testing:** Test on 320px, 768px, 1024px viewports
3. **Network Throttling:** Test loading states on 3G (slow network)
4. **Lighthouse Audit:** Performance + Accessibility scores
5. **Visual Regression:** Screenshot before/after for each page

**Coverage Target:**
- All pages tested manually (Dashboard, Dreams, Evolution, Visualizations, Reflection)
- All loading states tested on slow network
- All empty states validated for personality
- Mobile responsiveness verified

---

### Code Quality

**Linter:** ESLint (existing)
**Formatter:** Prettier (existing)
**Type Checking:** TypeScript strict mode

**No Changes Needed:**
- Existing linting/formatting rules are good
- TypeScript types already defined for components
- Focus on consistent patterns, not new tooling

---

### Build & Deploy

**Build Tool:** Next.js (webpack under the hood)
**Deployment:** Vercel (continuous deployment from main branch)
**CI/CD:** Automatic deployment on merge to main

**Performance Monitoring:**
- Lighthouse CI (track performance/accessibility scores)
- Vercel Analytics (track page load times)
- User engagement metrics (track "Reflect Now" CTA clicks)

---

## Environment Variables

**No New Environment Variables Needed**

All iteration 4 changes are frontend-only:
- CSS variable adjustments
- Component styling updates
- Typography/spacing enforcement
- Loading state additions

Existing environment variables remain:
- `DATABASE_URL` (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (for reflections)

---

## Dependencies Overview

**No New Dependencies**

All work uses existing packages:
- Next.js 14.3.1
- React 18.3.1
- Tailwind CSS 3.4.1
- Framer Motion 11.18.2
- tRPC (existing)

**Package.json Unchanged**

---

## Performance Targets

### Loading Performance
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s

**Current Baseline:**
- Dashboard LCP: ~2.0s
- Dreams page LCP: ~2.2s

**Target:** Maintain or improve (no regression)

---

### Animation Performance
- **Frame Rate:** 60fps on all hover states
- **Transform Performance:** GPU-accelerated only (translateY, scale, rotate)
- **Backdrop-Filter:** Monitor Safari performance (known bottleneck)

**Testing:**
- Chrome DevTools Performance tab
- Safari Timeline (test on iOS 14+)
- Older devices (iPhone X or older)

---

### Bundle Size
- **Target:** No increase in bundle size
- **Strategy:** No new dependencies, only CSS/JSX changes

---

## Security Considerations

**No Security Changes Required**

All iteration 4 work is styling/UX:
- CSS variable updates (no security impact)
- Component styling (client-side only)
- Typography/spacing (cosmetic)

**Existing Security Measures Maintained:**
- Supabase Row Level Security (RLS)
- tRPC authentication middleware
- Next.js secure headers
- Environment variable protection

---

## Browser Compatibility

### Primary Browsers (Full Support)
- **Chrome 120+** (desktop + mobile)
- **Safari 16+** (desktop + iOS 14+)
- **Firefox 120+** (desktop)
- **Edge 120+** (desktop)

### Feature Support Required
- **CSS Custom Properties:** ✅ Supported in all modern browsers
- **CSS clamp():** ✅ Supported in Chrome 79+, Safari 13.1+, Firefox 75+
- **Backdrop-filter:** ⚠️ Supported but performance varies (Safari can be slow)
- **Framer Motion:** ✅ React library, browser-agnostic

### Fallbacks
- **prefers-reduced-motion:** Disable animations if user prefers reduced motion
- **Backdrop-filter performance:** Monitor Safari, reduce blur if FPS drops below 30

---

## Mobile Responsiveness

### Breakpoints (Existing Tailwind Config)
- **sm:** 640px (mobile landscape, small tablet)
- **md:** 768px (tablet)
- **lg:** 1024px (desktop)
- **xl:** 1280px (large desktop)

### Typography Scaling (CSS clamp)
All typography scales responsively:
- **--text-xs:** 0.85rem → 0.9rem (13.6px → 14.4px)
- **--text-base:** 1.05rem → 1.15rem (16.8px → 18.4px)
- **--text-4xl:** 2.2rem → 3rem (35px → 48px)

### Spacing Scaling (CSS clamp)
All spacing scales responsively:
- **--space-xs:** 0.5rem → 0.75rem (8px → 12px)
- **--space-lg:** 1.5rem → 2rem (24px → 32px)
- **--space-xl:** 2rem → 3rem (32px → 48px)

**Testing Required:**
- iPhone SE (320px width) - Smallest screen
- iPhone 12 (390px width) - Common screen
- iPad (768px width) - Tablet breakpoint
- Desktop (1024px+ width) - Large screens

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Text Contrast:**
- All text meets 4.5:1 contrast ratio (body text)
- Large text meets 3:1 contrast ratio (headings)

**Focus States:**
- All interactive elements have visible focus rings
- Focus order is logical (top to bottom, left to right)

**Screen Reader Support:**
- ARIA labels on all buttons/icons
- role="status" on loading states
- Semantic HTML (h1, h2, h3, button, etc.)

**Motion Preferences:**
- Respects prefers-reduced-motion
- All animations disabled if user prefers reduced motion

**Keyboard Navigation:**
- All interactive elements keyboard-accessible
- Tab order is logical
- Enter/Space activate buttons

---

## Summary

**Technology Decisions:**
1. **CSS Variables:** Extend existing variables.css with typography adjustments
2. **Tailwind Config:** Map CSS spacing variables to Tailwind classes
3. **Typography Utilities:** Create semantic classes (.text-h1, .text-h2, etc.)
4. **CosmicLoader:** Apply consistently across all tRPC queries
5. **EmptyState:** Enhance with personality-driven copy
6. **No New Dependencies:** All work uses existing packages

**Why These Decisions:**
- Build on solid foundation (variables.css, Tailwind, glass components)
- Unify inconsistent patterns into single source of truth
- Improve UX with systematic loading states and personality
- Maintain performance (no bundle size increase)
- Ensure accessibility (WCAG 2.1 AA compliance)

**Implementation Risk:** LOW
- All changes are additive (no breaking changes)
- Existing components remain unchanged
- CSS variables provide responsive scaling by default
- No new dependencies to manage

---

*This tech stack builds on Mirror of Dreams' existing foundation to create systematic consistency without introducing complexity or risk.*
