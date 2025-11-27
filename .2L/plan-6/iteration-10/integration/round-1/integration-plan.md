# Integration Plan - Round 1

**Created:** 2025-11-28T00:00:00Z
**Iteration:** plan-6/iteration-10
**Total builders to integrate:** 3

---

## Executive Summary

Three builders have completed their work in parallel with zero file conflicts and excellent alignment. This integration round merges dashboard richness enhancements, reflection experience depth improvements, and secure markdown rendering for reflection display. All builders achieved 100% of their success criteria.

Key insights:
- **Zero conflicts:** Each builder worked in completely isolated directories (dashboard/, reflection/, reflections/)
- **Security win:** Builder-3 fixed critical XSS vulnerability by replacing dangerouslySetInnerHTML with react-markdown
- **Parallel success:** All 3 builders completed simultaneously with no blocking dependencies
- **Pattern consistency:** All builders followed established patterns from patterns.md exactly
- **Low risk integration:** All code is production-ready, TypeScript compiles cleanly, patterns proven

---

## Builders to Integrate

### Primary Builders
- **Builder-1:** Dashboard Richness Transformation - Status: COMPLETE (14/14 criteria)
- **Builder-2:** Reflection Page Depth & Immersion - Status: COMPLETE (15/15 criteria)
- **Builder-3:** Individual Reflection Display + Collection View - Status: COMPLETE (11/11 criteria)

### Sub-Builders
None - All builders completed without splitting

**Total outputs to integrate:** 3 builder reports

---

## Integration Zones

### Zone 1: Independent Dashboard Enhancement

**Builders involved:** Builder-1

**Conflict type:** None (independent feature)

**Risk level:** LOW

**Description:**
Builder-1 created a completely isolated dashboard transformation in the `/app/dashboard/` and `/components/dashboard/` directories. No overlapping files with other builders. Two new components (DashboardHero, ProgressStatsCard) and modifications to existing dashboard cards.

**Files affected:**
- `components/dashboard/DashboardHero.tsx` - NEW (hero section with time-based greeting)
- `components/dashboard/cards/ProgressStatsCard.tsx` - NEW (monthly reflection stats)
- `app/dashboard/page.tsx` - MODIFIED (orchestration with stagger animation)
- `components/dashboard/cards/DreamsCard.tsx` - MODIFIED (added "Reflect on this dream" buttons)
- `components/dashboard/shared/ReflectionItem.tsx` - MODIFIED (120-char snippets from AI response)

**Integration strategy:**
1. Direct merge - no conflicts possible
2. Verify imports resolve correctly (`@/hooks/useAuth`, `@/lib/trpc`, `@/components/ui/glass/*`)
3. Test stagger animation with 7 sections (hero + 6 cards)
4. Verify "Reflect Now" CTA disabled state when no dreams exist

**Expected outcome:**
Dashboard displays rich, motivating hub with personalized greeting, active dreams grid, recent reflections preview, and progress stats. Visual hierarchy clear (primary → secondary → tertiary). Stagger animation smooth (150ms delay, 800ms duration).

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 2: Independent Reflection Experience Enhancement

**Builders involved:** Builder-2

**Conflict type:** None (independent feature)

**Risk level:** LOW

**Description:**
Builder-2 enhanced the reflection experience in the `/app/reflection/` and `/components/reflection/` directories. No overlapping files with other builders. Three new components (ReflectionQuestionCard, ToneSelectionCard, ProgressBar) and modifications to MirrorExperience.tsx.

**Files affected:**
- `components/reflection/ReflectionQuestionCard.tsx` - NEW (guided question presentation)
- `components/reflection/ToneSelectionCard.tsx` - NEW (visual tone selection cards)
- `components/reflection/ProgressBar.tsx` - NEW (step progress indicator)
- `app/reflection/MirrorExperience.tsx` - MODIFIED (atmosphere, transitions, enhanced UI)

**Integration strategy:**
1. Direct merge - no conflicts possible
2. Verify Framer Motion animations respect `prefers-reduced-motion`
3. Test form → loading → output state transitions (300-500ms crossfades)
4. Verify tone selection cards work on mobile (stack vertically)
5. Test status text updates after 3 seconds ("Gazing..." → "Crafting...")

**Expected outcome:**
Reflection page feels sacred and immersive. Darker atmosphere with vignette, centered 800px content, visual tone cards with descriptions, smooth state transitions with breathing animations, and mobile-friendly scrollable form.

**Assigned to:** Integrator-1

**Estimated complexity:** LOW

---

### Zone 3: Independent Reflection Display + Security Fix

**Builders involved:** Builder-3

**Conflict type:** None (independent feature)

**Risk level:** MEDIUM (security fix requires validation)

**Description:**
Builder-3 implemented secure markdown rendering and enhanced collection view in `/app/reflections/` and `/components/reflections/` directories. CRITICAL: Replaced dangerouslySetInnerHTML with safe react-markdown rendering to fix XSS vulnerability.

**Files affected:**
- `components/reflections/AIResponseRenderer.tsx` - NEW (safe markdown renderer)
- `app/reflections/[id]/page.tsx` - MODIFIED (replaced dangerouslySetInnerHTML line 229)
- `app/reflections/page.tsx` - MODIFIED (collection view with 20/page pagination)
- `components/reflections/ReflectionCard.tsx` - MODIFIED (enhanced hover states, snippets)
- `components/reflections/ReflectionFilters.tsx` - MODIFIED (improved filter UI)

**Integration strategy:**
1. Direct merge - no conflicts possible
2. **CRITICAL:** Verify dangerouslySetInnerHTML fully removed from reflections/[id]/page.tsx
3. Test XSS protection with malicious markdown: `<script>alert('XSS')</script>`
4. Verify markdown rendering with headings, lists, blockquotes, bold, code blocks
5. Test plain text fallback (AI responses without markdown)
6. Verify reflection cards show 120-char snippets with markdown stripped
7. Test pagination with 20+ reflections

**Expected outcome:**
Individual reflections display with beautiful, XSS-safe markdown formatting. Centered 720px reading column, gradient headings, styled blockquotes, cosmic glow container. Collection view shows enhanced cards with tone badges, snippets, hover states (lift + glow), and working pagination.

**Assigned to:** Integrator-1

**Estimated complexity:** MEDIUM (security validation critical)

---

## Independent Features (Direct Merge)

All three builder outputs are independent and can be merged directly without conflict resolution:

- **Builder-1:** Dashboard transformation - Files: `components/dashboard/*`, `app/dashboard/page.tsx`
- **Builder-2:** Reflection experience - Files: `components/reflection/*`, `app/reflection/MirrorExperience.tsx`
- **Builder-3:** Reflection display + collection - Files: `components/reflections/*`, `app/reflections/**`

**Assigned to:** Integrator-1 (merge all zones sequentially)

---

## Parallel Execution Groups

### Group 1 (Parallel - All zones independent)
- **Integrator-1:** Zone 1 (Dashboard) + Zone 2 (Reflection Page) + Zone 3 (Reflection Display)

**Note:** Since all zones are independent (no file conflicts), a single integrator can handle all three zones sequentially in one session.

---

## Integration Order

**Recommended sequence:**

1. **Zone 1: Dashboard Enhancement (Builder-1)**
   - Merge dashboard files first
   - Test dashboard loads with stagger animation
   - Verify "Reflect Now" CTA links correctly
   - Verify dream cards have "Reflect on this dream" buttons
   - Check progress stats calculate monthly reflections correctly

2. **Zone 2: Reflection Experience (Builder-2)**
   - Merge reflection page files second
   - Test reflection form → loading → output flow
   - Verify tone selection cards work (click, keyboard, mobile)
   - Verify progress indicator shows "Step 1 of 4"
   - Check reduced motion support (animations disabled)

3. **Zone 3: Reflection Display + Security Fix (Builder-3)**
   - Merge reflection display/collection files third
   - **CRITICAL:** Verify XSS fix (no dangerouslySetInnerHTML remaining)
   - Test markdown rendering with various formats
   - Test malicious markdown input (script tags, image onerror)
   - Verify collection view pagination (20/page)
   - Check reflection card hover states

4. **Final consistency check**
   - Test full user flow: Dashboard → Reflection → Individual Display → Collection
   - Verify all navigation links work correctly
   - Check TypeScript compilation (should have zero errors)
   - Run Lighthouse audit (LCP <2.5s target)

---

## Shared Resources Strategy

### Shared Types
**Issue:** None - all builders use existing types from codebase

**Resolution:**
- Builder-1 uses existing `Dream`, `Reflection` types
- Builder-2 uses existing `ToneId`, `FormData` types
- Builder-3 uses existing `Reflection`, `ReflectionTone` types
- No new shared types created, no conflicts

**Responsible:** N/A (no action needed)

### Shared Utilities
**Issue:** None - all builders use existing utilities

**Resolution:**
- Builder-1 uses `getTimeOfDay()` inline (dashboard hero)
- Builder-2 uses `useReducedMotion()` from Framer Motion
- Builder-3 uses markdown stripping regex inline
- No utility conflicts

**Responsible:** N/A (no action needed)

### Shared Components (Read-Only)
**Issue:** All builders import same design system components

**Resolution:**
- All builders use `GlowButton`, `GradientText`, `CosmicLoader` from `@/components/ui/glass/*`
- No modifications to shared components (read-only usage)
- No conflicts possible

**Components used:**
- `GlowButton` - Builder-1, Builder-2, Builder-3
- `GradientText` - Builder-1, Builder-3
- `CosmicLoader` - Builder-2
- `GlassCard` - Builder-1
- `GlassInput` - Builder-2
- `EmptyState` - Builder-1, Builder-3

**Responsible:** N/A (verify imports resolve correctly during integration)

### Configuration Files
**Issue:** None - no config file modifications

**Resolution:**
- No builders modified `package.json`, `tsconfig.json`, `tailwind.config.ts`, etc.
- No dependency additions (react-markdown already installed)
- No conflicts

**Responsible:** N/A (no action needed)

---

## Expected Challenges

### Challenge 1: XSS Vulnerability Validation (Zone 3)
**Impact:** If dangerouslySetInnerHTML not fully removed or react-markdown misconfigured, XSS attacks possible

**Mitigation:**
1. Grep entire codebase for `dangerouslySetInnerHTML` usage
2. Test with malicious inputs: `<script>alert('XSS')</script>`, `<img src=x onerror=alert('XSS')>`
3. Verify react-markdown sanitizes by default (it does)
4. Check remark-gfm plugin doesn't introduce vulnerabilities
5. Manual testing in production-like environment

**Responsible:** Integrator-1 (Zone 3 validation)

### Challenge 2: Import Path Resolution
**Impact:** If any imports fail to resolve, TypeScript compilation breaks

**Mitigation:**
1. Verify all `@/components/ui/glass/*` imports resolve
2. Check `@/hooks/useAuth` exists and exports correctly
3. Ensure `@/lib/trpc` client configured properly
4. Run TypeScript compilation: `npm run build` or `tsc --noEmit`
5. Fix any module resolution errors before testing

**Responsible:** Integrator-1 (pre-integration check)

### Challenge 3: tRPC Query Schema Mismatches
**Impact:** If tRPC backend doesn't return expected fields, components break

**Mitigation:**
1. Verify `dreams.list` returns `reflectionCount`, `daysLeft`, `category`
2. Verify `reflections.list` returns `aiResponse` or `ai_response`, `createdAt`, `tone`
3. Check monthly reflection count calculation (client-side filter works with existing data)
4. Test with real database data (not mock)
5. Add fallbacks for missing fields (already implemented in code)

**Responsible:** Integrator-1 (data validation testing)

### Challenge 4: Animation Performance on Low-End Devices
**Impact:** Stagger animations + Framer Motion transitions could drop below 60fps on mobile

**Mitigation:**
1. Test on real mobile device (not just DevTools)
2. Check Chrome DevTools Performance tab for frame drops
3. Verify `prefers-reduced-motion` respected (animations disabled)
4. Monitor bundle size increase (<20KB target maintained)
5. Consider lazy loading if performance degrades (not expected)

**Responsible:** Integrator-1 (performance validation)

---

## Success Criteria for This Integration Round

- [ ] All zones successfully merged with zero conflicts
- [ ] No duplicate code remaining
- [ ] All imports resolve correctly (TypeScript compiles cleanly)
- [ ] XSS vulnerability fixed and validated (no dangerouslySetInnerHTML)
- [ ] Dashboard loads with stagger animation (150ms delay, 800ms duration)
- [ ] Reflection page transitions smooth (form → loading → output)
- [ ] Individual reflections render markdown safely
- [ ] Collection view pagination works (20/page)
- [ ] All navigation flows work: Dashboard → Reflection → Display → Collection
- [ ] Lighthouse LCP <2.5s maintained
- [ ] Accessibility validated (keyboard nav, reduced motion, screen reader)
- [ ] All builder functionality preserved

---

## Notes for Integrators

**Important context:**
- This is the smoothest integration possible - zero file conflicts by design
- Each builder worked in completely isolated directories (dashboard/, reflection/, reflections/)
- All builders followed patterns.md exactly (proven, working code)
- TypeScript compilation already verified by each builder (no type errors)

**Watch out for:**
- **SECURITY CRITICAL:** Verify dangerouslySetInnerHTML removed from reflections/[id]/page.tsx line 229
- Import path resolution (all `@/` paths must resolve correctly)
- tRPC query field names (camelCase vs snake_case mismatches)
- Animation performance on real mobile devices (test beyond DevTools)

**Patterns to maintain:**
- Reference `patterns.md` for all conventions (already followed by builders)
- Ensure error handling consistent (loading, error, empty states)
- Keep naming conventions aligned (PascalCase components, camelCase functions)
- Maintain spacing scale (--space-xs through --space-3xl)
- Respect accessibility (keyboard nav, reduced motion, ARIA labels)

---

## Next Steps

1. **Integrator-1 merges Zone 1** (Dashboard)
   - Merge Builder-1 files
   - Run `npm run build` to verify TypeScript compilation
   - Test dashboard page loads correctly
   - Verify stagger animation works
   - Check "Reflect Now" CTA disabled when no dreams

2. **Integrator-1 merges Zone 2** (Reflection Page)
   - Merge Builder-2 files
   - Run `npm run build` to verify compilation
   - Test reflection form → loading → output transitions
   - Verify tone selection cards work
   - Check reduced motion support

3. **Integrator-1 merges Zone 3** (Reflection Display + Security Fix)
   - Merge Builder-3 files
   - **CRITICAL:** Grep for dangerouslySetInnerHTML (should find ZERO matches in app/reflections/)
   - Run `npm run build` to verify compilation
   - Test XSS protection with malicious markdown
   - Verify markdown rendering with various formats
   - Test collection view pagination

4. **Final validation**
   - Test full user flow end-to-end
   - Run Lighthouse audit on all pages
   - Check accessibility (keyboard, screen reader, reduced motion)
   - Verify responsive layouts (375px, 768px, 1024px)
   - Monitor bundle size (should be <20KB increase)

5. **Deploy to staging**
   - Create deployment branch: `iteration-10-core-experience`
   - Run final smoke tests
   - Performance profiling (LCP, FID)
   - User acceptance testing
   - Production deployment via CI/CD

---

## Testing Strategy

### Unit Testing (Component-Level)
**Not required** - All builders verified components work in isolation

### Integration Testing (Zone-Level)
**Required:**

**Zone 1 (Dashboard):**
- [ ] Dashboard page loads without errors
- [ ] Hero section shows time-based greeting ("Good morning/afternoon/evening")
- [ ] "Reflect Now" CTA disabled when no dreams exist
- [ ] Dream cards show "Reflect on this dream" buttons
- [ ] Recent reflections show 120-char snippets
- [ ] Progress stats show accurate monthly count
- [ ] Stagger animation smooth (7 sections)

**Zone 2 (Reflection Page):**
- [ ] Reflection form displays with darker atmosphere
- [ ] Progress indicator shows "Step 1 of 4"
- [ ] Tone selection cards work (click, keyboard, mobile)
- [ ] Submit button reads "✨ Gaze into the Mirror ✨"
- [ ] Form → Loading transition smooth (300ms)
- [ ] Status text updates after 3s ("Gazing..." → "Crafting...")
- [ ] Loading → Output transition smooth (500ms)
- [ ] Reduced motion disables animations

**Zone 3 (Reflection Display):**
- [ ] Individual reflection displays with centered layout (720px)
- [ ] Markdown rendering works (headings, lists, blockquotes)
- [ ] XSS test: `<script>alert('XSS')</script>` sanitized
- [ ] Plain text fallback works
- [ ] Dream badge shows at top
- [ ] Collapsible user answers work
- [ ] Collection view shows 20 reflections/page
- [ ] Reflection cards have hover states (lift + glow)
- [ ] Filters work (tone, search, sort)
- [ ] Pagination works (Previous/Next, page numbers)

### End-to-End Testing (Full Flow)
**Required:**

**User Flow 1: Dashboard → Reflection → View**
1. User lands on dashboard
2. Sees personalized greeting
3. Clicks "Reflect Now" button
4. Reflection form loads
5. Fills 4 questions, selects tone
6. Clicks "Gaze into the Mirror"
7. Loading screen appears with status updates
8. Reflection output displays
9. User views AI response with markdown formatting

**User Flow 2: Dashboard → Dream → Reflection**
1. User lands on dashboard
2. Sees active dreams grid
3. Clicks "Reflect on this dream" on specific dream
4. Reflection form pre-selects that dream
5. User completes reflection
6. Returns to dashboard

**User Flow 3: Dashboard → Collection → Individual**
1. User lands on dashboard
2. Clicks recent reflection card
3. Individual reflection page loads
4. User reads markdown-formatted AI response
5. Clicks "Back to Reflections"
6. Collection view loads with all reflections

### Performance Testing
**Required:**

- [ ] Lighthouse audit on `/dashboard` (LCP <2.5s, FID <100ms)
- [ ] Lighthouse audit on `/reflection` (maintain scores)
- [ ] Lighthouse audit on `/reflections` (maintain scores)
- [ ] Lighthouse audit on `/reflections/[id]` (maintain scores)
- [ ] Bundle size increase <20KB (check `npm run build` output)
- [ ] Chrome DevTools Performance tab (60fps animations)

### Security Testing
**CRITICAL:**

- [ ] Grep codebase for `dangerouslySetInnerHTML` (should be ZERO in app/reflections/)
- [ ] Test XSS: `<script>alert('XSS')</script>` in AI response
- [ ] Test XSS: `<img src=x onerror=alert('XSS')>` in AI response
- [ ] Test XSS: `[XSS](javascript:alert('XSS'))` markdown link
- [ ] Verify react-markdown sanitizes all malicious input
- [ ] Check remark-gfm plugin security (table injection, etc.)

### Accessibility Testing
**Required:**

- [ ] Keyboard navigation (Tab through all interactive elements)
- [ ] Focus indicators visible (2px ring, mirror-purple color)
- [ ] Screen reader announces cards, buttons correctly
- [ ] ARIA labels on disabled buttons ("Reflect Now" when no dreams)
- [ ] Color contrast WCAG AA (automated Lighthouse check)
- [ ] `prefers-reduced-motion` respected (animations disabled)
- [ ] Text zoom to 200% (no layout breaks)

### Responsive Testing
**Required:**

- [ ] Mobile (375px): Dashboard stacks, reflection form scrollable, cards stack
- [ ] Tablet (768px): Dashboard 2-column grid, tone cards stack
- [ ] Desktop (1024px): Dashboard 3-column grid, tone cards 3-column
- [ ] Large (1440px+): Content max-width enforced (800px form, 720px reading)

---

## Risk Assessment

**Overall Integration Risk:** LOW

**Rationale:**
- Zero file conflicts (isolated directories)
- All builders followed proven patterns
- TypeScript compiles cleanly
- No new dependencies added
- All code production-ready

**Risk Breakdown:**

| Risk Category | Level | Mitigation |
|--------------|-------|-----------|
| File Conflicts | NONE | Isolated directories |
| Type Errors | LOW | Builders verified compilation |
| Security (XSS) | MEDIUM | Critical validation required |
| Performance | LOW | Bundle size increase minimal |
| Accessibility | LOW | Patterns respect a11y |
| Data Issues | LOW | Fallbacks implemented |
| Browser Compat | LOW | Modern browser targets |

**Highest Risk:** XSS vulnerability validation (Zone 3)
- **Impact:** High (critical security issue if not fixed)
- **Probability:** Low (Builder-3 already fixed, just need to verify)
- **Mitigation:** Comprehensive XSS testing with malicious inputs

---

## Deployment Readiness

### Pre-Deployment Checklist

**Code Quality:**
- [ ] TypeScript compilation passes (zero errors)
- [ ] ESLint passes (zero errors, warnings acceptable)
- [ ] Prettier formatting applied
- [ ] No console.log statements in production code
- [ ] No commented-out code blocks

**Functionality:**
- [ ] All 40 success criteria met (14 Builder-1 + 15 Builder-2 + 11 Builder-3)
- [ ] Dashboard, reflection, reflections pages work end-to-end
- [ ] All navigation flows functional
- [ ] Empty states tested (0 dreams, 0 reflections)
- [ ] Pagination tested (20+ reflections)

**Performance:**
- [ ] LCP <2.5s on all pages
- [ ] FID <100ms on all pages
- [ ] Bundle size increase <20KB
- [ ] 60fps animations verified
- [ ] Reduced motion respected

**Security:**
- [ ] XSS vulnerability fixed and validated
- [ ] No dangerouslySetInnerHTML in reflections code
- [ ] Malicious markdown sanitized
- [ ] React-markdown security verified

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA
- [ ] Reduced motion respected

**Cross-Browser:**
- [ ] Chrome 120+ (primary)
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

**Responsive:**
- [ ] Mobile (375px) tested
- [ ] Tablet (768px) tested
- [ ] Desktop (1024px+) tested

### Deployment Steps

1. **Create deployment branch**
   ```bash
   git checkout -b iteration-10-core-experience
   ```

2. **Merge all builder work**
   - Merge Builder-1 (dashboard)
   - Merge Builder-2 (reflection)
   - Merge Builder-3 (reflections)

3. **Run full test suite**
   ```bash
   npm run build
   npm run test (if tests exist)
   npm run lint
   ```

4. **Smoke tests on staging**
   - Deploy to staging environment
   - Test all 3 user flows
   - Performance profiling
   - Security validation

5. **User acceptance testing**
   - Creator (Ahiya) tests end-to-end
   - Verify subjective UX quality ("feels sacred", "feels complete")

6. **Production deployment**
   - Merge to main branch
   - CI/CD pipeline deploys
   - Monitor performance for first 24 hours

7. **Post-deployment monitoring**
   - Lighthouse CI alerts (LCP degradation)
   - Error tracking (Sentry, LogRocket, etc.)
   - User feedback collection

### Rollback Plan

If critical issues discovered:
1. Revert to previous commit (tagged as `iteration-9-complete`)
2. Identify root cause in isolated environment
3. Fix issues in hotfix branch
4. Re-deploy after validation

---

## Integration Timeline

**Total estimated time:** 30-45 minutes

**Breakdown:**

1. **Zone 1 merge (Dashboard):** 10 minutes
   - Merge files: 2 minutes
   - Verify compilation: 1 minute
   - Test dashboard: 5 minutes
   - Fix any issues: 2 minutes

2. **Zone 2 merge (Reflection):** 10 minutes
   - Merge files: 2 minutes
   - Verify compilation: 1 minute
   - Test reflection flow: 5 minutes
   - Fix any issues: 2 minutes

3. **Zone 3 merge (Reflections Display):** 15 minutes
   - Merge files: 2 minutes
   - Verify compilation: 1 minute
   - **XSS validation:** 5 minutes (critical)
   - Test markdown rendering: 5 minutes
   - Fix any issues: 2 minutes

4. **Final validation:** 10 minutes
   - End-to-end user flows: 5 minutes
   - Performance checks: 3 minutes
   - Documentation: 2 minutes

**Buffer:** +15 minutes for unexpected issues

---

## Success Metrics

### Quantitative
- **Build success:** TypeScript compilation passes (0 errors)
- **Performance:** LCP <2.5s, FID <100ms (Lighthouse)
- **Bundle size:** Increase <20KB (currently 196KB dashboard page)
- **Coverage:** 40/40 success criteria met (100%)

### Qualitative
- **User feedback:** "Dashboard feels complete", "Reflection feels sacred", "Reflections beautiful"
- **Code quality:** All patterns followed, no technical debt introduced
- **Security:** XSS vulnerability eliminated, markdown rendering safe

---

## Appendix: Builder Work Summary

### Builder-1: Dashboard Richness
**Status:** COMPLETE (14/14 criteria)
**Files:** 2 new, 3 modified
**Complexity:** MEDIUM-HIGH (handled without split)
**Key deliverables:**
- DashboardHero with time-based greeting
- ProgressStatsCard with monthly reflection count
- Enhanced DreamsCard with "Reflect" buttons
- Stagger animation orchestration (7 sections)

### Builder-2: Reflection Depth
**Status:** COMPLETE (15/15 criteria)
**Files:** 3 new, 1 modified
**Complexity:** MEDIUM (handled without split)
**Key deliverables:**
- ReflectionQuestionCard for guided questions
- ToneSelectionCard with visual icons
- ProgressBar showing "Step 1 of 4"
- Smooth state transitions (form → loading → output)
- Darker atmosphere with vignette

### Builder-3: Reflection Display + Security
**Status:** COMPLETE (11/11 criteria)
**Files:** 1 new, 4 modified
**Complexity:** MEDIUM (handled without split)
**Key deliverables:**
- AIResponseRenderer (XSS-safe markdown)
- Removed dangerouslySetInnerHTML (line 229 fix)
- Enhanced ReflectionCard with snippets, hover states
- Improved ReflectionFilters UI
- 20/page pagination

---

**Integration Planner:** 2l-iplanner
**Plan created:** 2025-11-28T00:00:00Z
**Round:** 1
**Recommended integrators:** 1 (single integrator handles all zones sequentially)
**Estimated time:** 30-45 minutes
**Risk level:** LOW
**Confidence:** HIGH (zero conflicts, proven patterns, production-ready code)
