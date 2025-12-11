# Project Vision: Code Excellence & Technical Debt Resolution

**Created:** 2025-12-11T01:45:00Z
**Plan:** plan-23

---

## Problem Statement

Comprehensive codebase analysis revealed multiple issues across security, type safety, performance, and code quality. CI is currently failing, blocking deployments.

**Analysis Rating:** 8.2/10 - Production-Ready with Room for Improvement

---

## Issues Breakdown

### CRITICAL (Fix Immediately)

#### 1. CI Pipeline Failing
**Status:** VERIFIED
**Blocking:** All deployments

Two TypeScript errors:
- `test/helpers/trpc.ts` - Mock query results missing `trpc` property (9 errors in VisualizationCard.test.tsx)
- `test/fixtures/evolution.ts:4` - Missing `@/types/supabase` module

#### 2. Security Vulnerabilities in Dependencies
**Status:** VERIFIED via `npm audit`
**Risk:** HIGH

| Package | Version | Severity | Issue |
|---------|---------|----------|-------|
| happy-dom | 15.11.7 | CRITICAL | Remote Code Execution |
| nodemailer | 6.10.1 | MODERATE | Domain spoofing + DoS (2 vulnerabilities) |
| vitest/esbuild | various | MODERATE | 6 vulnerabilities in chain |

**Total:** 9 vulnerabilities (1 critical, 8 moderate)

---

### HIGH Priority

#### 3. Password Policy Inconsistency
**Status:** VERIFIED
**Risk:** MEDIUM (Security)

- **Signup** (`types/schemas.ts:11`): `min(6)` - 6 characters only
- **Password Reset** (`app/api/auth/reset-password/route.ts:28-54`): 8 chars + uppercase + lowercase + number

Users can sign up with weak passwords but can't reset to the same password.

#### 4. Database Query N+1 Problem
**Status:** VERIFIED
**Location:** `server/trpc/routers/dreams.ts:129-140`

Sequential queries that should be parallel:
```typescript
// Current (slow):
const { count } = await supabase...  // Query 1
const { data: lastReflection } = await supabase...  // Query 2
```

---

### MEDIUM Priority

#### 5. Excessive `any` Usage
**Status:** PARTIALLY VERIFIED (count methodology unclear)
**Claimed:** 342 occurrences in 90 files

Worst offenders mentioned:
- `components/dashboard/cards/DreamsCard.tsx:101`
- `server/trpc/trpc.ts:36`

**Action:** Enable stricter TypeScript:
```json
"noUncheckedIndexedAccess": true,
"noImplicitReturns": true
```

#### 6. Large Components Need Splitting
**Status:** VERIFIED (line counts match)

| Component | Lines | Status |
|-----------|-------|--------|
| `app/reflection/MirrorExperience.tsx` | 606 | Too large |
| `app/profile/page.tsx` | 528 | Too large |
| `components/shared/AppNavigation.tsx` | 522 | Too large |
| `components/dashboard/cards/SubscriptionCard.tsx` | 473 | Borderline |

#### 7. Code Duplication
**Status:** NOT VERIFIED (need to check)

Claimed duplications:
- Tone glow colors (ToneSelection.tsx, ToneSelectionCard.tsx)
- Category emoji mappings (DreamsCard.tsx, lib/reflection/constants.ts)
- Loading/Empty states (5+ dashboard cards)

#### 8. React Rendering Optimization
**Status:** PARTIALLY FALSE

Claim: "No React.memo() usage detected"
Reality: Found `memo()` in ReflectionQuestionCard, CharacterCounter, ProgressBar

**Actual issue:** Dashboard cards specifically may lack memoization

#### 9. Missing Code Splitting
**Status:** PARTIALLY FALSE

Claim: "No React.lazy() or next/dynamic usage"
Reality: Found `dynamic()` in MirrorExperience.tsx, dreams/page.tsx, dreams/[id]/page.tsx

**Actual issue:** May need more dynamic imports for heavy routes

#### 10. ESLint Rules Too Lenient
**Status:** NOT VERIFIED

Current (claimed):
```javascript
'@typescript-eslint/no-explicit-any': 'warn',
'no-prototype-builtins': 'warn',
```

---

### LOW Priority (Future)

#### 11. Missing Architecture Documentation
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/API.md

#### 12. Contributing Guidelines Incomplete
- CONTRIBUTING.md
- .github/PULL_REQUEST_TEMPLATE.md
- .github/ISSUE_TEMPLATE/

#### 13. Major Version Updates Available
| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| Next.js | 14.2.33 | 16.0.8 | 2 major |
| React | 18.3.1 | 19.2.1 | 1 major |
| Tailwind | 3.4.1 | 4.1.17 | 1 major |
| Zod | 3.25.76 | 4.1.13 | 1 major |

#### 14. E2E Test Expansion
Current: 6 E2E test files
Target: 15-20 covering more flows

#### 15. HTTP Cache Headers Missing
No Cache-Control or ETag headers on API responses

#### 16. Bundle Size Analysis
Add @next/bundle-analyzer to CI

---

## Prioritized Action Plan

### Iteration 1: Critical Fixes (CI + Security)
**Must complete to unblock deployments**

1. Fix CI TypeScript errors
   - Add `trpc` property to mock query results
   - Create `types/supabase.ts`
2. Update vulnerable dependencies
   - `npm update happy-dom@^20.0.0`
   - `npm update nodemailer@^7.0.11`
   - `npm update vitest @vitest/coverage-v8 @vitest/ui`
3. Align password policies (8 char minimum everywhere)

### Iteration 2: Performance & Type Safety
1. Parallelize database queries (N+1 fix)
2. Reduce `any` usage in critical files
3. Enable stricter TypeScript checks
4. Add React.memo to dashboard cards

### Iteration 3: Code Quality
1. Split large components (MirrorExperience.tsx first)
2. Consolidate duplicated constants
3. Create reusable EmptyState/LoadingState components
4. Tighten ESLint rules

### Iteration 4: Documentation & Polish
1. Create ARCHITECTURE.md
2. Create CONTRIBUTING.md
3. Add PR/Issue templates
4. Expand E2E test coverage

---

## Success Criteria

**Iteration 1 (Critical):**
- [ ] CI passes (green)
- [ ] `npm audit` shows 0 critical, 0 high vulnerabilities
- [ ] Password policies consistent

**Iteration 2 (Performance):**
- [ ] No N+1 queries in dreams router
- [ ] `any` usage reduced by 50%+
- [ ] Dashboard cards memoized

**Iteration 3 (Quality):**
- [ ] No component > 400 lines
- [ ] No duplicated constants
- [ ] ESLint rules at 'error' level

**Iteration 4 (Documentation):**
- [ ] Architecture documented
- [ ] Contributing guide complete
- [ ] 10+ E2E test files

---

## Out of Scope

- Major version upgrades (Next.js 15/16, React 19) - requires separate migration plan
- Bundle analyzer integration - nice-to-have
- HTTP cache headers - requires infrastructure decisions

---

**Vision Status:** VISIONED
**Ready for:** Master Planning
**Estimated Iterations:** 4
**Complexity:** COMPLEX
