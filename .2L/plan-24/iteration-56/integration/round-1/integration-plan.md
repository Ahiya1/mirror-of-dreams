# Integration Plan - Round 1

**Created:** 2025-12-12T17:30:00Z
**Iteration:** plan-24/iteration-56
**Total builders to integrate:** 4

---

## Executive Summary

This is a low-conflict test file integration. All 4 builders have completed successfully, producing 108 new tests across 9 test files. The only shared files modified were `test/mocks/anthropic.ts` and `test/integration/setup.ts`, both exclusively by Builder-1. All other builders created independent test files with no overlaps.

Key insights:
- No file conflicts detected - Builder-1 owns all shared file modifications
- All test files are independent and can be merged in parallel
- Total new tests: 108 (38 + 41 + 21 + 8)
- Integration is straightforward - direct merge with single verification pass

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Clarify Router AI Flow Tests - Status: COMPLETE (38 tests)
- **Builder-2:** Auth Router Gaps - Status: COMPLETE (41 tests)
- **Builder-3:** Cookies/Supabase Unit Tests - Status: COMPLETE (21 tests)
- **Builder-4:** tRPC Error Formatter Tests - Status: COMPLETE (8 tests)

### Sub-Builders
None - all builders completed without splitting.

**Total outputs to integrate:** 4 builder reports, 9 test files, 108 new tests

---

## Integration Zones

### Zone 1: Shared Test Infrastructure (Builder-1 Only)

**Builders involved:** Builder-1 only

**Conflict type:** None (single owner)

**Risk level:** LOW

**Description:**
Builder-1 extended the shared test infrastructure with tool_use support for Anthropic mocks and a context builder mock for Clarify tests. Since no other builder touched these files, there are no conflicts to resolve.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/mocks/anthropic.ts` - Added tool_use helpers (already integrated)
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/setup.ts` - Added contextBuilderMock (already integrated)

**Integration strategy:**
1. Verify files are already in place (Builder-1 completed modifications)
2. No merge required - single owner
3. Validate all existing tests still pass with the new mocks

**Expected outcome:**
All shared test infrastructure is in place and functional.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: Clarify Router Tests (Builder-1)

**Builders involved:** Builder-1

**Conflict type:** None (modification to existing test file)

**Risk level:** LOW

**Description:**
Builder-1 added 38 new tests to the existing clarify.test.ts file, covering AI flow tests, database error handling, and pattern extraction.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/clarify/clarify.test.ts` - 38 new tests added

**Integration strategy:**
1. Verify test file modifications are complete
2. Run `npx vitest run test/integration/clarify --reporter=verbose`
3. Ensure all 94 tests pass

**Expected outcome:**
Clarify router test suite complete with 94 tests, all passing.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 3: Auth Router Tests (Builder-2)

**Builders involved:** Builder-2

**Conflict type:** None (new files only)

**Risk level:** LOW

**Description:**
Builder-2 created 4 new test files covering auth router procedures: verifyToken, me, deleteAccount, and updateProfile edge cases.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/verify-token.test.ts` - 5 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/me-procedure.test.ts` - 9 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/delete-account.test.ts` - 11 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/integration/auth/update-profile-edge.test.ts` - 16 tests

**Integration strategy:**
1. Verify all 4 test files are in place
2. Run `npx vitest run test/integration/auth --reporter=verbose`
3. Ensure all 86 auth tests pass (including existing tests)

**Expected outcome:**
Auth router test suite complete with 41 new tests, all passing.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 4: Unit Tests - Cookies & Supabase (Builder-3)

**Builders involved:** Builder-3

**Conflict type:** None (new files only)

**Risk level:** LOW

**Description:**
Builder-3 created 2 new unit test files for cookies module and Supabase client initialization.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/unit/server/lib/cookies.test.ts` - 13 tests
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/unit/server/lib/supabase.test.ts` - 8 tests

**Integration strategy:**
1. Verify both test files are in place
2. Run `npx vitest run test/unit/server/lib --reporter=verbose`
3. Ensure all 21 tests pass

**Expected outcome:**
Unit tests for cookies and supabase modules complete with 100% coverage.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 5: Unit Tests - tRPC Error Formatter (Builder-4)

**Builders involved:** Builder-4

**Conflict type:** None (new file only)

**Risk level:** LOW

**Description:**
Builder-4 created a new unit test file for tRPC error formatter behavior.

**Files affected:**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/test/unit/server/trpc/error-formatter.test.ts` - 8 tests

**Integration strategy:**
1. Verify test file is in place
2. Run `npx vitest run test/unit/server/trpc --reporter=verbose`
3. Ensure all 8 tests pass

**Expected outcome:**
tRPC error formatter tests complete and passing.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

## Independent Features (Direct Merge)

All builder outputs are independent and can be merged directly:

- **Builder-1:** Clarify infrastructure + tests - Files: 3 (2 modified, 1 test file)
- **Builder-2:** Auth tests - Files: 4 (all new)
- **Builder-3:** Cookies/Supabase tests - Files: 2 (all new)
- **Builder-4:** tRPC tests - Files: 1 (all new)

**Assigned to:** Integrator-1 (single integrator sufficient)

---

## Parallel Execution Groups

### Group 1 (Single Integrator - All Parallel Verification)
- **Integrator-1:** All 5 zones

**Rationale:** No conflicts exist between zones. A single integrator can efficiently verify all builder outputs in parallel since there are no dependencies or overlaps to resolve.

---

## Integration Order

**Recommended sequence:**

1. **Verify shared infrastructure (Zone 1)**
   - Check `test/mocks/anthropic.ts` has tool_use helpers
   - Check `test/integration/setup.ts` has contextBuilderMock
   - Quick verification - no action needed if files are in place

2. **Run all test suites in parallel**
   - Zone 2: `npx vitest run test/integration/clarify`
   - Zone 3: `npx vitest run test/integration/auth`
   - Zone 4: `npx vitest run test/unit/server/lib`
   - Zone 5: `npx vitest run test/unit/server/trpc`

3. **Full test suite verification**
   - Run `npx vitest run --reporter=verbose`
   - Verify all 108 new tests pass
   - Verify no regression in existing tests

4. **Coverage verification**
   - Run `npm run test:coverage -- --run`
   - Verify coverage targets met for each module

---

## Shared Resources Strategy

### Shared Mocks (test/mocks/anthropic.ts)
**Status:** Already modified by Builder-1
**No conflict:** Single owner

**New exports added:**
- `ToolUseContentBlock` interface
- `CreateDreamToolInput` interface
- `createMockToolUseResponse()` helper
- `createMockToolFollowUpResponse()` helper
- `mockAnthropicToolUse()` orchestration helper
- `createMockNoTextBlockResponse()` for edge cases

### Shared Setup (test/integration/setup.ts)
**Status:** Already modified by Builder-1
**No conflict:** Single owner

**New exports added:**
- `contextBuilderMock` for mocking Clarify context builder

### Configuration Files
**No changes:** No builders modified configuration files

---

## Expected Challenges

### Challenge 1: Test Isolation
**Impact:** Tests from different builders could potentially interfere if they share mocked state
**Mitigation:** Each test uses `createTestCaller()` which resets all mocks via `vi.clearAllMocks()`
**Responsible:** Integrator-1

### Challenge 2: Mock Restoration
**Impact:** `vi.clearAllMocks()` clears mockImplementation, which could cause failures
**Mitigation:** Builder-1 already added restoration logic in `createTestCaller()` for contextBuilderMock
**Responsible:** Integrator-1

---

## Success Criteria for This Integration Round

- [ ] All shared files verified in place (Zone 1)
- [ ] Clarify tests pass: 94 tests (Zone 2)
- [ ] Auth tests pass: 86 tests including 41 new (Zone 3)
- [ ] Cookies/Supabase tests pass: 21 tests (Zone 4)
- [ ] tRPC tests pass: 8 tests (Zone 5)
- [ ] Full test suite passes with no regressions
- [ ] No duplicate test IDs across builders
- [ ] All imports resolve correctly
- [ ] TypeScript compiles with no errors

---

## Notes for Integrators

**Important context:**
- This is a low-conflict integration - all shared files have single owners
- All builders used the established test infrastructure correctly
- Test IDs follow the convention: TC-XX-YY (unique prefixes per module)

**Watch out for:**
- Ensure mock restoration logic in `createTestCaller()` is working correctly
- Verify the new `contextBuilderMock` export is available in setup.ts
- Check that tool_use helpers in anthropic.ts are properly exported

**Patterns to maintain:**
- Test ID convention: TC-XX-YY format
- Arrange-Act-Assert test structure
- Use `createTestCaller()` for all integration tests
- Use `createPartialMock()` for complex Supabase mock chains

---

## File Summary

### Files Modified (Builder-1)
| File | Lines Added | Purpose |
|------|-------------|---------|
| `test/mocks/anthropic.ts` | ~120 | Tool use mock helpers |
| `test/integration/setup.ts` | ~15 | Context builder mock |
| `test/integration/clarify/clarify.test.ts` | ~600 | 38 new tests |

### Files Created (Builder-2)
| File | Tests | Purpose |
|------|-------|---------|
| `test/integration/auth/verify-token.test.ts` | 5 | verifyToken procedure |
| `test/integration/auth/me-procedure.test.ts` | 9 | me procedure |
| `test/integration/auth/delete-account.test.ts` | 11 | deleteAccount procedure |
| `test/integration/auth/update-profile-edge.test.ts` | 16 | updateProfile edge cases |

### Files Created (Builder-3)
| File | Tests | Purpose |
|------|-------|---------|
| `test/unit/server/lib/cookies.test.ts` | 13 | Cookie functions |
| `test/unit/server/lib/supabase.test.ts` | 8 | Supabase client |

### Files Created (Builder-4)
| File | Tests | Purpose |
|------|-------|---------|
| `test/unit/server/trpc/error-formatter.test.ts` | 8 | Error formatter |

---

## Next Steps

1. Spawn single integrator (Integrator-1)
2. Integrator verifies all zones sequentially
3. Run full test suite for final verification
4. Proceed to ivalidator for coverage verification

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-12-12T17:30:00Z
**Round:** 1
**Complexity:** LOW (no conflicts)
