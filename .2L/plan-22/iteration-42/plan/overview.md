# 2L Iteration Plan - Reflection Router Tests (Iteration 42)

## Project Vision

Achieve comprehensive test coverage (85%+) for both reflection routers (`reflection.ts` and `reflections.ts`) to ensure reliability of the core AI generation and CRUD operations that power the Mirror of Dreams reflection system.

## Success Criteria

- [ ] `reflection.create` mutation has comprehensive test coverage (36 test cases)
- [ ] `reflections.update` mutation is fully tested (7 test cases)
- [ ] `reflections.delete` mutation is fully tested (5 test cases)
- [ ] `reflections.submitFeedback` mutation is fully tested (8 test cases)
- [ ] Enhanced Anthropic mock supports extended thinking responses
- [ ] Cache module mock properly intercepts cache operations
- [ ] Prompts module mock eliminates filesystem dependencies
- [ ] Combined router coverage reaches 85%+
- [ ] All tests pass in CI environment

## MVP Scope

**In Scope:**
- Test file for `reflection.create` mutation (AI generation)
- Additional tests for `reflections.update`, `reflections.delete`, `reflections.submitFeedback`
- Enhanced mock factory for Anthropic SDK (extended thinking, errors, retries)
- Cache module mock
- Prompts module mock

**Out of Scope (Post-MVP):**
- E2E tests for reflection flow
- Performance/load testing
- Rate limiting middleware tests (covered elsewhere)
- Evolution report eligibility edge cases beyond basic coverage

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~2 hours (2 parallel builders)
4. **Integration** - ~15 minutes
5. **Validation** - ~15 minutes
6. **Deployment** - Final (merge to main)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- Total: ~2.5 hours

## Risk Assessment

### High Risks

| Risk | Mitigation |
|------|------------|
| Anthropic mock complexity for extended thinking | Create comprehensive mock factory with multiple response scenarios |
| Middleware chain testing (isAuthed + notDemo + checkUsageLimit) | Test each middleware independently then in integration |
| Race conditions in usage counter updates | Verify counter logic with edge cases (boundary conditions) |

### Medium Risks

| Risk | Mitigation |
|------|------------|
| Cache invalidation verification | Mock cacheDelete and verify called with correct key |
| Evolution eligibility logic | Test threshold calculations for each tier |
| Premium feature determination | Test truth table for all combinations (requestedPremium, tier, creator) |

### Low Risks

| Risk | Mitigation |
|------|------------|
| CRUD operations (update, delete, submitFeedback) | Follow established patterns from existing tests |

## Integration Strategy

1. **Builder-1** creates the main `reflection.create` test file with mock enhancements in setup
2. **Builder-2** adds CRUD tests to existing `reflections.test.ts`
3. Both builders follow the same mock patterns and fixtures
4. Integration is straightforward as tests are independent

## Deployment Plan

1. Run all tests locally to verify
2. Check coverage report for 85%+ target
3. PR review for test quality
4. Merge to main branch
5. CI validates all tests pass

## Key Files

### Routers Under Test
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` - AI generation (create)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflections.ts` - CRUD operations

### Test Infrastructure
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` - Test caller setup (needs mock enhancements)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/reflections/reflections.test.ts` - Existing CRUD tests

### Fixtures
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/users.ts` - User test data
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/fixtures/reflections.ts` - Reflection test data
