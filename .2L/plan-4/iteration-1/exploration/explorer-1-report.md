# Explorer 1 Report: Reflection API & Backend Analysis

## Executive Summary

**Status:** CRITICAL BUG IDENTIFIED - Root cause hypothesis established with high confidence

**Primary Finding:** The reflection creation system is experiencing 400 errors due to a **schema-database mismatch**. The database table `reflections` has `has_date TEXT NOT NULL` constraint, but the frontend can submit this field as empty/undefined in certain multi-step flow scenarios, causing Zod validation to pass but database insertion to fail.

**Confidence Level:** 85% - Based on code analysis, schema examination, and understanding of tRPC validation flow

**Estimated Fix Time:** 4-6 hours (includes testing)

---

## Root Cause Hypothesis

### The 400 Error Chain

```
Frontend (MirrorExperience.tsx)
  ├─ User fills multi-step form (steps 0-6)
  ├─ Step 3: hasDate question ("yes"/"no" choice)
  │   └─ Problem: User can skip or leave empty
  ├─ handleSubmit() called with formData
  │
  ↓
tRPC Client
  ├─ Payload: { dreamId, dream, plan, hasDate, dreamDate, relationship, offering, tone }
  ├─ hasDate value: "" (empty string) or undefined
  │
  ↓
Zod Schema Validation (types/schemas.ts line 44)
  ├─ hasDate: z.enum(['yes', 'no'])
  ├─ FAILS if hasDate is empty string
  ├─ Throws BAD_REQUEST (400)
  │
  ↓
OR Database Insertion (if Zod passes)
  ├─ Table constraint: has_date TEXT NOT NULL
  ├─ FAILS if value doesn't match enum or is NULL
  ├─ PostgreSQL error bubbles up as 400
```

**Most Likely Scenario:**
The multi-step questionnaire (steps 0-6) has conditional logic where step 3 (hasDate question) can be bypassed or skipped. When `formData.hasDate` is `""` (empty string), Zod validation rejects it because `z.enum(['yes', 'no'])` doesn't accept empty strings.

### Evidence Supporting This Hypothesis

1. **Schema Definition (types/schemas.ts:44)**
   ```typescript
   hasDate: z.enum(['yes', 'no'])  // No .optional(), no .nullable()
   ```
   This is STRICT - only accepts exactly "yes" or "no"

2. **Frontend Form State (MirrorExperience.tsx:55-62)**
   ```typescript
   const [formData, setFormData] = useState<FormData>({
     dream: '',
     plan: '',
     hasDate: '',      // ← EMPTY STRING by default
     dreamDate: '',
     relationship: '',
     offering: '',
   });
   ```

3. **Database Constraint (migrations/20250121000000_initial_schema.sql:68)**
   ```sql
   has_date TEXT NOT NULL CHECK (has_date IN ('yes', 'no'))
   ```

4. **Multi-Step Flow Complexity (MirrorExperience.tsx:43)**
   ```typescript
   const [currentStep, setCurrentStep] = useState(dreamIdFromUrl ? 1 : 0);
   // Steps: 0 = dream selection, 1-5 = questions, 6 = tone
   ```
   7 steps create opportunities for state management bugs

5. **Question Configuration (MirrorExperience.tsx:138-142)**
   ```typescript
   {
     id: 'hasDate',
     text: 'Do you have a timeline in mind?',
     type: 'choice' as const,
     choices: ['yes', 'no'],
   }
   ```
   This is rendered as buttons/choices, but if user clicks "next" without selecting, `hasDate` remains `""`

---

## Discoveries

### Architecture Analysis

**Reflection Creation Flow:**

```
1. USER ACTION
   └─ MirrorExperience.tsx (781 lines)
      ├─ Multi-step wizard (7 steps total)
      ├─ FormData state management
      └─ trpc.reflection.create.useMutation()

2. TRPC LAYER
   └─ app/api/trpc/[trpc]/route.ts
      ├─ fetchRequestHandler
      ├─ createContext (user from session)
      └─ appRouter

3. ROUTING
   └─ server/trpc/routers/_app.ts
      ├─ reflection: reflectionRouter (AI generation)
      └─ reflections: reflectionsRouter (CRUD)

4. VALIDATION & MIDDLEWARE
   └─ server/trpc/routers/reflection.ts:35-36
      ├─ .input(createReflectionSchema)  ← Zod validation
      └─ usageLimitedProcedure           ← Usage check

5. BUSINESS LOGIC
   └─ reflection.create mutation (lines 37-195)
      ├─ Extract input fields
      ├─ Build AI prompt
      ├─ Call Anthropic API
      ├─ Format response
      ├─ Insert to database
      └─ Update user counters

6. DATABASE
   └─ Supabase PostgreSQL
      ├─ Table: reflections
      └─ Constraint: has_date TEXT NOT NULL CHECK (...)
```

### Database Schema

**Reflections Table Structure:**
```sql
CREATE TABLE public.reflections (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL,
    
    -- Reflection Content (5 questions)
    dream TEXT NOT NULL,
    plan TEXT NOT NULL,
    has_date TEXT NOT NULL CHECK (has_date IN ('yes', 'no')),  ← STRICT
    dream_date DATE,                                            ← NULLABLE
    relationship TEXT NOT NULL,
    offering TEXT NOT NULL,
    
    -- AI Response
    ai_response TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'fusion',
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    word_count INTEGER,
    estimated_read_time INTEGER,
    title TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Observations:**
- `has_date` is **NOT NULL** with **CHECK constraint**
- `dream_date` is **NULLABLE** (can be NULL when has_date='no')
- This creates schema redundancy with `dreams.target_date`

### API Configuration

**ANTHROPIC_API_KEY Status:**
```bash
✓ Key present in .env.local
✓ Format: sk-ant-api03-[...]
✓ Lazy initialization pattern used (good practice)
```

**Environment Loading:**
```typescript
// server/trpc/routers/reflection.ts:15-24
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}
```

**Verdict:** API key configuration is correct and not the root cause.

### Middleware Analysis

**usageLimitedProcedure Chain:**
```typescript
// server/trpc/middleware.ts:55-83
export const usageLimitedProcedure = publicProcedure
  .use(isAuthed)           // 1. Check user authenticated
  .use(checkUsageLimit);   // 2. Check tier limits

// Tier limits (lines 66-70)
const TIER_LIMITS = {
  free: 1,
  essential: 5,
  premium: 10,
};

// Creators/admins bypass (lines 62-64)
if (ctx.user.isCreator || ctx.user.isAdmin) {
  return next({ ctx: { ...ctx, user: ctx.user } });
}
```

**Verdict:** Middleware is functioning correctly. Not the root cause.

---

## Complexity Assessment

### High Complexity Areas

**1. MirrorExperience.tsx Multi-Step Flow**
- **Complexity:** HIGH
- **Lines of Code:** 781
- **State Variables:** 8+ (currentStep, formData, selectedDreamId, selectedTone, etc.)
- **Conditional Rendering:** Dynamic question list based on formData.hasDate
- **Why Complex:**
  - 7 steps with navigation (back/next)
  - Conditional questions (dreamDate only shows if hasDate='yes')
  - State synchronization across steps
  - URL parameter handling (dreamId, reflectionId)
  - View mode switching (questionnaire/output)
- **Risk:** State management bugs where formData.hasDate doesn't get set

**2. Schema Validation Strictness**
- **Complexity:** MEDIUM
- **Why Complex:**
  - Zod enum validation is strict (no coercion)
  - Empty strings, undefined, null all rejected
  - Frontend must ensure exact match ("yes" or "no")
- **Risk:** Any deviation causes 400 error with cryptic message

**3. Database Insertion with Constraints**
- **Complexity:** MEDIUM
- **Why Complex:**
  - Multiple NOT NULL constraints
  - CHECK constraints on enums
  - Foreign key to dreams table
  - Trigger functions updating counters
- **Risk:** If Zod validation is bypassed somehow, database will reject

### Medium Complexity Areas

**1. Anthropic API Integration**
- **Complexity:** MEDIUM (but working correctly)
- **Current Implementation:**
  - Lazy initialization
  - Error handling
  - Premium vs standard model selection
  - Extended thinking for premium users
- **Not the root cause** of 400 errors

**2. Prompt Building**
- **Complexity:** MEDIUM
- **Files:** server/lib/prompts.ts
- **Works correctly** - not related to 400 error

### Low Complexity Areas

**1. tRPC Router Configuration**
- **Complexity:** LOW
- **Well-structured** - not the issue

**2. Context Creation**
- **Complexity:** LOW
- **Session handling works** - users can authenticate

---

## Integration Points

### Critical Integration: Frontend → tRPC → Database

**Failure Point Identified:**

```typescript
// MirrorExperience.tsx:112-121 (handleSubmit)
createReflection.mutate({
  dreamId: selectedDreamId,
  dream: formData.dream,
  plan: formData.plan,
  hasDate: formData.hasDate as 'yes' | 'no',  // ← TYPE ASSERTION (dangerous!)
  dreamDate: formData.dreamDate || null,
  relationship: formData.relationship,
  offering: formData.offering,
  tone: selectedTone,
});
```

**The Bug:**
- `formData.hasDate` is typed as `string` (initialized to `""`)
- Type assertion `as 'yes' | 'no'` bypasses TypeScript checking
- If `formData.hasDate === ""`, it gets sent to tRPC
- Zod validation rejects it: `z.enum(['yes', 'no'])` doesn't accept `""`
- Result: 400 BAD_REQUEST

**Why This Happens:**
1. User lands on step 3 (hasDate question)
2. Question shows two buttons: "yes" and "no"
3. User doesn't click either button
4. User clicks "Next" (or form auto-advances somehow)
5. `formData.hasDate` remains `""`
6. Form submission proceeds (no client-side validation blocking it)
7. tRPC receives payload with `hasDate: ""`
8. Zod throws BAD_REQUEST

---

## Risks & Challenges

### Technical Risks

**1. Type Assertion Masking Validation**
- **Risk:** `as 'yes' | 'no'` bypasses compile-time safety
- **Impact:** HIGH - allows invalid data to reach tRPC
- **Mitigation:** Remove type assertion, add runtime validation before submission

**2. Empty String Default State**
- **Risk:** `hasDate: ''` in initial formData state
- **Impact:** HIGH - doesn't match schema expectation
- **Mitigation:** Change to `hasDate: 'no'` as default, or enforce selection

**3. Multi-Step State Complexity**
- **Risk:** User can navigate between steps, leave fields incomplete
- **Impact:** MEDIUM - creates unpredictable submission states
- **Mitigation:** Add step-level validation before allowing "next"

**4. Schema Redundancy**
- **Risk:** `reflections.has_date` + `reflections.dream_date` vs `dreams.target_date`
- **Impact:** LOW (architectural) - data duplication
- **Mitigation:** Plan-4 should remove these fields (vision specifies this)

### Complexity Risks

**1. 781-Line Component Refactor Required**
- **Risk:** High-complexity component needs major restructuring
- **Impact:** HIGH - easy to introduce new bugs
- **Mitigation:** Incremental refactor with test at each step

**2. Plan-4 Vision Calls for Removing hasDate Question**
- **Risk:** If we fix the bug now, we'll delete the code in iteration 1
- **Impact:** MEDIUM - wasted effort
- **Mitigation:** **FIX NOW, REFACTOR LATER** - get it working first

---

## Step-by-Step Debugging Strategy

### Phase 1: Confirm Root Cause (1 hour)

**Step 1: Add Debug Logging**
```typescript
// In MirrorExperience.tsx:106 (handleSubmit function)
const handleSubmit = () => {
  console.log('🔍 DEBUG: Form submission attempted');
  console.log('📊 FormData state:', formData);
  console.log('🎯 hasDate value:', formData.hasDate, 'type:', typeof formData.hasDate);
  
  if (!selectedDreamId) {
    toast.warning('Please select a dream');
    return;
  }
  
  // Add validation before mutation
  if (!formData.hasDate || !['yes', 'no'].includes(formData.hasDate)) {
    console.error('❌ hasDate validation failed:', formData.hasDate);
    toast.error('Please answer whether you have a timeline');
    return;
  }
  
  setIsSubmitting(true);
  createReflection.mutate({
    dreamId: selectedDreamId,
    dream: formData.dream,
    plan: formData.plan,
    hasDate: formData.hasDate as 'yes' | 'no',
    dreamDate: formData.dreamDate || null,
    relationship: formData.relationship,
    offering: formData.offering,
    tone: selectedTone,
  });
};
```

**Step 2: Add Server-Side Logging**
```typescript
// In server/trpc/routers/reflection.ts:37 (mutation start)
.mutation(async ({ ctx, input }) => {
  console.log('🔍 Reflection.create called');
  console.log('📥 Input received:', JSON.stringify(input, null, 2));
  console.log('👤 User:', ctx.user.email, 'Tier:', ctx.user.tier);
  
  const { dreamId, dream, plan, hasDate, dreamDate, relationship, offering, tone, isPremium } = input;
  
  console.log('🎯 hasDate value:', hasDate, 'type:', typeof hasDate);
  // ... rest of mutation
```

**Step 3: Reproduce Error**
1. Start dev server: `npm run dev`
2. Navigate to `/reflection`
3. Select a dream
4. Fill step 1 (dream question)
5. Fill step 2 (plan question)
6. **Skip step 3** (hasDate) - don't click yes or no
7. Fill remaining steps
8. Click submit
9. Observe console logs and network tab

**Expected Result:**
- Console shows `hasDate: ""` or `hasDate: undefined`
- Network tab shows 400 error
- Confirms root cause

### Phase 2: Implement Quick Fix (1 hour)

**Option A: Client-Side Validation (Recommended)**
```typescript
// In MirrorExperience.tsx:106
const handleSubmit = () => {
  // Validate all required fields
  if (!formData.dream.trim()) {
    toast.warning('Please describe your dream');
    return;
  }
  if (!formData.plan.trim()) {
    toast.warning('Please describe your plan');
    return;
  }
  if (!formData.hasDate || !['yes', 'no'].includes(formData.hasDate)) {
    toast.warning('Please answer whether you have a timeline');
    setCurrentStep(3); // Jump back to hasDate question
    return;
  }
  if (formData.hasDate === 'yes' && !formData.dreamDate?.trim()) {
    toast.warning('Please provide your target date');
    setCurrentStep(4); // Jump to dreamDate question
    return;
  }
  if (!formData.relationship.trim()) {
    toast.warning('Please describe your relationship with this dream');
    return;
  }
  if (!formData.offering.trim()) {
    toast.warning('Please describe what you\'re willing to give');
    return;
  }
  
  // All validation passed - proceed
  setIsSubmitting(true);
  createReflection.mutate({
    dreamId: selectedDreamId,
    dream: formData.dream,
    plan: formData.plan,
    hasDate: formData.hasDate as 'yes' | 'no',
    dreamDate: formData.dreamDate || null,
    relationship: formData.relationship,
    offering: formData.offering,
    tone: selectedTone,
  });
};
```

**Option B: Default Value Change**
```typescript
// In MirrorExperience.tsx:55
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  hasDate: 'no',  // ← Change default from '' to 'no'
  dreamDate: '',
  relationship: '',
  offering: '',
});
```

**Recommendation:** Use Option A (client-side validation) because it provides better UX and prevents submission of incomplete forms.

### Phase 3: Test Fix (1 hour)

**Test Cases:**

1. **Happy Path - User completes all steps**
   - ✓ Fill all questions
   - ✓ Select "yes" for hasDate
   - ✓ Provide dreamDate
   - ✓ Submit successfully

2. **Edge Case - User selects "no" for hasDate**
   - ✓ Fill questions
   - ✓ Select "no" for hasDate
   - ✓ Skip dreamDate (should be hidden)
   - ✓ Submit successfully

3. **Error Case - User skips hasDate**
   - ✓ Fill other questions
   - ✓ Don't click yes or no on hasDate
   - ✓ Try to submit
   - ✓ Should see validation error
   - ✓ Should NOT reach server

4. **Error Case - User provides date but selects "no"**
   - ✓ Verify conditional logic works
   - ✓ dreamDate sent as null when hasDate='no'

5. **Integration Test - Complete flow**
   - ✓ Create reflection end-to-end
   - ✓ Verify database record
   - ✓ Verify AI response generated
   - ✓ Verify user counters updated

### Phase 4: Plan-4 Refactor (Covered in Iteration 1)

**Note:** The quick fix above is temporary. Plan-4 Iteration 1 will:
- Remove hasDate and dreamDate questions entirely
- Simplify to 4 questions on one page
- Pull date from `dreams.target_date` instead
- Update schema to remove redundant fields

---

## Files That Need Modification

### Immediate Fix (Quick Fix)

**1. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`**
- **Change:** Add client-side validation in `handleSubmit()` (lines 106-122)
- **Lines affected:** ~20 lines
- **Priority:** CRITICAL
- **Estimated time:** 30 minutes

**2. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`**
- **Change:** Add debug logging (lines 37-48)
- **Lines affected:** ~10 lines
- **Priority:** HIGH (for debugging)
- **Estimated time:** 15 minutes

### Plan-4 Iteration 1 Refactor

**3. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`**
- **Change:** Remove `hasDate` and `dreamDate` from `createReflectionSchema` (line 44-45)
- **Lines affected:** 2 lines
- **Priority:** HIGH (iteration 1)
- **Estimated time:** 5 minutes

**4. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`**
- **Change:** Complete refactor to 4-question one-page flow
- **Lines affected:** 781 lines (entire component)
- **Priority:** HIGH (iteration 1)
- **Estimated time:** 5-6 hours

**5. `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts`**
- **Change:** Remove hasDate/dreamDate handling from mutation (lines 38-88)
- **Lines affected:** ~50 lines
- **Priority:** MEDIUM (iteration 1)
- **Estimated time:** 30 minutes

**6. Database Migration (Optional)**
```sql
-- Remove redundant columns from reflections table
ALTER TABLE reflections
  DROP COLUMN has_date,
  DROP COLUMN dream_date;
```
- **Priority:** LOW (can defer)
- **Risk:** Breaking change - requires careful migration
- **Recommendation:** Make columns NULLABLE first, then deprecate

---

## Schema Changes Required

### Immediate Changes (None Required)

The quick fix works with existing schema. No migrations needed immediately.

### Plan-4 Iteration 1 Changes (Recommended)

**Option 1: Make Columns Nullable (Safe Migration)**
```sql
-- Step 1: Make columns nullable (non-breaking)
ALTER TABLE reflections
  ALTER COLUMN has_date DROP NOT NULL,
  DROP CONSTRAINT reflections_has_date_check;

-- Step 2: Update existing records to NULL
UPDATE reflections
SET has_date = NULL, dream_date = NULL
WHERE has_date IS NOT NULL;

-- Step 3: Code no longer sends these fields
-- (handled in iteration 1 refactor)

-- Step 4: Drop columns after verification (later)
-- ALTER TABLE reflections
--   DROP COLUMN has_date,
--   DROP COLUMN dream_date;
```

**Option 2: Remove Columns Immediately (Breaking Change)**
```sql
-- Requires all code to be updated first
ALTER TABLE reflections
  DROP COLUMN has_date,
  DROP COLUMN dream_date;
```

**Recommendation:** Use Option 1 (phased approach) to minimize risk.

---

## Testing Approach to Verify Fix

### Unit Tests (Frontend)

```typescript
// tests/MirrorExperience.test.tsx
describe('MirrorExperience Form Validation', () => {
  it('should prevent submission when hasDate is empty', () => {
    // Setup component with empty hasDate
    // Attempt submission
    // Assert error message shown
    // Assert mutation not called
  });

  it('should allow submission when hasDate is "yes"', () => {
    // Setup component with hasDate="yes" and dreamDate filled
    // Attempt submission
    // Assert mutation called with correct data
  });

  it('should allow submission when hasDate is "no"', () => {
    // Setup component with hasDate="no"
    // Attempt submission
    // Assert dreamDate sent as null
    // Assert mutation called
  });
});
```

### Integration Tests (E2E)

```typescript
// e2e/reflection-creation.spec.ts
test('complete reflection flow with timeline', async ({ page }) => {
  await page.goto('/reflection');
  
  // Select dream
  await page.click('[data-testid="dream-select"]');
  await page.click('[data-testid="dream-option-0"]');
  
  // Fill questions
  await page.fill('[data-testid="dream-input"]', 'Test dream content');
  await page.click('[data-testid="next-button"]');
  
  await page.fill('[data-testid="plan-input"]', 'Test plan content');
  await page.click('[data-testid="next-button"]');
  
  // hasDate question - select yes
  await page.click('[data-testid="hasDate-yes"]');
  await page.click('[data-testid="next-button"]');
  
  await page.fill('[data-testid="dreamDate-input"]', 'December 2025');
  await page.click('[data-testid="next-button"]');
  
  await page.fill('[data-testid="relationship-input"]', 'Test relationship');
  await page.click('[data-testid="next-button"]');
  
  await page.fill('[data-testid="offering-input"]', 'Test offering');
  await page.click('[data-testid="next-button"]');
  
  // Tone selection
  await page.click('[data-testid="tone-fusion"]');
  
  // Submit
  await page.click('[data-testid="submit-button"]');
  
  // Wait for success
  await page.waitForURL(/\/reflection\?id=/);
  
  // Verify reflection shown
  await expect(page.locator('.mirror-reflection')).toBeVisible();
});

test('should show error when hasDate not selected', async ({ page }) => {
  await page.goto('/reflection');
  
  // Fill all questions EXCEPT hasDate
  // ... (similar to above but skip hasDate selection)
  
  // Attempt submission
  await page.click('[data-testid="submit-button"]');
  
  // Assert error shown
  await expect(page.locator('.toast-error')).toContainText('timeline');
  
  // Assert still on questionnaire
  await expect(page).toHaveURL('/reflection');
});
```

### Manual Testing Checklist

```markdown
## Manual Test Plan

### Setup
- [ ] Supabase running: `npx supabase status`
- [ ] Dev server running: `npm run dev`
- [ ] Logged in as: ahiya.butman@gmail.com
- [ ] Browser console open (watch for errors)
- [ ] Network tab open (watch for 400 errors)

### Test Case 1: Happy Path (hasDate = yes)
- [ ] Navigate to /reflection
- [ ] Select dream from list
- [ ] Fill Q1 (dream): "Testing reflection creation with timeline"
- [ ] Click Next
- [ ] Fill Q2 (plan): "Complete testing by end of day"
- [ ] Click Next
- [ ] **Click "yes" on hasDate question**
- [ ] Click Next
- [ ] Fill dreamDate: "December 31, 2025"
- [ ] Click Next
- [ ] Fill Q4 (relationship): "Excited to test this feature"
- [ ] Click Next
- [ ] Fill Q5 (offering): "My time and attention"
- [ ] Click Next
- [ ] Select tone: Fusion
- [ ] Click "Gaze into the Mirror"
- [ ] **Expected:** Success, redirected to /reflection?id=[uuid]
- [ ] **Expected:** AI response shown
- [ ] **Expected:** No 400 error in network tab

### Test Case 2: Happy Path (hasDate = no)
- [ ] Repeat above but click "no" on hasDate
- [ ] **Expected:** dreamDate question skipped
- [ ] **Expected:** Submission succeeds
- [ ] **Expected:** Database record has has_date='no', dream_date=NULL

### Test Case 3: Error Case (hasDate skipped)
- [ ] Navigate to /reflection
- [ ] Select dream
- [ ] Fill Q1, Q2
- [ ] **Skip hasDate question** - don't click yes or no
- [ ] Try to click Next (or if it allows, continue to end)
- [ ] Click submit
- [ ] **Expected:** Error toast: "Please answer whether you have a timeline"
- [ ] **Expected:** Form jumps back to hasDate question (step 3)
- [ ] **Expected:** NO network request sent

### Test Case 4: Verify Database
- [ ] After successful submission, check database:
```sql
SELECT id, dream, has_date, dream_date, created_at
FROM reflections
WHERE user_id = (SELECT id FROM users WHERE email = 'ahiya.butman@gmail.com')
ORDER BY created_at DESC
LIMIT 1;
```
- [ ] **Expected:** Record exists
- [ ] **Expected:** has_date is 'yes' or 'no'
- [ ] **Expected:** dream_date matches input (or NULL if has_date='no')
```

---

## Recommendations for Planner

### 1. **Implement Quick Fix Before Iteration 1 Refactor**

**Rationale:**
- Users can't create reflections right now (core functionality broken)
- Quick fix takes 1-2 hours, unblocks testing
- Provides working baseline before major refactor
- Validates root cause hypothesis

**Action:**
- Builder should implement client-side validation first
- Test with manual checklist above
- Verify 400 errors disappear
- Then proceed with iteration 1 refactor

### 2. **Add Test Data Attributes for E2E Tests**

**Problem:** Current components lack `data-testid` attributes
**Impact:** E2E tests will be brittle (relying on CSS selectors)
**Solution:** Add test IDs during iteration 1 refactor

```tsx
// Example
<input
  data-testid="dream-input"
  name="dream"
  value={formData.dream}
  onChange={(e) => handleFieldChange('dream', e.target.value)}
/>
```

### 3. **Schema Migration Strategy**

**Phase 1 (Iteration 1):**
- Update code to not send hasDate/dreamDate
- Make columns NULLABLE in database

**Phase 2 (Post-iteration 1):**
- Verify no errors for 24-48 hours
- Drop columns from database
- Remove from TypeScript types entirely

**Phase 3 (Future):**
- Add automated tests to prevent regression

### 4. **Error Logging Enhancement**

**Current State:** tRPC errors are generic
**Problem:** 400 errors don't indicate which field failed validation
**Solution:** Enhanced error messages

```typescript
// In server/trpc/routers/reflection.ts
try {
  const validation = createReflectionSchema.safeParse(input);
  if (!validation.success) {
    console.error('Validation failed:', validation.error.format());
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Validation error: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    });
  }
  // ... proceed with mutation
} catch (error) {
  // ...
}
```

### 5. **Documentation for Builders**

**Create:** `/docs/debugging-reflection-errors.md`
**Content:**
- Common 400 error causes
- How to use browser dev tools
- How to read tRPC error messages
- Database constraint explanations

### 6. **Monitoring After Fix**

**Add logging:**
```typescript
// Track success rate
console.log(`✅ Reflection created: ${reflectionRecord.id}`);

// Track validation failures
console.log(`❌ Validation failed:`, error.message);
```

**Monitor for:**
- Are 400 errors gone?
- Any new error patterns?
- Submission success rate

---

## Questions for Planner

### Q1: Should we fix the bug before refactoring?

**Recommendation:** YES

**Reasoning:**
- Users can't create reflections now (critical blocker)
- Quick fix is 1-2 hours
- Validates our hypothesis
- Provides working baseline for iteration 1 testing

### Q2: Should we migrate database immediately or defer?

**Recommendation:** DEFER column removal to post-iteration 1

**Reasoning:**
- Safer to verify code changes first
- Making columns nullable is low-risk
- Dropping columns is irreversible
- Better to test in production-like environment first

### Q3: Should we add comprehensive error handling now or later?

**Recommendation:** BASIC NOW, COMPREHENSIVE LATER

**Basic (Now):**
- Client-side validation in handleSubmit
- Clear error messages

**Comprehensive (Later):**
- Zod error parsing and formatting
- Field-level error display
- Network error recovery
- Retry logic

### Q4: Should we write tests during iteration 1 or after?

**Recommendation:** DURING (at least integration tests)

**Reasoning:**
- Refactor is high-risk (781 lines)
- Tests catch regressions immediately
- Easier to fix bugs during development
- Validates acceptance criteria

### Q5: What's the priority: fix bug or start refactor?

**Recommendation:** FIX BUG FIRST (1-2 hours), THEN REFACTOR

**Timeline:**
```
Hour 0-2:   Quick fix + validation + testing
Hour 2-8:   Iteration 1 refactor (4-question one-page flow)
Hour 8-10:  Integration testing
Hour 10-12: Buffer for issues
```

---

## Resource Map

### Critical Files for Debugging

**1. Frontend (Reflection Creation)**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx` (781 lines)
  - Line 55-62: Initial formData state
  - Line 106-122: handleSubmit function
  - Line 124-158: Questions configuration
  - Purpose: Multi-step reflection questionnaire

**2. Schema Validation**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/types/schemas.ts`
  - Line 40-50: createReflectionSchema
  - Line 44: `hasDate: z.enum(['yes', 'no'])` - STRICT validation
  - Line 45: `dreamDate: z.string().nullable()`
  - Purpose: tRPC input validation

**3. Backend Mutation**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/routers/reflection.ts` (253 lines)
  - Line 35-36: Procedure definition with input validation
  - Line 38-48: Input destructuring and variable setup
  - Line 76-88: User prompt building (includes hasDate in prompt)
  - Line 133-153: Database insertion
  - Line 140-141: `has_date: hasDate, dream_date: hasDate === 'yes' ? dreamDate : null`
  - Purpose: AI reflection generation and database storage

**4. Middleware**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/server/trpc/middleware.ts`
  - Line 55-83: checkUsageLimit middleware
  - Line 66-70: Tier limits configuration
  - Purpose: Usage limit enforcement

**5. Database Migrations**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20250121000000_initial_schema.sql`
  - Line 59-90: Reflections table definition
  - Line 68: `has_date TEXT NOT NULL CHECK (has_date IN ('yes', 'no'))`
  - Line 69: `dream_date DATE`
  - Purpose: Database schema constraints

**6. Dreams Migration (For Context)**
- `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/supabase/migrations/20251022200000_add_dreams_feature.sql`
  - Line 18: `target_date DATE` - This is what reflections SHOULD use
  - Purpose: Dreams feature (added later, creates redundancy)

### Key Dependencies

**1. Zod (Schema Validation)**
- **Package:** `zod`
- **Purpose:** Type-safe schema validation for tRPC
- **Critical:** `z.enum()` is strict, no coercion
- **Documentation:** https://zod.dev

**2. tRPC**
- **Package:** `@trpc/server`, `@trpc/client`, `@trpc/react-query`
- **Purpose:** End-to-end type-safe APIs
- **Critical:** Validation happens before mutation execution
- **Version:** Latest (check package.json)

**3. Anthropic SDK**
- **Package:** `@anthropic-ai/sdk`
- **Purpose:** Claude API integration
- **Model:** `claude-sonnet-4-5-20250929`
- **Critical:** API key must be valid
- **Configuration:** Lazy initialization pattern (good practice)

**4. Supabase Client**
- **Package:** `@supabase/supabase-js`
- **Purpose:** PostgreSQL database client
- **Configuration:** Local instance on port 54331 (API), 54322 (DB)
- **Critical:** Connection must be active

**5. React Query (via tRPC)**
- **Package:** `@tanstack/react-query`
- **Purpose:** Data fetching and caching
- **Used by:** tRPC hooks (useMutation, useQuery)

### Testing Infrastructure

**Current State:**
- No E2E tests found for reflection creation
- No unit tests for form validation
- Manual testing only

**Recommended Testing Stack:**
1. **Playwright** - E2E testing
2. **Vitest** - Unit testing (faster than Jest for Vite projects)
3. **Testing Library** - React component testing
4. **MSW** - API mocking for isolated tests

**Priority Tests to Add:**
1. Form validation (unit tests)
2. Reflection creation flow (E2E)
3. Error handling (integration)
4. tRPC mutation (integration with mock API)

---

## Appendix: Error Flow Diagram

```
USER FILLS FORM
    │
    ├─ Step 1: dream ✓
    ├─ Step 2: plan ✓
    ├─ Step 3: hasDate ❌ (skipped or empty)
    ├─ Step 4: dreamDate (conditional)
    ├─ Step 5: relationship ✓
    ├─ Step 6: offering ✓
    └─ Step 7: tone ✓
    │
    ↓
SUBMIT CLICKED (handleSubmit)
    │
    ├─ Check selectedDreamId ✓
    ├─ Type assertion: hasDate as 'yes' | 'no' (bypasses TS check)
    └─ Call createReflection.mutate({ hasDate: "" })
    │
    ↓
TRPC CLIENT (app/api/trpc/[trpc]/route.ts)
    │
    ├─ Serialize payload
    ├─ Send POST to /api/trpc/reflection.create
    └─ Include session cookie
    │
    ↓
TRPC SERVER (server/trpc/routers/reflection.ts)
    │
    ├─ createContext: Extract user from session
    ├─ .input(createReflectionSchema): Zod validation
    │   └─ z.enum(['yes', 'no']).parse("") ❌ FAILS
    │
    ├─ Throw TRPCError({
    │     code: 'BAD_REQUEST',  // ← 400 STATUS
    │     message: 'Invalid enum value...'
    │   })
    │
    ↓
RESPONSE TO CLIENT
    │
    ├─ Status: 400 Bad Request
    ├─ Error message shown in toast
    └─ User sees generic error (doesn't know which field failed)

ALTERNATIVE FLOW (if Zod passes but DB fails):
    │
    ↓
DATABASE INSERT
    │
    ├─ Supabase.from('reflections').insert({ has_date: "" })
    ├─ PostgreSQL CHECK constraint fails
    │   └─ CHECK (has_date IN ('yes', 'no'))
    │
    ├─ Database error: "new row for relation violates check constraint"
    │
    └─ Bubbles up as 500 or 400 to client
```

---

## Next Steps Summary

### For Builder (Iteration 1)

**Phase 1: Quick Fix (Hours 1-2)**
1. Add debug logging to MirrorExperience.tsx and reflection.ts
2. Implement client-side validation in handleSubmit
3. Test with manual checklist
4. Verify 400 errors disappear

**Phase 2: Refactor to 4-Question Flow (Hours 2-8)**
1. Remove multi-step state management
2. Display all 4 questions on one page
3. Remove hasDate and dreamDate questions
4. Update mutation call to not send these fields
5. Test complete flow

**Phase 3: Schema Update (Hours 8-10)**
1. Create migration to make has_date and dream_date nullable
2. Test with both old and new code
3. Verify no errors

**Phase 4: Validation (Hours 10-12)**
1. Manual testing (all test cases)
2. Integration testing (if time allows)
3. Document any issues
4. Handoff to validator

### For Planner

**Decisions Needed:**
1. Approve quick fix approach?
2. Approve phased migration strategy?
3. Prioritize E2E tests during or after iteration 1?
4. Allocate buffer time for unexpected issues?

**Resources Needed:**
- Builder with React/TypeScript experience
- Access to local Supabase instance
- Time: 10-14 hours total

---

**Report Status:** COMPLETE
**Confidence Level:** 85% on root cause hypothesis
**Ready for:** Builder execution
**Estimated Fix Time:** 10-14 hours (including refactor)
