# 2L Iteration Plan - Mirror of Dreams (Iteration 20)

## Project Vision
Enable Sarah's Day 6 breakthrough moment: Complete 4 reflections on a dream, generate Evolution Report, generate Visualization, and experience the magic of seeing her growth patterns reflected back and her achieved dream visualized. This is the pivotal moment where Mirror of Dreams transforms from "interesting tool" to "consciousness companion I can't live without."

## Success Criteria
Specific, measurable criteria for Iteration 20 completion:

- [ ] User with 4+ reflections on a dream sees "Generate Evolution Report" button on dream detail page
- [ ] Evolution report displays with formatted markdown (headers, bold, italics) using cosmic glass aesthetic
- [ ] Visualization "Generate" button appears on dream detail page when eligible (>= 4 reflections)
- [ ] Visualization detail page displays achievement narrative with immersive formatting (large text, gradient highlights)
- [ ] Dashboard EvolutionCard shows latest report preview (not "Coming Soon" placeholder)
- [ ] Dashboard EvolutionCard shows dynamic eligibility status with progress toward threshold
- [ ] Recent Reflections card shows last 3 reflections across all dreams
- [ ] Usage tracking displays current month usage for reflections (evolution/visualizations optional for iteration 20)
- [ ] Dream cards show quick action buttons (Reflect, Evolution, Visualize) - OPTIONAL for iteration 21
- [ ] Sarah's Day 6 journey (create dream → 4 reflections → evolution → visualization) completes without errors
- [ ] Monthly usage limits enforced correctly (Free: 1 evolution/month blocked via eligibility, 1 viz/month)
- [ ] Zero console errors during generation flows
- [ ] CosmicLoader displays during 30-45 second AI generation with feedback message

## MVP Scope

**In Scope:**
1. **Evolution Report UI Integration**
   - Dream detail page: "Generate Evolution Report" button with eligibility checking
   - Evolution detail page: Markdown rendering with cosmic styling
   - Dashboard EvolutionCard: Latest report preview and eligibility status
   - Progress indicators: "X of 4 reflections needed"

2. **Visualization UI Integration**
   - Dream detail page: "Generate Visualization" button with eligibility checking
   - Visualization detail page: Immersive achievement narrative formatting
   - Large text (18-20px), gradient highlights on "I am..." statements, 1.8 line-height
   - Dashboard VisualizationCard: Latest visualization preview (NEW COMPONENT)

3. **Dashboard Integration**
   - Recent Reflections section: Display last 3 reflections across dreams
   - EvolutionCard rebuild: Real data instead of placeholder
   - UsageCard expansion: Show all 3 metrics (reflections, evolution, visualizations) - STRETCH GOAL
   - Dream cards quick actions: Reflect/Evolution/Visualize buttons - DEFER to iteration 21

4. **End-to-End Testing**
   - Test Sarah's Day 6 journey manually
   - Verify eligibility checks work correctly
   - Verify temporal distribution (AI receives early/middle/recent reflections)
   - Verify usage counters increment
   - Verify monthly limits enforced

**Out of Scope (Deferred to Iteration 21):**
- Landing page (iteration 3)
- Onboarding flow (iteration 3)
- PDF export of reports
- Report editing
- Social sharing features
- Cross-dream reports UI (backend exists, UI low priority)
- Multiple visualization styles UI (spiral/synthesis - keep achievement only for now)
- Advanced usage analytics dashboard
- Admin panel
- Dream cards quick actions (NICE-TO-HAVE, defer if time-constrained)

## Development Phases

1. **Exploration** ✅ Complete (2 explorer reports)
2. **Planning** 🔄 Current (creating comprehensive plan)
3. **Building** ⏳ Estimated 12-16 hours (1-2 builders)
4. **Integration** ⏳ Estimated 1 hour (merge builder work)
5. **Validation** ⏳ Estimated 2 hours (test Sarah's journey end-to-end)
6. **Documentation** ⏳ Final (update status documents)

## Timeline Estimate

- Exploration: Complete (2 explorer reports analyzed)
- Planning: Complete (this document + 3 supporting files)
- Building: 12-16 hours total
  - Builder-1 (if single builder): 12-16 hours
  - Builder-1A (if split): Dream detail integration + Evolution UI (8-10 hours)
  - Builder-1B (if split): Dashboard cards + Visualization formatting (6-8 hours)
- Integration: 1 hour (coordinate if split occurred)
- Validation: 2 hours (manual testing of Sarah's journey)
- **Total Estimated Duration:** 15-19 hours

## Risk Assessment

### Critical Risks

**1. Usage Tracking Schema Mismatch (SEVERITY: CRITICAL)**
- **Risk:** Database `usage_tracking` table has `month_year` (TEXT) but functions expect `month` (DATE)
- **Impact:** Evolution/visualization generation will fail when incrementing usage counters
- **Likelihood:** 100% (confirmed by exploration)
- **Mitigation Strategy:**
  - Builder must run existing fix script or verify schema is already fixed from iteration 19
  - Check if migration `20251112000000_fix_usage_tracking.sql` was applied
  - Test functions: `check_evolution_limit`, `check_visualization_limit`, `increment_usage_counter`
  - MUST be verified before starting UI work (pre-flight check)
- **Timeline Impact:** If not fixed, blocks entire iteration

**2. 30-45 Second AI Generation Timeout**
- **Risk:** Users may think app is frozen during long AI generation
- **Impact:** Poor UX, user abandonment, confusion
- **Likelihood:** Medium (especially on mobile/slow connections)
- **Mitigation Strategy:**
  - Use CosmicLoader with animated message: "Analyzing your journey across time... (this takes ~30 seconds)"
  - Show fake progress bar that moves smoothly (backend doesn't support real progress)
  - Add "Don't close this tab" warning
  - Test on slow 3G connection simulation
  - Consider modal overlay to prevent navigation during generation
- **Timeline Impact:** 1-2 hours for robust loading state UX

### High Risks

**3. Markdown Rendering Conflicts with Glass UI**
- **Risk:** Evolution reports may look broken if markdown styles clash with cosmic theme
- **Impact:** Reports feel generic, not "revelatory"
- **Likelihood:** Medium
- **Mitigation Strategy:**
  - Use `react-markdown` with custom component renderers
  - Apply cosmic color palette to all markdown elements (h1/h2/h3, bold, lists)
  - Create `CosmicMarkdown` wrapper component with pre-styled renderers
  - Test with actual generated reports (not sample text)
- **Timeline Impact:** 1-2 hours for custom styling

**4. Immersive Visualization Formatting is Subjective**
- **Risk:** "Immersive" and "emotional impact" are hard to quantify objectively
- **Impact:** Visualization may feel flat, not "I'm already there"
- **Likelihood:** High (design is subjective)
- **Mitigation Strategy:**
  - Define concrete criteria: 18-20px text, gradient on "I am/I'm" phrases, 1.8 line-height, GradientText component usage
  - Study `MirrorExperience.tsx` for immersive patterns (780 lines, signature piece)
  - Test with sample achievement narrative from vision.md
  - Use "soft, glossy, sharp" design principle throughout
- **Timeline Impact:** 2-3 hours for iteration on formatting

### Medium Risks

**5. Builder May Need to Split (12-16 hours is HIGH complexity)**
- **Risk:** Single builder may struggle with 12-16 hour task spanning multiple features
- **Impact:** Iteration extends beyond planned duration
- **Likelihood:** Medium (depends on builder velocity)
- **Mitigation Strategy:**
  - Plan for potential split from start
  - Identify clean split point: Builder-1A (Dream detail + Evolution), Builder-1B (Dashboard + Visualizations)
  - Share eligibility checking patterns (create reusable `useEligibility` hook)
  - Coordinate via shared status document
- **Timeline Impact:** If split occurs, add 1 hour for coordination overhead

**6. Per-Dream Eligibility Checking May Be Slow**
- **Risk:** Dream detail page checks eligibility per dream individually (not batched)
- **Impact:** Page load may feel sluggish
- **Likelihood:** Low (TanStack Query caching helps)
- **Mitigation Strategy:**
  - Use client-side calculation (count reflections already fetched for dream)
  - Avoid new backend endpoint (simpler, faster)
  - Consider adding `reflectionCount` to dream record (denormalized, future optimization)
- **Timeline Impact:** No impact (use client-side approach)

## Integration Strategy

### How Builder Outputs Will Be Merged

**If Single Builder (Recommended):**
- Builder-1 creates all features sequentially
- No merge conflicts (single author)
- Natural flow: Dream detail → Evolution detail → Visualization detail → Dashboard cards
- Estimated time: 12-16 hours continuous

**If Split Into Sub-Builders:**

**Split Point:** After 8 hours of Builder-1 work

**Builder-1A: Evolution Integration (8-10 hours)**
- Files touched:
  - `/app/dreams/[id]/page.tsx` - Add evolution button and eligibility
  - `/app/evolution/[id]/page.tsx` - Add markdown rendering
  - `/components/dashboard/cards/EvolutionCard.tsx` - Rebuild with real data
  - `/lib/hooks/useEligibility.ts` - NEW shared hook for eligibility logic
- Deliverables: Evolution generation works end-to-end from dream detail page

**Builder-1B: Visualization Integration (6-8 hours)**
- Dependencies: Needs `useEligibility` hook from Builder-1A
- Files touched:
  - `/app/dreams/[id]/page.tsx` - Add visualization button (merge with Builder-1A changes)
  - `/app/visualizations/[id]/page.tsx` - Add immersive formatting
  - `/components/dashboard/cards/VisualizationCard.tsx` - NEW component
  - `/components/dashboard/DashboardPage.tsx` - Add VisualizationCard to layout
- Deliverables: Visualization generation works end-to-end

**Merge Coordination:**
- Builder-1A completes first, commits changes
- Builder-1B pulls latest, resolves `/app/dreams/[id]/page.tsx` merge (both add buttons to same file)
- Merge strategy: Builder-1B adds visualization button NEXT TO evolution button created by Builder-1A
- Shared component: `useEligibility(dreamId, featureType)` hook used by both
- Integration testing: Integrator runs full Sarah's journey test (Day 0-6)

**Conflict Prevention:**
- EvolutionCard and VisualizationCard are separate files (no conflicts)
- Dream detail page: Builder-1B adds visualization section BELOW evolution section (spatial separation)
- Shared patterns documented in `patterns.md` (both follow same conventions)

## Deployment Plan

**Iteration 20 deploys to existing Vercel deployment:**

1. **Pre-Deployment Checklist:**
   - [ ] TypeScript compilation passes (`npm run build`)
   - [ ] No console errors in dev mode
   - [ ] Database migration verified (usage_tracking schema fixed)
   - [ ] Environment variables present (ANTHROPIC_API_KEY, SUPABASE_URL, etc.)
   - [ ] Manual testing complete (Sarah's journey Day 0-6)

2. **Deployment Steps:**
   - Push to `main` branch (automatic Vercel deployment)
   - Monitor Vercel build logs for errors
   - Run post-deployment smoke test:
     - Create dream
     - Create 4 reflections
     - Generate evolution report (verify 45s generation completes)
     - Generate visualization (verify 30s generation completes)
     - Check dashboard displays latest report/visualization

3. **Rollback Plan:**
   - If critical bug discovered, revert commit via `git revert`
   - Vercel automatically deploys previous working version
   - No database migrations in this iteration that would block rollback

4. **Success Metrics (Post-Deployment):**
   - Zero 500 errors in Vercel logs
   - Average evolution generation time < 60 seconds
   - Average visualization generation time < 45 seconds
   - Admin user (ahiya.butman@gmail.com) can complete Sarah's journey

## Key Decisions

### Decision 1: Use react-markdown for Evolution Reports
**Rationale:** Evolution reports contain markdown (bold, headers, italics) that must be rendered for visual hierarchy. Plain text loses impact. `react-markdown` is lightweight (12KB), customizable, and has 13K stars on GitHub. Alternative (remark + rehype) is heavier and more complex.

### Decision 2: Client-Side Eligibility Calculation
**Rationale:** Dream detail page already fetches reflections for display. Counting `reflections.length >= 4` is trivial and instant. No need for new backend endpoint or additional network request. Simpler and faster.

### Decision 3: Keep All 3 Visualization Styles (Achievement/Spiral/Synthesis)
**Rationale:** Vision.md says "Achievement only for MVP" but backend implements 3 styles and UI shows all 3. Since code already works, keep it as "bonus feature beyond MVP scope." Update vision.md in iteration 21 to reflect reality. For iteration 20, focus on Achievement style formatting quality.

### Decision 4: Defer UsageCard Multi-Metric Display to Iteration 21
**Rationale:** Vision specifies showing 3 usage metrics (reflections, evolution, visualizations). Currently shows reflections only. Adding all 3 requires date filtering logic (count current month reports). This is 3-4 hours of work and not blocking Sarah's journey. Defer to iteration 21 polish phase. For iteration 20, show reflections only.

### Decision 5: Defer Dream Card Quick Actions to Iteration 21
**Rationale:** Vision doesn't explicitly require Reflect/Evolution/Visualize buttons on dream cards. Users can click into dream detail page to access generation. Quick actions are nice-to-have but not core to breakthrough moment. Saves 2-3 hours. Add in polish phase (iteration 21).

### Decision 6: Create VisualizationCard Component for Dashboard
**Rationale:** Evolution has EvolutionCard, visualizations should have equivalent. Dashboard cohesion requires both AI features previewed. Medium priority (3-4 hours) but worth including for completeness. Defer to end of iteration if time-constrained.

## Notes for Builders

### Pre-Flight Checks (DO THESE FIRST):
1. Verify `usage_tracking` table has `month` column (DATE type), not `month_year` (TEXT)
2. Test database functions: `SELECT check_evolution_limit(user_id, 'FREE', 'dream_specific')` - should NOT error
3. Check if `react-markdown` is installed: `npm list react-markdown` (if not: `npm install react-markdown remark-gfm`)
4. Confirm tRPC routers working: Test `trpc.evolution.list.useQuery()` in browser console

### Architecture Understanding:
- Backend is 100% complete (evolution.ts, visualizations.ts routers production-ready)
- Frontend is 30-70% complete (list pages exist, detail pages need formatting)
- Dream detail page is CRITICAL PATH (highest impact for Sarah's journey)
- Dashboard cards are SECONDARY (nice-to-have but not blocking)

### Time Management:
- Prioritize dream detail page integration (4-5 hours)
- Then evolution/visualization formatting (3-4 hours each)
- Dashboard cards if time permits (3-4 hours each)
- Test Sarah's journey BEFORE completing iteration (1 hour)

### Quality Standards:
- Every markdown element must have cosmic styling (no default prose styles)
- CosmicLoader must show during ALL AI generation (no blank screens)
- Eligibility messages must be clear: "You have 3 reflections. Create 1 more to unlock evolution reports."
- Immersive = Large text + Gradient highlights + 1.8 line-height (concrete criteria)

---

**Plan Status:** PLANNED
**Ready for:** Builder execution
**Focus:** Sarah's Day 6 breakthrough moment
**Goal:** Transform reflections into insights and visualizations seamlessly
