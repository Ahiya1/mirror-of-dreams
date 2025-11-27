# Quick Start - Validation & Deployment

**For:** Ahiya (Project Owner)
**Time Required:** 2-3 hours
**Goal:** Validate MVP and deploy to production

---

## Step 1: Apply Database Migration (5 minutes)

The migration makes `has_date` column nullable so new reflections work.

```bash
# Navigate to project directory
cd ~/Ahiya/2L/Prod/mirror-of-dreams

# Start Supabase local instance
npx supabase start

# Wait for services to start (~30 seconds)
# You should see: "Started supabase local development setup"

# Apply the migration
npx supabase migration up

# Verify migration applied
npx supabase migration list

# Look for: 20251127000000_make_date_fields_nullable.sql [APPLIED]
```

**Expected output:**
```
✅ 20251127000000_make_date_fields_nullable.sql [APPLIED]
```

**If this fails:** Check Supabase is running with `npx supabase status`

---

## Step 2: Start Development Server (2 minutes)

```bash
# Make sure you're in project directory
cd ~/Ahiya/2L/Prod/mirror-of-dreams

# Start Next.js dev server
npm run dev

# Server will start on http://localhost:3000
# Wait for "✓ Ready in X ms"
```

**Open browser:** http://localhost:3000

---

## Step 3: Core Flow Test (20 minutes)

### Test 1: Create a reflection with Fusion tone

1. Navigate to http://localhost:3000/reflection
2. Select one of your active dreams
3. Fill all 4 questions:
   - Q1 (Dream): ~300 words about the dream
   - Q2 (Plan): ~300 words about your approach
   - Q3 (Relationship): ~300 words about how you relate to it
   - Q4 (Offering): ~200 words about what you'll give
4. Keep "Sacred Fusion" tone selected (default)
5. Click "Gaze into the Mirror"
6. Wait 10-30 seconds for AI response

**What to check:**
- [ ] Form accepted all inputs (no validation errors)
- [ ] Submit button showed loading state
- [ ] No 400 error in browser console (F12 → Console)
- [ ] AI response appeared after ~30 seconds
- [ ] Response is formatted nicely (paragraphs, bold text)

**Critical check - AI QUALITY:**
- [ ] Response mentions your dream by name or description
- [ ] Response quotes or paraphrases something from Q2 (your plan)
- [ ] Response quotes or paraphrases something from Q3 (relationship)
- [ ] Response quotes or paraphrases something from Q4 (offering)
- [ ] Response feels substantial, not generic praise

**If 4/5 checks pass:** AI quality is good ✅

---

### Test 2: Create a reflection with Gentle tone

1. Go back to /reflection (or click "Create New Reflection")
2. Select same dream or different dream
3. Fill all 4 questions (can use different content)
4. Select "Gentle Clarity" tone (🌸)
5. Submit and wait for response

**What to check:**
- [ ] Tone is noticeably gentler/more compassionate
- [ ] Response still references your specific answers
- [ ] Response feels different from Fusion tone

---

### Test 3: Create a reflection with Intense tone

1. Go back to /reflection
2. Select a dream
3. Fill all 4 questions
4. Select "Luminous Intensity" tone (🔥)
5. Submit and wait for response

**What to check:**
- [ ] Tone is noticeably more direct/challenging
- [ ] Response still references your specific answers
- [ ] Response feels different from Fusion and Gentle

---

## Step 4: Verify Database & Dashboard (5 minutes)

### Check reflections saved

1. Navigate to http://localhost:3000/reflections
2. You should see 3 new reflections (Fusion, Gentle, Intense)
3. Click on each one to verify content saved correctly

**What to check:**
- [ ] All 3 reflections appear in list
- [ ] Each shows correct dream linkage
- [ ] Each shows correct tone (Fusion/Gentle/Intense)

### Check dashboard updated

1. Navigate to http://localhost:3000/dashboard
2. Check reflection count

**What to check:**
- [ ] Reflection count shows 3 (or total count increased by 3)
- [ ] Active dream shows reflection count

---

## Step 5: Mobile Responsive Test (15 minutes)

### iPhone SE (375px)

1. Open DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select "iPhone SE" from dropdown
4. Navigate to /reflection
5. Select dream, fill all 4 questions

**What to check:**
- [ ] All 4 questions visible (can scroll to see all)
- [ ] Tone cards stack vertically (1 column)
- [ ] Submit button visible at bottom
- [ ] No horizontal scrollbar
- [ ] Text is readable (not too small)

### iPad (768px)

1. In DevTools, select "iPad"
2. Navigate to /reflection
3. Select dream, view form

**What to check:**
- [ ] Tone cards show in grid (3 columns)
- [ ] Questions are readable
- [ ] Layout looks good

---

## Step 6: Edge Case Tests (10 minutes)

### Test: Empty form validation

1. Go to /reflection
2. Select a dream
3. Leave all questions empty
4. Click submit

**Expected:** Warning message "Please elaborate on your dream"

### Test: Partial completion

1. Fill only Q1 and Q2
2. Leave Q3 and Q4 empty
3. Click submit

**Expected:** Warning message for first incomplete field

### Test: Character limits

1. Fill Q1 with very long text (keep typing)
2. Try to exceed 3200 characters

**Expected:** Textarea stops accepting input, counter shows "0 left"

---

## Decision Time

### Count your passing tests:

**Core flow (3 tests):** ___/3
**Database/Dashboard (2 tests):** ___/2
**Mobile responsive (2 tests):** ___/2
**Edge cases (3 tests):** ___/3

**Total:** ___/10

### Make deployment decision:

| Score | Decision |
|-------|----------|
| 9-10/10 | ✅ Deploy to production NOW |
| 7-8/10 | ⚠️ Fix minor issues, then deploy |
| 5-6/10 | ⚠️ Fix issues, re-test core flow |
| <5/10 | ❌ Escalate to healing phase |

---

## Step 7: Deploy to Production (if tests pass)

### Apply migration to production

```bash
# Link to production Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migration to production
npx supabase db push

# Verify migration applied
npx supabase migration list
```

### Deploy to Vercel (or your hosting)

```bash
# Commit changes
git add .
git commit -m "Plan-4 Iteration 1: Fix reflection creation + one-page flow"

# Push to main branch
git push origin main

# Vercel will auto-deploy (if connected)
# Or trigger manual deployment in Vercel dashboard
```

### Test production

1. Go to your production URL
2. Create 1 test reflection
3. Verify it works

---

## If Tests Fail

**Use the full checklist:**
- Open `MANUAL_TESTING_CHECKLIST.md`
- Execute all 22 scenarios
- Document failures
- Refer to `validation-report.md` for debugging

**If multiple tests fail:**
- Read `validation-report.md` → "Issues Summary"
- Consider healing phase
- Document issues for 2L system

---

## Success!

If you've made it here and tests passed:

1. ✅ Mark iteration COMPLETE in `.2L/config.yaml`
2. ✅ Celebrate - you've restored core functionality!
3. ✅ Gather user feedback for 24 hours
4. ✅ Proceed to Iteration 2 (Restraint & Substance)

---

## Questions?

- **Full technical details:** See `validation-report.md`
- **Quick status:** See `VALIDATION_SUMMARY.md`
- **Detailed checklist:** See `MANUAL_TESTING_CHECKLIST.md`

**Time investment:** 2-3 hours well spent to ensure quality deployment.

**Confidence after these tests:** HIGH (90%+) - ready for real users.
