# Master Explorer 1: Codebase Health Analysis

**Project:** Mirror of Dreams  
**Date:** December 9, 2025  
**Focus:** Codebase Health & Technical Debt Analysis for Iteration 1 (Codebase Purification)

---

## Executive Summary

The Mirror of Dreams codebase reveals significant technical debt from an incomplete migration from Vite/React to Next.js 14. Key findings:

- **75 legacy JavaScript/JSX files** in `/src/` directory that are completely unused by the Next.js app
- **190 TypeScript files** in the active Next.js codebase with 48+ `any` type usages
- **Multiple duplicate implementations** of core components (ToneSelection, QuestionStep, DreamCard)
- **Console.log statements** throughout production code (130+ instances)
- **Deprecated infrastructure files** (backend-server.js, dev-proxy.js, vite.config.js)
- **Security vulnerabilities** in dependencies (5 moderate-high severity issues)
- **Orphaned static HTML files** in `/public/` directory from pre-Next.js era

---

## Dead Code Inventory

### 1. Legacy `/src/` Directory (CRITICAL - Entire directory unused)

**Status:** COMPLETELY DEAD - No imports from Next.js app  
**Lines of Code:** ~15,000+ (estimated)  
**Files:** 75 total

| Directory | Files | Description |
|-----------|-------|-------------|
| `/src/main.jsx` | 1 | Old Vite entry point |
| `/src/components/auth/` | 4 | Legacy auth components (AuthApp, SigninForm, SignupForm, AuthLayout) |
| `/src/components/dashboard/` | 12 | Legacy dashboard (Dashboard.jsx, all cards, shared components) |
| `/src/components/mirror/` | 8 | Legacy reflection (MirrorApp, Output, Questionnaire, shared) |
| `/src/components/portal/` | 6 | Legacy portal (Portal.jsx, MirrorShards, Navigation, etc.) |
| `/src/components/shared/` | 1 | Legacy CosmicBackground |
| `/src/hooks/` | 9 | Legacy hooks (useAuth, useAnimatedCounter, useDashboard, etc.) |
| `/src/services/` | 5 | Legacy API services (api.js, auth.service, dashboard.service, etc.) |
| `/src/utils/` | 4 | Legacy utilities (constants, validation, dashboardConstants) |
| `/src/styles/` | 6 | Legacy CSS (portal.css, mirror.css, dashboard.css, auth.css) |

**Evidence:** 
```bash
# No imports found from src/ in the Next.js app
grep -r "from ['\"]\./src/" --include="*.tsx" --include="*.ts" = 0 results
```

### 2. Legacy Infrastructure Files (CRITICAL)

| File | Size | Status |
|------|------|--------|
| `/backend-server.js` | 1.3 KB | DEPRECATED - Contains deprecation notice, immediately exits |
| `/dev-proxy.js` | 10.6 KB | DEPRECATED - Legacy Express proxy server for old architecture |
| `/vite.config.js` | 0.6 KB | DEPRECATED - Vite configuration no longer needed |
| `/create-component.js` | 14.5 KB | DEPRECATED - Old component generator |
| `/setup-react.js` | 18.8 KB | DEPRECATED - Original React setup script |
| `/index.html` | 3.3 KB | DEPRECATED - Old Vite entry point |

### 3. Unused Components in Active Codebase

| Component | Path | Status |
|-----------|------|--------|
| `FloatingNav` | `/components/ui/glass/FloatingNav.tsx` | Exported but never imported |
| `AnimatedBackground` | `/components/ui/glass/AnimatedBackground.tsx` | Exported but never imported |
| `DreamCard` (Glass) | `/components/ui/glass/DreamCard.tsx` | Exported but never imported (different `DreamCard` in `/dreams/` is used) |
| `ProgressIndicator` | `/components/reflection/ProgressIndicator.tsx` | Never imported |
| `ToneSelection` | `/components/reflection/ToneSelection.tsx` | Never imported (ToneSelectionCard is used instead) |
| `QuestionStep` | `/components/reflection/QuestionStep.tsx` | Never imported (mobile version or ReflectionQuestionCard used instead) |

### 4. Legacy Static HTML Files

| Directory | Files | Purpose |
|-----------|-------|---------|
| `/public/portal/` | index.html (36 KB) | Old portal page |
| `/public/mirror/` | questionnaire.html, output.html (129 KB total) | Old reflection pages |
| `/public/about/` | HTML files | May still be referenced |
| `/public/commitment/` | HTML files | Legacy commitment pages |
| `/public/creator/` | HTML files | Legacy creator page |
| `/public/evolution/` | HTML files | Legacy evolution reports |
| `/public/examples/` | HTML files | Legacy examples |
| `/public/gifting/` | HTML files | Legacy gifting page |
| `/public/profile/` | HTML files | Legacy profile |
| `/public/stewardship/` | HTML files | Legacy admin |
| `/public/transition/` | HTML files | Legacy breathing transition |

### 5. Unused Utilities

| File | Path | Status |
|------|------|--------|
| `lib/storage.js` | `/lib/storage.js` | Redis storage for old receipt/gift system - no imports in Next.js app |
| `lib/canvas-generators.js` | `/lib/canvas-generators.js` | Visualization generators - verify if used |

---

## Duplicate Implementations

### 1. Tone Selection Components (HIGH IMPACT)

Three separate implementations for tone selection:

| Component | Path | Usage |
|-----------|------|-------|
| `ToneSelection` | `/components/reflection/ToneSelection.tsx` | **UNUSED** - GlowButton-based buttons |
| `ToneSelectionCard` | `/components/reflection/ToneSelectionCard.tsx` | **USED** - Grid of GlassCard options |
| `ToneStep` | `/components/reflection/mobile/ToneStep.tsx` | **USED** - Mobile wizard step |

**Issue:** `ToneStep` and `ToneSelectionCard` contain ~80% duplicate logic (TONE_OPTIONS, color mappings, selection handling).

### 2. Question Step Components (HIGH IMPACT)

Two implementations:

| Component | Path | Props |
|-----------|------|-------|
| `QuestionStep` (Desktop) | `/components/reflection/QuestionStep.tsx` | **UNUSED** - Supports choice/textarea types |
| `QuestionStep` (Mobile) | `/components/reflection/mobile/QuestionStep.tsx` | **USED** - Mobile-optimized with keyboard handling |

**Issue:** Desktop version never imported, but has features (choice type, date input) the mobile version lacks.

### 3. DreamCard Components (MEDIUM IMPACT)

| Component | Path | Interface |
|-----------|------|-----------|
| `DreamCard` (Glass) | `/components/ui/glass/DreamCard.tsx` | Generic: title, content, date, tone |
| `DreamCard` (Dreams) | `/components/dreams/DreamCard.tsx` | Feature-rich: status, category, reflectionCount, actions |

**Resolution:** Glass DreamCard is generic/unused. Dreams DreamCard is the active implementation.

### 4. Dashboard Shared Components (JSX vs TSX)

**Exact duplicates** between legacy and active:

| Legacy (JSX) | Active (TSX) |
|--------------|--------------|
| `/src/components/dashboard/shared/DashboardCard.jsx` | `/components/dashboard/shared/DashboardCard.tsx` |
| `/src/components/dashboard/shared/DashboardGrid.jsx` | `/components/dashboard/shared/DashboardGrid.tsx` |
| `/src/components/dashboard/shared/ProgressRing.jsx` | `/components/dashboard/shared/ProgressRing.tsx` |
| `/src/components/dashboard/shared/ReflectionItem.jsx` | `/components/dashboard/shared/ReflectionItem.tsx` |
| `/src/components/dashboard/shared/TierBadge.jsx` | `/components/dashboard/shared/TierBadge.tsx` |
| `/src/components/dashboard/shared/WelcomeSection.jsx` | `/components/dashboard/shared/WelcomeSection.tsx` |

### 5. Hook Duplicates (JSX vs TS)

| Legacy | Active |
|--------|--------|
| `/src/hooks/useAuth.js` | `/hooks/useAuth.ts` |
| `/src/hooks/useAnimatedCounter.js` | `/hooks/useAnimatedCounter.ts` |
| `/src/hooks/useDashboard.js` | `/hooks/useDashboard.ts` |
| `/src/hooks/useStaggerAnimation.js` | `/hooks/useStaggerAnimation.ts` |
| `/src/hooks/useBreathingEffect.jsx` | `/hooks/useBreathingEffect.ts` |

---

## Technical Debt Registry

### CRITICAL Severity

| Issue | Count | Location | Impact |
|-------|-------|----------|--------|
| Entire `/src/` directory unused | 75 files | `/src/**/*` | 15K+ dead lines, confuses developers |
| Deprecated infrastructure | 6 files | Root directory | Maintenance confusion |
| TypeScript `any` types | 48+ | Throughout codebase | Type safety broken |

### HIGH Severity

| Issue | Count | Location | Impact |
|-------|-------|----------|--------|
| `console.log` in production | 130+ | Server routes, lib, components | Logs leak to production, performance |
| Security vulnerabilities | 5 | npm dependencies | Security risk |
| Test files with missing dependencies | 2 | `/server/**/__tests__/` | Tests won't run (missing vitest/jest) |

### MEDIUM Severity

| Issue | Count | Location | Impact |
|-------|-------|----------|--------|
| Duplicate components | 10+ | `/components/reflection/` | Maintenance burden, inconsistency |
| Orphaned CSS files | 6 | `/src/styles/` | Dead code |
| Unused exports | 5+ | `/components/ui/glass/index.ts` | False API surface |

### LOW Severity

| Issue | Count | Location | Impact |
|-------|-------|----------|--------|
| TODO comments | 1 | `/app/about/page.tsx` | Minor incomplete work |
| Inconsistent file naming | Various | Components | Style inconsistency |

---

## TODO/FIXME Comments

| File | Line | Comment |
|------|------|---------|
| `/app/about/page.tsx` | 5 | `TODO: Replace placeholder content with Ahiya's founder story, mission, philosophy` |

---

## `any` Type Usages (48+ instances)

### Server-side (24 instances)

```
server/lib/temporal-distribution.ts:15      [key: string]: any;
server/trpc/routers/reflection.ts:106       const requestConfig: any = {
server/trpc/routers/reflection.ts:133       } catch (error: any) {
server/trpc/routers/users.ts:181            tier: updatedUser.tier as any,
server/trpc/routers/users.ts:337            function calculateMonthlyBreakdown(reflections: any[])
server/trpc/routers/evolution.ts:152,192,227,321,331,332,365,403,438  Multiple any usages
server/trpc/routers/visualizations.ts:84,174,202,335  Multiple any usages
server/trpc/routers/dreams.ts:346           const updateData: any = { };
server/trpc/trpc.ts:16                      (error.cause as any).flatten()
```

### Client-side (24 instances)

```
components/dashboard/cards/DreamsCard.tsx:96    (dream: any, index: number)
components/reflections/ReflectionFilters.tsx:103  as any
components/reflections/AIResponseRenderer.tsx:151  code: ({ node, inline, ...props }: any)
components/dashboard/shared/ReflectionItem.tsx:22,50  any types
components/dreams/CreateDreamModal.tsx:52,64  any types
components/dreams/EvolutionModal.tsx:91,100  any types
app/dreams/[id]/page.tsx:47,89,98,426  Multiple any
app/dreams/page.tsx:168  any
app/visualizations/page.tsx:286  any
app/evolution/page.tsx:261  any
app/settings/page.tsx:66,216,219,220  Multiple any
types/clarify.ts:79  tool_use: any | null;
types/user.ts:107  preferences: any;
```

---

## Console.log Statements (130+ instances)

### Server-side Production Code (Should be removed or replaced with proper logging)

| File | Count | Example Lines |
|------|-------|---------------|
| `/server/trpc/routers/reflection.ts` | 12 | 38-40, 102-103, 132, 146, 168, 175, 193, 199 |
| `/server/trpc/routers/subscriptions.ts` | 12 | 34, 92, 96, 100, 103-105, 170, 177, 185, 220 |
| `/server/trpc/routers/clarify.ts` | 11 | 118, 134, 231, 248, 265, 360, 474, 568, 589 |
| `/server/trpc/routers/lifecycle.ts` | 8 | 150, 171, 349, 374, 392, 536, 554 |
| `/server/trpc/routers/auth.ts` | 7 | 74, 112, 118, 120, 125, 255, 322 |
| `/server/lib/email.ts` | 6 | 18, 20, 433, 436, 465, 468 |
| `/app/api/webhooks/paypal/route.ts` | 20 | Throughout file |

### Utility Scripts (Acceptable but could be cleaner)

| File | Count |
|------|-------|
| `/scripts/create-admin-user.js` | 18 |
| `/scripts/setup-local-db.js` | 4 |
| `/scripts/verify-setup.js` | 4 |
| `/scripts/verify-demo.ts` | 5 |
| `/scripts/create-paypal-webhook.ts` | 11 |

---

## Security Vulnerabilities (npm audit)

| Package | Severity | Issue |
|---------|----------|-------|
| `esbuild` (via vite) | Moderate | Development server can send arbitrary requests |
| `glob` 10.2.0-10.4.5 | High | Command injection via CLI |
| `jws` <3.2.3 | High | HMAC signature verification flaw |
| `mdast-util-to-hast` 13.0.0-13.2.0 | Moderate | Unsanitized class attribute |
| `nodemailer` <=7.0.10 | Moderate | Email domain interpretation conflict, DoS |

---

## Architecture Issues

### 1. Mixed File Organization

- React components exist in both `/src/components/` (dead) and `/components/` (active)
- Hooks exist in both `/src/hooks/` (dead) and `/hooks/` (active)
- Services exist in `/src/services/` (dead) with no equivalent in active app (tRPC replaced them)

### 2. Inconsistent Naming Conventions

| Pattern | Examples |
|---------|----------|
| PascalCase files | `CosmicBackground.tsx`, `DreamCard.tsx` |
| kebab-case directories | `reflection/mobile/`, `ui/glass/` |
| camelCase files | `useAuth.ts`, `useDashboard.ts` |

### 3. Test Infrastructure Broken

- Test files exist: `/server/lib/__tests__/paypal.test.ts`, `/server/trpc/__tests__/middleware.test.ts`
- Missing test runner: Neither `vitest` nor `@jest/globals` installed
- Package.json script: `"test": "echo 'Tests would go here'"` (placeholder)

### 4. CSS Organization Issues

- `/src/styles/` - Legacy CSS (completely unused)
- `/styles/` - Active CSS including `globals.css`, `variables.css`, `reflection.css`
- Some CSS modules in components: `/components/dashboard/shared/*.module.css`
- Tailwind config: `/tailwind.config.ts` with custom design tokens

---

## Iteration 1 Recommendations

### Priority 1: Remove Legacy `/src/` Directory (CRITICAL)

**Effort:** 30 minutes  
**Impact:** Removes 75 files, ~15K lines of dead code  
**Risk:** Very low - no imports exist

```bash
# Verification before removal
grep -r "from ['\"].*src/" --include="*.tsx" --include="*.ts" .
# If zero results, safe to remove:
rm -rf src/
```

### Priority 2: Remove Deprecated Infrastructure Files (CRITICAL)

**Effort:** 15 minutes  
**Files to remove:**
- `backend-server.js` (deprecated, exits immediately)
- `dev-proxy.js` (legacy Express proxy)
- `vite.config.js` (unused Vite config)
- `create-component.js` (legacy generator)
- `setup-react.js` (legacy setup)
- `index.html` (old Vite entry)

### Priority 3: Remove Unused Components (HIGH)

**Effort:** 1 hour  
**Components to remove:**
- `/components/ui/glass/FloatingNav.tsx`
- `/components/ui/glass/AnimatedBackground.tsx`
- `/components/ui/glass/DreamCard.tsx` (keep `/components/dreams/DreamCard.tsx`)
- `/components/reflection/ProgressIndicator.tsx`
- `/components/reflection/ToneSelection.tsx`
- `/components/reflection/QuestionStep.tsx`

**Update exports in `/components/ui/glass/index.ts`**

### Priority 4: Clean Up Console.logs (HIGH)

**Effort:** 2-3 hours  
**Options:**
1. Remove all (cleanest)
2. Replace with proper logging library (best for debugging)
3. Wrap in `process.env.NODE_ENV === 'development'` checks

### Priority 5: Fix `any` Types (MEDIUM)

**Effort:** 4-6 hours  
**Approach:**
1. Create proper interfaces for Anthropic API responses
2. Define types for database rows
3. Type Supabase query responses
4. Create error type guards

### Priority 6: Update Vulnerable Dependencies (MEDIUM)

**Effort:** 30 minutes (may need testing)
```bash
npm audit fix  # For auto-fixable
npm audit fix --force  # For breaking changes (test afterward)
```

### Priority 7: Clean Up Static HTML (LOW)

**Effort:** 1 hour  
**Verify routes before removal:**
- Check Next.js app directory for all pages
- Identify which public HTML is still referenced
- Remove orphaned files

### Priority 8: Fix Test Infrastructure (LOW - Future iteration)

**Effort:** 2 hours
1. Choose test framework (Vitest recommended for Next.js)
2. Install: `npm install -D vitest @testing-library/react`
3. Update existing tests
4. Fix `package.json` test script

---

## Estimated Effort Summary

| Task | Time | Priority |
|------|------|----------|
| Remove `/src/` directory | 30 min | P1 |
| Remove deprecated infrastructure | 15 min | P1 |
| Remove unused components | 1 hour | P2 |
| Clean console.logs | 2-3 hours | P2 |
| Fix `any` types | 4-6 hours | P3 |
| Update dependencies | 30 min | P3 |
| Clean static HTML | 1 hour | P4 |
| Fix test infrastructure | 2 hours | P5 |

**Total Estimated Effort: 11-14 hours** for full codebase purification

---

## File Counts Summary

| Category | Files | Status |
|----------|-------|--------|
| Active TypeScript | 190 | In use |
| Legacy JavaScript | 75 | DEAD - remove |
| Active CSS | 9 | In use |
| Legacy CSS | 6 | DEAD - remove |
| Deprecated infra | 6 | DEAD - remove |
| Orphaned static HTML | 15+ | Verify & remove |

**Total dead code: ~90+ files to remove**

---

## Risk Assessment

| Action | Risk | Mitigation |
|--------|------|------------|
| Remove `/src/` | Very Low | Grep verification confirms no imports |
| Remove infra files | Very Low | Files are explicitly deprecated |
| Remove components | Low | Search for imports before removal |
| Update deps | Medium | Test after updates, use `npm audit fix` first |
| Remove console.logs | Low | May lose debugging info, consider proper logging |

---

*Report generated by Master Explorer 1 for Plan 18: The Soul Transformation*
*Iteration 1: Codebase Purification*
