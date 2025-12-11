# Builder-3 Report: Tighten ESLint Rules

## Status
COMPLETE

## Summary
Updated ESLint configuration to change two rules from `'warn'` to `'error'`:
- `@typescript-eslint/no-explicit-any`
- `no-prototype-builtins`

The lint check revealed 27 errors across 19 files that need to be addressed in subsequent iterations.

## Changes Made

### File Modified
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/eslint.config.mjs`

### Rule Changes
| Rule | Before | After |
|------|--------|-------|
| `@typescript-eslint/no-explicit-any` | `'warn'` | `'error'` |
| `no-prototype-builtins` | `'warn'` | `'error'` |

## Lint Results After Change

### Summary
- **Total Problems:** 204 (27 errors, 177 warnings)
- **Fixable:** 5 errors and 8 warnings (using `--fix`)

### Error Breakdown by Type
| Error Type | Count |
|------------|-------|
| `@typescript-eslint/no-explicit-any` | 21 |
| `import/order` | 5 |
| `no-prototype-builtins` | 1 |

### Files Requiring Attention (27 errors across 19 files)

#### Production Files with `any` Usage (17 errors)
1. `app/api/cron/consolidate-patterns/route.ts` - Line 46
2. `app/dreams/[id]/ritual/page.tsx` - Line 103
3. `app/dreams/page.tsx` - Line 187
4. `app/evolution/page.tsx` - Lines 155, 266, 286
5. `components/dreams/CreateDreamModal.tsx` - Lines 53, 92
6. `components/dreams/EvolutionModal.tsx` - Line 156
7. `components/reflections/ReflectionFilters.tsx` - Line 124
8. `lib/clarify/consolidation.ts` - Lines 117, 126, 143, 402
9. `lib/clarify/context-builder.ts` - Lines 182, 339
10. `server/trpc/trpc.ts` - Line 36
11. `server/trpc/routers/visualizations.ts` - (specific line in output)

#### Type Definition Files with `any` Usage (4 errors)
1. `types/artifact.ts` - Lines 18, 35
2. `types/clarify.ts` - Line 79
3. `types/user.ts` - Line 107

#### Files with Import Order Issues (5 errors)
1. `app/dreams/[id]/page.tsx` - Lines 19-20
2. `components/dashboard/__tests__/DashboardHero.test.tsx` - Lines 58-59

#### Files with `no-prototype-builtins` Issue (1 error)
1. `lib/clarify/context-builder.ts` - Line 354 (using `hasOwnProperty` directly)

## Notes

### Test Files
Test files are correctly excluded from the `@typescript-eslint/no-explicit-any` rule as configured:
```javascript
// Test files - relaxed rules
{
  files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**/*.ts', '**/__tests__/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
},
```

However, one test file (`DashboardHero.test.tsx`) has import order errors which are not excluded.

### Import Order Issues
The 5 import order errors are auto-fixable with `npm run lint -- --fix`.

### Recommended Next Steps
1. Run `npm run lint -- --fix` to auto-fix the 5 import order errors
2. Replace remaining `any` types with proper types in the identified files
3. Fix the `hasOwnProperty` usage in `lib/clarify/context-builder.ts` by using `Object.hasOwn()` or `Object.prototype.hasOwnProperty.call()`

## Verification
```bash
# Rules successfully changed in eslint.config.mjs
# Line 93: '@typescript-eslint/no-explicit-any': 'error',
# Line 100: 'no-prototype-builtins': 'error',
```
