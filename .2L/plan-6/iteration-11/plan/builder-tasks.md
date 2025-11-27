# Builder Task Breakdown - Iteration 11

**Iteration:** 11 (Global)
**Plan:** plan-6
**Phase:** Systematic Polish & QA
**Created:** 2025-11-28

---

## Overview

**2 primary builders** will work in parallel.
**NO builder splits anticipated** - Task complexity is MEDIUM, well-documented patterns exist.

---

## Builder Assignment Strategy

**Parallel Execution:** Builders work on independent areas to minimize integration overhead

**Builder-1: Visual Polish Specialist**
- Features 7, 8, 9 (Micro-interactions, Typography audit, Color audit)
- Duration: 13-19 hours (1.5-2.5 days)
- Dependencies: None (extends existing patterns)
- Output: Enhanced animations, semantic typography/colors applied

**Builder-2: Validation & QA Specialist**
- Features 10, 11, 12, 13 (Accessibility, Performance, Cross-browser, Final QA)
- Duration: 30-44 hours (4-5.5 days)
- Dependencies: Waits for Builder-1 micro-interactions (day 2) to validate 60fps
- Output: 5 validation reports, QA checklist results, bug tickets (P0/P1/P2)

**Integration:** Minimal (1 hour sync on day 5) - Builders coordinate on P0 bug fixes before iteration completion

---

## Builder-1: Visual Polish & Audits

### Scope

Systematic refinement of micro-interactions, typography, and color semantics across the entire application. This builder focuses on making interactions feel premium, text readable, and colors semantic.

**Core Responsibility:** Apply systematic polish to established design system

---

### Complexity Estimate

**MEDIUM** (13-19 hours total)

**Breakdown:**
- Feature 7 (Micro-interactions): 6-8 hours (MEDIUM complexity)
- Feature 8 (Typography audit): 4-6 hours (LOW-MEDIUM complexity)
- Feature 9 (Color audit): 3-5 hours (LOW-MEDIUM complexity)

**Rationale:** Well-documented patterns exist, grep-based audits are systematic, animation variants straightforward to add. No complex state management or API integration.

---

### Success Criteria

- [ ] **Feature 7: Micro-Interactions Feel Premium**
  - 4 new animation variants added to `lib/animations/variants.ts` (inputFocus, cardPress, characterCounter, pageTransition)
  - `useReducedMotion()` hook created and tested
  - Textarea focus glow applied to reflection form
  - Character counter color shift implemented (white → gold → red)
  - Dashboard card press feedback applied (scale-down on click)
  - Navigation active page indicator visible
  - Page transitions smooth (150ms out, 300ms in)
  - CosmicLoader minimum 500ms display time implemented
  - Reduced motion tested and working (animations disabled except opacity)

- [ ] **Feature 8: Typography Semantic & Readable**
  - All 7 pages audited (dashboard, reflection, dreams, evolution, visualizations, reflections, reflections/[id])
  - Zero arbitrary font-size values found (grep returns no matches)
  - All headings use semantic classes (.text-h1, .text-h2, .text-h3)
  - All body text uses .text-body with leading-relaxed (1.75 line-height)
  - Reading widths optimal (max-w-[720px] for reflection content)
  - Contrast ratios verified (Lighthouse audit, all WCAG AA compliant)

- [ ] **Feature 9: Color Semantics Consistent**
  - Zero arbitrary Tailwind colors found (grep returns no matches)
  - All colors from `mirror.*` palette (purple, gold, blue, red, white opacities)
  - Semantic usage verified (purple=primary, gold=success, blue=info, red=error)
  - Borderline contrasts upgraded (60% → 70% for critical content)
  - Color usage documented (patterns.md updated if new patterns discovered)

---

### Files to Create

**NEW Files:**
- `hooks/useReducedMotion.ts` - Accessibility preference detection hook

**MODIFIED Files (Extensions/Audits):**
- `lib/animations/variants.ts` - Add 4 new variants (lines ~270-350, append at end)
- `app/reflection/MirrorExperience.tsx` - Apply inputFocusVariants to textareas, character counter color shift
- `components/dashboard/cards/DashboardCard.tsx` - Apply cardPressVariants
- `components/shared/AppNavigation.tsx` - Add active page indicator (CSS or framer-motion)
- `app/template.tsx` - Verify page transition timing (may need pageTransitionVariants)
- `app/dashboard/page.tsx` - Typography audit, color audit
- `app/dreams/page.tsx` - Typography audit, color audit
- `app/evolution/page.tsx` - Typography audit, color audit
- `app/visualizations/page.tsx` - Typography audit, color audit
- `app/reflections/page.tsx` - Typography audit, color audit
- `app/reflections/[id]/page.tsx` - Typography audit, color audit

**NO Files to Delete** - Only extensions and refinements

---

### Dependencies

**Depends on:** NONE (all patterns established in Iterations 1-10)

**Blocks:** Builder-2 (Feature 11: Performance validation needs Builder-1's animations complete to validate 60fps)

**Coordination Point:** Day 2 - Builder-1 completes micro-interactions, Builder-2 validates 60fps performance

---

### Implementation Notes

**Feature 7: Micro-Interactions & Animations (6-8 hours)**

**Day 1 (4-5 hours):**
1. Create `hooks/useReducedMotion.ts`:
   - Copy pattern from `patterns.md` Pattern 2
   - Test with DevTools → Rendering → Emulate prefers-reduced-motion
   - Verify hook returns `true` when preference enabled

2. Add 4 new variants to `lib/animations/variants.ts`:
   ```typescript
   // Append at end of file (after existing 15 variants)
   export const inputFocusVariants: Variants = { /* Pattern 1 */ };
   export const cardPressVariants: Variants = { /* Pattern 1 */ };
   export const characterCounterVariants: Variants = { /* Pattern 1 */ };
   export const pageTransitionVariants: Variants = { /* Pattern 1 */ };
   ```
   - Copy code from `patterns.md` Pattern 1
   - Verify TypeScript types (no errors)

3. Apply `inputFocusVariants` to reflection form:
   - File: `app/reflection/MirrorExperience.tsx`
   - Find all `<textarea>` elements (likely 4: dream description, current state, desired state, obstacles)
   - Wrap with `<motion.textarea>`
   - Apply `inputFocusVariants` (see `patterns.md` Pattern 9)
   - Test: Focus textarea, verify purple glow appears smoothly

4. Implement character counter color shift:
   - Find character counter element (likely `<span>` with `{currentLength} / {maxLength}`)
   - Add conditional color logic (see `patterns.md` Pattern 10)
   - Test: Type to 70% capacity (gold), 90% capacity (red)

**Day 2 (2-3 hours):**
5. Apply `cardPressVariants` to dashboard cards:
   - File: `components/dashboard/cards/DashboardCard.tsx` (or similar)
   - Wrap card with `<motion.div variants={cardPressVariants} whileTap="tap">`
   - Test: Click card, verify scale-down (0.98) then scale back to 1.0

6. Add navigation active page indicator:
   - File: `components/shared/AppNavigation.tsx`
   - Method 1 (CSS): Add `aria-current="page"` to active link, style with CSS
   - Method 2 (Framer): Apply glow animation to active link
   - Test: Navigate between pages, verify active indicator visible

7. Verify page transitions:
   - File: `app/template.tsx` (already exists)
   - Check if `pageTransitionVariants` needed (may already use fadeInVariants)
   - Test: Navigate between pages, verify 300ms fade-in, 150ms fade-out
   - Adjust timing if needed (vision.md specifies 150ms out, 300ms in)

8. Test reduced motion support:
   - Enable prefers-reduced-motion in Chrome DevTools
   - Reload app, verify:
     - No animations except opacity fades
     - Textareas show instant focus (no glow transition)
     - Cards don't lift on hover
     - Page transitions instant
   - Document test results

**Feature 8: Typography Audit (4-6 hours)**

**Day 2-3 (4-6 hours):**
1. **Grep audit - Find violations:**
   ```bash
   # Find arbitrary font-size values
   grep -r "text-\[[0-9]" app/ components/ --include="*.tsx" > typography-violations.txt

   # Find arbitrary line-heights
   grep -r "leading-\[[0-9]" app/ components/ --include="*.tsx" >> typography-violations.txt

   # Find hardcoded fontSize
   grep -r "fontSize:" app/ components/ --include="*.tsx" >> typography-violations.txt
   ```

2. **Systematic fix - Replace with semantic classes:**
   - Open `typography-violations.txt`, work through line-by-line
   - Replace patterns (see `patterns.md` Pattern 4):
     - `text-[48px]` → `text-h1`
     - `text-4xl` → `text-h1` (if not using semantic utility)
     - `text-lg leading-8` → `text-body` (leading-relaxed 1.75 built-in)

3. **Page-by-page audit:**
   - `app/dashboard/page.tsx`:
     - Hero heading: Should use `text-h1 gradient-text-cosmic`
     - Section headings: Should use `text-h2`
     - Body text: Should use `text-body text-white/80`
     - Metadata: Should use `text-small text-white/70` (or /60 if non-critical)
   - Repeat for all 7 pages (dashboard, reflection, dreams, evolution, visualizations, reflections, reflections/[id])

4. **Contrast validation:**
   - Run Chrome DevTools Lighthouse accessibility audit on all 7 pages
   - Check contrast ratios (Elements panel → Styles → Color swatch → Contrast ratio)
   - Fix violations:
     - If text-white/60 fails contrast on critical content → Upgrade to text-white/70
     - If text-white/40 used for body text → Upgrade to text-white/80
   - Document fixes in audit notes

5. **Verify grep returns zero matches:**
   ```bash
   # Should return ZERO matches after fixes
   grep -r "text-\[[0-9]" app/ components/ --include="*.tsx"
   ```

**Feature 9: Color Audit (3-5 hours)**

**Day 3 (3-5 hours):**
1. **Grep audit - Find arbitrary colors:**
   ```bash
   # Find arbitrary Tailwind colors
   grep -r "text-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx" > color-violations.txt
   grep -r "bg-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx" >> color-violations.txt
   grep -r "border-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx" >> color-violations.txt

   # Find hardcoded hex colors
   grep -r "color: '#" app/ components/ --include="*.tsx" >> color-violations.txt
   ```

2. **Systematic fix - Replace with semantic palette:**
   - Work through `color-violations.txt` line-by-line
   - Replace patterns (see `patterns.md` Pattern 5):
     - `text-green-400` → `text-mirror-success`
     - `bg-green-100` → `bg-mirror-success/10`
     - `border-green-500` → `border-mirror-success/50`
     - `text-purple-500` → `text-mirror-amethyst`
     - Hardcoded hex → CSS variable from `styles/variables.css`

3. **Semantic usage validation:**
   - Verify color usage follows semantic rules:
     - **Purple/Amethyst:** Primary actions (buttons, CTAs), active states, emphasis
     - **Gold:** Success moments, positive stats, highlights
     - **Blue:** Information messages, calm actions
     - **Red:** Errors, warnings, validation failures
     - **White opacities:** Text hierarchy (100%, 95%, 90%, 80%, 70%, 60%, 50%, 40% only)

4. **Contrast validation:**
   - Run Lighthouse accessibility audit (same as typography audit)
   - Check critical content uses 70%+ opacity (WCAG AA compliant)
   - Downgrade non-critical metadata to 60% if borderline acceptable
   - Mark decorative-only text as 40% (document in code comments)

5. **Verify grep returns zero matches:**
   ```bash
   # Should return ZERO matches after fixes
   grep -r "text-\(red\|blue\|green\|yellow\|purple\)-[0-9]\{3\}" app/ components/ --include="*.tsx"
   ```

6. **Document color usage:**
   - If new semantic patterns discovered, add to `patterns.md`
   - Update `styles/variables.css` comments if opacity standards changed

---

### Patterns to Follow

**Reference `patterns.md` sections:**
- **Pattern 1:** Framer Motion Variants (add 4 new variants)
- **Pattern 2:** Reduced Motion Support (create useReducedMotion hook, test 3-layer support)
- **Pattern 4:** Semantic Typography Classes (audit methodology)
- **Pattern 5:** Semantic Color System (audit methodology)
- **Pattern 9:** Reflection Form Input with Focus Glow (apply to textareas)
- **Pattern 10:** Character Counter Color Shift (apply to reflection form)
- **Pattern 12:** Grep-Based Audit (commands for finding violations)

---

### Testing Requirements

**Manual Testing (Builder-1 Self-Validation):**

1. **Micro-interactions (Visual inspection):**
   - Reflection form: Focus textarea, verify smooth purple glow (2-3 second observation)
   - Reflection form: Type to 70% capacity, verify gold counter; type to 90%, verify red counter
   - Dashboard: Click dream card, verify subtle scale-down feedback
   - Navigation: Verify active page has indicator (underline, glow, or color difference)
   - Page transitions: Navigate between pages, verify smooth crossfade

2. **Reduced motion (DevTools test):**
   - Chrome DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion: reduce
   - Reload app
   - Verify all animations disabled (except opacity fades)
   - Disable emulation, verify animations return

3. **Typography (Grep verification):**
   - Run grep commands (Pattern 12), verify ZERO matches
   - Visual inspection: All headings distinct hierarchy, body text readable

4. **Color (Grep verification):**
   - Run grep commands (Pattern 12), verify ZERO matches
   - Visual inspection: Success = green/gold, Error = red, Info = blue, Primary = purple

**Performance Testing (Coordinate with Builder-2 on Day 2):**
- Builder-1 completes micro-interactions → Builder-2 validates 60fps (Chrome DevTools Performance panel)

---

### Potential Split Strategy

**NOT RECOMMENDED** - Feature 7-9 can be completed by single builder in 13-19 hours

**Rationale:**
- Systematic work with clear patterns
- Grep audits are fast (1-2 hours each)
- Animation variants straightforward (copy-paste from patterns.md)
- No complex state management or API integration

**If split becomes necessary (only if Builder-1 blocked or unavailable):**

**Foundation (Builder-1 Day 1):**
- Create `hooks/useReducedMotion.ts`
- Add 4 new variants to `lib/animations/variants.ts`
- Apply inputFocusVariants to reflection form

**Sub-Builder 1A (Typography Audit):**
- Grep audit: Find all arbitrary font-size values
- Systematic fix: Replace with semantic classes
- Verify with grep (ZERO matches)
- Estimate: 4-6 hours

**Sub-Builder 1B (Color Audit):**
- Grep audit: Find all arbitrary colors
- Systematic fix: Replace with semantic palette
- Verify with grep (ZERO matches)
- Estimate: 3-5 hours

---

## Builder-2: Validation & QA

### Scope

Comprehensive validation and quality assurance across accessibility, performance, cross-browser compatibility, and end-to-end user flows. This builder ensures the application meets WCAG AA standards, performance budgets, and works flawlessly across all target browsers.

**Core Responsibility:** Validate 10/10 product quality through systematic manual testing

---

### Complexity Estimate

**MEDIUM-HIGH** (30-44 hours total)

**Breakdown:**
- Feature 10 (Accessibility): 6-8 hours (MEDIUM complexity, manual testing)
- Feature 11 (Performance): 6-10 hours (MEDIUM complexity, profiling + optimization)
- Feature 12 (Cross-browser): 8-12 hours (MEDIUM-HIGH complexity, 20 test scenarios)
- Feature 13 (Final QA): 10-14 hours (HIGH complexity, 87 acceptance criteria + 3 user flows)

**Rationale:** 100% manual testing (no automation), comprehensive scope (87 criteria), real device testing required, subjective quality assessment ("feels premium").

---

### Success Criteria

- [ ] **Feature 10: Accessibility WCAG AA Compliant**
  - All interactive elements keyboard accessible (Tab, Enter, Escape tested)
  - Screen reader friendly (NVDA/VoiceOver tested, ARIA labels verified)
  - Color contrast meets WCAG AA (4.5:1 minimum for normal text, 3:1 for large)
  - Reduced motion respected (animations disabled except opacity fades)
  - Validation report documented (`.2L/plan-6/iteration-11/validation/accessibility-report.md`)

- [ ] **Feature 11: Performance Budget Met**
  - LCP <2.5s on all pages (Lighthouse measurements documented)
  - FID <100ms on all interactions (Chrome DevTools measurements documented)
  - 60fps animations on modern devices (desktop, iPhone 12+, 2020+ Android)
  - Bundle size maintained (no significant growth from Iteration 10 baseline)
  - Validation report documented (`.2L/plan-6/iteration-11/validation/performance-report.md`)

- [ ] **Feature 12: Cross-Browser Compatible**
  - Chrome (latest): All features work, all pages render correctly
  - Firefox (latest): All features work, all pages render correctly
  - Safari (latest): All features work, backdrop-filter verified
  - Edge (latest): All features work, all pages render correctly
  - 5 breakpoints tested per browser (320px, 768px, 1024px, 1440px, 1920px)
  - 3 critical user flows tested per browser (onboarding, engagement, evolution)
  - Validation report documented (`.2L/plan-6/iteration-11/validation/cross-browser-report.md`)

- [ ] **Feature 13: Final QA Complete**
  - 87 acceptance criteria tested (vision.md checklist)
  - 3 critical user flows pass (onboarding, engagement, evolution unlock)
  - Regression testing complete (Dreams, Reflections, Evolution existing features work)
  - Edge cases validated (empty states, loading states, error states)
  - Bug triage complete (P0 bugs fixed, P1/P2 documented in backlog)
  - QA checklist documented (`.2L/plan-6/iteration-11/validation/qa-checklist.md`)
  - Regression report documented (`.2L/plan-6/iteration-11/validation/regression-report.md`)

---

### Files to Create

**NEW Validation Reports:**
- `.2L/plan-6/iteration-11/validation/qa-checklist.md` - 87 acceptance criteria (checkbox format)
- `.2L/plan-6/iteration-11/validation/accessibility-report.md` - Keyboard nav, screen reader, contrast results
- `.2L/plan-6/iteration-11/validation/performance-report.md` - LCP, FID, 60fps, bundle size results
- `.2L/plan-6/iteration-11/validation/cross-browser-report.md` - Chrome, Firefox, Safari, Edge results (20 test scenarios)
- `.2L/plan-6/iteration-11/validation/regression-report.md` - Dreams, Reflections, Evolution validation

**NO Code Files Modified** - Validation only (unless P0 bugs found, then coordinate with Builder-1 for fixes)

---

### Dependencies

**Depends on:** Builder-1 (Feature 7 micro-interactions must be complete to validate 60fps on Day 2)

**Blocks:** Iteration completion (QA results determine if ready to ship)

**Coordination Point:** Day 2 - Builder-1 completes animations, Builder-2 validates 60fps; Day 5 - Builder-2 completes QA, both builders review P0 bugs

---

### Implementation Notes

**Feature 10: Accessibility Validation (6-8 hours)**

**Day 1 (3-4 hours) - Keyboard Navigation & Screen Reader:**

1. **Create validation directory:**
   ```bash
   mkdir -p .2L/plan-6/iteration-11/validation
   ```

2. **Keyboard navigation testing** (2-3 hours):
   - Start at `/dashboard` page
   - Tab through ALL interactive elements:
     - "Reflect Now" button (focus ring visible?)
     - Each dream card (focus ring visible?)
     - Navigation links (Home, Reflections, Dreams, etc.)
   - Test Enter/Space activation on all buttons
   - Test Escape key closes modals (if applicable)
   - **Document in `accessibility-report.md`:**
     ```markdown
     ## Keyboard Navigation Results

     ### Dashboard Page
     - [x] "Reflect Now" button: Focus ring visible (2px purple glow)
     - [x] Dream cards: Focus ring visible
     - [ ] Navigation links: No focus ring (FAIL - FIX REQUIRED)
     ```
   - Repeat for all pages (reflection, dreams, evolution, visualizations, reflections, reflections/[id])

3. **Screen reader testing** (1-2 hours):
   - macOS: Enable VoiceOver (Cmd+F5)
   - Windows: Install NVDA (free from nvaccess.org)
   - Navigate through dashboard:
     - Verify headings announce correctly ("Heading level 1: Dashboard")
     - Verify buttons announce name and role ("Button: Reflect Now")
     - Verify form labels announce ("Describe your dream, edit text")
   - **Document failures in `accessibility-report.md`:**
     ```markdown
     ## Screen Reader Results

     ### Dashboard Page
     - [x] h1 heading announces correctly
     - [ ] Icon-only buttons missing aria-label (FAIL - FIX REQUIRED)
     ```

**Day 1 (3-4 hours) - Contrast & Reduced Motion:**

4. **Color contrast audit** (1-2 hours):
   - Chrome DevTools → Elements panel
   - Select text element (e.g., `<h1>Dashboard</h1>`)
   - Styles panel → Click color swatch
   - Verify contrast ratio (green checkmark = WCAG AA pass, red X = fail)
   - Test ALL text types:
     - Primary headings (text-white): ___:1 contrast
     - Body text (text-white/80): ___:1 contrast (target 4.5:1+)
     - Metadata (text-white/70): ___:1 contrast
   - **Document in `accessibility-report.md`:**
     ```markdown
     ## Color Contrast Results (WCAG AA: 4.5:1 minimum)

     ### Dashboard Page
     - [x] h1 heading (text-white): 21:1 contrast (PASS)
     - [x] Body text (text-white/80): 12:1 contrast (PASS)
     - [ ] Metadata (text-white/60): 3.8:1 contrast (FAIL - Upgrade to 70%)
     ```

5. **Reduced motion testing** (1 hour):
   - Chrome DevTools → Rendering panel → Emulate CSS media feature prefers-reduced-motion: reduce
   - Reload app
   - Verify:
     - No animations except opacity fades
     - Textareas show instant focus (no glow transition)
     - Cards don't lift on hover
     - Page transitions instant (no crossfade delay)
   - **Document in `accessibility-report.md`:**
     ```markdown
     ## Reduced Motion Results

     - [x] All animations disabled except opacity
     - [x] Textareas instant focus (no glow animation)
     - [x] Page transitions instant
     - [x] App remains functional (no blank states)
     ```

6. **Compile accessibility report:**
   - Summarize findings
   - List P0 bugs (blocking accessibility issues)
   - List P1 bugs (important but not blocking)
   - Recommend fixes (coordinate with Builder-1 if code changes needed)

**Feature 11: Performance Validation (6-10 hours)**

**Day 2-3 (6-10 hours):**

1. **LCP measurement** (2-3 hours):
   - Open Chrome DevTools → Lighthouse tab
   - Test each page:
     - Device: Desktop
     - Categories: Performance only
     - Throttling: Simulated Fast 3G
   - **Document results in `performance-report.md`:**
     ```markdown
     ## LCP (Largest Contentful Paint) Results
     Target: <2.5s (2500ms)

     | Page | LCP (ms) | Element | PASS/FAIL |
     |------|----------|---------|-----------|
     | Dashboard | 1820 | h1 | PASS |
     | Reflection | 2100 | textarea | PASS |
     | Dreams | 1950 | h1 | PASS |
     | Evolution | 2800 | report container | FAIL |
     | Visualizations | 2200 | chart | PASS |
     ```
   - If FAIL: Investigate slow element, recommend optimization (lazy loading, code splitting)

2. **FID measurement** (2-3 hours):
   - Chrome DevTools → Performance panel
   - Record first interaction on each page:
     - Dashboard: Click "Reflect Now" button
     - Reflection: Focus first textarea
     - Dreams: Click "Create Dream" button
   - Measure: Time from click to browser response
   - **Document results in `performance-report.md`:**
     ```markdown
     ## FID (First Input Delay) Results
     Target: <100ms

     | Page | Interaction | FID (ms) | PASS/FAIL |
     |------|-------------|----------|-----------|
     | Dashboard | Click "Reflect Now" | 42 | PASS |
     | Reflection | Focus textarea | 18 | PASS |
     | Dreams | Click "Create Dream" | 65 | PASS |
     ```

3. **60fps animation profiling** (2-3 hours):
   - Chrome DevTools → Performance panel
   - Record animations (3-5 seconds each):
     - Dashboard card stagger entrance
     - Dashboard card hover (lift + glow)
     - Reflection textarea focus (glow animation)
     - Page transition (crossfade)
   - Analyze FPS graph:
     - GREEN = 60fps (PASS)
     - YELLOW = 30-60fps (acceptable on old devices)
     - RED = <30fps (FAIL - optimize required)
   - **Document results in `performance-report.md`:**
     ```markdown
     ## 60fps Animation Profiling

     | Animation | FPS (avg) | FPS (min) | PASS/FAIL |
     |-----------|-----------|-----------|-----------|
     | Dashboard stagger | 60 | 58 | PASS |
     | Card hover | 60 | 60 | PASS |
     | Textarea focus | 55 | 50 | PASS (borderline) |
     | Page transition | 60 | 60 | PASS |
     ```

4. **Bundle size analysis** (1 hour):
   - Run `npm run build`
   - Check output:
     ```
     Route (app)                              Size     First Load JS
     ┌ ○ /                                    5 kB          85 kB
     ├ ○ /dashboard                           8 kB          88 kB
     ├ ○ /reflection                          12 kB         92 kB
     ...
     ```
   - Compare to Iteration 10 baseline (if documented)
   - **Document in `performance-report.md`:**
     ```markdown
     ## Bundle Size Analysis
     Target: No significant growth (+20KB maximum)

     | Chunk | Size (Iteration 10) | Size (Iteration 11) | Delta | PASS/FAIL |
     |-------|---------------------|---------------------|-------|-----------|
     | main-app.js | 5.8 MB | 5.82 MB | +20 KB | PASS |
     | dashboard.js | 88 KB | 89 KB | +1 KB | PASS |
     ```

**Feature 12: Cross-Browser & Responsive Testing (8-12 hours)**

**Day 3-4 (8-12 hours):**

1. **Browser matrix setup:**
   - Chrome (latest): Primary browser (60% users)
   - Firefox (latest): Secondary browser (15% users)
   - Safari (latest): macOS/iOS browser (20% users)
   - Edge (latest): Windows browser (5% users)

2. **Per-browser testing** (2-3 hours per browser):
   - Load all pages (dashboard, reflection, dreams, evolution, visualizations, reflections, reflections/[id])
   - Test 3 critical user flows:
     - **Flow 1: New user onboarding** (sign in → create dream → first reflection → view output)
     - **Flow 2: Returning user engagement** (browse reflections → view one → create new)
     - **Flow 3: Evolution unlock** (4th reflection → unlock message → view evolution report)
   - **Test 5 breakpoints per browser:**
     - 320px (iPhone SE - small mobile)
     - 768px (iPad - tablet)
     - 1024px (MacBook - laptop)
     - 1440px (Desktop)
     - 1920px (Large desktop)
   - **Document in `cross-browser-report.md`:**
     ```markdown
     ## Chrome (Latest) Results

     ### Pages Tested
     - [x] Dashboard: Renders correctly, no layout issues
     - [x] Reflection: Textareas work, focus glow visible
     - [x] Dreams: Grid layout correct at all breakpoints

     ### User Flows
     - [x] Flow 1 (Onboarding): PASS (all steps work)
     - [x] Flow 2 (Engagement): PASS
     - [x] Flow 3 (Evolution): PASS

     ### Breakpoints
     - [x] 320px: Layout stacks, no horizontal scroll
     - [x] 768px: Grid adapts to 2 columns
     - [x] 1024px: Desktop navigation appears
     - [x] 1440px: Max-width 1200px centered
     - [x] 1920px: No layout breakage

     ### Issues Found
     - NONE (Chrome is primary development browser)
     ```
   - Repeat for Firefox, Safari, Edge

3. **Safari-specific testing:**
   - Verify `backdrop-filter: blur(40px)` works (GlassCard component)
   - If Safari <14: Fallback to solid background `bg-white/8` (no blur)
   - Test iOS Safari on real iPhone SE (if available)

4. **Real device testing** (2-3 hours):
   - iPhone SE (iOS Safari): Test touch interactions, viewport height
   - Android phone (Chrome): Test touch targets (44x44px minimum)
   - iPad (Safari): Test tablet layout (768px breakpoint)

**Feature 13: Final QA (10-14 hours)**

**Day 4-5 (10-14 hours):**

1. **Create QA checklist** (1 hour):
   - File: `.2L/plan-6/iteration-11/validation/qa-checklist.md`
   - Copy 87 acceptance criteria from `vision.md` (Features 1-10)
   - Format as checkboxes:
     ```markdown
     ## Feature 7: Micro-Interactions & Animations

     ### Reflection Form
     - [ ] Textarea focus: Subtle glow border animation
     - [ ] Character counter: Color shift white → gold → red
     - [ ] Submit button hover: Lift + glow (already exists)

     ### Dashboard Cards
     - [ ] Hover: Lift + purple glow
     - [ ] Click: Scale-down (0.98) then scale back

     ### Navigation
     - [ ] Active page indicator visible
     - [ ] Hover: Smooth color transition (200ms)

     ### Page Transitions
     - [ ] All pages fade-in on mount (300ms)
     - [ ] Route crossfade (150ms out, 300ms in)

     ### Loading States
     - [ ] CosmicLoader fade-in
     - [ ] Minimum 500ms display

     ### Reduced Motion
     - [ ] Animations disabled except opacity fades
     - [ ] App remains functional
     ```

2. **Smoke test - 87 acceptance criteria** (4-6 hours):
   - Work through QA checklist systematically
   - Test each criterion (checkbox format)
   - Document failures with screenshots:
     ```markdown
     - [x] Textarea focus glow: PASS (smooth purple glow)
     - [ ] Character counter red at 90%: FAIL (stays gold) - P1 bug
     ```
   - Prioritize bugs:
     - **P0 (Blocking):** App crashes, critical features broken, WCAG AA violations
     - **P1 (Important):** Visual bugs, incorrect behavior, performance issues
     - **P2 (Polish):** Minor visual inconsistencies, edge cases

3. **3 critical user flows validation** (3-4 hours):
   - **Flow 1: New user onboarding:**
     - Sign in → Dashboard (sees empty states)
     - Create dream → Dashboard updates (1 dream card)
     - Click "Reflect Now" → Reflection page
     - Fill 4 questions + select tone → Submit
     - Loading state (min 500ms) → Reflection output
     - Return to dashboard → Recent reflections shows first reflection
     - **Document pass/fail for each step**

   - **Flow 2: Returning user engagement:**
     - Sign in → Dashboard (sees dreams + reflections)
     - Browse recent reflections
     - Click reflection card → Individual reflection page
     - Read formatted markdown (AI response)
     - Click "Back to Reflections" → Collection page
     - Filter by specific dream
     - Click "Reflect on this dream" → Reflection page (dreamId pre-filled)
     - Create new reflection → Dashboard updates
     - **Document pass/fail for each step**

   - **Flow 3: Evolution unlock:**
     - Complete 4th reflection on a dream
     - See unlock message: "✨ You've unlocked Evolution Insights!"
     - Click "View Your Evolution"
     - Evolution report generates (loading state)
     - Report appears: Temporal analysis, growth patterns, quotes
     - Return to dashboard → Evolution insights preview visible
     - **Document pass/fail for each step**

4. **Regression testing** (2-3 hours):
   - **Dreams (existing features):**
     - Create dream
     - Edit dream
     - Archive dream
   - **Reflections (existing features):**
     - Create reflection
     - View reflection
     - Filter reflections by dream
   - **Evolution (existing features):**
     - Generate evolution report (4+ reflections)
     - View evolution insights
   - **Visualizations (existing features):**
     - View charts (if 4+ reflections)
   - **Document in `regression-report.md`:**
     ```markdown
     ## Regression Testing Results

     ### Dreams
     - [x] Create dream: Works (no regressions)
     - [x] Edit dream: Works
     - [x] Archive dream: Works

     ### Reflections
     - [x] Create reflection: Works (new focus glow animation)
     - [x] View reflection: Works (markdown renders correctly)
     - [x] Filter reflections: Works

     ### Evolution
     - [x] Generate evolution report: Works
     - [x] View evolution insights: Works

     ### Visualizations
     - [x] View charts: Works
     ```

5. **Edge case validation** (1-2 hours):
   - **Empty states:**
     - 0 dreams: "Create your first dream" message visible
     - 0 reflections: "Your first reflection awaits" message visible
     - 0 evolution reports: "Evolution insights unlock after 4 reflections" (0/4 progress)
   - **Loading states:**
     - Slow network: Throttle to Slow 3G, verify loading spinners appear
     - CosmicLoader minimum 500ms: Fast API response still shows loader briefly
   - **Error states:**
     - API failure: Disconnect network, verify error message appears
     - 404 reflection: Navigate to `/reflections/nonexistent-id`, verify 404 page
     - Form validation: Submit reflection with empty fields, verify error messages

6. **Compile final QA report:**
   - Summarize all findings
   - List P0 bugs (must fix before ship)
   - List P1 bugs (important, may defer to post-MVP)
   - List P2 bugs (polish, likely defer)
   - Recommend ship/no-ship decision

---

### Patterns to Follow

**Reference `patterns.md` sections:**
- **Pattern 12:** Grep-Based Audit (commands for validation)
- **Pattern 13:** Accessibility Testing Checklist (keyboard nav, screen reader, contrast)
- **Pattern 14:** Performance Testing (LCP, FID, 60fps profiling)

---

### Testing Requirements

**Manual Testing (Builder-2 Core Work):**

1. **Accessibility (6-8 hours):**
   - Keyboard navigation: Tab through all pages
   - Screen reader: macOS VoiceOver or NVDA
   - Contrast: Chrome DevTools Accessibility panel
   - Reduced motion: DevTools emulation

2. **Performance (6-10 hours):**
   - LCP: Lighthouse on all pages
   - FID: Performance panel on key interactions
   - 60fps: Performance panel during animations
   - Bundle size: `npm run build` output analysis

3. **Cross-browser (8-12 hours):**
   - Chrome, Firefox, Safari, Edge (latest versions)
   - 5 breakpoints per browser (320px, 768px, 1024px, 1440px, 1920px)
   - 3 user flows per browser
   - Real devices: iPhone SE, Android phone, iPad

4. **Final QA (10-14 hours):**
   - 87 acceptance criteria (QA checklist)
   - 3 critical user flows (end-to-end validation)
   - Regression testing (Dreams, Reflections, Evolution)
   - Edge cases (empty, loading, error states)

**Deliverables:**
- 5 validation reports (accessibility, performance, cross-browser, QA checklist, regression)
- Bug tickets (P0, P1, P2 prioritization)
- Ship/no-ship recommendation

---

### Potential Split Strategy

**RECOMMENDED IF Builder-2 overwhelmed** - 30-44 hours is substantial for single builder

**Foundation (Builder-2 Days 1-2):**
- Feature 10: Accessibility validation (6-8 hours)
- Feature 11: Performance validation (6-10 hours)
- Create validation directory structure
- Document initial findings

**Sub-Builder 2A (Cross-Browser Specialist):**
- Feature 12: Cross-browser testing (8-12 hours)
- Test 4 browsers × 5 breakpoints = 20 scenarios
- Test 3 user flows per browser
- Real device testing (iPhone, Android, iPad)
- Document in `cross-browser-report.md`
- **Estimate:** 8-12 hours (1-1.5 days)

**Sub-Builder 2B (QA Specialist):**
- Feature 13: Final QA (10-14 hours)
- Test 87 acceptance criteria
- Validate 3 critical user flows
- Regression testing
- Edge case validation
- Document in `qa-checklist.md` and `regression-report.md`
- **Estimate:** 10-14 hours (1.25-1.75 days)

**Coordination:** Both sub-builders report findings to primary Builder-2, who compiles final recommendation (ship/no-ship decision)

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)

**Start immediately:**
- **Builder-1:** Feature 7 (Micro-interactions) - Days 1-2
- **Builder-2:** Feature 10 (Accessibility) - Day 1

### Coordination Point (Day 2)

**Builder-1 → Builder-2 handoff:**
- Builder-1 completes micro-interactions
- Builder-2 validates 60fps performance (Feature 11)

### Parallel Group 2 (After coordination)

**Days 2-3:**
- **Builder-1:** Features 8-9 (Typography + Color audits) - Days 2-3
- **Builder-2:** Features 11-12 (Performance + Cross-browser) - Days 2-4

### Final Phase (Day 4-5)

**Builder-2 solo:**
- Feature 13 (Final QA) - Days 4-5
- Compile all validation reports
- Prioritize bugs (P0, P1, P2)

### Integration (Day 5)

**Both builders collaborate:**
- Review P0 bugs (blocking issues)
- Coordinate fixes (if code changes needed)
- Final ship/no-ship decision

---

## Integration Notes

**Minimal integration needed** - Builders working on independent areas

**Shared files:**
- NONE (Builder-1 extends code, Builder-2 creates validation reports only)

**Coordination points:**
1. **Day 2:** Builder-1 completes animations → Builder-2 validates 60fps
2. **Day 5:** Builder-2 completes QA → Both builders review P0 bugs

**Conflict prevention:**
- Builder-1 commits all code changes first (days 1-3)
- Builder-2 creates validation reports in separate directory (no file conflicts)
- If P0 bugs require code changes: Builder-1 makes fixes, Builder-2 re-validates

**P0 Bug Fix Process:**
1. Builder-2 identifies P0 bug (blocking issue)
2. Builder-2 creates bug ticket (markdown file in `.2L/plan-6/iteration-11/bugs/`)
3. Builder-1 reviews ticket, estimates fix time
4. Builder-1 applies fix, commits code
5. Builder-2 re-validates fix (smoke test)
6. Repeat until all P0 bugs resolved

---

## Timeline Summary

**Total Iteration Duration:** 5.5-8 days (2 builders in parallel)

| Day | Builder-1 (Visual Polish) | Builder-2 (Validation & QA) |
|-----|---------------------------|----------------------------|
| 1   | Feature 7: Micro-interactions (4-5 hours) | Feature 10: Accessibility (6-8 hours) |
| 2   | Feature 7: Complete (2-3 hours) <br> Feature 8: Typography audit start | **COORDINATION:** Validate 60fps <br> Feature 11: Performance (6-10 hours) |
| 3   | Feature 8: Complete (2-3 hours) <br> Feature 9: Color audit (3-5 hours) | Feature 11: Complete <br> Feature 12: Cross-browser start (4-6 hours) |
| 4   | **IDLE** (awaiting QA results) | Feature 12: Complete (4-6 hours) <br> Feature 13: Final QA start (5-7 hours) |
| 5   | **COORDINATION:** Review P0 bugs | Feature 13: Complete (5-7 hours) <br> Compile validation reports |
| 5.5-8 | **P0 bug fixes** (both builders collaborate if needed) | **P0 bug re-validation** |

**Critical Path:** Builder-2 (30-44 hours) defines completion timeline

---

## Success Metrics

**Iteration 11 is COMPLETE when:**

1. **Builder-1 deliverables:**
   - [x] 4 new animation variants added to `lib/animations/variants.ts`
   - [x] `hooks/useReducedMotion.ts` created and tested
   - [x] Micro-interactions applied (textareas, cards, navigation, page transitions)
   - [x] Typography audit complete (ZERO arbitrary font-size values)
   - [x] Color audit complete (ZERO arbitrary Tailwind colors)
   - [x] Reduced motion tested and working

2. **Builder-2 deliverables:**
   - [x] 5 validation reports created and documented
   - [x] 87 acceptance criteria tested (QA checklist)
   - [x] 3 critical user flows validated (onboarding, engagement, evolution)
   - [x] Cross-browser testing complete (4 browsers × 5 breakpoints)
   - [x] Regression testing complete (Dreams, Reflections, Evolution)
   - [x] P0 bugs identified and triaged

3. **Both builders:**
   - [x] P0 bugs fixed (blocking issues resolved)
   - [x] Ship/no-ship decision made (based on QA results)
   - [x] Performance budget met (LCP <2.5s, FID <100ms, 60fps)
   - [x] Accessibility maintained (WCAG AA compliance)

---

**This task breakdown provides clear guidance for 2 parallel builders to deliver 10/10 product quality.**
