# Builder Task Breakdown - Iteration 20

## Overview

**Primary Builders:** 1-2 builders (start with 1, split if complexity exceeds 8 hours)

**Estimated Total Effort:** 12-16 hours

**Strategy:** Single builder attempts full scope. If after 8 hours progress is slow, split remaining work into parallel sub-builders.

**Critical Dependencies:**
- Database schema: `usage_tracking` table must have `month` column (DATE type)
- Libraries: `react-markdown` and `remark-gfm` must be installed
- Backend: tRPC routers complete (no backend changes needed)

---

## Builder-1: Evolution & Visualization UI Integration

### Scope
Complete frontend integration for Evolution Reports and Visualizations:
1. Add generation buttons to dream detail page with eligibility checking
2. Add markdown rendering to evolution report detail page
3. Add immersive formatting to visualization detail page
4. Rebuild EvolutionCard with real data (replace "Coming Soon" placeholder)
5. Create VisualizationCard component for dashboard
6. Test Sarah's Day 6 journey end-to-end

### Complexity Estimate
**HIGH (12-16 hours)**

**Justification:**
- Multiple pages to modify (4-5 files)
- New component creation (VisualizationCard)
- Complex formatting requirements (markdown + immersive visualization)
- Long testing cycle (30-45 second AI generation times)
- Integration across dashboard, dream detail, evolution, and visualization pages

**Recommendation:** Attempt as single builder. If after 8 hours less than 50% complete, split into Builder-1A and Builder-1B (see split strategy below).

---

### Success Criteria

- [ ] Dream detail page shows "Generate Evolution Report" button when >= 4 reflections exist
- [ ] Dream detail page shows "Generate Visualization" button when >= 4 reflections exist
- [ ] Eligibility status displayed: "You have X reflections. Create Y more to unlock."
- [ ] CosmicLoader displays during AI generation (30-45 seconds) with helpful message
- [ ] Evolution report detail page renders markdown with cosmic styling (gradient headers, colored bold/italics)
- [ ] Visualization detail page displays achievement narrative with immersive formatting (18-20px text, gradient highlights on "I am...", 1.8 line-height)
- [ ] Dashboard EvolutionCard shows latest report preview (first 200 characters) and link to full report
- [ ] Dashboard EvolutionCard shows eligibility status with progress bar when no reports exist
- [ ] Dashboard VisualizationCard exists and shows latest visualization preview
- [ ] Sarah's Day 6 journey completes without errors: Create dream → 4 reflections → generate evolution → generate visualization
- [ ] Usage counters increment correctly after generation (visible in dashboard or backend)
- [ ] Zero console errors during entire flow

---

### Files to Create/Modify

**1. `/app/dreams/[id]/page.tsx` (MODIFY - ~100 lines added)**
- Purpose: Add evolution and visualization generation buttons with eligibility checks
- Current state: Has dream display, reflection list, status buttons
- Changes needed:
  - Import `trpc.evolution.generateDreamEvolution` mutation
  - Import `trpc.visualizations.generate` mutation
  - Calculate eligibility: `reflectionCount >= 4`
  - Add "Generate Evolution Report" section with button
  - Add "Generate Visualization" section with button
  - Show eligibility status when not eligible
  - Add loading states with CosmicLoader during generation
  - Redirect to detail pages on success

**2. `/app/evolution/[id]/page.tsx` (MODIFY - ~50 lines added)**
- Purpose: Replace plain text display with markdown rendering
- Current state: Shows evolution text with `whitespace-pre-wrap`
- Changes needed:
  - Install `react-markdown` and `remark-gfm` (if not present)
  - Import ReactMarkdown and remarkGfm
  - Replace `<div className="whitespace-pre-wrap">` with `<ReactMarkdown>`
  - Add custom component renderers for h1, h2, h3, strong, em, ul, ol, p
  - Apply cosmic styling (GradientText for headers, mirror-purple for bold, etc.)
  - Test with actual generated report

**3. `/app/visualizations/[id]/page.tsx` (MODIFY - ~80 lines added)**
- Purpose: Add immersive formatting for achievement narrative
- Current state: Shows narrative as plain text
- Changes needed:
  - Increase font size: `text-lg md:text-xl` (18-20px)
  - Increase line-height: `leading-loose` or `style={{ lineHeight: '1.8' }}`
  - Add letter spacing: `tracking-wide`
  - Create `highlightAchievementPhrases` function to wrap "I am...", "I'm...", "I've..." in GradientText
  - Split content into paragraphs and map with spacing
  - Add background glow effects (optional but recommended)
  - Test readability on mobile

**4. `/components/dashboard/cards/EvolutionCard.tsx` (REBUILD - ~150 lines modified)**
- Purpose: Replace placeholder with real data
- Current state: Shows "Coming Soon" message, disabled button, hardcoded 0% progress
- Changes needed:
  - Query latest report: `trpc.evolution.list.useQuery({ page: 1, limit: 1 })`
  - Query eligibility: `trpc.evolution.checkEligibility.useQuery()`
  - Show latest report preview with first 200 characters
  - Click preview to navigate to full report (`/evolution/${reportId}`)
  - Show eligibility status when no reports exist
  - Show progress bar based on reflection count toward threshold
  - Enable "Generate Report" button when eligible
  - Link button to `/evolution` page

**5. `/components/dashboard/cards/VisualizationCard.tsx` (CREATE NEW - ~120 lines)**
- Purpose: Dashboard card for visualization previews
- Similar structure to EvolutionCard
- Features needed:
  - Query latest visualization: `trpc.visualizations.list.useQuery({ page: 1, limit: 1 })`
  - Show visualization preview with first 150 characters
  - Display style icon (🏔️ for achievement, 🌀 for spiral, 🌌 for synthesis)
  - Click preview to navigate to full visualization (`/visualizations/${vizId}`)
  - "View all visualizations" link to `/visualizations` page
  - If no visualizations, show CTA button to create first one

**6. `/app/dashboard/page.tsx` (MODIFY - ~10 lines added)**
- Purpose: Add VisualizationCard to dashboard layout
- Import VisualizationCard component
- Add to grid layout (likely in second column or below EvolutionCard)

**7. `/lib/hooks/useEligibility.ts` (CREATE NEW - OPTIONAL - ~30 lines)**
- Purpose: Shared eligibility logic (if creating sub-builders)
- Function: `useEligibility(dreamId, featureType)` returns `{ eligible, reflectionCount, threshold, remainingCount }`
- Only create if splitting builders (saves duplication)

---

### Dependencies

**Depends on:**
- Database migration: `usage_tracking` schema fixed (should be done from iteration 19)
- tRPC routers: `evolution.ts`, `visualizations.ts` complete (already done)
- Glass components: GlassCard, GlowButton, CosmicLoader, GradientText (already exist)

**Blocks:**
- Iteration 21 (onboarding and polish phase)
- Sarah's journey validation (cannot test until this iteration completes)

---

### Implementation Notes

#### Pre-Flight Checks (DO THESE FIRST)
1. **Verify database schema:**
   ```sql
   -- Run in Supabase SQL editor
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'usage_tracking';

   -- Must see: month | date (NOT month_year | text)
   ```

2. **Test database functions:**
   ```sql
   -- Should NOT error
   SELECT check_evolution_limit(
     'user-id-here'::uuid,
     'FREE'::tier_type,
     'dream_specific'::evolution_report_type
   );
   ```

3. **Install markdown libraries:**
   ```bash
   npm list react-markdown remark-gfm
   # If not present:
   npm install react-markdown remark-gfm
   ```

4. **Test tRPC endpoints in browser console:**
   ```javascript
   // Open browser, go to /dashboard, open console
   const result = await trpc.evolution.list.query({ page: 1, limit: 1 });
   console.log(result); // Should return reports list
   ```

#### Architecture Understanding
- **Backend is complete:** No server code changes needed
- **Frontend is 30-70% complete:** List pages exist, detail pages need formatting
- **Critical path:** Dream detail page integration (highest user impact)
- **Secondary path:** Dashboard cards (nice-to-have, not blocking breakthrough moment)

#### Time Management Priority
1. **MUST HAVE (8-10 hours):**
   - Dream detail page: Evolution + Visualization buttons (4-5 hours)
   - Evolution detail: Markdown rendering (2 hours)
   - Visualization detail: Immersive formatting (2-3 hours)

2. **SHOULD HAVE (2-3 hours):**
   - EvolutionCard rebuild (2 hours)
   - VisualizationCard creation (1 hour)

3. **NICE TO HAVE (1-2 hours):**
   - Dashboard layout polish
   - Additional loading state improvements
   - Error message refinements

**Strategy:** Complete MUST HAVE items first. Test Sarah's journey. If time permits, add SHOULD HAVE and NICE TO HAVE.

---

### Patterns to Follow

Reference `patterns.md` extensively. Key patterns:

1. **tRPC Mutation with Loading State and Redirect**
   - Use for evolution and visualization generation buttons
   - Show CosmicLoader during 30-45s wait
   - Redirect to detail page on success

2. **Client-Side Eligibility Calculation**
   - Filter reflections by dream_id client-side
   - Count reflections: `dreamReflections.length >= 4`
   - Show clear status: "Create X more reflections to unlock"

3. **Markdown Rendering with Cosmic Styling**
   - Use ReactMarkdown with custom component renderers
   - Apply GradientText to h1/h2 headers
   - Use text-mirror-purple for bold, text-mirror-indigo for emphasis

4. **Immersive Visualization Formatting**
   - Large text: 18-20px (text-lg md:text-xl)
   - Line-height: 1.8 (leading-loose)
   - Highlight "I am..." phrases with GradientText
   - Background glow effects for atmosphere

5. **Dashboard Card with Real Data**
   - Query latest item: `{ page: 1, limit: 1 }`
   - Show preview with line-clamp-3
   - Click preview to navigate to detail page
   - Empty state with CTA button

---

### Testing Requirements

**Unit Tests:** None (manual testing for MVP)

**Manual Testing Checklist:**

1. **Dream Detail Page Integration:**
   - [ ] Navigate to dream with 0 reflections → No generate buttons shown
   - [ ] Navigate to dream with 2 reflections → Status shows "Create 2 more to unlock"
   - [ ] Navigate to dream with 4 reflections → Both generate buttons visible
   - [ ] Click "Generate Evolution Report" → CosmicLoader shows ~30s
   - [ ] Evolution generation completes → Redirects to `/evolution/[id]`
   - [ ] Evolution report displays with formatted markdown
   - [ ] Go back, click "Generate Visualization" → CosmicLoader shows ~30s
   - [ ] Visualization generation completes → Redirects to `/visualizations/[id]`
   - [ ] Visualization displays with large text and gradient highlights

2. **Dashboard Integration:**
   - [ ] Open dashboard → EvolutionCard shows latest report preview (if reports exist)
   - [ ] Click report preview → Navigates to full report
   - [ ] EvolutionCard shows eligibility status if no reports yet
   - [ ] VisualizationCard shows latest visualization preview
   - [ ] Click visualization preview → Navigates to full visualization

3. **Edge Cases:**
   - [ ] Try generating evolution with 3 reflections → Error message clear
   - [ ] Try generating 2nd evolution in same month (Free tier) → Limit error
   - [ ] Navigate away during generation → Confirm behavior (should warn)
   - [ ] Test on mobile device → Text readable, buttons accessible

4. **Sarah's Journey (Day 0-6):**
   - [ ] Create new dream: "Launch Sustainable Fashion Brand"
   - [ ] Create reflection 1 → Dashboard shows 1 reflection
   - [ ] Create reflection 2 → Status shows "Create 2 more to unlock"
   - [ ] Create reflection 3 → Status shows "Create 1 more to unlock"
   - [ ] Create reflection 4 → Generate buttons appear
   - [ ] Generate evolution report → Wait 30-45s → See formatted report
   - [ ] Report feels "revelatory" (good insights, clear structure)
   - [ ] Generate visualization → Wait 25-35s → See immersive narrative
   - [ ] Narrative feels "I'm already there" (future-self perspective)
   - [ ] Dashboard shows both previews
   - [ ] **MAGIC MOMENT CHECK:** Does this feel like a breakthrough? Would Sarah be hooked?

**Coverage Target:** 100% of Sarah's Day 6 journey must work perfectly (this is the MVP success criterion)

---

### Potential Split Strategy (If Complexity Too High)

**Split After:** 8 hours of Builder-1 work if less than 50% complete

**Foundation (Created by Builder-1 Before Split):**
- `/lib/hooks/useEligibility.ts` - Shared eligibility checking hook
- `/app/dreams/[id]/page.tsx` - Evolution button integration (partial)

**Sub-Builder-1A: Evolution UI (4-5 hours)**
- Complete evolution button on dream detail page
- Add markdown rendering to evolution detail page
- Rebuild EvolutionCard with real data
- Test evolution generation end-to-end

**Files:**
- `/app/dreams/[id]/page.tsx` (evolution section only)
- `/app/evolution/[id]/page.tsx` (markdown rendering)
- `/components/dashboard/cards/EvolutionCard.tsx` (rebuild)

**Deliverables:**
- [ ] Evolution generation works from dream detail page
- [ ] Evolution report displays with formatted markdown
- [ ] Dashboard shows evolution preview

**Estimate:** MEDIUM (4-5 hours)

---

**Sub-Builder-1B: Visualization UI (4-5 hours)**
- Add visualization button to dream detail page (merge with Builder-1A changes)
- Add immersive formatting to visualization detail page
- Create VisualizationCard component
- Add to dashboard layout
- Test visualization generation end-to-end

**Files:**
- `/app/dreams/[id]/page.tsx` (visualization section - merge with 1A)
- `/app/visualizations/[id]/page.tsx` (immersive formatting)
- `/components/dashboard/cards/VisualizationCard.tsx` (new)
- `/app/dashboard/page.tsx` (add card to layout)

**Deliverables:**
- [ ] Visualization generation works from dream detail page
- [ ] Visualization displays with immersive formatting
- [ ] Dashboard shows visualization preview

**Estimate:** MEDIUM (4-5 hours)

---

**Coordination Points (If Split Occurs):**
- Both sub-builders use `useEligibility` hook (created by Builder-1)
- Dream detail page merge required:
  - Builder-1A adds evolution button above reflections list
  - Builder-1B adds visualization button BELOW evolution button
  - Spatial separation prevents conflicts
- Dashboard layout:
  - Builder-1A doesn't touch VisualizationCard
  - Builder-1B adds VisualizationCard in second column or below EvolutionCard
- Testing:
  - Builder-1A tests evolution flow only
  - Builder-1B tests visualization flow only
  - Integrator tests full Sarah's journey (both features together)

---

## Builder Execution Order

### Phase 1: Foundation (Single Builder)
**Duration:** 0-8 hours

**Builder-1 Tasks:**
1. Pre-flight checks (database, libraries, tRPC)
2. Dream detail page integration start
3. Evolution detail markdown rendering
4. Test evolution generation

**Decision Point at 8 Hours:**
- If >50% complete: Continue as single builder
- If <50% complete: Split into Builder-1A and Builder-1B

---

### Phase 2A: Completion (Single Builder Path)
**Duration:** 8-16 hours

**Builder-1 Tasks:**
1. Visualization detail immersive formatting
2. Dashboard card rebuilds
3. End-to-end testing
4. Polish and refinements

---

### Phase 2B: Parallel Work (Split Builder Path)
**Duration:** 8-13 hours (parallel)

**Builder-1A Tasks:**
- Complete evolution integration
- Test evolution flow

**Builder-1B Tasks (parallel):**
- Complete visualization integration
- Test visualization flow

**Integration Phase:**
- Merge dream detail page changes
- Test full Sarah's journey
- Resolve any conflicts

---

## Integration Notes

### How Builder Outputs Will Merge

**Single Builder Path:**
- No merge conflicts (one author, sequential work)
- Natural flow: Dream detail → Evolution → Visualization → Dashboard

**Split Builder Path:**
- **Dream Detail Page:** Both builders modify same file
  - Builder-1A commits first (evolution button)
  - Builder-1B pulls latest, adds visualization button NEXT TO evolution button
  - Merge strategy: Spatial separation (buttons in same section, one after another)

- **Dashboard Layout:** Both builders modify dashboard page
  - Builder-1A doesn't touch VisualizationCard
  - Builder-1B adds VisualizationCard in grid
  - No conflicts (different components)

- **Shared Hook:** Both use `useEligibility` hook
  - Created by Builder-1 before split
  - No modifications needed by sub-builders
  - Both import and use as-is

**Conflict Prevention:**
- Communicate via shared status document (e.g., BUILDER_STATUS.md)
- Builder-1A commits and pushes ASAP after completion
- Builder-1B pulls before starting work on shared files
- Use git feature branches if working truly in parallel

---

### Shared Files (Potential Conflicts)

**High Conflict Risk:**
- `/app/dreams/[id]/page.tsx` - Both builders add buttons
  - Mitigation: Sequential work (1A first) or spatial separation

**Medium Conflict Risk:**
- `/app/dashboard/page.tsx` - Both may adjust layout
  - Mitigation: Builder-1A doesn't touch layout, Builder-1B adds new card

**Low Conflict Risk:**
- All other files are isolated per builder
  - `/app/evolution/[id]/page.tsx` - Only Builder-1A
  - `/app/visualizations/[id]/page.tsx` - Only Builder-1B
  - `/components/dashboard/cards/EvolutionCard.tsx` - Only Builder-1A
  - `/components/dashboard/cards/VisualizationCard.tsx` - Only Builder-1B (new file)

---

## Final Notes for Builders

### Success Mindset
- **Focus on the magic moment:** Sarah's Day 6 breakthrough must feel transformational
- **Quality over speed:** 30-45 second AI generation is long - make waiting experience delightful
- **Test early, test often:** Generate actual reports/visualizations to see real output
- **Use existing patterns:** Don't reinvent - copy from `patterns.md` extensively

### When to Ask for Help
- Database functions returning errors after 1 hour of debugging → Escalate
- tRPC queries returning unexpected data → Check backend first, then escalate
- Markdown rendering looks broken after trying all pattern examples → Escalate
- Generation times exceed 60 seconds consistently → Escalate (API issue)

### When to Split Work
- After 8 hours, less than 50% complete (dream detail + evolution detail not done)
- Feeling overwhelmed by scope (honest self-assessment)
- Clear split point exists (evolution vs visualization are independent)

### Quality Checks Before Completion
- [ ] Zero console errors during Sarah's journey
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] All loading states show CosmicLoader (no blank screens)
- [ ] All error states show user-friendly messages
- [ ] Markdown headers have gradient text (not plain white)
- [ ] Visualization text is 18-20px (not default 14-16px)
- [ ] Dashboard cards show real data (not "Coming Soon")
- [ ] Sarah's journey feels magical (subjective but critical)

---

**Builder Tasks Status:** FINALIZED
**Total Builders:** 1-2 (start with 1, split if needed)
**Estimated Duration:** 12-16 hours
**Ready for:** Builder execution
**Split Strategy:** Clear and documented
**Integration Complexity:** LOW-MEDIUM (manageable conflicts)
