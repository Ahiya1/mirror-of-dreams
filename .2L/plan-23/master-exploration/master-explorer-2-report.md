# Master Explorer 2: Dependencies & Risk Assessment

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Risk Assessment

## Vision Summary
Resolve security vulnerabilities in dev dependencies (happy-dom, nodemailer, vitest ecosystem) and fix CI pipeline failures to unblock deployments.

---

## Current Vulnerability State

### npm audit Output (9 vulnerabilities total)

```
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response
https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vitest@4.0.15, which is a breaking change

happy-dom  <20.0.0
Severity: critical
Happy DOM: VM Context Escape can lead to Remote Code Execution
https://github.com/advisories/GHSA-37j7-fg3j-429f
fix available via `npm audit fix --force`
Will install happy-dom@20.0.11, which is a breaking change

nodemailer  <=7.0.10
Severity: moderate (2 vulnerabilities)
1. Email to an unintended domain can occur due to Interpretation Conflict
   https://github.com/advisories/GHSA-mm7p-fcc7-pg87
2. addressparser is vulnerable to DoS caused by recursive calls
   https://github.com/advisories/GHSA-rcmh-qjqh-p98v
fix available via `npm audit fix --force`
Will install nodemailer@7.0.11, which is a breaking change

vitest ecosystem (6 vulnerabilities via esbuild -> vite chain):
- @vitest/coverage-v8
- @vitest/mocker
- @vitest/ui
- vite
- vite-node
All via vulnerable esbuild <=0.24.2

9 vulnerabilities (8 moderate, 1 critical)
```

---

## Dependency Analysis

### happy-dom (CRITICAL - Priority 1)

| Attribute | Value |
|-----------|-------|
| **Current Version** | 15.11.7 |
| **Target Version** | 20.0.11 |
| **Severity** | CRITICAL (RCE) |
| **CVE/Advisory** | GHSA-37j7-fg3j-429f |
| **CWE** | CWE-94 (Code Injection) |

#### Vulnerability Details
VM Context Escape vulnerability allows remote code execution. An attacker can escape the VM sandbox and execute arbitrary code on the host system. This is a **dev-only dependency** used for test environment DOM simulation.

#### Breaking Changes (15.x -> 20.x)
- Major version jump (5 major versions)
- Potential API changes in Window/Document simulation
- Changes to how global objects are registered
- Possible changes in event handling behavior

#### Usage in Codebase
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`
- **Configuration:** `environment: 'happy-dom'`
- **Impact:** 75 test files rely on happy-dom environment

#### Migration Effort
- **Estimate:** 2-4 hours
- **Risk:** MEDIUM
- Tests may need adjustment if happy-dom API changed
- Need to verify all component tests still pass

#### Recommendation
**UPDATE IMMEDIATELY** - This is an RCE vulnerability. Even though it's dev-only, it poses risk during:
- Local development
- CI/CD pipeline execution
- Any environment running tests

---

### nodemailer (MODERATE - Priority 2)

| Attribute | Value |
|-----------|-------|
| **Current Version** | 6.10.1 |
| **Target Version** | 7.0.11 |
| **Severity** | MODERATE |
| **Advisories** | GHSA-mm7p-fcc7-pg87, GHSA-rcmh-qjqh-p98v |
| **CWE** | CWE-20, CWE-436, CWE-703 |

#### Vulnerability Details
1. **Domain Spoofing (GHSA-mm7p-fcc7-pg87):** Email to unintended domain due to interpretation conflict in address parsing
2. **DoS (GHSA-rcmh-qjqh-p98v):** addressparser vulnerable to DoS via recursive calls

#### Breaking Changes (6.x -> 7.x)
- Major version update
- Potential changes to transport configuration
- Changes to address parsing behavior (intentional security fix)
- ESM/CommonJS module handling changes

#### Usage in Codebase
- **File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/lib/email.ts`
- **Functions:** `sendPasswordResetEmail`, `sendVerificationEmail`
- **Transport:** Gmail SMTP via `nodemailer.createTransport()`
- **Impact:** Production email functionality (password reset, verification)

#### Migration Effort
- **Estimate:** 1-2 hours
- **Risk:** LOW-MEDIUM
- Current usage is standard Gmail transport
- No complex address parsing used (direct email addresses)

#### Code Analysis
```typescript
// Current usage pattern (server/lib/email.ts)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Email sending (standard pattern)
await transporter.sendMail({
  from: `"Mirror of Dreams" <${process.env.GMAIL_USER}>`,
  to: email,  // Direct email, no complex parsing
  subject: template.subject,
  text: template.text,
  html: template.html,
});
```

#### Recommendation
**UPDATE WITH TESTING** - Production dependency, requires email sending verification after update.

---

### vitest Ecosystem (MODERATE - Priority 3)

| Attribute | Value |
|-----------|-------|
| **Current Versions** | vitest@2.1.9, @vitest/coverage-v8@2.1.9, @vitest/ui@2.1.9 |
| **Target Versions** | vitest@4.0.15, @vitest/coverage-v8@4.0.15, @vitest/ui@4.0.15 |
| **Severity** | MODERATE (via esbuild) |
| **Advisory** | GHSA-67mh-4wv8-2f99 (esbuild) |
| **CWE** | CWE-346 (Origin Validation Error) |

#### Vulnerability Details
esbuild <=0.24.2 allows any website to send requests to the development server and read responses. This affects the entire vitest chain via vite dependency.

#### Breaking Changes (2.x -> 4.x)
- **2 major version jump** (2.x -> 3.x -> 4.x)
- Configuration file format changes possible
- Reporter API changes
- Coverage provider changes
- Mock API changes (`vi.fn()`, `vi.mock()`, `vi.mocked()`)
- TypeScript type definitions changes

#### Peer Dependencies (vitest@4.0.15)
```json
{
  "@edge-runtime/vm": "*",
  "@opentelemetry/api": "^1.9.0",
  "@types/node": "^20.0.0 || ^22.0.0 || >=24.0.0",
  "happy-dom": "*",
  "jsdom": "*",
  "@vitest/browser-playwright": "4.0.15",
  "@vitest/browser-preview": "4.0.15",
  "@vitest/ui": "4.0.15",
  "@vitest/browser-webdriverio": "4.0.15"
}
```

#### Usage in Codebase
- **Config:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.config.ts`
- **Setup:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/vitest.setup.ts`
- **Test Files:** 75 test files
- **Mock Usage:** 1,466 occurrences of `vi.fn/mock/spyOn/mocked` across 51 files

#### Configuration Analysis
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

#### Migration Effort
- **Estimate:** 4-8 hours
- **Risk:** MEDIUM-HIGH
- Need to verify all mock patterns still work
- Coverage configuration may need adjustment
- May require vitest.config.ts changes

#### Recommendation
**UPDATE WITH HAPPY-DOM** - Both require major version updates and are tightly coupled in test infrastructure.

---

## Test Infrastructure Impact

### Current Test Suite Statistics
- **Total Test Files:** 75
- **Mock Usages:** 1,466 across 51 files
- **Coverage Thresholds:** 80% (statements, branches, functions, lines)

### Files Most Likely Affected by Updates

| File | Mock Count | Risk |
|------|------------|------|
| `test/integration/lifecycle/lifecycle.test.ts` | 240 | HIGH |
| `lib/clarify/__tests__/context-builder.test.ts` | 195 | HIGH |
| `test/integration/dreams/crud.test.ts` | 102 | HIGH |
| `test/integration/journeys/user-journey.test.ts` | 100 | HIGH |
| `components/dashboard/cards/__tests__/EvolutionCard.test.tsx` | 65 | MEDIUM |
| `test/integration/auth/password-reset.test.ts` | 60 | MEDIUM |
| `test/integration/auth/signup.test.ts` | 58 | MEDIUM |

### DOM-Related Test Files (happy-dom impact)
All component test files (`*.test.tsx`) rely on happy-dom for DOM simulation:
- 34 component test files in `components/**/__tests__/`
- Use `@testing-library/react` render functions
- Mock framer-motion, next/navigation, and UI components

### Potential Breaking Test Patterns

1. **vi.mocked() usage** - May have API changes in vitest 4.x
2. **mockReturnValue() patterns** - Used extensively in tRPC mocks
3. **DOM queries** - happy-dom changes may affect selectors
4. **Coverage provider** - v8 provider configuration may change

---

## CI/CD Impact

### Current CI Pipeline (`.github/workflows/ci.yml`)

```yaml
jobs:
  quality:      # TypeScript + ESLint + Prettier
  test:         # vitest with coverage (depends on quality)
  e2e:          # Playwright tests (depends on quality + test)
  build:        # Next.js build (depends on all above)
```

### Impact Assessment

| CI Step | Risk Level | Reason |
|---------|------------|--------|
| quality | NONE | Not affected by dependency updates |
| test | HIGH | vitest + happy-dom updates directly affect |
| e2e | LOW | Playwright independent of vitest ecosystem |
| build | NONE | Not affected by dev dependency updates |

### CI Failure Points

1. **npm ci** - Will install updated packages if package.json changed
2. **npm run test:coverage** - Tests may fail due to vitest/happy-dom changes
3. **Coverage thresholds** - May fail if tests need adjustment

### Recommended CI Strategy

1. Create PR with dependency updates
2. Run CI to identify breaking tests
3. Fix broken tests before merging
4. Verify coverage thresholds still met

---

## Recommended Update Strategy

### Phase 1: Critical Security Fix (Immediate)

**Order:** happy-dom first (CRITICAL RCE)

```bash
# Step 1: Update happy-dom
npm install -D happy-dom@^20.0.11

# Step 2: Run tests locally to identify failures
npm run test:run

# Step 3: Fix any test failures
# Focus on component tests that rely on DOM simulation
```

### Phase 2: Email Security Fix (Same PR if possible)

```bash
# Step 1: Update nodemailer
npm install nodemailer@^7.0.11

# Step 2: Test email functionality locally
# Verify password reset and verification emails work

# Step 3: Update types if needed
npm install -D @types/nodemailer@latest
```

### Phase 3: vitest Ecosystem Update (Same PR if possible)

```bash
# Step 1: Update all vitest packages together
npm install -D vitest@^4.0.15 @vitest/coverage-v8@^4.0.15 @vitest/ui@^4.0.15

# Step 2: Review vitest.config.ts for deprecations
# Step 3: Run full test suite
npm run test:run

# Step 4: Verify coverage still meets thresholds
npm run test:coverage
```

### Single Command (All at Once)

```bash
npm install -D happy-dom@^20.0.11 vitest@^4.0.15 @vitest/coverage-v8@^4.0.15 @vitest/ui@^4.0.15 && npm install nodemailer@^7.0.11
```

### Testing Verification Checklist

- [ ] All 75 test files pass
- [ ] Coverage >= 80% (statements, branches, functions, lines)
- [ ] E2E tests still pass (Playwright)
- [ ] TypeScript compilation succeeds
- [ ] Email sending works in staging environment

---

## Rollback Plan

### If Updates Cause Issues

#### Immediate Rollback (git)
```bash
# Revert package.json and package-lock.json
git checkout HEAD -- package.json package-lock.json
npm ci
```

#### Partial Rollback (specific package)
```bash
# Rollback happy-dom only
npm install -D happy-dom@15.11.7

# Rollback vitest ecosystem only
npm install -D vitest@2.1.9 @vitest/coverage-v8@2.1.9 @vitest/ui@2.1.9

# Rollback nodemailer only
npm install nodemailer@6.10.1
```

### Acceptance of Vulnerabilities (if rollback needed)

If updates cannot be applied immediately:

1. **happy-dom (CRITICAL):** Accept risk in dev environment only, ensure production never runs tests
2. **nodemailer (MODERATE):** Input validation on email addresses mitigates risk
3. **vitest ecosystem (MODERATE):** Dev server vulnerability, acceptable in CI-only context

### Monitoring After Update

1. **Test Pass Rate:** Monitor CI for test failures
2. **Coverage Metrics:** Ensure thresholds maintained
3. **Email Delivery:** Monitor SendGrid/Gmail logs for delivery issues
4. **Build Times:** vitest 4.x may have performance changes

---

## Risk Assessment Summary

### High Risks

1. **Test Suite Breakage**
   - **Impact:** CI blocked, development velocity reduced
   - **Mitigation:** Run tests locally before PR, fix incrementally
   - **Recommendation:** Address in dedicated iteration with buffer time

2. **Coverage Threshold Failure**
   - **Impact:** CI blocked
   - **Mitigation:** Temporarily lower thresholds if needed, then restore
   - **Recommendation:** Document any temporary threshold changes

### Medium Risks

1. **Email Functionality Regression**
   - **Impact:** Password reset/verification broken
   - **Mitigation:** Test in staging before production
   - **Recommendation:** Have rollback ready

2. **vitest Configuration Changes**
   - **Impact:** Need to update vitest.config.ts
   - **Mitigation:** Review vitest 4.x migration guide
   - **Recommendation:** Check for deprecated options

### Low Risks

1. **Type Definition Changes**
   - **Impact:** TypeScript errors
   - **Mitigation:** Update @types packages
   - **Recommendation:** Fix type errors as they appear

---

## Dependency Graph

```
Security Vulnerability Chain
============================

happy-dom@15.11.7 ----[CRITICAL RCE]----> happy-dom@20.0.11
    |
    v
vitest@2.1.9 (uses happy-dom as test environment)
    |
    +---> vite@5.x ---> esbuild@0.21.5 ----[MODERATE]----> esbuild@0.25.x (via vitest@4.0.15)
    |
    +---> @vitest/mocker
    +---> @vitest/coverage-v8
    +---> @vitest/ui
    |
    All resolve via vitest@4.0.15

nodemailer@6.10.1 ----[MODERATE x2]----> nodemailer@7.0.11
    |
    v
server/lib/email.ts (sendPasswordResetEmail, sendVerificationEmail)
```

---

## Recommendations for Master Plan

1. **Treat as Single Iteration**
   - All dependency updates should be done together
   - They affect the same test infrastructure
   - Easier to verify in one PR

2. **Allocate Buffer Time**
   - Estimate: 4-8 hours for updates
   - Buffer: +2-4 hours for unexpected test fixes
   - Total: 6-12 hours

3. **Test Locally First**
   - Do not rely solely on CI for verification
   - Run full test suite locally before pushing

4. **Consider Feature Freeze**
   - During dependency update, avoid other changes
   - Reduces variables when debugging failures

5. **Document Changes**
   - Update any test documentation if patterns change
   - Note version requirements in README if needed

---

## Technology Recommendations

### Existing Codebase Findings

- **Stack detected:** Next.js 14, React 18, TypeScript 5, vitest 2, happy-dom 15, nodemailer 6
- **Patterns observed:**
  - Extensive mock patterns via `vi.mocked()`
  - tRPC mock helpers in `test/helpers/trpc.ts`
  - Component testing with `@testing-library/react`
- **Constraints:** 80% coverage thresholds, CI pipeline dependencies

### Upgrade Compatibility

| Package | Compatible with Current Stack |
|---------|------------------------------|
| happy-dom@20 | Yes (peer dep satisfied) |
| nodemailer@7 | Yes (no peer deps) |
| vitest@4 | Yes (requires Node 20.x - satisfied) |

---

## Notes & Observations

1. **CI is currently failing** due to TypeScript errors unrelated to dependencies (missing `trpc` property, missing `@/types/supabase` module). These should be fixed before or alongside dependency updates.

2. **The happy-dom RCE is critical** but only affects development/CI environments. Production never runs tests, so runtime exposure is limited.

3. **nodemailer usage is minimal** - only 2 email functions with standard patterns. Low risk of breaking changes.

4. **vitest 4.x is a major release** with potential config changes. Review migration guide: https://vitest.dev/guide/migration.html

5. **Package versions in package.json use caret (^)** which should allow minor updates within the specified range, but major versions require explicit updates.

---

*Exploration completed: 2025-12-11*
*This report informs master planning decisions*
