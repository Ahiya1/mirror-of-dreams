# 2L Iteration Plan - Mobile UX Bug Fixes (Iteration 59)

## Project Vision

Fix critical mobile user experience issues in Mirror of Dreams that degrade the mobile experience. The primary issues are: incorrect dashboard preview text showing question text instead of AI reflections, content hidden behind bottom navigation on multiple pages, and the "Create Dream" button being clipped during mobile reflection flow.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] Dashboard reflection preview shows AI response snippet (first 120 chars), never question text
- [ ] All pages with bottom navigation have content fully visible above the nav
- [ ] "Create Your First Dream" button is always visible and tappable in mobile reflection flow
- [ ] All existing tests pass (with required test updates)
- [ ] Zero visual regressions on desktop layouts

## MVP Scope

**In Scope:**
- Fix ReflectionItem preview text fallback order (remove `refl.dream`)
- Update ReflectionItem test to match new behavior
- Fix bottom padding on 4 pages: visualizations, dreams, evolution, clarify
- Fix mobile reflection flow overflow to show create dream button
- Add bottom padding to MobileDreamSelectionView scrollable area

**Out of Scope (Post-MVP):**
- Creating `pb-nav` utility class
- Adding mobile menu for tablet breakpoint
- Fixing hardcoded min-heights in dashboard grid
- Increasing bottom nav font size
- Adding BottomNavigation to reflections page
- Performance optimizations

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 30-45 minutes (3 parallel builders)
4. **Integration** - 5 minutes
5. **Validation** - 10 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~30 minutes (parallel builders)
- Integration: ~5 minutes
- Validation: ~10 minutes
- Total: ~45 minutes

## Risk Assessment

### Low Risks

- **Bottom padding changes on pages**: Pure CSS changes with no behavioral impact. Well-established reference pattern exists.
  - Mitigation: Use exact pattern from `/app/clarify/[sessionId]/page.tsx:400`

### Medium Risks

- **ReflectionItem test update**: Test explicitly validates current buggy behavior and must be updated.
  - Mitigation: Update test BEFORE changing component code to ensure clear expected behavior

- **MobileReflectionFlow overflow change**: Changing `overflow-hidden` to `overflow-y-auto` could affect swipe gestures.
  - Mitigation: Manual testing on mobile device to verify animations and gestures still work

## Integration Strategy

All three builders work on isolated areas with no shared files:

1. **Builder-1** (ReflectionItem): Dashboard component + its test file
2. **Builder-2** (Bottom Padding): 4 page files, no overlaps
3. **Builder-3** (Mobile Flow): 2 mobile component files

Integration is straightforward - merge all changes. No conflicts expected.

## Deployment Plan

1. Run all tests to verify no regressions
2. Visual verification on mobile emulator/device for:
   - Dashboard reflection previews
   - Bottom content visibility on all fixed pages
   - Create Dream button visibility in mobile flow
3. Standard deployment to production

## Files to Modify Summary

| Builder | Files | Lines Changed |
|---------|-------|---------------|
| Builder-1 | ReflectionItem.tsx, ReflectionItem.test.tsx | ~10 lines |
| Builder-2 | visualizations/page.tsx, dreams/page.tsx, evolution/page.tsx, clarify/page.tsx | 4 lines |
| Builder-3 | MobileReflectionFlow.tsx, MobileDreamSelectionView.tsx | 2 lines |

**Total: 8 files, ~16 lines changed**
