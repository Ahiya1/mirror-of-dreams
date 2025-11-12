# Manual Testing Checklist - Iteration 19

## Before Testing
- [ ] Run `npm run dev` to start development server
- [ ] Verify Supabase running: `npx supabase status`
- [ ] Open browser DevTools console
- [ ] Navigate to http://localhost:3000

## 1. Admin Authentication Test (15 minutes)

### Signin Flow
- [ ] Navigate to `/auth/signin`
- [ ] Enter email: `ahiya.butman@gmail.com`
- [ ] Enter password: `dream_lake`
- [ ] Click "Sign In"
- [ ] Verify redirect to `/dashboard`
- [ ] Verify no console errors
- [ ] Verify admin user name appears in navbar
- [ ] Refresh page - verify still signed in (token persisted)

### Expected Result:
- Dashboard loads with all 5 cards
- Usage card shows "Unlimited" for premium tier
- No errors in browser console

---

## 2. Dashboard Test (15 minutes)

### Card Loading
- [ ] Verify UsageCard displays (should show premium/unlimited)
- [ ] Verify ReflectionsCard displays (empty state expected)
- [ ] Verify DreamsCard displays (empty state expected)
- [ ] Verify EvolutionCard displays (eligibility check)
- [ ] Verify SubscriptionCard displays (tier badge: Premium)
- [ ] Check loading states appear briefly during initial load
- [ ] Verify no hydration errors in console

### Refresh Functionality
- [ ] Click "Refresh" button in navbar or dashboard
- [ ] Verify all cards reload (loading states appear)
- [ ] Verify data updates correctly
- [ ] Verify no errors in console

### Expected Result:
- All 5 cards render correctly
- Empty states show appropriate messages
- Loading states smooth and brief
- Zero console errors

---

## 3. Dreams CRUD Test (20 minutes)

### Create Dream
- [ ] Click "Create Dream" button
- [ ] Fill form:
  - Title: "Test Dream for Validation"
  - Description: "Testing dreams CRUD functionality"
  - Category: Personal Growth
  - Target Date: [30 days from today]
  - Priority: High
- [ ] Click "Create"
- [ ] Verify modal closes
- [ ] Verify dream appears in dreams list
- [ ] Verify no console errors

### View Dream
- [ ] Click on dream card
- [ ] Verify redirect to `/dreams/[id]`
- [ ] Verify dream details display correctly
- [ ] Verify "Reflections (0)" section shows empty state
- [ ] Verify "Generate Evolution Report" and "Generate Visualization" buttons visible (may show eligibility message)
- [ ] Verify no console errors

### Edit Dream
- [ ] Click "Edit" button on dream detail page
- [ ] Change title to "Updated Test Dream"
- [ ] Click "Save"
- [ ] Verify title updates
- [ ] Verify no console errors

### Change Status
- [ ] Change status from "Active" to "Achieved"
- [ ] Verify status badge updates
- [ ] Change back to "Active"
- [ ] Verify no console errors

### Tier Limit Test (Free Tier)
**Note:** This requires creating a free tier user. Skip if testing with admin only.
- [ ] Create 2 dreams (should succeed)
- [ ] Attempt to create 3rd dream
- [ ] Verify error message: "Dream limit reached for your tier"

### Expected Result:
- Dreams CRUD works smoothly
- All fields save correctly
- Status changes reflect immediately
- Tier limits enforced (if tested with free user)

---

## 4. Reflection Flow Test (30 minutes)

### Start Reflection
- [ ] Navigate to `/dashboard`
- [ ] Click "Reflect Now" button
- [ ] Verify redirect to `/reflection`
- [ ] Verify MirrorExperience component loads
- [ ] Verify no console errors

### Dream Selection
- [ ] Select "Test Dream for Validation" from list
- [ ] Click "Continue" or "Next"
- [ ] Verify progress to question 1
- [ ] Verify progress orbs show 1/5
- [ ] Verify no console errors

### Answer Questions
**Question 1: Dream Description**
- [ ] Enter: "Testing the reflection flow with validation"
- [ ] Verify character counter appears
- [ ] Verify "Next" button enabled
- [ ] Click "Next"
- [ ] Verify progress orbs show 2/5

**Question 2: Has Date?**
- [ ] Select "Yes, I had this dream recently"
- [ ] Verify conditional question appears (dreamDate)
- [ ] Enter date: [yesterday]
- [ ] Click "Next"
- [ ] Verify progress orbs show 3/5

**Question 3: Plan**
- [ ] Enter: "I plan to test all features systematically"
- [ ] Verify character counter
- [ ] Click "Next"
- [ ] Verify progress orbs show 4/5

**Question 4: Relationship**
- [ ] Enter: "This relates to ensuring quality in development"
- [ ] Verify character counter
- [ ] Click "Next"
- [ ] Verify progress orbs show 5/5

**Question 5: Tone Selection**
- [ ] Verify tone options appear (Fusion, Gentle, Intense)
- [ ] Select "Fusion"
- [ ] Verify tone preview shows
- [ ] Click "Generate Reflection"

### AI Generation
- [ ] Verify CosmicLoader appears
- [ ] Wait ~30 seconds for AI generation
- [ ] Verify reflection content appears
- [ ] Verify formatted correctly (paragraphs, spacing)
- [ ] Verify no console errors
- [ ] Verify redirect to `/reflection?id=[reflectionId]` or similar

### Reflection Display
- [ ] Verify reflection shows AI-generated content
- [ ] Verify metadata (date, tone, dream title)
- [ ] Navigate back to dashboard
- [ ] Verify ReflectionsCard now shows 1 reflection
- [ ] Navigate to dream detail page
- [ ] Verify "Reflections (1)" section shows the new reflection

### Usage Counter
- [ ] Navigate to dashboard
- [ ] Check UsageCard
- [ ] Verify reflection count incremented (if not admin/unlimited)

### Expected Result:
- Complete 5-question flow works smoothly
- AI generation completes in ~30 seconds
- Reflection saves and displays correctly
- Usage counter increments
- Progress orbs update correctly
- Zero console errors throughout

---

## 5. Create 3 More Reflections (30 minutes)

**Purpose:** Test eligibility for evolution/visualization (requires ≥4 reflections)

### Reflection 2
- [ ] Click "Reflect Now"
- [ ] Select same dream
- [ ] Answer 5 questions (different answers)
- [ ] Select tone: "Gentle"
- [ ] Generate reflection
- [ ] Verify saves correctly

### Reflection 3
- [ ] Repeat reflection flow
- [ ] Select same dream
- [ ] Answer 5 questions (different answers)
- [ ] Select tone: "Intense"
- [ ] Generate reflection
- [ ] Verify saves correctly

### Reflection 4
- [ ] Repeat reflection flow
- [ ] Select same dream
- [ ] Answer 5 questions (different answers)
- [ ] Select tone: "Fusion"
- [ ] Generate reflection
- [ ] Verify saves correctly

### Verify Eligibility
- [ ] Navigate to dream detail page
- [ ] Check "Generate Evolution Report" button
- [ ] Verify eligibility message shows "You have 4 reflections" or "Eligible"
- [ ] Check "Generate Visualization" button
- [ ] Verify eligibility message shows "You have 4 reflections" or "Eligible"

**Note:** Evolution/Visualization generation UI is not implemented in Iteration 19 (planned for Iteration 20). You're verifying that reflections save correctly and count toward eligibility.

### Expected Result:
- 4 reflections created successfully
- All reflections visible in dream detail page
- Eligibility checks recognize ≥4 reflections (if implemented)
- Usage counter shows 4 reflections (if not admin/unlimited)

---

## 6. Database Verification (10 minutes)

### Query Database Directly
```bash
# Check dreams table
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT title, status FROM dreams;"

# Check reflections table
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM reflections;"

# Check usage tracking
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT * FROM usage_tracking;"
```

### Expected Results:
- [ ] dreams table has 1 row (Test Dream)
- [ ] reflections table has 4 rows
- [ ] usage_tracking table has updated counters

---

## 7. Console Error Check (Throughout Testing)

### Check Console After Each Step
- [ ] No hydration errors
- [ ] No React warnings (missing keys, deprecated APIs)
- [ ] No network errors (tRPC endpoint failures)
- [ ] No TypeScript errors
- [ ] No unhandled promise rejections

### Document Any Errors Found
```
Error 1: [Description]
Location: [File/line or page where it occurred]
Severity: [Critical/Major/Minor]

Error 2: [Description]
...
```

---

## 8. Navigation Test (10 minutes)

### Test All Routes
- [ ] Navigate to `/` (landing page)
- [ ] Navigate to `/dashboard`
- [ ] Navigate to `/dreams`
- [ ] Navigate to `/dreams/[id]`
- [ ] Navigate to `/reflections`
- [ ] Navigate to `/reflections/[id]`
- [ ] Navigate to `/evolution` (may be empty)
- [ ] Navigate to `/visualizations` (may be empty)
- [ ] Navigate to `/auth/signin` (should redirect if signed in)
- [ ] Sign out
- [ ] Navigate to `/dashboard` (should redirect to signin)

### Expected Result:
- All routes load without errors
- Protected routes redirect to signin when not authenticated
- Navigation is smooth and fast
- No 404 errors

---

## 9. Sign Out and Re-Sign In (5 minutes)

### Sign Out
- [ ] Click user menu in navbar
- [ ] Click "Sign Out"
- [ ] Verify redirect to landing page or signin
- [ ] Verify token removed from localStorage
- [ ] Navigate to `/dashboard`
- [ ] Verify redirect to `/auth/signin` (protected route)

### Sign In Again
- [ ] Enter credentials (ahiya.butman@gmail.com / dream_lake)
- [ ] Click "Sign In"
- [ ] Verify redirect to `/dashboard`
- [ ] Verify all data persisted (dreams, reflections)
- [ ] Verify dashboard shows correct counts

### Expected Result:
- Sign out clears session
- Protected routes require authentication
- Sign in restores full access
- Data persists across sessions

---

## 10. Final Checks

### Performance
- [ ] Page load times feel fast (< 2 seconds)
- [ ] Navigation between pages is smooth
- [ ] No layout shifts during load
- [ ] Loading states are brief and smooth

### Visual Quality
- [ ] Glass morphism effect visible on cards
- [ ] Cosmic background animations smooth
- [ ] Gradient text renders correctly
- [ ] Progress orbs animate smoothly
- [ ] All buttons have hover states
- [ ] Mobile responsive (test at 375px, 768px, 1024px widths)

### Data Integrity
- [ ] All created data displays correctly
- [ ] Counts are accurate (dreams, reflections, usage)
- [ ] Dates format correctly
- [ ] Status badges show correct colors
- [ ] Tier badges display correctly

---

## Testing Summary

### Total Time: ~2 hours

### Checklist Completion
- [ ] All 10 sections completed
- [ ] All expected results verified
- [ ] Console errors documented (if any)
- [ ] Performance feels acceptable
- [ ] Ready for Iteration 20 planning

### Issues Found (Document Here)
```
Issue 1: [Description]
Severity: [Critical/Major/Minor]
Location: [Where it occurred]

Issue 2: [Description]
...

(If none, write "NONE - All tests passed")
```

---

## Next Steps After Manual Testing

1. **If all tests pass:**
   - Update validation report status to "Manual E2E: PASS"
   - Increase confidence from 88% to 95%
   - Proceed to Iteration 20 planning

2. **If issues found:**
   - Document all issues in detail
   - Categorize by severity (Critical/Major/Minor)
   - Create healing tasks if critical issues exist
   - Re-validate after fixes

3. **Plan Iteration 20:**
   - Focus: Evolution Report & Visualization Generation UI
   - Prerequisites: All manual tests pass
   - Estimated duration: 12-16 hours (2 builders)

---

**Tester:** [Your name]
**Date:** [Date of testing]
**Environment:** Local development (http://localhost:3000)
**Database:** Supabase local (http://127.0.0.1:54321)
**Results:** [PASS / PARTIAL / FAIL]

