# Builder 2 Report: TIER_LIMITS Consolidation

## Status: COMPLETE

## Summary

Consolidated local TIER_LIMITS definitions in `reflections.ts` and `dreams.ts` to use the single source of truth from `lib/utils/constants.ts`. Fixed incorrect limit values (reflections had 4/10/999999 instead of 2/30/60, dreams had 999999 instead of Infinity for unlimited tier).

## Changes Made

### Task 2.1: Fixed reflections.ts

**File:** `server/trpc/routers/reflections.ts`

- Added import for `TIER_LIMITS` from `@/lib/utils/constants`
- Removed local TIER_LIMITS definition (lines 197-202) inside `checkUsage` procedure
- Updated limit calculation to use imported `TIER_LIMITS[ctx.user.tier]`
- Changed admin/creator unlimited value from `999999` to `Infinity` for consistency

**Before (WRONG values):**
```typescript
const TIER_LIMITS = {
  free: 4,      // WRONG: should be 2
  pro: 10,      // WRONG: should be 30
  unlimited: 999999,
};
```

**After:**
```typescript
import { TIER_LIMITS } from '@/lib/utils/constants';
// Now uses: { free: 2, pro: 30, unlimited: 60 }
```

### Task 2.2: Fixed dreams.ts

**File:** `server/trpc/routers/dreams.ts`

- Added import for `DREAM_LIMITS` from `@/lib/utils/constants`
- Removed local TIER_LIMITS definition (lines 12-19)
- Updated `checkDreamLimit` function to use `DREAM_LIMITS[tier]` directly
- Changed unlimited check from `limit === 999999` to `!Number.isFinite(limit)` to properly handle `Infinity`
- Updated all references throughout the file (create mutation, getLimits query)

**Before:**
```typescript
const TIER_LIMITS = {
  free: { dreams: 2 },
  pro: { dreams: 5 },
  unlimited: { dreams: 999999 },
} as const;
```

**After:**
```typescript
import { DREAM_LIMITS } from '@/lib/utils/constants';
// Now uses: { free: 2, pro: 5, unlimited: Infinity }
```

## Files Modified

1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts`
   - Line 11: Added import for TIER_LIMITS
   - Lines 196-199: Simplified checkUsage procedure

2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/dreams.ts`
   - Line 9: Added import for DREAM_LIMITS
   - Lines 12-19: Removed local TIER_LIMITS
   - Lines 78-98: Updated checkDreamLimit function
   - Lines 159-167: Updated create mutation error handling
   - Lines 199-207: Updated create mutation usage response
   - Lines 417-437: Updated getLimits query

## Verification

### Grep for remaining local TIER_LIMITS:
```bash
$ grep "const TIER_LIMITS" server/trpc/routers/
# No matches found
```

### TypeScript compilation:
- No errors in modified source files (`dreams.ts`, `reflections.ts`)
- Pre-existing test file errors unrelated to these changes (Mock type issues in test files)

## Source of Truth Values (from lib/utils/constants.ts)

```typescript
export const TIER_LIMITS = { free: 2, pro: 30, unlimited: 60 };
export const DREAM_LIMITS = { free: 2, pro: 5, unlimited: Infinity };
```

## Issues Encountered

None. Changes were straightforward once the pattern was clear.

## Notes

- Changed `999999` magic number to `Infinity` throughout for proper semantic meaning
- Used `Number.isFinite()` checks instead of `=== 999999` comparisons
- Used nullish coalescing (`??`) instead of logical OR (`||`) for default values to properly handle `0`
