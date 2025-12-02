# 2L Iteration Plan - Full-Screen Reflection Experience

**Iteration:** 17 (Plan-11, Iteration 2)
**Created:** 2025-12-02
**Status:** PLANNING

---

## Project Vision

Transform the reflection experience from a cramped single-page form to an immersive, mobile-native step-by-step wizard. Users should feel like they are having a focused, intimate conversation with the Mirror, with each question given proper space and attention. This iteration builds on the mobile navigation foundation (Iteration 16) to deliver the emotional core of the Mirror of Dreams mobile experience.

**Key Transformation:**
- FROM: 4 long-form questions stacked vertically with cramped inputs
- TO: One question per screen with full attention, swipe navigation, and beautiful transitions

---

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] Mobile users see step-by-step reflection wizard (one question per screen)
- [ ] Desktop users see unchanged reflection experience (zero regressions)
- [ ] Dream selection uses native bottom sheet on mobile
- [ ] Progress dots visible at top showing current step (5 steps: Dream + 4 questions + Tone)
- [ ] Swipe left/right navigates between steps
- [ ] Keyboard appears without covering the textarea input
- [ ] Exit confirmation appears if user has unsaved input
- [ ] Bottom navigation is hidden during reflection flow
- [ ] Gazing loading state is immersive and full-screen
- [ ] All touch targets >= 48px (dreams in bottom sheet >= 60px)

---

## MVP Scope

### In Scope

1. **BottomSheet Component**
   - Slide-up animation with spring physics
   - Drag handle for swipe-to-dismiss
   - Height modes: auto, half, full
   - Safe area padding for notched devices
   - Backdrop overlay with fade

2. **Dream Selection Bottom Sheet**
   - Uses BottomSheet component
   - Large touch targets (60px+ per dream)
   - Currently selected dream highlighted
   - Quick "Create Dream" inline option (title only)
   - Search/filter if many dreams

3. **Mobile Reflection Wizard (MobileReflectionFlow)**
   - Full-screen takeover (bottom nav hidden)
   - Step-based state machine: dreamSelect -> questions (1-4) -> tone -> gazing -> output
   - One question per screen with swipe/tap navigation
   - Progress dots at top (ProgressOrbs component)
   - Keyboard-aware textarea positioning
   - Exit confirmation modal for dirty form state
   - LocalStorage persistence for session recovery

4. **Enhanced Gazing Experience**
   - Full-screen immersive loading animation
   - Status text transitions with cosmic feel
   - Breathing cosmic effects (respect reduced motion)

5. **Core Mobile Infrastructure**
   - `useKeyboardHeight` hook for visualViewport API
   - `useIsMobile` hook for conditional rendering
   - `NavigationContext` for controlling bottom nav visibility
   - Step transition animation variants

### Out of Scope (Post-MVP)

- Voice input for reflections
- Offline draft caching with sync
- Gesture hints / onboarding animations
- Horizontal swipe for dream cards on main dreams page
- AI response pagination on mobile

---

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 4 parallel builders (~4-6 hours)
4. **Integration** - ~30 minutes
5. **Validation** - ~20 minutes
6. **Deployment** - Final

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | 2 explorers |
| Planning | Complete | This document |
| Building | 4-6 hours | 4 parallel builders |
| Integration | 30 minutes | Merge builder outputs |
| Validation | 20 minutes | Manual mobile testing |
| **Total** | **~5-7 hours** | |

---

## Risk Assessment

### High Risks

1. **iOS Keyboard Viewport Behavior**
   - Risk: iOS Safari has complex viewport behavior when keyboard appears
   - Mitigation: Use `visualViewport` API with 150px threshold to detect keyboard
   - Fallback: CSS `env(keyboard-inset-height)` where supported, scroll-into-view on focus
   - Testing: Must test on real iOS device, not just Chrome DevTools

2. **Swipe Gesture vs Text Selection Conflict**
   - Risk: Horizontal swipe navigation conflicts with text selection in textarea
   - Mitigation: Disable swipe when textarea is focused
   - Pattern: `drag={isTextareaFocused ? false : 'x'}` in Framer Motion

### Medium Risks

1. **Form Data Loss on Accidental Exit**
   - Risk: User loses answers on accidental back/close
   - Mitigation: Exit confirmation modal + localStorage persistence
   - Pattern: `beforeunload` event + isDirty check

2. **Animation Performance on Low-End Devices**
   - Risk: Janky step transitions on older phones
   - Mitigation: Use `will-change: transform`, respect `prefers-reduced-motion`
   - Testing: Test on mid-range Android device

3. **Context Propagation for Nav Visibility**
   - Risk: NavigationContext not properly wiring up
   - Mitigation: Simple boolean context, wrap at layout level
   - Testing: Verify bottom nav hides on reflection entry, shows on exit

### Low Risks

1. **Desktop Regression**
   - Risk: Breaking existing desktop reflection flow
   - Mitigation: Conditional rendering at top level - mobile-only components
   - Pattern: `if (isMobile) return <MobileReflectionFlow />; return <DesktopFlow />;`

---

## Integration Strategy

### Component Integration

1. **NavigationContext** wraps the app layout (`app/layout.tsx`)
2. **BottomNavigation** reads from NavigationContext, hides when `showBottomNav === false`
3. **MobileReflectionFlow** calls `setShowBottomNav(false)` on mount, `true` on unmount
4. **MirrorExperience.tsx** conditionally renders MobileReflectionFlow for mobile users

### Data Flow

- Form data managed in MobileReflectionFlow (same FormData interface as MirrorExperience)
- On submit, calls same `trpc.reflection.create.useMutation()` - no API changes
- Dreams fetched via same `trpc.dreams.list.useQuery()` - no API changes

### File Ownership

| Builder | Creates | Modifies |
|---------|---------|----------|
| Builder-1 | useKeyboardHeight, useIsMobile, NavigationContext | layout.tsx, BottomNavigation |
| Builder-2 | BottomSheet | variants.ts |
| Builder-3 | MobileReflectionFlow, QuestionStep, ToneStep | - |
| Builder-4 | - | MirrorExperience.tsx, reflection/page.tsx |

---

## Deployment Plan

1. **Build Verification**
   - Run `npm run build` to ensure no TypeScript errors
   - Verify bundle size increase < 15KB gzipped

2. **Testing Checklist**
   - [ ] Mobile Chrome: Full wizard flow
   - [ ] Mobile Safari: Keyboard handling
   - [ ] Desktop Chrome: No regressions
   - [ ] Tablet: Falls back gracefully (desktop or mobile based on breakpoint)

3. **Deployment**
   - Standard Vercel deployment
   - No environment variable changes
   - No database migrations

---

## Builder Summary

| Builder | Responsibility | Complexity | Dependencies |
|---------|----------------|------------|--------------|
| Builder-1 | Core Mobile Hooks & Utilities | MEDIUM | None |
| Builder-2 | BottomSheet Component | MEDIUM | Builder-1 (safe areas) |
| Builder-3 | MobileReflectionFlow Wizard | HIGH | Builder-1, Builder-2 |
| Builder-4 | Integration with MirrorExperience | LOW | Builder-1, Builder-3 |

**Execution Order:**
- Parallel Group 1: Builder-1, Builder-2 (no dependencies)
- Parallel Group 2: Builder-3 (depends on Builder-1 hooks, Builder-2 bottom sheet)
- Parallel Group 3: Builder-4 (depends on Builder-3)

---

**Plan Status:** READY FOR BUILDING
