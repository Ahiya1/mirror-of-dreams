# Builder Task Breakdown - Reflection Router Tests

## Overview

**2 primary builders** will work in parallel:
- Builder-1: `reflection.create` mutation tests (AI generation)
- Builder-2: `reflections` CRUD tests (update, delete, submitFeedback)

No sub-builder splits anticipated due to well-defined scope.

## Builder Assignment Strategy

- Builders work on separate test files
- Shared mocks are added to `setup.ts` by Builder-1 (dependency)
- Builder-2 can start immediately on CRUD tests using existing mocks
- Both builders follow patterns defined in `patterns.md`

---

## Builder-1: reflection.create Mutation Tests

### Scope

Create comprehensive test coverage for the AI generation `reflection.create` mutation. This includes:
1. Enhancing `setup.ts` with additional mocks (cache, prompts)
2. Creating new test file `test/integration/reflection/reflection-create.test.ts`
3. Testing all success paths, authorization, tier limits, premium features, and error handling

### Complexity Estimate

**HIGH**

Rationale: Complex procedure with multiple middleware, external API mocking, and many test scenarios.

### Success Criteria

- [ ] Cache module mock added to `setup.ts`
- [ ] Prompts module mock added to `setup.ts`
- [ ] Enhanced Anthropic mock with scenario factory
- [ ] 36 test cases covering all scenarios from exploration report
- [ ] All tests pass
- [ ] Coverage for `reflection.ts` reaches 85%+

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `test/integration/setup.ts` | MODIFY | Add cache, prompts mocks; enhance Anthropic mock |
| `test/integration/reflection/reflection-create.test.ts` | CREATE | Main test file for create mutation |

### Dependencies

**Depends on:** None (starts immediately)
**Blocks:** Builder-2 needs enhanced mocks from setup.ts (but can start with existing)

### Implementation Notes

1. **Mock Setup Order**: Add mocks to `vi.hoisted` block in setup.ts to ensure they're available before imports

2. **Anthropic Client Caching**: The router uses lazy initialization (`getAnthropicClient`). Ensure mock is properly configured before each test.

3. **Environment Variable**: Set `process.env.ANTHROPIC_API_KEY = 'test-key'` in test setup to avoid "API key required" error.

4. **Date Handling**: Tests involving daily limits need to mock or control the current date. Consider using `vi.setSystemTime()` for date-dependent tests.

5. **Evolution Eligibility**: The `checkEvolutionEligibility` helper makes additional DB queries. Mock `evolution_reports` table responses.

### Test Case Breakdown

#### Success Cases (16 tests)
| ID | Test Case | Key Assertions |
|----|-----------|----------------|
| TC-RC-01 | Basic reflection creation | Returns reflection, reflectionId, wordCount |
| TC-RC-02 | Creation with linked dream | Title from dream used |
| TC-RC-03 | Creation without linked dream | First 100 chars as title |
| TC-RC-04 | Premium for unlimited tier | isPremium: true, extended thinking used |
| TC-RC-05 | Premium for creator | isPremium: true |
| TC-RC-06 | Premium explicit request (pro+) | isPremium: true |
| TC-RC-07 | Gentle tone | Correct prompt loaded |
| TC-RC-08 | Intense tone | Correct prompt loaded |
| TC-RC-09 | Fusion tone (default) | Correct prompt loaded |
| TC-RC-10 | Word count calculation | wordCount matches response |
| TC-RC-11 | Read time calculation | estimatedReadTime correct |
| TC-RC-12 | User counters updated | DB update called |
| TC-RC-13 | Cache invalidation | cacheDelete called |
| TC-RC-14 | Evolution eligibility (pro) | shouldTriggerEvolution: true |
| TC-RC-15 | Evolution eligibility (unlimited) | shouldTriggerEvolution: true |
| TC-RC-16 | Daily counter reset | reflectionsToday reset to 1 |

#### Authorization Cases (8 tests)
| ID | Test Case | Expected Error |
|----|-----------|----------------|
| TC-RC-17 | Unauthenticated user | UNAUTHORIZED |
| TC-RC-18 | Demo user blocked | FORBIDDEN |
| TC-RC-19 | Free tier at monthly limit | FORBIDDEN |
| TC-RC-20 | Pro tier at monthly limit | FORBIDDEN |
| TC-RC-21 | Pro tier at daily limit | FORBIDDEN |
| TC-RC-22 | Unlimited tier at daily limit | FORBIDDEN |
| TC-RC-23 | Creator bypasses limits | Success |
| TC-RC-24 | Admin bypasses limits | Success |

#### Error Cases (8 tests)
| ID | Test Case | Expected Error |
|----|-----------|----------------|
| TC-RC-25 | Anthropic API error | INTERNAL_SERVER_ERROR |
| TC-RC-26 | Anthropic returns no text | INTERNAL_SERVER_ERROR |
| TC-RC-27 | Database insert error | INTERNAL_SERVER_ERROR |
| TC-RC-28 | Missing API key | Error thrown |
| TC-RC-29 | Invalid dreamId format | Validation error |
| TC-RC-30 | Empty dream text | Validation error |
| TC-RC-31 | Dream text too long | Validation error |
| TC-RC-32 | Invalid tone | Validation error |

#### Edge Cases (4 tests)
| ID | Test Case | Key Behavior |
|----|-----------|--------------|
| TC-RC-33 | Retry on transient error | Success after retry |
| TC-RC-34 | User with null name | 'Friend' used in prompt |
| TC-RC-35 | All optional fields default | Defaults applied |
| TC-RC-36 | No evolution reports yet | Eligibility still calculated |

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use `createAnthropicResponse(scenario)` for AI mock scenarios
- Use `mockQueries({...})` for multi-table Supabase mocking
- Use standard assertion patterns for error codes
- Follow test file structure with describe/it organization

### Testing Requirements

- Unit-style integration tests via tRPC caller
- 36 test cases total
- Coverage target: 85%+ for `reflection.ts`

---

## Builder-2: reflections CRUD Tests

### Scope

Add test coverage for untested CRUD operations in `reflections.ts`:
1. `update` mutation (7 tests)
2. `delete` mutation (5 tests)
3. `submitFeedback` mutation (8 tests)

### Complexity Estimate

**MEDIUM**

Rationale: Standard CRUD patterns, existing test file to extend, straightforward mocking.

### Success Criteria

- [ ] `reflections.update` has 7 test cases
- [ ] `reflections.delete` has 5 test cases
- [ ] `reflections.submitFeedback` has 8 test cases
- [ ] All tests pass
- [ ] Coverage for `reflections.ts` reaches 85%+

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `test/integration/reflections/reflections.test.ts` | MODIFY | Add update, delete, submitFeedback tests |

### Dependencies

**Depends on:** None (uses existing setup.ts mocks)
**Blocks:** Nothing

### Implementation Notes

1. **Existing File Structure**: Follow the existing pattern in `reflections.test.ts` with describe blocks for each procedure

2. **Ownership Verification**: All mutations filter by `user_id`. Mock returns `null` or error when testing other user's reflections.

3. **Counter Decrement**: `delete` mutation decrements usage counters. Verify the update is called with `Math.max(0, count - 1)`.

4. **Validation Boundaries**: `submitFeedback` rating has min=1, max=10. Test boundaries explicitly.

### Test Case Breakdown

#### reflections.update (7 tests)
| ID | Test Case | Key Assertions |
|----|-----------|----------------|
| TC-RU-01 | Update title successfully | title updated, updated_at changed |
| TC-RU-02 | Update tags successfully | tags array updated |
| TC-RU-03 | Update both title and tags | Both fields updated |
| TC-RU-04 | Update non-existent reflection | INTERNAL_SERVER_ERROR |
| TC-RU-05 | Update other user's reflection | INTERNAL_SERVER_ERROR |
| TC-RU-06 | Unauthenticated user | UNAUTHORIZED |
| TC-RU-07 | Invalid ID format | Validation error |

#### reflections.delete (5 tests)
| ID | Test Case | Key Assertions |
|----|-----------|----------------|
| TC-RD-01 | Delete own reflection | Success message, counters decremented |
| TC-RD-02 | Delete non-existent reflection | NOT_FOUND |
| TC-RD-03 | Delete other user's reflection | NOT_FOUND |
| TC-RD-04 | Counter decrement edge case | Counters don't go negative |
| TC-RD-05 | Unauthenticated user | UNAUTHORIZED |

#### reflections.submitFeedback (8 tests)
| ID | Test Case | Key Assertions |
|----|-----------|----------------|
| TC-RF-01 | Submit rating only | rating saved |
| TC-RF-02 | Submit rating and feedback | Both saved |
| TC-RF-03 | Rating at min boundary (1) | Accepted |
| TC-RF-04 | Rating at max boundary (10) | Accepted |
| TC-RF-05 | Rating below min (0) | Validation error |
| TC-RF-06 | Rating above max (11) | Validation error |
| TC-RF-07 | Non-existent reflection | INTERNAL_SERVER_ERROR |
| TC-RF-08 | Other user's reflection | INTERNAL_SERVER_ERROR |

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use `createReflectionForUser()` fixture factory
- Use `mockQueries({...})` for Supabase responses
- Follow existing test structure in `reflections.test.ts`
- Use standard error assertion patterns

### Testing Requirements

- Extend existing test file
- 20 test cases total
- Coverage target: 85%+ for `reflections.ts`

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

| Builder | Task | Files | Estimated Duration |
|---------|------|-------|-------------------|
| Builder-1 | reflection.create tests | setup.ts, reflection-create.test.ts | 1.5 hours |
| Builder-2 | reflections CRUD tests | reflections.test.ts | 1 hour |

Both builders can start immediately and work in parallel.

### Integration Notes

1. **Shared Setup File**: Builder-1 adds mocks to `setup.ts`. If Builder-2 needs these mocks, they can wait for Builder-1's setup.ts changes or use existing mocks.

2. **No File Conflicts**: Builders work on different test files (reflection-create.test.ts vs reflections.test.ts).

3. **Consistent Patterns**: Both builders follow `patterns.md` for consistency.

4. **Coverage Verification**: After both builders complete, run coverage to verify 85%+ target.

---

## Verification Checklist

After all builders complete:

- [ ] All 56 test cases implemented (36 + 20)
- [ ] Tests run without errors: `npm run test:integration`
- [ ] Coverage report shows 85%+ for both routers
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Mocks properly isolated (no test pollution)
- [ ] Test file structure follows patterns.md
