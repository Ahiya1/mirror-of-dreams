# Master Explorer 1: Architecture & Complexity Analysis

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary
Resolve technical debt and code quality issues across the codebase, starting with critical CI failures and security vulnerabilities, then addressing performance, type safety, and code quality improvements.

---

## Codebase Architecture Assessment

### Technology Stack
- **Framework:** Next.js 14.2.x (React 18.3.x)
- **Language:** TypeScript with strict mode
- **API Layer:** tRPC with React Query integration
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 3.4.x
- **Testing:** Vitest + Playwright (E2E)
- **CI/CD:** Inferred from npm scripts and husky pre-commit hooks

### Project Structure
```
/
├── app/                  # Next.js App Router pages
├── components/           # React components (dashboard, reflection, shared, ui)
├── lib/                  # Utilities and business logic
├── server/               # Backend (tRPC routers, lib)
├── test/                 # Unit test helpers and fixtures
├── types/                # TypeScript type definitions
└── e2e/                  # Playwright E2E tests
```

### Current State
- **Test Coverage:** Existing unit tests with vitest, 6 E2E test files
- **Type Safety:** Strict TypeScript with some `any` usage (118 occurrences in 34 files)
- **CI Status:** FAILING - 158 TypeScript errors in test files
- **Security:** 9 npm vulnerabilities (1 critical, 8 moderate)

---

## Complexity Analysis by Issue

### CRITICAL Issues

#### 1. CI Pipeline Failing (TypeScript Errors)
**Complexity: MEDIUM**
**Files Affected:** 5 test files
**Errors: 158 total**

**Root Cause Analysis:**
The CI is failing due to test file TypeScript errors, NOT production code issues. The errors are concentrated in:

| File | Error Type |
|------|------------|
| `components/dashboard/cards/__tests__/DreamsCard.test.tsx` | Missing `trpc` property |
| `components/dashboard/cards/__tests__/EvolutionCard.test.tsx` | Missing `trpc` property |
| `components/dashboard/cards/__tests__/ReflectionsCard.test.tsx` | Missing `trpc` property |
| `components/dashboard/cards/__tests__/VisualizationCard.test.tsx` | Missing `trpc` property |
| `components/dashboard/__tests__/DashboardHero.test.tsx` | Missing `trpc` property + `UseAuthReturn` issues |

**Technical Detail:**
The `test/helpers/trpc.ts` mock utilities create query results missing the `trpc` property required by tRPC v11's `UseTRPCQueryResult` type. The mock types (`QuerySuccessResult`, `QueryLoadingResult`, `QueryErrorResult`) need to extend with:
```typescript
trpc: {
  path: string;
}
```

**Additional Issue:** `test/fixtures/evolution.ts:4` imports `@/types/supabase` which does not exist. A `types/supabase.ts` file with Supabase Database type definitions needs to be created.

**Impact:** BLOCKING all deployments
**Risk Level:** LOW (well-understood fix)
**Estimated Fix Time:** 2-3 hours

---

#### 2. Security Vulnerabilities
**Complexity: LOW**
**Verified via `npm audit`**

| Package | Current | Target | Severity | Issue |
|---------|---------|--------|----------|-------|
| happy-dom | 15.11.0 | 20.0.0+ | CRITICAL | Remote Code Execution |
| nodemailer | 6.10.1 | 7.0.11 | MODERATE | Domain spoofing + DoS |
| vitest/esbuild chain | 2.1.0 | 4.0.15 | MODERATE | 6 vulnerabilities |

**Note:** Vision mentions `happy-dom@^20.0.0` but latest is `20.0.11`. All updates are marked as "breaking changes" by npm.

**Impact:** Security risk, especially critical happy-dom RCE
**Risk Level:** MEDIUM (breaking changes may require test adjustments)
**Estimated Fix Time:** 1-2 hours (update + verify tests pass)

---

### HIGH Priority Issues

#### 3. Password Policy Inconsistency
**Complexity: LOW**
**Verified: YES**

**Current State:**
- `types/schemas.ts:11` - Signup: `min(6)` characters
- `app/api/auth/reset-password/route.ts:28-54` - Reset: 8 chars + uppercase + lowercase + number

**Files to Modify:**
1. `types/schemas.ts` - Update `signupSchema` and `changePasswordSchema`
2. Potentially add shared password validation utility

**Impact:** Users can create weak passwords but cannot reset to them
**Risk Level:** LOW
**Estimated Fix Time:** 1 hour

---

#### 4. Database Query N+1 Problem
**Complexity: LOW**
**Location:** `server/trpc/routers/dreams.ts:112-148`

**Current Code (in `getDreamWithStats` helper):**
```typescript
// Query 1: Get dream
const { data: dream } = await supabase.from('dreams')...

// Query 2: Get reflection count (sequential)
const { count: reflectionCount } = await supabase.from('reflections')...

// Query 3: Get last reflection (sequential)
const { data: lastReflection } = await supabase.from('reflections')...
```

**Note:** The `list` procedure (lines 214-290) already uses an optimized batch query pattern! The N+1 issue is only in the `get` single-dream procedure.

**Fix:** Use `Promise.all` for parallel queries or combine into single query with subselect.

**Impact:** Slower single-dream fetches
**Risk Level:** LOW
**Estimated Fix Time:** 30 minutes

---

### MEDIUM Priority Issues

#### 5. Excessive `any` Usage
**Complexity: MEDIUM**
**Verified Count:** 118 occurrences in 34 files (not 342 as claimed)

**Distribution:**
- Test files: ~70 occurrences (acceptable, already excluded from ESLint)
- Production files: ~48 occurrences

**Key Production Files:**
- `server/trpc/routers/dreams.ts:364` - `updateData: any`
- `components/dashboard/cards/DreamsCard.tsx` - 1 occurrence
- `components/dashboard/shared/ReflectionItem.tsx` - 2 occurrences
- `app/settings/page.tsx` - 4 occurrences
- `app/dreams/[id]/page.tsx` - 2 occurrences

**Note:** ESLint is already configured with `'@typescript-eslint/no-explicit-any': 'warn'`

**Impact:** Type safety gaps
**Risk Level:** LOW-MEDIUM
**Estimated Fix Time:** 3-4 hours for critical files

---

#### 6. Large Components
**Complexity: MEDIUM-HIGH**
**Verified Line Counts:**

| Component | Lines | Action |
|-----------|-------|--------|
| `app/reflection/MirrorExperience.tsx` | 606 | Split into sub-components |
| `app/profile/page.tsx` | 528 | Extract sections |
| `components/shared/AppNavigation.tsx` | 522 | Extract menu items |
| `components/dashboard/cards/SubscriptionCard.tsx` | 473 | Borderline - consider splitting |

**Impact:** Maintainability, testing difficulty
**Risk Level:** MEDIUM (requires careful extraction)
**Estimated Fix Time:** 4-6 hours

---

#### 7. Code Duplication
**Complexity: LOW-MEDIUM**
**Status:** Claimed but needs verification

**Potential Duplications:**
- Tone glow colors
- Category emoji mappings
- Loading/Empty state patterns

**Impact:** Maintenance burden
**Risk Level:** LOW
**Estimated Fix Time:** 2-3 hours

---

#### 8-9. React Optimization & Code Splitting
**Complexity: LOW**
**Status:** PARTIALLY FALSE as per vision

**Reality:**
- `memo()` IS used in several components
- `dynamic()` IS used in MirrorExperience.tsx, dreams pages

**Remaining Work:**
- Dashboard cards may benefit from memoization
- Heavy routes could use more dynamic imports

**Impact:** Minor performance improvements
**Risk Level:** LOW
**Estimated Fix Time:** 1-2 hours

---

#### 10. ESLint Rules
**Complexity: LOW**
**Current Config:** `eslint.config.mjs` (modern flat config)

**Current Rules:**
```javascript
'@typescript-eslint/no-explicit-any': 'warn',
'no-prototype-builtins': 'warn',
'no-console': ['warn', { allow: ['warn', 'error'] }],
```

**Impact:** Code quality enforcement
**Risk Level:** LOW
**Estimated Fix Time:** 30 minutes (changing warn to error)

---

### LOW Priority Issues (Iteration 4 - Documentation)

| Issue | Complexity | Time |
|-------|------------|------|
| Missing ARCHITECTURE.md | LOW | 2 hours |
| Missing CONTRIBUTING.md | LOW | 1 hour |
| PR/Issue templates | LOW | 30 minutes |
| E2E test expansion | MEDIUM | 4-6 hours |

---

## Interdependencies

```
CI Fix (Critical)
├── trpc.ts mock update (must complete first)
└── types/supabase.ts creation (must complete first)
    │
Security Updates
├── Independent of CI fix
└── May require test adjustments after happy-dom update
    │
Password Policy
├── Independent
└── No blockers
    │
N+1 Query Fix
├── Independent
└── No blockers
    │
Type Safety (`any` reduction)
├── Can start after CI fix
└── Should complete before ESLint tightening
    │
Component Splitting
├── Independent
└── No blockers (but benefits from CI being green)
    │
ESLint Tightening
├── Depends on `any` reduction
└── Should be last in Iteration 2
```

---

## Recommended Iteration Breakdown

### Recommendation: MULTI-ITERATION (3 iterations)

The vision document suggests 4 iterations, but I recommend consolidating to 3 for efficiency:

---

### Iteration 1: Critical Fixes (BLOCKING)
**Vision:** Unblock CI/CD pipeline and fix security vulnerabilities
**Estimated Duration:** 4-5 hours
**Risk Level:** LOW-MEDIUM

**Scope:**
1. **Fix CI TypeScript Errors**
   - Update `test/helpers/trpc.ts` to add `trpc` property to mock result types
   - Create `types/supabase.ts` with Database type definitions
   - Verify all 158 errors resolve

2. **Update Vulnerable Dependencies**
   - `npm update happy-dom` to 20.0.11
   - `npm update nodemailer` to 7.0.11
   - `npm update vitest @vitest/coverage-v8 @vitest/ui` to latest 4.x
   - Run tests to verify no regressions

3. **Align Password Policies**
   - Update `types/schemas.ts` signupSchema to match reset-password requirements
   - Update `changePasswordSchema` if needed
   - Consider creating shared `passwordSchema` constant

**Success Criteria:**
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run test:run` passes
- [ ] `npm audit` shows 0 critical, 0 high vulnerabilities
- [ ] Password validation consistent across signup/reset

**Why First:** CI must be green before any other work can be merged safely.

---

### Iteration 2: Performance & Type Safety
**Vision:** Improve code quality and performance
**Estimated Duration:** 5-6 hours
**Risk Level:** LOW

**Scope:**
1. **Fix N+1 Query**
   - Parallelize queries in `getDreamWithStats` function
   - Already has batch pattern to follow from `list` procedure

2. **Reduce Critical `any` Usage**
   - Focus on server code first (`dreams.ts:364`)
   - Then dashboard components
   - Target: 50% reduction in production files

3. **Enable Stricter TypeScript (Optional)**
   - Evaluate enabling `noUncheckedIndexedAccess`
   - Evaluate enabling `noImplicitReturns`
   - Note: tsconfig.json shows these are commented out with "40+ fixes needed"

4. **Dashboard Card Memoization**
   - Add `React.memo` to dashboard cards lacking it
   - Add `useMemo`/`useCallback` where beneficial

**Success Criteria:**
- [ ] Single dream fetch time improved (no sequential queries)
- [ ] `any` count reduced to <25 in production files
- [ ] Dashboard rendering optimized

---

### Iteration 3: Code Quality & Documentation
**Vision:** Improve maintainability and documentation
**Estimated Duration:** 6-8 hours
**Risk Level:** MEDIUM

**Scope:**
1. **Split Large Components**
   - MirrorExperience.tsx (606 lines) - highest priority
   - profile/page.tsx (528 lines)
   - AppNavigation.tsx (522 lines)
   - Target: No component > 400 lines

2. **Consolidate Duplicated Code**
   - Create shared constants for tone colors, emoji mappings
   - Create reusable EmptyState/LoadingState components

3. **Tighten ESLint Rules**
   - Change `warn` to `error` for key rules
   - Only after `any` reduction is complete

4. **Documentation**
   - ARCHITECTURE.md
   - CONTRIBUTING.md (can be brief)
   - PR template

**Success Criteria:**
- [ ] No component > 400 lines
- [ ] Shared constants consolidated
- [ ] ESLint rules at error level
- [ ] Basic documentation exists

---

## Risk Assessment

### High Risks
**None identified** - All changes are well-understood refactoring tasks.

### Medium Risks

1. **Vitest 4.x Breaking Changes**
   - **Impact:** Tests may fail after upgrade
   - **Mitigation:** Run full test suite after upgrade, fix any API changes
   - **Recommendation:** Do this in Iteration 1 when CI is already broken

2. **Component Splitting Scope Creep**
   - **Impact:** Splitting may reveal other issues
   - **Mitigation:** Set strict time limits, focus on extraction not rewrite
   - **Recommendation:** Start with most critical component (MirrorExperience)

### Low Risks

1. **Password Policy Change Impact**
   - **Impact:** Existing users with weak passwords unaffected (only new signups)
   - **Mitigation:** Consider migration email if needed (out of scope)

2. **ESLint Rule Tightening**
   - **Impact:** May surface warnings that need fixing
   - **Mitigation:** Only tighten after `any` reduction

---

## Integration Considerations

### Test Impact
- CI fix directly modifies test infrastructure
- Security updates may require test adjustments
- Component splitting needs test file updates

### CI/CD Needs
- Iteration 1 must complete before any merges
- Consider branch protection rules requiring CI pass

### Security Considerations
- Critical RCE vulnerability in happy-dom must be addressed immediately
- Password policy improvement enhances security posture
- Consider npm audit in CI pipeline if not already present

---

## Technology Recommendations

### Existing Codebase Findings
- **Stack:** Well-organized Next.js + tRPC setup
- **Patterns:** Good separation of concerns, router-based API
- **Opportunities:** Test infrastructure needs strengthening
- **Constraints:** Must maintain backward compatibility

### Specific Recommendations

1. **For `types/supabase.ts`:**
   - Generate from Supabase CLI: `supabase gen types typescript`
   - Or create minimal type covering `evolution_reports` table

2. **For Password Validation:**
   ```typescript
   // Shared schema
   export const passwordSchema = z.string()
     .min(8, 'Password must be at least 8 characters')
     .regex(/[A-Z]/, 'Must contain uppercase')
     .regex(/[a-z]/, 'Must contain lowercase')
     .regex(/[0-9]/, 'Must contain number');
   ```

3. **For Mock Query Results:**
   Add to all mock result types:
   ```typescript
   trpc: {
     path: string;
   }
   ```

---

## Notes & Observations

1. **Vision Accuracy:** Some claims in vision were inaccurate:
   - `any` count claimed as 342, actual is 118
   - React.memo/dynamic usage exists contrary to claims
   - Evolution.ts error was not found in current typecheck (may have been fixed)

2. **Test Infrastructure:** The test helpers are well-documented but missing tRPC v11 compatibility

3. **TypeScript Config:** Already has strict mode, commented-out stricter options indicate known debt

4. **N+1 Query:** Only affects single-dream fetch; list operation already optimized

5. **Production vs Test:** Most TypeScript errors are in test files, production code is relatively clean

---

*Exploration completed: 2025-12-11*
*This report informs master planning decisions*
