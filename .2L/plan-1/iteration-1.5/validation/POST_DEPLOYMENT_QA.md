# Post-Deployment QA Checklist

This document outlines the recommended manual QA and runtime testing to complete after deploying Iteration 1.5.

**Status:** Code-level validation COMPLETE (PASS at 92% confidence)
**Remaining:** Runtime verification (manual QA, performance profiling, browser testing)

---

## Quick Start: Dev Server Testing

```bash
# Start development server
npm run dev

# Should start on http://localhost:3002
# Visit in browser to begin manual QA
```

---

## 1. Landing Page Verification (NEW)

**URL:** `http://localhost:3002/`

### Visual Checks
- [ ] Cosmic gradient background displays correctly
- [ ] 5 mirror shards float with smooth animations
- [ ] "The Mirror of Truth" title is centered and visible
- [ ] Main "Reflect Me" circular button appears
- [ ] Two secondary buttons visible:
  - [ ] "Start Free Forever" (green)
  - [ ] "Explore Plans" (purple)
- [ ] Tagline displays: "Stop asking what to do. See who you already are."
- [ ] Sub-tagline displays: "Start completely free. Your truth awaits."
- [ ] Sign-in link at bottom
- [ ] Top-left "Examples" link (green)
- [ ] Top-right "About" link (purple)

### Interactive Checks
- [ ] Hover over main "Reflect Me" button → mirror shards pause floating
- [ ] Hover over secondary buttons → glow and lift effect
- [ ] Click "Reflect Me" → navigates to `/auth/signup` (for non-authenticated)
- [ ] Click "Start Free Forever" → navigates to `/auth/signup`
- [ ] Click "Explore Plans" → navigates to expected page
- [ ] Click sign-in link → navigates to `/auth/signin`

### Responsive Checks
- [ ] Desktop (1920px) - Full layout with proper spacing
- [ ] Tablet (768px) - Adjusted spacing, buttons visible
- [ ] Mobile (480px) - Buttons stack vertically
- [ ] Small mobile (320px) - Minimum sizes maintained
- [ ] Landscape mobile - Compact layout works

---

## 2. Complete User Journey Test

### Flow: Landing → Signup → Dashboard → Reflection → Output

**Steps:**
1. [ ] Visit landing page (`/`)
2. [ ] Click "Start Free Forever" button
3. [ ] Fill out signup form with test credentials
4. [ ] Submit signup → should redirect to dashboard
5. [ ] Verify dashboard loads with 4 cards:
   - [ ] Usage Card
   - [ ] Reflections Card
   - [ ] Evolution Card
   - [ ] Subscription Card
6. [ ] Click "Reflect Now" button
7. [ ] Complete 5-question reflection:
   - [ ] Question 1: Enter text, verify character counter
   - [ ] Question 2: Enter text, verify character counter
   - [ ] Question 3: Enter text, verify character counter
   - [ ] Question 4: Enter text, verify character counter
   - [ ] Question 5: Enter text, verify character counter
8. [ ] Select tone: Gentle Clarity / Luminous Intensity / Sacred Fusion
9. [ ] Submit reflection
10. [ ] Verify reflection output page loads
11. [ ] Verify AI-generated reflection displays in mirror frame
12. [ ] Navigate to "My Reflections" → verify new reflection appears

---

## 3. Reflection Output Page (Suspense Fix Verification)

**URL:** `/reflection/output?id=<reflection_id>`

### Loading State Check
- [ ] Loading fallback displays briefly:
  - [ ] Cosmic background visible
  - [ ] Mirror frame shown
  - [ ] Loading spinner visible
  - [ ] Text: "Preparing your reflection..." displays

### Content Display Check
- [ ] Reflection content loads after loading state
- [ ] Mirror frame displays correctly
- [ ] Reflection text formatted properly
- [ ] No console errors related to Suspense
- [ ] No layout shift during load (CLS < 0.1)

**Expected:** No Suspense warnings in console, smooth loading experience

---

## 4. Responsive Design Testing

Test all pages at these breakpoints:

### 320px (Small Mobile)
- [ ] Landing page
- [ ] Dashboard
- [ ] Reflection questionnaire
- [ ] Reflection output

### 768px (Tablet)
- [ ] Landing page
- [ ] Dashboard
- [ ] Reflection questionnaire
- [ ] Reflection output

### 1920px (Desktop)
- [ ] Landing page
- [ ] Dashboard
- [ ] Reflection questionnaire
- [ ] Reflection output

**How to test:**
1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "Responsive" and enter width manually
4. Test each page at each breakpoint

---

## 5. Performance Testing (Lighthouse)

```bash
# Build production version
npm run build

# Start production server
npm start

# Open Chrome DevTools
# Navigate to "Lighthouse" tab
# Run audit for each page
```

### Target Metrics
| Metric | Target | Landing | Dashboard | Reflection | Output |
|--------|--------|---------|-----------|------------|--------|
| Performance | > 90 | ___ | ___ | ___ | ___ |
| Accessibility | 100 | ___ | ___ | ___ | ___ |
| Best Practices | > 90 | ___ | ___ | ___ | ___ |
| SEO | > 80 | ___ | ___ | ___ | ___ |

### Core Web Vitals
| Metric | Target | Landing | Dashboard | Reflection | Output |
|--------|--------|---------|-----------|------------|--------|
| FCP (First Contentful Paint) | < 2s | ___ | ___ | ___ | ___ |
| LCP (Largest Contentful Paint) | < 2.5s | ___ | ___ | ___ | ___ |
| TTI (Time to Interactive) | < 3s | ___ | ___ | ___ | ___ |
| CLS (Cumulative Layout Shift) | < 0.1 | ___ | ___ | ___ | ___ |

---

## 6. Browser Compatibility Testing

### Chrome/Edge (Primary)
- [ ] Landing page renders correctly
- [ ] All animations smooth (60fps)
- [ ] No console errors
- [ ] Forms work correctly
- [ ] Navigation functional

### Firefox
- [ ] Landing page renders correctly
- [ ] All animations smooth
- [ ] Glass morphism (backdrop-filter) works
- [ ] No console errors
- [ ] Forms work correctly

### Safari (macOS)
- [ ] Landing page renders correctly
- [ ] All animations smooth
- [ ] Glass morphism (backdrop-filter) works (requires Safari 14+)
- [ ] No console errors
- [ ] Forms work correctly

### Safari (iOS)
- [ ] Landing page responsive on iPhone
- [ ] Touch interactions work (tap, swipe)
- [ ] Animations smooth on mobile
- [ ] Forms work (keyboard doesn't obscure inputs)
- [ ] Safe area respected (notch/home indicator)

### Chrome (Android)
- [ ] Landing page responsive on Android
- [ ] Touch interactions work
- [ ] Animations smooth on mobile
- [ ] Forms work correctly

---

## 7. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements on landing page
- [ ] Tab order is logical
- [ ] Focus rings visible on all interactive elements
- [ ] Enter key activates buttons and links
- [ ] Escape key closes modals/dropdowns

### Screen Reader Testing
- [ ] Run Lighthouse accessibility audit (target: 100)
- [ ] Verify ARIA labels on interactive elements
- [ ] Verify semantic HTML usage
- [ ] Test with screen reader (optional):
  - macOS: VoiceOver (Cmd+F5)
  - Windows: NVDA (free)

### Reduced Motion
- [ ] Enable "Reduce Motion" in OS settings:
  - macOS: System Preferences → Accessibility → Display → Reduce motion
  - Windows: Settings → Ease of Access → Display → Show animations
- [ ] Verify animations are disabled or simplified
- [ ] Landing page mirror shards should not float
- [ ] Transitions should be instant or minimal

---

## 8. Error Handling & Edge Cases

### Network Errors
- [ ] Disconnect network, verify error messages display
- [ ] Reconnect, verify recovery behavior
- [ ] Test slow 3G connection (Chrome DevTools → Network → Slow 3G)

### Invalid Data
- [ ] Submit reflection form with empty fields → validation errors
- [ ] Submit form with text exceeding character limits → validation errors
- [ ] Navigate to `/reflection/output` without `?id=` parameter → error handling
- [ ] Navigate to `/reflection/output?id=invalid-id` → error handling

### Authentication Edge Cases
- [ ] Access dashboard without being signed in → redirect to signin
- [ ] Access reflection creation without being signed in → redirect to signin
- [ ] Sign out from dashboard → redirect to landing page
- [ ] Sign out from any page → redirect to landing page

---

## 9. Bundle Size Analysis (Optional)

```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Add to next.config.js:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

### Check for:
- [ ] Landing page bundle < 105 kB (current: 105 kB)
- [ ] Dashboard bundle < 140 kB (current: 132 kB)
- [ ] No duplicate dependencies
- [ ] Large dependencies identified (can optimize later)

---

## 10. Console Error Monitoring

Open DevTools console on each page and verify:

### Landing Page
- [ ] No errors
- [ ] No warnings (React warnings, deprecation notices)
- [ ] No unhandled promise rejections

### Dashboard
- [ ] No errors
- [ ] No warnings
- [ ] tRPC queries succeed

### Reflection Flow
- [ ] No errors during questionnaire
- [ ] No errors during submission
- [ ] No errors on output page
- [ ] No Suspense-related warnings

### Authentication
- [ ] No errors during signup
- [ ] No errors during signin
- [ ] No errors during signout

---

## 11. Visual Regression Testing (Optional)

Compare screenshots of new implementation vs original:

**Original Reference:** `/home/ahiya/mirror-of-truth-online`

### Pages to Compare
- [ ] Landing page at 1920px
- [ ] Landing page at 768px
- [ ] Landing page at 320px
- [ ] Dashboard at 1920px
- [ ] Reflection questionnaire at 1920px
- [ ] Reflection output at 1920px

**Tools:**
- Manual screenshot comparison
- Percy.io (visual regression SaaS)
- BackstopJS (open source)

---

## 12. Post-Deployment Monitoring

After deploying to production:

### First Hour
- [ ] Monitor error tracking (Sentry/similar if configured)
- [ ] Check server logs for errors
- [ ] Verify analytics tracking (if configured)
- [ ] Test production URL on mobile device

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check performance metrics (Web Vitals)
- [ ] Gather user feedback
- [ ] Identify any issues for hotfix

---

## Issue Reporting Template

If issues found during QA, use this template:

```markdown
**Issue:** [Brief description]
**Severity:** Critical / Major / Minor
**Page:** [URL or page name]
**Browser:** [Browser + version]
**Device:** [Desktop / Mobile / Tablet]
**Breakpoint:** [320px / 768px / 1920px]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshot:** [If applicable]
**Console Errors:** [If any]
```

---

## Success Criteria for QA PASS

To consider runtime verification complete:

- [ ] Complete user journey works end-to-end
- [ ] All pages render correctly at 3 breakpoints
- [ ] Lighthouse performance > 90 on all pages
- [ ] Lighthouse accessibility = 100 on all pages
- [ ] No critical console errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive on iOS and Android
- [ ] Keyboard navigation functional
- [ ] Error handling works for all edge cases

**If all checked:** Runtime verification COMPLETE ✅

---

## Deferred Items (Not Blocking MVP)

These can be addressed in future iterations:

- [ ] Examples page creation (link exists but page missing)
- [ ] About page creation (link exists but page missing)
- [ ] Toast notification system (currently using alert())
- [ ] Unit test coverage
- [ ] E2E test automation (Playwright/Cypress)
- [ ] Advanced performance optimization (code splitting, image optimization)

---

**Prepared by:** Re-Validator Agent
**Date:** 2025-10-22
**Iteration:** 1.5
**Purpose:** Post-deployment runtime verification checklist
