# 2L Iteration Plan - Clarify Router Tests

## Project Vision

Build comprehensive integration tests for the Clarify router (`server/trpc/routers/clarify.ts`), the most complex router in the codebase at 731 lines with 10 procedures. This iteration focuses on achieving 85%+ test coverage while properly testing the unique tool use flow that involves two-step Anthropic API calls.

## Success Criteria

Specific, measurable criteria for completion:

- [ ] Test file created at `test/integration/clarify/clarify.test.ts`
- [ ] All 10 procedures tested (createSession, getSession, listSessions, sendMessage, archiveSession, restoreSession, updateTitle, deleteSession, getLimits, getPatterns)
- [ ] Tool use flow tested with chained Anthropic mock (first call returns tool_use, second call returns follow-up text)
- [ ] Authorization tests for all middleware variants (clarifyProcedure, clarifyReadProcedure, clarifySessionLimitedProcedure)
- [ ] Error handling tests for database failures, API errors, and validation errors
- [ ] Coverage target: 85%+ for clarify.ts
- [ ] All tests pass with `npm run test`

## MVP Scope

**In Scope:**
- Integration tests for all 10 clarify router procedures
- Enhanced Anthropic mock patterns for tool use chaining
- Authorization tests for free tier rejection, demo user handling, session limits
- Error handling tests for API failures, database errors
- Edge case tests for pagination, empty results, ownership verification

**Out of Scope (Post-MVP):**
- Streaming endpoint tests (`app/api/clarify/stream/route.ts`)
- Tests for `lib/clarify/consolidation.ts` (background job, not called by router)
- Performance/load testing
- E2E browser tests

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~2-3 hours (single builder)
4. **Integration** - N/A (single test file)
5. **Validation** - 15 minutes (run tests, verify coverage)
6. **Deployment** - N/A (tests only)

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours
- Validation: 15 minutes
- Total: ~3 hours

## Risk Assessment

### High Risks
- **Tool use mock complexity**: The createDream tool flow requires mocking two sequential Anthropic API calls with different response shapes. Mitigation: Provide clear chained mock pattern in patterns.md with explicit examples.

### Medium Risks
- **Middleware interaction**: Three different middleware types need testing. Mitigation: Test each middleware type explicitly in authorization section.
- **Session ownership verification**: Critical security logic needs thorough testing. Mitigation: Dedicated test cases for ownership checks across all mutations.

### Low Risks
- **Simple CRUD operations**: Standard patterns for archive/restore/update/delete
- **Query operations**: Pagination and filtering are straightforward

## Integration Strategy

Single test file approach - all tests in one file organized by procedure. This matches the existing pattern in `test/integration/reflection/reflection-create.test.ts` and keeps related tests together.

## Test Organization

```
test/integration/clarify/
  clarify.test.ts (~77 test cases)
    - describe('clarify.createSession')
    - describe('clarify.getSession')
    - describe('clarify.listSessions')
    - describe('clarify.sendMessage')
    - describe('clarify.archiveSession')
    - describe('clarify.restoreSession')
    - describe('clarify.updateTitle')
    - describe('clarify.deleteSession')
    - describe('clarify.getLimits')
    - describe('clarify.getPatterns')
```

## Coverage Target Breakdown

| Procedure | Lines | Target Tests | Expected Coverage |
|-----------|-------|--------------|-------------------|
| createSession | 167 | 15 | 90%+ |
| sendMessage | 158 | 18 | 90%+ |
| getSession | 26 | 6 | 95%+ |
| listSessions | 46 | 8 | 90%+ |
| archiveSession | 17 | 5 | 95%+ |
| restoreSession | 17 | 5 | 95%+ |
| updateTitle | 17 | 5 | 95%+ |
| deleteSession | 14 | 5 | 95%+ |
| getLimits | 12 | 6 | 100% |
| getPatterns | 4 | 4 | 100% |
| Helper functions | ~70 | (covered by above) | 85%+ |
| **Total** | **731** | **~77** | **85%+** |
