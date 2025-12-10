# 2L Iteration Plan - Iteration 38: TypeScript & Component Tests

## Project Vision

Strengthen the codebase with proper TypeScript types for Anthropic API interactions and establish comprehensive component testing infrastructure. This iteration eliminates `any` types from production API code and creates a robust foundation for testing React components.

## Success Criteria

- [ ] Zero `any` types in `evolution.ts` and `visualizations.ts` routers
- [ ] Centralized Anthropic type definitions with reusable type guards
- [ ] `@testing-library/react` installed and configured
- [ ] 10+ component test files created with meaningful coverage
- [ ] All tests passing with `npm test`
- [ ] vitest.config.ts updated to include component coverage

## MVP Scope

**In Scope:**
- Create `lib/anthropic/types.ts` with ContentBlock, TextBlock, ThinkingBlock type re-exports
- Create `lib/anthropic/type-guards.ts` with reusable type guard functions
- Remove all `any` types from `server/trpc/routers/evolution.ts` (9 instances)
- Remove all `any` types from `server/trpc/routers/visualizations.ts` (4 instances)
- Fix `any` type in `server/lib/temporal-distribution.ts` (1 instance)
- Install @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- Update vitest.setup.ts with testing-library matchers
- Update vitest.config.ts for component coverage
- Create 10+ component test files targeting Priority 1-2 components

**Out of Scope (Post-MVP):**
- Fixing `any` types in utility files (consolidation.ts, users.ts, dreams.ts)
- Fixing `any` types in types/ directory (clarify.ts, user.ts)
- E2E component testing
- Snapshot testing
- Component tests for complex stateful components (forms, modals)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 3-4 hours (2 parallel builders)
4. **Integration** - Estimated 15 minutes
5. **Validation** - Estimated 15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 3-4 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- Total: ~4 hours

## Risk Assessment

### High Risks

- **SDK Type Compatibility:** The `thinking_tokens` field may not exist in SDK types. Mitigation: Create ExtendedUsage interface with optional field.
- **Breaking Type Changes:** Stricter types may reveal hidden errors. Mitigation: Run TypeScript compiler after each file change.

### Medium Risks

- **Testing Library Integration:** Potential conflicts with happy-dom. Mitigation: Follow established patterns from Vitest documentation.
- **Framer Motion Mocking:** Components using framer-motion need careful handling. Mitigation: Provide mock patterns in builder-tasks.md.

### Low Risks

- **Test Maintenance:** New tests create maintenance burden. Mitigation: Focus on stable, pure components first.

## Integration Strategy

Builder 1 (TypeScript) and Builder 2 (Testing) work in parallel with no dependencies:

1. Builder 1 creates type definitions and updates routers
2. Builder 2 sets up testing infrastructure and creates tests
3. Both complete independently
4. Integration validates all tests pass with new types

**No shared files or conflicts expected** - builders work in entirely separate areas.

## Deployment Plan

1. Run `npm test` to verify all tests pass
2. Run `npx tsc --noEmit` to verify type safety
3. Commit all changes together
4. No production deployment changes required (infrastructure-only iteration)
