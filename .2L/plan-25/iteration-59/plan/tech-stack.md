# Technology Stack

## Overview

This iteration involves bug fixes only - no new technology introductions. All changes use existing patterns and technologies already in the codebase.

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**Rationale:**
- Project already built on Next.js
- No framework changes needed for these bug fixes
- All fixes are in existing React components and page files

## Styling

**Decision:** Tailwind CSS with custom utility classes (existing)

**Rationale:**
- All padding fixes use Tailwind arbitrary value syntax
- Pattern `pb-[calc(80px+env(safe-area-inset-bottom))]` is established in codebase
- Consistent with existing codebase styling approach

**Key CSS Features Used:**

1. **CSS `calc()` function**: Combines fixed pixel values with dynamic CSS environment variables
2. **CSS `env()` function**: Accesses safe-area-inset values for notched devices
3. **Tailwind arbitrary values**: `pb-[...]` syntax for custom padding values
4. **Responsive modifiers**: `md:pb-8` for desktop-specific overrides

## Mobile Support

**Decision:** CSS Environment Variables for safe areas

**Implementation:**
```css
/* Safe area environment variable */
env(safe-area-inset-bottom)

/* Combined with fixed padding */
calc(80px + env(safe-area-inset-bottom))
```

**Browser Support:**
- iOS Safari: Full support (iPhone X+)
- Android Chrome: Full support (gesture navigation)
- Fallback: `env()` returns 0 on devices without safe areas

## Animation Library

**Decision:** Framer Motion (existing)

**Relevance to this iteration:**
- MobileReflectionFlow uses Framer Motion for step transitions
- Changing overflow behavior must preserve animation functionality
- No changes to animation code required

## Testing Framework

**Decision:** Vitest with Testing Library (existing)

**Relevance to this iteration:**
- ReflectionItem.test.tsx must be updated to match new behavior
- Test uses `@testing-library/react` patterns
- No new test dependencies needed

**Test Commands:**
```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test -- components/dashboard/shared/__tests__/ReflectionItem.test.tsx

# Run with coverage
npm run test:coverage
```

## Environment Variables

No environment variables are involved in this iteration. All changes are UI/UX fixes.

## Dependencies Overview

No new dependencies. All fixes use existing packages:

| Package | Purpose in This Iteration |
|---------|---------------------------|
| react | Component state (useState) |
| next | Page routing, Link component |
| tailwindcss | Responsive padding classes |
| framer-motion | Animation preservation in mobile flow |
| vitest | Test framework for test updates |
| @testing-library/react | Test utilities |

## Performance Considerations

**Impact:** Minimal

- Padding changes: Zero performance impact (CSS only)
- ReflectionItem fix: Potentially slight improvement (fewer string operations in fallback chain)
- Overflow change: No measurable impact

## Security Considerations

**Impact:** None

This iteration involves only UI bug fixes with no security implications:
- No API changes
- No authentication changes
- No data handling changes
- No user input processing changes

## Reference Implementation

The correct bottom padding pattern is established in:

**File:** `/app/clarify/[sessionId]/page.tsx` (Line 400)

```tsx
<div className="px-4 pb-[calc(80px+env(safe-area-inset-bottom))] sm:px-8 md:pb-6">
```

This pattern should be applied consistently across all pages with bottom navigation.
