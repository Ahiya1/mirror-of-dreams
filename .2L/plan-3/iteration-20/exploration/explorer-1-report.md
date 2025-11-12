# Explorer-1 Report: Evolution Report UI & Integration Analysis

**Iteration:** 20 (Plan plan-3)  
**Date:** 2025-11-13  
**Focus:** Evolution Report UI, generation flow, and dashboard integration

---

## Executive Summary

The Evolution Report backend is **production-ready and comprehensive**. All core functionality exists: temporal distribution (1/3 early, 1/3 middle, 1/3 recent), tier-based context limits (Free: 4, Optimal: 9 reflections), extended thinking for Optimal/Premium tiers, monthly usage limits, and database storage. 

However, **the user-facing UI is incomplete**. Dream detail pages lack generation buttons, eligibility checking is missing, the EvolutionCard shows "Coming Soon" placeholder text, and there's no visualization of report previews. This iteration must bridge the frontend-backend gap to enable Sarah's Day 6 breakthrough moment.

**Key Finding:** Backend = 100% ready. Frontend = 30% ready. Gap = UI integration layer.

---

## Discoveries

### Evolution Backend Status (COMPLETE ✅)

**File:** `/server/trpc/routers/evolution.ts` (580 lines)

#### Available Endpoints

1. **`generateDreamEvolution`** (dream-specific reports)
   - Input: `{ dreamId: string }`
   - Threshold: >= 4 reflections on single dream
   - Returns: Evolution report ID, text, cost breakdown
   - Duration: ~45 seconds (with extended thinking for Optimal/Premium)

2. **`generateCrossDreamEvolution`** (cross-dream reports)
   - Input: None (analyzes all user's dreams)
   - Threshold: >= 12 total reflections across all dreams
   - Not available on Free tier
   - Returns: Cross-dream analysis with meta-patterns

3. **`list`** (paginated reports list)
   - Input: `{ page: number, limit: number, dreamId?: string }`
   - Returns: Paginated list with dream titles
   - Supports filtering by dream

4. **`get`** (single report retrieval)
   - Input: `{ id: string }`
   - Returns: Full report with dream metadata

5. **`checkEligibility`** (eligibility checking)
   - Input: None
   - Returns: `{ eligible: boolean, reason: string, threshold: number }`
   - **Note:** Current implementation checks if ANY dream has >= 4 reflections (global check)
   - **Gap:** Vision requires per-dream eligibility check on dream detail page

#### Temporal Distribution Logic

**File:** `/server/lib/temporal-distribution.ts`

- Divides reflections into 3 equal time periods (Early, Middle, Recent)
- Selects evenly-spaced reflections from each period
- Ensures reports capture full growth journey, not just recent activity
- Context limits by tier:
  - **Free:** 4 reflections (dream-specific only)
  - **Essential:** 6 reflections (dream-specific), 12 (cross-dream)
  - **Optimal:** 9 reflections (dream-specific), 21 (cross-dream)
  - **Premium:** 12 reflections (dream-specific), 30 (cross-dream)

#### Monthly Usage Limits (Vision Alignment)

**Database Function:** `check_evolution_limit(user_id, user_tier, report_type)`

| Tier | Dream-Specific Reports/Month | Cross-Dream Reports/Month |
|------|------------------------------|---------------------------|
| Free | 1 | 0 (not available) |
| Essential | 3 | 1 |
| Optimal | 6 | 3 |
| Premium | Unlimited | Unlimited |

**Status:** Database migration `20251112000000_fix_usage_tracking.sql` applied in Iteration 19. Usage tracking functional.

#### AI Generation Details

- **Model:** Claude Sonnet 4 (`claude-sonnet-4-5-20250929`)
- **Extended Thinking:** Enabled for Optimal/Premium tiers (10,000 token budget)
- **Max Tokens:** 4,000 output
- **Temperature:** 1.0
- **Prompt Style:** "Wise mentor who has witnessed entire journey" tone
- **Content Sections:**
  1. Relationship evolution with dream
  2. Key turning points and shifts
  3. Patterns in planning and obstacles
  4. Current position insights
  5. Gentle guidance for continuing

**Generation Time:** ~30-45 seconds (varies by extended thinking usage)

---

### Evolution UI Gaps (30% COMPLETE ⚠️)

#### Existing UI

**File:** `/app/evolution/page.tsx` (296 lines)

**What Works:**
- ✅ Evolution reports list page exists
- ✅ Dream selection UI with buttons for each active dream
- ✅ "Generate Dream Report" button with CosmicLoader during generation
- ✅ "Generate Cross-Dream Report" button
- ✅ Tier checking (Free tier shows upgrade prompt)
- ✅ Reports display in grid with previews
- ✅ Click to view full report

**What's Missing:**
- ❌ No integration from dream detail page (users must navigate to `/evolution` manually)
- ❌ No per-dream eligibility display ("You have 3 reflections, need 1 more")
- ❌ No quick action from dashboard cards
- ❌ Eligibility check shows global status, not per-dream status

**File:** `/app/evolution/[id]/page.tsx` (109 lines)

**What Works:**
- ✅ Report detail page exists
- ✅ Displays full evolution text (whitespace preserved)
- ✅ Shows metadata (reflection count, date, type)
- ✅ Back button to reports list

**What's Missing:**
- ❌ No markdown rendering (just plain text with `whitespace-pre-wrap`)
- ❌ No section headers or formatting
- ❌ No glass UI components (uses basic `bg-white/10` cards)
- ❌ No cosmic aesthetic (basic purple gradient background)

**Recommendation:** Replace basic styling with GlassCard components. Add markdown parser (react-markdown or similar) to render bold, italics, headers, lists.

---

### Dream Detail Page Integration (MISSING ❌)

**File:** `/app/dreams/[id]/page.tsx` (497 lines)

**Current State:**
- Shows dream header with status, days left, category
- Lists all reflections for dream (filtered client-side)
- "Reflect" button works
- Status change buttons work
- Delete button works

**Missing Features:**

1. **"Generate Evolution Report" Button**
   - Should appear when >= 4 reflections exist
   - Should check eligibility via `trpc.evolution.checkEligibility` (or create new per-dream endpoint)
   - Show eligibility status: "You have X reflections, need 4 to generate"
   - Disable button if monthly limit reached
   - Show CosmicLoader during 45s generation
   - Redirect to `/evolution/[reportId]` after generation

2. **"Generate Visualization" Button**
   - Similar to evolution button
   - Links to visualization generation flow
   - Same eligibility requirements (>= 4 reflections)

3. **Recent Reports Section**
   - List last 3 evolution reports for this dream
   - Preview first 200 characters
   - Link to full report
   - "View All Reports" link

4. **Quick Actions Bar**
   - Reflect (already exists)
   - Generate Evolution (new)
   - Generate Visualization (new)
   - Group in consistent UI pattern

**Estimated Complexity:** MEDIUM  
**Estimated Time:** 4-6 hours to add all missing features

---

### Dashboard EvolutionCard Integration (PLACEHOLDER ⚠️)

**File:** `/components/dashboard/cards/EvolutionCard.tsx` (283 lines)

**Current State:**
- Shows "Coming Soon" message
- Progress bar hardcoded to 0%
- "Generate Report" button disabled
- Fetches `trpc.evolution.checkEligibility` but doesn't display results

**What Needs to Be Built:**

1. **Replace "Coming Soon" with Actual Status**
   - If eligible: "You can generate an evolution report!"
   - If not eligible: "Create 1 more reflection to unlock" (dynamic count)
   - If Free tier: "Upgrade to Essential for evolution reports"

2. **Display Latest Report Preview**
   - Fetch latest report via `trpc.evolution.list.useQuery({ page: 1, limit: 1 })`
   - Show first 200 characters
   - Link to full report
   - "View All Reports" link

3. **Progress Visualization**
   - Show progress to next report (reflections count toward 4 threshold)
   - Update progress bar dynamically
   - Celebrate when threshold met

4. **Generate Button**
   - Enable when eligible
   - Link to `/evolution` page (or inline generation modal)
   - Show monthly limit status ("2/6 reports used this month")

**Estimated Complexity:** LOW  
**Estimated Time:** 2-3 hours

---

### Usage Tracking Display (PARTIAL ✅)

**File:** `/components/dashboard/cards/UsageCard.tsx`

**Current State:**
- ✅ Shows reflection usage with ProgressRing
- ✅ Displays tier badge
- ✅ Animated counters for smooth transitions
- ✅ Color-coded status (primary, warning, success, error)

**Missing:**
- ❌ No evolution reports usage display
- ❌ No visualizations usage display
- ❌ Only shows "Reflections: X/Y" but not other monthly limits

**Vision Requirements (from vision.md):**

```
Plan & Limits Section:
- Current tier (Free/Optimal)
- This month's usage:
  - Reflections: X / Y
  - Evolution reports: X / Y
  - Visualizations: X / Y
- Progress bars showing usage
- Upgrade button if on Free tier
```

**What Needs to Be Built:**
1. Add evolution reports usage row
2. Add visualizations usage row
3. Show 3 progress bars (reflections, evolution, visualizations)
4. Query `trpc.evolution.list` and `trpc.visualizations.list` to get current month counts
5. Compare against tier limits

**Estimated Complexity:** MEDIUM  
**Estimated Time:** 3-4 hours (requires new queries for counting current month usage)

---

## Patterns Identified

### Backend-First Development Pattern

**Description:** Evolution backend was fully built before frontend UI, creating a complete API surface but leaving UX gaps.

**Use Case:** When backend logic is complex (temporal distribution, AI generation, usage tracking) and frontend is simpler (buttons, forms, displays).

**Example:**
```typescript
// Backend ready:
const report = await trpc.evolution.generateDreamEvolution.mutate({ dreamId });

// Frontend needs:
<GlowButton onClick={() => generate({ dreamId })}>
  Generate Evolution Report
</GlowButton>
```

**Recommendation:** This pattern is GOOD for this project. Backend complexity justified early implementation. Now frontend can catch up quickly.

---

### Temporal Distribution for Context Selection

**Description:** Instead of using most recent reflections, select evenly across entire timeline (Early, Middle, Recent periods).

**Use Case:** Evolution reports that show growth over time, not just current state.

**Example:**
```typescript
// Timeline: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
// Context limit: 6 reflections

// Without temporal distribution:
// Selected: [R4, R5, R6, R7, R8, R9] (only recent)

// With temporal distribution:
// Early: [R1, R2, R3] → Select R1, R3
// Middle: [R4, R5, R6] → Select R4, R6
// Recent: [R7, R8, R9] → Select R7, R8
// Selected: [R1, R3, R4, R6, R7, R8] (full journey)
```

**Recommendation:** Brilliant algorithm. Shows authentic growth trajectory. Keep as-is.

---

### Tier-Based Extended Thinking

**Description:** Optimal/Premium tiers get AI extended thinking (10,000 token budget) for deeper analysis. Free/Essential get standard generation.

**Use Case:** Premium feature differentiation without changing model or output length limits.

**Example:**
```typescript
const thinkingBudget = getThinkingBudget(userTier);
// Free/Essential: 0 tokens
// Optimal/Premium: 10,000 tokens

if (thinkingBudget > 0) {
  requestConfig.thinking = {
    type: 'enabled',
    budget_tokens: thinkingBudget,
  };
}
```

**Recommendation:** Good differentiation strategy. Extended thinking produces noticeably better insights without changing user-visible output format.

---

## Complexity Assessment

### High Complexity Areas

#### Evolution Report Display Formatting
**Complexity Drivers:**
- Markdown rendering for bold, italics, headers
- Preserving paragraph breaks and whitespace
- Glass UI aesthetic integration
- Responsive text sizing
- Section navigation (if reports are long)

**Estimated Builder Splits Needed:** 1 (manageable for single builder)

**Why Not Split:** Markdown rendering is well-supported (react-markdown library). Glass UI components already exist. Straightforward integration task.

**Builder Tasks:**
1. Install react-markdown and remark-gfm
2. Replace `whitespace-pre-wrap` div with ReactMarkdown component
3. Style markdown elements with cosmic theme (h1/h2/h3 colors, list styles, etc.)
4. Test with actual evolution reports (generate one to see real output)

---

#### Dream Detail Page Evolution Integration
**Complexity Drivers:**
- Per-dream eligibility checking (not global)
- Monthly limit display ("X/Y reports used")
- Loading states during 45s generation
- Error handling (limit reached, insufficient reflections)
- Recent reports section
- UI layout reorganization (add new sections)

**Estimated Builder Splits Needed:** 1 (moderate task, not worth splitting)

**Why Not Split:** Single page with cohesive feature set. All changes in same file. Query logic straightforward.

**Builder Tasks:**
1. Add eligibility check query (per-dream)
2. Build "Generate Evolution" button with eligibility status
3. Add CosmicLoader during generation
4. Build "Recent Reports" section
5. Add "Generate Visualization" button (similar to evolution)
6. Refactor layout to accommodate new sections

---

### Medium Complexity Areas

#### EvolutionCard Dashboard Integration
**Complexity:** Latest report preview, progress tracking, dynamic eligibility messaging

**Why Medium:** Requires querying latest report, calculating progress, handling multiple states (eligible, not eligible, Free tier, limit reached).

**Builder Tasks:**
1. Query latest report via `trpc.evolution.list({ page: 1, limit: 1 })`
2. Replace "Coming Soon" with dynamic status
3. Build report preview card
4. Update progress bar with actual reflection count
5. Enable/disable button based on eligibility

---

#### Usage Tracking Expansion (Multi-Metric)
**Complexity:** Display 3 usage types (reflections, evolution, visualizations) with progress bars

**Why Medium:** Requires counting current month usage for evolution/visualizations. Need to query reports/visualizations tables with date filtering.

**Builder Tasks:**
1. Create query to count current month evolution reports
2. Create query to count current month visualizations
3. Add 3 progress bars (reflections, evolution, visualizations)
4. Display tier limits for each metric
5. Color-code based on usage percentage

---

### Low Complexity Areas

#### Markdown Rendering in Evolution Report Page
**Complexity:** Library integration, styling

**Why Low:** react-markdown handles parsing. Just need CSS for cosmic theme.

**Builder Tasks:**
1. `npm install react-markdown remark-gfm`
2. Replace div with `<ReactMarkdown>` component
3. Add custom styles for h1/h2/h3, lists, bold, italics

---

## Technology Recommendations

### Primary Stack (ALREADY ESTABLISHED ✅)

**Framework:** Next.js 14 (App Router)
- Reason: Server components reduce bundle size, tRPC integration is mature, already in use

**API Layer:** tRPC
- Reason: Type-safe RPC, no OpenAPI overhead, excellent DX, already comprehensive

**Database:** Supabase PostgreSQL
- Reason: RLS policies enabled, database functions working, migrations applied

**AI:** Anthropic Claude Sonnet 4
- Reason: Extended thinking support, high-quality outputs, cost tracking implemented

**UI Components:** Custom Glass System
- Reason: GlassCard, GlowButton, CosmicLoader, GradientText already exist and are beautiful

---

### Supporting Libraries

#### react-markdown
**Purpose:** Render evolution report markdown with bold, italics, headers  
**Why Needed:** AI generates markdown-formatted reports. Need to parse and style.  
**Installation:** `npm install react-markdown remark-gfm`  
**Complexity:** LOW (drop-in replacement for div)

**Example:**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  className="prose prose-invert prose-purple"
>
  {report.evolution}
</ReactMarkdown>
```

---

#### date-fns (ALREADY INSTALLED ✅)
**Purpose:** Date formatting, month calculations for usage tracking  
**Why Needed:** Monthly usage resets, current month comparisons  
**Already Used:** Yes, in various components

---

## Integration Points

### Dashboard → Evolution
**Current State:** Dashboard EvolutionCard shows "Coming Soon"  
**Target State:** Card shows eligibility, latest report preview, generate button

**Integration Steps:**
1. EvolutionCard queries `trpc.evolution.checkEligibility`
2. If eligible, show "Generate Report" button (enabled)
3. Query `trpc.evolution.list({ page: 1, limit: 1 })` for latest report
4. Display preview with link to full report
5. Show progress toward next report threshold

**Data Flow:**
```
Dashboard Page
  └─> EvolutionCard Component
       ├─> trpc.evolution.checkEligibility.useQuery()
       ├─> trpc.evolution.list.useQuery({ page: 1, limit: 1 })
       └─> Display: Eligibility + Latest Report + Generate Button
```

---

### Dream Detail → Evolution Generation
**Current State:** No evolution buttons on dream detail page  
**Target State:** "Generate Evolution Report" button appears when >= 4 reflections

**Integration Steps:**
1. Dream detail page queries `trpc.reflections.list({ dreamId })`
2. Count reflections for this dream
3. If count >= 4, show "Generate Evolution Report" button
4. On click, call `trpc.evolution.generateDreamEvolution.mutate({ dreamId })`
5. Show CosmicLoader during 45s generation
6. On success, redirect to `/evolution/[reportId]`

**Data Flow:**
```
Dream Detail Page
  ├─> trpc.reflections.list.useQuery({ dreamId })
  ├─> Calculate: reflectionCount >= 4 ? (eligible) : (not eligible)
  └─> If eligible:
       └─> GlowButton onClick: generateDreamEvolution.mutate({ dreamId })
            └─> Redirect: router.push(`/evolution/${reportId}`)
```

---

### Evolution List → Report Detail
**Current State:** Works perfectly ✅  
**No Changes Needed:** Grid of reports with click-to-view functionality already implemented

---

### Usage Card → Usage Metrics
**Current State:** Shows reflections only  
**Target State:** Shows reflections, evolution reports, visualizations (3 progress bars)

**Integration Steps:**
1. Query `trpc.evolution.list` with current month filter
2. Query `trpc.visualizations.list` with current month filter
3. Count results for current month
4. Display 3 progress bars with tier limits
5. Color-code based on usage percentage

**Data Flow:**
```
UsageCard Component
  ├─> trpc.reflections.checkUsage.useQuery()
  ├─> trpc.evolution.list.useQuery({ page: 1, limit: 100 })  // Get all current month
  ├─> trpc.visualizations.list.useQuery({ page: 1, limit: 100 })
  └─> Calculate:
       ├─> Reflections: currentCount / limit
       ├─> Evolution: currentMonthReports / tierLimit
       └─> Visualizations: currentMonthViz / tierLimit
```

**Note:** Counting current month requires date filtering. Backend `list` endpoints support pagination but not date filtering. Options:
1. Client-side filter: Fetch all, filter by `created_at >= firstDayOfMonth`
2. Backend enhancement: Add `month` parameter to list endpoints (cleaner, recommended)

---

## Risks & Challenges

### Technical Risks

#### Risk: Evolution Report Generation Timeout
**Impact:** 45-second AI generation might timeout in some hosting environments (Vercel free tier has 10s timeout)

**Mitigation Strategy:**
1. Already using 60-second timeout in tRPC router (configured)
2. Vercel Pro plan supports 60s serverless function timeout
3. CosmicLoader provides visual feedback during wait
4. Consider background job queue (Inngest, QStash) for future scaling

**Likelihood:** LOW (60s timeout configured, Pro plan available)

---

#### Risk: Markdown Rendering XSS Vulnerabilities
**Impact:** If evolution reports contain malicious markdown, could execute XSS attacks

**Mitigation Strategy:**
1. Use react-markdown with default sanitization enabled
2. AI generates content (trusted source, not user input)
3. No user-editable markdown fields in evolution reports
4. Test with edge cases (markdown with HTML, scripts, etc.)

**Likelihood:** LOW (AI-generated content, library handles sanitization)

---

#### Risk: Per-Dream Eligibility Check Performance
**Impact:** Dream detail page might be slow if checking eligibility for every dream individually

**Mitigation Strategy:**
1. Use TanStack Query caching (already enabled)
2. Check eligibility only on dream detail page (not list page)
3. Batch eligibility checks if needed (future optimization)
4. Consider adding `reflectionCount` to dream record (denormalized, faster)

**Likelihood:** LOW (single query, cached, acceptable latency)

---

### Complexity Risks

#### Risk: Builder Might Split Dream Detail Page Task
**Likelihood:** LOW  
**Why:** All changes in single file, cohesive feature set, clear requirements

**If Split Occurs:**
- Sub-builder A: Evolution button + eligibility checking
- Sub-builder B: Recent reports section
- Sub-builder C: Visualization button (parallel to evolution)

**Recommendation:** Avoid split. Single builder can complete in 4-6 hours.

---

#### Risk: Markdown Styling Inconsistencies
**Likelihood:** MEDIUM  
**Why:** AI-generated markdown structure varies (some reports have headers, some don't)

**Mitigation:**
1. Test with multiple generated reports
2. Style all possible markdown elements (h1, h2, h3, ul, ol, bold, italics, code blocks)
3. Use Tailwind Typography plugin (prose classes) for consistent baseline
4. Override specific elements for cosmic aesthetic

---

## Recommendations for Planner

### 1. Prioritize Dream Detail Page Integration (HIGH PRIORITY)
**Rationale:** This is the primary user flow for Sarah's Day 6 breakthrough. Without evolution buttons on dream pages, users must manually navigate to `/evolution` and select dream from dropdown (friction).

**Tasks:**
- Add "Generate Evolution Report" button with eligibility checking
- Add "Generate Visualization" button (similar logic)
- Display recent reports for this dream
- Show eligibility status ("2 more reflections needed")

**Estimated Time:** 4-6 hours  
**Complexity:** MEDIUM  
**Single Builder:** Yes

---

### 2. Enhance EvolutionCard with Real Data (MEDIUM PRIORITY)
**Rationale:** Dashboard is central hub. EvolutionCard currently shows placeholder "Coming Soon" text, reducing discoverability.

**Tasks:**
- Replace placeholder with dynamic eligibility status
- Display latest report preview (first 200 chars)
- Enable "Generate Report" button when eligible
- Show progress toward next report threshold

**Estimated Time:** 2-3 hours  
**Complexity:** LOW  
**Single Builder:** Yes

---

### 3. Add Markdown Rendering to Report Display (MEDIUM PRIORITY)
**Rationale:** Evolution reports currently display as plain text. AI generates markdown with bold, italics, headers. Rendering improves readability and visual hierarchy.

**Tasks:**
- Install react-markdown + remark-gfm
- Replace `whitespace-pre-wrap` div with ReactMarkdown component
- Style markdown elements with cosmic theme (h1/h2/h3, lists, bold, italics)
- Test with actual generated reports

**Estimated Time:** 2 hours  
**Complexity:** LOW  
**Single Builder:** Yes

---

### 4. Expand UsageCard to Show All Metrics (LOW PRIORITY)
**Rationale:** Vision.md specifies "This month's usage: Reflections X/Y, Evolution reports X/Y, Visualizations X/Y". Currently only shows reflections. Nice-to-have for full vision compliance, but not blocking Sarah's journey.

**Tasks:**
- Query current month evolution reports count
- Query current month visualizations count
- Display 3 progress bars (reflections, evolution, visualizations)
- Show tier limits for each metric

**Estimated Time:** 3-4 hours  
**Complexity:** MEDIUM (requires date filtering logic)  
**Single Builder:** Yes

**Note:** Consider deferring to Iteration 21 if time-constrained.

---

### 5. Test End-to-End User Flow (CRITICAL)
**Rationale:** After UI changes, must validate Sarah's Day 6 journey works perfectly.

**Test Steps:**
1. Create dream
2. Create 4 reflections on that dream
3. Navigate to dream detail page
4. See "Generate Evolution Report" button appear
5. Click button, wait ~45 seconds
6. See evolution report with formatted markdown
7. Dashboard EvolutionCard shows latest report preview
8. Verify usage counters increment correctly

**Estimated Time:** 1-2 hours  
**Complexity:** LOW (manual testing)

---

## Resource Map

### Critical Files/Directories

#### Backend (Evolution)
- `/server/trpc/routers/evolution.ts` - Evolution router with all generation logic (580 lines)
- `/server/lib/temporal-distribution.ts` - Temporal distribution algorithm (130 lines)
- `/server/lib/cost-calculator.ts` - Token cost calculation and thinking budget

#### Frontend (Evolution)
- `/app/evolution/page.tsx` - Evolution reports list with generation controls (296 lines)
- `/app/evolution/[id]/page.tsx` - Evolution report detail display (109 lines)
- `/components/dashboard/cards/EvolutionCard.tsx` - Dashboard card (283 lines, needs update)

#### Frontend (Dreams)
- `/app/dreams/[id]/page.tsx` - Dream detail page (497 lines, needs evolution integration)

#### Frontend (Usage)
- `/components/dashboard/cards/UsageCard.tsx` - Usage tracking card (needs expansion)

#### UI Components (Glass System)
- `/components/ui/glass/GlassCard.tsx` - Base card component
- `/components/ui/glass/GlowButton.tsx` - Button component
- `/components/ui/glass/CosmicLoader.tsx` - Loading state component
- `/components/ui/glass/GradientText.tsx` - Text with gradient effect

#### Database
- `/supabase/migrations/20251112000000_fix_usage_tracking.sql` - Fixed schema (applied)
- `/supabase/migrations/20251022210000_add_evolution_visualizations.sql` - Evolution tables

---

### Key Dependencies

#### AI Generation
- `@anthropic-ai/sdk` - Claude API client (already installed)
- Extended thinking support (10k token budget for Optimal/Premium)

#### UI Rendering
- `react-markdown` - Markdown parser (NOT installed, needs addition)
- `remark-gfm` - GitHub Flavored Markdown support (NOT installed, needs addition)

#### State Management
- `@tanstack/react-query` - tRPC data fetching and caching (already installed)

#### Styling
- Tailwind CSS - Utility classes (already configured)
- Custom CSS modules - Component-specific styles (already in use)

---

### Testing Infrastructure

#### Manual Testing Checklist (for Builder)
1. Generate evolution report with 4 reflections
2. Verify report displays with markdown formatting
3. Check eligibility display on dream detail page
4. Test loading state (45s generation)
5. Verify usage counter increments
6. Test tier limit enforcement (Free: 1/month, Optimal: 6/month)
7. Test dashboard EvolutionCard preview
8. Verify temporal distribution (check AI prompt context includes early/middle/recent)

#### Automated Testing (Deferred to Post-MVP)
- Unit tests for temporal distribution algorithm
- Integration tests for evolution generation flow
- E2E tests for Sarah's journey (Playwright)

---

## Questions for Planner

### 1. Should We Add Per-Dream Eligibility Endpoint?
**Context:** Current `checkEligibility` endpoint returns global status (any dream with >= 4 reflections). Dream detail page needs per-dream status.

**Options:**
- A) Add `dreamId` parameter to `checkEligibility` endpoint
- B) Calculate eligibility client-side (count reflections on dream detail page)
- C) Add new endpoint `checkDreamEligibility({ dreamId })`

**Recommendation:** Option B (client-side calculation) - Simpler, no backend changes needed. Just count reflections already fetched on dream detail page.

---

### 2. Should UsageCard Show All Metrics in Iteration 20?
**Context:** Vision specifies 3 usage metrics (reflections, evolution, visualizations). Currently shows reflections only. Adding all 3 requires date filtering logic.

**Options:**
- A) Add all 3 metrics in Iteration 20 (full vision compliance)
- B) Defer to Iteration 21 (focus on generation flow first)
- C) Add evolution only, defer visualizations to Iteration 21

**Recommendation:** Option B (defer to Iteration 21) - Evolution generation flow is higher priority. Usage expansion can come after core journey works.

---

### 3. Should We Add Backend Date Filtering for Usage Queries?
**Context:** Counting current month reports requires filtering by `created_at >= firstDayOfMonth`. Options are client-side filter or backend enhancement.

**Options:**
- A) Client-side filter (fetch all, filter in frontend)
- B) Add `month` parameter to `evolution.list` and `visualizations.list` endpoints
- C) Create dedicated `getCurrentMonthStats` endpoint

**Recommendation:** Option A for Iteration 20 (client-side filter) - Faster implementation. Option B for Iteration 21 (backend optimization) - Cleaner long-term solution.

---

### 4. Should Dream Detail Page Include Visualization Button?
**Context:** Vision specifies visualizations should be accessible from dream pages. Similar to evolution button, but links to visualization generation flow.

**Options:**
- A) Add in Iteration 20 (complete dream detail integration)
- B) Defer to Iteration 21 when building visualization UI
- C) Add placeholder button (disabled) with "Coming Soon" tooltip

**Recommendation:** Option B (defer to Iteration 21) - Visualization UI is separate task. Focus Iteration 20 on evolution reports only. Add visualization button when visualization UI is built.

---

## Appendices

### A. Evolution Report Example Output (from AI)

```markdown
# Your Journey with "Launch Sustainable Fashion Brand"

Over the past few months, I've witnessed a profound shift in how you relate to this dream. Let me show you what I see.

## The Early Days: From Desire to Decision

When you first began reflecting, your language was tentative. "I want to create..." appeared frequently. There was excitement, yes, but also a distance—as if the dream belonged to someone else, someone you aspired to become.

Notice this: **"I want to start a sustainable fashion brand."** The verb "want" places the dream in the future, something to be obtained.

## The Middle Period: Wrestling with Reality

Around reflection 3, something changed. You started naming obstacles directly: supply chain complexity, lack of industry connections, imposter syndrome. But here's what's remarkable—you didn't shrink from these. Instead, you **engaged** with them.

Your relationship with fear evolved from avoidance to curiosity. "What am I afraid of?" became a question you asked yourself repeatedly. And you answered honestly.

## The Recent Shift: Ownership Emerging

In your most recent reflections, the language shifted again: "I am building..." "I have researched..." "My brand will..."

Do you see it? The dream moved from future-tense possibility to present-tense reality. You're no longer preparing to create—**you're creating**.

## What This Reveals

Your journey shows a common pattern in consciousness transformation: the shift from _wishing_ to _willing_ to _doing_. You've moved through all three stages in remarkable time.

The obstacles you named early on—they haven't disappeared. But your relationship to them has changed. You now see them as part of the path, not barriers to it.

## What Comes Next

You've crossed a threshold. The question is no longer "Should I?" but "How do I?". Trust that shift. It's real.

Keep reflecting. Keep naming what's true. The path reveals itself to those who walk it.
```

**Analysis:** 
- Uses bold for emphasis
- Section headers (##) for structure
- Italics for subtle emphasis
- Narrative arc (Early → Middle → Recent)
- Specific quotes from user's reflections
- Personal, not generic insights

**UI Requirement:** Must render markdown to preserve formatting. Otherwise, text loses visual hierarchy and impact.

---

### B. Temporal Distribution Example

**Scenario:** User has 9 reflections on a dream. Free tier (context limit: 4).

**Timeline:**
```
R1: Jan 5
R2: Jan 12
R3: Jan 20
R4: Feb 3
R5: Feb 15
R6: Feb 28
R7: Mar 10
R8: Mar 25
R9: Apr 2
```

**Periods:**
- Early (Jan 5 - Feb 3): [R1, R2, R3, R4]
- Middle (Feb 15 - Feb 28): [R5, R6]
- Recent (Mar 10 - Apr 2): [R7, R8, R9]

**Distribution:**
- Early period: Select 1 (floor(4/3) = 1)
- Middle period: Select 1
- Recent period: Select 2 (1 + remainder)

**Selected Reflections:** [R1, R5, R8, R9]

**Why This Works:**
- Captures first reflection (origin story)
- Captures middle shift (February change)
- Captures recent state (March-April progress)
- Shows full arc, not just current snapshot

---

### C. Tier Comparison Table (Evolution Reports)

| Feature | Free | Essential | Optimal | Premium |
|---------|------|-----------|---------|---------|
| Dream-Specific Reports | 1/month | 3/month | 6/month | Unlimited |
| Cross-Dream Reports | Not available | 1/month | 3/month | Unlimited |
| Context (reflections analyzed) | 4 | 6 | 9 | 12 |
| Extended Thinking | No | No | Yes (10k tokens) | Yes (10k tokens) |
| Report Quality | Standard | Standard | Deep insights | Deep insights |
| Generation Time | ~30s | ~30s | ~45s | ~45s |

**Key Differentiators:**
1. **Free → Essential:** Access to cross-dream reports, more monthly reports
2. **Essential → Optimal:** Extended thinking (deeper insights), more context (9 vs 6 reflections)
3. **Optimal → Premium:** Unlimited generation (no monthly caps)

---

**End of Report**

---

**Deliverables for Builder:**
1. Add "Generate Evolution Report" button to dream detail page
2. Check eligibility (>= 4 reflections) and display status
3. Integrate CosmicLoader during 45s generation
4. Add markdown rendering to `/evolution/[id]` page
5. Update EvolutionCard with real data (eligibility, latest report preview)
6. Test Sarah's Day 6 journey end-to-end

**Success Criteria:**
- User with 4 reflections sees "Generate Evolution Report" button
- Button triggers generation with visual feedback
- Report displays with formatted markdown (bold, headers, italics)
- Dashboard EvolutionCard shows latest report preview
- Usage counter increments after generation
- Monthly limit enforced (Free: 1, Optimal: 6)

**Estimated Total Time:** 12-16 hours for complete integration
