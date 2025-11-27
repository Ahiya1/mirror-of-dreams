# Technology Stack - Iteration 5 (Final Polish)

## Core Framework

**Decision:** Next.js 14 (App Router) - NO CHANGES

**Rationale:**
- Existing architecture is solid and performant
- App Router's built-in page transitions (template.tsx) already implemented
- No framework changes needed for micro-interactions or accessibility
- Zero migration risk

**Alternatives Considered:**
- N/A - No alternatives considered (this is polish iteration, not architecture change)

---

## Animation Library

**Decision:** Framer Motion 11.18.2 - CONTINUE USING

**Rationale:**
- Already integrated with comprehensive `useReducedMotion()` support
- Page transitions implemented via AnimatePresence in template.tsx
- Modal animations use motion.div with proper variants
- Performance excellent (GPU-accelerated, 60fps)
- Bundle size acceptable (60KB gzipped for animation-heavy app)

**Implementation Notes:**
- Use `useReducedMotion()` hook in all new animations
- Stick to GPU-accelerated properties (transform, opacity, filter)
- Avoid layout-triggering properties (width, height, margin, padding)

**Evidence from Exploration:**
- Explorer 1: "Animation performance: 95/100, GPU-optimized"
- All existing animations use transform/opacity (no jank)
- Comprehensive reduced-motion support across all components

---

## CSS Framework

**Decision:** Tailwind CSS 3.4.1 + CSS Modules - NO CHANGES

**Rationale:**
- Tailwind config has comprehensive mirror.* color palette
- CSS custom properties in variables.css provide consistent spacing
- animations.css has 30+ keyframe animations with reduced-motion support
- Well-structured for semantic color migration

**Custom Tailwind Extensions:**
```typescript
// tailwind.config.ts - Custom colors (already exist)
mirror: {
  success: '#34d399',    // Use for all success states
  warning: '#fbbf24',    // Use for warnings
  error: '#f87171',      // Use for all error states
  info: '#818cf8',       // Use for info messages
  amethyst: '#7c3aed',   // Primary brand color
  'amethyst-deep': '#4c1d95',
  'amethyst-bright': '#9333ea',
}
```

**New Additions for Iteration 5:**
- Semantic color utility classes in globals.css
- Error shake animation keyframe
- Success checkmark animation keyframe

---

## Accessibility Library

**Decision:** react-focus-lock 2.x (NEW DEPENDENCY)

**Rationale:**
- Required for modal focus trap (WCAG 2.4.3 compliance)
- Lightweight (5KB gzipped)
- Battle-tested library used by React Spectrum, Reach UI
- Handles complex focus management edge cases
- Automatic focus restoration on modal close

**Alternatives Considered:**
- **Manual implementation:** Too complex, high risk of bugs
- **focus-trap-react:** Similar size, less React-optimized
- **react-aria:** Too heavy (brings entire component library)

**Implementation:**
```tsx
import FocusLock from 'react-focus-lock';

<FocusLock returnFocus>
  <GlassModal>{children}</GlassModal>
</FocusLock>
```

**Installation:**
```bash
npm install react-focus-lock
```

---

## Micro-Interaction Strategy

**Decision:** CSS Transitions (primary) + Framer Motion (complex)

**Rationale:**
- CSS transitions are more performant for simple hover/active states
- Framer Motion for complex state-driven animations (error shake)
- Hybrid approach balances performance and developer experience

### Button Micro-Interactions
**Approach:** Pure CSS with Tailwind classes
```tsx
// 200ms transition, scale + opacity active states
'transition-all duration-200'
'hover:-translate-y-0.5 hover:opacity-90'
'active:scale-[0.98] active:opacity-80'
```

**Why CSS over JS:**
- Simpler implementation
- Better performance (GPU-accelerated)
- No React re-renders needed
- Easier to maintain

### Card Hover States
**Approach:** Pure CSS with Tailwind classes
```tsx
'transition-all duration-250'
'hover:-translate-y-0.5 hover:shadow-lg'
```

### Input Error/Success Animations
**Approach:** CSS keyframes + React state
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes checkmark {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
```

**Trigger via React:**
```tsx
const [isShaking, setIsShaking] = useState(false);

useEffect(() => {
  if (error && !prevError) {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }
}, [error]);

className={isShaking ? 'animate-shake' : ''}
```

**Why keyframes over Framer Motion:**
- Simpler for repetitive animations (shake)
- No motion component wrapper needed
- Easier to control duration/easing

---

## Page Transition Strategy

**Decision:** KEEP EXISTING (AnimatePresence in template.tsx)

**Rationale:**
- Already implemented with proper reduced-motion support
- Performance excellent (fade + slide, 300ms)
- Uses AnimatePresence with mode="wait" (proper exit animations)
- GPU-accelerated (opacity + transform)

**Current Implementation:**
```tsx
// app/template.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Explorer 1 Verdict:** "Reference implementation - No issues found"

**No Changes Needed:** Verify 60fps performance, ensure works on Safari

---

## Semantic Color System Implementation

**Decision:** Tailwind Utility Classes + CSS Custom Properties

**Rationale:**
- Centralized color definitions in tailwind.config.ts
- Easy to rebrand (change one value, updates entire app)
- Type-safe with TypeScript (IntelliSense for color names)
- Performance: No runtime color calculations

### Implementation Strategy

**Step 1: Create Semantic Utility Classes**
```css
/* styles/globals.css */
@layer utilities {
  /* Text Colors */
  .text-semantic-success { @apply text-mirror-success; }
  .text-semantic-error { @apply text-mirror-error; }
  .text-semantic-info { @apply text-mirror-info; }
  .text-semantic-warning { @apply text-mirror-warning; }

  /* Background Colors */
  .bg-semantic-success-light { @apply bg-mirror-success/10; }
  .bg-semantic-error-light { @apply bg-mirror-error/10; }
  .bg-semantic-info-light { @apply bg-mirror-info/10; }
  .bg-semantic-warning-light { @apply bg-mirror-warning/10; }

  /* Border Colors */
  .border-semantic-success { @apply border-mirror-success/50; }
  .border-semantic-error { @apply border-mirror-error/50; }
  .border-semantic-info { @apply border-mirror-info/50; }
  .border-semantic-warning { @apply border-mirror-warning/50; }
}
```

**Step 2: Replace Tailwind Colors**
```tsx
// BEFORE
<div className="bg-green-500/10 border-green-500/50 text-green-200">
  Success!
</div>

// AFTER
<div className="bg-semantic-success-light border-semantic-success text-semantic-success">
  Success!
</div>
```

**Why Utility Classes:**
- Consistent naming across components
- Single source of truth for semantic colors
- Easy to find/replace during migration
- Autocomplete support in IDE

---

## Accessibility Tools

**Decision:** react-focus-lock + Native ARIA Attributes + Lighthouse

**Rationale:**
- react-focus-lock: Modal focus trap (required for WCAG 2.4.3)
- ARIA attributes: Built-in HTML, no dependencies
- Lighthouse: Free, comprehensive accessibility audit

### Focus Trap (Modals)
**Library:** react-focus-lock
**Implementation:**
```tsx
<FocusLock returnFocus>
  <motion.div role="dialog" aria-modal="true">
    <GlassCard>{children}</GlassCard>
  </motion.div>
</FocusLock>
```

**Features:**
- Auto-focuses first focusable element
- Traps Tab/Shift+Tab within modal
- Returns focus to trigger element on close
- Handles nested modals

### Skip Navigation
**Approach:** Pure HTML + Tailwind classes (no library)
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200]"
>
  Skip to main content
</a>
```

**Why no library:**
- Simple implementation (5 lines of code)
- No dependencies needed
- Follows standard pattern

### ARIA Labels
**Approach:** Native HTML aria-* attributes
```tsx
// Icon-only button
<button aria-label="Open navigation menu" aria-expanded={isOpen}>
  <Menu />
</button>

// Dropdown
<button
  aria-label="User menu"
  aria-expanded={showDropdown}
  aria-haspopup="true"
  aria-controls="user-dropdown"
>
```

**Why native attributes:**
- No dependencies
- Full browser support
- Screen reader compatible
- Recommended by W3C

### Keyboard Navigation
**Approach:** Native event handlers + focus management
```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleOpen();
  }
  if (e.key === 'Escape') {
    handleClose();
  }
}}
```

**Why native:**
- Full control over behavior
- No library learning curve
- Lightweight

---

## Testing Strategy

**Decision:** Manual Testing + Lighthouse + axe DevTools

**Rationale:**
- Lighthouse: Free, comprehensive, CI-ready
- axe DevTools: Deep accessibility scanning
- Manual testing: Required for keyboard nav (no automation replacement)

### Lighthouse CI
**Usage:**
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000/auth/signin
```

**Target Scores:**
- Accessibility: 95+
- Performance: 90+
- Best Practices: 95+

### axe DevTools
**Browser Extension:** Install for Chrome/Firefox
**Usage:** Run on each page, fix all critical/serious issues

### Manual Testing Checklist
- [ ] Keyboard-only navigation (Tab through entire app)
- [ ] Skip link appears on first Tab
- [ ] Modal focus trap works (Tab doesn't escape)
- [ ] Escape closes modals
- [ ] Dropdown keyboard navigation (Enter, Escape, Arrow keys)
- [ ] Reduced motion test (enable in browser settings)
- [ ] Screen reader test (VoiceOver on Mac, NVDA on Windows)

---

## Performance Targets

### Animation Performance
- **FPS:** 60fps during all animations
- **Frame Budget:** 16.67ms per frame
- **GPU Acceleration:** All animations use transform/opacity
- **No Layout Thrashing:** Zero width/height/margin animations

**Verification:**
- Chrome DevTools > Performance tab
- Record during page transition
- Check for green bars (GPU-accelerated)
- No yellow bars (layout recalculation)

### Bundle Size
- **Current:** ~250KB gzipped (Next.js + React + Framer Motion)
- **After Iteration 5:** ~255KB gzipped (+5KB for react-focus-lock)
- **Budget:** 300KB max

**Verification:**
```bash
npm run build
# Check .next/static/chunks output
```

### Lighthouse Metrics
- **First Contentful Paint:** <1.5s
- **Largest Contentful Paint:** <2.5s
- **Time to Interactive:** <3.5s
- **Cumulative Layout Shift:** <0.1

---

## Environment Variables

**No new environment variables required for iteration 5.**

All changes are frontend-only (UI polish, accessibility).

---

## Dependencies Overview

### Existing Dependencies (NO CHANGES)
- `next`: 14.x - React framework
- `react`: 18.3.1 - UI library
- `framer-motion`: 11.18.2 - Animation library
- `tailwindcss`: 3.4.1 - CSS framework
- `lucide-react`: Latest - Icon library

### New Dependencies (ITERATION 5)
- `react-focus-lock`: ^2.11.0 - Modal focus trap
  - **Size:** 5KB gzipped
  - **Purpose:** WCAG 2.4.3 compliance (focus management)
  - **Installation:** `npm install react-focus-lock`

### Dev Dependencies (Optional)
- `@axe-core/react`: Latest - Accessibility testing (optional)
  - **Purpose:** Runtime accessibility checks in dev mode
  - **Installation:** `npm install --save-dev @axe-core/react`
  - **Usage:** Only in development, zero production impact

---

## Browser Support

**Target Browsers:**
- Chrome 90+ (Desktop + Mobile)
- Safari 14+ (Desktop + Mobile) - CRITICAL for iOS
- Firefox 88+ (Desktop)
- Edge 90+ (Desktop)

**Critical for Accessibility:**
- All browsers must support:
  - `focus-visible` pseudo-class (Chrome 86+, Safari 15.4+)
  - `prefers-reduced-motion` media query (All modern browsers)
  - ARIA attributes (Universal support)

**Fallbacks:**
- `focus-visible` polyfill: Use `:focus` as fallback (Tailwind handles this)
- `prefers-reduced-motion`: Default to no animations if not supported

---

## Security Considerations

**Focus Trap Security:**
- react-focus-lock prevents focus from escaping modal
- No XSS risk (library doesn't manipulate DOM innerHTML)
- Well-audited library (used by major frameworks)

**ARIA Label Security:**
- All aria-label content is static strings (no user input)
- No XSS risk from aria attributes

**No New Security Risks:**
- All changes are client-side UI polish
- No new API endpoints
- No new user input handling
- No new data storage

---

## Code Quality Standards

### TypeScript
- All new code must be fully typed
- No `any` types
- Update interface definitions for new props (GlowButtonProps, GlassInputProps)

### ESLint
- All code must pass `npm run lint`
- Fix all warnings (not just errors)

### Prettier
- All code must be formatted with Prettier
- Run `npm run format` before committing

### Component Structure
```tsx
// 1. Imports (React, libraries, components, types, styles)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import type { GlassInputProps } from '@/types/glass-components';

// 2. Type definitions
interface Props extends GlassInputProps {
  onSuccess?: () => void;
}

// 3. Component
export function GlassInput({ label, error, ...props }: Props) {
  // 4. State
  const [isShaking, setIsShaking] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Error animation logic
  }, [error]);

  // 6. Handlers
  const handleFocus = () => {
    // Focus logic
  };

  // 7. Render
  return (
    <div className={isShaking ? 'animate-shake' : ''}>
      {/* Component JSX */}
    </div>
  );
}
```

---

## Migration Path (Semantic Colors)

### Step 1: Create Utility Classes
Add semantic utility classes to `styles/globals.css`

### Step 2: Update Components (Priority Order)
1. **GlowButton.tsx** - Add semantic variants (success, danger, info)
2. **GlowBadge.tsx** - Replace Tailwind colors with mirror.*
3. **GlassInput.tsx** - Use semantic-error for error states
4. **Auth Pages** - Replace red/green with semantic colors
5. **Toast.tsx** - Use semantic colors for status
6. **All Other Components** - Systematic find/replace

### Step 3: Verify
- Visual QA on all pages
- Lighthouse contrast check
- No hardcoded red-500/green-500/blue-500 remain

### Find/Replace Commands
```bash
# Find all instances of Tailwind semantic colors
grep -r "bg-green-500" app/ components/
grep -r "text-red-400" app/ components/
grep -r "border-blue-500" app/ components/

# Automated replacement (use with caution)
sed -i 's/bg-green-500\/10/bg-semantic-success-light/g' **/*.tsx
sed -i 's/text-red-400/text-semantic-error/g' **/*.tsx
```

---

## Summary

**No major dependencies added** - Only react-focus-lock (5KB) for critical accessibility.

**No framework changes** - All existing infrastructure is solid.

**Focus areas:**
1. CSS transitions for micro-interactions (200ms, active states)
2. react-focus-lock for modal focus trap
3. Semantic color utility classes for consistency
4. Native ARIA attributes for accessibility

**Performance maintained:**
- Bundle size: +5KB only
- Animation FPS: 60fps target
- Lighthouse scores: 95+ accessibility, 90+ performance

**This tech stack is optimized for the final polish iteration with minimal risk and maximum impact.**
