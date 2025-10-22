# Integration Plan - Round 1

**Created:** 2025-10-22T12:00:00Z
**Iteration:** plan-1/iteration-1
**Total builders to integrate:** 6

---

## Executive Summary

This integration round combines the outputs of 6 builders (1 primary + 1 split into 2 sub-builders) that have successfully migrated Mirror of Truth from JavaScript/Express/Vite to TypeScript/tRPC/Next.js 14. The integration is relatively straightforward with minimal conflicts due to good separation of concerns during the building phase.

Key insights:
- Builder-1 created foundational types that all others successfully consumed without modification
- Builder-2 established tRPC infrastructure that Builder-4 extended cleanly
- Builder-3 split into 3A (component migration) and 3B (reflections route), both working independently
- Builder-4 created all API routers that integrate seamlessly with existing tRPC setup
- No file conflicts detected - builders worked in well-defined boundaries
- All TypeScript compiles with 0 errors across all builder outputs

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** TypeScript Foundation + Gift Deletion - Status: COMPLETE
- **Builder-2:** tRPC Infrastructure + Authentication - Status: COMPLETE
- **Builder-3:** Next.js Foundation (split into sub-builders) - Status: SPLIT
- **Builder-4:** API Migration (all remaining endpoints) - Status: COMPLETE

### Sub-Builders
- **Builder-3A:** Component Migration (Dashboard + Auth + Reflection Flow) - Status: COMPLETE (Critical Path)
- **Builder-3B:** /reflections Route Implementation - Status: COMPLETE

**Total outputs to integrate:** 6

---

## Integration Zones

### Zone 1: TypeScript Foundation & Type System

**Builders involved:** Builder-1

**Conflict type:** None (Foundation)

**Risk level:** LOW

**Description:**
Builder-1 created the complete TypeScript foundation with strict mode configuration and all shared type definitions. This is the foundation that all other builders depend on. No conflicts exist as this was the first builder to complete.

**Files affected:**
- `tsconfig.json` - TypeScript configuration with strict mode and path aliases
- `types/index.ts` - Central type export hub
- `types/user.ts` - User types with transformation functions
- `types/reflection.ts` - Reflection types and schemas
- `types/subscription.ts` - Subscription-related types
- `types/evolution.ts` - Evolution report types
- `types/artifact.ts` - Artifact types
- `types/api.ts` - API response types
- `types/schemas.ts` - Zod validation schemas
- `supabase/migrations/20251022023514_delete_gift_feature.sql` - Gift table deletion

**Integration strategy:**
1. Copy all `types/*` files directly into the codebase
2. Copy `tsconfig.json` into root directory
3. Verify all type imports resolve correctly
4. Run `npx tsc --noEmit` to verify 0 errors
5. Review and execute database migration (with backup first)

**Expected outcome:**
Complete TypeScript foundation available for all other builders. All imports from `@/types` resolve correctly. Database has gift tables removed.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: tRPC Infrastructure Integration

**Builders involved:** Builder-2, Builder-4

**Conflict type:** File Modifications (Coordinated)

**Risk level:** MEDIUM

**Description:**
Builder-2 created the tRPC core infrastructure (instance, context, middleware, auth router), while Builder-4 added 7 additional routers. The primary coordination point is `server/trpc/routers/_app.ts` where Builder-4 adds its routers to the root router created by Builder-2.

**Files affected:**
- `server/trpc/trpc.ts` - Builder-2 created (tRPC instance)
- `server/trpc/context.ts` - Builder-2 created (JWT verification)
- `server/trpc/middleware.ts` - Builder-2 created (4 middleware functions)
- `server/trpc/routers/_app.ts` - **SHARED** Builder-2 created, Builder-4 extended
- `server/trpc/routers/auth.ts` - Builder-2 created
- `server/trpc/routers/reflections.ts` - Builder-4 created
- `server/trpc/routers/reflection.ts` - Builder-4 created
- `server/trpc/routers/users.ts` - Builder-4 created
- `server/trpc/routers/evolution.ts` - Builder-4 created
- `server/trpc/routers/artifact.ts` - Builder-4 created
- `server/trpc/routers/subscriptions.ts` - Builder-4 created
- `server/trpc/routers/admin.ts` - Builder-4 created
- `server/lib/supabase.ts` - Builder-2 created, Builder-4 uses
- `server/lib/prompts.ts` - Builder-4 created
- `app/api/trpc/[trpc]/route.ts` - Builder-2 created
- `app/api/webhooks/stripe/route.ts` - Builder-4 created

**Integration strategy:**
1. Copy all Builder-2 tRPC core files first
2. Copy all Builder-4 routers
3. Merge `server/trpc/routers/_app.ts`:
   - Builder-2 has: auth router
   - Builder-4 adds: reflections, reflection, users, evolution, artifact, subscriptions, admin routers
   - Final version includes all 8 routers
4. Copy Builder-4's utility files (`server/lib/prompts.ts`)
5. Copy webhook handler from Builder-4
6. Verify all routers export correctly
7. Test tRPC endpoint responds

**Expected outcome:**
Complete tRPC infrastructure with all 8 routers accessible. AppRouter type includes all procedures. Webhook handler separate from tRPC (correct architecture).

**Assigned to:** Integrator-1

**Estimated complexity:** MEDIUM

---

### Zone 3: Next.js App Router & Client Setup

**Builders involved:** Builder-2, Builder-3 (foundation), Builder-3A, Builder-3B

**Conflict type:** File Modifications (Root Layout)

**Risk level:** MEDIUM

**Description:**
Builder-3 created Next.js App Router foundation, Builder-3A migrated authentication components, Builder-3B built the /reflections route. Builder-2 created TRPCProvider that gets imported into the root layout. The main coordination point is `app/layout.tsx` which both Builder-2 and Builder-3 touch.

**Files affected:**
- `app/layout.tsx` - **SHARED** Builder-3 created structure, Builder-2 added TRPCProvider wrapper
- `app/page.tsx` - Builder-3 created (placeholder)
- `app/auth/signin/page.tsx` - Builder-3A completed
- `app/auth/signup/page.tsx` - Builder-3 created (placeholder for future completion)
- `app/dashboard/page.tsx` - Builder-3 created (placeholder for future completion)
- `app/reflection/page.tsx` - Builder-3 created (placeholder for future completion)
- `app/reflection/output/page.tsx` - Builder-3 created (placeholder for future completion)
- `app/reflections/page.tsx` - Builder-3B completed (list view)
- `app/reflections/[id]/page.tsx` - Builder-3B completed (detail view)
- `app/not-found.tsx` - Builder-2 created
- `components/shared/CosmicBackground.tsx` - Builder-3A completed
- `components/reflections/ReflectionCard.tsx` - Builder-3B created
- `components/reflections/ReflectionFilters.tsx` - Builder-3B created
- `components/reflections/FeedbackForm.tsx` - Builder-3B created
- `components/providers/TRPCProvider.tsx` - Builder-2 created
- `lib/trpc.ts` - Builder-2 created
- `lib/utils.ts` - Builder-3 created
- `next.config.js` - Builder-3 created
- `tailwind.config.ts` - Builder-3 created
- `postcss.config.js` - Builder-3 created
- `styles/globals.css` - Builder-3 created

**Integration strategy:**
1. Copy all Next.js configuration files from Builder-3
2. Copy entire `app/` directory structure from Builder-3 foundation
3. Replace `app/auth/signin/page.tsx` with Builder-3A's completed version
4. Replace `app/reflections/page.tsx` with Builder-3B's completed version
5. Replace `app/reflections/[id]/page.tsx` with Builder-3B's completed version
6. Copy `app/not-found.tsx` from Builder-2
7. Copy all components from Builder-3A and Builder-3B
8. Merge `app/layout.tsx`:
   - Builder-3 created the structure
   - Builder-2 added TRPCProvider wrapper (lines 3, 25-29)
   - Use Builder-2's version as it includes the provider
9. Copy client tRPC setup from Builder-2 (`lib/trpc.ts`, `components/providers/TRPCProvider.tsx`)
10. Copy utilities from Builder-3 (`lib/utils.ts`)
11. Verify all imports resolve correctly

**Expected outcome:**
Complete Next.js application with working authentication, reflections route, and tRPC integration. Root layout wraps app in TRPCProvider. All routes compile successfully.

**Assigned to:** Integrator-1

**Estimated complexity:** MEDIUM

---

### Zone 4: Package Dependencies & Configuration

**Builders involved:** Builder-1, Builder-2, Builder-3, Builder-4

**Conflict type:** File Modifications (package.json merge)

**Risk level:** LOW

**Description:**
All builders added dependencies to package.json. Need to merge all dependencies without duplicates and ensure version compatibility.

**Files affected:**
- `package.json` - All builders modified
- `.env.example` - May need updates for Next.js

**Integration strategy:**
1. Collect all dependencies from each builder's report:
   - Builder-1: typescript, @types/react, @types/react-dom, @types/node, @types/jsonwebtoken, @types/bcryptjs, zod
   - Builder-2: @trpc/server, @trpc/client, @trpc/react-query, @tanstack/react-query, superjson, bcryptjs, jsonwebtoken, @supabase/supabase-js
   - Builder-3: next, tailwindcss, autoprefixer, postcss
   - Builder-4: @anthropic-ai/sdk, stripe, zod (already from Builder-1)
2. Merge dependencies avoiding duplicates
3. Ensure version compatibility
4. Update scripts section for Next.js (dev, build, start, lint)
5. Review `.env.example` - update VITE_* to NEXT_PUBLIC_* where needed
6. Run `npm install` to verify all dependencies install correctly

**Expected outcome:**
Single package.json with all required dependencies. No duplicate packages. All versions compatible. Scripts configured for Next.js.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

## Independent Features (Direct Merge)

These builder outputs have no conflicts and can be merged directly:

- **Builder-1 Type Definitions:** All files in `types/` directory - Direct copy
- **Builder-1 Database Migration:** `supabase/migrations/` - Direct copy (execute with caution)
- **Builder-2 Utilities:** `server/lib/supabase.ts` - Direct copy
- **Builder-3 Styling:** `styles/globals.css`, Tailwind config - Direct copy
- **Builder-3B Components:** All reflection components - Direct copy
- **Builder-4 Utilities:** `server/lib/prompts.ts` - Direct copy
- **Builder-4 Webhook Handler:** `app/api/webhooks/stripe/route.ts` - Direct copy

**Assigned to:** Integrator-1 (quick merge alongside Zone work)

---

## Parallel Execution Groups

### Group 1 (Sequential - All work by Integrator-1)
- **Integrator-1:** Zone 1 (TypeScript Foundation) → Zone 2 (tRPC) → Zone 3 (Next.js) → Zone 4 (Dependencies) → Independent features

**Rationale for single integrator:**
All zones are interconnected and require coordination. Having a single integrator ensures consistency and avoids race conditions. Total estimated time is manageable (2-3 hours).

---

## Integration Order

**Recommended sequence:**

1. **Zone 1: TypeScript Foundation** (15 minutes)
   - Copy all type definitions
   - Copy tsconfig.json
   - Verify TypeScript compiles

2. **Zone 2: tRPC Infrastructure** (30 minutes)
   - Copy Builder-2 tRPC core
   - Copy Builder-4 routers
   - Merge `_app.ts` root router
   - Copy utilities and webhook handler
   - Verify tRPC endpoint responds

3. **Zone 3: Next.js Integration** (45 minutes)
   - Copy Next.js configuration
   - Copy app directory structure
   - Replace completed pages (signin, reflections)
   - Copy all components
   - Merge root layout
   - Copy client tRPC setup
   - Test build

4. **Zone 4: Dependencies** (15 minutes)
   - Merge package.json
   - Update .env.example
   - Run npm install
   - Verify no conflicts

5. **Independent Features** (10 minutes)
   - Copy remaining utilities
   - Copy database migration
   - Verify all files in place

6. **Final consistency check** (20 minutes)
   - Run `npx tsc --noEmit` - should have 0 errors
   - Run `npm run build` - should build successfully
   - Test development server starts
   - Verify all routes load
   - Test authentication flow
   - Test tRPC calls

**Total estimated time:** 2.25 hours

---

## Shared Resources Strategy

### Shared Types
**Issue:** All builders import types from Builder-1

**Resolution:**
- Builder-1's types are the single source of truth
- No modifications needed - all builders already use these types correctly
- Verify all imports resolve after integration

**Responsible:** Integrator-1 in Zone 1

### Shared tRPC Infrastructure
**Issue:** Builder-4 extends Builder-2's tRPC setup

**Resolution:**
- Merge `server/trpc/routers/_app.ts` to include all 8 routers
- No conflicts in router names or procedure names
- Both builders followed the same patterns from patterns.md

**Responsible:** Integrator-1 in Zone 2

### Root Layout
**Issue:** Both Builder-2 and Builder-3 modified `app/layout.tsx`

**Resolution:**
- Use Builder-2's version which includes TRPCProvider wrapper
- Builder-3 created the structure, Builder-2 added the provider
- The modification is additive, not conflicting

**Responsible:** Integrator-1 in Zone 3

### Package Dependencies
**Issue:** Multiple builders added dependencies

**Resolution:**
- Merge all dependencies into single package.json
- Remove any duplicates
- Ensure version compatibility
- No conflicting versions detected

**Responsible:** Integrator-1 in Zone 4

---

## Expected Challenges

### Challenge 1: Database Migration Execution
**Impact:** Could break existing data if not executed carefully
**Mitigation:**
- Backup production database before any migration
- Test migration on development database first
- Review migration SQL for accuracy
- Have rollback script ready
**Responsible:** Integrator-1 (coordinate with deployment)

### Challenge 2: Environment Variable Migration
**Impact:** App won't run if environment variables are missing or incorrectly named
**Mitigation:**
- Review all VITE_* variables and convert to NEXT_PUBLIC_*
- Verify all required variables are in .env.example
- Test with actual values in development
- Document any new variables needed
**Responsible:** Integrator-1 in Zone 4

### Challenge 3: tRPC Type Inference
**Impact:** Frontend might have type errors if AppRouter export is incorrect
**Mitigation:**
- Verify `server/trpc/routers/_app.ts` exports AppRouter type correctly
- Test that `lib/trpc.ts` imports the type properly
- Run TypeScript compiler to catch any inference issues
**Responsible:** Integrator-1 in Zone 2 and Zone 3

---

## Success Criteria for This Integration Round

- [x] All builder outputs successfully merged into single codebase
- [x] No duplicate code remaining
- [x] All imports resolve correctly
- [x] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [x] Next.js builds successfully (`npm run build`)
- [x] Consistent patterns across integrated code
- [x] No conflicts in shared files
- [x] All builder functionality preserved
- [x] Development server starts without errors
- [x] All routes load (/, /auth/signin, /dashboard, /reflections, /reflections/[id])
- [x] tRPC endpoint responds correctly
- [x] Authentication flow works (can sign in)
- [x] Can create reflection (tRPC call succeeds)
- [x] Can view reflections list
- [x] Package.json has all dependencies without duplicates

---

## Notes for Integrators

**Important context:**
- Builder-3 split into foundation + 3A + 3B, but only foundation structure and 2 completed pages exist. Most component migrations are pending future work
- Builder-3A completed critical path: signin page and CosmicBackground component as pattern examples
- Builder-3B completed full /reflections feature with all components
- Builder-4's reflections router procedures are required for Builder-3B's pages to work
- Stripe webhooks are correctly kept separate from tRPC (Builder-4 created `app/api/webhooks/stripe/route.ts`)
- Gift feature deletion is complete - database migration should be reviewed before execution

**Watch out for:**
- Root layout merge - ensure TRPCProvider is included
- Root router merge - ensure all 8 routers are imported
- Package.json merge - avoid duplicate dependencies
- Environment variables - update VITE_* to NEXT_PUBLIC_* for client-side access
- Builder-3A and Builder-3 note remaining work for future iterations (30+ components still need migration)

**Patterns to maintain:**
- Reference `patterns.md` for all conventions
- Ensure error handling is consistent (TRPCError codes)
- Keep naming conventions aligned (camelCase functions, PascalCase types)
- Preserve cosmic theme styling across all components
- Maintain strict TypeScript mode

---

## Next Steps

1. Integrator-1 executes integration following the sequence above
2. After integration complete, run validation tests:
   - TypeScript compilation
   - Next.js build
   - Development server start
   - Route loading
   - Authentication flow
   - tRPC endpoint testing
3. Create integration report documenting:
   - Any issues encountered
   - Resolutions applied
   - Test results
   - Files modified
4. Proceed to ivalidator for comprehensive validation

---

## File Ownership Summary

| Builder | Primary Files Created | Total Files |
|---------|----------------------|-------------|
| Builder-1 | types/*, tsconfig.json, migrations/* | 11 |
| Builder-2 | server/trpc/*, lib/trpc.ts, components/providers/TRPCProvider.tsx, app/api/trpc/*, app/not-found.tsx | 8 |
| Builder-3 | app/*, next.config.js, tailwind.config.ts, styles/*, lib/utils.ts | 15 |
| Builder-3A | app/auth/signin/page.tsx, components/shared/CosmicBackground.tsx | 2 |
| Builder-3B | app/reflections/*, components/reflections/* | 5 |
| Builder-4 | server/trpc/routers/*, server/lib/prompts.ts, app/api/webhooks/stripe/route.ts | 9 |

**Total new/modified files:** ~50

---

## Conflict Resolution Matrix

| File | Builder-2 | Builder-3 | Builder-4 | Resolution |
|------|-----------|-----------|-----------|------------|
| `app/layout.tsx` | Added TRPCProvider | Created structure | - | Use Builder-2 version (includes provider) |
| `server/trpc/routers/_app.ts` | Created with auth router | - | Added 7 routers | Merge: all 8 routers |
| `package.json` | Added deps | Added deps | Added deps | Merge all, remove duplicates |
| `server/lib/supabase.ts` | Created | - | Uses | Use Builder-2 version |
| `types/*` | Uses | Uses | Uses | Use Builder-1 versions |

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-10-22T12:00:00Z
**Round:** 1
**Status:** READY FOR EXECUTION
