# 2L Iteration Plan - Iteration 44: Evolution & Visualizations Router Tests

## Project Vision

Add comprehensive integration test coverage for the Evolution and Visualizations tRPC routers. These routers handle AI-powered analysis features that generate evolution reports and narrative visualizations based on user reflections. Testing these routers is critical for ensuring reliability of premium features.

## Success Criteria

- [ ] Evolution router tests achieve 85%+ code coverage
- [ ] Visualizations router tests achieve 85%+ code coverage
- [ ] All 5 evolution procedures tested (generateDreamEvolution, generateCrossDreamEvolution, list, get, checkEligibility)
- [ ] All 3 visualization procedures tested (generate, list, get)
- [ ] Extended thinking (Anthropic) path tested for unlimited tier
- [ ] Tier-based access control verified for all procedures
- [ ] RPC function mocking patterns established for limit checking
- [ ] All tests pass in CI environment

## MVP Scope

**In Scope:**
- Integration tests for evolution.ts router (46 test cases)
- Integration tests for visualizations.ts router (25 test cases)
- New fixture files for evolution reports and visualizations
- RPC mock helpers for limit checking functions
- Extended thinking response mocking patterns

**Out of Scope (Post-MVP):**
- Unit tests for temporal-distribution.ts (separate iteration)
- Unit tests for cost-calculator.ts (separate iteration)
- E2E tests for evolution/visualization flows
- Performance/load testing

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - ~2.5 hours (parallel builders)
4. **Integration** - ~15 minutes
5. **Validation** - ~15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2.5 hours (2 parallel builders)
  - Builder-1 (Evolution): ~1.5 hours
  - Builder-2 (Visualizations): ~1 hour
- Integration: 15 minutes
- Validation: 15 minutes
- Total: ~3 hours

## Risk Assessment

### High Risks
- **RPC Mock Complexity**: Both routers use multiple RPC functions for limit checking
  - Mitigation: Create reusable RPC mock helpers in setup or fixtures

### Medium Risks
- **Extended Thinking Token Extraction**: Visualizations router uses inconsistent pattern (`thinking?.length` vs `usage.thinking_tokens`)
  - Mitigation: Document in patterns and verify behavior in tests
- **Temporal Distribution Dependencies**: Tests need to mock temporal distribution selection
  - Mitigation: Use sufficient reflection counts to trigger distribution

### Low Risks
- **Mock State Leakage**: Complex mock setup between tests
  - Mitigation: Follow existing createTestCaller pattern which clears mocks

## Integration Strategy

Both builders work on separate test files with no direct dependencies:
- Builder-1: `test/integration/evolution/evolution.test.ts`
- Builder-2: `test/integration/visualizations/visualizations.test.ts`

Shared resources (fixtures) will be created by Builder-1 as foundation work, which Builder-2 can import.

## Deployment Plan

1. Run full test suite locally: `npm run test`
2. Verify coverage thresholds: `npm run test:coverage`
3. Commit test files to feature branch
4. CI will validate on push
