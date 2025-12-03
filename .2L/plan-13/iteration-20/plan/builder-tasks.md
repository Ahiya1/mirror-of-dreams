# Builder Tasks - Iteration 20

## Single Builder Assignment

All 4 tasks are assigned to Builder-1 (sequential execution).

---

## Task 1: Landing Page Messaging (Priority 1)

**Status:** PENDING

**File:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/page.tsx`

**Current Code (lines 25-35):**
```typescript
const useCases = [
  {
    id: 'clarity',
    icon: '🚀',
    title: 'From Vague Aspiration to Clear Action Plan',
    description:
      '"I want to launch a SaaS product" becomes "Build MVP in 30 days, validate with 10 early users, iterate based on feedback." Your AI mirror breaks down dreams into concrete steps.',
    example: 'Real example from demo: Launch My SaaS Product',
  },
  // ...
```

**Changes Required:**
Replace the first use case with reflective messaging:

```typescript
{
  id: 'clarity',
  icon: '🔮',
  title: 'From Inner Confusion to Clear Self-Understanding',
  description:
    '"I feel stuck but don\'t know why" becomes a journey of discovery where your AI mirror reflects your thoughts back, helping you recognize patterns and truths you already know.',
  example: 'Discover what\'s really holding you back',
},
```

**Acceptance Criteria:**
- [ ] No "action plan" or "concrete steps" language
- [ ] Messaging emphasizes reflection and self-discovery
- [ ] Example is appropriate for reflective product

---

## Task 2: Upgrade Button Routing (Priority 2)

**Status:** PENDING

**File 1:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/shared/AppNavigation.tsx`

**Changes Required:**

Line 205: Change
```typescript
onClick={() => router.push('/subscription')}
```
to
```typescript
onClick={() => router.push('/pricing')}
```

Line 281: Change
```typescript
<Link href="/subscription" className="dashboard-dropdown-item">
```
to
```typescript
<Link href="/pricing" className="dashboard-dropdown-item">
```

**File 2:** Delete `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/public/subscription/index.html`

**Acceptance Criteria:**
- [ ] Upgrade button navigates to /pricing
- [ ] Dropdown upgrade link navigates to /pricing
- [ ] Deprecated public/subscription/index.html is deleted
- [ ] PayPal checkout flow works from /pricing

---

## Task 3: Free Tier Limits Display (Priority 3)

**Status:** VERIFIED - NO CHANGES NEEDED

Explorer 2 verified that:
- SubscriptionCard.tsx correctly shows "2 monthly reflections" and "2 active dreams"
- Evolution page uses FeatureLockOverlay for free tier
- Visualizations page uses FeatureLockOverlay for free tier
- All constants are correct

**Action:** Confirm working and mark complete.

---

## Task 4: Mobile Horizontal Overflow (Priority 4)

**Status:** PENDING - NEEDS INVESTIGATION

**Approach:**
1. Start dev server and test on mobile viewports
2. Use browser DevTools to identify overflow source
3. Fix with appropriate CSS

**Potential Fixes:**
- Add `max-width: 100%` to overflowing elements
- Add `overflow-x: hidden` to specific containers
- Fix any fixed-width elements in navigation or footer

**Test Viewports:**
- 320px (iPhone SE)
- 375px (iPhone X/12/13)
- 414px (iPhone Plus models)

**Acceptance Criteria:**
- [ ] No horizontal scroll on any mobile viewport
- [ ] Desktop layout unchanged

---

## Builder Instructions

1. Start with Task 1 (landing page) - text changes only
2. Move to Task 2 (routing) - 2 line changes + delete file
3. Verify Task 3 (already complete based on exploration)
4. Debug and fix Task 4 (mobile overflow)

Report status: COMPLETE or SPLIT (if Task 4 is too complex)
