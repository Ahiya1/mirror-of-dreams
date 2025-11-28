# Builder Task Breakdown

## Overview

4 primary builders will work in parallel on isolated file sets.
No builders require splitting - all tasks are MEDIUM complexity or lower.

**Execution Strategy:**
- Builders work independently on separate files
- Minimal integration conflicts (no shared files)
- Sequential testing: Builder-1 → Builder-2 → Builder-3 → Builder-4

---

## Builder-1: Navigation & Layout Foundation

### Scope
Fix the CSS variable system, demo banner positioning, z-index stacking, and page padding across all authenticated pages to eliminate navigation/content overlap issues.

### Complexity Estimate
**MEDIUM**

No split needed - straightforward CSS variable additions and consistent pattern application.

### Success Criteria
- [ ] `--demo-banner-height: 44px` defined in variables.css
- [ ] `--total-header-height` calculated variable added
- [ ] `--z-demo-banner: 110` added to z-index system
- [ ] `.pt-nav` utility class updated to account for demo banner height
- [ ] DemoBanner component positioned `fixed top-0` with z-[110]
- [ ] All 10 authenticated pages have proper padding (no content hidden behind nav/banner)
- [ ] Tested with demo user on all pages - no overlap visible

### Files to Create
None (all modifications to existing files)

### Files to Modify

1. **`src/styles/variables.css`**
   - Line 321 (after `--nav-height`): Add `--demo-banner-height: 44px;`
   - Line 322: Add `--total-header-height: calc(var(--nav-height) + var(--demo-banner-height));`
   - Line 192 (after `--z-navigation: 100`): Add `--z-demo-banner: 110;`

2. **`styles/globals.css`**
   - Line 655: Update `.pt-nav` to:
     ```css
     .pt-nav {
       padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));
     }
     ```

3. **`components/shared/DemoBanner.tsx`**
   - Line 25: Change class from `relative z-50` to `fixed top-0 left-0 right-0 z-[110]`

4. **`app/dashboard/page.tsx`**
   - Line 165: Change `padding-top: var(--nav-height);` to `padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));`

5. **`app/profile/page.tsx`**
   - Line 216: Change `pt-[var(--nav-height)]` to `pt-nav`

6. **`app/settings/page.tsx`**
   - Line 96: Change `pt-[var(--nav-height)]` to `pt-nav`

7. **`app/dreams/[id]/page.tsx`**
   - Line 386: Change `padding-top: 80px;` to `padding-top: calc(var(--nav-height) + var(--demo-banner-height, 0px));`

### Dependencies
**Depends on:** None (foundation layer)
**Blocks:** None (other builders work independently)

### Implementation Notes

**Critical CSS Variable Order:**
- Add variables in correct location (after related variables)
- Use exact values: `44px` for banner height (measured from py-3 padding)
- Fallback value `0px` ensures non-demo users get zero extra padding

**Z-Index Hierarchy:**
- Demo banner (110) MUST be above navigation (100)
- This fixes visual overlap where banner appeared behind nav

**Testing Checklist:**
Test all 10 pages with demo user (alex.chen.demo@example.com):
1. /dashboard
2. /dreams
3. /dreams/[id] (any dream)
4. /reflections
5. /evolution
6. /evolution/[id] (if available)
7. /visualizations
8. /visualizations/[id] (if available)
9. /profile
10. /settings

**Verification:**
- Demo banner visible at very top of viewport
- Navigation visible below demo banner
- Page content starts below navigation
- No content cut off or hidden
- Mobile responsive (test viewport < 768px)

### Patterns to Follow

Reference `patterns.md`:
- CSS Variable Patterns → Defining CSS Variables
- CSS Variable Patterns → Consuming CSS Variables (Utility Class Pattern)
- Page Layout Patterns → Authenticated Page Layout
- Page Layout Patterns → Conditional Demo Banner Positioning

### Testing Requirements
- Manual testing on all 10 pages
- Visual verification: No content overlap
- Responsive testing: Mobile, tablet, desktop
- Demo user vs. regular user (banner only shows for demo)

---

## Builder-2: Dashboard Animation & Layout

### Scope
Fix the triple animation conflict causing empty dashboard by removing competing animation systems, enhancing useStaggerAnimation hook with fallback timeout, and fixing grid layout to accommodate 6 cards.

### Complexity Estimate
**MEDIUM-HIGH**

No split needed - focused fixes to animation system and grid layout.

### Success Criteria
- [ ] useStaggerAnimation hook has 2-second fallback timeout
- [ ] IntersectionObserver threshold lowered to 0.01 (from 0.1)
- [ ] IntersectionObserver rootMargin increased to 100px (from 50px)
- [ ] DashboardCard animation system removed (non-functional code deleted)
- [ ] CSS grid item animations removed (conflicting with inline styles)
- [ ] DashboardGrid redundant useStaggerAnimation removed
- [ ] Grid layout changed from 2x2 to 3x2 (repeat(3, auto) rows)
- [ ] Dashboard displays all 7 sections visibly within 500ms for demo user
- [ ] Stagger animation plays smoothly with 150ms delays

### Files to Modify

1. **`hooks/useStaggerAnimation.ts`**
   - Lines 32-62: Replace entire useEffect with enhanced version (see patterns.md)
   - Add fallback timer (2 seconds)
   - Change threshold: 0.1 → 0.01
   - Change rootMargin: 50px → 100px
   - Add console.warn for fallback trigger

2. **`components/dashboard/shared/DashboardCard.tsx`**
   - Lines 36-52: DELETE entire animation logic block
   - Line 102: REMOVE `dashboard-card--visible` class logic
   - Lines 120-121: REMOVE animationDelay style

3. **`styles/dashboard.css`**
   - Lines 556-575: REPLACE `.dashboard-grid__item` block:
     ```css
     .dashboard-grid__item {
       position: relative;
       min-height: 280px;
       /* Animation handled by useStaggerAnimation hook via inline styles */
     }
     ```

4. **`components/dashboard/shared/DashboardGrid.tsx`**
   - Lines 22-27: DELETE unused useStaggerAnimation hook
   - Line 30: Remove containerRef from div

5. **`components/dashboard/shared/DashboardGrid.module.css`**
   - Line 4: Change `grid-template-rows: repeat(2, 1fr);` to `grid-template-rows: repeat(3, auto);`

### Dependencies
**Depends on:** None
**Blocks:** None

### Implementation Notes

**Animation System Cleanup:**
- THREE animation systems were fighting (useStaggerAnimation + DashboardCard + CSS)
- We're keeping ONLY useStaggerAnimation with enhancements
- Inline styles from useStaggerAnimation override CSS (this is correct)

**Fallback Timer Rationale:**
- IntersectionObserver may not trigger if dashboard is already in viewport on load
- 2-second timeout ensures content becomes visible even if observer fails
- Console.warn helps debug if fallback is needed

**Grid Layout Fix:**
- Current: 2 rows × 2 columns = 4 slots, but 6 cards trying to render
- Fixed: 3 rows × 2 columns = 6 slots (exact fit)
- `auto` height allows rows to size based on content

**Testing Dashboard:**
1. Clear browser cache
2. Log in as demo user
3. Navigate to /dashboard
4. Verify all sections appear within 500ms:
   - DashboardHero (greeting)
   - DreamsCard (5 dreams)
   - ReflectionsCard (3 recent)
   - ProgressStatsCard (15 reflections total)
   - EvolutionCard (preview after Builder-3 runs)
   - VisualizationCard (preview after Builder-3 runs)
   - SubscriptionCard (premium tier)

### Patterns to Follow

Reference `patterns.md`:
- Animation Patterns → Stagger Animation Hook (full implementation)
- Animation Patterns → DO NOT: Multiple Animation Systems (anti-pattern to avoid)
- Grid Layout Patterns → Flexible Grid Layout

### Testing Requirements
- Dashboard loads with all content visible < 500ms
- Stagger animation plays (items appear sequentially)
- No empty void below navigation
- Mobile responsive (single column grid)
- Test with slow network (throttle to 3G in DevTools)

---

## Builder-3: Demo Data Generation

### Scope
Extend seed-demo-user.ts script to generate 1 evolution report and 1 visualization for the "Launch My SaaS Product" dream, using Claude Sonnet 4.5 to create authentic, high-quality demo content.

### Complexity Estimate
**MEDIUM-HIGH**

No split needed - self-contained script enhancements with AI generation.

### Success Criteria
- [ ] `generateEvolutionReport()` function created in seed script
- [ ] `generateVisualization()` function created in seed script
- [ ] 1 evolution report generated for "Launch My SaaS Product" dream (4 reflections)
- [ ] Evolution report uses `analysis` column (NOT `evolution`)
- [ ] Evolution report 800-1200 words analyzing temporal journey
- [ ] 1 visualization generated with 'achievement' style
- [ ] Visualization 400-600 words using mountain climbing metaphor
- [ ] Both insert successfully into database with proper foreign keys
- [ ] Demo user can view evolution report at /evolution
- [ ] Demo user can view visualization at /visualizations
- [ ] Dashboard evolution/visualization preview cards show content

### Files to Modify

1. **`scripts/seed-demo-user.ts`**
   - After line 359 (end of generateAIResponse): Add `generateEvolutionReport()` function
   - After that: Add `generateVisualization()` function
   - Lines 384-390: After deleting old data, add creation of new evolution/visualization
   - After line 497 (reflection generation loop): Add evolution/visualization generation

### Implementation Notes

**Critical Schema Decision:**
- Migration defines column as `analysis` TEXT NOT NULL
- Router code incorrectly uses `evolution` column (this is a BUG in router, not seed script)
- Seed script MUST use `analysis` to match actual database schema

**Content Generation Approach:**
1. Fetch all reflections for "Launch My SaaS Product" dream
2. Call generateEvolutionReport() with dream + 4 reflections
3. Claude analyzes temporal evolution (fear → confidence transformation)
4. Insert into evolution_reports table with metadata
5. Call generateVisualization() with same dream + reflections
6. Claude creates achievement-style narrative (mountain climbing metaphor)
7. Insert into visualizations table with metadata

**Required Metadata:**
- `time_period_start`: Earliest reflection created_at
- `time_period_end`: Latest reflection created_at
- `reflection_count`: 4
- `reflections_analyzed`: Array of 4 reflection UUIDs
- `report_type`: 'premium' (demo user is premium tier)
- `report_category`: 'dream-specific'
- `patterns_detected`: ['fear-to-confidence', 'scope-management', 'technical-growth']
- `growth_score`: 78 (1-100 scale)

**Claude Configuration:**
- Model: claude-sonnet-4-5-20250929
- Extended thinking: 5000 token budget
- Temperature: 1 (creative narratives)
- Max tokens: 4000 (evolution), 3000 (visualization)

**Console Logging:**
```typescript
console.log('🎯 Generating evolution report for "Launch My SaaS Product"...');
console.log('✅ Evolution report created (ID: xyz)');
console.log('🎯 Generating visualization...');
console.log('✅ Visualization created (ID: xyz)');
```

**Testing After Seed:**
```bash
# Run seed script
npx tsx scripts/seed-demo-user.ts

# Verify creation
npx tsx scripts/verify-demo.ts

# Expected output:
# Evolution Reports: 1
# Visualizations: 1

# Manual verification
# 1. Log in as demo user
# 2. Navigate to /evolution → see 1 report for "Launch My SaaS Product"
# 3. Click to view full report → see 800-1200 word analysis
# 4. Navigate to /visualizations → see 1 visualization
# 5. Click to view → see 400-600 word narrative
# 6. Dashboard → evolution/visualization preview cards show snippets
```

### Patterns to Follow

Reference `patterns.md`:
- Database Patterns → Direct Database Insert (full evolution report example)
- Database Patterns → Direct Database Insert (full visualization example)
- AI Content Generation (Seed Scripts) → generateEvolutionReport()
- AI Content Generation (Seed Scripts) → generateVisualization()

### Testing Requirements
- Seed script completes without errors
- Evolution report exists in database
- Visualization exists in database
- Content quality: Authentic, insightful, well-written
- Foreign keys correct (user_id, dream_id)
- Timestamps calculated correctly
- Dashboard previews display content snippets

### Example Content Quality

**Evolution Report Should Include:**
- Temporal analysis: "When you began 18 days ago... Seven days later..."
- Direct quotes: "I'm afraid of wasting another 6 months"
- Growth patterns: Fear → confidence transformation
- Metacognitive insight: User's self-awareness about scope creep
- Encouraging tone: Wise mentor reflecting back growth

**Visualization Should Include:**
- Consistent metaphor: Mountain climbing throughout
- Visual imagery: Base camp, first plateau, technical chasm, summit
- Emotional arc: Weight of past failures → confidence at peak
- Inspiring conclusion: "You're the person who summits"

---

## Builder-4: UX Polish & Reflection Aesthetics

### Scope
Enhance the reflection experience by adding dream context display when user navigates to reflect, and improving the aesthetic atmosphere of the reflection form to feel sacred and welcoming.

### Complexity Estimate
**MEDIUM**

No split needed - focused UX enhancements to reflection flow.

### Success Criteria
- [ ] Dream context banner appears at top of reflection form when dream is pre-selected
- [ ] URL parameter `?dreamId=xxx` pre-selects dream and displays context
- [ ] Dream selection dropdown shows currently selected dream prominently
- [ ] After dream selection, context header updates to show dream title
- [ ] Mobile: Dream name visible without scrolling
- [ ] Reflection form has darker, more focused background (subtle vignette)
- [ ] Question cards have subtle glass effect with gradient borders
- [ ] Question text uses gradient styling (purple to gold)
- [ ] Placeholder text is warm: "Your thoughts are safe here..."
- [ ] Generous spacing between questions (min 32px gap)
- [ ] Tone selection cards feel sacred (not button-like)
- [ ] Submit button has breathing animation on hover

### Files to Modify

1. **`components/reflection/MirrorExperience.tsx`**
   - After imports: Add useSearchParams hook
   - Add useEffect to detect dreamId URL parameter
   - Before question rendering: Add dream context banner section
   - Update dream selection logic to show selected dream prominently

2. **`styles/reflection.css`** (or create if doesn't exist)
   - Add `.reflection-container` darker background with vignette
   - Add `.dream-context-banner` styling
   - Update `.question-card` for glass effect
   - Add gradient text for question headers
   - Update placeholder text styling
   - Add breathing animation for submit button

### Implementation Notes

**Dream Context Display Logic:**
```typescript
// Check URL for pre-selected dream
const searchParams = useSearchParams();
const dreamId = searchParams.get('dreamId');

// Pre-select dream on mount
useEffect(() => {
  if (dreamId && dreams) {
    const dream = dreams.find(d => d.id === dreamId);
    if (dream) setSelectedDream(dream);
  }
}, [dreamId, dreams]);
```

**Dream Context Banner:**
```tsx
{selectedDream && (
  <div className="dream-context-banner mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20">
    <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
      Reflecting on: {selectedDream.title}
    </h2>
    <div className="flex items-center gap-3 mt-3">
      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm">
        {selectedDream.category}
      </span>
      {selectedDream.target_date && (
        <span className="text-purple-300/70 text-sm">
          {daysRemaining(selectedDream.target_date)} days remaining
        </span>
      )}
    </div>
  </div>
)}
```

**Sacred Atmosphere CSS:**
```css
.reflection-container {
  background: radial-gradient(circle at center, rgba(88, 28, 135, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
  min-height: 100vh;
  padding: 4rem 2rem;
}

.question-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3)) 1;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.question-text {
  background: linear-gradient(135deg, #c084fc, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.question-input::placeholder {
  color: rgba(196, 181, 253, 0.5);
  font-style: italic;
}

.submit-button {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

**Warm Placeholder Text:**
- Question 1: "Your thoughts are safe here... what's present for you right now?"
- Question 2: "What step feels right to take next?"
- Question 3: "How does this dream connect to who you're becoming?"
- Question 4: "What gift is this dream offering you?"

**Testing Flow:**
1. Navigate to dream detail page
2. Click "Reflect" button
3. Verify: Dream context banner appears immediately with dream title
4. Verify: Dream category badge visible
5. Verify: Days remaining shown (if target_date exists)
6. Fill out reflection questions
7. Verify: Form feels sacred, not clinical
8. Verify: Placeholder text is warm and inviting
9. Hover submit button: Breathing animation visible
10. Mobile test: Dream context visible without scrolling

### Patterns to Follow

Reference `patterns.md`:
- Reflection Flow Patterns → Dream Context Display
- Import Order Convention

### Testing Requirements
- Dream context displays when navigating from dream card
- Dream context displays when URL has `?dreamId=xxx`
- Dream selection dropdown works if no pre-selection
- Form aesthetics feel sacred and welcoming
- Mobile responsive (context visible, form usable)
- Submit button breathing animation smooth

### Dependencies
**Depends on:** None
**Blocks:** None

---

## Builder Execution Order

### Parallel Group 1 (No dependencies)
- **Builder-1** (Navigation & Layout Foundation)
- **Builder-2** (Dashboard Animation & Layout)
- **Builder-3** (Demo Data Generation)
- **Builder-4** (UX Polish & Reflection Aesthetics)

All builders can work simultaneously - no shared files.

### Integration Notes

**File Ownership:**
- Builder-1 owns: CSS variables, utility classes, DemoBanner, page padding
- Builder-2 owns: Animation hooks, DashboardCard, DashboardGrid, dashboard CSS
- Builder-3 owns: seed-demo-user.ts script
- Builder-4 owns: MirrorExperience component, reflection CSS

**Testing Order:**
1. Builder-1 completes → Test all 10 pages for layout
2. Builder-2 completes → Test dashboard display
3. Builder-3 completes → Run seed script, verify evolution/visualization
4. Builder-4 completes → Test reflection flow

**No Integration Conflicts Expected:**
- No files modified by multiple builders
- CSS changes are additive (not destructive)
- Seed script runs independently
- Component changes are isolated

**Final Verification Checklist:**
- [ ] Demo banner visible and positioned correctly (Builder-1)
- [ ] Dashboard displays all 7 sections (Builder-2)
- [ ] Evolution report exists and displays (Builder-3)
- [ ] Visualization exists and displays (Builder-3)
- [ ] Reflection form shows dream context (Builder-4)
- [ ] Reflection form feels sacred (Builder-4)
- [ ] All pages tested with demo user
- [ ] Mobile responsive verified
- [ ] Stakeholder approval at 9/10

---

**Builder Assignment Status:** COMPLETE
**Total Builders:** 4 (no splits needed)
**Estimated Time:** 3-4 hours parallel execution
**Ready for:** Builder execution
