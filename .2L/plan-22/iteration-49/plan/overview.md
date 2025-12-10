# 2L Iteration Plan - Iteration 49: Library Tests

## Project Vision

Comprehensive test coverage for utility library functions in the Mirror of Dreams codebase. This iteration focuses on testing pure utility functions and API helper utilities that currently have zero test coverage, ensuring code reliability and preventing regressions.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] `lib/__tests__/utils.test.ts` created with 80%+ coverage of `lib/utils.ts`
- [ ] `lib/utils/__tests__/haptics.test.ts` created with 80%+ coverage
- [ ] `lib/utils/__tests__/dateRange.test.ts` created with 80%+ coverage
- [ ] `lib/utils/__tests__/wordCount.test.ts` created with 80%+ coverage
- [ ] `lib/anthropic/__tests__/type-guards.test.ts` created with 80%+ coverage
- [ ] All tests pass with `npm run test`
- [ ] No type errors in test files

## Iteration Scope

**In Scope:**
- `lib/utils.ts` - Core utility functions (cn, formatDate, timeAgo, truncate, formatReflectionDate)
- `lib/utils/haptics.ts` - Haptic feedback utilities (haptic, isHapticSupported)
- `lib/utils/dateRange.ts` - Date range filtering (getDateRangeFilter, filterByDateRange)
- `lib/utils/wordCount.ts` - Word counting (countWords, formatWordCount, getWordCountState)
- `lib/anthropic/type-guards.ts` - Anthropic type guards and extractors

**Out of Scope (Deferred):**
- `lib/clarify/consolidation.ts` - Complex integration with Anthropic + Supabase (requires extensive mocking)
- `lib/voice/mirror-voice.ts` - Voice configuration (lower priority)
- `lib/animations/*.ts` - Animation configurations (configuration objects, not logic)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current (Iteration 49)
3. **Building** - 2 parallel builders (~30 minutes each)
4. **Integration** - Minimal (tests are independent)
5. **Validation** - Run full test suite
6. **Deployment** - N/A (tests only)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~45 minutes (parallel builders)
- Integration: ~5 minutes
- Validation: ~10 minutes
- Total: ~60 minutes

## Risk Assessment

### Low Risks
- **Date mocking complexity**: Mitigated by using `vi.useFakeTimers()` pattern already established in codebase
- **Navigator mocking for haptics**: Mitigated by using `Object.defineProperty` pattern for browser API mocking

### Very Low Risks
- All target files are pure functions with minimal dependencies
- Existing test patterns in codebase provide clear templates
- No database or external API mocking required for these utilities

## Integration Strategy

Tests are independent and do not interact with each other. Integration is straightforward:
1. Each builder creates test files in the appropriate `__tests__/` directory
2. Tests follow existing naming conventions (`*.test.ts`)
3. No shared state between test files
4. All tests run in parallel via Vitest

## Deployment Plan

No deployment required. Test files are committed to the repository and run:
- On every PR via CI
- Locally via `npm run test`
- With coverage via `npm run test:coverage`
