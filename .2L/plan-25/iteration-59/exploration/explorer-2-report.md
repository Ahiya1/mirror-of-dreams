# Explorer 2 Report: Testing and Patterns

## Executive Summary

The project has comprehensive test infrastructure using Vitest with testing-library, achieving approximately 78% code coverage. The key finding for Plan 25 is that the **ReflectionItem tests already include preview text tests that will need updating** when the `getReflectionPreview()` function is fixed. The correct bottom padding pattern is `pb-[calc(80px+env(safe-area-inset-bottom))]` as used in `/app/clarify/[sessionId]/page.tsx:400`.

## Discoveries

### Existing Test Files for ReflectionItem

Two test files directly test ReflectionItem functionality:

1. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/ReflectionItem.test.tsx`**
   - 503 lines of comprehensive tests
   - CRITICAL: Line 375-383 tests `refl.dream` fallback behavior that WILL CHANGE
   - Tests preview text truncation, HTML/markdown stripping
   - Tests AI response preference

2. **`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/cards/__tests__/ReflectionsCard.test.tsx`**
   - 455 lines testing the parent card component
   - Mocks ReflectionItem component
   - No direct preview text tests (uses mock)

### The Bug Location

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/ReflectionItem.tsx`
**Line 88:** The problematic fallback chain:
```typescript
const text = refl.aiResponse || refl.ai_response || refl.dream || refl.content || refl.preview;
//                                                   ^^^^^^^^
//                        BUG: refl.dream is the question text, NOT a fallback!
```

### Tests That Need Updating

**CRITICAL TEST (Line 375-383 in ReflectionItem.test.tsx):**
```typescript
it('should use dream field if available', () => {
  const reflection = createMockReflection({
    content: undefined,
    dream: 'Dream content here',  // THIS IS QUESTION TEXT!
  });
  render(<ReflectionItem reflection={reflection} />);
  
  expect(screen.getByText('Dream content here')).toBeInTheDocument();
});
```

This test explicitly verifies the current BUGGY behavior. After the fix, this test should:
1. Either be REMOVED (if `dream` should never appear in preview)
2. Or be UPDATED to expect fallback to "Your reflection content..."

### Correct Bottom Padding Pattern

**Reference Implementation:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx:400`
```tsx
<div className="px-4 pb-[calc(80px+env(safe-area-inset-bottom))] sm:px-8 md:pb-6">
```

**Pattern breakdown:**
- `pb-[calc(80px+env(safe-area-inset-bottom))]` - Mobile: 80px base + dynamic safe area
- `sm:px-8` - Small screens: 32px horizontal padding
- `md:pb-6` - Desktop: Only 24px bottom padding (no nav overlap)

### Pages with Incorrect Bottom Padding

All using the problematic `pb-20` (80px static, no safe-area):

| File | Line | Current Pattern |
|------|------|-----------------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/visualizations/page.tsx` | 132 | `pb-20 ... md:pb-8` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/page.tsx` | 137 | `pb-20 ... md:pb-8` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/dreams/page.tsx` | 108 | `pb-20 ... md:pb-8` |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/evolution/page.tsx` | 115 | `pb-20 ... md:pb-8` |

## Patterns Identified

### Testing Pattern: Component Test Structure

**Description:** All component tests follow a consistent pattern with describe blocks for categories

**Structure:**
```typescript
describe('ComponentName', () => {
  describe('rendering', () => { /* basic render tests */ });
  describe('loading state', () => { /* loading UI tests */ });
  describe('error state', () => { /* error handling tests */ });
  describe('interactions', () => { /* click/hover tests */ });
  describe('accessibility', () => { /* a11y tests */ });
});
```

**Recommendation:** Follow this pattern for any new tests

### Testing Pattern: Mock Factory Functions

**Description:** Create factory functions for mock data with sensible defaults

**Example from ReflectionItem.test.tsx:**
```typescript
const createMockReflection = (overrides = {}) => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Default content...',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  ...overrides,  // Allow specific overrides
});
```

**Recommendation:** Use this pattern for all mock data

### Mobile Component Pattern: Full-Screen Wizard

**Description:** MobileReflectionFlow uses fixed positioning with safe-area utilities

**Pattern:**
```tsx
<div className="fixed inset-0 z-50 flex flex-col bg-mirror-void-deep">
  <div className="pt-safe ...">  {/* Header with safe area */}
  <div className="relative flex-1 overflow-hidden">  {/* Scrollable content */}
</div>
```

**Recommendation:** The `overflow-hidden` on parent may clip content - review for button visibility fix

### Mobile Dream Selection Pattern

**Description:** MobileDreamSelectionView at `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/views/MobileDreamSelectionView.tsx`

**Current pattern (line 43-48):**
```tsx
<div className="pb-safe flex h-full flex-col px-6 pt-4">
  <h2 className="mb-8 ...">Which dream are you reflecting on?</h2>
  <div className="flex-1 space-y-3 overflow-y-auto">
```

**Issue:** The `pb-safe` class applies bottom safe area, but the button at line 92-94 is inside the scrollable area without extra bottom padding for visibility clearance.

## Testing Infrastructure Summary

### Framework & Configuration

- **Test Runner:** Vitest with happy-dom environment
- **Coverage Provider:** v8
- **Coverage Thresholds:**
  - Statements: 78%
  - Branches: 71%
  - Functions: 71%
  - Lines: 78%

### Test Helpers Location

**`/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/index.ts`** exports:
- `renderWithProviders` - Render with all providers
- `createTestQueryClient` - QueryClient for testing
- `createMockQueryResult` - Success state mock
- `createMockLoadingResult` - Loading state mock
- `createMockErrorResult` - Error state mock
- `createMockMutation` - Mutation mock
- All testing-library utilities re-exported

### Mobile Component Tests

| Component | Test File | Coverage |
|-----------|-----------|----------|
| MobileReflectionFlow | `components/reflection/mobile/__tests__/MobileReflectionFlow.test.tsx` | Comprehensive |
| MobileDreamSelectionView | `components/reflection/mobile/views/__tests__/MobileDreamSelectionView.test.tsx` | Comprehensive |
| BottomNavigation | `components/navigation/__tests__/BottomNavigation.test.tsx` | Comprehensive |

## Complexity Assessment

### High Complexity Areas

1. **ReflectionItem.tsx fix** - LOW complexity technically, but HIGH test impact
   - Change is single line (remove `refl.dream` from chain)
   - BUT: Existing test explicitly validates the buggy behavior
   - Test update required

2. **MobileReflectionFlow button visibility** - MEDIUM complexity
   - Multiple nested containers with overflow rules
   - May require changes at multiple levels
   - Existing tests may need updates for new DOM structure

### Low Complexity Areas

1. **Bottom padding fixes across pages** - Simple find/replace pattern
   - Pattern is well-established in reference implementation
   - No test changes needed (styling changes)

## Technology Recommendations

### Testing Approach for This Plan

1. **Run tests BEFORE any code changes:**
   ```bash
   npm run test:run -- --reporter=verbose
   ```

2. **For ReflectionItem fix:**
   - Update test at line 375-383 first
   - Then change the component
   - Verify test passes with new behavior

3. **For padding fixes:**
   - No test updates needed
   - Visual verification on mobile required

### Test Commands

```bash
# Run all tests
npm run test:run

# Run specific component tests
npm run test -- components/dashboard/shared/__tests__/ReflectionItem.test.tsx

# Run with coverage
npm run test:coverage

# Run E2E tests (for mobile verification)
npm run test:e2e
```

## Risks & Challenges

### Technical Risks

1. **Test Failure on ReflectionItem Change**
   - Impact: Test suite will fail until test is updated
   - Mitigation: Update test first, then fix component

2. **Missing E2E Mobile Tests**
   - Impact: Visual regressions may not be caught automatically
   - Mitigation: Manual testing on mobile devices required

### Complexity Risks

1. **MobileReflectionFlow Overflow Changes**
   - Risk: Changes to overflow properties may break scroll behavior
   - Mitigation: Test on actual mobile device after changes

## Recommendations for Planner

1. **Order matters:** Update ReflectionItem.test.tsx BEFORE fixing ReflectionItem.tsx
   - This ensures the test documents expected behavior before implementation

2. **Test file to update:**
   ```
   /home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/ReflectionItem.test.tsx
   ```
   Lines 375-383: Change test expectation from `dream` field to fallback text

3. **Bottom padding is pure CSS:** No test changes needed for padding fixes
   - Verify visually on mobile emulator/device

4. **Consider adding test:** For the "Create Your First Dream" button visibility
   - Currently not explicitly tested for visibility/scrollability

## Resource Map

### Critical Files for This Plan

| Purpose | File Path |
|---------|-----------|
| Bug to fix | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/ReflectionItem.tsx:88` |
| Test to update | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/dashboard/shared/__tests__/ReflectionItem.test.tsx:375-383` |
| Reference pattern | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/clarify/[sessionId]/page.tsx:400` |
| Mobile button fix | `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/mobile/views/MobileDreamSelectionView.tsx:92` |

### Test Configuration

| File | Purpose |
|------|---------|
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts` | Test configuration |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts` | Test setup & global mocks |
| `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/helpers/index.ts` | Test utilities |

## Questions for Planner

1. Should the test for `dream` field fallback be removed entirely, or changed to verify it's NOT used?
   - Current: `expect(screen.getByText('Dream content here')).toBeInTheDocument()`
   - Option A: Remove test
   - Option B: Change to `expect(screen.getByText('Your reflection content...')).toBeInTheDocument()`

2. Should we add new E2E tests for mobile button visibility, or rely on manual testing?

3. For the mobile button fix, should we modify the overflow behavior or add extra padding to ensure visibility?
