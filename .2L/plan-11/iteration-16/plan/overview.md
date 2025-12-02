# 2L Iteration Plan - Mobile Navigation Foundation

## Project Vision

Establish mobile-native navigation patterns by implementing a fixed bottom navigation bar that replaces the desktop hamburger menu pattern on mobile devices. This iteration creates the foundational infrastructure for the entire mobile transformation of Mirror of Dreams.

**Why this matters:** Mobile users (70%+ of sessions) currently navigate using a desktop hamburger menu pattern. This feels foreign on mobile devices where thumb-reach bottom navigation is the native expectation. By implementing bottom navigation first, we establish the primary mobile UX pattern that all subsequent mobile work will build upon.

---

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] Bottom navigation is visible on mobile viewports (< 768px)
- [ ] Bottom navigation is hidden on desktop viewports (>= 768px)
- [ ] All 5 tabs navigate correctly (Home, Dreams, Reflect, Evolution, Profile)
- [ ] Active tab displays pill indicator with smooth animation
- [ ] Navigation hides on scroll down, reveals on scroll up (with smooth transition)
- [ ] Safe area padding is applied correctly on notched devices (iPhone X+)
- [ ] Haptic feedback triggers on tab tap (Android Chrome; silent fail on iOS)
- [ ] Desktop navigation remains completely unchanged
- [ ] No layout shifts when bottom nav appears/disappears
- [ ] Lighthouse mobile performance score remains >= 85

---

## MVP Scope

### In Scope

**1. Bottom Navigation Component**
- Fixed bottom bar with 5 tabs: Home, Dreams, Reflect, Evolution, Profile
- Glass morphism styling consistent with cosmic design system
- Active state with animated pill indicator (using layoutId for smooth motion)
- Hidden on desktop (`md:hidden` Tailwind class)
- 64px base height + safe area padding for notched devices

**2. Scroll Direction Detection**
- New `useScrollDirection` hook for detecting up/down scroll
- Threshold-based detection (10px minimum) to prevent jitter
- Throttled scroll events (100ms) for performance
- Smooth show/hide animation via Framer Motion

**3. Safe Area Infrastructure**
- CSS custom properties for safe-area-inset-* values
- viewport-fit=cover meta tag addition
- Bottom nav height CSS variable (--bottom-nav-height)

**4. Navigation Integration**
- Modify AppNavigation for mobile coexistence
- Hide hamburger menu on mobile when bottom nav is active
- Keep top bar minimal on mobile: logo + user avatar only
- Desktop navigation completely unchanged

**5. Haptic Feedback Utility**
- Lightweight haptic feedback utility (`haptic('light')`)
- Graceful fallback when not supported (iOS Safari)

### Out of Scope (Post-MVP / Future Iterations)

- Center-prominent "Reflect" tab (Instagram/TikTok style) - design decision deferred
- Tablet-specific navigation (768-1024px uses hamburger menu for now)
- Swipe gestures between pages
- Navigation during reflection (full-screen takeover)
- Custom animations beyond show/hide
- Reduced motion preference integration (can rely on Framer Motion's built-in support)

---

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (this document)
3. **Building** - Estimated 4-6 hours (3 parallel builders)
4. **Integration** - Estimated 15-30 minutes
5. **Validation** - Estimated 15-30 minutes
6. **Deployment** - Final

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | 2 explorer reports synthesized |
| Planning | Complete | This plan document |
| Building | 4-6 hours | 3 builders in parallel |
| Integration | 15-30 min | Merge builder outputs, resolve conflicts |
| Validation | 15-30 min | Manual testing on mobile devices |
| **Total** | **~5-7 hours** | |

---

## Risk Assessment

### High Risks

1. **iOS Safari Rubber-banding**
   - **Risk:** Bottom nav may bounce during overscroll
   - **Mitigation:** Use `position: fixed` with proper `bottom: 0` + safe area padding. Avoid transform-based positioning.

2. **Hydration Mismatch**
   - **Risk:** useIsMobile hook could cause server/client mismatch
   - **Mitigation:** Use CSS-only visibility (`md:hidden`) instead of JS-based conditional rendering for the component itself. Use `useState(false)` initial value for any JS-based checks.

### Medium Risks

1. **Scroll Direction Jitter**
   - **Risk:** Small scrolls trigger unwanted show/hide
   - **Mitigation:** Implement 10px threshold and 100ms throttle in useScrollDirection hook

2. **Z-Index Conflicts**
   - **Risk:** Bottom nav overlaps with modals or toasts
   - **Mitigation:** Use z-40 for bottom nav (current modal is z-1000, toast is z-2000)

3. **Keyboard Interference**
   - **Risk:** Virtual keyboard may push bottom nav up
   - **Mitigation:** Document as known behavior; full solution in Iteration 17 (reflection flow)

### Low Risks

1. **Haptic Feedback Not Supported**
   - **Risk:** navigator.vibrate not available on iOS Safari
   - **Mitigation:** Graceful silent failure; haptics are enhancement not requirement

---

## Integration Strategy

### Builder Output Structure

Each builder will create files in their assigned directories. Integration involves:

1. **No merge conflicts expected** - Builders work on different files:
   - Builder 1: `/lib/hooks/`, `/lib/utils/`, `/styles/variables.css`, `/app/layout.tsx`
   - Builder 2: `/components/navigation/`, `/lib/animations/variants.ts`
   - Builder 3: `/components/shared/AppNavigation.tsx`, page layouts

2. **Import verification** - Ensure all new exports are properly imported

3. **CSS variable consistency** - Verify all builders use same variable names

### Integration Steps

1. Merge Builder 1 output first (infrastructure)
2. Merge Builder 2 output (component)
3. Merge Builder 3 output (integration)
4. Run TypeScript compilation check
5. Manual browser testing

---

## Deployment Plan

**Deployment Target:** Vercel (existing)

**Deployment Steps:**
1. All changes are frontend-only (no database migrations)
2. Standard Vercel deployment via git push
3. Preview deployment for testing before production

**Rollback Plan:**
- Revert to previous commit if issues detected
- No database changes = simple rollback

**Post-Deployment Verification:**
- Test on real iPhone (Safari) - safe area padding
- Test on real Android (Chrome) - haptic feedback
- Verify desktop unchanged via Chrome DevTools

---

## Technical Context

### Existing Patterns to Follow

- **Animation:** Use Framer Motion variants (see `/lib/animations/variants.ts`)
- **Styling:** Use Tailwind CSS with CSS custom properties from `/styles/variables.css`
- **Icons:** Use lucide-react icons (already installed v0.546.0)
- **Utilities:** Use `cn()` from `/lib/utils` for class merging

### Key Files Reference

| File | Purpose |
|------|---------|
| `/components/shared/AppNavigation.tsx` | Current navigation (467 lines) |
| `/styles/variables.css` | CSS custom properties (407 lines) |
| `/app/layout.tsx` | Root layout (47 lines) |
| `/components/ui/glass/FloatingNav.tsx` | Reference pattern for glass styling |
| `/lib/animations/variants.ts` | Animation variants to extend |
| `/hooks/useReducedMotion.ts` | Pattern for media query hooks |

### Browser Support

- iOS Safari 14+ (primary)
- Android Chrome (secondary)
- Desktop Chrome, Firefox, Safari (desktop nav unchanged)

---

## Questions Resolved from Exploration

Based on explorer reports, the following decisions have been made:

| Question | Decision | Rationale |
|----------|----------|-----------|
| Should nav hide immediately or animate? | Animate out | Smoother UX, use spring animation |
| Should Reflect tab be center-prominent? | No (defer) | Keep MVP simple, equal-sized tabs |
| What z-index for bottom nav? | z-40 | Below modals (z-1000), above content (z-10) |
| Use emojis or icons in bottom nav? | Icons (lucide-react) | Icons scale better at 24px |
| Should bottom nav show during reflection? | Hidden | Reflection is full-screen takeover (future iteration) |
| Do we need useIsMobile hook? | Optional | CSS `md:hidden` is preferred for visibility |

---

## Next Steps

After this planning phase:

1. Create builders according to `builder-tasks.md`
2. Builders execute in parallel
3. Integrate outputs
4. Validate on real devices
5. Deploy to production

---

**Plan Status:** PLANNED
**Ready for:** Building Phase
**Estimated Completion:** ~5-7 hours from building start
