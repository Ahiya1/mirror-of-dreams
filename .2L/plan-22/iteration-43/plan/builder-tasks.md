# Builder Task Breakdown

## Overview

**1 primary builder** will implement all tests in a single file. This is appropriate because:
- All tests share the same setup infrastructure
- Tests are organized by procedure in one file (matching existing patterns)
- Dependencies between test sections are minimal

## Builder Assignment Strategy

- Single builder handles all 77 test cases
- Tests organized by procedure within single file
- Complexity managed through clear section organization

---

## Builder-1: Clarify Router Integration Tests

### Scope

Implement comprehensive integration tests for the clarify router (`server/trpc/routers/clarify.ts`) covering all 10 procedures with authorization, success, and error cases. Special focus on the tool use flow which requires chained Anthropic mocks.

### Complexity Estimate

**HIGH**

Rationale:
- 77 test cases across 10 procedures
- Complex tool use flow with chained mocks
- Multiple middleware types to test
- Session ownership verification is security-critical

### Success Criteria

- [ ] Test file created at `test/integration/clarify/clarify.test.ts`
- [ ] All 10 procedures have test coverage
- [ ] Tool use flow tested with chained Anthropic mock
- [ ] Authorization tests pass for all user types
- [ ] Error handling covers database failures and API errors
- [ ] All tests pass with `npm run test`
- [ ] Coverage reaches 85%+ for clarify.ts

### Files to Create

- `test/integration/clarify/clarify.test.ts` - All clarify router tests (~77 test cases)

### Dependencies

**Depends on:**
- Existing test infrastructure in `test/integration/setup.ts`
- Clarify factories in `test/factories/clarify.factory.ts`
- User factories in `test/factories/user.factory.ts`

**Blocks:**
- Nothing - this is a standalone test file

### Implementation Notes

1. **Start with simpler procedures first** to build familiarity with mock patterns:
   - getLimits (4 tests)
   - getPatterns (4 tests)
   - archiveSession (5 tests)
   - restoreSession (5 tests)
   - updateTitle (5 tests)
   - deleteSession (5 tests)

2. **Then tackle query procedures**:
   - getSession (6 tests)
   - listSessions (8 tests)

3. **Finally implement complex mutation tests**:
   - sendMessage (18 tests) - includes tool use flow
   - createSession (15 tests) - includes tool use flow

4. **Tool use flow is critical** - Use the chained mock pattern from patterns.md:
   ```typescript
   anthropicMock.messages.create
     .mockResolvedValueOnce({ /* tool_use response */ })
     .mockResolvedValueOnce({ /* follow-up text response */ });
   ```

5. **Middleware types**:
   - `clarifyProcedure` - Requires auth, non-demo, paid tier
   - `clarifyReadProcedure` - Allows demo users for read operations
   - `clarifySessionLimitedProcedure` - Includes session limit check

6. **Session ownership** - Always mock ownership check result appropriately for mutations

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use `createTestCaller` for all tests
- Use `mockQueries` for database mocks
- Use chained `mockResolvedValueOnce` for tool use flow
- Follow test ID convention: `TC-{PREFIX}-{NUMBER}`

### Testing Requirements

- Unit tests: N/A (these are integration tests)
- Integration tests: 77 test cases
- Coverage target: 85%+ for clarify.ts

### Potential Split Strategy (if complexity is HIGH)

If this task proves too complex for single execution, consider splitting into:

**Foundation (Primary Builder):**
Create file structure and implement simpler procedures:
- File setup with imports and constants
- getLimits tests (4)
- getPatterns tests (4)
- archiveSession tests (5)
- restoreSession tests (5)
- updateTitle tests (5)
- deleteSession tests (5)

**Sub-builder 1A: Query Procedures**
- getSession tests (6)
- listSessions tests (8)
- Estimate: MEDIUM

**Sub-builder 1B: Complex Mutations**
- createSession tests (15) with tool use
- sendMessage tests (18) with tool use
- Estimate: HIGH

---

## Test Case Inventory

### createSession Tests (15 tests) - Lines 232-399

| ID | Test Case | Type |
|----|-----------|------|
| TC-CS-01 | Create session without initial message | Success |
| TC-CS-02 | Create session with initial message (no tool use) | Success |
| TC-CS-03 | Create session with initial message triggering createDream tool | Success |
| TC-CS-04 | Verify user counters updated after creation | Success |
| TC-CS-05 | Verify sessions cache invalidated after creation | Success |
| TC-CS-06 | Return correct usage stats in response | Success |
| TC-CS-07 | Reject unauthenticated user | Auth |
| TC-CS-08 | Reject demo user | Auth |
| TC-CS-09 | Reject free tier user | Auth |
| TC-CS-10 | Reject pro tier at session limit | Auth |
| TC-CS-11 | Allow creator to bypass limits | Auth |
| TC-CS-12 | Allow admin to bypass limits | Auth |
| TC-CS-13 | Handle session creation database error | Error |
| TC-CS-14 | Handle Anthropic API error during initial message | Error |
| TC-CS-15 | Handle Anthropic returning no text response | Error |

### getSession Tests (6 tests) - Lines 401-427

| ID | Test Case | Type |
|----|-----------|------|
| TC-GS-01 | Return session with messages for owner | Success |
| TC-GS-02 | Allow demo user to read session | Success |
| TC-GS-03 | Reject request for non-existent session | Error |
| TC-GS-04 | Reject request for other user's session | Auth |
| TC-GS-05 | Handle session with no messages | Success |
| TC-GS-06 | Handle invalid session ID format | Validation |

### listSessions Tests (8 tests) - Lines 429-475

| ID | Test Case | Type |
|----|-----------|------|
| TC-LS-01 | Return user's sessions ordered by last_message_at | Success |
| TC-LS-02 | Filter by status (active) | Success |
| TC-LS-03 | Filter by status (archived) | Success |
| TC-LS-04 | Pagination with cursor | Success |
| TC-LS-05 | Respect limit parameter | Success |
| TC-LS-06 | Return nextCursor when more results exist | Success |
| TC-LS-07 | Handle empty results | Success |
| TC-LS-08 | Allow demo user to list sessions | Success |

### sendMessage Tests (18 tests) - Lines 477-635

| ID | Test Case | Type |
|----|-----------|------|
| TC-SM-01 | Send message and receive text response | Success |
| TC-SM-02 | Send message triggering createDream tool | Success |
| TC-SM-03 | Verify user message stored before AI call | Success |
| TC-SM-04 | Verify AI response stored with token count | Success |
| TC-SM-05 | Verify tool_use record stored when tool triggered | Success |
| TC-SM-06 | Verify context built from user data | Success |
| TC-SM-07 | Verify conversation history included in API call | Success |
| TC-SM-08 | Return correct message structure | Success |
| TC-SM-09 | Tool use success - dream created | Success |
| TC-SM-10 | Tool use failure - dream creation fails | Error |
| TC-SM-11 | Tool follow-up response extraction | Success |
| TC-SM-12 | Reject unauthenticated user | Auth |
| TC-SM-13 | Reject demo user | Auth |
| TC-SM-14 | Reject request for non-owned session | Auth |
| TC-SM-15 | Handle Anthropic API error | Error |
| TC-SM-16 | Handle Anthropic returning no text response | Error |
| TC-SM-17 | Handle user message save failure | Error |
| TC-SM-18 | Handle AI response save failure | Error |

### archiveSession Tests (5 tests) - Lines 637-654

| ID | Test Case | Type |
|----|-----------|------|
| TC-AS-01 | Archive owned session successfully | Success |
| TC-AS-02 | Reject archiving non-owned session | Auth |
| TC-AS-03 | Reject archiving non-existent session | Error |
| TC-AS-04 | Reject demo user | Auth |
| TC-AS-05 | Handle database update error | Error |

### restoreSession Tests (5 tests) - Lines 656-673

| ID | Test Case | Type |
|----|-----------|------|
| TC-RS-01 | Restore archived session successfully | Success |
| TC-RS-02 | Reject restoring non-owned session | Auth |
| TC-RS-03 | Reject restoring non-existent session | Error |
| TC-RS-04 | Reject demo user | Auth |
| TC-RS-05 | Handle database update error | Error |

### updateTitle Tests (5 tests) - Lines 675-692

| ID | Test Case | Type |
|----|-----------|------|
| TC-UT-01 | Update title successfully | Success |
| TC-UT-02 | Reject updating non-owned session | Auth |
| TC-UT-03 | Reject demo user | Auth |
| TC-UT-04 | Reject empty title | Validation |
| TC-UT-05 | Reject title exceeding max length | Validation |

### deleteSession Tests (5 tests) - Lines 694-708

| ID | Test Case | Type |
|----|-----------|------|
| TC-DS-01 | Delete owned session successfully | Success |
| TC-DS-02 | Reject deleting non-owned session | Auth |
| TC-DS-03 | Reject deleting non-existent session | Error |
| TC-DS-04 | Reject demo user | Auth |
| TC-DS-05 | Handle database delete error | Error |

### getLimits Tests (6 tests) - Lines 710-722

| ID | Test Case | Type |
|----|-----------|------|
| TC-GL-01 | Return correct limits for pro tier | Success |
| TC-GL-02 | Return correct limits for unlimited tier | Success |
| TC-GL-03 | Return canCreateSession=true when under limit | Success |
| TC-GL-04 | Return canCreateSession=false when at limit | Success |
| TC-GL-05 | Return canCreateSession=true for creator at limit | Success |
| TC-GL-06 | Allow demo user to query limits | Success |

### getPatterns Tests (4 tests) - Lines 724-728

| ID | Test Case | Type |
|----|-----------|------|
| TC-GP-01 | Return user's patterns | Success |
| TC-GP-02 | Return empty array when no patterns | Success |
| TC-GP-03 | Reject unauthenticated user | Auth |
| TC-GP-04 | Reject demo user | Auth |

---

## Builder Execution Order

### Single Builder Execution

1. **Setup Phase** (~10 min)
   - Create file with imports
   - Set up constants and beforeEach
   - Copy mock helper patterns

2. **Simple Procedures Phase** (~45 min)
   - getLimits tests (6)
   - getPatterns tests (4)
   - archiveSession tests (5)
   - restoreSession tests (5)
   - updateTitle tests (5)
   - deleteSession tests (5)

3. **Query Procedures Phase** (~30 min)
   - getSession tests (6)
   - listSessions tests (8)

4. **Complex Mutations Phase** (~75 min)
   - createSession tests (15)
   - sendMessage tests (18)

5. **Validation Phase** (~15 min)
   - Run all tests
   - Check coverage
   - Fix any failing tests

**Total Estimated Time:** 2.5-3 hours

---

## Integration Notes

### File Organization
Single test file with describe blocks for each procedure. This matches the existing pattern in `test/integration/reflection/reflection-create.test.ts`.

### Shared Constants
Define at top of file:
```typescript
const TEST_SESSION_ID = '12345678-1234-1234-1234-123456789012';
const TEST_MESSAGE_ID = 'abcdef12-3456-7890-abcd-ef1234567890';
const TEST_DREAM_ID = 'fedcba98-7654-3210-fedc-ba9876543210';
```

### Mock Reset Strategy
`createTestCaller` handles mock clearing and restoration. No additional cleanup needed between tests.

### Potential Conflict Areas
None - single file, single builder.

### Verification Commands
```bash
# Run tests
npm run test test/integration/clarify/clarify.test.ts

# Run with coverage
npm run test:coverage -- test/integration/clarify

# Watch mode during development
npm run test -- --watch test/integration/clarify/clarify.test.ts
```
