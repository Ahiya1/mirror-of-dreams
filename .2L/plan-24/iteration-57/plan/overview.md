# 2L Iteration Plan - Component Coverage Expansion (Iteration 57)

## Project Vision

Iteration 57 targets **15 untested components** to expand test coverage as part of Plan 24's "Test Supremacy" initiative. This iteration focuses on UI component testing with comprehensive mock infrastructure, following established patterns from the existing 57+ component test files.

The goal is to achieve thorough test coverage for subscription, dashboard, navigation, and utility components while establishing the critical PayPal SDK mock infrastructure needed for future payment-related testing.

## Success Criteria

Specific, measurable criteria for iteration completion:

- [ ] All 15 target components have comprehensive test files
- [ ] PayPal SDK mock created in `test/mocks/paypal-sdk.tsx`
- [ ] Minimum 230 new tests added across all components
- [ ] All tests pass with no flaky failures
- [ ] Test coverage increases by at least 3-5%
- [ ] Each component achieves minimum 80% coverage for its test file

## MVP Scope

**In Scope (15 components):**

### P0 - Subscription Components (Builder-1)
1. CancelSubscriptionModal (145 lines) - 15-20 tests
2. PayPalCheckoutModal (178 lines) - 25-30 tests (requires PayPal mock)
3. SubscriptionStatusCard (155 lines) - 20-25 tests

### P1 - Dashboard Components (Builder-2)
4. SubscriptionCard (473 lines) - 15-20 tests
5. DashboardGrid (26 lines) - 5-8 tests
6. WelcomeSection (48 lines) - 10-12 tests

### P1 - Navigation Components (Builder-3)
7. AppNavigation (352 lines) - 25-30 tests
8. UserDropdownMenu (88 lines) - 12-15 tests
9. MobileNavigationMenu (126 lines) - 12-15 tests
10. NavigationBase (64 lines) - 8-10 tests
11. BottomNavigation (190 lines) - 18-22 tests

### P1 - Other Components (Builder-4)
12. ClarifyCard (237 lines) - 18-22 tests
13. ReflectionFilters (303 lines) - 20-25 tests
14. AccountInfoSection (144 lines) - 18-22 tests
15. CosmicBackground (158 lines) - 10-12 tests

**Out of Scope (Post-Iteration):**
- NotificationsSection (does not exist in codebase)
- ProfileInfoSection (does not exist in codebase)
- TimezoneSection (does not exist in codebase)
- BottomSheet (already tested with 77 tests)
- Creating new shared mock utility files beyond PayPal mock

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - Estimated 2-3 hours (4 parallel builders)
4. **Integration** - Estimated 15 minutes
5. **Validation** - Estimated 15 minutes
6. **Deployment** - Final

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: 2-3 hours (parallel builders)
- Integration: 15 minutes
- Validation: 15 minutes
- **Total: ~3-4 hours**

## Risk Assessment

### High Risks

1. **PayPal SDK Mock Complexity**
   - Risk: PayPal mock may not adequately simulate real SDK behavior
   - Mitigation: Builder-1 creates mock first, tests CancelSubscriptionModal and SubscriptionStatusCard before PayPalCheckoutModal

2. **AppNavigation Test Complexity**
   - Risk: 352-line component with refs, effects, responsive behavior may require extensive test setup
   - Mitigation: Comprehensive mock strategy documented in patterns.md; builder can split if needed

### Medium Risks

1. **Time-based Test Flakiness**
   - Risk: WelcomeSection greeting tests may be flaky due to timing
   - Mitigation: Use `vi.setSystemTime()` consistently as shown in existing DashboardHero tests

2. **Framer Motion Mocking**
   - Risk: Animation components may behave unexpectedly when mocked
   - Mitigation: Follow established BottomSheet.test.tsx patterns for motion mocking

### Low Risks

1. **Component Dependencies**
   - Risk: Some components import other components that need mocking
   - Mitigation: Mock child components as simple pass-through elements

## Integration Strategy

Each builder creates test files in the standard `__tests__/` directory structure:

```
components/
  subscription/__tests__/
    CancelSubscriptionModal.test.tsx
    PayPalCheckoutModal.test.tsx
    SubscriptionStatusCard.test.tsx
  dashboard/
    cards/__tests__/
      SubscriptionCard.test.tsx
    shared/__tests__/
      DashboardGrid.test.tsx
      WelcomeSection.test.tsx
  shared/__tests__/
    AppNavigation.test.tsx
    UserDropdownMenu.test.tsx
    MobileNavigationMenu.test.tsx
    NavigationBase.test.tsx
    CosmicBackground.test.tsx
  navigation/__tests__/
    BottomNavigation.test.tsx
  clarify/__tests__/
    ClarifyCard.test.tsx
  reflections/__tests__/
    ReflectionFilters.test.tsx
  profile/__tests__/
    AccountInfoSection.test.tsx
test/
  mocks/
    paypal-sdk.tsx  (Created by Builder-1)
```

**Conflict Prevention:**
- Each builder works on separate component directories
- Builder-1 creates PayPal mock in dedicated file
- No shared code modifications beyond new mock file

## Deployment Plan

1. All builders complete their test files
2. Integration phase runs full test suite to verify no regressions
3. Coverage report generated to verify improvement
4. All tests must pass before iteration marked complete
