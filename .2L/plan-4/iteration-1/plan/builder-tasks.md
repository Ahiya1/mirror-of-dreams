# Builder Task Breakdown - Plan-4 Iteration 1

## Overview

**3 primary builders** will work in **sequence** (not parallel) due to dependencies.

**Estimated Total Time:** 10-14 hours
- Builder 1: 4-5 hours (API fix + schema updates)
- Builder 2: 4-5 hours (component refactor) - **Depends on Builder 1**
- Builder 3: 1-2 hours (integration testing) - **Depends on Builders 1 & 2**

**Builder Assignment Strategy:**
- **Sequential execution** to prevent merge conflicts
- **Clear file ownership** - no concurrent edits
- **Explicit handoff points** - Builder 1 completes before Builder 2 starts
- **Integration builder** validates everything works together

**Complexity Assessment:**
- Builder 1: **HIGH** (debugging unknown root cause, critical API integration)
- Builder 2: **HIGH** (781-line component refactor, major UX transformation)
- Builder 3: **MEDIUM** (comprehensive testing, edge case validation)

---

## Builder-1: Fix Reflection API & Update Schema

### Scope

**Objective:** Debug and fix the 400 error preventing reflection creation, then update schema to remove redundant date fields.

**Primary Responsibility:**
- Identify and resolve root cause of reflection creation failure
- Update Zod schema to remove `hasDate` and `dreamDate` fields
- Update reflection router mutation to handle 4-question format
- Simplify AI prompt to 4 questions only
- Test Anthropic API integration end-to-end

**Files Owned by This Builder:**
- `types/schemas.ts` (schema definition)
- `server/trpc/routers/reflection.ts` (mutation logic)

### Complexity Estimate

**HIGH**

**Reasoning:**
1. **Root cause unknown** - Explorer hypothesis (85% confidence) may be incomplete
2. **Critical API integration** - Anthropic API must work perfectly
3. **Schema synchronization** - Client/server must stay in sync
4. **Database constraints** - Must handle existing records safely
5. **Time-sensitive debugging** - Allocated 2-hour buffer for unexpected issues

**Recommended Approach:**
- Start with debug logging to confirm hypothesis
- Implement quick fix first (client-side validation)
- Then proceed with schema cleanup
- Test incrementally (don't wait until end)

### Success Criteria

- [x] **400 Error Resolved**
  - Reflection creation succeeds without errors
  - Root cause identified and documented
  - Test: Create 3 reflections with varied inputs (yes date, no date, max characters)

- [x] **Schema Updated**
  - `createReflectionSchema` no longer includes `hasDate` or `dreamDate`
  - TypeScript types exported and correct
  - Test: Import schema in another file, verify type inference

- [x] **Mutation Updated**
  - Reflection router doesn't expect removed fields
  - Database insert doesn't send removed fields
  - AI prompt simplified to 4 questions
  - Test: API call succeeds, database record correct

- [x] **Logging Added**
  - Debug logs at key points (input received, API call, database insert, completion)
  - Error logs with context (user ID, input data, error message)
  - Test: Console shows clear progression during reflection creation

- [x] **API Integration Verified**
  - Anthropic client initialized correctly
  - API key loaded from environment
  - Response extracted and formatted
  - Test: AI response references user's actual answers

### Files to Create/Modify

**1. `types/schemas.ts`** (Modify)
- **Purpose:** Update createReflectionSchema to remove date fields
- **Lines to change:** ~10 lines (lines 40-50)
- **Changes:**
  - Remove `hasDate: z.enum(['yes', 'no'])`
  - Remove `dreamDate: z.string().nullable()`
  - Verify all other fields remain
  - Export updated type

**2. `server/trpc/routers/reflection.ts`** (Modify)
- **Purpose:** Update mutation to handle 4-question format
- **Lines to change:** ~50 lines (spread across file)
- **Changes:**
  - **Line 38-48:** Remove `hasDate`, `dreamDate` from destructuring
  - **Line 76-88:** Simplify AI prompt (remove date question)
  - **Line 133-151:** Remove `has_date`, `dream_date` from database insert
  - **Add:** Debug logging throughout (10-15 new log statements)
  - **Optional:** Add dream context to prompt (title, target_date)

**3. Debug Logging (New Pattern)**
- **Purpose:** Add comprehensive logging for debugging
- **Locations:**
  - Start of mutation (input received)
  - Before Anthropic API call (prompt preview)
  - After API call (response length)
  - Before database insert (record preview)
  - After successful creation (reflection ID)
  - In error handlers (full error object)

### Dependencies

**Depends on:** None (first builder to execute)

**Blocks:**
- Builder 2 (needs schema updates before refactoring component)
- Builder 3 (needs working API before testing)

### Implementation Notes

**Root Cause Debugging Strategy:**

1. **Add Debug Logging (30 min)**
   ```typescript
   // In MirrorExperience.tsx handleSubmit
   console.log('🔍 Form submission attempted');
   console.log('📊 FormData state:', formData);
   console.log('🎯 hasDate value:', formData.hasDate, 'type:', typeof formData.hasDate);

   // In reflection.ts mutation
   console.log('🔍 Reflection.create called');
   console.log('📥 Input received:', JSON.stringify(input, null, 2));
   console.log('👤 User:', ctx.user.email, 'Tier:', ctx.user.tier);
   ```

2. **Reproduce Error (15 min)**
   - Start dev server
   - Navigate to /reflection
   - Select dream
   - Fill questions BUT skip hasDate step
   - Submit and observe console/network tab

3. **Confirm Hypothesis (15 min)**
   - Check if `hasDate === ""` in console
   - Check network tab for 400 error response
   - Check if Zod validation error mentions "enum"

4. **Implement Quick Fix (1 hour)**
   - Add client-side validation in `handleSubmit()`
   - Validate all fields before mutation call
   - Test: Submit with empty fields → validation error shown, no API call

5. **Schema Cleanup (1 hour)**
   - Update `types/schemas.ts`
   - Update `reflection.ts` mutation
   - Update AI prompt
   - Test: Create reflection with new schema

6. **End-to-End Testing (1 hour)**
   - Test reflection creation (all 4 questions)
   - Verify database record (no has_date/dream_date)
   - Check AI response quality
   - Test error handling (empty fields, network errors)

**Gotchas to Watch:**
- **Type assertions in client code** - `as 'yes' | 'no'` bypasses validation
- **Empty string vs undefined** - Zod treats these differently
- **Database constraints** - CHECK constraints may fail even if Zod passes
- **Anthropic API rate limits** - Test with multiple calls to verify no quota issues

**Handoff to Builder 2:**
- Commit schema changes to separate branch
- Document what changed (changelog comment)
- Verify all tests pass
- Notify Builder 2 that schema is updated

### Patterns to Follow

Reference `patterns.md` sections:
- **Schema Patterns → Zod Schema Definition** (for updating createReflectionSchema)
- **tRPC API Patterns → Mutation with Input Validation** (for reflection.create)
- **Error Handling Patterns → API Error Handling** (for Anthropic integration)
- **Performance Patterns → Lazy API Client Initialization** (for Anthropic client)
- **Code Quality Standards → Logging Convention** (for debug logs)

### Testing Requirements

**Unit Testing (Manual):**
- Schema validation accepts valid 4-question input
- Schema validation rejects missing fields
- Mutation successfully calls Anthropic API
- Database insert creates record with correct fields

**Integration Testing:**
- End-to-end reflection creation flow
- Error handling (validation errors, API errors, database errors)
- Multiple reflections on same dream
- Premium vs standard tier behavior

**Test Coverage Target:** 100% of critical path (creation flow)

### Potential Split Strategy

**IF** debugging takes longer than 2 hours, consider split:

**Foundation (Builder 1A - 2 hours):**
- Add debug logging throughout
- Reproduce and document error
- Identify exact root cause

**Schema Update (Builder 1B - 2 hours):**
- Update types/schemas.ts
- Update reflection router
- Test end-to-end

**Recommendation:** Only split if debugging reveals complex issue (e.g., middleware problem, database migration needed, etc.)

---

## Builder-2: Transform MirrorExperience to One-Page Flow

### Scope

**Objective:** Refactor the 781-line MirrorExperience component from a 7-step wizard to a single-page, 4-question reflection form.

**Primary Responsibility:**
- Remove multi-step navigation state management
- Display all 4 questions simultaneously (scrollable)
- Update question text to reference selected dream by name
- Move tone selection to bottom of page
- Remove ProgressOrbs component usage
- Consolidate to single submit button
- Ensure mobile responsiveness

**Files Owned by This Builder:**
- `app/reflection/MirrorExperience.tsx` (complete refactor)

### Complexity Estimate

**HIGH**

**Reasoning:**
1. **Large component** - 781 lines with complex state management
2. **Multi-step removal** - Touches navigation, rendering, validation logic
3. **UX transformation** - Major change to user experience
4. **State simplification** - Remove `currentStep`, conditional questions
5. **Responsive design** - Must work on mobile (scrolling, keyboard handling)

**Estimated Lines Changed:**
- **Remove:** ~300 lines (step navigation, ProgressOrbs, conditional rendering)
- **Add:** ~150 lines (one-page layout, dream contextualization)
- **Net change:** -150 lines (781 → ~630 lines)

### Success Criteria

- [x] **Multi-Step Navigation Removed**
  - No `currentStep` state variable
  - No `handleNext()` or `handleBack()` functions
  - No ProgressOrbs component
  - Test: Component code doesn't reference "step" anywhere

- [x] **One-Page Layout Implemented**
  - All 4 questions visible simultaneously
  - Scrollable container for long form
  - Questions numbered (1-4)
  - Single submit button at bottom
  - Test: User sees all 4 textareas without clicking

- [x] **Questions Contextualized**
  - Question text references selected dream by name
  - Example: "What is your plan for **Dream Title**?"
  - Dream context visible (title, days left)
  - Test: Questions show dream name, not generic "this dream"

- [x] **Tone Selection Repositioned**
  - Moved to bottom of page (after all questions)
  - Grid layout (3 columns on desktop, 1 on mobile)
  - Visual feedback for selected tone
  - Test: Tone cards visible without scrolling, stack on mobile

- [x] **Form Validation Updated**
  - All-at-once validation on submit
  - Specific error messages for each field
  - No step-by-step validation
  - Test: Submit with empty field → clear error message shown

- [x] **Mobile Responsive**
  - Smooth scrolling on iPhone/iPad
  - Tone cards stack vertically on small screens
  - Submit button always accessible
  - Keyboard doesn't obscure inputs
  - Test: Complete reflection on iPhone SE (375px width)

### Files to Create/Modify

**1. `app/reflection/MirrorExperience.tsx`** (Complete Refactor)
- **Purpose:** Transform to one-page flow
- **Lines to change:** ~400 lines (major refactor)
- **Changes:**
  - **Remove:** `currentStep` state, `handleNext()`, `handleBack()`
  - **Remove:** `ProgressOrbs` import and usage
  - **Remove:** Conditional question rendering (dreamDate if hasDate='yes')
  - **Update:** `FormData` interface (remove `hasDate`, `dreamDate`)
  - **Update:** Questions array (4 questions, contextualized text)
  - **Add:** `selectedDream` state (store full dream object)
  - **Add:** Dream context display at top of form
  - **Update:** Render logic (all questions visible, one-page layout)
  - **Update:** `handleSubmit()` validation (all 4 fields)
  - **Update:** Mutation call (remove `hasDate`, `dreamDate` from payload)

### Dependencies

**Depends on:**
- **Builder 1** - Schema must be updated first (createReflectionSchema)
- **Builder 1** - Mutation must handle 4-question format

**Blocks:**
- **Builder 3** - Integration testing needs working component

**Coordination:**
- Wait for Builder 1 to commit schema changes
- Pull latest code before starting refactor
- Test against updated API endpoint

### Implementation Notes

**Refactoring Strategy (Incremental, Not Big-Bang):**

1. **Prepare New Structure (1 hour)**
   - Update `FormData` interface
   - Update questions array (4 questions, no conditional logic)
   - Add `selectedDream` state
   - Test: Component still compiles

2. **Remove Step Navigation (1 hour)**
   - Comment out `currentStep` state
   - Comment out `handleNext()`, `handleBack()`
   - Remove ProgressOrbs import
   - Test: Component still renders (may be broken, but compiles)

3. **Flatten Render Logic (2 hours)**
   - Replace step-based conditionals with one-page layout
   - All 4 questions visible in `space-y-8` container
   - Move tone selection to bottom
   - Update submit button (no "Continue" button)
   - Test: UI renders all questions, no navigation buttons

4. **Update Validation (30 min)**
   - Remove per-step validation in `handleNext()`
   - Add comprehensive validation in `handleSubmit()`
   - Test: Validation prevents submission with empty fields

5. **Update Mutation Call (15 min)**
   - Remove `hasDate`, `dreamDate` from mutation payload
   - Verify destructuring matches new schema
   - Test: Mutation call succeeds

6. **Polish & Test (1 hour)**
   - Add dream context display
   - Update question text to reference dream name
   - Test mobile responsiveness
   - Fix any visual issues

**State Management Changes:**

```typescript
// BEFORE (Multi-Step)
const [currentStep, setCurrentStep] = useState(dreamIdFromUrl ? 1 : 0);
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  hasDate: '',        // ← REMOVE
  dreamDate: '',      // ← REMOVE
  relationship: '',
  offering: '',
});

// AFTER (One-Page)
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
});
const [selectedDream, setSelectedDream] = useState<Dream | null>(null); // ← ADD
```

**Render Logic Changes:**

```typescript
// BEFORE (Step-Based)
{currentStep === 0 ? <DreamSelection /> :
 currentStep <= 5 ? <QuestionView /> :
 <ToneSelection />}

// AFTER (One-Page)
{!selectedDreamId ? (
  <DreamSelection />
) : (
  <div className="one-page-form">
    {/* All 4 questions */}
    <div className="space-y-8">
      <QuestionInput field="dream" />
      <QuestionInput field="plan" />
      <QuestionInput field="relationship" />
      <QuestionInput field="offering" />
    </div>

    {/* Tone selection */}
    <ToneSelection />

    {/* Submit button */}
    <GlowButton onClick={handleSubmit}>
      Gaze into the Mirror
    </GlowButton>
  </div>
)}
```

**Mobile Responsiveness:**

```css
/* Scrollable container */
.one-page-form {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
}

/* Tone grid responsive */
.tone-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tone-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Gotchas to Watch:**
- **ProgressOrbs removal** - May be imported but not used (check)
- **AnimatePresence** - Used for step transitions, can be removed
- **Conditional question logic** - Ensure all references to `hasDate` removed
- **Type assertion** - Remove `as 'yes' | 'no'` type assertion in mutation call
- **View mode switching** - Keep questionnaire/output toggle (don't remove)

**Handoff to Builder 3:**
- Commit component refactor to branch
- Document all changes (what was removed, what was added)
- Test locally (manual testing checklist)
- Notify Builder 3 that component is ready for integration testing

### Patterns to Follow

Reference `patterns.md` sections:
- **Frontend Patterns → React Component Structure** (for component architecture)
- **Form Handling Pattern** (for form state management)
- **Error Handling Patterns → API Error Handling** (for mutation error handling)
- **Import Order Convention** (for clean imports)
- **Code Quality Standards → TypeScript Strictness** (for type safety)

### Testing Requirements

**Component Testing (Manual):**
- Dream selection works (click dream card → form appears)
- All 4 questions render simultaneously
- Textareas accept input (no lag)
- Character counters update correctly
- Tone selection works (visual feedback)
- Submit button disabled when submitting
- Validation shows errors for empty fields

**Mobile Testing:**
- Test on iPhone SE (375px width)
- Test on iPhone 12 Pro (390px width)
- Test on iPad (768px width)
- Verify smooth scrolling
- Verify tone cards stack vertically
- Verify keyboard doesn't obscure submit button

**Regression Testing:**
- Output view still works (past reflections)
- Dream list fetching works
- Navigation back to dashboard works
- Cosmic background animations work
- Toast notifications work

**Test Coverage Target:** 100% of user flows (dream selection → reflection → output)

### Potential Split Strategy

**IF** refactor proves overwhelming, consider split:

**Foundation (Builder 2A - 3 hours):**
- Remove multi-step navigation
- Flatten render logic to one-page
- Update FormData interface

**Polish (Builder 2B - 2 hours):**
- Add dream contextualization
- Update question text
- Mobile responsiveness
- Visual polish

**Recommendation:** Only split if time exceeds 6 hours or critical blocker encountered

---

## Builder-3: Integration & Comprehensive Testing

### Scope

**Objective:** Validate that all builder outputs work together correctly and test complete reflection creation flow end-to-end.

**Primary Responsibility:**
- Merge Builder 1 and Builder 2 branches
- Resolve any merge conflicts
- Test complete flow (dream selection → reflection → display)
- Execute comprehensive manual testing checklist
- Test on mobile devices (real or emulated)
- Document any issues or edge cases
- Verify all acceptance criteria met

**Files Owned by This Builder:**
- None (integration role - doesn't create new files)
- May fix minor bugs discovered during testing

### Complexity Estimate

**MEDIUM**

**Reasoning:**
1. **Comprehensive testing** - 20+ test scenarios
2. **Mobile device testing** - Requires real devices or DevTools
3. **Edge case validation** - Empty fields, max characters, network errors
4. **Database verification** - Check records in Supabase Studio
5. **Potential bug fixes** - May discover issues requiring small fixes

**No split recommended** - Testing is cohesive activity

### Success Criteria

- [x] **Integration Complete**
  - Builder 1 and Builder 2 branches merged
  - No merge conflicts or compilation errors
  - All TypeScript types resolve correctly
  - Test: `npm run dev` starts without errors

- [x] **End-to-End Flow Verified**
  - User can select dream from list
  - User can fill all 4 questions
  - User can select tone
  - User can submit reflection
  - AI response generated and displayed
  - Reflection saved to database
  - Dashboard updates (reflection count)
  - Test: Complete full flow 3 times

- [x] **Mobile Testing Passed**
  - iPhone SE (375px): Form scrolls smoothly
  - iPhone 12 Pro (390px): All elements visible
  - iPad (768px): Layout adapts correctly
  - Desktop (1440px): Full experience works
  - Test: Complete reflection on each device size

- [x] **Edge Cases Validated**
  - Submit with empty fields → validation errors
  - Submit without selecting dream → validation error
  - Fill all fields with max characters → success
  - Network timeout → error handling works
  - Multiple reflections on same dream → all saved
  - Test: All edge cases pass

- [x] **Database Verification**
  - Reflections table has correct records
  - No `has_date` or `dream_date` values sent (NULL for new records)
  - All 4 question fields populated
  - AI response saved correctly
  - User reflection count incremented
  - Test: Check Supabase Studio after each test

- [x] **Acceptance Criteria Met**
  - All success criteria from overview.md verified
  - Manual testing checklist 100% complete
  - No critical bugs or regressions
  - Ready for deployment

### Files to Verify (Not Modify)

**1. `types/schemas.ts`**
- Verify: `createReflectionSchema` has 4 question fields (no hasDate/dreamDate)
- Verify: Type exports work correctly
- Test: Import schema in test file, check type inference

**2. `server/trpc/routers/reflection.ts`**
- Verify: Mutation handles 4-question input
- Verify: AI prompt simplified
- Verify: Database insert correct
- Test: API call via Postman or curl

**3. `app/reflection/MirrorExperience.tsx`**
- Verify: One-page layout renders
- Verify: All 4 questions visible
- Verify: Mutation call sends correct payload
- Test: UI works in browser

**4. Database (Supabase)**
- Verify: New reflections have NULL for has_date/dream_date
- Verify: Old reflections preserved (if any)
- Test: Query reflections table

### Dependencies

**Depends on:**
- **Builder 1** - Schema and mutation updates complete
- **Builder 2** - Component refactor complete

**Blocks:**
- Nothing (last builder before deployment)

**Coordination:**
- Pull both Builder 1 and Builder 2 branches
- Merge locally and test
- Resolve any conflicts (should be minimal due to file ownership)

### Implementation Notes

**Integration Strategy:**

1. **Merge Branches (30 min)**
   ```bash
   git checkout plan-4-iteration-1
   git merge builder-1-api-fix
   git merge builder-2-component-refactor
   # Resolve any conflicts (should be none)
   npm install # In case dependencies changed
   npm run dev # Verify compilation
   ```

2. **Smoke Test (15 min)**
   - Navigate to /reflection
   - Check for console errors
   - Verify UI renders correctly
   - Test basic interaction (select dream, type in field)

3. **Execute Testing Checklist (2-3 hours)**
   - See detailed checklist below
   - Test each scenario methodically
   - Document any issues in issue tracker
   - Fix minor issues (typos, styling tweaks)

4. **Database Verification (15 min)**
   - Open Supabase Studio: http://localhost:54323
   - Query reflections table
   - Verify new records have correct structure
   - Check that old records (if any) preserved

5. **Mobile Testing (30 min)**
   - Use Chrome DevTools Device Toolbar
   - Test each breakpoint (375px, 390px, 768px, 1440px)
   - Check scroll behavior, tap targets, keyboard interaction
   - Optional: Test on real devices if available

6. **Final Validation (15 min)**
   - Review all success criteria from overview.md
   - Confirm all acceptance criteria met
   - Document any known issues or limitations
   - Prepare handoff notes for deployment

**Manual Testing Checklist:**

```markdown
## Reflection Creation Testing

### Setup
- [ ] Supabase running: `npx supabase status` → All services "running"
- [ ] Dev server running: `npm run dev` → No compilation errors
- [ ] Logged in as: ahiya.butman@gmail.com / mirror-creator
- [ ] Browser console open (check for errors)
- [ ] Network tab open (watch API calls)

### Test 1: Happy Path (Complete Reflection)
- [ ] Navigate to http://localhost:3000/reflection
- [ ] Page loads without errors
- [ ] See "Which dream are you reflecting on?" heading
- [ ] See list of active dreams
- [ ] Click dream "Test Dream for Plan-4"
- [ ] Form appears with 4 questions
- [ ] Dream name visible in questions (e.g., "What is Test Dream for Plan-4?")
- [ ] Fill Q1 (dream): "Testing the new one-page reflection flow with 4 questions"
- [ ] Character counter updates (shows 59/3200)
- [ ] Fill Q2 (plan): "Complete this reflection successfully to validate the fix"
- [ ] Character counter updates
- [ ] Fill Q3 (relationship): "Excited and hopeful that this new flow feels more natural"
- [ ] Character counter updates
- [ ] Fill Q4 (offering): "My time, attention, and patience during testing"
- [ ] Character counter updates
- [ ] Scroll to tone selection
- [ ] See 3 tone cards (Fusion, Gentle, Intense)
- [ ] Fusion selected by default (glowing)
- [ ] Click Gentle tone
- [ ] Gentle card glows, Fusion stops glowing
- [ ] Scroll to submit button
- [ ] Click "Gaze into the Mirror"
- [ ] Button shows loading state ("Creating..." with spinner)
- [ ] Wait for response (2-5 seconds)
- [ ] Redirected to /reflection?id=[uuid]
- [ ] AI response displayed
- [ ] Response references user's answers (check for keywords from inputs)
- [ ] No console errors
- [ ] Network tab shows successful POST to /api/trpc/reflection.create

### Test 2: Database Verification
- [ ] Open Supabase Studio: http://localhost:54323
- [ ] Navigate to Table Editor → reflections
- [ ] See new record (most recent created_at)
- [ ] Verify fields:
  - [ ] `user_id` matches Ahiya's user ID
  - [ ] `dream_id` matches selected dream
  - [ ] `dream` field contains Q1 answer
  - [ ] `plan` field contains Q2 answer
  - [ ] `relationship` field contains Q3 answer
  - [ ] `offering` field contains Q4 answer
  - [ ] `has_date` is NULL (not "yes" or "no")
  - [ ] `dream_date` is NULL
  - [ ] `ai_response` contains Claude's response
  - [ ] `tone` is "gentle" (selected tone)
  - [ ] `created_at` is recent timestamp

### Test 3: Validation - Empty Fields
- [ ] Navigate to /reflection (new session)
- [ ] Select dream
- [ ] Leave Q1 (dream) empty
- [ ] Fill Q2, Q3, Q4
- [ ] Click submit
- [ ] Toast error shown: "Please elaborate on your dream"
- [ ] Form not submitted (no network request)
- [ ] Still on questionnaire page

- [ ] Fill Q1
- [ ] Clear Q2 (plan)
- [ ] Click submit
- [ ] Toast error: "Please describe your plan"

- [ ] Fill Q2
- [ ] Clear Q3 (relationship)
- [ ] Click submit
- [ ] Toast error: "Please share your relationship with this dream"

- [ ] Fill Q3
- [ ] Clear Q4 (offering)
- [ ] Click submit
- [ ] Toast error: "Please describe what you're willing to give"

### Test 4: Validation - No Dream Selected
- [ ] Navigate to /reflection
- [ ] Don't select a dream
- [ ] Somehow navigate to form (shouldn't be possible, but test)
- [ ] If form visible, try to submit
- [ ] Toast error: "Please select a dream"

### Test 5: Maximum Character Limits
- [ ] Navigate to /reflection
- [ ] Select dream
- [ ] Fill Q1 with 3200 characters (paste long text)
- [ ] Character counter shows "3200/3200"
- [ ] Typing more characters doesn't add to textarea
- [ ] Repeat for Q2 (4000 chars), Q3 (4000 chars), Q4 (2400 chars)
- [ ] Submit reflection
- [ ] Success (no validation errors for max length)

### Test 6: All Tones Work
- [ ] Create reflection with Fusion tone
- [ ] Verify AI response has balanced tone
- [ ] Create reflection with Gentle tone
- [ ] Verify AI response has compassionate tone
- [ ] Create reflection with Intense tone
- [ ] Verify AI response has direct tone

### Test 7: Multiple Reflections on Same Dream
- [ ] Create first reflection on "Dream A"
- [ ] Success
- [ ] Navigate to /reflection again
- [ ] Select same "Dream A"
- [ ] Fill different answers
- [ ] Submit
- [ ] Success (no unique constraint violation)
- [ ] Check database: 2 reflections for same dream_id

### Test 8: Mobile Responsiveness (iPhone SE - 375px)
- [ ] Open Chrome DevTools → Device Toolbar
- [ ] Select "iPhone SE" (375px width)
- [ ] Navigate to /reflection
- [ ] Dream list renders correctly (cards stack)
- [ ] Select dream
- [ ] All 4 questions visible (vertical stack)
- [ ] Textareas full width
- [ ] Character counters visible
- [ ] Scroll smoothly through questions
- [ ] Tone cards stack vertically (1 column)
- [ ] Submit button full width
- [ ] Submit button always accessible (not hidden by keyboard)
- [ ] Complete reflection successfully

### Test 9: Mobile Responsiveness (iPad - 768px)
- [ ] Switch to "iPad" (768px width)
- [ ] Navigate to /reflection
- [ ] Dream list renders (2 columns)
- [ ] Select dream
- [ ] Form renders correctly
- [ ] Tone cards in grid (may be 2 or 3 columns)
- [ ] All interactions work
- [ ] Complete reflection successfully

### Test 10: Desktop (1440px)
- [ ] Switch to responsive mode, 1440px width
- [ ] Navigate to /reflection
- [ ] Full layout visible
- [ ] Tone cards in 3-column grid
- [ ] All spacing looks good
- [ ] Complete reflection successfully

### Test 11: Error Handling - Network Timeout
- [ ] Open Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Navigate to /reflection
- [ ] Select dream, fill questions
- [ ] Submit
- [ ] Wait for timeout (30+ seconds)
- [ ] Error message shown (either timeout or generic error)
- [ ] Loading state ends
- [ ] Can retry submission

### Test 12: Error Handling - Invalid API Key
- [ ] Stop dev server
- [ ] Edit .env.local → Set ANTHROPIC_API_KEY to invalid value
- [ ] Restart dev server
- [ ] Try to create reflection
- [ ] Error message shown (API-related)
- [ ] Revert API key to correct value
- [ ] Restart server

### Test 13: Regression - Output View
- [ ] Create a reflection successfully
- [ ] Note the reflection ID from URL
- [ ] Navigate away (to dashboard)
- [ ] Navigate to /reflection?id=[reflection-id]
- [ ] Output view renders correctly
- [ ] AI response displayed
- [ ] No console errors

### Test 14: Regression - Dream List Fetching
- [ ] Navigate to /reflection
- [ ] Dream list loads (no errors)
- [ ] All active dreams shown
- [ ] Dream cards have title, days left, category emoji
- [ ] Can select any dream

### Test 15: Regression - Navigation
- [ ] From reflection page, click back button
- [ ] Navigate to dashboard
- [ ] No errors
- [ ] Dashboard renders correctly

### Test 16: Console Errors Check
- [ ] Review browser console for ALL tests
- [ ] No errors or warnings (except expected ones)
- [ ] Debug logs visible (if added by Builder 1)

### Test 17: Performance Check
- [ ] Typing in textareas feels smooth (no lag)
- [ ] Scrolling is smooth (no jank)
- [ ] Page transitions are smooth
- [ ] API calls return within 5 seconds

### Test 18: Accessibility Check (Optional)
- [ ] Tab through form fields (keyboard navigation)
- [ ] Focus states visible
- [ ] Can submit with Enter key (if applicable)
- [ ] Screen reader announces labels (optional - test if time)

### Summary
- [ ] All 18 tests passed
- [ ] No critical bugs discovered
- [ ] All edge cases handled
- [ ] Mobile responsiveness validated
- [ ] Database records correct
- [ ] Ready for deployment
```

**Issue Documentation Template:**

If issues found during testing:

```markdown
## Issue: [Brief Description]

**Severity:** [CRITICAL / HIGH / MEDIUM / LOW]
**Found in:** [Test scenario name]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** [What should happen]
**Actual Behavior:** [What actually happens]
**Console Errors:** [Any errors from console]
**Screenshot:** [If applicable]

**Suggested Fix:** [If obvious]
**Assigned to:** [Builder 1, Builder 2, or self]
```

**Handoff to Deployment:**
- All tests passed: Mark iteration COMPLETE in `.2L/config.yaml`
- Issues found: Document and assign to appropriate builder for fixes
- Critical issues: Block deployment until resolved
- Minor issues: Can defer to iteration 2 or post-plan-4

### Patterns to Follow

Reference `patterns.md` sections:
- **Testing Patterns → Manual Testing Checklist Format** (for test execution)
- **Database Patterns → Supabase Query Pattern** (for database verification)
- **Error Handling Patterns** (for validating error states)

### Testing Requirements

**Integration Testing:**
- All builder outputs work together
- No compilation errors
- No runtime errors
- No regressions in existing features

**End-to-End Testing:**
- Complete user flow (dream selection → reflection → output)
- All tones work (Fusion, Gentle, Intense)
- All validation works (empty fields, max characters)
- Mobile responsiveness

**Database Testing:**
- Records created correctly
- No `has_date`/`dream_date` values for new records
- User counters updated

**Regression Testing:**
- Output view still works
- Dream list still loads
- Navigation still works
- Background animations still render

**Test Coverage Target:** 100% of user-facing flows and edge cases

### Potential Split Strategy

**NOT RECOMMENDED** - Testing is cohesive and should be done by single person for consistency

**IF** critical issue found requiring significant fix:
- Pause testing
- Document issue thoroughly
- Assign to appropriate builder (1 or 2)
- Wait for fix
- Resume testing from beginning (full regression test)

---

## Builder Execution Order

### Parallel Group 1 (None - All Sequential)

Builders execute in strict sequence due to dependencies.

### Sequence Order

**Phase 1: API Fix (Hours 0-5)**
- Builder 1 executes alone
- Completes schema updates and mutation fix
- Commits to `builder-1-api-fix` branch
- Notifies Builder 2 when complete

**Phase 2: Component Refactor (Hours 5-10)**
- Builder 2 starts after Builder 1 completes
- Pulls Builder 1's schema changes
- Completes component refactor
- Commits to `builder-2-component-refactor` branch
- Notifies Builder 3 when complete

**Phase 3: Integration Testing (Hours 10-12)**
- Builder 3 starts after Builders 1 & 2 complete
- Merges both branches
- Executes comprehensive testing
- Documents issues (if any)
- Marks iteration complete (if all tests pass)

### Integration Notes

**File Ownership Prevention:**
- Builder 1 owns: `types/schemas.ts`, `server/trpc/routers/reflection.ts`
- Builder 2 owns: `app/reflection/MirrorExperience.tsx`
- Builder 3 owns: Nothing (testing only)
- **Result:** Zero merge conflicts expected

**Handoff Protocol:**
1. Builder completes work
2. Builder commits to designated branch
3. Builder runs `npm run dev` to verify compilation
4. Builder creates handoff note:
   ```markdown
   ## Builder [N] Complete

   **Branch:** builder-[N]-[name]
   **Files Changed:** [List]
   **Tests Passed:** [List]
   **Known Issues:** [None or list]
   **Notes for Next Builder:** [Any important context]
   ```
5. Builder notifies next builder (via comment, message, etc.)
6. Next builder pulls changes and continues

**Communication Checkpoints:**
- Builder 1 → Builder 2: Schema updated, mutation fixed
- Builder 2 → Builder 3: Component refactored, ready for testing
- Builder 3 → Orchestrator: Testing complete, iteration ready for deployment

### Shared Resources

**No shared files** - Each builder owns distinct files

**Shared dependencies:**
- Database (Supabase local instance) - read/write by all builders
- Environment variables (.env.local) - used by all builders
- tRPC types - exported by Builder 1, imported by Builder 2

**Conflict Prevention:**
- Sequential execution eliminates concurrent writes
- Clear file ownership documented above
- Integration builder validates everything works together

---

## Deployment Readiness Checklist

Before marking iteration COMPLETE, Builder 3 verifies:

- [ ] All 3 builders completed their tasks
- [ ] All branches merged successfully
- [ ] No compilation errors (`npm run dev` starts)
- [ ] No TypeScript errors (`npm run type-check` if available)
- [ ] All manual tests passed (18/18)
- [ ] Database schema correct (verified in Supabase Studio)
- [ ] Mobile responsiveness validated (3+ device sizes)
- [ ] No critical bugs or regressions
- [ ] Console free of errors (except expected debug logs)
- [ ] Reflection creation success rate: 100% (tested 5+ times)
- [ ] AI response quality acceptable (references user's answers)
- [ ] All success criteria met (from overview.md)
- [ ] All acceptance criteria met (from master-plan.yaml)

**If all checked:**
→ Mark iteration COMPLETE in `.2L/config.yaml`
→ Commit final integrated code to main branch
→ Create iteration summary document
→ Celebrate successful iteration! 🎯

**If any unchecked:**
→ Document issue(s)
→ Assign to appropriate builder for fix
→ Retest after fix
→ Do not deploy until all checked

---

**Builder Tasks Status:** COMPREHENSIVE AND READY
**Execution Strategy:** Sequential (Builder 1 → 2 → 3)
**Estimated Duration:** 10-14 hours total
**Risk Level:** MEDIUM-HIGH (complex refactor, but well-planned)
**Next Phase:** Building (Builder 1 starts first)
