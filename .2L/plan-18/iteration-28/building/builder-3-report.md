# Builder-3 Report: TypeScript Any Fixes + Hook Consolidation

## Status
COMPLETE

## Summary
Fixed all `error: any` patterns across 6 files by replacing with `error: unknown` and proper type guards. Also fixed `requestConfig: any` with proper Anthropic SDK types. Consolidated hooks from `/lib/hooks/` to `/hooks/` with a barrel export, updated all imports, and deleted the old directory.

## Part 1: TypeScript `any` Fixes

### Files Modified

| File | Line(s) | Change |
|------|---------|--------|
| `/server/trpc/routers/reflection.ts` | 99 | `requestConfig: any` -> `requestConfig: Anthropic.MessageCreateParams` |
| `/server/trpc/routers/reflection.ts` | 125 | `error: any` -> `error: unknown` with type guard |
| `/components/dreams/CreateDreamModal.tsx` | 64 | `err: any` -> `err: unknown` with type guard |
| `/components/dreams/EvolutionModal.tsx` | 100 | `err: any` -> `err: unknown` with type guard |
| `/app/dreams/[id]/page.tsx` | 89, 98 | `error: any` -> `error: unknown` |
| `/app/dreams/[id]/ritual/page.tsx` | 97 | `err: any` -> `err: unknown` with type guard |
| `/app/api/webhooks/paypal/route.ts` | 118 | `error: any` -> `error: unknown` with type guard |

### Pattern Applied
```typescript
// FROM:
catch (error: any) {
  setError(error.message);
}

// TO:
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  setError(message);
}
```

## Part 2: Hook Consolidation

### Hooks Moved
- `/lib/hooks/useScrollDirection.ts` -> `/hooks/useScrollDirection.ts`
- `/lib/hooks/useIsMobile.ts` -> `/hooks/useIsMobile.ts`
- `/lib/hooks/useKeyboardHeight.ts` -> `/hooks/useKeyboardHeight.ts`

### New File Created
- `/hooks/index.ts` - Barrel export for all hooks

### Barrel Export Contents
```typescript
// Authentication & State
export { useAuth } from './useAuth';
export { useDashboard } from './useDashboard';
export { usePortalState } from './usePortalState';

// Animation & Effects
export { useBreathingEffect } from './useBreathingEffect';
export { useAnimatedCounter } from './useAnimatedCounter';
export { useStaggerAnimation } from './useStaggerAnimation';

// Accessibility
export { useReducedMotion } from './useReducedMotion';

// Viewport & Input
export { useScrollDirection, type ScrollDirection } from './useScrollDirection';
export { useIsMobile } from './useIsMobile';
export { useKeyboardHeight } from './useKeyboardHeight';
```

### Imports Updated

| File | Change |
|------|--------|
| `/components/ui/glass/GlassModal.tsx` | `@/lib/hooks/useIsMobile` -> `@/hooks` |
| `/components/reflection/mobile/MobileReflectionFlow.tsx` | `@/lib/hooks` -> `@/hooks` |
| `/components/navigation/BottomNavigation.tsx` | `@/lib/hooks/useScrollDirection` -> `@/hooks` |
| `/app/reflection/MirrorExperience.tsx` | `@/lib/hooks/useIsMobile` -> `@/hooks` |

### Directory Deleted
- `/lib/hooks/` - Entire directory removed after consolidation

## Success Criteria Met
- [x] All `error: any` replaced with `error: unknown` pattern
- [x] Anthropic SDK types used where applicable (`Anthropic.MessageCreateParams`)
- [x] `/lib/hooks/` directory deleted
- [x] `/hooks/index.ts` barrel export created
- [x] All hook imports updated to new paths
- [x] `npm run build` passes with no type errors

## Build Verification

```
npm run build - SUCCESS

Route (app)                              Size     First Load JS
- All 41 routes compiled successfully
- No TypeScript errors
- No import errors
```

## Patterns Followed
- **Replace error: any with unknown** pattern from patterns.md
- **Anthropic SDK Type Fixes** pattern from patterns.md
- **Hook Consolidation Pattern** from patterns.md
- **Barrel Export Creation** pattern from patterns.md

## Integration Notes

### Exports
- All hooks now available from `@/hooks` barrel export
- Type `ScrollDirection` exported alongside `useScrollDirection`

### For Other Builders
- If adding new hooks, add them to `/hooks/` and update `/hooks/index.ts`
- Import hooks from `@/hooks` (not individual files) for consistency

## Files Changed Summary

### Modified (7 files)
1. `/server/trpc/routers/reflection.ts`
2. `/components/dreams/CreateDreamModal.tsx`
3. `/components/dreams/EvolutionModal.tsx`
4. `/app/dreams/[id]/page.tsx`
5. `/app/dreams/[id]/ritual/page.tsx`
6. `/app/api/webhooks/paypal/route.ts`
7. `/components/ui/glass/GlassModal.tsx`
8. `/components/reflection/mobile/MobileReflectionFlow.tsx`
9. `/components/navigation/BottomNavigation.tsx`
10. `/app/reflection/MirrorExperience.tsx`

### Created (4 files)
1. `/hooks/useScrollDirection.ts`
2. `/hooks/useIsMobile.ts`
3. `/hooks/useKeyboardHeight.ts`
4. `/hooks/index.ts`

### Deleted (4 files)
1. `/lib/hooks/useScrollDirection.ts`
2. `/lib/hooks/useIsMobile.ts`
3. `/lib/hooks/useKeyboardHeight.ts`
4. `/lib/hooks/index.ts`

## Notes
- Pre-existing test file TypeScript errors (vitest, @jest/globals modules not found) are unrelated to this work
- The `requestConfig.thinking` property addition is handled via type assertion since it's part of the extended thinking beta feature not yet in the SDK types
