# Technology Stack - Core Pages Redesign

## Core Framework

**Decision:** Next.js 14 (existing, no changes)

**Rationale:**
- Already in production with solid performance (143KB First Load JS)
- App router architecture supports client/server component split
- Built-in optimizations (image optimization, code splitting) working well
- No reason to change framework for styling refactoring

**Version:** Next.js 14.x (existing installation)

**No Changes Required:** Framework layer remains untouched

---

## Styling System

**Decision:** Tailwind CSS + Custom Glass Design System (from Iteration 1)

**Rationale:**
- Glass design system already built and validated in Iteration 1
- Tailwind extended with 15+ mirror colors, 5 gradients, 6 glow shadows
- Incremental migration from inline styled-jsx to Tailwind utilities
- Type-safe with TypeScript interfaces for all glass components
- Performance-conscious (transform/opacity animations only)

**Tailwind Version:** 3.x (existing)

**Custom Extensions (Already Configured):**
```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      mirror: {
        dark: '#0f172a',
        midnight: '#1e293b',
        blue: '#3b82f6',
        purple: '#a855f7',
        violet: '#8b5cf6',
        indigo: '#6366f1',
        sky: '#0ea5e9',
        cyan: '#06b6d4',
        // ... 7 more shades
      }
    },
    backgroundImage: {
      'gradient-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-primary': 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      'gradient-dream': 'radial-gradient(circle at top right, #a855f7, transparent)',
      'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      'gradient-glow': 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(147, 51, 234, 0.25))',
    },
    backdropBlur: {
      'glass-sm': '8px',
      'glass': '16px',
      'glass-lg': '24px',
    },
    boxShadow: {
      'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
      'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
      'glow-electric': '0 0 30px rgba(59, 130, 246, 0.4)',
      'glow-gold': '0 0 25px rgba(251, 191, 36, 0.3)',
      'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
    },
    animation: {
      'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      'float-slow': 'float 8s ease-in-out infinite',
      'shimmer': 'shimmer 2s linear infinite',
      'spin-slow': 'spin 3s linear infinite',
      'fade-in': 'fadeIn 0.5s ease-out',
      'slide-up': 'slideUp 0.4s ease-out',
    }
  }
}
```

**Strategy:** Preserve existing CSS variables system (cosmic theme) and layer glass components on top

---

## Animation Library

**Decision:** Framer Motion 11.x for all component animations

**Rationale:**
- Already installed and validated in Iteration 1 (11.18.2)
- Provides smooth, performant animations (60fps on desktop, 30fps on mobile)
- Built-in reduced motion support via `useReducedMotion()` hook
- Animation variants library already created (10 reusable patterns)
- Type-safe with TypeScript
- Significantly better DX than CSS keyframe animations for complex interactions

**Version:** framer-motion@11.18.2 (installed)

**Animation Variants Available:**
- `cardVariants` - Card entrance/exit animations
- `buttonVariants` - Button hover/tap animations
- `modalVariants` - Modal open/close animations
- `fadeInUpVariants` - Fade in from bottom
- `scaleInVariants` - Scale entrance
- `slideInVariants` - Slide from side
- `glowPulseVariants` - Pulsing glow effect
- `floatVariants` - Floating animation
- `shimmerVariants` - Shimmer effect
- `staggerContainerVariants` - Stagger children animations

**Implementation Notes:**
- Use `motion.div`, `motion.button` for animated elements
- Wrap with `AnimatePresence` for exit animations
- Apply `useReducedMotion()` hook in all animated components
- Disable glass component animations where custom animations exist (Dashboard stagger)

---

## Glass Component Library

**Decision:** Use 10 pre-built glass components from Iteration 1

**Rationale:**
- All components production-ready and validated
- Type-safe TypeScript interfaces
- Accessibility built-in (ARIA labels, focus management, reduced motion)
- Consistent design language across app
- Performance-tested (Lighthouse >90)

**Available Components:**

1. **GlassCard** - Base glassmorphism card
   - 3 variants: default, elevated, inset
   - 4 glow colors: purple, blue, gold, cyan
   - Hoverable prop for elevation on hover
   - Glass intensity control: subtle, medium, strong

2. **GlowButton** - Glowing button variants
   - 3 variants: primary, secondary, ghost
   - 3 sizes: sm, md, lg
   - Disabled state handling
   - Loading state support
   - Focus ring for accessibility

3. **GradientText** - Gradient text component
   - Multiple variants: hero, title, subtitle, accent
   - Animated gradient option
   - Responsive font sizing

4. **GlassDreamCard** (renamed from DreamCard)
   - Specialized dream display card
   - Category-based gradient borders
   - Status badges with glow
   - Action button integration

5. **GlassModal** - Modal with glass overlay
   - Dark blur backdrop
   - Centered glass content card
   - Fade + scale entrance animation
   - Close button with ARIA label
   - Glass intensity control

6. **FloatingNav** - Glass navigation bar
   - Fixed positioning with blur backdrop
   - Active state indicators
   - Responsive breakpoint support
   - Scroll-based blur intensity (can add)

7. **CosmicLoader** - Animated loading indicator
   - Rotating gradient ring
   - 3 sizes: sm, md, lg
   - Reduced motion support
   - Gradient color variants

8. **ProgressOrbs** - Multi-step progress indicator
   - Glowing dot indicators
   - Animated transitions between steps
   - Completed/current/upcoming states
   - Customizable step count

9. **GlowBadge** - Status badges with glow
   - 4 variants: success, warning, error, info
   - Custom glow color support
   - Icon integration
   - Size variants

10. **AnimatedBackground** - Subtle animated gradient background
    - Tone-based variants (cosmic, dream, fusion, gentle, intense)
    - Floating particles option
    - Parallax scroll effect (optional)
    - Performance-optimized

**Component Location:** `/components/ui/glass/`

**Barrel Export:** All components exported from `/components/ui/glass/index.ts`

**Type Definitions:** `/types/glass-components.ts`

---

## State Management

**Decision:** React hooks (existing pattern, no changes)

**Rationale:**
- Current state management works well (useState, useEffect)
- No complexity requiring global state library
- tRPC integration provides server state management
- Refactoring state management out of scope for visual redesign

**Patterns Preserved:**
- Dashboard: Multiple useState for UI state (toasts, dropdowns, page visibility)
- Dreams: Simple useState for filters, modal state
- Reflection: Complex state machine with 7+ useState hooks (MUST preserve)

**DO NOT CHANGE:**
- Any tRPC query/mutation logic
- Any useState, useEffect hooks
- Any form validation logic
- Any navigation/routing logic

---

## Data Fetching

**Decision:** tRPC (existing, absolutely no changes)

**Rationale:**
- Already working perfectly for type-safe client-server communication
- Visual redesign should not touch data layer
- All tRPC queries/mutations preserved exactly as-is

**Integration Points (Read-Only):**
- `reflections.checkUsage` - Dashboard usage stats
- `reflections.list` - Dashboard recent reflections
- `dreams.list` - Dreams page dream list
- `dreams.getLimits` - Dreams page usage limits
- `reflection.create` - Reflection submission
- `evolution.status` - Dashboard evolution status

**Critical Constraint:** Builders MUST NOT modify any tRPC query logic

---

## Icon Library

**Decision:** Lucide React 0.546.0 (optional usage)

**Rationale:**
- Already installed in Iteration 1
- Clean, modern icon set
- Tree-shakeable (only import icons used)
- Consistent sizing and styling

**Current Usage:** Minimal (most icons are emojis currently)

**Recommendation:** Use Lucide icons for UI elements (arrows, close buttons, checkmarks) but keep emojis for personality (dream icons, cosmic elements)

**Example Usage:**
```tsx
import { ArrowRight, X, Check, ChevronDown } from 'lucide-react'

<GlowButton>
  Continue <ArrowRight className="ml-2 h-4 w-4" />
</GlowButton>
```

---

## Form Handling

**Decision:** Plain React controlled components (existing pattern)

**Rationale:**
- Current form handling works well
- No complex validation requiring form library
- Keep patterns consistent with existing codebase

**Patterns Preserved:**
- Controlled inputs with useState
- onChange handlers update state
- Character counters for textarea fields
- Form submission via tRPC mutations

**Enhancement Opportunity:** Create shared `<GlassInput>` component for consistent styling

---

## Testing Strategy

**Decision:** Manual testing only (no automated tests added)

**Rationale:**
- No existing test infrastructure
- Adding tests out of scope for iteration 2
- Visual regression requires screenshot comparison (manual)
- Functional testing via manual user flow testing

**Testing Approach:**
1. **Visual Regression:** Before/after screenshot comparison
2. **Functionality Testing:** Click through all user flows
3. **Keyboard Navigation:** Tab through all interactive elements
4. **Mobile Testing:** Chrome DevTools device emulation + real devices
5. **Performance Testing:** Lighthouse audit + CPU throttling
6. **Cross-browser Testing:** Chrome, Safari, Firefox

**Documentation:** Each builder must complete testing checklist in builder report

---

## Browser Support

**Decision:** Modern browsers only (existing constraint)

**Rationale:**
- Glass effects require modern CSS (backdrop-filter, CSS Grid)
- Next.js targets modern browsers by default
- No IE11 support needed

**Target Browsers:**
- Chrome/Edge 90+ (backdrop-filter support)
- Safari 14+ (backdrop-filter support)
- Firefox 103+ (backdrop-filter support)

**Mobile Browsers:**
- iOS Safari 14+
- Chrome Android 90+

**Fallback Strategy:** Glass effects degrade gracefully (solid backgrounds if backdrop-filter unsupported)

---

## Build & Bundle

**Decision:** Next.js production build (existing, no changes)

**Build Command:** `npm run build`

**Bundle Size Target:** <200KB per page (current: 143KB Dashboard)

**Performance Budget:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s
- Cumulative Layout Shift (CLS): <0.1

**Monitoring:**
- Run `npm run build` after each major change
- Check bundle size with `next build --profile`
- Lighthouse audit after Dashboard completion
- Final Lighthouse audit before deployment

---

## Development Tools

**Editor:** Any (VSCode recommended)

**TypeScript:** Strict mode enabled (existing)

**Linting:** ESLint (existing configuration)

**Formatting:** Prettier (if configured, existing)

**Version Control:** Git (incremental commits per component replacement)

---

## Environment Variables

**No New Variables Required**

All existing environment variables preserved:
- `DATABASE_URL` - Database connection
- `NEXTAUTH_SECRET` - Authentication
- `NEXTAUTH_URL` - Auth URL
- API keys for external services (OpenAI, etc.)

**Visual redesign does not require any new environment variables**

---

## Accessibility Considerations

**Decision:** Built-in accessibility via glass components

**Features Included:**
- Reduced motion support (`prefers-reduced-motion`)
- ARIA labels on interactive elements
- Focus indicators on all buttons/links
- Keyboard navigation (Enter/Space on buttons)
- Sufficient color contrast (WCAG AA)
- Touch targets >44px on mobile

**Implementation:**
- Glass components automatically handle reduced motion
- Builders must preserve keyboard navigation
- Test with screen reader if possible (optional)
- Manual tab-through testing required

---

## Performance Optimization

**Decision:** Performance-first approach with monitoring

**Strategies:**
1. **Animation Performance:**
   - Only animate transform/opacity (GPU-accelerated)
   - Use `will-change: transform` for animated elements
   - Disable animations on low-end devices (`useReducedMotion`)

2. **Glass Effect Performance:**
   - Limit backdrop-blur layers (max 3 on screen at once)
   - Use smaller blur radius on mobile (8px vs 16px)
   - Monitor paint times (<100ms per frame)

3. **Bundle Size:**
   - Glass components already tree-shakeable
   - Framer Motion supports tree-shaking
   - No additional heavy dependencies

4. **Image Optimization:**
   - Next.js Image component (existing, preserve)
   - Lazy loading for below-fold content

**Monitoring Tools:**
- Chrome DevTools Performance tab
- Lighthouse audits
- Real device testing (iPhone 12, Samsung Galaxy S21)

---

## Security Considerations

**No Security Changes**

Visual redesign does not impact security:
- Authentication flows preserved
- API routes unchanged
- No new external dependencies
- No new data exposure

**Existing Security Maintained:**
- NextAuth.js authentication
- tRPC type-safe API
- Environment variable protection
- HTTPS in production

---

## Deployment Platform

**Decision:** Existing deployment platform (likely Vercel/Netlify)

**No Changes Required**

Visual redesign is frontend-only:
- No backend changes
- No database migrations
- No API changes
- No infrastructure changes

**Deployment Strategy:** Standard Next.js production build

---

## Dependencies Summary

**No New Dependencies Required**

All required dependencies installed in Iteration 1:

```json
{
  "dependencies": {
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "tailwindcss-animate": "^1.0.7"
  }
}
```

**Existing Dependencies (Preserved):**
- next@14.x
- react@18.x
- @trpc/client, @trpc/server
- @tanstack/react-query
- next-auth
- prisma (if database layer exists)
- And all other existing dependencies

---

## Migration Strategy

**Approach:** Incremental replacement, not big-bang rewrite

**Process:**
1. **Identify inline styled element** (e.g., custom button)
2. **Find matching glass component** (e.g., GlowButton)
3. **Replace JSX** with glass component
4. **Remove inline styles** for that element
5. **Test visual parity** (screenshot comparison)
6. **Test functionality** (click, interact)
7. **Commit change** with descriptive message
8. **Move to next element**

**Benefits:**
- Low risk (one component at a time)
- Easy rollback (git revert specific commit)
- Continuous validation (test each change)
- Parallel work (multiple builders on different pages)

**CSS File Strategy:**
- Keep existing CSS imports during migration
- Remove specific CSS rules as components replaced
- Final cleanup: Delete unused CSS files after all replacements

---

## Code Quality Standards

**TypeScript:** Strict mode, no `any` types

**Formatting:** Consistent with existing codebase

**Naming Conventions:**
- Components: PascalCase (GlassCard, GlowButton)
- Props: camelCase (variant, glowColor, isOpen)
- Files: PascalCase for components, camelCase for utilities

**Import Order:**
1. React imports
2. External library imports
3. Internal component imports
4. Internal utility imports
5. Type imports
6. CSS/style imports

**Component Structure Pattern:**
```tsx
'use client'

import { motion } from 'framer-motion'
import { GlassCard, GlowButton } from '@/components/ui/glass'
import { cn } from '@/lib/utils'
import type { ComponentProps } from '@/types/glass-components'

interface PageProps {
  // Props
}

export default function Page({ ...props }: PageProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

---

**This technology stack enables magical visual transformation with zero functional changes and minimal risk.**
