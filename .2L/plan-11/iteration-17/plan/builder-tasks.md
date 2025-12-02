# Builder Task Breakdown

**Iteration:** 17 - Full-Screen Reflection Experience
**Created:** 2025-12-02

---

## Overview

**4 primary builders** will work in parallel where possible.

| Builder | Scope | Complexity | Est. Hours |
|---------|-------|------------|------------|
| Builder-1 | Core Mobile Hooks & Utilities | MEDIUM | 1.5-2 |
| Builder-2 | BottomSheet Component | MEDIUM | 1.5-2 |
| Builder-3 | MobileReflectionFlow Wizard | HIGH | 3-4 |
| Builder-4 | Integration with MirrorExperience | LOW | 0.5-1 |

**Total Estimated Time:** 4-6 hours (with parallelization)

---

## Builder Assignment Strategy

- Builder-1 and Builder-2 work in **parallel** (no dependencies)
- Builder-3 starts after Builder-1 and Builder-2 complete (needs hooks + BottomSheet)
- Builder-4 starts after Builder-3 completes (needs MobileReflectionFlow)

---

## Builder-1: Core Mobile Hooks & Utilities

### Scope

Create the foundational hooks and context that enable mobile-specific behavior throughout the app. This includes mobile detection, keyboard handling, and navigation visibility control.

### Complexity Estimate

**MEDIUM**

Standard React patterns, no complex logic. Main consideration is SSR safety and proper cleanup.

### Success Criteria

- [ ] `useIsMobile` hook correctly detects mobile viewport (< 768px)
- [ ] `useKeyboardHeight` hook returns keyboard height using visualViewport API
- [ ] `NavigationContext` provides `showBottomNav` state and setter
- [ ] `useHideBottomNav` helper hook hides nav on mount, restores on unmount
- [ ] `BottomNavigation` respects NavigationContext (hides when `showBottomNav === false`)
- [ ] `app/layout.tsx` wraps content with `NavigationProvider`
- [ ] All hooks are SSR-safe (no `window` access during SSR)
- [ ] Hooks are properly exported from index file

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `/lib/hooks/useIsMobile.ts` | Mobile viewport detection | 25-30 |
| `/lib/hooks/useKeyboardHeight.ts` | Virtual keyboard height detection | 40-50 |
| `/contexts/NavigationContext.tsx` | Bottom nav visibility context | 50-60 |
| `/contexts/index.ts` | Barrel exports for contexts | 5 |

### Files to Modify

| File | Changes |
|------|---------|
| `/lib/hooks/index.ts` | Export new hooks |
| `/components/navigation/BottomNavigation.tsx` | Import and use NavigationContext |
| `/app/layout.tsx` | Wrap with NavigationProvider |

### Dependencies

**Depends on:** Nothing (independent)
**Blocks:** Builder-3, Builder-4

### Implementation Notes

1. **useIsMobile:**
   - Initialize state to `false` for SSR
   - Check `window.innerWidth < 768` on mount and resize
   - Use passive resize listener for performance
   - Debounce is optional (resize events are rare)

2. **useKeyboardHeight:**
   - Check for `window.visualViewport` existence
   - Use 150px threshold to avoid false positives from address bar
   - Return 0 when keyboard is hidden
   - Cleanup listener on unmount

3. **NavigationContext:**
   - Simple boolean state with setter
   - Provide `useHideBottomNav` convenience hook
   - Error if used outside provider

4. **BottomNavigation modification:**
   - Import `useNavigation` from context
   - Modify visibility logic: `const isVisible = showBottomNav && scrollDirection !== 'down'`
   - No other changes to component

5. **layout.tsx modification:**
   - Import `NavigationProvider`
   - Wrap around existing content (inside TRPCProvider)
   - No visual changes

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **useIsMobile Hook** pattern exactly as specified
- Use **useKeyboardHeight Hook** pattern exactly as specified
- Use **NavigationContext** pattern exactly as specified
- Follow **Import Order Convention**

### Testing Requirements

- Manual test: Bottom nav hides when context value is false
- Manual test: Hooks return correct values on mobile viewport
- Unit tests (if time permits): Hook return values at different breakpoints

---

## Builder-2: BottomSheet Component

### Scope

Create a reusable, accessible bottom sheet component with swipe-to-dismiss functionality. This component will be used for dream selection and potentially other mobile-specific modals.

### Complexity Estimate

**MEDIUM**

Framer Motion drag APIs are well-documented. Main complexity is in the snap-back animation logic and proper ARIA attributes.

### Success Criteria

- [ ] BottomSheet slides up from bottom with spring animation
- [ ] Drag handle visible at top for affordance
- [ ] Swipe down > 100px dismisses sheet
- [ ] Fast swipe (velocity > 500px/s) dismisses regardless of distance
- [ ] Slow drag that doesn't exceed threshold snaps back
- [ ] Backdrop covers full screen, click dismisses
- [ ] Body scroll locked while sheet is open
- [ ] Safe area padding applied at bottom
- [ ] Height modes work: 'auto', 'half', 'full'
- [ ] Optional title prop renders properly
- [ ] Proper ARIA attributes for accessibility

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `/components/ui/mobile/BottomSheet.tsx` | Reusable bottom sheet | 150-180 |
| `/components/ui/mobile/index.ts` | Barrel exports | 5 |

### Files to Modify

| File | Changes |
|------|---------|
| `/lib/animations/variants.ts` | Add `bottomSheetVariants`, `bottomSheetBackdropVariants` |

### Dependencies

**Depends on:** Nothing (can use existing safe area CSS variables)
**Blocks:** Builder-3

### Implementation Notes

1. **Animation Configuration:**
   - Use spring physics: `stiffness: 300, damping: 30`
   - Exit animation: 200ms ease-in for snappy feel
   - Backdrop: Simple opacity fade

2. **Drag Handling:**
   - Use `useMotionValue` for y position
   - `drag="y"` with `dragConstraints={{ top: 0 }}`
   - `dragElastic={{ top: 0, bottom: 0.5 }}` for rubber-band effect
   - Call `animate(y, 0, ...)` for snap-back

3. **Dismiss Logic:**
   ```typescript
   const shouldDismiss =
     info.offset.y > 100 ||    // Distance threshold
     info.velocity.y > 500;    // Velocity threshold
   ```

4. **Body Scroll Lock:**
   - Set `document.body.style.overflow = 'hidden'` on open
   - Clear on close and cleanup
   - Use effect with isOpen dependency

5. **Accessibility:**
   - `role="dialog"` and `aria-modal="true"`
   - Focus trap (use existing pattern or simple implementation)
   - Backdrop has `aria-hidden="true"`

6. **Styling:**
   - Background: `bg-mirror-void-deep/95 backdrop-blur-xl`
   - Border: `border-t border-white/10 rounded-t-3xl`
   - Use CSS variable for safe area: `pb-[env(safe-area-inset-bottom)]`

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **BottomSheet Component Pattern** as the primary template
- Use **Animation Variants** section for bottomSheetVariants
- Follow **Import Order Convention**

### Testing Requirements

- Manual test: Open, drag partially, release (should snap back)
- Manual test: Open, swipe fast downward (should dismiss)
- Manual test: Open, drag past threshold, release (should dismiss)
- Manual test: Tap backdrop (should dismiss)
- Manual test: Scroll content inside sheet (body should not scroll)

---

## Builder-3: MobileReflectionFlow Wizard

### Scope

Create the main mobile reflection wizard that provides a step-by-step, full-screen experience. This is the core deliverable of this iteration - the component that transforms the cramped form into an immersive journey.

### Complexity Estimate

**HIGH**

Multiple interconnected pieces: step state machine, swipe navigation, keyboard handling, form persistence, exit confirmation. Recommend not splitting unless implementation exceeds 4 hours.

### Success Criteria

- [ ] Full-screen takeover (bottom nav hidden via context)
- [ ] Step flow: Dream Select -> Q1 -> Q2 -> Q3 -> Q4 -> Tone -> Gazing
- [ ] ProgressOrbs at top showing current step
- [ ] One question per screen with smooth slide transitions
- [ ] Swipe left/right advances/retreats between steps
- [ ] Swipe disabled when textarea is focused
- [ ] Next/Previous buttons visible and functional
- [ ] Keyboard-aware positioning (textarea stays visible)
- [ ] Exit confirmation appears if form is dirty
- [ ] Form data persists to localStorage
- [ ] Gazing overlay shows during submission
- [ ] Close button returns to dashboard

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `/components/reflection/mobile/MobileReflectionFlow.tsx` | Main wizard container | 300-400 |
| `/components/reflection/mobile/QuestionStep.tsx` | Individual question screen | 100-130 |
| `/components/reflection/mobile/ToneStep.tsx` | Tone selection screen | 80-100 |
| `/components/reflection/mobile/DreamBottomSheet.tsx` | Dream picker sheet | 100-130 |
| `/components/reflection/mobile/GazingOverlay.tsx` | Loading animation | 80-100 |
| `/components/reflection/mobile/ExitConfirmation.tsx` | Exit prompt modal | 40-50 |
| `/components/reflection/mobile/index.ts` | Barrel exports | 10 |

### Files to Modify

| File | Changes |
|------|---------|
| `/lib/animations/variants.ts` | Add `stepTransitionVariants`, `gazingOverlayVariants`, `statusTextVariants` |

### Dependencies

**Depends on:** Builder-1 (hooks, NavigationContext), Builder-2 (BottomSheet)
**Blocks:** Builder-4

### Implementation Notes

1. **Step State Machine:**
   ```typescript
   const WIZARD_STEPS = ['dreamSelect', 'q1', 'q2', 'q3', 'q4', 'tone'] as const;
   const [currentStepIndex, setCurrentStepIndex] = useState(0);
   const [direction, setDirection] = useState(0); // For animation direction
   ```

2. **Navigation Logic:**
   - Track `isTextareaFocused` state
   - Pass to drag handler: `drag={isTextareaFocused ? false : 'x'}`
   - Use `AnimatePresence mode="wait"` with `custom={direction}`

3. **Keyboard Handling:**
   - Use `useKeyboardHeight()` hook from Builder-1
   - Apply dynamic padding to QuestionStep container
   - Auto-scroll textarea into view on focus

4. **Form Persistence:**
   - Save to localStorage on formData changes
   - Restore on component mount (check 24hr expiry)
   - Clear on successful submission

5. **Exit Handling:**
   - Track `isDirty` state (any field has content)
   - Show ExitConfirmation modal before closing if dirty
   - Use `beforeunload` event for browser back/refresh

6. **Props Interface:**
   ```typescript
   interface MobileReflectionFlowProps {
     dreams: Dream[];
     selectedDreamId: string;
     onDreamSelect: (dream: Dream) => void;
     formData: FormData;
     onFieldChange: (field: keyof FormData, value: string) => void;
     selectedTone: ToneId;
     onToneSelect: (tone: ToneId) => void;
     onSubmit: () => void;
     isSubmitting: boolean;
     onClose: () => void;
   }
   ```

7. **Bottom Nav Hiding:**
   - Call `useHideBottomNav()` at component top level
   - Automatically restores nav on unmount

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Step Navigation Pattern** for swipe handling
- Use **Question Step Pattern** for question screens
- Use **Dream Bottom Sheet Pattern** for dream selection
- Use **Exit Confirmation Pattern** for exit modal
- Use **Gazing Overlay Pattern** for loading state
- Use **LocalStorage Persistence Pattern** for draft saving
- Use **Dirty Form Detection Pattern** for exit confirmation

### Testing Requirements

- Manual test: Complete full flow from dream selection to gazing
- Manual test: Swipe navigation between all steps
- Manual test: Type in textarea, then try to swipe (should not work while focused)
- Manual test: Start typing, then close (should show confirmation)
- Manual test: Background app, return (state should be preserved)
- Manual test: Submit reflection (localStorage should clear)

### Potential Split Strategy

If this task proves too complex (>4 hours), consider splitting:

**Foundation (MobileReflectionFlow):**
- Main container with step state
- Navigation logic
- Context integration

**Sub-builder 3A: QuestionStep + ToneStep**
- Individual step components
- Keyboard handling
- Estimate: MEDIUM

**Sub-builder 3B: DreamBottomSheet + GazingOverlay + ExitConfirmation**
- Supporting UI components
- Estimate: MEDIUM

---

## Builder-4: Integration with MirrorExperience

### Scope

Wire the new MobileReflectionFlow into the existing MirrorExperience component. Desktop users should see zero changes; mobile users should automatically get the new wizard.

### Complexity Estimate

**LOW**

Mostly conditional rendering. The complex logic lives in MobileReflectionFlow.

### Success Criteria

- [ ] Mobile users see MobileReflectionFlow for questionnaire mode
- [ ] Desktop users see unchanged experience
- [ ] Props correctly passed from MirrorExperience to MobileReflectionFlow
- [ ] Submit handler works identically for mobile flow
- [ ] Navigation back to dashboard works after completion
- [ ] No TypeScript errors
- [ ] No visual regressions on desktop

### Files to Create

None - this builder only modifies existing files.

### Files to Modify

| File | Changes |
|------|---------|
| `/app/reflection/MirrorExperience.tsx` | Add mobile conditional render |

### Dependencies

**Depends on:** Builder-1 (useIsMobile), Builder-3 (MobileReflectionFlow)
**Blocks:** Nothing (final integration)

### Implementation Notes

1. **Import Additions:**
   ```typescript
   import { useIsMobile } from '@/lib/hooks/useIsMobile';
   import { MobileReflectionFlow } from '@/components/reflection/mobile/MobileReflectionFlow';
   ```

2. **Conditional Render:**
   - Place early in component, before main return
   - Check: `isMobile && viewMode === 'questionnaire'`
   - Return MobileReflectionFlow with correct props

3. **Props Mapping:**
   - `dreams`: From tRPC query result
   - `selectedDreamId`: Existing state
   - `onDreamSelect`: Handler that sets both ID and dream object
   - `formData`: Existing state
   - `onFieldChange`: Existing handler
   - `selectedTone`: Existing state
   - `onToneSelect`: Existing setter
   - `onSubmit`: Existing submit handler
   - `isSubmitting`: Existing state
   - `onClose`: Navigate to dashboard

4. **Desktop Path:**
   - Completely unchanged
   - All existing JSX remains as-is

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use **Conditional Mobile Rendering Pattern** exactly as specified
- Follow **Import Order Convention**

### Testing Requirements

- Manual test (mobile): Full reflection flow works end-to-end
- Manual test (desktop): Zero visual or functional changes
- Manual test (tablet): Falls back appropriately based on viewport

---

## Builder Execution Order

```
Time 0 ─────────────────────────────────────────────────────→

Parallel Group 1 (No dependencies):
├── Builder-1: Hooks & Utilities    [████████]
└── Builder-2: BottomSheet          [████████]
                                              │
                                              ▼
                              Builder-3: MobileReflectionFlow
                                    [████████████████]
                                                     │
                                                     ▼
                                        Builder-4: Integration
                                              [████]
```

---

## Integration Notes

### How Builder Outputs Come Together

1. **Builder-1** creates the infrastructure (hooks, context)
2. **Builder-2** creates the BottomSheet (used by Builder-3)
3. **Builder-3** creates the MobileReflectionFlow (uses 1 + 2)
4. **Builder-4** wires MobileReflectionFlow into MirrorExperience

### Shared Files That Need Coordination

| File | Modified By | Notes |
|------|-------------|-------|
| `/lib/animations/variants.ts` | Builder-2, Builder-3 | Add variants at end of file, no conflicts |
| `/lib/hooks/index.ts` | Builder-1 | Export new hooks |
| `/app/layout.tsx` | Builder-1 | Wrap with provider |
| `/components/navigation/BottomNavigation.tsx` | Builder-1 | Add context usage |

### Potential Conflict Areas

1. **variants.ts:** Both Builder-2 and Builder-3 add variants
   - Resolution: Each adds to end of file, no overlap
   - Builder-2: `bottomSheetVariants`, `bottomSheetBackdropVariants`
   - Builder-3: `stepTransitionVariants`, `gazingOverlayVariants`, `statusTextVariants`

2. **MirrorExperience.tsx:** Only Builder-4 modifies
   - No conflicts expected

### Post-Build Verification

After all builders complete:

1. Run `npm run build` - verify no TypeScript errors
2. Test mobile flow end-to-end
3. Test desktop flow for regressions
4. Check bundle size increase
5. Test on real device if possible

---

## Summary Checklist

### Builder-1 Deliverables
- [ ] `/lib/hooks/useIsMobile.ts`
- [ ] `/lib/hooks/useKeyboardHeight.ts`
- [ ] `/contexts/NavigationContext.tsx`
- [ ] `/contexts/index.ts`
- [ ] Modified `/lib/hooks/index.ts`
- [ ] Modified `/components/navigation/BottomNavigation.tsx`
- [ ] Modified `/app/layout.tsx`

### Builder-2 Deliverables
- [ ] `/components/ui/mobile/BottomSheet.tsx`
- [ ] `/components/ui/mobile/index.ts`
- [ ] Modified `/lib/animations/variants.ts` (bottomSheetVariants)

### Builder-3 Deliverables
- [ ] `/components/reflection/mobile/MobileReflectionFlow.tsx`
- [ ] `/components/reflection/mobile/QuestionStep.tsx`
- [ ] `/components/reflection/mobile/ToneStep.tsx`
- [ ] `/components/reflection/mobile/DreamBottomSheet.tsx`
- [ ] `/components/reflection/mobile/GazingOverlay.tsx`
- [ ] `/components/reflection/mobile/ExitConfirmation.tsx`
- [ ] `/components/reflection/mobile/index.ts`
- [ ] Modified `/lib/animations/variants.ts` (stepTransitionVariants, etc.)

### Builder-4 Deliverables
- [ ] Modified `/app/reflection/MirrorExperience.tsx`

---

**Ready for Building**
