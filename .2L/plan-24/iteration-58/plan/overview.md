# 2L Iteration Plan - E2E Test Expansion (Plan-24 Iteration 58)

## Project Vision

Double the E2E test coverage from 6 spec files to 11+ spec files, adding comprehensive user flow testing for Profile, Subscription, Admin, Clarify, and Error Handling pages. This iteration establishes robust fixture infrastructure (admin, paid-user, network) to enable testing of role-based and tier-based features.

## Success Criteria

- [ ] 3 new fixtures created (admin.fixture.ts, paid-user.fixture.ts, network.fixture.ts)
- [ ] 6 new page objects created (profile, settings, pricing, admin, clarify-list, clarify-session)
- [ ] 5 new spec files with comprehensive E2E tests
- [ ] ~75 new E2E tests added (~250 total E2E tests)
- [ ] All new tests pass on CI with 0 flakes
- [ ] Mobile viewport tests included in each spec
- [ ] Admin/paid-user authentication flows working reliably

## MVP Scope

**In Scope:**
- admin.fixture.ts - Admin user authentication
- paid-user.fixture.ts - Paid tier user testing (admin bypass)
- network.fixture.ts - Network failure simulation
- profile.spec.ts - Profile page display, edit name, demo restrictions (~15 tests)
- settings.spec.ts - Settings toggles and preferences (~10 tests)
- subscription.spec.ts - Pricing page, billing toggle, tier cards (~12 tests)
- admin.spec.ts - Authorization, stats display, user tables (~12 tests)
- clarify.spec.ts - Access control, session management, chat UI (~15 tests)
- error.spec.ts - Error boundaries, network errors, session expiry (~10 tests)

**Out of Scope (Post-MVP):**
- PayPal SDK interaction testing (mocked at browser level)
- AI response content testing (test UI states only)
- Destructive actions (delete account, cancel subscription - UI only)
- Full chat message exchange verification in Clarify

## Development Phases

1. **Exploration** - COMPLETE
2. **Planning** - CURRENT
3. **Building** - ~4 hours (parallel builders)
4. **Integration** - ~30 minutes
5. **Validation** - ~20 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 4 hours (4 parallel builders)
- Integration: 30 minutes
- Validation: 20 minutes
- Total: ~5 hours

## Risk Assessment

### High Risks

| Risk | Mitigation |
|------|------------|
| Admin user unavailable in test environment | Use existing admin credentials from env vars; fall back to creator role testing |
| Paid user testing requires real subscription | Admin/Creator users bypass tier checks; test access control via demo user |
| Flaky tests from timing issues | Use robust wait conditions, avoid hard timeouts, leverage Playwright auto-waiting |

### Medium Risks

| Risk | Mitigation |
|------|------------|
| Mobile tests requiring manual login | Documented pattern with fallback to demo login + viewport change |
| Network fixture complexity | Use Playwright's built-in route interception; focus on common scenarios |
| Page structure changes break selectors | Use semantic selectors (aria, role); add data-testid where needed |

## Integration Strategy

All builders work on isolated directories:
- Builder-1: `e2e/fixtures/` and `e2e/pages/`
- Builder-2: `e2e/profile/` and `e2e/settings/`
- Builder-3: `e2e/admin/` and `e2e/subscription/`
- Builder-4: `e2e/clarify/` and `e2e/error/`

No file conflicts expected. Builders 2-4 depend on Builder-1's fixtures and page objects.

## Deployment Plan

1. All E2E tests run via `npm run test:e2e`
2. CI runs tests in Chromium only with `workers: 1`
3. Retries enabled in CI (2 retries) for flake protection
4. Screenshots and traces captured on failure for debugging

## Builder Dependency Graph

```
Builder-1 (Infrastructure)
    |
    +-- Builder-2 (Profile + Settings)
    |
    +-- Builder-3 (Admin + Subscription)
    |
    +-- Builder-4 (Clarify + Error)
```

Builder-1 must complete fixtures and page objects before other builders can use them.
Builders 2, 3, 4 can work in parallel after Builder-1's deliverables are ready.
