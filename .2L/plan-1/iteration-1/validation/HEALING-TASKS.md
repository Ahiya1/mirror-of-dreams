# Healing Tasks - Iteration 1

**Status:** PARTIAL → Target: PASS
**Estimated Time:** 1 hour
**Healer Count:** 1 (simple fixes, no conflicts)

---

## Task 1: Fix Production Build (CRITICAL)

**Priority:** 1 (blocks deployment)
**Estimated Time:** 30 minutes
**Difficulty:** Medium

### Problem

Production build fails during page data collection:
```
Error: Neither apiKey nor config.authenticator provided
  at /app/api/trpc/[trpc]/route.js
```

**Root Cause:** Anthropic SDK initializes at module level, executes at build time when env vars unavailable.

### Solution: Lazy Initialization

**Files to modify:**
1. `server/trpc/routers/reflection.ts`
2. `server/trpc/routers/evolution.ts`

**Change Pattern:**

**Before (module-level initialization):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-for-build',
});

export const reflectionRouter = router({
  generate: usageLimitedProcedure
    .input(...)
    .mutation(async ({ ctx, input }) => {
      const response = await anthropic.messages.create({...});
    }),
});
```

**After (lazy initialization):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export const reflectionRouter = router({
  generate: usageLimitedProcedure
    .input(...)
    .mutation(async ({ ctx, input }) => {
      const anthropic = getAnthropicClient(); // Initialize here
      const response = await anthropic.messages.create({...});
    }),
});
```

### Files to Change

#### File 1: `server/trpc/routers/reflection.ts`

**Lines to find:**
```typescript
const anthropic = new Anthropic({
```

**Replace with:**
```typescript
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}
```

**Then in the `generate` procedure:**
```typescript
.mutation(async ({ ctx, input }) => {
  const anthropic = getAnthropicClient(); // Add this line
  // ... rest of code remains same
```

#### File 2: `server/trpc/routers/evolution.ts`

**Same pattern as above.**

### Verification

```bash
# Test build succeeds
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Build completed
```

### Success Criteria

- ✅ Build completes without errors
- ✅ No "Neither apiKey" error
- ✅ All pages generate successfully
- ✅ Development server still works

---

## Task 2: Delete Legacy Express Code (MAJOR)

**Priority:** 2 (blocks Success Criterion 7)
**Estimated Time:** 15 minutes
**Difficulty:** Easy

### Problem

Old Express API directory (`/api`) still exists with 12 files, including gift-related code in `api/communication.js`.

### Solution: Delete Entire Directory

**Command:**
```bash
rm -rf /home/ahiya/mirror-of-dreams/api
```

### Files Being Deleted

```
api/admin.js
api/artifact.js
api/auth.js
api/communication.js  ← Contains 79 lines of gift code
api/creator-auth.js
api/diagnostics.js
api/evolution.js
api/payment.js
api/reflection.js
api/reflections.js
api/subscriptions.js
api/users.js
```

### Verification

```bash
# Verify directory deleted
ls /home/ahiya/mirror-of-dreams/api
# Should return: "No such file or directory"

# Verify no imports reference old API
grep -r "from '../api/" /home/ahiya/mirror-of-dreams/app
grep -r "from '../api/" /home/ahiya/mirror-of-dreams/components
grep -r "from '../api/" /home/ahiya/mirror-of-dreams/server
# All should return: "No results"

# Search for remaining gift references
grep -ri "gift" /home/ahiya/mirror-of-dreams/app
grep -ri "gift" /home/ahiya/mirror-of-dreams/server
grep -ri "gift" /home/ahiya/mirror-of-dreams/components
# Should only find migration file and type definitions (if any)
```

### Success Criteria

- ✅ `/api` directory does not exist
- ✅ No imports reference old API files
- ✅ No gift-related code in active codebase (except migration)
- ✅ Build still succeeds
- ✅ Dev server still works

---

## Task 3: Verify Gift Deletion Migration (MAJOR)

**Priority:** 3 (completes Success Criterion 7)
**Estimated Time:** 10 minutes
**Difficulty:** Easy

### Problem

Migration file exists but execution not verified. Unknown if `subscription_gifts` table dropped.

### Solution: Verify Migration Status

**Step 1: Check Migration List**
```bash
cd /home/ahiya/mirror-of-dreams
npx supabase migration list
```

**Expected Output:**
```
20251022023514 delete_gift_feature ✓ Applied
```

**If migration shows as "Not applied":**
```bash
# Development environment only!
npx supabase db reset

# Or apply specific migration:
npx supabase migration up
```

**Step 2: Verify Table Dropped**

**Option A - Via Supabase Dashboard:**
1. Go to Supabase dashboard
2. Navigate to Table Editor
3. Verify `subscription_gifts` table does NOT exist

**Option B - Via SQL:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'subscription_gifts';
```

**Expected Result:** No rows (table does not exist)

### Verification

```bash
# Check migration file exists
ls -la /home/ahiya/mirror-of-dreams/supabase/migrations/*gift*

# Expected output:
# 20251022023514_delete_gift_feature.sql
```

### Success Criteria

- ✅ Migration file exists
- ✅ Migration shows as "Applied" in `migration list`
- ✅ `subscription_gifts` table does not exist in database
- ✅ RLS policies for `subscription_gifts` dropped
- ✅ Indexes for `subscription_gifts` dropped

---

## Task 4: Re-run Validation (VERIFICATION)

**Priority:** 4 (final verification)
**Estimated Time:** 5 minutes
**Difficulty:** Easy

### Commands

```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: No output (success)

# 2. Production build
npm run build
# Expected: ✓ Build completed

# 3. Development server
npm run dev
# Expected: ✓ Ready in ~1s

# 4. Gift feature deletion
grep -ri "gift" api/ 2>&1
# Expected: "No such file or directory" (api/ deleted)

# 5. Legacy code removal
ls api/ 2>&1
# Expected: "No such file or directory"
```

### Success Criteria

All 8 success criteria should now be MET:

1. ✅ Existing reflection flow works without errors
2. ✅ TypeScript strict mode passes with no errors
3. ✅ tRPC procedures have full type safety (frontend ↔ backend)
4. ✅ All API calls use tRPC client
5. ✅ Build succeeds with no warnings ← **FIXED**
6. ✅ User can sign in and create reflections
7. ✅ Gift feature completely deleted ← **FIXED**
8. ✅ /reflections route works (view previous reflections)

**Updated Status:** PASS (Confidence: HIGH 85%+)

---

## Healing Checklist

### Pre-Healing

- [ ] Read validation report: `.2L/plan-1/iteration-1/validation/validation-report.md`
- [ ] Read integration report: `.2L/plan-1/iteration-1/integration/round-1/integrator-1-report.md`
- [ ] Backup codebase (optional): `git stash` or `git commit -am "Pre-healing checkpoint"`

### Task Execution

- [ ] **Task 1:** Fix Anthropic SDK lazy initialization (30 min)
  - [ ] Modify `server/trpc/routers/reflection.ts`
  - [ ] Modify `server/trpc/routers/evolution.ts`
  - [ ] Test: `npm run build` succeeds

- [ ] **Task 2:** Delete legacy Express code (15 min)
  - [ ] Run: `rm -rf /home/ahiya/mirror-of-dreams/api`
  - [ ] Verify: No import references
  - [ ] Verify: No gift code remains

- [ ] **Task 3:** Verify gift migration (10 min)
  - [ ] Check: `npx supabase migration list`
  - [ ] Verify: Table dropped in database

- [ ] **Task 4:** Re-run validation (5 min)
  - [ ] Run all verification commands
  - [ ] Verify all 8 success criteria MET

### Post-Healing

- [ ] Update validation status to PASS
- [ ] Create healing report
- [ ] Commit all changes: `git add . && git commit -m "Fix iteration-1 issues: build config, legacy cleanup, gift deletion"`
- [ ] Notify orchestrator: Iteration 1 PASS, ready for Iteration 2

---

## Expected Outcomes

**Before Healing:**
- Status: PARTIAL
- Confidence: 70%
- Success Criteria: 3 MET, 2 UNCERTAIN, 1 PARTIAL, 1 NOT MET, 1 FAIL

**After Healing:**
- Status: PASS
- Confidence: 85%+
- Success Criteria: 8 MET (potentially 6 DEFINITIVE, 2 LIKELY)

**Deployment Ready:** YES (after healing)

---

## Notes for Healer

1. **Lazy initialization pattern is standard practice** for services requiring runtime env vars. This is the correct long-term solution.

2. **Deleting `/api` directory is safe** - confirmed by validator that:
   - No imports reference these files
   - All functionality replaced by tRPC routers
   - Next.js doesn't load Express files

3. **Migration verification is important** to confirm gift feature fully deleted. Check Supabase dashboard if unsure.

4. **If any task fails**, document the failure and escalate. Do not proceed to next task until current task succeeds.

5. **Total healing time should be ~1 hour**. If taking significantly longer, escalate for guidance.

---

**End of Healing Tasks**
