# Master Exploration Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Testing Infrastructure Analysis

## Vision Summary
Transform Mirror of Dreams from a 7.2/10 to 9+/10 production-hardened system, with primary focus on testing (currently 2/10 -> 8/10 target), followed by security, error handling, and DevOps improvements.

---

## Current Architecture Assessment

### Project Structure Overview

```
mirror-of-dreams/
├── app/                    # Next.js 14 App Router pages
│   ├── api/               # API routes (tRPC, webhooks, auth)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── dreams/            # Dream management
│   ├── reflection/        # Reflection creation flow
│   ├── reflections/       # Reflection history
│   ├── evolution/         # Evolution reports
│   ├── clarify/           # Clarify conversational agent
│   ├── subscription/      # Payment flows
│   ├── admin/             # Admin dashboard
│   └── settings/          # User settings
├── components/            # React components (15 subdirectories)
│   ├── ui/               # Glass design system components
│   ├── dashboard/        # Dashboard cards and widgets
│   ├── reflection/       # Reflection flow components
│   ├── dreams/           # Dream management components
│   └── subscription/     # Payment/subscription components
├── server/
│   ├── trpc/             # tRPC setup
│   │   ├── routers/      # 12 tRPC routers
│   │   ├── middleware.ts # Auth & permission middlewares
│   │   └── context.ts    # Request context
│   └── lib/              # Server utilities
│       ├── paypal.ts     # PayPal client library
│       ├── email.ts      # Email service
│       ├── supabase.ts   # Database client
│       └── prompts.ts    # AI prompt loading
├── lib/
│   ├── utils/            # Utility functions & constants
│   ├── clarify/          # Clarify context builder & consolidation
│   ├── animations/       # Animation configs
│   └── voice/            # Mirror voice system
├── hooks/                # 11 custom React hooks
├── types/                # TypeScript types & Zod schemas
├── contexts/             # React contexts (Toast, Navigation)
└── styles/               # Global CSS
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| API | tRPC v11 + TanStack Query v5 |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (bcryptjs + jsonwebtoken) |
| AI | Anthropic Claude API (Sonnet 4.5) |
| Payments | PayPal REST API |
| Styling | Tailwind CSS + Framer Motion |
| Validation | Zod |

### tRPC Routers Identified (12 total)

| Router | Procedures | Complexity | Priority for Testing |
|--------|------------|------------|----------------------|
| `auth` | 8 (signup, signin, verifyToken, signout, me, updateProfile, changePassword, deleteAccount, loginDemo) | HIGH | CRITICAL |
| `dreams` | 7 (create, list, get, update, updateStatus, delete, getLimits) | MEDIUM | HIGH |
| `reflections` | 6 (list, getById, update, delete, submitFeedback, checkUsage) | MEDIUM | HIGH |
| `reflection` | 1 (create - AI generation) | HIGH | CRITICAL |
| `subscriptions` | 5 (getStatus, createCheckout, getPlanId, activateSubscription, cancel) | HIGH | CRITICAL |
| `evolution` | 5 (generateDreamEvolution, generateCrossDreamEvolution, list, get, checkEligibility) | HIGH | HIGH |
| `clarify` | 10 (createSession, getSession, listSessions, sendMessage, archiveSession, restoreSession, updateTitle, deleteSession, getLimits, getPatterns) | HIGH | HIGH |
| `admin` | 7 (authenticate, checkAuth, getAllUsers, getAllReflections, getStats, getUserByEmail, updateUserTier, getWebhookEvents, getFeedback, getApiUsageStats) | MEDIUM | MEDIUM |
| `users` | 3 (getProfile, updatePreferences, changeEmail) | LOW | MEDIUM |
| `visualizations` | Unknown | LOW | LOW |
| `artifact` | Unknown | LOW | LOW |
| `lifecycle` | Unknown | LOW | LOW |

### Middleware Stack Analysis

```
middleware.ts - 8 middleware functions:
├── isAuthed           - Basic auth check
├── isCreatorOrAdmin   - Admin access check
├── isPremium          - Tier validation
├── checkUsageLimit    - Daily/monthly limits
├── notDemo            - Blocks demo user writes
├── checkClarifyAccess - Clarify tier check
└── checkClarifySessionLimit - Session limit check

Procedure Chains:
├── protectedProcedure = publicProcedure.use(isAuthed)
├── creatorProcedure = publicProcedure.use(isCreatorOrAdmin)
├── premiumProcedure = publicProcedure.use(isAuthed).use(isPremium)
├── usageLimitedProcedure = publicProcedure.use(isAuthed).use(notDemo).use(checkUsageLimit)
├── writeProcedure = publicProcedure.use(isAuthed).use(notDemo)
├── clarifyReadProcedure = publicProcedure.use(isAuthed).use(checkClarifyAccess)
├── clarifyProcedure = publicProcedure.use(isAuthed).use(notDemo).use(checkClarifyAccess)
└── clarifySessionLimitedProcedure = clarifyProcedure.use(checkClarifySessionLimit)
```

---

## Business Logic Analysis (Critical Test Targets)

### 1. Core Business Logic Functions

| File | Function | Description | Test Priority |
|------|----------|-------------|---------------|
| `/lib/utils/limits.ts` | `checkReflectionLimits()` | Daily/monthly usage enforcement | CRITICAL |
| `/lib/utils/constants.ts` | `TIER_LIMITS`, `DAILY_LIMITS` | Tier configuration | CRITICAL |
| `/server/lib/cost-calculator.ts` | `calculateCost()`, `getThinkingBudget()` | AI cost calculation | HIGH |
| `/server/lib/temporal-distribution.ts` | `selectTemporalContext()`, `meetsEvolutionThreshold()` | Evolution report selection | HIGH |
| `/lib/clarify/consolidation.ts` | `extractPatternsFromSession()`, `consolidateUserPatterns()` | Pattern extraction | HIGH |
| `/lib/clarify/context-builder.ts` | `buildClarifyContext()`, `estimateTokens()` | Context building | MEDIUM |
| `/server/lib/paypal.ts` | `createSubscription()`, `cancelSubscription()`, `verifyWebhookSignature()` | Payment flows | CRITICAL |
| `/server/trpc/middleware.ts` | All middleware functions | Auth & permissions | CRITICAL |
| `/types/schemas.ts` | All Zod schemas | Input validation | HIGH |

### 2. Top 10 Critical Business Logic Functions Needing Tests

1. **`checkReflectionLimits(user)` in `/lib/utils/limits.ts`**
   - Validates daily and monthly reflection limits per tier
   - Business-critical: prevents over-usage and tier enforcement

2. **`checkUsageLimit` middleware in `/server/trpc/middleware.ts`**
   - Enforces usage limits at API level
   - Guards all reflection creation

3. **`calculateCost()` in `/server/lib/cost-calculator.ts`**
   - Calculates Claude API costs
   - Financial tracking accuracy

4. **`selectTemporalContext()` in `/server/lib/temporal-distribution.ts`**
   - Selects reflections for evolution reports
   - Algorithm correctness critical for report quality

5. **`verifyWebhookSignature()` in `/server/lib/paypal.ts`**
   - Validates PayPal webhook authenticity
   - Security-critical for payment handling

6. **`determineTierFromPlanId()` / `determinePeriodFromPlanId()` in `/server/lib/paypal.ts`**
   - Maps PayPal plans to tiers
   - Subscription accuracy

7. **`extractPatternsFromSession()` in `/lib/clarify/consolidation.ts`**
   - AI pattern extraction logic
   - Core Clarify feature

8. **`buildClarifyContext()` in `/lib/clarify/context-builder.ts`**
   - Builds context for Clarify conversations
   - Respects token budget limits

9. **`checkEvolutionEligibility()` in `/server/trpc/routers/reflection.ts`**
   - Determines evolution report triggers
   - Feature gating logic

10. **`checkDreamLimit()` in `/server/trpc/routers/dreams.ts`**
    - Enforces dream creation limits per tier
    - Tier enforcement

---

## Testing Infrastructure Requirements

### Current State

- **Existing Tests:** 2 test files found
  - `/server/trpc/__tests__/middleware.test.ts` (uses Jest, 86 lines)
  - `/server/lib/__tests__/paypal.test.ts` (uses Vitest, 299 lines)
- **Test Runner:** None configured in package.json (script: `echo 'Tests would go here'`)
- **Test Coverage:** ~0% (2 files testing limited functionality)
- **Framework Inconsistency:** One file uses Jest, one uses Vitest

### Recommended Test Framework Stack

| Type | Recommendation | Rationale |
|------|----------------|-----------|
| Unit Tests | **Vitest** | Faster than Jest, native ESM support, Vite ecosystem compatibility, already used in PayPal tests |
| Component Tests | **Vitest + React Testing Library** | Industry standard, good Next.js integration |
| E2E Tests | **Playwright** | Better Next.js support, more reliable than Cypress, better parallel execution |
| API Tests | **Vitest + SuperTest** | Test tRPC routers directly |
| Coverage | **c8 (via Vitest)** | Native V8 coverage, no instrumentation needed |

### Recommended Configuration

```typescript
// vitest.config.ts (proposed)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'tests'],
    },
    include: ['**/*.test.ts', '**/*.test.tsx'],
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
```

### Test Database Strategy

1. **Approach:** Use Supabase local development mode OR in-memory SQLite for unit tests
2. **Fixtures:** Create test data factories for users, dreams, reflections
3. **Isolation:** Each test suite gets fresh database state
4. **Mocking:** Mock Supabase client for unit tests, use real connection for integration tests

### AI Service Mocking Strategy

```typescript
// Proposed mock structure for Anthropic
const mockAnthropicClient = {
  messages: {
    create: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Mock AI response' }],
      usage: { input_tokens: 100, output_tokens: 200 },
    }),
  },
};

// Mock factory for different scenarios
const createMockResponse = (options: {
  text?: string;
  toolUse?: boolean;
  error?: boolean;
}) => { ... };
```

---

## Critical E2E User Flows (5 Required)

### 1. User Registration & Email Verification Flow
```
Landing -> Signup -> Email Verification Required -> Verify Email -> Dashboard
```
- Tests: Form validation, account creation, email sending, verification token handling

### 2. Complete Reflection Creation Flow
```
Dashboard -> Select Dream -> Answer 4 Questions -> Submit -> Wait for AI -> View Reflection -> Submit Feedback
```
- Tests: Form state persistence, tier limit enforcement, AI generation, database storage

### 3. Subscription Upgrade Flow
```
Pricing Page -> Select Plan -> PayPal Checkout -> Approve -> Success Page -> Dashboard (upgraded tier)
```
- Tests: PayPal integration, webhook processing, tier upgrade, usage limit changes

### 4. Dream Lifecycle Flow
```
Create Dream -> View Dream -> Create Reflections -> Trigger Evolution -> View Report -> Archive Dream
```
- Tests: Dream CRUD, evolution eligibility, report generation

### 5. Admin Dashboard Flow
```
Admin Auth -> View Stats -> View Users -> Update Tier -> View Feedback
```
- Tests: Admin authentication, data queries, tier modification

---

## Complexity Assessment

### Overall Complexity Rating: **COMPLEX**

**Rationale:**
1. **12 tRPC routers** with 50+ procedures requiring integration tests
2. **External service integrations** requiring mocking (Anthropic AI, PayPal, Supabase)
3. **Multi-tier permission system** with 8 middleware functions
4. **Existing test framework inconsistency** (Jest vs Vitest) needs resolution
5. **No test infrastructure** currently in place (needs full setup)
6. **Coverage target is 70%** for business logic (significant work)

### Estimated Effort

| Category | Estimated Hours | Notes |
|----------|-----------------|-------|
| Test infrastructure setup | 4-6 hours | Vitest config, mocks, fixtures |
| Unit tests (business logic) | 8-12 hours | 10 critical functions + utilities |
| Integration tests (tRPC) | 10-14 hours | 12 routers, 50+ procedures |
| E2E tests (Playwright) | 8-10 hours | 5 critical flows |
| CI/CD integration | 2-4 hours | GitHub Actions workflow |
| **Total** | **32-46 hours** | Across multiple iterations |

---

## Iteration Breakdown Recommendation

### Recommendation: **MULTI-ITERATION (3-4 phases)**

### Iteration 1: Testing Foundation (8-10 hours)
**Vision:** Establish testing infrastructure and cover critical business logic

**Scope:**
- Vitest configuration and setup
- Test utilities, mocks, and fixtures
- Unit tests for `/lib/utils/limits.ts`
- Unit tests for `/server/lib/cost-calculator.ts`
- Unit tests for `/server/lib/temporal-distribution.ts`
- Unit tests for Zod schemas
- Migrate existing Jest test to Vitest

**Success Criteria:**
- `npm test` runs successfully
- 100% coverage on tested files
- CI pipeline runs tests on PR

**Risk Level:** LOW

### Iteration 2: Integration Tests (10-14 hours)
**Vision:** Full tRPC router test coverage with database integration

**Scope:**
- Test database setup (Supabase local or mock)
- Auth router integration tests
- Dreams router integration tests
- Reflections router integration tests
- Subscriptions router integration tests
- Middleware chain tests

**Dependencies:**
- Requires Iteration 1 infrastructure
- Requires test database strategy

**Success Criteria:**
- All critical routers have integration tests
- Auth flows fully tested
- Tier enforcement tested

**Risk Level:** MEDIUM

### Iteration 3: E2E & AI Service Tests (8-10 hours)
**Vision:** End-to-end user flow validation and AI service testing

**Scope:**
- Playwright setup and configuration
- 5 critical E2E user flows
- AI service mocking refinement
- Evolution router tests
- Clarify router tests

**Dependencies:**
- Requires Iterations 1-2 complete
- Requires AI mock strategy

**Success Criteria:**
- 5 E2E flows passing
- AI-dependent routes tested
- 70% coverage target approached

**Risk Level:** MEDIUM

### Iteration 4 (Optional): Coverage & Polish
**Vision:** Achieve coverage targets and add edge case tests

**Scope:**
- Coverage gap analysis
- Edge case tests for payment flows
- Error boundary tests
- Admin dashboard tests
- Documentation

**Success Criteria:**
- 70%+ coverage on business logic
- All critical paths covered
- Test documentation complete

---

## Dependency Graph

```
Testing Foundation (Iteration 1)
├── Vitest Configuration
├── Mock Infrastructure
│   ├── Supabase Mock Client
│   ├── Anthropic Mock Client
│   └── PayPal Mock Client
├── Test Fixtures
│   ├── User Factory
│   ├── Dream Factory
│   └── Reflection Factory
└── CI/CD Pipeline Setup
    ↓
Integration Tests (Iteration 2)
├── Auth Router Tests (uses Supabase mock)
├── Dreams Router Tests (uses fixtures)
├── Reflections Router Tests (uses fixtures)
└── Subscriptions Router Tests (uses PayPal mock)
    ↓
E2E & AI Tests (Iteration 3)
├── Playwright Setup
├── E2E User Flows
│   ├── Registration Flow
│   ├── Reflection Flow
│   ├── Subscription Flow
│   ├── Dream Lifecycle
│   └── Admin Flow
└── AI Service Tests
    ├── Reflection Generation
    ├── Evolution Reports
    └── Clarify Conversations
    ↓
Coverage & Polish (Iteration 4 - Optional)
├── Coverage Analysis
├── Edge Cases
└── Documentation
```

---

## Risk Assessment

### Medium Risks

- **Test Database Strategy:** Supabase mocking may be complex
  - **Impact:** Delays integration test phase
  - **Mitigation:** Consider using Supabase local development mode or create thin mock layer

- **AI Service Mocking:** Complex response structures for tool-use flows
  - **Impact:** Incomplete Clarify/Evolution test coverage
  - **Mitigation:** Create comprehensive mock factories with all response types

- **E2E Test Stability:** PayPal sandbox may be flaky
  - **Impact:** Unreliable CI runs
  - **Mitigation:** Mock PayPal in E2E tests or use retry strategies

### Low Risks

- **Framework Migration:** Jest to Vitest migration for existing tests
  - Simple API compatibility, minimal changes needed

- **Coverage Targets:** 70% may be ambitious given timeline
  - Focus on critical paths first, expand in optional iteration

---

## Technology Recommendations

### Test Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-c8": "^2.0.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.45.0",
    "msw": "^2.0.0"  // For API mocking
  }
}
```

### Recommended File Structure

```
tests/
├── setup.ts              # Global test setup
├── mocks/
│   ├── supabase.ts      # Supabase mock client
│   ├── anthropic.ts     # Anthropic mock client
│   └── paypal.ts        # PayPal mock functions
├── fixtures/
│   ├── users.ts         # User test data
│   ├── dreams.ts        # Dream test data
│   └── reflections.ts   # Reflection test data
├── unit/
│   ├── lib/             # /lib unit tests
│   └── utils/           # Utility function tests
├── integration/
│   ├── routers/         # tRPC router tests
│   └── middleware/      # Middleware tests
└── e2e/
    └── flows/           # Playwright E2E tests

# Co-located tests (alternative approach)
server/trpc/routers/__tests__/auth.test.ts
lib/utils/__tests__/limits.test.ts
```

---

## Recommendations for Master Plan

1. **Start with Testing Foundation Iteration**
   - Most testing infrastructure work can happen in parallel with other hardening efforts
   - Once infrastructure is in place, adding tests becomes incremental

2. **Prioritize Business-Critical Tests First**
   - Tier limits, payment flows, and auth are highest priority
   - AI-dependent tests can come later with proper mocking

3. **Consider Vitest over Jest**
   - Already used in one existing test file
   - Better performance and ESM support
   - One test already uses Vitest, establishing pattern

4. **Database Testing Strategy Critical**
   - Decision needed: Supabase local vs mock client
   - Impacts all integration test work
   - Recommend mock client for speed, integration tests with local Supabase

5. **CI/CD Should Include Tests Early**
   - Even with minimal tests, establish the pipeline
   - GitHub Actions workflow in Iteration 1

---

## Notes & Observations

- The codebase is well-structured with clear separation of concerns
- TypeScript usage is strong with Zod schemas providing runtime validation
- The tier system is central to the business logic (free/pro/unlimited)
- AI integrations (Claude) are properly abstracted with lazy initialization
- PayPal test file is a good example of the testing pattern to follow
- Middleware chain is complex but well-organized - needs comprehensive testing
- Demo user concept adds complexity to permission testing

---

*Exploration completed: 2024-12-10*
*This report informs master planning decisions for Plan 19: Technical Hardening*
