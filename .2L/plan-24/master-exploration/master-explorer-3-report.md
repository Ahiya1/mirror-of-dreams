# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
Coverage Gap Analysis & Prioritization

## Vision Summary
Transform Mirror of Dreams from 79% test coverage to 95%+ by systematically addressing coverage gaps in server routers, components, and E2E tests, with focus on business-critical paths.

---

## Current Coverage State (Baseline)

### Overall Metrics
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Lines | 79.04% | 95% | 15.96% |
| Statements | 79.01% | 95% | 15.99% |
| Branches | 71.81% | 90% | 18.19% |
| Functions | 71.57% | 90% | 18.43% |
| Total Tests | 3477 | ~4250 | ~773 tests |

### E2E Test Files
Current: 6 E2E spec files
Target: 12+ E2E spec files
Files needed: 6+ new E2E specs

---

## Coverage Gap Analysis by Priority

### P0 - Critical Server-Side Gaps (Business Logic)

#### 1. Clarify Router (`server/trpc/routers/clarify.ts`)
- **Current Coverage:** 45.62% statements, 38.46% branches, 46.15% functions
- **Lines:** 45.91%
- **Uncovered Lines:** 282-330, 361-369, 381-387, 509-527, 537-547, 666, 685, 701
- **Business Impact:** HIGH - Core AI conversation feature for paid users
- **Missing Tests:**
  - `createSession` with initial message and AI response (lines 282-387)
  - Tool use execution flow (`createDream` tool)
  - `sendMessage` with tool_use blocks (lines 509-547)
  - Error handling in AI calls
  - Follow-up message generation after tool use
- **Effort:** LARGE (requires Anthropic SDK mocking, complex async flows)
- **Estimated Tests:** 40-50 new tests

#### 2. Auth Router (`server/trpc/routers/auth.ts`)
- **Current Coverage:** 70.21% statements, 71.66% branches, 66.66% functions
- **Uncovered Lines:** 106-147, 189-207, 266-287, 359-401
- **Business Impact:** HIGH - Authentication is foundational
- **Missing Tests:**
  - Email verification token flow (lines 106-147)
  - Monthly usage reset on signin (lines 189-207)
  - Update profile error handling (lines 266-287)
  - Delete account flow (lines 359-401)
- **Effort:** MEDIUM
- **Estimated Tests:** 25-30 new tests

#### 3. Cookies Module (`server/lib/cookies.ts`)
- **Current Coverage:** 33.33% statements, 0% branches, 0% functions
- **Uncovered Lines:** 24-41
- **Business Impact:** MEDIUM - Auth token handling
- **Missing Tests:**
  - `setAuthCookie()` function (lines 23-26)
  - `getAuthCookie()` function (lines 31-34)
  - `clearAuthCookie()` function (lines 39-42)
- **Note:** Current tests only validate config constants, not actual functions
- **Effort:** MEDIUM (requires Next.js cookies() mocking)
- **Estimated Tests:** 10-15 new tests

#### 4. Supabase Client (`server/lib/supabase.ts`)
- **Current Coverage:** 0% statements, 0% branches
- **Lines:** 6-9
- **Business Impact:** MEDIUM - Database client wrapper
- **Missing Tests:**
  - Client initialization
  - Environment variable handling
- **Effort:** SMALL (simple module)
- **Estimated Tests:** 5-8 tests

#### 5. tRPC Core (`server/trpc/trpc.ts`)
- **Current Coverage:** 57.14% statements, 0% branches, 0% functions
- **Uncovered Lines:** 13-30
- **Business Impact:** MEDIUM - Error formatting and Sentry integration
- **Missing Tests:**
  - Error formatter function
  - Sentry capture logic
  - Zod error flattening
- **Effort:** MEDIUM
- **Estimated Tests:** 10-15 tests

---

### P1 - Component Coverage Gaps (UI Layer)

#### 6. Dashboard Cards
| Component | Current | Target | Effort |
|-----------|---------|--------|--------|
| `QuickStatsCard` | 0% | 90% | N/A - File doesn't exist |
| `SubscriptionCard` | 0% | 90% | MEDIUM |
| `DashboardGrid` | 0% | 90% | SMALL |
| `WelcomeSection` | 0% | 90% | SMALL |

**Note:** QuickStatsCard file not found - may be removed or renamed.

**Missing for SubscriptionCard (224 lines):**
- Tier display rendering
- Benefits list rendering
- Upgrade action logic
- Responsive layout behavior

**Effort:** MEDIUM
**Estimated Tests:** 30-40 tests

#### 7. Subscription Components (0% Coverage)
| Component | Lines | Complexity | Effort |
|-----------|-------|------------|--------|
| `CancelSubscriptionModal` | 28-115 | Medium | MEDIUM |
| `PayPalCheckoutModal` | 31-150 | High | LARGE |
| `SubscriptionStatusCard` | 16-150 | Medium | MEDIUM |

**Business Impact:** HIGH - Payment flow critical for revenue

**Missing Tests:**
- `CancelSubscriptionModal`: Cancel flow, confirmation checkbox, loading states
- `PayPalCheckoutModal`: PayPal SDK integration, subscription creation, error handling
- `SubscriptionStatusCard`: Status display, cancel button, tier rendering

**Effort:** LARGE (requires PayPal SDK mocking, tRPC mutation mocking)
**Estimated Tests:** 50-60 tests

#### 8. Clarify Components (0% Coverage)
| Component | Lines | Effort |
|-----------|-------|--------|
| `ClarifyCard` | 28-115 | MEDIUM |

**Missing Tests:**
- Access check for free tier
- Loading states
- Sessions list rendering
- Empty state
- Usage bar display

**Effort:** MEDIUM
**Estimated Tests:** 20-25 tests

#### 9. Shared Components Gaps
| Component | Current | Lines | Effort |
|-----------|---------|-------|--------|
| `AppNavigation` | 0% | 54-323 | LARGE |
| `CosmicBackground` | 0% | 21-49 | SMALL |
| `MobileNavigationMenu` | 0% | 33-37 | SMALL |
| `NavigationBase` | 0% | 39 | SMALL |
| `UserDropdownMenu` | 0% | 34 | SMALL |
| `MarkdownPreview` | 38.46% | 51-68 | SMALL |

**Business Impact:** MEDIUM - Navigation and UI infrastructure

**AppNavigation Missing Tests (most complex):**
- Desktop nav links rendering
- Mobile menu toggle
- User dropdown behavior
- Signout flow
- Active page highlighting
- Responsive breakpoints

**Effort:** MEDIUM-LARGE overall
**Estimated Tests:** 40-50 tests

#### 10. Profile Components (0% Coverage)
| Component | Lines | Effort |
|-----------|-------|--------|
| `NotificationsSection` | 42-93 | MEDIUM |
| `ProfileInfoSection` | 62 | SMALL |
| `TimezoneSection` | 44 | SMALL |

**Estimated Tests:** 15-20 tests

#### 11. Reflections Components Gaps
| Component | Current | Lines | Effort |
|-----------|---------|-------|--------|
| `ReflectionPageRenderer` | 0% | 17-157 | MEDIUM |
| `ReflectionFilters` | 0% | 41-267 | LARGE |

**Estimated Tests:** 25-30 tests

#### 12. Navigation Component (0% Coverage)
| Component | Lines | Effort |
|-----------|-------|--------|
| `BottomNavigation` | 34-138 | MEDIUM |

**Estimated Tests:** 15-20 tests

#### 13. Illustrations (0% Coverage)
| Component | Lines | Effort |
|-----------|-------|--------|
| `BlankJournal` | 14 | SMALL |
| `CanvasVisual` | 14 | SMALL |
| `Constellation` | 14 | SMALL |
| `CosmicSeed` | 14 | SMALL |

**Estimated Tests:** 8-12 tests (simple SVG components)

#### 14. Reflection Mobile Components
| Component | Current | Lines | Effort |
|-----------|---------|-------|--------|
| `MobileBottomSheet` | 0% | 12-198 | LARGE |
| `QuestionStep (mobile)` | 7.14% | 61-87 | SMALL |
| `ToneStep` | 11.11% | 67-93 | SMALL |

**Estimated Tests:** 25-30 tests

#### 15. Providers (0% Coverage)
| Component | Lines | Effort |
|-----------|-------|--------|
| `TRPCProvider` | 13-52 | SMALL |

**Estimated Tests:** 5-8 tests

---

### P2 - E2E Test Expansion

#### Current E2E Coverage (6 files)
1. `e2e/auth/signin.spec.ts` - Sign in flows
2. `e2e/auth/signup.spec.ts` - Sign up flows
3. `e2e/landing/landing.spec.ts` - Landing page
4. `e2e/dashboard/dashboard.spec.ts` - Dashboard display
5. `e2e/dreams/dreams.spec.ts` - Dreams management
6. `e2e/reflection/reflection.spec.ts` - Reflection flow

#### Missing E2E Test Files (6+ needed)
| E2E Spec | Priority | Effort | Tests Est. |
|----------|----------|--------|------------|
| `e2e/profile/profile.spec.ts` | P1 | MEDIUM | 10-15 |
| `e2e/subscription/subscription.spec.ts` | P1 | LARGE | 15-20 |
| `e2e/admin/admin.spec.ts` | P1 | MEDIUM | 10-15 |
| `e2e/clarify/clarify.spec.ts` | P1 | LARGE | 15-20 |
| `e2e/error/error-handling.spec.ts` | P2 | MEDIUM | 10-15 |
| `e2e/evolution/evolution.spec.ts` | P2 | MEDIUM | 10-15 |

**Total New E2E Tests:** ~75 tests

---

## Priority Matrix Summary

### Priority P0 - Server-Side (Iteration 1)
| Area | Current | Target | Gap | Tests Needed | Effort |
|------|---------|--------|-----|--------------|--------|
| Clarify Router | 45.62% | 90% | 44.38% | 40-50 | LARGE |
| Auth Router | 70.21% | 90% | 19.79% | 25-30 | MEDIUM |
| Cookies Module | 33.33% | 90% | 56.67% | 10-15 | MEDIUM |
| Supabase Client | 0% | 90% | 90% | 5-8 | SMALL |
| tRPC Core | 57.14% | 90% | 32.86% | 10-15 | MEDIUM |
| **P0 Total** | - | - | - | **~110 tests** | - |

### Priority P1 - Components (Iteration 2)
| Area | Components | Tests Needed | Effort |
|------|------------|--------------|--------|
| Subscription Components | 3 | 50-60 | LARGE |
| Dashboard Cards | 4 | 30-40 | MEDIUM |
| Shared Components | 6 | 40-50 | MEDIUM |
| Clarify Components | 1 | 20-25 | MEDIUM |
| Reflection Components | 3 | 25-30 | MEDIUM |
| Profile Components | 3 | 15-20 | SMALL |
| Navigation | 1 | 15-20 | MEDIUM |
| Mobile Reflection | 3 | 25-30 | MEDIUM |
| Others | 5 | 13-20 | SMALL |
| **P1 Total** | - | **~230 tests** | - |

### Priority P2 - E2E Expansion (Iteration 3)
| E2E File | Tests Needed | Effort |
|----------|--------------|--------|
| Profile E2E | 10-15 | MEDIUM |
| Subscription E2E | 15-20 | LARGE |
| Admin E2E | 10-15 | MEDIUM |
| Clarify E2E | 15-20 | LARGE |
| Error Handling E2E | 10-15 | MEDIUM |
| Evolution E2E | 10-15 | MEDIUM |
| **P2 Total** | **~75 tests** | - |

---

## Recommended Order of Attack

### Iteration 1: Server-Side Remaining Gaps (P0)
**Estimated Tests:** ~110
**Focus:** Business logic and data layer

1. **Clarify Router (45% -> 90%)** - LARGE effort
   - Mock Anthropic SDK for AI response testing
   - Test tool use execution flow
   - Test error recovery scenarios
   - Estimated: 40-50 tests

2. **Auth Router (70% -> 90%)** - MEDIUM effort
   - Email verification flow
   - Monthly reset logic
   - Delete account flow
   - Estimated: 25-30 tests

3. **Cookies Module (33% -> 90%)** - MEDIUM effort
   - Test actual cookie functions (not just config)
   - Mock Next.js cookies() API
   - Estimated: 10-15 tests

4. **Supabase Client (0% -> 90%)** - SMALL effort
   - Client initialization tests
   - Environment variable handling
   - Estimated: 5-8 tests

5. **tRPC Core (57% -> 90%)** - MEDIUM effort
   - Error formatter tests
   - Sentry integration tests
   - Estimated: 10-15 tests

### Iteration 2: Component Coverage (P1)
**Estimated Tests:** ~230
**Focus:** UI layer and user interactions

1. **Subscription Components** - LARGE effort
   - CancelSubscriptionModal
   - PayPalCheckoutModal (requires PayPal SDK mocking)
   - SubscriptionStatusCard
   - Estimated: 50-60 tests

2. **Dashboard Cards** - MEDIUM effort
   - SubscriptionCard
   - DashboardGrid
   - WelcomeSection
   - Estimated: 30-40 tests

3. **Shared/Navigation Components** - MEDIUM effort
   - AppNavigation (complex, many features)
   - UserDropdownMenu
   - MobileNavigationMenu
   - CosmicBackground
   - Estimated: 40-50 tests

4. **Clarify Components** - MEDIUM effort
   - ClarifyCard with all states
   - Estimated: 20-25 tests

5. **Remaining Components** - MEDIUM effort
   - Reflection components
   - Profile components
   - Mobile components
   - Estimated: 90-100 tests

### Iteration 3: E2E Expansion (P2)
**Estimated Tests:** ~75
**Focus:** End-to-end user flows

1. **Profile E2E** - View, edit, password change
2. **Subscription E2E** - Status view, upgrade flow (mocked PayPal)
3. **Admin E2E** - Admin login, user management
4. **Clarify E2E** - Start conversation, tool interactions
5. **Error Handling E2E** - Network failures, session expiry
6. **Evolution E2E** - Report generation, history view

---

## Effort Estimates Summary

| Size | Definition | Examples |
|------|------------|----------|
| SMALL | <10 tests, simple mocking | Supabase client, illustrations, simple components |
| MEDIUM | 10-30 tests, moderate mocking | Auth router gaps, cookies, most components |
| LARGE | 30+ tests, complex mocking | Clarify router, PayPal checkout, E2E specs |

### Total Effort by Iteration
| Iteration | Tests | Components | Effort |
|-----------|-------|------------|--------|
| 1 (Server) | ~110 | 5 areas | 3-4 hours |
| 2 (Components) | ~230 | ~25 components | 5-6 hours |
| 3 (E2E) | ~75 | 6 spec files | 3-4 hours |
| **Total** | **~415** | - | **11-14 hours** |

---

## Key Technical Considerations

### 1. Mocking Requirements
- **Anthropic SDK:** Required for Clarify router (tool_use, streaming)
- **PayPal SDK:** Required for PayPalCheckoutModal
- **Next.js cookies():** Required for cookies module functions
- **Supabase client:** Already mocked in test setup
- **tRPC mutations:** Required for subscription components

### 2. Test Infrastructure Gaps
- Need PayPal SDK mock helper similar to `anthropicMock`
- May need updated cookies mock to test actual functions
- E2E fixtures may need profile/subscription page objects

### 3. Files Not Found
- `QuickStatsCard.tsx` mentioned in vision but file doesn't exist
- May have been removed or renamed - verify with codebase owner

### 4. High-Complexity Areas
- Clarify router AI flow with tool_use blocks
- PayPal subscription flow with SDK callbacks
- AppNavigation with responsive behavior

---

## Risk Assessment

### Low Risk
- Simple component tests (illustrations, badges)
- Configuration validation tests
- Already-established patterns (dashboard cards)

### Medium Risk
- Auth flow edge cases (email verification timing)
- Navigation responsive behavior tests
- Mobile component tests

### High Risk
- Clarify tool_use flow (complex async, AI responses)
- PayPal SDK integration mocking (external library)
- E2E subscription tests (payment flow simulation)

---

## Notes & Observations

1. **Coverage distribution is uneven:** Server routers have mixed coverage (45-100%), components have many 0% files
2. **Integration tests are strong:** 69 Clarify tests exist but focused on happy paths, missing edge cases
3. **E2E tests are well-structured:** Good patterns in existing specs, easy to extend
4. **Component test patterns exist:** Can follow existing SubscriptionCard tests as templates
5. **Some vision items may be outdated:** QuickStatsCard mentioned but doesn't exist

---

*Exploration completed: 2025-12-12*
*This report informs master planning decisions for Plan-24: Test Supremacy*
