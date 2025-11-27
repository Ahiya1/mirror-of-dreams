# Manual Testing Checklist - Plan-4 Iteration 1

**Tester:** Ahiya
**Date:** ___________
**Environment:** Local Development (http://localhost:3000)

---

## Prerequisites ✓

- [ ] Supabase started: `npx supabase start`
- [ ] Migration applied: `npx supabase migration up`
- [ ] Migration verified: `npx supabase migration list` shows "applied"
- [ ] Dev server running: `npm run dev`
- [ ] At least 1 active dream exists in account

---

## Core Reflection Flow (12 Tests)

### Test 1: Navigate to Reflection Page
- [ ] Go to `/reflection`
- [ ] Page loads without errors
- [ ] Dream selection screen displays

**Expected:** Dream selection list visible, no console errors

---

### Test 2: Dream Selection
- [ ] Click on an active dream
- [ ] Dream is highlighted (visual feedback)
- [ ] Form transitions to 4-question view

**Expected:** Dream title appears at top of form, all 4 questions visible

---

### Test 3: Question Text Verification
- [ ] Q1 text: "What is [Dream Title]?"
- [ ] Q2 text: "What is your plan for [Dream Title]?"
- [ ] Q3 text: "What's your relationship with [Dream Title]?"
- [ ] Q4 text: "What are you willing to give for [Dream Title]?"

**Expected:** All questions reference the selected dream by name

---

### Test 4: Form Input - All Fields
- [ ] Fill Q1 (dream): ~500 characters
- [ ] Fill Q2 (plan): ~500 characters
- [ ] Fill Q3 (relationship): ~500 characters
- [ ] Fill Q4 (offering): ~500 characters
- [ ] Character counters update correctly

**Expected:** All textareas accept input, counters show remaining chars

---

### Test 5: Tone Selection - Fusion (Default)
- [ ] "Sacred Fusion" card is selected by default
- [ ] Click "Sacred Fusion" (should stay selected)
- [ ] Visual highlight on selected card

**Expected:** Fusion tone highlighted, emoji ⚡ visible

---

### Test 6: Tone Selection - Gentle
- [ ] Click "Gentle Clarity" card
- [ ] Card becomes highlighted
- [ ] Previous selection (Fusion) unhighlighted

**Expected:** Only Gentle highlighted, emoji 🌸 visible

---

### Test 7: Tone Selection - Intense
- [ ] Click "Luminous Intensity" card
- [ ] Card becomes highlighted
- [ ] Previous selection (Gentle) unhighlighted

**Expected:** Only Intense highlighted, emoji 🔥 visible

---

### Test 8: Submit Reflection (Fusion Tone)
- [ ] Select "Sacred Fusion" tone
- [ ] Click "Gaze into the Mirror" button
- [ ] Loading state shows (spinner + "Creating...")
- [ ] No errors in browser console
- [ ] No 400 errors in Network tab

**Expected:** Button disabled during submission, loading indicator visible

---

### Test 9: AI Response Display
- [ ] AI response appears after ~10-30 seconds
- [ ] Response is formatted (paragraphs, bold text)
- [ ] Response is readable (no HTML tags visible)
- [ ] "Create New Reflection" button visible

**Expected:** Clean, formatted reflection displayed

---

### Test 10: AI Response Quality - Content Verification
- [ ] Response mentions your dream (by name or description)
- [ ] Response references your plan (quotes or paraphrases)
- [ ] Response references your relationship description
- [ ] Response references your offering/sacrifice
- [ ] Response uses your name (if provided in profile)

**Expected:** AI quotes or clearly references your actual words, not generic platitudes

**Quality Score:** ___/5 (how many of above are true)

---

### Test 11: Reflection Saved to Database
- [ ] Navigate to `/reflections`
- [ ] New reflection appears in list
- [ ] Reflection displays correct dream linkage
- [ ] Reflection displays correct tone (Fusion/Gentle/Intense)

**Expected:** Reflection count incremented, new entry visible

---

### Test 12: Dashboard Update
- [ ] Navigate to `/dashboard`
- [ ] Reflection count updated (e.g., "1 reflection this month")
- [ ] Active dream shows reflection count (e.g., "1 reflection")

**Expected:** Stats update immediately after reflection creation

---

## Edge Cases (5 Tests)

### Test 13: Validation - Empty Fields
- [ ] Navigate to `/reflection`
- [ ] Select a dream
- [ ] Leave all 4 questions empty
- [ ] Click "Gaze into the Mirror"

**Expected:** Warning message: "Please elaborate on your dream" (or similar)

---

### Test 14: Validation - Partial Completion
- [ ] Fill only Q1 and Q2
- [ ] Leave Q3 and Q4 empty
- [ ] Click "Gaze into the Mirror"

**Expected:** Warning message for first incomplete field

---

### Test 15: Character Limits
- [ ] Fill Q1 with 3200+ characters
- [ ] Try to type more

**Expected:** Textarea stops accepting input at 3200 chars, counter shows "0 left"

---

### Test 16: No Active Dreams
- [ ] Archive all dreams (or use test account with no dreams)
- [ ] Navigate to `/reflection`

**Expected:** Message: "No active dreams yet" + "Create Your First Dream" button

---

### Test 17: Browser Refresh During Form
- [ ] Fill all 4 questions halfway
- [ ] Refresh browser (F5)

**Expected:** Form resets (state not preserved - acceptable for MVP)

**Note:** If state preservation is desired, add to iteration 2 backlog

---

## Mobile Responsiveness (5 Tests)

**Device 1: iPhone SE (375px width)**
- [ ] Open DevTools, set to iPhone SE
- [ ] Navigate to `/reflection`
- [ ] Select dream, view 4-question form
- [ ] Scroll through all questions smoothly
- [ ] Tone cards stack vertically (1 column)
- [ ] Submit button visible at bottom

**Expected:** All content readable, no horizontal scroll, smooth touch scroll

---

**Device 2: iPhone 12 Pro (390px width)**
- [ ] Set DevTools to iPhone 12 Pro
- [ ] Repeat above checks

**Expected:** Same as iPhone SE

---

**Device 3: iPad (768px width)**
- [ ] Set DevTools to iPad
- [ ] Navigate to `/reflection`
- [ ] Tone cards show in grid (3 columns)
- [ ] All questions readable

**Expected:** Responsive grid layout, larger text sizing

---

**Device 4: Keyboard Interaction (Mobile)**
- [ ] On mobile viewport, focus Q1 textarea
- [ ] Type ~100 characters
- [ ] Check if keyboard obscures input field

**Expected:** Input field scrolls into view, not obscured by keyboard

**Note:** This may require actual device testing (DevTools simulation limited)

---

**Device 5: Touch Interactions**
- [ ] On mobile viewport, tap dream card to select
- [ ] Tap tone card to select
- [ ] Tap submit button

**Expected:** All touch targets large enough (44×44px minimum), immediate visual feedback

---

## AI Response Quality (Detailed - 5 Tests)

### Test 18: Fusion Tone Quality
- [ ] Create reflection with Fusion tone
- [ ] AI response is ~800-1200 words
- [ ] Tone is balanced (not too gentle, not too intense)
- [ ] Quotes or paraphrases at least 2 of your answers

**Fusion Quality Score:** ___/10 (subjective)

---

### Test 19: Gentle Tone Quality
- [ ] Create reflection with Gentle tone
- [ ] AI response is compassionate and nurturing
- [ ] No harsh or confrontational language
- [ ] Validates your relationship with dream

**Gentle Quality Score:** ___/10 (subjective)

---

### Test 20: Intense Tone Quality
- [ ] Create reflection with Intense tone
- [ ] AI response is direct and transformative
- [ ] Challenges you constructively
- [ ] References your offering/sacrifice

**Intense Quality Score:** ___/10 (subjective)

---

### Test 21: Compare to Baseline
- [ ] Find 1-2 reflections from old system (if available)
- [ ] Compare depth of insight
- [ ] Compare personalization
- [ ] Compare usefulness

**Is new system equal or better?** [ ] YES [ ] NO

**If NO, describe issue:** ___________________________________

---

### Test 22: Cross-Reflection Consistency
- [ ] Create 3 reflections (same dream, different tones)
- [ ] Verify each reflection is unique (not copy-paste)
- [ ] Verify tone differences are clear

**Expected:** Each reflection distinct, tone clearly different

---

## Summary

### Tests Passed: ___/22

### Critical Blockers Found:
1. ___________________________________________
2. ___________________________________________

### Minor Issues Found:
1. ___________________________________________
2. ___________________________________________

### Overall Assessment:
- [ ] PASS - Ready for deployment
- [ ] PARTIAL - Some issues, but core functionality works
- [ ] FAIL - Critical issues block deployment

### Tester Notes:
___________________________________________________
___________________________________________________
___________________________________________________

### Recommendation:
- [ ] Deploy to production
- [ ] Fix issues and re-test
- [ ] Escalate to healing phase

---

**Validation Status:** _____________ (PASS/PARTIAL/FAIL)

**Signed:** _______________  **Date:** ___________
