# 2L Iteration Plan - Code Quality & Testing Foundation

## Project Vision

Establish a robust code quality and testing foundation for Mirror of Dreams. This iteration transforms the project from having minimal tooling (no ESLint config, no Prettier, no installed testing framework, no CI/CD) to having enterprise-grade quality enforcement. The goal is to catch bugs early, maintain consistent code style, and provide confidence for future development through automated testing.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] ESLint configured with Next.js strict rules and TypeScript support
- [ ] Prettier installed and configured with project-wide formatting
- [ ] All existing code passes lint checks (with reasonable baseline)
- [ ] Vitest installed and configured with path alias support
- [ ] Both existing test files run successfully
- [ ] At least 5 new unit test files for core business logic
- [ ] Test coverage reporting functional
- [ ] Pre-commit hooks prevent committing lint errors
- [ ] GitHub Actions CI runs on pull requests
- [ ] All quality checks pass in CI pipeline

## MVP Scope

**In Scope:**
- ESLint configuration (Next.js strict + TypeScript + import rules)
- Prettier configuration with ESLint integration
- Vitest setup with coverage reporting
- Migration of existing test files to consistent Vitest syntax
- Unit tests for pure business logic functions
- Pre-commit hooks with Husky + lint-staged
- GitHub Actions CI workflow
- Package.json scripts for all quality commands

**Out of Scope (Post-MVP):**
- React component testing (defer to future iteration)
- E2E testing with Playwright/Cypress
- Integration tests with actual database
- Visual regression testing
- Performance benchmarking
- Test coverage enforcement (set thresholds but don't block)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 4 parallel builders
4. **Integration** - Merge and resolve conflicts
5. **Validation** - Run full quality suite
6. **Deployment** - Merge to main

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Exploration | Complete | Two explorers analyzed codebase |
| Planning | Complete | This document |
| Building | 2-3 hours | 4 parallel builders |
| Integration | 30 minutes | Merge builder outputs |
| Validation | 15 minutes | Run full test suite |
| **Total** | **~3-4 hours** | Parallel execution |

## Risk Assessment

### High Risks

**Large Formatting Diff**
- Impact: Prettier will reformat entire codebase
- Mitigation: Run Prettier as separate commit labeled "style: format codebase with Prettier"
- Owner: Builder 1

**ESLint Errors Blocking Build**
- Impact: Too many new errors could delay iteration
- Mitigation: Start with warnings for non-critical rules, use eslint-disable for known issues
- Owner: Builder 1

### Medium Risks

**Test File Migration**
- Impact: Two test files use different frameworks (Vitest vs Jest syntax)
- Mitigation: Standardize on Vitest, migrate middleware.test.ts
- Owner: Builder 2

**Path Alias Resolution in Tests**
- Impact: @/ imports may not resolve in Vitest
- Mitigation: Configure aliases in vitest.config.ts matching tsconfig.json
- Owner: Builder 2

### Low Risks

**CI Pipeline Complexity**
- Impact: GitHub Actions may need adjustments for Vercel project
- Mitigation: Keep CI simple - lint, typecheck, test only
- Owner: Builder 4

## Integration Strategy

### Merge Order

1. **Builder 1 (ESLint + Prettier)** merges first - establishes code style
2. **Builder 2 (Vitest Setup)** merges second - requires formatted code
3. **Builder 3 (Unit Tests)** merges third - requires testing infrastructure
4. **Builder 4 (CI/CD)** merges last - requires all other builders

### Conflict Prevention

- Builders work on distinct files (no overlapping file edits)
- package.json changes coordinated via devDependencies sections
- Builder 1 owns formatting config files
- Builder 2 owns testing config files
- Builder 3 owns test files only
- Builder 4 owns .github directory only

### Shared File Strategy

**package.json** is the only shared file. Resolution:
1. Builder 1 adds ESLint/Prettier devDependencies and scripts
2. Builder 2 adds Vitest devDependencies and test scripts
3. Builder 4 adds any remaining scripts
4. Integration phase merges all changes

## Deployment Plan

1. All builders complete work on feature branch
2. Run full quality suite locally: `npm run lint && npm run typecheck && npm test`
3. Create PR to main
4. CI validates all checks pass
5. Merge to main
6. Vercel auto-deploys (no changes to deployment process)

## Builder Summary

| Builder | Focus Area | Key Deliverables |
|---------|------------|------------------|
| Builder 1 | Code Quality Config | ESLint, Prettier, Husky, lint-staged |
| Builder 2 | Test Infrastructure | Vitest config, mocks, test migration |
| Builder 3 | Unit Tests | Tests for business logic functions |
| Builder 4 | CI/CD Pipeline | GitHub Actions workflow |

---

*Plan created for Iteration 29: Code Quality & Testing Foundation*
*Part of Plan-19: Technical Hardening*
