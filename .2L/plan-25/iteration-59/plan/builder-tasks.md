# Builder Task Breakdown

## Overview

3 primary builders will work in parallel. No splits recommended - all tasks are low complexity.

## Builder Assignment Strategy

- Builders work on completely isolated file sets
- No dependencies between builders
- All changes are straightforward find-and-replace or single-line edits
- Test updates are REQUIRED for Builder-1

---

## Builder-1: ReflectionItem Preview Fix + Test Update

### Scope

Fix the dashboard reflection preview text to show AI response instead of question text. Update the corresponding test to match the new expected behavior.

### Complexity Estimate

**LOW**

Simple fallback order change (remove one field from chain) plus test update.

### Success Criteria

- [ ] `getReflectionPreview()` no longer uses `refl.dream` field
- [ ] Fallback order is: `aiResponse -> ai_response -> content -> preview`
- [ ] Test at line 375-383 updated to expect fallback text instead of dream field
- [ ] All ReflectionItem tests pass

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/ReflectionItem.tsx` | 88 | Remove `refl.dream` from fallback chain |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/ReflectionItem.test.tsx` | 375-383 | Update test expectation |

### Implementation Notes

**Step 1: Update the test FIRST**

Change lines 375-383 from:
```typescript
it('should use dream field if available', () => {
  const reflection = createMockReflection({
    content: undefined,
    dream: 'Dream content here',
  });
  render(<ReflectionItem reflection={reflection} />);

  expect(screen.getByText('Dream content here')).toBeInTheDocument();
});
```

To:
```typescript
it('should NOT use dream field for preview (shows fallback instead)', () => {
  const reflection = createMockReflection({
    content: undefined,
    dream: 'Dream content here',
    aiResponse: undefined,
    ai_response: undefined,
    preview: undefined,
  });
  render(<ReflectionItem reflection={reflection} />);

  expect(screen.getByText('Your reflection content...')).toBeInTheDocument();
});
```

**Step 2: Fix the component**

Change line 88 from:
```typescript
const text = refl.aiResponse || refl.ai_response || refl.dream || refl.content || refl.preview;
```

To:
```typescript
const text = refl.aiResponse || refl.ai_response || refl.content || refl.preview;
```

### Patterns to Follow

- See `patterns.md` section "ReflectionItem Preview Pattern"
- See `patterns.md` section "Testing Patterns"

### Testing Requirements

- Run: `npm run test -- components/dashboard/shared/__tests__/ReflectionItem.test.tsx`
- All existing tests must pass
- Updated test must pass with new expectation

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

---

## Builder-2: Bottom Padding Fixes (4 Pages)

### Scope

Apply correct bottom padding pattern to 4 pages that have content hidden behind bottom navigation on mobile devices with safe areas.

### Complexity Estimate

**LOW**

Simple CSS class replacement on 4 files. Identical change on each file.

### Success Criteria

- [ ] All 4 pages use `pb-[calc(80px+env(safe-area-inset-bottom))]` for mobile
- [ ] Desktop padding (`md:pb-8`) preserved
- [ ] All page content visible above bottom navigation on notched devices

### Files to Modify

| File | Line | Current | New |
|------|------|---------|-----|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` | 132 | `pb-20` | `pb-[calc(80px+env(safe-area-inset-bottom))]` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx` | 108 | `pb-20` | `pb-[calc(80px+env(safe-area-inset-bottom))]` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` | 115 | `pb-20` | `pb-[calc(80px+env(safe-area-inset-bottom))]` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx` | 137 | `pb-20` | `pb-[calc(80px+env(safe-area-inset-bottom))]` |

### Implementation Notes

**Example change for visualizations/page.tsx (Line 132):**

From:
```tsx
<div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br px-4 pb-20 pt-nav sm:px-8 md:pb-8">
```

To:
```tsx
<div className="from-mirror-dark via-mirror-midnight to-mirror-dark min-h-screen bg-gradient-to-br px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-nav sm:px-8 md:pb-8">
```

**Apply identical pattern to all 4 files.**

### Patterns to Follow

- See `patterns.md` section "Bottom Padding Pattern"
- Reference implementation: `/app/clarify/[sessionId]/page.tsx:400`

### Testing Requirements

- No automated tests for CSS styling
- Visual verification required on mobile emulator/device
- Verify all content scrollable and visible above bottom nav

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

---

## Builder-3: Mobile Reflection Flow Fixes

### Scope

Fix the mobile reflection flow to ensure the "Create Your First Dream" button is visible and tappable. Two changes: overflow behavior and bottom padding.

### Complexity Estimate

**LOW**

Two single-line CSS class changes on isolated mobile components.

### Success Criteria

- [ ] "Create Your First Dream" button is visible in empty state
- [ ] Button is tappable without scrolling issues
- [ ] Swipe gestures still work in reflection flow
- [ ] Animations not affected

### Files to Modify

| File | Line | Current | New |
|------|------|---------|-----|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/MobileReflectionFlow.tsx` | 188 | `overflow-hidden` | `overflow-y-auto` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/views/MobileDreamSelectionView.tsx` | 48 | `overflow-y-auto` | `overflow-y-auto pb-20` |

### Implementation Notes

**Change 1: MobileReflectionFlow.tsx (Line 188)**

From:
```tsx
<div className="relative flex-1 overflow-hidden">
```

To:
```tsx
<div className="relative flex-1 overflow-y-auto">
```

**Change 2: MobileDreamSelectionView.tsx (Line 48)**

From:
```tsx
<div className="flex-1 space-y-3 overflow-y-auto">
```

To:
```tsx
<div className="flex-1 space-y-3 overflow-y-auto pb-20">
```

### Patterns to Follow

- See `patterns.md` section "Mobile Overflow Pattern"

### Testing Requirements

- Manual testing required on mobile device/emulator
- Verify:
  1. Empty state shows "Create Your First Dream" button fully visible
  2. Button is tappable
  3. Dream list scrolls properly when populated
  4. Swipe gestures between wizard steps still work

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing

---

## Builder Execution Order

### Parallel Group 1 (All builders - No dependencies)

All three builders can work simultaneously:

- **Builder-1:** ReflectionItem fix + test update
- **Builder-2:** Bottom padding fixes (4 pages)
- **Builder-3:** Mobile reflection flow fixes

### Integration Notes

**No conflicts expected.** Each builder modifies completely isolated files:

| Builder | Files Modified |
|---------|----------------|
| Builder-1 | `ReflectionItem.tsx`, `ReflectionItem.test.tsx` |
| Builder-2 | `visualizations/page.tsx`, `dreams/page.tsx`, `evolution/page.tsx`, `clarify/page.tsx` |
| Builder-3 | `MobileReflectionFlow.tsx`, `MobileDreamSelectionView.tsx` |

### Post-Integration Verification

After all builders complete:

1. Run full test suite: `npm run test:run`
2. Verify all tests pass (especially ReflectionItem tests)
3. Visual verification on mobile:
   - Dashboard reflection previews show AI text
   - All pages have content above bottom nav
   - Create Dream button visible in mobile reflection flow

---

## Summary Table

| Builder | Task | Files | Test Updates | Complexity |
|---------|------|-------|--------------|------------|
| Builder-1 | ReflectionItem preview fix | 2 | YES (required) | LOW |
| Builder-2 | Bottom padding (4 pages) | 4 | No | LOW |
| Builder-3 | Mobile flow overflow | 2 | No | LOW |

**Total: 8 files modified, ~16 lines changed**
