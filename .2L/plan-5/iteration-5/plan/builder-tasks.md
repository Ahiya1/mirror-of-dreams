# Builder Task Breakdown - Iteration 5 (Final Polish)

## Overview

**3 primary builders** will work in parallel with minimal dependencies.

**Total Estimated Duration:** 12-16 hours (parallel execution)

**Builder Assignment Strategy:**
- **Builder-1:** Micro-Interactions & Animations (UI polish)
- **Builder-2:** Accessibility Compliance (WCAG 2.1 AA)
- **Builder-3:** Semantic Color System (consistency)

**No builder splits anticipated** - All tasks are MEDIUM complexity.

**Critical Coordination:** Builder-1 and Builder-3 both modify GlowButton.tsx
- **Resolution:** Builder-3 merges first (color changes), then Builder-1 (transition changes)

---

## Builder-1: Micro-Interactions & Animation Polish

### Scope

Implement button micro-interactions (200ms transitions, active states), card hover enhancements, and form input error/success animations across all glass components.

### Complexity Estimate

**MEDIUM**

**Reasoning:**
- 3 component files to modify (GlowButton, GlassCard, GlassInput)
- CSS keyframe animations needed (shake, checkmark)
- State management for error animation triggers
- Testing across 15+ pages for visual QA

### Success Criteria

- [ ] All buttons transition in 200ms (reduced from 300ms)
- [ ] All buttons have visible active states (scale 0.98 + opacity)
- [ ] All interactive cards have consistent hover states (lift + glow)
- [ ] Form inputs shake on error state change (not every render)
- [ ] Form inputs show checkmark on success
- [ ] All animations respect `prefers-reduced-motion`
- [ ] No animation jank (60fps maintained)
- [ ] Visual QA passed on all pages

### Files to Create/Modify

**Modify:**
- `components/ui/glass/GlowButton.tsx` - Update transition duration (300ms → 200ms), add active states
- `components/ui/glass/GlassCard.tsx` - Enhance hover states (add glow + border highlight)
- `components/ui/glass/GlassInput.tsx` - Add error shake animation, add success checkmark
- `styles/animations.css` - Add shake keyframe, add checkmark keyframe
- `types/glass-components.ts` - Update GlassInputProps (add `success` prop)

**Test:**
- All pages with buttons (dashboard, auth, reflection, dreams)
- All pages with cards (dashboard, dreams list)
- All pages with forms (signin, signup, create dream modal)

### Dependencies

**Depends on:** None (can start immediately)

**Blocks:** None (parallel with other builders)

**Coordination with Builder-3:**
- Builder-3 modifies GlowButton.tsx for semantic color variants
- **Resolution:** Builder-1 waits for Builder-3 to merge GlowButton changes, then applies transition duration updates to ALL variants (including new semantic variants)

### Implementation Notes

#### Button Transition Duration
- Change from `duration-300` to `duration-200` (33% faster)
- Apply to ALL variants (primary, secondary, ghost, cosmic, success, danger, info)
- Test on mobile - 200ms should feel snappy but not jarring

#### Button Active States
- Use `active:scale-[0.98]` for subtle press feedback
- Add opacity shift: `active:opacity-80` (primary/cosmic) or `active:bg-*/20` (secondary/ghost)
- Test: Hold mouse down on button, verify visible feedback

#### Card Hover Enhancement
- Current: Only `-translate-y-0.5` lift
- Add: `hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]` (purple glow)
- Add: `hover:border-mirror-amethyst/30` (border highlight)
- Duration: Keep at 250ms (larger surface area than buttons)

#### Error Shake Animation
**Critical:** Only trigger on error state CHANGE (false → true), not every render
```tsx
useEffect(() => {
  if (error && error !== prevError) {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }
}, [error]);
```

**CSS Keyframe:**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

#### Success Checkmark Animation
- SVG checkmark with stroke-dashoffset animation
- Duration: 300ms
- Only show when `success` prop is true AND no error
- Position: Absolute right-3, centered vertically

### Patterns to Follow

**Reference:** `patterns.md` sections:
- Button Micro-Interactions Pattern (200ms, active states)
- Card Hover Pattern (consistent lift + glow)
- Input Error/Success Animation Pattern (shake + checkmark)

### Testing Requirements

**Unit Tests:** N/A (visual changes only)

**Manual Testing:**
1. **Button States:**
   - Hover all button variants (verify 200ms transition)
   - Click and hold buttons (verify active state visible)
   - Tab to buttons (verify focus ring appears)
   - Test on mobile (touch feedback)

2. **Card Hovers:**
   - Hover all interactive cards (dashboard, dreams)
   - Verify lift + glow + border highlight
   - Test on mobile (no hover, but click should work)

3. **Form Animations:**
   - Trigger error on input (verify shake)
   - Fix error (verify shake stops)
   - Validate input successfully (verify checkmark appears)

4. **Reduced Motion:**
   - Enable "Reduce Motion" in browser
   - Verify all animations disabled
   - Page still functional

**Coverage Target:** 100% visual coverage (test all pages with modified components)

### Potential Split Strategy

**NOT NEEDED** - Task is MEDIUM complexity, single builder can handle in 4-6 hours.

**If split becomes necessary:**
- **Sub-builder 1A:** Button micro-interactions only (2-3 hours)
- **Sub-builder 1B:** Card hovers + input animations (2-3 hours)

---

## Builder-2: Accessibility Compliance (WCAG 2.1 AA)

### Scope

Implement skip navigation, add missing ARIA labels, implement modal focus trap with react-focus-lock, add keyboard navigation for dropdowns, verify contrast ratios, and achieve 95+ Lighthouse Accessibility score.

### Complexity Estimate

**MEDIUM-HIGH**

**Reasoning:**
- New dependency (react-focus-lock) requires installation
- 4 critical components to modify (layout, AppNavigation, GlassModal)
- Keyboard event handlers for dropdowns
- Lighthouse testing and iteration
- Screen reader testing recommended

### Success Criteria

- [ ] Skip navigation link present and functional (appears on Tab)
- [ ] Mobile menu toggle has aria-label + aria-expanded
- [ ] User dropdown has aria-label + aria-expanded + aria-haspopup
- [ ] Modal focus trap implemented (Tab doesn't escape)
- [ ] Modal auto-focuses close button on open
- [ ] Escape key closes modals
- [ ] Keyboard navigation for dropdown (Enter, Escape, Arrow keys)
- [ ] All landmark regions present (nav, main, header)
- [ ] Lighthouse Accessibility score 95+
- [ ] axe DevTools reports 0 critical issues
- [ ] Manual keyboard testing passed (full app navigable)

### Files to Create/Modify

**Install Dependency:**
```bash
npm install react-focus-lock
```

**Modify:**
- `app/layout.tsx` - Add skip navigation link, add main landmark with id="main-content"
- `components/shared/AppNavigation.tsx` - Add ARIA labels (mobile menu, user dropdown), add keyboard handlers
- `components/ui/glass/GlassModal.tsx` - Add FocusLock wrapper, auto-focus close button, Escape handler
- `components/ui/glass/CosmicLoader.tsx` - Verify aria-label prop usage

**Verify (No changes needed, already compliant):**
- `components/ui/PasswordToggle.tsx` - Has aria-label
- `components/ui/glass/GlassInput.tsx` - Has label support

### Dependencies

**Depends on:** None (can start immediately)

**Blocks:** None (parallel with other builders)

**External Dependency:** react-focus-lock (5KB gzipped)

### Implementation Notes

#### Skip Navigation Link
- Position: Absolute top-4 left-4, z-index 200
- Hidden by default (sr-only), visible on focus
- Styled like GlowButton (purple background)
- href="#main-content" jumps to main element
- Test: Press Tab on page load, verify link appears

#### Mobile Menu ARIA
```tsx
aria-label={showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
aria-expanded={showMobileMenu}
aria-controls="mobile-navigation"
```

#### User Dropdown ARIA + Keyboard
```tsx
aria-label="User menu"
aria-expanded={showUserDropdown}
aria-haspopup="true"
aria-controls="user-dropdown-menu"

onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') handleToggle();
  if (e.key === 'Escape') setShowUserDropdown(false);
}}
```

#### Modal Focus Trap
- Wrap modal content in `<FocusLock returnFocus>`
- returnFocus: Auto-returns focus to trigger element on close
- Auto-focus close button on open (useEffect with closeButtonRef)
- Escape key handler closes modal

#### Lighthouse Testing Workflow
1. Run `npm run dev`
2. Open DevTools → Lighthouse tab
3. Run audit on /auth/signin, /dashboard, /reflection
4. Fix all critical/serious issues
5. Re-run until 95+ score achieved

### Patterns to Follow

**Reference:** `patterns.md` sections:
- Skip Navigation Pattern
- ARIA Label Pattern (all examples)
- Modal Focus Trap Pattern
- Import Order Convention

### Testing Requirements

**Automated Tests:**
1. **Lighthouse Audit:**
   - Run on: /auth/signin, /dashboard, /reflection
   - Target: Accessibility 95+
   - Performance: Maintain 90+ (no regression)

2. **axe DevTools:**
   - Install browser extension
   - Scan all pages
   - Target: 0 critical/serious issues

**Manual Tests:**
1. **Keyboard Navigation:**
   - [ ] Tab on page load → skip link appears
   - [ ] Press Enter on skip link → jumps to main content
   - [ ] Tab through navigation → all links reachable
   - [ ] Tab to user dropdown → press Enter → menu opens
   - [ ] Press Escape → menu closes
   - [ ] Open modal → Tab → focus stays in modal
   - [ ] Press Escape → modal closes

2. **Screen Reader (Optional but Recommended):**
   - [ ] VoiceOver (Mac) or NVDA (Windows)
   - [ ] Navigate through app
   - [ ] Verify all buttons announce their purpose
   - [ ] Verify form inputs announce labels and errors

3. **Reduced Motion:**
   - [ ] Enable in browser settings
   - [ ] All animations disabled (already implemented)

**Coverage Target:** 100% keyboard navigation coverage

### Potential Split Strategy

**NOT RECOMMENDED** - Task is cohesive, splitting would cause coordination overhead.

**If split becomes necessary:**
- **Sub-builder 2A:** Skip link + ARIA labels (2-3 hours)
- **Sub-builder 2B:** Modal focus trap + keyboard handlers (3-4 hours)

---

## Builder-3: Semantic Color System & Consistency

### Scope

Create semantic color utility classes, update GlowButton with semantic variants (success, danger, info), update GlowBadge to use mirror.* palette, and replace all Tailwind red/green/blue semantic colors with mirror.* colors across 10+ component files.

### Complexity Estimate

**MEDIUM**

**Reasoning:**
- Large refactor (50+ instances of color replacements)
- Risk of visual regressions
- Must coordinate with Builder-1 on GlowButton.tsx
- Systematic find/replace with visual QA

### Success Criteria

- [ ] Semantic utility classes created in globals.css (text-semantic-*, bg-semantic-*, border-semantic-*)
- [ ] GlowButton has 3 new semantic variants (success, danger, info)
- [ ] GlowBadge uses mirror.* colors exclusively (no Tailwind red/green/blue)
- [ ] All error states use mirror.error (#f87171)
- [ ] All success states use mirror.success (#34d399)
- [ ] All info states use mirror.info (#818cf8)
- [ ] Zero instances of bg-red-500, text-green-400, border-blue-500 for semantics
- [ ] Visual QA passed (no regressions)
- [ ] Contrast ratios verified (WCAG AA compliant)

### Files to Create/Modify

**Modify:**
- `styles/globals.css` - Add semantic utility classes (@layer utilities)
- `components/ui/glass/GlowButton.tsx` - Add success, danger, info variants
- `components/ui/glass/GlowBadge.tsx` - Replace Tailwind colors with mirror.*
- `types/glass-components.ts` - Update GlowButtonProps type (add semantic variants)

**Systematic Replacement (10+ files):**
- `app/auth/signin/page.tsx` - Error/success messages
- `app/auth/signup/page.tsx` - Error/success messages
- `app/reflections/[id]/page.tsx` - Status indicators
- `components/shared/Toast.tsx` - Status variants
- `components/dreams/CreateDreamModal.tsx` - Error states
- Any other component with red/green/blue semantic colors

### Dependencies

**Depends on:** None (can start immediately)

**Blocks:** Builder-1 (GlowButton.tsx coordination)

**Coordination Required:**
- Builder-3 should merge GlowButton changes FIRST
- Builder-1 then applies transition duration updates to ALL variants (including new semantic variants)

### Implementation Notes

#### Semantic Utility Classes Structure
```css
@layer utilities {
  /* Text colors */
  .text-semantic-success { @apply text-mirror-success; }
  .text-semantic-error { @apply text-mirror-error; }
  .text-semantic-info { @apply text-mirror-info; }
  .text-semantic-warning { @apply text-mirror-warning; }

  /* Background colors (light) */
  .bg-semantic-success-light { @apply bg-mirror-success/10; }
  .bg-semantic-error-light { @apply bg-mirror-error/10; }
  .bg-semantic-info-light { @apply bg-mirror-info/10; }
  .bg-semantic-warning-light { @apply bg-mirror-warning/10; }

  /* Border colors */
  .border-semantic-success { @apply border-mirror-success/50; }
  .border-semantic-error { @apply border-mirror-error/50; }
  .border-semantic-info { @apply border-mirror-info/50; }
  .border-semantic-warning { @apply border-mirror-warning/50; }

  /* Reusable status boxes */
  .status-box-success {
    @apply bg-semantic-success-light border-semantic-success text-semantic-success;
    @apply border backdrop-blur-md rounded-lg p-4;
  }
  .status-box-error {
    @apply bg-semantic-error-light border-semantic-error text-semantic-error;
    @apply border backdrop-blur-md rounded-lg p-4;
  }
  .status-box-info {
    @apply bg-semantic-info-light border-semantic-info text-semantic-info;
    @apply border backdrop-blur-md rounded-lg p-4;
  }
}
```

#### GlowButton Semantic Variants
Add 3 new variants: success, danger, info
```tsx
success: cn(
  'bg-mirror-success text-white',
  'hover:bg-mirror-success/90 hover:-translate-y-0.5',
  'active:scale-[0.98] active:bg-mirror-success/80',
  'transition-all duration-200', // Builder-1 will set this
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-mirror-success'
),
```

#### GlowBadge Migration
BEFORE:
```tsx
success: {
  bg: 'bg-green-500/20',
  text: 'text-green-500',
  border: 'border-green-500/30',
}
```

AFTER:
```tsx
success: {
  bg: 'bg-mirror-success/20',
  text: 'text-mirror-success',
  border: 'border-mirror-success/30',
}
```

#### Systematic Find/Replace Strategy
1. Find all instances: `grep -r "bg-green-500" app/ components/`
2. Review each instance (some may be intentional non-semantic greens)
3. Replace semantic colors only (success states, error states)
4. Keep decorative colors (gradients, backgrounds) as-is

**CAUTION:** Do NOT replace:
- Cosmic gradients (purple/indigo) - these are brand colors, not semantic
- Background colors (mirror.void, mirror.nebula) - these are layout colors
- Only replace red/green/blue when used for SUCCESS/ERROR/INFO semantics

### Patterns to Follow

**Reference:** `patterns.md` sections:
- Semantic Color Usage Pattern (all examples)
- Button Micro-Interactions Pattern (semantic variants)
- Code Quality Standards (TypeScript types)

### Testing Requirements

**Automated Tests:**
1. **Build Test:**
   ```bash
   npm run build
   # Verify no TypeScript errors
   ```

2. **Contrast Ratio Test:**
   - Run Lighthouse on pages with semantic colors
   - Verify all text meets 4.5:1 ratio
   - Especially check error states (red text on red background)

**Manual Tests:**
1. **Visual QA - All Pages:**
   - [ ] /auth/signin - Error messages red (mirror.error)
   - [ ] /auth/signup - Success messages green (mirror.success)
   - [ ] /dashboard - Status badges use semantic colors
   - [ ] /reflections - Status indicators use semantic colors
   - [ ] Toast notifications - All variants use mirror.* colors

2. **Color Consistency Check:**
   ```bash
   # Verify no Tailwind semantic colors remain
   grep -r "bg-green-500" app/ components/
   grep -r "text-red-400" app/ components/
   grep -r "border-blue-500" app/ components/
   # Should return 0 results (or only decorative usage)
   ```

3. **Button Variants:**
   - [ ] Test success button (green with mirror.success)
   - [ ] Test danger button (red with mirror.error)
   - [ ] Test info button (blue with mirror.info)
   - [ ] Verify hover states work

**Coverage Target:** 100% semantic color coverage (no Tailwind reds/greens/blues)

### Potential Split Strategy

**NOT NEEDED** - Task is systematic but straightforward, single builder can handle in 3-4 hours.

**If split becomes necessary:**
- **Sub-builder 3A:** Create utility classes + update GlowButton/GlowBadge (2 hours)
- **Sub-builder 3B:** Systematic find/replace across all files (2 hours)

---

## Builder Execution Order

### Parallel Group 1 (No dependencies - START IMMEDIATELY)

**All 3 builders can start in parallel:**
- **Builder-1:** Micro-Interactions
- **Builder-2:** Accessibility
- **Builder-3:** Semantic Colors

**Coordination Point:** Builder-1 waits for Builder-3 to merge GlowButton.tsx changes before applying transition duration updates.

### Integration Timeline

**Hour 0-4:**
- Builder-2 works on skip link + ARIA labels
- Builder-3 works on utility classes + GlowButton semantic variants
- Builder-1 works on GlassCard + GlassInput animations

**Hour 4-6:**
- Builder-3 merges GlowButton.tsx (semantic variants)
- Builder-1 updates GlowButton.tsx (transition durations on ALL variants)
- Builder-2 works on modal focus trap

**Hour 6-12:**
- Builder-3 completes systematic color replacements
- Builder-1 completes visual QA
- Builder-2 completes Lighthouse testing

**Hour 12-16:**
- All builders: Final testing
- Integration: Merge all outputs
- Validation: Lighthouse 95+, visual QA, keyboard testing

---

## Integration Notes

### GlowButton.tsx Merge Resolution

**Step 1: Builder-3 commits first**
```tsx
// Builder-3 adds semantic variants (success, danger, info)
const buttonVariants = {
  primary: '...',
  secondary: '...',
  ghost: '...',
  cosmic: '...',
  success: 'bg-mirror-success ...', // NEW
  danger: 'bg-mirror-error ...',    // NEW
  info: 'bg-mirror-info ...',       // NEW
};
```

**Step 2: Builder-1 updates ALL variants**
```tsx
// Builder-1 changes transition duration from 300ms → 200ms on ALL variants
const buttonVariants = {
  primary: cn('...', 'transition-all duration-200'), // CHANGED
  secondary: cn('...', 'transition-all duration-200'), // CHANGED
  ghost: cn('...', 'transition-all duration-200'), // CHANGED
  cosmic: cn('...', 'transition-all duration-200'), // CHANGED
  success: cn('...', 'transition-all duration-200'), // CHANGED (Builder-3 variant)
  danger: cn('...', 'transition-all duration-200'), // CHANGED (Builder-3 variant)
  info: cn('...', 'transition-all duration-200'), // CHANGED (Builder-3 variant)
};
```

### Shared Files - No Conflicts Expected

**GlassInput.tsx:**
- Builder-1 adds error/success animations (props + state)
- Builder-3 updates border colors (mirror.error instead of red-500)
- **No conflict:** Different code sections

**AppNavigation.tsx:**
- Builder-2 adds ARIA labels + keyboard handlers
- No other builders touch this file

**GlassModal.tsx:**
- Builder-2 adds FocusLock + Escape handler
- No other builders touch this file

### Testing Coordination

**All builders must test:**
- [ ] Reduced motion (prefers-reduced-motion: reduce)
- [ ] Mobile responsiveness (320px minimum)
- [ ] Keyboard navigation (Tab through page)

**Integration testing:**
- [ ] All 3 builders' changes work together
- [ ] No visual regressions
- [ ] Lighthouse Accessibility 95+
- [ ] Lighthouse Performance 90+ (maintained)

---

## Final Deliverables Checklist

### Builder-1 Deliverables
- [ ] GlowButton.tsx: 200ms transitions, active states
- [ ] GlassCard.tsx: Enhanced hover states
- [ ] GlassInput.tsx: Error shake + success checkmark
- [ ] animations.css: Shake + checkmark keyframes
- [ ] types/glass-components.ts: GlassInputProps updated
- [ ] Visual QA report: All pages tested

### Builder-2 Deliverables
- [ ] app/layout.tsx: Skip link + main landmark
- [ ] AppNavigation.tsx: ARIA labels + keyboard handlers
- [ ] GlassModal.tsx: FocusLock + auto-focus + Escape
- [ ] package.json: react-focus-lock dependency
- [ ] Lighthouse report: 95+ accessibility scores
- [ ] Keyboard testing report: All flows validated

### Builder-3 Deliverables
- [ ] globals.css: Semantic utility classes
- [ ] GlowButton.tsx: Success, danger, info variants
- [ ] GlowBadge.tsx: mirror.* colors only
- [ ] types/glass-components.ts: GlowButtonProps updated
- [ ] 10+ files: Systematic color replacements
- [ ] Color audit report: Zero Tailwind semantic colors remain
- [ ] Contrast ratio report: All text meets WCAG AA

---

## Risk Mitigation

### Risk: GlowButton.tsx Merge Conflict
**Probability:** Medium
**Impact:** Low (easy to resolve)
**Mitigation:** Builder-3 merges first, Builder-1 applies transition changes to all variants

### Risk: Lighthouse Score Below 95
**Probability:** Low (all critical issues identified by explorers)
**Impact:** High (WCAG compliance blocked)
**Mitigation:** Iterative testing during development, not just at end

### Risk: Animation Performance Regression
**Probability:** Very Low (all animations GPU-accelerated)
**Impact:** Medium
**Mitigation:** Test on mobile, verify 60fps in Chrome DevTools

### Risk: Semantic Color Migration Causes Visual Regressions
**Probability:** Medium (50+ replacements)
**Impact:** Medium (visual consistency broken)
**Mitigation:** Visual QA on EVERY page after replacements, screenshot comparison

---

## Success Metrics

**Iteration 5 is successful when:**

1. **Micro-Interactions:** All buttons 200ms, all active states visible, no jank
2. **Accessibility:** Lighthouse 95+, axe DevTools 0 critical issues, full keyboard nav
3. **Color Semantics:** Zero Tailwind red/green/blue for semantics, 100% mirror.* usage
4. **Performance:** Lighthouse Performance 90+ (maintained)
5. **Integration:** All builders' changes work together, no conflicts
6. **Testing:** All manual tests passed, all automated tests passed

**FINAL VALIDATION:** Deploy to staging, run full QA suite, get user feedback.

---

**This is the FINAL iteration of plan-5. Execute with precision. This is production-ready polish.**
