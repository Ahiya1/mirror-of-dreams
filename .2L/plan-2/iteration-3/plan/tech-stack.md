# Technology Stack - Iteration 3: Secondary Pages & Polish

## Overview

This iteration requires **ZERO new dependencies**. All technology is already in place from Iterations 1 & 2. This is purely a frontend migration and polish phase using existing tools.

---

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**Rationale:**
- Already used throughout the application
- File-based routing simplifies page organization
- Server components optimize initial page loads
- App Router template.tsx enables global page transitions
- No changes needed for this iteration

**Version:** 14.x (as installed)

**Usage in Iteration 3:**
- Use app/template.tsx for page transitions (new file)
- Preserve existing page.tsx files for Evolution/Visualizations
- Leverage `next/navigation` hooks (usePathname)

---

## Styling

**Decision:** Tailwind CSS 3.4.1 (existing, extended config)

**Rationale:**
- Already configured with full mirror design system
- Extended with 15+ blue/purple shades
- Custom gradients, blur utilities, glow shadows defined
- No new configuration needed
- Excellent performance (purges unused CSS)

**Existing Configuration Highlights:**
```javascript
// tailwind.config.ts (already configured)
theme: {
  extend: {
    colors: {
      'mirror-dark': '#0f172a',
      'mirror-midnight': '#1e293b',
      'mirror-blue': '#3b82f6',
      'mirror-purple': '#a855f7',
      'mirror-violet': '#8b5cf6',
      // ... 10+ more colors
    },
    backgroundImage: {
      'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-primary': 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
      'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
    },
    backdropBlur: {
      'glass-sm': '8px',
      'glass': '16px',
      'glass-lg': '24px',
    },
    boxShadow: {
      'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
      'glow-electric': '0 0 30px rgba(59, 130, 246, 0.4)',
    },
  }
}
```

**Usage in Iteration 3:**
- Apply existing Tailwind classes to Evolution/Visualizations pages
- Use `cn()` utility for class merging (already imported)
- No new Tailwind configuration needed

---

## Animation Library

**Decision:** Framer Motion 11.18.2 (existing)

**Rationale:**
- Already integrated throughout the application
- Comprehensive animation variant library exists (10 variants)
- `useReducedMotion` hook built-in for accessibility
- Performance-optimized (GPU-accelerated transforms)
- All patterns established in Iterations 1 & 2

**Existing Variant Library:**
```typescript
// lib/animations/variants.ts (already defined)
- cardVariants (entrance + hover)
- glowVariants (box-shadow animations)
- staggerContainer + staggerItem (list animations)
- modalOverlayVariants + modalContentVariants
- pulseGlowVariants (continuous glow pulse)
- rotateVariants (for loaders)
- fadeInVariants, slideUpVariants
```

**Usage in Iteration 3:**
- Use existing variants for Evolution/Visualizations pages
- Implement page transitions with AnimatePresence
- Apply hover animations using whileHover
- Respect useReducedMotion throughout

**Performance Characteristics:**
- Bundle size: ~60 KB gzipped (already included)
- GPU-accelerated: transform, opacity only
- No layout thrashing: avoid width/height/margin animations

---

## Icon Library

**Decision:** Lucide React 0.546.0 (existing)

**Rationale:**
- Already used throughout the application
- Clean, modern icon set
- Tree-shakeable (only imports used icons)
- Consistent 24x24 sizing
- No changes needed

**Usage in Iteration 3:**
- Use existing icons (X, AlertTriangle, etc.)
- Import only needed icons for Evolution/Visualizations pages
- Maintain consistent sizing (w-4 h-4 for small, w-6 h-6 for large)

---

## Glass Component Library

**Decision:** Custom glass components (10 components, built in Iteration 1)

**Components Available:**
1. **GlassCard** - Base glass card with blur backdrop
2. **GlowButton** - Button with gradient background and glow
3. **CosmicLoader** - Animated gradient ring loader
4. **DreamCard** - Dream display card (specialized GlassCard)
5. **GradientText** - Text with gradient effect
6. **GlassModal** - Modal with glass overlay
7. **FloatingNav** - Glass navigation bar
8. **ProgressOrbs** - Multi-step progress indicator
9. **GlowBadge** - Status badges with glow
10. **AnimatedBackground** - Subtle animated gradient background
11. **GlassInput** - Glass-styled input field (added in Iteration 2)

**Component Props Interface:**
```typescript
// types/glass-components.ts (already defined)
GlassCardProps {
  variant: 'default' | 'elevated' | 'inset'
  glassIntensity: 'subtle' | 'medium' | 'strong'
  glowColor: 'purple' | 'blue' | 'cosmic' | 'electric'
  hoverable: boolean
  animated: boolean
  className?: string
  children: React.ReactNode
}

GlowButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}
```

**Usage in Iteration 3:**
- Import from `@/components/ui/glass`
- Use barrel export: `import { GlassCard, GlowButton, ... } from '@/components/ui/glass'`
- Apply to Evolution/Visualizations pages
- Enhance with ARIA attributes (Builder-2 task)

**NO NEW COMPONENTS NEEDED** - All necessary components exist.

---

## TypeScript

**Decision:** TypeScript 5.x (existing, strict mode)

**Rationale:**
- Already configured with strict mode
- All glass components fully typed
- tRPC provides end-to-end type safety
- No configuration changes needed

**Usage in Iteration 3:**
- Maintain existing type safety standards
- Use existing type definitions
- No new types needed for page migrations
- All component props already typed

---

## Testing Strategy

**Decision:** Manual testing only (no new testing dependencies)

**Rationale:**
- Explorers recommended manual testing for MVP
- Automated accessibility testing (axe-core) deferred to post-MVP
- Visual regression testing (Playwright, Chromatic) deferred
- Manual testing sufficient for glass component migration and polish

**Testing Approach:**

**Browser Testing:**
- Chrome 90+ (primary)
- Safari 14+ (secondary, backdrop-filter compatibility)
- Firefox 88+ (tertiary, performance validation)

**Device Testing:**
- Desktop: 1920x1080, 1366x768
- Tablet: iPad (768x1024)
- Mobile: iPhone SE (375x667), budget Android

**Accessibility Testing:**
- Keyboard navigation: Tab order, focus states
- Screen reader: VoiceOver (Mac), NVDA (Windows)
- Reduced motion: Toggle OS setting, verify instant animations
- Contrast: WebAIM Contrast Checker

**Performance Testing:**
- Lighthouse audit: Target >85 all categories
- Chrome DevTools Performance: 60fps desktop, 30fps mobile
- Bundle size: `npm run build` output verification

---

## Performance Budget

**Decision:** Maintain existing performance targets (no new budget needed)

**Targets:**
- First Load JS: <200 kB per page
- Lighthouse Performance: >85
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Animation FPS: 60fps desktop, 30fps mobile

**Current Performance (Iteration 2):**
- Dashboard: 186 kB First Load JS (✓ PASS)
- Dreams: 167 kB First Load JS (✓ PASS)
- Reflection: 174 kB First Load JS (✓ PASS)
- Estimated Evolution/Visualizations: ~170-180 kB (within budget)

**Monitoring:**
```bash
# Build and check bundle sizes
npm run build

# Output includes:
# Route (app)              Size     First Load JS
# ○ /dashboard             45 kB          186 kB
# ○ /dreams                30 kB          167 kB
# ○ /evolution             ~40 kB         ~180 kB (estimated)
# ○ /visualizations        ~35 kB         ~175 kB (estimated)
```

**No optimization needed** - Existing bundle sizes are healthy.

---

## Browser Compatibility

**Decision:** Target modern browsers (2019+)

**Backdrop-Filter Support:**
- Chrome 76+ (2019): Full support
- Safari 9+ (2015): Full support
- Firefox 70+ (2019): Full support

**Fallback Strategy:**
```css
/* Add to GlassCard component if needed */
@supports not (backdrop-filter: blur(16px)) {
  .glass-fallback {
    background: rgba(30, 41, 59, 0.95); /* Solid background */
  }
}
```

**Implementation:** Add fallback if user reports render issues on older browsers (defer to post-MVP).

---

## Accessibility Standards

**Decision:** WCAG AA compliance foundation (not full certification)

**Standards Applied:**

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Visible focus indicators (focus-visible:ring-2)
- Escape key closes modals

**ARIA Attributes (new in Iteration 3):**
- `role="status"` on CosmicLoader
- `aria-label` on icon-only buttons
- `aria-current="page"` on active navigation links
- `aria-live="polite"` on toast notifications

**Reduced Motion Support:**
- `useReducedMotion` hook in all animated components
- Instant animations when `prefers-reduced-motion` is set
- No critical functionality depends on animations

**Contrast Ratios:**
- Target: 4.5:1 for normal text, 3:1 for large text
- Verify with WebAIM Contrast Checker
- Use white text for critical information
- Use colored text for accents only

**Focus Trap (deferred):**
- HeadlessUI Dialog for modals (requires new dependency)
- Defer to post-MVP accessibility iteration

---

## Environment Variables

**No new environment variables needed.**

Existing variables from previous iterations:
- `DATABASE_URL` (Supabase connection)
- `ANTHROPIC_API_KEY` (Claude API)
- `NEXTAUTH_SECRET` (authentication)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

All backend functionality preserved - frontend-only changes.

---

## Dependencies Summary

**Core Dependencies (Already Installed):**
```json
{
  "framer-motion": "11.18.2",
  "lucide-react": "0.546.0",
  "tailwindcss": "3.4.1",
  "tailwindcss-animate": "1.0.7",
  "tailwind-merge": "2.2.1",
  "next": "14.x"
}
```

**NO NEW DEPENDENCIES REQUIRED** for Iteration 3.

**Optional Dependencies (Deferred to Post-MVP):**
- `@headlessui/react` - Focus trap for modals (accessibility)
- `@axe-core/react` - Automated accessibility testing (dev only)

---

## Build & Deploy

**Build Tool:** Next.js built-in (already configured)

**Build Command:**
```bash
npm run build
```

**Deployment Target:** Vercel/Netlify/Cloud platform (existing setup)

**CI/CD:** Not required for MVP (manual deployment acceptable)

**Build Verification:**
```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Check bundle sizes in output
# 4. Verify no console errors

# 5. Start production server locally
npm run start
```

---

## Performance Optimization Techniques

**Already Implemented:**

1. **Code Splitting:**
   - Next.js automatic page-based splitting
   - Shared chunks optimized (87 kB)

2. **Tree Shaking:**
   - Lucide icons (only imports used icons)
   - Tailwind CSS (purges unused classes)

3. **GPU Acceleration:**
   - Framer Motion uses transform/opacity only
   - No layout-triggering animations (width/height/margin)

4. **Reduced Motion:**
   - useReducedMotion hook throughout
   - Instant animations for accessibility

5. **Image Optimization:**
   - Next.js Image component (if images added to Evolution/Visualizations)

**New in Iteration 3:**

**Page Transitions:**
- Lightweight (opacity + transform only)
- AnimatePresence mode="wait" prevents overlap
- Respects reduced motion preference

**Micro-Interactions:**
- CSS transitions for simple hover effects
- Framer Motion for complex animations
- No animation overload (max 2-3 simultaneous animations)

---

## Security Considerations

**Frontend-Only Changes:**
- No new API endpoints
- No database schema changes
- No authentication changes
- All tRPC queries/mutations preserved

**Client-Side Security:**
- No user input sanitization needed (existing forms unchanged)
- No XSS vulnerabilities (React auto-escapes)
- No CSRF concerns (tRPC handles CSRF tokens)

**Accessibility & Security:**
- Proper focus management prevents keyboard traps
- Screen reader support improves security for visually impaired users
- Reduced motion support prevents seizure triggers

---

## Summary

**Technology Decisions:**

1. **Use existing stack** - No new dependencies required
2. **Frontend-only changes** - No backend/database modifications
3. **Performance-first** - Maintain <200 kB bundle budget
4. **Accessibility-aware** - WCAG AA foundation
5. **Browser-compatible** - Modern browsers (2019+) with fallbacks

**Key Strengths:**

- Zero dependency risk (everything already installed)
- Proven stack from Iterations 1 & 2
- Comprehensive glass component library
- Strong performance budget
- Mature accessibility foundation

**Result:** Low-risk, high-polish iteration using battle-tested tools.
