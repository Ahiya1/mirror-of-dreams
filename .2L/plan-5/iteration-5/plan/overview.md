# 2L Iteration Plan - Mirror of Dreams (FINAL Iteration)

## Project Vision

Transform Mirror of Dreams into a **production-ready, accessible, delightful experience** through comprehensive micro-interactions, page transitions, semantic color consistency, and WCAG 2.1 AA compliance. This is the **FINAL POLISH** iteration that elevates the application from "functional" to "exceptional."

**What we're building:** The finishing touches that make every interaction feel intentional, responsive, and inclusive.

**Why it matters:** Micro-interactions and accessibility are what separate good software from great software. Users should feel confidence with every click, see clear semantic meaning in colors, and navigate effortlessly regardless of ability.

---

## Success Criteria

Specific, measurable criteria for iteration 5 completion:

### Micro-Interactions
- [ ] All buttons have 200ms transitions (reduced from 300ms)
- [ ] All buttons have visible active states (scale 0.98 + opacity shift)
- [ ] Card hover effects are consistent (lift + subtle glow)
- [ ] Form inputs have error shake animation (400ms)
- [ ] Form inputs have success checkmark animation (300ms)
- [ ] All interactive elements respect `prefers-reduced-motion`

### Page Transitions
- [ ] Page transitions use AnimatePresence (already implemented)
- [ ] Modal entrance animations are smooth (250ms slide-in)
- [ ] All transitions are GPU-accelerated (transform/opacity only)
- [ ] No animation jank or frame drops

### Color Semantics
- [ ] All success states use `mirror.success` (#34d399)
- [ ] All error states use `mirror.error` (#f87171)
- [ ] All info states use `mirror.info` (#818cf8)
- [ ] All primary actions use `mirror.amethyst` (#7c3aed)
- [ ] Zero usage of raw Tailwind colors (red-500, green-500, blue-500) for semantics
- [ ] GlowButton has semantic variants (success, danger, info)
- [ ] GlowBadge uses mirror.* palette exclusively

### Accessibility (WCAG 2.1 AA)
- [ ] Skip navigation link present and functional
- [ ] All icon-only buttons have aria-label
- [ ] User dropdown has aria-expanded + aria-haspopup
- [ ] Mobile menu toggle has aria-label + aria-expanded
- [ ] Modal has focus trap (keyboard navigation contained)
- [ ] Modal auto-focuses close button on open
- [ ] Escape key closes modals
- [ ] All form inputs have visible labels
- [ ] All text meets 4.5:1 contrast ratio (WCAG AA)
- [ ] Lighthouse Accessibility score 95+
- [ ] axe DevTools reports 0 critical issues

---

## MVP Scope

### In Scope (Iteration 5 - FINAL)

**Micro-Interactions:**
- Button hover/active/focus states (200ms transitions)
- Card hover states (lift + glow)
- Input error shake animation
- Input success checkmark animation
- All transitions respect reduced motion

**Page Transitions:**
- Page transitions already implemented (verify performance)
- Modal entrance/exit animations (verify timing)

**Color Semantics:**
- Standardize all semantic colors to mirror.* palette
- Create semantic button variants (success, danger, info)
- Update GlowBadge to use mirror.* colors
- Replace all Tailwind red/green/blue with mirror.error/success/info

**Accessibility Compliance:**
- Add skip navigation link
- Add missing ARIA labels (mobile menu, user dropdown)
- Implement modal focus trap (react-focus-lock)
- Add keyboard navigation for dropdowns
- Verify contrast ratios with Lighthouse
- Add landmark regions (nav, main, header)

### Out of Scope (Post-MVP)

- Advanced micro-interactions (confetti, particle effects)
- Sound effects
- Custom SVG illustrations
- Floating label inputs
- Modal-to-modal cross-fade transitions
- Advanced success animations

---

## Development Phases

1. **Exploration** ✅ Complete (Explorer 1: Animations, Explorer 2: A11y)
2. **Planning** 🔄 Current (Creating comprehensive plan)
3. **Building** ⏳ 12-16 hours (3 parallel builders)
4. **Integration** ⏳ 1 hour (minimal conflicts expected)
5. **Validation** ⏳ 2 hours (Lighthouse + manual keyboard testing)
6. **Deployment** ⏳ Final (merge to main)

---

## Timeline Estimate

- Exploration: ✅ Complete (2 comprehensive reports)
- Planning: 🔄 1 hour (this document + 3 other files)
- Building: 12-16 hours (parallel execution)
  - Builder-1 (Micro-Interactions): 4-6 hours
  - Builder-2 (Accessibility): 5-7 hours
  - Builder-3 (Color Semantics): 3-4 hours
- Integration: 1 hour (merge builder outputs)
- Validation: 2 hours (Lighthouse + keyboard testing + manual QA)
- **Total: ~16-20 hours** (2-3 days with parallel builders)

---

## Risk Assessment

### High Risks

**Risk: Button duration change feels too fast**
- **Impact:** Users may perceive 200ms as "snappy" or "jarring" (33% faster than current 300ms)
- **Mitigation:** Test with users. If feedback is negative, adjust to 250ms as compromise.
- **Probability:** Low (200ms is industry standard for micro-interactions)

**Risk: react-focus-lock adds bundle size**
- **Impact:** Modal focus trap requires external dependency (~5KB gzipped)
- **Mitigation:** Verify bundle size impact. Consider manual implementation if too large.
- **Probability:** Low (5KB is acceptable for critical accessibility feature)

### Medium Risks

**Risk: Error shake animation triggers too frequently**
- **Impact:** Shake animation could trigger on every render if error prop is always present
- **Mitigation:** Only trigger on error state transition (false → true), not on every render
- **Probability:** Medium (requires careful state management in GlassInput)

**Risk: Semantic color migration breaks existing styles**
- **Impact:** Replacing 50+ instances of Tailwind colors could introduce visual regressions
- **Mitigation:** Systematic find/replace with visual QA on every page. Use utility classes for consistency.
- **Probability:** Medium (large refactor across many files)

**Risk: Lighthouse score doesn't reach 95+ after fixes**
- **Impact:** May need additional accessibility work beyond current scope
- **Mitigation:** Prioritize critical issues (skip links, ARIA labels, focus trap). Re-run Lighthouse after each fix.
- **Probability:** Low (explorers identified all major blockers)

### Low Risks

**Risk: Animation performance regression**
- **Impact:** New animations could cause jank on low-end devices
- **Mitigation:** All animations use GPU-accelerated properties (transform/opacity). Test on mobile.
- **Probability:** Very Low (animations already optimized)

---

## Integration Strategy

### Builder Outputs

**Builder-1 (Micro-Interactions):**
- Modified: `components/ui/glass/GlowButton.tsx` (button states)
- Modified: `components/ui/glass/GlassCard.tsx` (hover states)
- Modified: `components/ui/glass/GlassInput.tsx` (error/success animations)
- Modified: `styles/animations.css` (shake keyframe, checkmark keyframe)

**Builder-2 (Accessibility):**
- Modified: `app/layout.tsx` (skip link, main landmark)
- Modified: `components/shared/AppNavigation.tsx` (ARIA labels, keyboard handlers)
- Modified: `components/ui/glass/GlassModal.tsx` (focus trap, Escape handler)
- Added: Dependency `react-focus-lock`

**Builder-3 (Color Semantics):**
- Modified: `components/ui/glass/GlowButton.tsx` (semantic variants)
- Modified: `components/ui/glass/GlowBadge.tsx` (mirror.* colors)
- Modified: `styles/globals.css` (semantic utility classes)
- Modified: 10+ component files (color replacements)

### Merge Strategy

**Zero Conflicts Expected:**
- Builder-1 and Builder-3 both modify GlowButton.tsx, but different sections
  - Builder-1: Transition duration, active states (lines 55-75)
  - Builder-3: Color values, new variants (lines 27-54)
  - **Resolution:** Builder-3 merges first, Builder-1 adjusts transitions on new variants

**Coordination Points:**
- All builders must respect `prefers-reduced-motion`
- All builders use consistent naming (mirror.* colors, semantic-* classes)
- All builders test on mobile (320px minimum)

### Integration Checklist

- [ ] Builder-1 output merged (micro-interactions)
- [ ] Builder-2 output merged (accessibility)
- [ ] Builder-3 output merged (color semantics)
- [ ] All TypeScript types updated (GlowButtonProps with new variants)
- [ ] No build errors (`npm run build`)
- [ ] All tests pass (if any exist)
- [ ] Visual QA on all pages (no regressions)
- [ ] Lighthouse audit passes (95+ accessibility)

---

## Deployment Plan

### Pre-Deployment Validation

1. **Lighthouse Audit:**
   - Run on: /auth/signin, /dashboard, /reflection
   - Target: Accessibility 95+, Performance 90+
   - **Pass Criteria:** All targets met

2. **Manual Keyboard Testing:**
   - Tab through entire app without mouse
   - Test skip link (Tab on page load)
   - Test modal focus trap (Tab doesn't escape)
   - Test dropdown keyboard navigation (Enter/Escape)
   - **Pass Criteria:** All keyboard flows functional

3. **Reduced Motion Testing:**
   - Enable "Reduce Motion" in browser
   - Navigate through app
   - **Pass Criteria:** No animations visible

4. **Visual QA:**
   - Test on Chrome, Safari, Firefox
   - Test on mobile (iOS Safari, Android Chrome)
   - **Pass Criteria:** No visual regressions

### Deployment Steps

1. Run `npm run build` (verify production build)
2. Commit to feature branch: `git commit -m "2L Iteration 5 (plan-5): Final polish - micro-interactions, page transitions, accessibility, color semantics"`
3. Push to origin
4. Create PR to main branch
5. Review: Check bundle size diff, Lighthouse scores
6. Merge to main
7. Deploy to production (Vercel auto-deploy)
8. Post-deployment smoke test (signup flow, reflection creation)

### Rollback Plan

- If Lighthouse score drops below 90 accessibility: **ROLLBACK**
- If critical visual regression found: **ROLLBACK**
- If build fails or runtime errors: **ROLLBACK**

**Rollback command:** `git revert HEAD`

---

## Before → After Improvements

### Micro-Interactions

**BEFORE:**
- Button transitions: 300ms (slightly sluggish)
- No visible active states (no tactile feedback on click)
- Card hovers: basic lift only
- Form inputs: no error/success animations
- Inconsistent transition timing

**AFTER:**
- Button transitions: 200ms (snappy, modern)
- Visible active states: scale 0.98 + opacity (tactile feedback)
- Card hovers: lift + subtle glow (premium feel)
- Form inputs: error shake + success checkmark (clear feedback)
- Consistent 200ms timing across all interactions

### Page Transitions

**BEFORE:**
- Page transitions: ✅ Already implemented (fade + slide)
- Modal transitions: 250ms (slightly fast)

**AFTER:**
- Page transitions: ✅ Verified performance (60fps)
- Modal transitions: ✅ Timing verified (250ms is good)
- All transitions respect reduced motion

### Color Semantics

**BEFORE:**
- Success: `bg-green-500/10` (Tailwind default)
- Error: `bg-red-500/10` (Tailwind default)
- Info: `bg-blue-500/20` (Tailwind default)
- Primary: Mix of `purple-600` and `mirror.amethyst`
- **Problem:** Inconsistent, harder to rebrand

**AFTER:**
- Success: `bg-mirror-success/10` (semantic)
- Error: `bg-mirror-error/10` (semantic)
- Info: `bg-mirror-info/10` (semantic)
- Primary: `mirror.amethyst` (consistent)
- **Benefit:** Rebrand in one place (tailwind.config.ts)

### Accessibility

**BEFORE:**
- Skip link: ❌ Missing (keyboard users tab 12+ times)
- ARIA labels: 60% coverage (40+ missing)
- Modal focus trap: ❌ Missing (focus escapes)
- Keyboard nav: Partial (no dropdown support)
- **Lighthouse Score: ~70-80**

**AFTER:**
- Skip link: ✅ Present (keyboard users skip to content)
- ARIA labels: 100% coverage (all buttons labeled)
- Modal focus trap: ✅ Implemented (focus contained)
- Keyboard nav: Full (dropdowns, modals, all interactive elements)
- **Lighthouse Score: 95+**

---

## Open Questions

1. **Button transition duration:** Stick with 200ms (master plan) or adjust to 250ms if user feedback suggests it's too fast?
   - **Recommendation:** Start with 200ms, gather feedback, adjust if needed

2. **Error shake animation trigger:** On every render with error, or only on error state change?
   - **Recommendation:** Only on state change (false → true)

3. **Success checkmark persistence:** Persist until user changes input, or fade after 2 seconds?
   - **Recommendation:** Persist until input changes (helps users verify)

4. **Modal slide duration:** Keep 250ms or increase to 400ms per master plan?
   - **Recommendation:** Test both, keep 250ms if it feels good (faster = better UX)

5. **react-focus-lock vs manual implementation:** Use library or build custom?
   - **Recommendation:** Use library (5KB is acceptable for critical feature)

---

## Notes for Builders

### Critical Coordination Points

1. **GlowButton.tsx Merge Conflict:**
   - Builder-1 changes transition duration + active states
   - Builder-3 changes colors + adds semantic variants
   - **Resolution:** Builder-3 merges first, Builder-1 applies transitions to new variants

2. **Reduced Motion Testing:**
   - EVERY builder must test with `prefers-reduced-motion: reduce`
   - Use browser DevTools: Chrome → Rendering → Emulate CSS media
   - **Requirement:** All animations disabled or instant (0.01ms)

3. **Mobile Testing:**
   - Test on real devices if possible (iOS Safari critical)
   - Minimum: Chrome DevTools responsive mode (320px, 768px, 1024px)
   - **Requirement:** All interactions functional on touch

### Performance Budgets

- **Bundle Size:** +10KB max (react-focus-lock is 5KB)
- **Lighthouse Performance:** Maintain 90+ (no regression)
- **Animation FPS:** 60fps target (no jank)
- **Largest Contentful Paint:** <2.5s (maintain current)

### Accessibility Checklist (All Builders)

- [ ] All new interactive elements have aria-label
- [ ] All new animations respect prefers-reduced-motion
- [ ] All new colors meet 4.5:1 contrast ratio
- [ ] All new forms have proper labels
- [ ] Keyboard navigation tested

---

**Iteration Status:** PLANNED
**Ready for:** Builder Execution
**Estimated Completion:** 2-3 days with 3 parallel builders
**Next Step:** Execute builder-tasks.md assignments

---

**This is the FINAL iteration of plan-5. After completion, Mirror of Dreams will be production-ready with exceptional polish, full accessibility compliance, and delightful micro-interactions.**
