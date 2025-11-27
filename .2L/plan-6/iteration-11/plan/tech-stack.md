# Technology Stack - Iteration 11

**Iteration:** 11 (Global)
**Plan:** plan-6
**Phase:** Systematic Polish & QA
**Created:** 2025-11-28

---

## Core Framework

**Decision:** Next.js 14.2.0 (App Router)

**Rationale:**
- Already in production use (Iterations 1-10)
- Server Components reduce bundle size for dashboard-heavy app
- App Router with `template.tsx` enables page transitions
- Zero changes needed - framework mature and stable

**Status:** Production-ready, zero modifications required

---

## Animation Library

**Decision:** Framer Motion 11.18.2

**Rationale:**
- **15 existing variants** proven in production (`lib/animations/variants.ts`)
- **Built-in `useReducedMotion` hook** for accessibility compliance
- **Mature ecosystem:** `useStaggerAnimation` custom hook respects user preferences
- **Performance tested:** 60fps animations achieved in Iterations 1-10
- **No upgrade needed:** Current version stable, no breaking changes

**Existing Variants (Re-use):**
- `cardVariants` - Card entrance + hover (y: -2px lift)
- `glowVariants` - Box-shadow transitions (purple glow)
- `staggerContainer` + `staggerItem` - Sequential fade-in for lists
- `fadeInVariants` - Simple fade-in (used in page transitions)
- `slideUpVariants` - Fade + slide up (y: 20)
- `modalOverlayVariants` + `modalContentVariants` - Modal animations
- `orbVariants` - Progress orb states (inactive/active/complete)

**New Variants to Add (Feature 7):**
- `inputFocusVariants` - Textarea focus glow (box-shadow transition)
- `cardPressVariants` - Click scale-down effect (0.98 → 1.0)
- `characterCounterVariants` - Color shift states (white/70 → gold → red)
- `pageTransitionVariants` - Route crossfade (150ms out, 300ms in)

**Implementation Pattern:**
```typescript
// lib/animations/variants.ts
export const inputFocusVariants: Variants = {
  rest: {
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  focus: {
    boxShadow: [
      '0 0 0 2px rgba(139, 92, 246, 0.5)',
      '0 0 20px rgba(139, 92, 246, 0.3)',
      'inset 0 0 20px rgba(139, 92, 246, 0.15)'
    ].join(', '),
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};
```

---

## Styling System

**Decision:** Tailwind CSS 3.4.1 + CSS Custom Properties

**Rationale:**
- **Design system established in Iteration 1:** Typography scale, color semantics, spacing system
- **91 color values in `mirror.*` palette:** Semantic usage documented
- **Responsive fluid scaling via `clamp()`:** Automatic mobile adaptation
- **Zero modifications needed:** System complete and proven

**Design System Foundation:**

**Typography Scale (Responsive):**
```css
/* styles/variables.css - Fluid sizing via clamp() */
--text-4xl: clamp(2.2rem, 6vw, 3rem);      /* 35-48px - h1 page titles */
--text-2xl: clamp(1.6rem, 4vw, 2rem);      /* 26-32px - h2 section headings */
--text-xl: clamp(1.3rem, 4vw, 1.6rem);     /* 21-26px - h3 subsections */
--text-base: clamp(1.05rem, 2.5vw, 1.15rem); /* 17-18px - body (WCAG AA) */
```

**Semantic Color Palette:**
```css
/* Purple/Amethyst (Primary Actions) */
--intense-primary: rgba(147, 51, 234, 0.95);   /* Buttons, CTAs */
--intense-bg: rgba(147, 51, 234, 0.08);        /* Active states */
--intense-border: rgba(147, 51, 234, 0.4);     /* Emphasis */

/* Gold (Success/Highlights) */
--fusion-primary: rgba(251, 191, 36, 0.95);    /* Success moments */
--fusion-bg: rgba(251, 191, 36, 0.08);         /* Positive stats */
--fusion-border: rgba(251, 191, 36, 0.3);      /* Highlights */

/* Blue (Information) */
--info-primary: rgba(59, 130, 246, 0.9);       /* Info messages */
--info-bg: rgba(59, 130, 246, 0.1);            /* Calm actions */

/* Red (Errors/Warnings) */
--error-primary: rgba(239, 68, 68, 0.9);       /* Error states */
--error-bg: rgba(239, 68, 68, 0.1);            /* Warnings */

/* Text Opacity Standards (WCAG AA Compliance) */
--cosmic-text: #ffffff;                        /* 100% - Primary text */
--cosmic-text-secondary: rgba(255, 255, 255, 0.8);  /* 80% - Body text (WCAG AA ✓) */
--cosmic-text-muted: rgba(255, 255, 255, 0.6);      /* 60% - Metadata (borderline) */
--cosmic-text-faded: rgba(255, 255, 255, 0.4);      /* 40% - Decorative only (WCAG AA ✗) */
```

**Spacing System:**
```css
/* Responsive spacing via clamp() */
--space-xs: clamp(0.25rem, 0.5vw, 0.5rem);   /* 4-8px */
--space-sm: clamp(0.5rem, 1vw, 0.75rem);     /* 8-12px */
--space-md: clamp(0.75rem, 1.5vw, 1rem);     /* 12-16px */
--space-lg: clamp(1rem, 2vw, 1.5rem);        /* 16-24px */
--space-xl: clamp(1.5rem, 3vw, 2rem);        /* 24-32px */
--space-2xl: clamp(2rem, 4vw, 3rem);         /* 32-48px */
--space-3xl: clamp(3rem, 5vw, 4rem);         /* 48-64px */
```

---

## Type Safety

**Decision:** TypeScript 5.9.3 (Strict Mode)

**Rationale:**
- **Zero type errors enforced:** Strict mode guarantees runtime safety
- **Production-ready:** All components type-safe from Iterations 1-10
- **No changes needed:** Type system comprehensive

---

## Testing Infrastructure

**Decision:** Manual Testing Only (No Automated Testing)

**Rationale:**
- **No Lighthouse CI:** Would require CI/CD pipeline setup (out of scope)
- **No Playwright:** E2E testing infrastructure not built (out of scope)
- **No Vitest/Jest:** Unit testing not implemented (test script is placeholder)
- **Manual validation proven effective:** Iterations 1-10 used manual testing successfully
- **Iteration 11 focus:** Systematic polish, not infrastructure buildout

**Manual Testing Tools (Iteration 11):**

1. **Chrome DevTools:**
   - Performance panel (LCP, FID, 60fps profiling)
   - Accessibility panel (contrast ratio checks)
   - Rendering panel (emulate prefers-reduced-motion)
   - Network panel (bundle size analysis)

2. **Browser DevTools:**
   - Firefox Developer Tools (grid inspector, accessibility)
   - Safari Web Inspector (iOS device debugging via USB)
   - Edge DevTools (Chromium-based, similar to Chrome)

3. **Screen Readers:**
   - macOS VoiceOver (built-in, free)
   - NVDA (Windows, free download from nvaccess.org)
   - ChromeVox (Chrome extension, fallback option)

4. **Real Devices (Minimum):**
   - iPhone SE (iOS Safari testing, small screen 320px)
   - Android phone (Chrome touch interactions)
   - iPad (tablet layout verification 768px)

5. **Grep-Based Audits:**
   ```bash
   # Typography audit (find arbitrary font-size values)
   grep -r "text-\[[0-9]" app/ components/ --include="*.tsx"

   # Color audit (find arbitrary Tailwind colors)
   grep -r "text-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx"

   # Opacity audit (find non-semantic opacity values)
   grep -r "text-white/[0-9]" app/ components/ --include="*.tsx" | \
     grep -v "text-white/\(100\|95\|90\|80\|70\|60\|50\|40\)"
   ```

**Why Manual Testing:**
- **Iteration 11 scope:** Polish and validation, not infrastructure
- **Test automation:** 20+ hours setup time (Lighthouse CI, Playwright, Vitest)
- **Proven methodology:** Iterations 1-10 shipped successfully with manual validation
- **Post-MVP plan:** Dedicated test automation iteration planned separately

---

## Supporting Libraries

**Decision:** Zero New Dependencies

**Rationale:** All required libraries already installed in Iterations 1-10

**Existing (All Used):**
- `framer-motion@11.18.2` - Animation variants, `useReducedMotion` hook
- `tailwindcss@3.4.1` - Utility-first CSS framework
- `tailwindcss-animate@1.0.7` - Additional animation utilities
- `clsx@2.1.0` - Conditional class composition
- `tailwind-merge@2.2.1` - Class merging (prevents conflicts)
- `react-markdown@10.1.0` - Markdown parsing for reflection content
- `remark-gfm@4.0.1` - GitHub Flavored Markdown support

**NOT Adding (Explicitly Out of Scope):**
- ❌ `@playwright/test` - E2E testing (would add 50MB+ to dependencies)
- ❌ `lighthouse` - Performance CI (requires CI/CD pipeline)
- ❌ `vitest` - Unit testing (test infrastructure not in scope)
- ❌ `axe-core` - Automated accessibility testing (manual testing sufficient)

---

## Accessibility Standards

**Decision:** WCAG 2.1 AA Compliance

**Rationale:**
- **Legal requirement:** ADA compliance for web applications
- **Moral imperative:** Ensure app usable by everyone
- **Measurable standard:** Clear pass/fail criteria (4.5:1 contrast minimum)

**Implementation:**

**1. Reduced Motion Support (3 Layers):**
```typescript
// Layer 1: CSS Variables (automatic)
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-smooth: none;
    --duration-300: 1ms;
  }
}

// Layer 2: Component-specific CSS
@media (prefers-reduced-motion: reduce) {
  .card { animation: none; transition: none; }
}

// Layer 3: JavaScript Hook
import { useReducedMotion } from 'framer-motion';
const prefersReduced = useReducedMotion();
if (prefersReduced) return <StaticView />;
```

**2. Keyboard Navigation:**
- All interactive elements focusable (Tab order logical)
- Focus indicators visible (2px purple glow)
- Enter/Space activate buttons
- Escape closes modals

**3. Screen Reader Support:**
- All images have `alt` text
- All buttons have `aria-label` or visible text
- Form inputs have associated `<label>` elements
- Headings follow semantic hierarchy (h1 → h2 → h3)
- ARIA live regions for dynamic content (`role="status"`, `aria-live="polite"`)

**4. Color Contrast:**
- Primary text: 100% white (highest contrast)
- Body text: 80% white (WCAG AA ✓ - 4.5:1+ contrast)
- Metadata: 70% white (WCAG AA ✓ - upgraded from 60% borderline)
- Decorative only: 40% white (WCAG AA ✗ - allowed for non-critical)

**Validation Method:**
- Chrome DevTools Accessibility panel (automated contrast checks)
- Lighthouse accessibility audit (target 100% score)
- Manual keyboard navigation testing
- Manual screen reader testing (macOS VoiceOver or NVDA)

---

## Performance Targets

**Decision:** LCP <2.5s, FID <100ms, 60fps Animations

**Rationale:**
- **LCP (Largest Contentful Paint):** Google Core Web Vitals standard
- **FID (First Input Delay):** User-perceived responsiveness
- **60fps:** Smooth animations on modern devices (desktop, iPhone 12+, 2020+ Android)

**Performance Budget:**
```yaml
Largest Contentful Paint (LCP): <2.5s
  - Target: All pages load primary content within 2.5 seconds
  - Test: Chrome DevTools Lighthouse, throttled to "Fast 3G"
  - Current: Unknown (not measured in Iteration 9) - Baseline in Iteration 11

First Input Delay (FID): <100ms
  - Target: All interactions respond within 100 milliseconds
  - Test: Chrome DevTools Performance panel, record first interaction
  - Current: Likely <50ms (no performance issues reported)

Animation Frame Rate: 60fps
  - Target: All animations maintain 60 frames per second
  - Devices: Desktop, iPhone 12+, 2020+ Android phones
  - Acceptable: 30fps on old devices (iPhone 8, 2018 Android)
  - Test: Chrome DevTools Performance panel, record animations, verify green frame rate line

Bundle Size: Maintain Current
  - Target: No significant growth from Iteration 10 baseline
  - Current: main-app.js ~5.8MB (code splitting needed - Iteration 2 finding)
  - Test: `npm run build` output analysis
  - Acceptable: +20KB maximum increase
```

**Optimization Strategies:**
- **CSS transitions preferred** over framer-motion for simple effects (box-shadow, color) - Faster, less JS
- **`will-change` CSS property** sparingly (only during animation) - Reduces repaints
- **Code splitting** for large pages (dashboard, reflection) - Dynamic imports if needed
- **Reduce particle count** on mobile (if cosmic background animations heavy)

---

## Browser Support

**Decision:** Latest Versions of Chrome, Firefox, Safari, Edge

**Rationale:**
- **95%+ user coverage:** Latest browsers represent vast majority of users
- **Modern CSS features:** CSS custom properties, backdrop-filter, grid require recent browsers
- **Reduced maintenance:** No polyfills for IE11, no legacy browser workarounds

**Supported Browsers:**
- **Chrome 90+** (primary - 60% users)
- **Firefox 88+** (secondary - 15% users)
- **Safari 14+** (macOS/iOS - 20% users) - Verify backdrop-filter support
- **Edge 90+** (Windows - 5% users) - Chromium-based, similar to Chrome

**NOT Supported:**
- ❌ Internet Explorer 11 (deprecated, <1% users)
- ❌ Chrome <90, Firefox <88, Safari <14 (too old for modern CSS)

**Cross-Browser Testing Matrix:**
```
Browsers × Breakpoints:
- Chrome (latest) × 5 breakpoints (320px, 768px, 1024px, 1440px, 1920px)
- Firefox (latest) × 5 breakpoints
- Safari (latest) × 5 breakpoints
- Edge (latest) × 5 breakpoints

= 20 test scenarios total
```

---

## Device Support

**Decision:** Desktop Primary, Mobile Functional

**Rationale:**
- **Desktop (1440px+):** Primary use case for reflection journaling
- **Mobile (375px+):** Responsive design tested, functional but not primary focus
- **Tablet (768px):** Medium priority, verify layout adapts

**Device Targets:**
```
Desktop: 1440px+ (primary)
  - Target: 60fps animations, full feature set
  - Test: Chrome DevTools responsive mode + real monitor

Laptop: 1024px+ (secondary)
  - Target: Same as desktop, slightly smaller spacing
  - Test: MacBook Pro 13", Chrome DevTools

Tablet: 768px (tertiary)
  - Target: Mobile web, stacked layout
  - Test: iPad (real device), Chrome DevTools responsive mode

Mobile: 375px+ (functional)
  - Target: iPhone 12/13/14 size, touch interactions
  - Test: iPhone SE (real device), Chrome DevTools responsive mode

Small Mobile: 320px (minimum)
  - Target: iPhone SE, smallest supported screen
  - Test: Chrome DevTools responsive mode, verify no horizontal scroll
```

---

## Development Tools

**Decision:** Manual Profiling, No CI/CD Changes

**Code Quality:**
- **Linter:** ESLint (existing, no changes)
- **Formatter:** Prettier (assumed, standard Next.js setup)
- **Type Checking:** TypeScript strict mode (no changes)

**Build & Deploy:**
- **Build tool:** Next.js built-in (no webpack config needed)
- **Deployment target:** Vercel (assumed, standard Next.js deployment)
- **CI/CD:** None (manual testing only, no Lighthouse CI)

**Performance Profiling:**
- **Chrome DevTools Performance panel:** 60fps validation, LCP/FID measurement
- **Lighthouse CLI:** Manual runs on localhost (`npx lighthouse http://localhost:3000`)
- **Bundle analyzer:** `npm run build` output inspection

---

## Environment Variables

No new environment variables required for Iteration 11 (purely frontend polish).

**Existing Variables (No Changes):**
- `DATABASE_URL` - PostgreSQL connection (backend, not touched)
- `NEXTAUTH_SECRET` - Authentication (backend, not touched)
- `OPENAI_API_KEY` - AI reflections (backend, not touched)

---

## Dependencies Overview

**Zero New Dependencies** - All required packages already installed.

**Key Packages (No Version Changes):**
```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.26",
    "framer-motion": "11.18.2",
    "tailwindcss": "3.4.1",
    "react-markdown": "10.1.0",
    "remark-gfm": "4.0.1",
    "clsx": "2.1.0",
    "tailwind-merge": "2.2.1"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/react": "18.3.26",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

**Total Bundle Size Impact:** 0 KB (no new dependencies)

---

## Security Considerations

**Markdown Rendering (XSS Prevention):**
- **Library:** `react-markdown` v10.1.0 (already installed)
- **Security:** Sanitizes HTML by default, prevents XSS attacks
- **Configuration:** Use default settings, no custom renderers that could introduce vulnerabilities

**Reduced Motion (User Safety):**
- **WCAG 2.1 Success Criterion 2.3.3:** Animation from Interactions
- **Implementation:** Respect `prefers-reduced-motion` media query
- **Impact:** Prevents triggering motion sickness, seizures in sensitive users

**Accessibility (Legal Compliance):**
- **Standard:** WCAG 2.1 AA (ADA compliance)
- **Risk:** Legal liability if accessibility failures present
- **Mitigation:** Manual accessibility validation, contrast checks, keyboard testing

---

## Migration Notes

**No Migrations Required** - Iteration 11 is purely frontend polish.

**No Breaking Changes:**
- All existing features continue to work
- Design system extensions backward-compatible
- Animation variants additive (no removals)

**Regression Testing Required:**
- Dreams: Create, edit, archive (existing features)
- Reflections: Create, view, filter (existing features)
- Evolution: Generate report, view insights (existing features)
- Visualizations: View charts (existing features)

---

## Tech Stack Summary

| Category | Technology | Version | Status | Notes |
|----------|-----------|---------|--------|-------|
| **Framework** | Next.js | 14.2.0 | No changes | App Router, Server Components |
| **Animation** | Framer Motion | 11.18.2 | Extend variants | Add 4 new variants |
| **Styling** | Tailwind CSS | 3.4.1 | Audit only | Semantic palette enforcement |
| **Type Safety** | TypeScript | 5.9.3 | No changes | Strict mode maintained |
| **Markdown** | react-markdown | 10.1.0 | No changes | XSS-safe rendering |
| **Testing** | Manual Only | N/A | No automation | Chrome DevTools, screen readers |
| **Accessibility** | WCAG 2.1 AA | Standard | Compliance required | Keyboard, contrast, reduced motion |
| **Performance** | Core Web Vitals | LCP <2.5s, FID <100ms | Targets set | 60fps animations |
| **Browsers** | Latest 4 | Chrome/Firefox/Safari/Edge | Manual testing | 95%+ user coverage |

---

**Tech Stack Status:** MATURE - Zero new dependencies, all patterns proven, ready for systematic polish.
