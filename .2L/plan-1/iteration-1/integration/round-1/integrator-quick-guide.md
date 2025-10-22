# Integrator Quick Reference Guide

## Integration Round 1 - Mirror of Dreams (Iteration 1)

### At a Glance

**Total Zones:** 4
**Estimated Time:** 2.25 hours
**Risk Level:** MEDIUM (manageable with care)
**Builders to Merge:** 6

---

## Pre-Integration Checklist

Before starting, verify:

- [ ] All 6 builder reports read and understood
- [ ] Git branch created for integration work
- [ ] Database backup completed (for migration)
- [ ] Development environment ready
- [ ] All builder output files accessible

---

## Quick Integration Steps

### Step 1: Zone 1 - TypeScript Foundation (15 min)

```bash
# Copy all type definitions
cp -r <builder-1-workspace>/types ./
cp <builder-1-workspace>/tsconfig.json ./

# Copy database migration
cp -r <builder-1-workspace>/supabase/migrations ./supabase/

# Verify
npx tsc --noEmit
# Expected: 0 errors
```

**Files copied:** 11 type files + tsconfig.json + 1 migration

---

### Step 2: Zone 2 - tRPC Infrastructure (30 min)

```bash
# Copy Builder-2 tRPC core
cp -r <builder-2-workspace>/server/trpc ./server/
cp -r <builder-2-workspace>/server/lib/supabase.ts ./server/lib/
cp -r <builder-2-workspace>/app/api/trpc ./app/api/
cp <builder-2-workspace>/app/not-found.tsx ./app/

# Copy Builder-4 routers
cp <builder-4-workspace>/server/trpc/routers/reflections.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/reflection.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/users.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/evolution.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/artifact.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/subscriptions.ts ./server/trpc/routers/
cp <builder-4-workspace>/server/trpc/routers/admin.ts ./server/trpc/routers/

# Copy Builder-4 utilities
cp <builder-4-workspace>/server/lib/prompts.ts ./server/lib/
cp -r <builder-4-workspace>/app/api/webhooks ./app/api/

# MERGE _app.ts root router
# Manual step: Edit server/trpc/routers/_app.ts
```

**MERGE REQUIRED:** `server/trpc/routers/_app.ts`

Open `server/trpc/routers/_app.ts` and add imports + router entries:

```typescript
// Add imports
import { reflectionsRouter } from './reflections';
import { reflectionRouter } from './reflection';
import { usersRouter } from './users';
import { evolutionRouter } from './evolution';
import { artifactRouter } from './artifact';
import { subscriptionsRouter } from './subscriptions';
import { adminRouter } from './admin';

// Update appRouter
export const appRouter = router({
  auth: authRouter,              // Builder-2
  reflections: reflectionsRouter, // Builder-4
  reflection: reflectionRouter,   // Builder-4
  users: usersRouter,             // Builder-4
  evolution: evolutionRouter,     // Builder-4
  artifact: artifactRouter,       // Builder-4
  subscriptions: subscriptionsRouter, // Builder-4
  admin: adminRouter,             // Builder-4
});
```

---

### Step 3: Zone 3 - Next.js Integration (45 min)

```bash
# Copy Next.js configuration from Builder-3
cp <builder-3-workspace>/next.config.js ./
cp <builder-3-workspace>/tailwind.config.ts ./
cp <builder-3-workspace>/postcss.config.js ./
cp -r <builder-3-workspace>/styles ./

# Copy app directory foundation from Builder-3
cp -r <builder-3-workspace>/app ./

# Replace completed pages from Builder-3A
cp <builder-3A-workspace>/app/auth/signin/page.tsx ./app/auth/signin/
cp <builder-3A-workspace>/components/shared/CosmicBackground.tsx ./components/shared/

# Replace completed pages from Builder-3B
cp <builder-3B-workspace>/app/reflections/page.tsx ./app/reflections/
cp <builder-3B-workspace>/app/reflections/[id]/page.tsx ./app/reflections/[id]/
cp -r <builder-3B-workspace>/components/reflections ./components/

# Copy client tRPC setup from Builder-2
cp <builder-2-workspace>/lib/trpc.ts ./lib/
cp -r <builder-2-workspace>/components/providers ./components/

# Copy utilities from Builder-3
cp <builder-3-workspace>/lib/utils.ts ./lib/
```

**MERGE REQUIRED:** `app/layout.tsx`

The Builder-2 version already includes the TRPCProvider wrapper, so:

```bash
# Use Builder-2's version (it has TRPCProvider integrated)
cp <builder-2-workspace>/app/layout.tsx ./app/
```

---

### Step 4: Zone 4 - Dependencies (15 min)

**Manual step:** Merge `package.json`

Collect dependencies from all builders:

**Builder-1:**
- typescript
- @types/react, @types/react-dom, @types/node
- @types/jsonwebtoken, @types/bcryptjs
- zod

**Builder-2:**
- @trpc/server, @trpc/client, @trpc/react-query
- @tanstack/react-query
- superjson
- bcryptjs, jsonwebtoken
- @supabase/supabase-js

**Builder-3:**
- next
- tailwindcss, autoprefixer, postcss

**Builder-4:**
- @anthropic-ai/sdk
- stripe

Update scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

Update environment variables in `.env.example`:
- Change `VITE_*` to `NEXT_PUBLIC_*` for client-side variables

```bash
# Install all dependencies
npm install
```

---

### Step 5: Independent Features (10 min)

All remaining files can be copied directly:

```bash
# Already copied in previous steps, but verify:
# - types/ (Zone 1)
# - server/lib/prompts.ts (Zone 2)
# - app/api/webhooks/stripe/route.ts (Zone 2)
# - components/reflections/* (Zone 3)
```

---

### Step 6: Validation (20 min)

```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: 0 errors

# 2. Next.js build
npm run build
# Expected: Build successful, 0 errors

# 3. Start development server
npm run dev
# Expected: Server starts on port 3000

# 4. Test routes (in browser)
# - http://localhost:3000/ (landing)
# - http://localhost:3000/auth/signin (signin page)
# - http://localhost:3000/dashboard (dashboard - placeholder)
# - http://localhost:3000/reflections (reflections list)
# - http://localhost:3000/reflections/test-id (reflection detail)

# 5. Test tRPC endpoint
curl http://localhost:3000/api/trpc/auth.verifyToken
# Expected: 401 Unauthorized (correct - no token)
```

---

## Critical Merges Summary

### File 1: `server/trpc/routers/_app.ts`
**What:** Add 7 routers to the root router
**How:** Import all routers, add to router object
**Why:** Builder-4's routers need to be mounted

### File 2: `app/layout.tsx`
**What:** Use Builder-2's version with TRPCProvider
**How:** Copy Builder-2's version directly
**Why:** It already includes the provider wrapper that Builder-3 needs

### File 3: `package.json`
**What:** Merge all dependencies
**How:** Combine all deps, remove duplicates, update scripts
**Why:** All builders added dependencies

---

## Common Issues & Solutions

### Issue: TypeScript errors about missing types
**Solution:** Ensure `types/index.ts` exists and exports all types

### Issue: tRPC endpoint 404
**Solution:** Verify `app/api/trpc/[trpc]/route.ts` exists and exports handler

### Issue: Build fails with Next.js errors
**Solution:** Check `next.config.js` exists and is valid

### Issue: TRPCProvider not found
**Solution:** Ensure `components/providers/TRPCProvider.tsx` copied from Builder-2

### Issue: Import errors for @/types
**Solution:** Verify path aliases in `tsconfig.json` are correct

---

## Post-Integration Checklist

After completing all zones:

- [ ] TypeScript compiles with 0 errors
- [ ] Next.js builds successfully
- [ ] Development server starts
- [ ] Landing page loads
- [ ] Signin page loads
- [ ] Dashboard page loads (placeholder)
- [ ] Reflections list page loads
- [ ] tRPC endpoint responds (even if 401)
- [ ] No console errors on page load
- [ ] All imports resolve correctly
- [ ] Git commit created with integration changes
- [ ] Integration report drafted

---

## Time Tracking

| Zone | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| Zone 1 | 15 min | _____ | |
| Zone 2 | 30 min | _____ | |
| Zone 3 | 45 min | _____ | |
| Zone 4 | 15 min | _____ | |
| Independent | 10 min | _____ | |
| Validation | 20 min | _____ | |
| **TOTAL** | **2h 15m** | **_____** | |

---

## Next Steps After Integration

1. Create integration report in `.2L/plan-1/iteration-1/integration/round-1/integration-report.md`
2. Document any issues encountered and resolutions
3. Commit all changes to git
4. Proceed to ivalidator for comprehensive validation
5. If validation passes, mark iteration as complete

---

## Emergency Rollback

If integration fails catastrophically:

```bash
# Revert to pre-integration state
git reset --hard HEAD

# Or restore from backup if git not used
# Restore files from backup location
```

---

**For detailed information, see:** `.2L/plan-1/iteration-1/integration/round-1/integration-plan.md`

**Good luck, Integrator-1!**
