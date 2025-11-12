# Explorer 2 Report: Visualization UI & Dashboard Integration

## Executive Summary

The visualization and evolution backend infrastructure is **production-ready** with comprehensive AI generation logic, temporal distribution, and tier-based limits. However, the **UI integration is incomplete**. Key gaps include: (1) Dream detail page lacks "Generate" buttons and eligibility displays, (2) Evolution/Visualization detail pages need markdown rendering and immersive formatting, (3) Dashboard lacks preview cards for latest reports/visualizations, and (4) Usage tracking requires schema migration before features work. Estimated builder effort: **12-16 hours** for complete integration.

## Discoveries

### Backend Infrastructure (COMPLETE)

#### Evolution Reports Router
- **Status:** Production-ready, fully functional
- **Endpoints:** `generateDreamEvolution`, `generateCrossDreamEvolution`, `list`, `get`, `checkEligibility`
- **Thresholds:** Dream-specific (≥4 reflections), Cross-dream (≥12 reflections, Essential+ tier)
- **Context Distribution:** Temporal selection (1/3 early, 1/3 middle, 1/3 recent)
- **Tier Context:** Free: 4 reflections, Essential: 6, Optimal: 9, Premium: 12
- **Monthly Limits:** Free: blocked, Essential: 3, Optimal: 6, Premium: unlimited
- **Extended Thinking:** Optimal/Premium tiers (10,000 token budget)
- **Cost Tracking:** API usage logged with input/output/thinking tokens
- **Location:** `/server/trpc/routers/evolution.ts` (580 lines)

#### Visualizations Router
- **Status:** Production-ready, fully functional
- **Endpoints:** `generate`, `list`, `get`
- **Styles:** Achievement (linear journey), Spiral (growth cycles), Synthesis (constellation map)
- **Thresholds:** Dream-specific (≥4 reflections), Cross-dream (≥12 reflections, Essential+ tier)
- **Context Distribution:** Same temporal selection as evolution reports
- **Monthly Limits:** Free: 1, Essential: 3, Optimal: 6, Premium: unlimited
- **Achievement Style:** Future-self perspective, present tense, immersive narrative (400-600 words)
- **Location:** `/server/trpc/routers/visualizations.ts` (400 lines)

#### Database Functions (BLOCKED)
- **Critical Issue:** `usage_tracking` table has `month_year` (TEXT) but functions expect `month` (DATE)
- **Affected Functions:** 
  - `check_evolution_limit` - Returns error on call
  - `check_visualization_limit` - Returns error on call
  - `increment_usage_counter` - Cannot increment counters
- **Impact:** Evolution/visualization generation will fail on usage tracking step
- **Fix Required:** Builder-1 must create migration (documented in current-state.md)
- **Timeline:** MUST be fixed before Builder-2 starts UI work

### Frontend UI Status

#### Existing Pages

**1. `/app/evolution/page.tsx` (Generation Hub)**
- **Status:** Functional but needs refinement
- **Features Present:**
  - Dream selection grid
  - Generate Dream Report button
  - Generate Cross-Dream Report button
  - Reports list with pagination
  - Eligibility check integration
  - Free tier upgrade prompt
- **Gaps:**
  - No individual dream eligibility display ("You have 3 reflections, need 1 more")
  - No context about temporal distribution shown
  - No tier-specific messaging (Free users see "upgrade" but no explanation of limits)
  - Alert-based error handling (should use toast notifications)
- **Assessment:** 70% complete, needs polish

**2. `/app/evolution/[id]/page.tsx` (Report Detail)**
- **Status:** Basic display, needs formatting
- **Features Present:**
  - Report content display
  - Back navigation
  - Dream title/category display
  - Reflection count
  - Creation date
  - Link to create visualization
- **Gaps:**
  - **No markdown rendering** (evolution text is whitespace-pre-wrap only)
  - No section headers emphasized
  - No gradient text for key insights
  - No immersive formatting (should feel "revelatory")
  - Missing share/download functionality (out of MVP scope)
- **Assessment:** 50% complete, needs rich formatting

**3. `/app/visualizations/page.tsx` (Generation Hub)**
- **Status:** Well-implemented, mostly complete
- **Features Present:**
  - Style selection (Achievement/Spiral/Synthesis) with visual cards
  - Dream selection (cross-dream or specific dream)
  - Free tier warning for cross-dream
  - Visualizations list with style icons
  - CosmicLoader during generation
  - Click to view full narrative
- **Gaps:**
  - No individual dream eligibility display
  - No explanation of "Achievement narrative style" for MVP
  - Should disable Spiral/Synthesis for MVP (per vision.md) or explain they're available
  - No usage limit display on page
- **Assessment:** 80% complete, minor refinements

**4. `/app/visualizations/[id]/page.tsx` (Narrative Detail)**
- **Status:** Functional but lacks immersion
- **Features Present:**
  - Style-specific gradient header
  - Narrative display
  - Dream context card
  - Back navigation
- **Gaps:**
  - **No immersive formatting** (achievement narrative should feel like "you're there")
  - Text is plain whitespace-pre-wrap (should emphasize future-self perspective)
  - Missing larger font size for readability
  - No visual emphasis on "I am..." statements
  - No emotional impact cues (color, typography)
- **Assessment:** 60% complete, needs immersive UX

**5. `/app/dreams/[id]/page.tsx` (Dream Detail)**
- **Status:** Functional but missing AI features
- **Features Present:**
  - Dream header with category emoji
  - Status badges
  - Description display
  - Status update buttons
  - Reflections list
  - "Reflect" quick action
- **Gaps (CRITICAL):**
  - **No "Generate Evolution Report" button**
  - **No "Generate Visualization" button**
  - No eligibility checks displayed
  - No progress indicators ("3 of 4 reflections for evolution")
  - Reflections filtered client-side (should pass dreamId to query)
- **Assessment:** 40% complete for AI features

#### Dashboard Cards

**1. `EvolutionCard.tsx`**
- **Status:** Placeholder, needs full implementation
- **Current Features:**
  - Fetches `checkEligibility` from tRPC
  - Shows "Coming Soon" message
  - Disabled "Generate Report" button
  - Progress bar (hardcoded 0%)
- **Missing (CRITICAL):**
  - Latest evolution report preview
  - Link to view full report
  - Actual progress calculation (reflections toward threshold)
  - Generate button with eligibility check
  - Per-dream eligibility status
  - Usage limit display
- **Assessment:** 20% complete, major work needed

**2. `DreamsCard.tsx`**
- **Status:** Complete for display, missing quick actions
- **Current Features:**
  - Shows 3 active dreams
  - Category emojis
  - Days left countdown
  - Reflection count
  - Link to dream detail
- **Missing:**
  - **Quick action buttons (Reflect, Evolution, Visualize)** per dream card
  - Eligibility badges (e.g., "✨ Evolution Ready")
  - Visual indicators for unlock thresholds
- **Assessment:** 70% complete, needs quick actions

**3. `ReflectionsCard.tsx`**
- **Status:** Complete
- **Features:**
  - Shows last 3 reflections across all dreams
  - Staggered animations
  - Links to reflection detail
  - Empty state with CTA
- **No gaps identified** - This card meets vision requirements
- **Assessment:** 100% complete

### Vision Alignment Issues

#### 1. Multiple Visualization Styles (Vision Discrepancy)
- **Vision says:** "Achievement narrative style (only style for MVP)"
- **Code implements:** 3 styles (achievement, spiral, synthesis)
- **UI shows:** All 3 style options in visualizations page
- **Recommendation:** Either (a) disable spiral/synthesis for MVP, or (b) update vision to reflect "3 styles available"
- **Impact:** Low priority, but creates expectation mismatch

#### 2. Cross-Dream Features (Vision Discrepancy)
- **Vision says:** "Dream-specific only for MVP"
- **Code implements:** Full cross-dream logic for both evolution and visualization
- **UI shows:** Cross-dream options available (with tier restrictions)
- **Recommendation:** Keep cross-dream (it's already built), document as "bonus feature"
- **Impact:** Low priority, adds value beyond MVP scope

#### 3. Tier Limits Mismatch (CRITICAL)
- **Vision:** Free tier has 4 reflections/month
- **Code:** Free tier has 1 reflection/month
- **Documentation:** Builder-1 responsible for fixing (noted in current-state.md)
- **Impact:** HIGH - Must fix before testing Sarah's journey

## Patterns Identified

### Pattern 1: Separate List/Detail Pages
**Description:** Evolution and visualizations follow consistent pattern: list page for generation + browsing, detail page for viewing
**Use Case:** User generates report → redirected to detail page → can return to list to generate more
**Example Structure:**
```
/evolution/page.tsx (list + generate)
/evolution/[id]/page.tsx (view report)
/visualizations/page.tsx (list + generate)
/visualizations/[id]/page.tsx (view narrative)
```
**Recommendation:** Maintain this pattern, add breadcrumb navigation for clarity

### Pattern 2: Eligibility-Gated Actions
**Description:** All AI features check eligibility before showing "Generate" button
**Use Case:** Prevent user frustration by showing progress toward unlock
**Example Implementation:**
```typescript
const { data: eligibility } = trpc.evolution.checkEligibility.useQuery({ dreamId });

{eligibility?.eligible ? (
  <GlowButton onClick={handleGenerate}>Generate Evolution Report</GlowButton>
) : (
  <div>You have {eligibility?.reflectionCount} reflections, need 4 to unlock</div>
)}
```
**Recommendation:** Apply to dream detail page for both evolution and visualization

### Pattern 3: Temporal Distribution Transparency
**Description:** Backend uses temporal distribution (1/3 early, 1/3 middle, 1/3 recent) but UI doesn't explain this
**Use Case:** Users understand why only 4-9 reflections analyzed even if they have 20+
**Example UI:**
```
"Analyzing 9 reflections distributed across your journey:
 - 3 from early period (showing starting point)
 - 3 from middle period (showing growth)
 - 3 from recent period (showing current state)"
```
**Recommendation:** Add tooltip or info card explaining temporal distribution

### Pattern 4: Achievement Narrative Immersion
**Description:** Achievement style visualizations should feel like "experiencing the achieved dream"
**Use Case:** Sarah reads visualization and feels the dream is real
**Example Formatting:**
- Larger font size (18-20px vs 14-16px)
- Gradient text for "I am..." statements
- Subtle glow effect on key phrases
- Present-tense, future-self perspective emphasized
**Recommendation:** Builder-2 should study `MirrorExperience.tsx` for immersive patterns (780 lines, signature piece)

## Complexity Assessment

### High Complexity Areas

#### 1. Dream Detail Page Integration (8-10 hours)
**Why Complex:**
- Must check eligibility for BOTH evolution and visualization
- Must show progress indicators separately for each feature
- Must handle tier restrictions (Free: no evolution, 1 viz/month)
- Must display usage limits dynamically
- Must add quick action buttons with loading states
**Builder Splits:** Single builder (requires tight coordination with backend understanding)
**Tasks:**
1. Add `checkEligibility` queries for evolution and visualization
2. Calculate progress percentages (reflectionCount / threshold)
3. Add "Generate Evolution Report" button with eligibility guard
4. Add "Generate Visualization" button with eligibility guard
5. Show progress indicators ("3 of 4 reflections")
6. Add CosmicLoader for 30-45s generation
7. Redirect to detail page after generation
8. Test with different tier users

#### 2. Dashboard Evolution Card Rebuild (6-8 hours)
**Why Complex:**
- Must fetch latest evolution report across all dreams
- Must show preview (first 200 characters)
- Must show eligibility status for multiple dreams
- Must display usage limits (reports used this month)
- Must handle cross-dream vs dream-specific reports
**Builder Splits:** Single builder
**Tasks:**
1. Replace placeholder with real data fetch (`trpc.evolution.list`)
2. Get latest report and show preview
3. Calculate total reflections across dreams for progress
4. Show "Generate" button with eligibility check
5. Display usage: "2 of 6 reports used this month"
6. Link to full report detail page
7. Handle empty state (no reports yet)

#### 3. Visualization Detail Page Immersive Formatting (4-6 hours)
**Why Complex:**
- Achievement narrative must feel "immersive" not just readable
- Requires custom typography, gradients, spacing
- Must emphasize future-self perspective
- Must create emotional impact
**Builder Splits:** Single builder (design + implementation)
**Tasks:**
1. Increase base font size (18-20px)
2. Add gradient text for "I am..." and "I'm..." phrases
3. Add subtle glow effects on key statements
4. Increase line-height for readability (1.8-2.0)
5. Add section breaks with visual dividers
6. Test on mobile (ensure immersive feel on small screens)
7. Add "soft, glossy, sharp" tone cues

### Medium Complexity Areas

#### 4. Evolution Report Markdown Rendering (3-4 hours)
**Why Medium:**
- Evolution reports include markdown (bold, italics, headers)
- Need to parse and render with cosmic styling
- Must preserve whitespace but add formatting
**Tasks:**
1. Install markdown parser (react-markdown or similar)
2. Create custom renderers for headers, bold, italics
3. Apply cosmic color palette to markdown elements
4. Test with sample reports
5. Ensure prose styles don't conflict

#### 5. Dashboard Visualization Preview Card (3-4 hours)
**Why Medium:**
- Need new card component for visualizations
- Show latest visualization with style icon
- Link to detail page
- Display usage limit
**Tasks:**
1. Create `VisualizationCard.tsx` component
2. Fetch latest visualization via `trpc.visualizations.list`
3. Show narrative preview (first 150 characters)
4. Display style icon (🏔️ / 🌀 / 🌌)
5. Show usage: "1 of 6 visualizations used this month"
6. Add to dashboard layout

#### 6. Quick Actions on Dream Cards (2-3 hours)
**Why Medium:**
- Add 3 buttons per dream card (Reflect, Evolution, Visualize)
- Must handle eligibility checks per dream
- Must fit within existing card layout
**Tasks:**
1. Update `DreamsCard.tsx` to show action buttons
2. Add eligibility badges ("✨ Evolution Ready")
3. Link buttons to respective pages with dreamId param
4. Test responsive layout (mobile stacking)

### Low Complexity Areas

#### 7. Usage Limit Displays (1-2 hours)
**Why Low:**
- Data already available via usage tracking
- Simple display of "X of Y used this month"
**Tasks:**
1. Add usage display to evolution page
2. Add usage display to visualizations page
3. Show progress bars (optional)

#### 8. Eligibility Status Messages (1-2 hours)
**Why Low:**
- Simple conditional rendering based on eligibility data
- "You have 3 reflections, need 1 more to unlock"
**Tasks:**
1. Add to dream detail page
2. Add to evolution page
3. Add to visualizations page

## Technology Recommendations

### Primary Stack (Already in Place)

#### Frontend
- **Framework:** Next.js 14 (App Router) - Already used, working well
- **UI Components:** Custom glass components - Production-ready, no external library needed
- **State Management:** TanStack Query (via tRPC) - Automatic caching, perfect for dashboard
- **Animations:** Framer Motion - Already used in MirrorExperience, apply to visualization display
- **Forms:** Not needed for this iteration (generation is button-click, not form)

#### Backend
- **tRPC:** Already implemented, type-safe, excellent DX
- **AI:** Claude Sonnet 4 via Anthropic SDK - Working perfectly
- **Database:** Supabase PostgreSQL - Schema ready, just needs migration

### Supporting Libraries

#### For Markdown Rendering
- **react-markdown:** Lightweight, customizable, 4.6k stars
- **Why:** Evolution reports contain markdown that needs parsing
- **Alternative:** remark + rehype (more control but heavier)
- **Installation:** `npm install react-markdown`
- **Usage:**
```typescript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown
  components={{
    h2: ({node, ...props}) => <GradientText gradient="cosmic" className="text-2xl font-bold" {...props} />,
    strong: ({node, ...props}) => <span className="text-mirror-purple font-semibold" {...props} />,
  }}
>
  {report.evolution}
</ReactMarkdown>
```

#### For Text Highlighting (Visualization Immersion)
- **Option 1:** Custom regex to find "I am..." patterns and wrap in gradient spans
- **Option 2:** Use `react-string-replace` library (simpler)
- **Recommendation:** Custom regex (no extra dependency, full control)
- **Example:**
```typescript
const highlightAchievementText = (text: string) => {
  return text.replace(
    /(I am|I'm|I've|I have achieved)/gi,
    '<span class="achievement-highlight">$1</span>'
  );
};
```

## Integration Points

### External APIs

#### Anthropic Claude API
- **Purpose:** Generate evolution reports and visualizations
- **Complexity:** Low (already integrated)
- **Considerations:**
  - 30-45 second generation time (requires good UX during wait)
  - Extended thinking adds 10-15 seconds for Optimal/Premium
  - Token costs tracked per operation
  - Rate limiting handled by Anthropic SDK
- **No action needed:** Backend complete

### Internal Integrations

#### Dream Detail Page ↔ Evolution Router
**Connection:** Dream page must call `trpc.evolution.checkEligibility` and `trpc.evolution.generateDreamEvolution`
**Data Flow:**
1. User clicks "Generate Evolution Report" on dream detail page
2. Frontend calls `generateDreamEvolution.mutate({ dreamId })`
3. Backend checks eligibility, generates report (45s)
4. Frontend shows CosmicLoader during wait
5. On success, redirect to `/evolution/{reportId}`
**Complexity:** Medium (must handle long wait time gracefully)

#### Dream Detail Page ↔ Visualizations Router
**Connection:** Similar to evolution, but for visualizations
**Data Flow:**
1. User clicks "Generate Visualization" on dream detail page
2. Frontend calls `visualizations.generate.mutate({ dreamId, style: 'achievement' })`
3. Backend generates narrative (30s)
4. Redirect to `/visualizations/{vizId}`
**Complexity:** Medium (must hardcode 'achievement' style for MVP)

#### Dashboard ↔ Evolution/Visualization Lists
**Connection:** Dashboard cards preview latest reports/visualizations
**Data Flow:**
1. EvolutionCard calls `trpc.evolution.list.useQuery({ page: 1, limit: 1 })`
2. VisualizationCard calls `trpc.visualizations.list.useQuery({ page: 1, limit: 1 })`
3. Display preview, link to full detail page
**Complexity:** Low (standard tRPC query)

#### Usage Tracking ↔ All Generation Endpoints
**Connection:** Every generation increments usage counter
**Data Flow:**
1. Backend calls `increment_usage_counter` after successful generation
2. Frontend displays updated usage via `trpc.subscriptions.getStatus` (if available) or refetch
**Complexity:** High (BLOCKED by schema migration)
**Status:** CRITICAL - Builder-1 must fix before Builder-2 starts

## Risks & Challenges

### Technical Risks

#### Risk 1: Usage Tracking Schema Mismatch (CRITICAL)
- **Impact:** Evolution and visualization generation will fail on usage increment step
- **Likelihood:** 100% (confirmed by audit)
- **Mitigation:**
  1. Builder-1 creates migration: `supabase/migrations/20251113000000_fix_usage_tracking.sql`
  2. Migration renames `month_year` to `month`, changes type to DATE
  3. Test migration on local Supabase
  4. Verify all functions work: `check_evolution_limit`, `check_visualization_limit`, `increment_usage_counter`
  5. Deploy migration before Builder-2 starts UI work
- **Timeline:** MUST be done in Iteration 20, cannot defer

#### Risk 2: 30-45 Second Generation Time UX
- **Impact:** Users may think app is frozen, abandon generation
- **Likelihood:** High (especially on mobile)
- **Mitigation:**
  1. Use CosmicLoader with animated message: "Analyzing your journey... (this takes ~30 seconds)"
  2. Add progress percentage if possible (backend doesn't support, so use fake progress bar)
  3. Disable navigation during generation (modal overlay)
  4. Show "Don't close this tab" warning
  5. Test on slow connections (simulate 3G)
- **Recommendation:** Builder-2 should study `MirrorExperience.tsx` for 30s AI wait UX patterns

#### Risk 3: Markdown Rendering Conflicts with Glass UI
- **Impact:** Evolution reports may look broken if markdown styles clash with cosmic theme
- **Likelihood:** Medium
- **Mitigation:**
  1. Create custom markdown component renderers
  2. Apply cosmic color palette to all markdown elements
  3. Test with various report formats
  4. Add `prose prose-invert prose-purple` classes from Tailwind Typography
  5. Override heading colors to use gradient text
- **Recommendation:** Create `CosmicMarkdown.tsx` wrapper component

### Complexity Risks

#### Risk 4: Builder-2 May Need to Split Work (Evolution + Visualization UI)
- **Impact:** 12-16 hours of work may be too much for single iteration
- **Likelihood:** Medium (depends on builder velocity)
- **Split Strategy:**
  - Sub-builder A: Dream detail page integration + Evolution UI (8-10 hours)
  - Sub-builder B: Dashboard cards + Visualization formatting (6-8 hours)
- **Coordination Points:**
  - Both need usage tracking migration (Builder-1 dependency)
  - Both use same eligibility patterns (share code)
  - Dashboard cards depend on detail pages being complete
- **Recommendation:** Attempt as single builder first, split if needed after 8 hours

#### Risk 5: Immersive Visualization Formatting is Subjective
- **Impact:** "Immersive" and "emotional impact" are hard to quantify
- **Likelihood:** High (design is subjective)
- **Mitigation:**
  1. Define "immersive" criteria: large text (18-20px), gradient highlights, 1.8 line-height
  2. Test with sample narratives from vision.md (Sarah's visualization)
  3. Compare to MirrorExperience.tsx tone (use same cosmic effects)
  4. Get feedback loop: generate → format → review → iterate
  5. Use "soft, glossy, sharp" as design principle
- **Recommendation:** Builder-2 should review vision.md Sarah's breakthrough moment (Day 6)

## Recommendations for Planner

### 1. **Prioritize Usage Tracking Migration FIRST (Builder-1)**
**Rationale:** Evolution and visualization generation cannot work without this fix. Builder-2 is blocked until migration completes.

**Tasks:**
- Create migration file: `supabase/migrations/20251113000000_fix_usage_tracking.sql`
- Rename column: `month_year` → `month`
- Change type: TEXT → DATE
- Update constraint: `usage_tracking_user_id_month_year_key` → `usage_tracking_user_id_month_key`
- Test functions: `check_evolution_limit`, `check_visualization_limit`, `increment_usage_counter`
- Verify with test data

**Estimated Time:** 1-2 hours
**Priority:** CRITICAL

---

### 2. **Assign Builder-2 to Complete Visualization UI (12-16 hours total)**
**Rationale:** Backend is ready, just needs frontend connections and formatting.

**Phase 1: Dream Detail Page Integration (4-5 hours)**
- Add eligibility checks for evolution and visualization
- Add "Generate Evolution Report" button with eligibility guard
- Add "Generate Visualization" button with eligibility guard
- Show progress indicators ("3 of 4 reflections")
- Add CosmicLoader for generation wait time
- Redirect to detail pages after generation

**Phase 2: Detail Page Formatting (3-4 hours)**
- Evolution: Add markdown rendering with cosmic styles
- Visualization: Add immersive formatting (large text, gradients)
- Test readability on mobile

**Phase 3: Dashboard Integration (3-4 hours)**
- Rebuild EvolutionCard with real data (latest report preview)
- Create VisualizationCard with latest visualization preview
- Add usage limit displays

**Phase 4: Quick Actions & Polish (2-3 hours)**
- Add Reflect/Evolution/Visualize buttons to dream cards
- Add eligibility badges
- Test Sarah's journey Day 0-6

**Total Estimated Time:** 12-16 hours
**Priority:** HIGH

---

### 3. **Consider Split if Builder-2 Velocity is Slow**
**Rationale:** 12-16 hours may span 2 iterations if builder works 6-8 hours per iteration.

**Split Strategy:**
- **Iteration 20:** Dream detail integration + Evolution formatting (8-10 hours)
- **Iteration 21:** Visualization formatting + Dashboard cards (6-8 hours)

**Coordination:**
- Both sub-builders need Builder-1 migration complete
- Share eligibility check patterns (create reusable hook)

**Priority:** MEDIUM (evaluate after 8 hours of Builder-2 work)

---

### 4. **Disable Spiral/Synthesis Styles or Update Vision**
**Rationale:** Vision says "Achievement only" but code has 3 styles.

**Option A (Recommended):** Keep all 3 styles, update vision.md to reflect reality
**Option B:** Disable spiral/synthesis in visualization generation UI (comment out style options)

**Tasks:**
- If Option A: Update vision.md line 227-229 to say "3 styles available"
- If Option B: Hide spiral/synthesis cards in `/app/visualizations/page.tsx`

**Estimated Time:** 15 minutes
**Priority:** LOW (does not block core functionality)

---

### 5. **Fix Tier Limits Before Sarah's Journey Test**
**Rationale:** Vision says Free: 4 reflections/month, code says 1/month.

**Tasks:**
- Builder-1 updates `server/trpc/routers/reflections.ts` line 238 (TIER_LIMITS)
- Change Free tier reflections: 1 → 4
- Change Optimal tier reflections: 10 → 30
- Test reflection generation with Free tier user

**Estimated Time:** 30 minutes
**Priority:** HIGH (required for Sarah's journey validation)

---

### 6. **Test Sarah's Journey Day 0-6 After All UI Complete**
**Rationale:** Vision specifies this exact flow must work perfectly.

**Test Steps:**
1. Sign up as new user (Free tier)
2. Create dream: "Launch Sustainable Fashion Brand"
3. Complete 4 reflections over simulated days
4. See "✨ Evolution Report Available!" on dashboard
5. Click "Generate Evolution Report" → wait 45s → see report
6. Click "Generate Visualization" → wait 30s → see achievement narrative
7. Feel the "magic moment—she's hooked"

**Expected Outcome:**
- All buttons work
- Loading states are beautiful
- Reports feel "revelatory"
- Visualizations feel "immersive"
- No errors in console

**Estimated Time:** 1 hour (manual testing)
**Priority:** CRITICAL (defines MVP success)

## Resource Map

### Critical Files/Directories

#### Backend (Already Complete)
- `/server/trpc/routers/evolution.ts` - Evolution report generation (580 lines)
- `/server/trpc/routers/visualizations.ts` - Visualization generation (400 lines)
- `/server/lib/temporal-distribution.ts` - Context selection logic
- `/server/lib/cost-calculator.ts` - Token cost tracking

#### Frontend (Needs Work)
- `/app/dreams/[id]/page.tsx` - Dream detail (NEEDS: Generate buttons)
- `/app/evolution/[id]/page.tsx` - Evolution detail (NEEDS: Markdown rendering)
- `/app/visualizations/[id]/page.tsx` - Visualization detail (NEEDS: Immersive formatting)
- `/components/dashboard/cards/EvolutionCard.tsx` - Dashboard card (NEEDS: Rebuild)
- `/components/dashboard/cards/DreamsCard.tsx` - Dream cards (NEEDS: Quick actions)

#### Database
- `supabase/migrations/` - Migration directory (NEEDS: Fix usage_tracking)
- `supabase/functions/` - Database functions (Ready, waiting for schema fix)

#### Documentation
- `/home/ahiya/mirror-of-dreams/.2L/plan-3/vision.md` - Product vision
- `/home/ahiya/mirror-of-dreams/.2L/plan-3/iteration-19/building/current-state.md` - Technical state

### Key Dependencies

#### External
- `@anthropic-ai/sdk` - Already installed, working
- `react-markdown` - NEEDS: Install for evolution reports
- `framer-motion` - Already installed, use for visualization animations

#### Internal
- `trpc` - All routers ready, just need frontend calls
- `useAuth` hook - Already available for user tier checks
- `GlassCard`, `GlowButton`, `CosmicLoader` - UI components ready
- `GradientText` - Use for immersive visualization text

### Testing Infrastructure

#### Manual Testing Required
- **Evolution Report Generation:** Create dream → 4 reflections → generate → verify markdown
- **Visualization Generation:** Create dream → 4 reflections → generate → verify immersion
- **Tier Restrictions:** Test Free tier (blocked from evolution, 1 viz/month)
- **Usage Limits:** Generate 6 reports in month → verify limit reached
- **Sarah's Journey:** Full end-to-end test (Day 0-6)

#### Automated Testing (Out of MVP Scope)
- E2E tests with Playwright (deferred to post-MVP)
- Unit tests for eligibility logic (deferred)

## Questions for Planner

### 1. Should Builder-2 disable Spiral/Synthesis styles for MVP?
**Context:** Vision says "Achievement only" but code has 3 styles working.
**Options:**
- A) Keep all 3 styles, update vision (recommended)
- B) Disable spiral/synthesis in UI
**Impact:** Low priority, doesn't block core functionality

### 2. Should we add a "Visualization Preview Card" to dashboard?
**Context:** Evolution has EvolutionCard, but no equivalent for visualizations.
**Recommendation:** Yes, add VisualizationCard showing latest narrative preview
**Impact:** Medium priority, enhances dashboard cohesion

### 3. How important is markdown rendering quality?
**Context:** Evolution reports may have markdown (bold, headers) but could also just use plain text with whitespace.
**Options:**
- A) Full markdown rendering with custom components (3-4 hours)
- B) Simple whitespace-pre-wrap with manual bold/header detection (1-2 hours)
**Recommendation:** Option A (full markdown) for "revelatory" feel

### 4. Should Quick Actions on Dream Cards be in Iteration 20 or defer to Iteration 21?
**Context:** Dream cards currently just link to detail page. Adding Reflect/Evolution/Visualize buttons is nice-to-have.
**Recommendation:** Defer to Iteration 21 (polish phase) unless time permits
**Impact:** Low priority, vision doesn't explicitly require it

### 5. Do we need usage limit progress bars or just text display?
**Context:** Dashboard could show "2 of 6 reports used" as text or with visual progress bar.
**Recommendation:** Text only for MVP, progress bars in polish phase
**Impact:** Low priority, text is clear enough

---

**Report Complete**
**Explorer:** Explorer-2
**Focus Area:** Visualization UI & Dashboard Integration
**Date:** 2025-11-13
**Status:** Ready for Planner Review
