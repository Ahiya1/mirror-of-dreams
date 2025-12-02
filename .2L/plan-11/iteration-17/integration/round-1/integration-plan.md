# Integration Plan - Round 1

**Created:** 2025-12-02T00:00:00Z
**Iteration:** plan-11/iteration-17
**Total builders to integrate:** 4

---

## Executive Summary

All 4 builders have completed their assigned tasks successfully. The integration is relatively straightforward as builders worked in proper dependency order and the shared file (`variants.ts`) was modified correctly without conflicts. The main integration concern is the **duplicate implementation** issue: Builder-3 created separate component files that are not being used by the main `MobileReflectionFlow.tsx`, which has all functionality implemented inline. Additionally, Builder-3's `MobileReflectionFlow` contains a self-contained `useKeyboardHeightInternal()` hook that duplicates Builder-1's `useKeyboardHeight` hook.

Key insights:
- Animation variants in `variants.ts` were successfully merged by Builder-1 (all variants present)
- `MobileReflectionFlow.tsx` has inline implementations instead of using Builder-3's modular components
- The `NavigationContext` is wired up but `MobileReflectionFlow` does not call `useHideBottomNav()`
- Builder-2's `BottomSheet` component exists but is not utilized by `DreamBottomSheet` (which has its own implementation)

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Core Mobile Hooks & Utilities - Status: COMPLETE
- **Builder-2:** BottomSheet Component - Status: COMPLETE
- **Builder-3:** MobileReflectionFlow Wizard - Status: COMPLETE
- **Builder-4:** Integration with MirrorExperience - Status: COMPLETE

### Sub-Builders
None (no builders split)

**Total outputs to integrate:** 4 builder reports, 17+ files created/modified

---

## Integration Zones

### Zone 1: Duplicate useKeyboardHeight Implementation

**Builders involved:** Builder-1, Builder-3

**Conflict type:** Duplicate implementations

**Risk level:** LOW

**Description:**
Builder-3 created a self-contained `useKeyboardHeightInternal()` hook inside `MobileReflectionFlow.tsx` (lines 19-46) because Builder-1's hook was not available at build time. Now that Builder-1's canonical `useKeyboardHeight` hook exists at `/lib/hooks/useKeyboardHeight.ts`, the inline implementation should be removed and the import added.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx` - Contains inline `useKeyboardHeightInternal()` that duplicates Builder-1's hook

**Integration strategy:**
1. Remove the `useKeyboardHeightInternal` function (lines 14-46)
2. Remove the `KEYBOARD_THRESHOLD` constant (line 13)
3. Add import: `import { useKeyboardHeight } from '@/lib/hooks/useKeyboardHeight';`
4. Replace `useKeyboardHeightInternal()` call with `useKeyboardHeight()`

**Expected outcome:**
Single source of truth for keyboard height detection.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: Missing NavigationContext Integration

**Builders involved:** Builder-1, Builder-3

**Conflict type:** Missing integration

**Risk level:** MEDIUM

**Description:**
Builder-1 created `NavigationContext` with `useHideBottomNav()` hook specifically for hiding the bottom nav during full-screen experiences. Builder-3's `MobileReflectionFlow` component does NOT call this hook - it relies on z-50 positioning to overlay the bottom nav. This means the bottom nav is technically still rendered (and potentially receiving clicks) underneath the reflection flow.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx` - Should call `useHideBottomNav()`

**Integration strategy:**
1. Add import: `import { useHideBottomNav } from '@/contexts/NavigationContext';`
2. Add hook call at component top level: `useHideBottomNav();` (after line 196)
3. This will properly hide the bottom nav when the reflection flow is mounted

**Expected outcome:**
Bottom navigation is properly hidden (not just overlaid) during reflection flow.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 3: Unused Modular Components (DreamBottomSheet)

**Builders involved:** Builder-2, Builder-3

**Conflict type:** Pattern conflict / Duplicate implementations

**Risk level:** LOW

**Description:**
Builder-2 created a reusable `BottomSheet` component at `/components/ui/mobile/BottomSheet.tsx`. Builder-3 created `DreamBottomSheet` at `/components/reflection/mobile/DreamBottomSheet.tsx` which implements its **own** bottom sheet logic (lines 46-47 define thresholds, has own drag handling) instead of using Builder-2's component.

Additionally, the main `MobileReflectionFlow.tsx` doesn't even use `DreamBottomSheet` - it has dream selection rendered inline (lines 355-418 in `renderStepContent`).

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/DreamBottomSheet.tsx` - Has own BottomSheet implementation
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/ui/mobile/BottomSheet.tsx` - Builder-2's reusable component (unused)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx` - Has inline dream selection

**Integration strategy:**
Since the current implementation works and `MobileReflectionFlow` has inline dream selection, we have two options:

**Option A (Recommended - Preserve working code):**
- Keep the current inline dream selection in `MobileReflectionFlow.tsx`
- Mark `DreamBottomSheet.tsx` as a standalone component for future use
- No changes required for this integration round

**Option B (Full refactor - Future enhancement):**
- Refactor `DreamBottomSheet` to use Builder-2's `BottomSheet` component
- Refactor `MobileReflectionFlow` to use `DreamBottomSheet` component
- This is a larger refactor best done in a future iteration

**Expected outcome (Option A):**
Current functionality preserved, components available for future use.

**Assigned to:** Integrator-1 (Document decision, no code changes)

**Estimated complexity:** LOW (documentation only)

---

### Zone 4: Unused Modular Components (QuestionStep, ToneStep, GazingOverlay, ExitConfirmation)

**Builders involved:** Builder-3

**Conflict type:** Unused code

**Risk level:** LOW

**Description:**
Builder-3 created separate component files that are exported from the barrel file but not actually used by `MobileReflectionFlow.tsx`:
- `QuestionStep.tsx` - MobileReflectionFlow has inline question rendering (lines 421-491)
- `ToneStep.tsx` - MobileReflectionFlow has inline tone rendering (lines 493-542)
- `GazingOverlay.tsx` - MobileReflectionFlow has inline gazing overlay (lines 591-635)
- `ExitConfirmation.tsx` - MobileReflectionFlow has inline exit confirmation (lines 638-682)

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/QuestionStep.tsx` - Unused
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/ToneStep.tsx` - Unused
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/GazingOverlay.tsx` - Unused
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/ExitConfirmation.tsx` - Unused
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/index.ts` - Exports unused components

**Integration strategy:**
**Option A (Recommended - Keep for future):**
- Keep these components as they provide modular building blocks
- They can be used in future refactoring to make `MobileReflectionFlow` more maintainable
- No immediate action required

**Option B (Cleanup):**
- Remove unused component files
- Update barrel exports
- This would reduce bundle size slightly but lose reusable code

**Expected outcome (Option A):**
Components remain available for future use or refactoring.

**Assigned to:** Integrator-1 (Document decision, no code changes)

**Estimated complexity:** LOW (documentation only)

---

### Zone 5: Animation Variants File

**Builders involved:** Builder-1, Builder-2, Builder-3

**Conflict type:** Shared file modifications

**Risk level:** NONE (Already resolved)

**Description:**
Multiple builders were expected to modify `/lib/animations/variants.ts`. Builder-1's report indicates they added ALL the required variants:
- `bottomSheetVariants` (for Builder-2)
- `bottomSheetBackdropVariants` (for Builder-2)
- `stepTransitionVariants` (for Builder-3)
- `gazingOverlayVariants` (for Builder-3)
- `statusTextVariants` (for Builder-3)

Verification confirmed all variants are present in the file (lines 385-497).

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/lib/animations/variants.ts` - All variants present

**Integration strategy:**
No action required - file is complete and correct.

**Expected outcome:**
Animation variants available for all components.

**Assigned to:** N/A (Already complete)

**Estimated complexity:** NONE

---

## Independent Features (Direct Merge)

These builder outputs have no conflicts and can be considered directly merged:

- **Builder-1:** All hooks and context properly created and exported
  - `/lib/hooks/useIsMobile.ts`
  - `/lib/hooks/useKeyboardHeight.ts`
  - `/contexts/NavigationContext.tsx`
  - `/contexts/index.ts`
  - Modified: `/lib/hooks/index.ts`, `/components/navigation/BottomNavigation.tsx`, `/app/layout.tsx`

- **Builder-2:** BottomSheet component complete and functional
  - `/components/ui/mobile/BottomSheet.tsx`
  - `/components/ui/mobile/index.ts`

- **Builder-4:** MirrorExperience integration complete and working
  - Modified: `/app/reflection/MirrorExperience.tsx` with mobile conditional rendering

---

## Parallel Execution Groups

### Group 1 (Single Integrator)
- **Integrator-1:** Zone 1, Zone 2, Zone 3, Zone 4

**Rationale:** All zones are small, related, and don't conflict. A single integrator can handle all integration tasks efficiently.

---

## Integration Order

**Recommended sequence:**

1. **Zone 1: Replace duplicate keyboard hook** (5 minutes)
   - Remove inline implementation
   - Add proper import
   - Quick test to verify keyboard handling still works

2. **Zone 2: Add NavigationContext integration** (5 minutes)
   - Add import for `useHideBottomNav`
   - Add hook call at component top level
   - Verify bottom nav properly hides during reflection

3. **Zone 3 & 4: Document decisions** (5 minutes)
   - Add code comments explaining unused components are kept for future use
   - No functional changes

4. **Final consistency check** (5 minutes)
   - Run `npm run build` to verify no TypeScript errors
   - Quick manual test on mobile viewport

---

## Shared Resources Strategy

### Shared Types
**Issue:** `FormData` and `Dream` types are defined inline in `MobileReflectionFlow.tsx`

**Resolution:**
- These types are also defined in `MirrorExperience.tsx`
- For this integration, keep as-is (both files have compatible definitions)
- Future enhancement: Extract to shared types file

**Responsible:** Integrator-1 (document, no changes this round)

### Shared Utilities
**Issue:** `CATEGORY_EMOJI` constant is duplicated in:
- `MobileReflectionFlow.tsx` (lines 155-170)
- `DreamBottomSheet.tsx` (lines 10-26)
- `MirrorExperience.tsx` (lines 253-264)

**Resolution:**
- Keep as-is for this integration (all use consistent Unicode escapes)
- Future enhancement: Extract to shared constants file

**Responsible:** Integrator-1 (document, no changes this round)

### Configuration Files
**Issue:** None - no config changes in this iteration

**Resolution:** N/A

---

## Expected Challenges

### Challenge 1: Testing keyboard behavior
**Impact:** Hard to test keyboard height detection without real device
**Mitigation:** Use Chrome DevTools mobile emulation with device toolbar
**Responsible:** Integrator-1

### Challenge 2: Verifying bottom nav hiding
**Impact:** Need to confirm NavigationContext integration works
**Mitigation:** Test by navigating to reflection page on mobile viewport
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [x] All builders completed successfully (verified)
- [ ] Zone 1: Duplicate `useKeyboardHeightInternal` removed, using shared hook
- [ ] Zone 2: `useHideBottomNav()` called in MobileReflectionFlow
- [ ] Zone 3: Decision documented (keep unused BottomSheet pattern)
- [ ] Zone 4: Decision documented (keep modular components for future)
- [ ] TypeScript compiles with no errors
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] Mobile reflection flow works end-to-end
- [ ] Desktop reflection flow unchanged

---

## Notes for Integrators

**Important context:**
- Builder-3's `MobileReflectionFlow` is self-contained with inline implementations - this is functional but less modular
- The separate component files (QuestionStep, ToneStep, etc.) are available for future refactoring
- Animation variants are all present and correctly defined

**Watch out for:**
- The inline keyboard hook in MobileReflectionFlow needs to be removed
- Bottom nav hiding needs to be added via context
- Don't break the working functionality while integrating

**Patterns to maintain:**
- Reference `patterns.md` for all conventions
- Use `'use client'` directive on client components
- Follow import order convention
- Keep error handling consistent

---

## Files Summary

### Files requiring integration changes:
| File | Change Type | Zone |
|------|-------------|------|
| `/components/reflection/mobile/MobileReflectionFlow.tsx` | Modify | Zone 1, Zone 2 |

### Files verified complete (no changes needed):
| File | Status |
|------|--------|
| `/lib/hooks/useIsMobile.ts` | Complete |
| `/lib/hooks/useKeyboardHeight.ts` | Complete |
| `/contexts/NavigationContext.tsx` | Complete |
| `/contexts/index.ts` | Complete |
| `/lib/hooks/index.ts` | Complete |
| `/lib/animations/variants.ts` | Complete |
| `/components/navigation/BottomNavigation.tsx` | Complete |
| `/app/layout.tsx` | Complete |
| `/components/ui/mobile/BottomSheet.tsx` | Complete |
| `/components/ui/mobile/index.ts` | Complete |
| `/components/reflection/mobile/QuestionStep.tsx` | Complete (unused) |
| `/components/reflection/mobile/ToneStep.tsx` | Complete (unused) |
| `/components/reflection/mobile/DreamBottomSheet.tsx` | Complete (unused) |
| `/components/reflection/mobile/GazingOverlay.tsx` | Complete (unused) |
| `/components/reflection/mobile/ExitConfirmation.tsx` | Complete (unused) |
| `/components/reflection/mobile/index.ts` | Complete |
| `/app/reflection/MirrorExperience.tsx` | Complete |

---

## Next Steps

1. Spawn Integrator-1 with this plan
2. Integrator-1 executes Zone 1 and Zone 2 changes
3. Integrator-1 documents Zone 3 and Zone 4 decisions
4. Run build verification
5. Proceed to ivalidator for final testing

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-12-02
**Round:** 1
