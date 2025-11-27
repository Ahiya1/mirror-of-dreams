# Technology Stack - Iteration 3

## Core Framework

**Decision:** Next.js 14 (App Router) - NO CHANGES

**Rationale:**
- Already in production with solid performance (90+ Lighthouse)
- App Router provides server components for optimal landing page performance
- File-based routing simplifies page structure
- Built-in Image optimization for landing page assets

**Current Version:** Next.js 14.x (verify exact version in package.json)

**Alternatives Considered:**
- None - framework change out of scope for iteration 3

---

## Component Library Strategy

### Which Components to Use/Enhance

**Production-Ready (Use As-Is):**

1. **GlassCard** (`components/ui/glass/GlassCard.tsx`)
   - Use for: Landing page feature cards, auth page containers
   - Props: `elevated={true}` for navigation, `interactive={true}` for feature cards
   - No modifications needed

2. **CosmicLoader** (`components/ui/glass/CosmicLoader.tsx`)
   - Use for: Reflection loading overlay, page loading states
   - Sizes: `lg` for full-page overlay, `sm` for inline button
   - No modifications needed

3. **GradientText** (`components/ui/glass/GradientText.tsx`)
   - Use for: Landing page headlines, feature card titles
   - No modifications needed

4. **CosmicBackground** (`components/shared/CosmicBackground.tsx`)
   - Use for: ALL entry points (landing, signin, signup)
   - Props: `animated={true}` for landing, `intensity={1}` for standard
   - No modifications needed

**Components Requiring Enhancement:**

1. **GlowButton** (`components/ui/glass/GlowButton.tsx`)
   - **Current limitations:** Simple opacity change on hover, no shimmer, no lift effect
   - **Enhancement needed:** Add cosmic variant matching signin cosmic-button pattern
   - **New features to add:**
     - Shimmer animation (::before pseudo-element)
     - Hover lift (transform: translateY(-3px))
     - Glow shadow (box-shadow with purple gradient)
     - Gradient background shift on hover
     - Loading state integration (spinner + disabled)
   - **Keep existing:** primary/secondary/ghost variants, size variants (sm/md/lg)
   - **Implementation:** ADDITIVE ONLY - new `cosmic` variant, don't modify existing

2. **GlassInput** (`components/ui/glass/GlassInput.tsx`)
   - **Current limitations:** Text/textarea only, no password/email, no error states
   - **Enhancement needed:** Full form input support for auth pages
   - **New features to add:**
     - Type prop: `'text' | 'email' | 'password' | 'textarea'`
     - Error state: `error?: string` prop (red border + error message below)
     - PasswordToggle integration for password variant
     - Validation props: `required?: boolean`, `pattern?: string`, `minLength?: number`
     - AutoComplete prop: `autoComplete?: string`
     - Responsive clamp() padding (match signin quality)
     - Multi-layer gradient background (match signin quality)
   - **Keep existing:** Character counter, label support, focus animations
   - **Implementation:** EXTEND existing component, maintain backward compatibility

**New Components to Create:**

1. **NavigationBase** (`components/shared/NavigationBase.tsx`)
   - **Purpose:** Shared base for all navigation variants
   - **Features:** GlassCard container, logo, mobile toggle, layout structure
   - **Props:** `children` (nav content), `transparent?: boolean`, `className?: string`
   - **Extracted from:** AppNavigation.tsx (lines 72-100)

2. **LandingNavigation** (`components/shared/LandingNavigation.tsx`)
   - **Purpose:** Minimal navigation for landing page
   - **Features:** Logo + "Sign In" link, transparent mode for hero overlap
   - **Extends:** NavigationBase
   - **Mobile:** Hamburger menu (just Sign In link, no full menu)

3. **AuthLayout** (`components/auth/AuthLayout.tsx`)
   - **Purpose:** Shared layout wrapper for signin/signup pages
   - **Features:** CosmicBackground, centered container (max-width 480px), consistent padding
   - **Props:** `children` (form content), `title?: string`

4. **LandingHero** (`components/landing/LandingHero.tsx`)
   - **Purpose:** Hero section for landing page
   - **Features:** Large headline (GradientText), subheadline, dual CTAs (GlowButton)
   - **Responsive:** Mobile stacks vertically, desktop horizontal layout
   - **Animation:** Scroll-triggered fade-in (Framer Motion)

5. **LandingFeatureCard** (`components/landing/LandingFeatureCard.tsx`)
   - **Purpose:** Feature highlight card
   - **Features:** Icon/emoji, headline (gradient), description, optional CTA link
   - **Uses:** GlassCard as base with `interactive={true}`
   - **Animation:** Hover lift + glow

---

## Styling Approach

### Design System Enforcement

**Current State (Fragmented):**
- Landing: portal.css (155 lines, isolated system)
- Signin: styled-jsx (340+ lines inline CSS)
- Signup: Tailwind utilities (inconsistent with signin)

**Target State (Unified):**
- **All pages:** Tailwind CSS utilities + CSS custom properties
- **Remove:** portal.css (DELETE file)
- **Remove:** styled-jsx in auth pages (replace with components)
- **Consolidate:** All styles use design system variables

**Design System Files:**
1. `styles/variables.css` - CSS custom properties (colors, spacing, typography)
2. `styles/globals.css` - Global styles, utility classes
3. `tailwind.config.ts` - Tailwind theme configuration

**New Additions:**
- Add `nav: '80px'` to Tailwind spacing (for navigation padding fix)
- No other design system changes needed

### Component Styling Pattern

**Standard Pattern (for all new components):**

```tsx
import { cn } from '@/lib/utils'; // Tailwind merge utility

interface ComponentProps {
  className?: string;
  // ... other props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn(
      // Base styles (Tailwind utilities)
      "flex items-center justify-center",
      "bg-white/5 backdrop-blur-crystal",
      "border border-white/10 rounded-xl",
      "p-6",
      // Responsive
      "sm:p-8",
      // Animations
      "transition-all duration-300",
      // Allow overrides
      className
    )}>
      {/* Content */}
    </div>
  );
}
```

**Why This Pattern:**
- Tailwind utilities for rapid development
- CSS variables for themeable values
- `cn()` utility for class merging (prevents conflicts)
- Explicit responsive breakpoints
- Animation via Tailwind transition classes

---

## Background Component Decision

**Decision:** CosmicBackground (components/shared/CosmicBackground.tsx)

**Why CosmicBackground (NOT MirrorShards):**

**CosmicBackground Advantages:**
1. **Performance:** CSS animations only (no complex clip-path)
2. **Consistency:** Already used on all authenticated pages
3. **Accessibility:** Respects prefers-reduced-motion automatically
4. **Visual quality:** 4-layer depth system (gradient + starfield + nebula + particles)
5. **Configurable:** `intensity` prop allows toning down for readability
6. **GPU-accelerated:** Smooth 60fps animations

**MirrorShards Issues:**
1. **Performance:** 5 mirrors with backdrop-filter blur (expensive on Safari)
2. **Inconsistency:** Only used on landing page (isolated)
3. **Accessibility:** Hover state doesn't respect reduced-motion
4. **Visual disconnect:** Angular/geometric vs cosmic/nebulous app aesthetic
5. **Complexity:** 180 lines, complex animations, clip-path polygons

**Implementation:**
```tsx
import CosmicBackground from '@/components/shared/CosmicBackground';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <CosmicBackground animated={true} intensity={1} />
      {/* Page content with relative z-index */}
    </div>
  );
}
```

**Delete:**
- `components/portal/MirrorShards.tsx` (180 lines)
- Related portal.css styles
- All MirrorShards imports

---

## Animation Strategy

### Framer Motion Usage

**Decision:** Use Framer Motion 11.18.2 for all animations

**Why Framer Motion:**
- Already installed (60KB gzipped, acceptable for animation-heavy app)
- Declarative API (cleaner than imperative animations)
- Built-in prefers-reduced-motion support
- GPU-accelerated by default
- AnimatePresence for smooth mount/unmount

**Animation Patterns:**

**1. Page Load Fade-In**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {/* Page content */}
</motion.div>
```

**2. Stagger Animation (Feature Cards)**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms delay between cards
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {features.map((feature) => (
    <motion.div key={feature.id} variants={itemVariants}>
      <LandingFeatureCard {...feature} />
    </motion.div>
  ))}
</motion.div>
```

**3. Loading Overlay Fade**
```tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isSubmitting && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50"
    >
      <CosmicLoader size="lg" />
    </motion.div>
  )}
</AnimatePresence>
```

**4. Scroll-Triggered Animation**
```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const ref = useRef(null);
const isInView = useInView(ref, { once: true });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.6 }}
>
  {/* Content */}
</motion.div>
```

**Performance Budget:**
- 60fps target for all animations
- GPU-accelerated transforms only (translateX/Y/Z, scale, rotate, opacity)
- Avoid: width/height animations, layout thrashing
- Respect prefers-reduced-motion (Framer Motion does automatically)

### CSS Animation Fallback

**When to use CSS animations (instead of Framer Motion):**
- Simple hover states (button lift, card glow)
- Infinite loops (CosmicLoader spinning)
- Static page elements (no mount/unmount)

**Example: Button Hover**
```css
.cosmic-button {
  transition: transform 0.2s ease-out, box-shadow 0.3s ease-out;
}

.cosmic-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(147, 51, 234, 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .cosmic-button {
    transition: none;
  }
  .cosmic-button:hover {
    transform: none;
  }
}
```

---

## CSS Organization

### Remove portal.css

**File to DELETE:** `styles/portal.css` (155 lines)

**Why Remove:**
1. Isolated system not used elsewhere
2. Accessibility violations (outline: none !important)
3. Portal-specific reset conflicts with globals.css
4. High contrast mode overrides not needed
5. Print styles not relevant for landing page

**Migration Strategy:**
- Replace all portal.css classes with Tailwind utilities
- Use CosmicBackground component (not portal gradient)
- Use GlassCard for feature cards (not portal-specific glass styles)
- Use GlowButton for CTAs (not portal button styles)

### Consolidate into globals.css

**Current Structure:**
```
styles/
  ├── globals.css       # Base styles, Tailwind directives
  ├── variables.css     # CSS custom properties
  ├── portal.css        # DELETE THIS
  └── mirror.css        # Reflection output styles (keep)
```

**Target Structure:**
```
styles/
  ├── globals.css       # Base styles, Tailwind directives
  ├── variables.css     # CSS custom properties (add --nav-height: 80px)
  └── mirror.css        # Reflection output styles (keep)
```

**Changes to variables.css:**
```css
/* Add navigation height variable */
--nav-height: 80px;

/* Existing variables remain unchanged */
--space-xl: clamp(2rem, 4vw, 3rem);
--text-lg: clamp(1.1rem, 3vw, 1.4rem);
/* ... etc */
```

**Changes to tailwind.config.ts:**
```ts
theme: {
  extend: {
    spacing: {
      'nav': '80px', // Navigation bar height for padding
    },
    // Existing config unchanged
  }
}
```

---

## External Integrations

### No New Integrations

**Iteration 3 uses existing integrations only:**

1. **tRPC** (already integrated)
   - Used for: Reflection creation mutation
   - Endpoint: `trpc.reflection.create.useMutation()`
   - No changes needed

2. **Supabase Auth** (already integrated)
   - Used for: Signin/signup authentication
   - Endpoints: `trpc.auth.signin`, `trpc.auth.signup`
   - No changes needed

3. **Next.js Router** (already integrated)
   - Used for: Page navigation, redirects
   - No changes needed

**No new packages, no new API integrations required.**

---

## Development Tools

### Testing

**Framework:** Manual testing + Lighthouse audits

**Coverage target:** N/A (no automated tests in iteration 3)

**Strategy:**
1. Manual testing on 5 viewports (320px, 390px, 768px, 1024px, 1920px)
2. Cross-browser testing (Chrome, Safari, Firefox, Edge)
3. Lighthouse audits (Performance 90+, Accessibility 90+)
4. Keyboard navigation testing (Tab, Enter, Escape)
5. Screen reader testing (VoiceOver or NVDA)

**Testing Checklist (per page):**
- [ ] Visual regression (screenshot before/after)
- [ ] Mobile responsive (5 viewports)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Loading states appear correctly
- [ ] Error states display properly
- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 90+

### Code Quality

**Linter:** ESLint (already configured)
**Formatter:** Prettier (already configured)
**Type Checking:** TypeScript strict mode

**Pre-commit checks:**
```bash
npm run lint        # ESLint
npm run type-check  # TypeScript compilation
npm run build       # Next.js build (catches runtime errors)
```

**No new linting rules needed for iteration 3.**

### Build & Deploy

**Build tool:** Next.js built-in (no changes)

**Deployment target:** Vercel or Netlify (auto-deploy on main push)

**CI/CD:** None required for iteration 3 (manual verification)

**Build command:**
```bash
npm run build
npm run start  # Local production test
```

**Environment Variables (No Changes):**
- Existing vars remain (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- No new env vars needed for iteration 3

---

## Environment Variables

**No new environment variables required.**

**Existing variables (unchanged):**
- `DATABASE_URL` - Supabase PostgreSQL connection
- `NEXTAUTH_URL` - NextAuth.js base URL
- `NEXTAUTH_SECRET` - NextAuth.js session secret
- `OPENAI_API_KEY` - AI reflection generation
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

---

## Dependencies Overview

**No new dependencies required.**

**Key existing packages (verify versions in package.json):**

| Package | Current Version | Purpose | Iteration 3 Usage |
|---------|----------------|---------|-------------------|
| `next` | 14.x | Framework | Landing, auth pages |
| `react` | 18.3.1 | UI library | All components |
| `tailwindcss` | 3.4.1 | Styling | All pages |
| `framer-motion` | 11.18.2 | Animations | Landing scroll, loading overlay |
| `@trpc/client` | Latest | API client | Reflection mutation |
| `typescript` | Latest | Type safety | All TypeScript files |

**Bundle size impact:** Minimal (no new dependencies)

**Performance impact:** None (optimizing existing components)

---

## Performance Targets

**Lighthouse Metrics (All Entry Points):**

| Metric | Target | Current (Baseline) | Priority |
|--------|--------|-------------------|----------|
| Performance | 90+ | ~90 (maintain) | P0 |
| Accessibility | 90+ | ~85 (improve) | P0 |
| Best Practices | 95+ | ~95 (maintain) | P1 |
| SEO | 95+ | ~90 (improve) | P2 |

**Core Web Vitals:**

| Metric | Target | Measurement Point |
|--------|--------|------------------|
| Largest Contentful Paint (LCP) | < 2.5s | Landing page hero image/text |
| First Input Delay (FID) | < 100ms | Button clicks, form inputs |
| Cumulative Layout Shift (CLS) | < 0.1 | No layout shifts during load |

**Landing Page Specific:**
- Hero section visible within 1.5s
- Feature cards loaded within 2.0s
- Interactive within 2.5s (button clicks work)
- Smooth 60fps scroll animations

**Auth Pages Specific:**
- Form inputs focusable within 1.0s
- Button hover states responsive (< 16ms)
- No flash of unstyled content (FOUC)

**Reflection Loading Overlay:**
- Overlay appears within 100ms of button click
- CosmicLoader animates at 60fps
- Minimum 500ms display time (prevent flash)
- Transition to output page smooth (< 300ms)

---

## Security Considerations

**No security changes in iteration 3 (UI-only work).**

**Existing security maintained:**
1. **Authentication:** Supabase secure auth flow (no changes)
2. **CSRF protection:** NextAuth.js CSRF tokens (no changes)
3. **XSS prevention:** React auto-escapes (no changes)
4. **SQL injection:** tRPC + Prisma parameterized queries (no changes)

**Frontend-specific security:**
1. **No inline styles with user input** - All styles are static
2. **No dangerouslySetInnerHTML with user input** - Reflection output uses trusted AI response only
3. **No external script loading** - All scripts bundled
4. **HTTPS enforced** - Vercel/Netlify default

**Focus states (accessibility = security):**
- All interactive elements have visible focus indicators
- Keyboard navigation works (prevents UI-based phishing)
- Screen readers announce actions (prevents confusion attacks)

---

**Tech Stack Status:** READY
**New Dependencies:** NONE
**Breaking Changes:** NONE (additive enhancements only)
**Performance Budget:** Maintained (90+ Lighthouse Performance)
**Accessibility Target:** 90+ Lighthouse Accessibility (improved from ~85)

---

*All technology decisions support the core mission: unify entry points with existing design system, fix blocking UX issues, maintain performance and accessibility.*
