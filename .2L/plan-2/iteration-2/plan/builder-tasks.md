# Builder Task Breakdown - Core Pages Redesign

## Overview

**Total Builders:** 3-4 primary builders working in parallel

**Estimated Total Time:** 35-45 hours of builder work

**Builder Strategy:**
- Builder-1: Dashboard Page (8 hours)
- Builder-2: Dreams Page (12 hours, may split into 2 sub-builders)
- Builder-3A: Reflection Flow - Foundation (7 hours)
- Builder-3B: Reflection Flow - Interactivity (6 hours)

**Parallel Execution:**
- Phase 1 (Days 1-2): All builders work in parallel on separate pages
- Phase 2 (Day 3): Sub-builders 3A and 3B coordinate handoff
- Phase 3 (Day 4): Integration and testing

---

## Builder-1: Dashboard Page Redesign

### Scope

Transform the Dashboard page (`/app/dashboard/page.tsx`, 1,136 lines) from inline styled-jsx to glass components. Replace navigation, buttons, loading states, toasts, and error banners while preserving all functionality, tRPC queries, and the existing stagger animation system.

### Complexity Estimate

**MEDIUM**

Dashboard is modular with clear component boundaries, but has complex navigation, toast system, and multiple data-fetching cards. The existing stagger animation must be preserved, requiring careful coordination with glass components.

### Success Criteria

- [ ] Loading spinner replaced with CosmicLoader
- [ ] All buttons replaced with GlowButton (Reflect Now, Refresh, Upgrade)
- [ ] Navigation bar wrapped in glass styling
- [ ] User dropdown menu updated with glass effects
- [ ] Toast notifications replaced with GlassCard + GlowBadge
- [ ] Error banner replaced with GlassCard
- [ ] Stagger animation system preserved for all 5 cards
- [ ] All inline styled-jsx removed from page.tsx
- [ ] tRPC queries unchanged (useDashboard hook preserved)
- [ ] Visual parity achieved (before/after screenshots match)
- [ ] No console errors, no TypeScript errors
- [ ] Mobile responsive (tested at 480px, 768px, 1024px)

### Files to Create/Modify

**Modify:**
- `app/dashboard/page.tsx` - Main dashboard page (replace inline styles)

**Preserve (DO NOT MODIFY):**
- `components/dashboard/cards/*.tsx` - All dashboard card components (UsageCard, ReflectionsCard, etc.)
- `components/dashboard/shared/DashboardCard.tsx` - Base card wrapper (keep as-is)
- `hooks/useDashboard.ts` - tRPC data fetching hook
- `components/dashboard/shared/WelcomeSection.tsx` - Hero greeting section

**Reference:**
- `components/ui/glass/index.ts` - Glass components
- `.2L/plan-2/iteration-2/plan/patterns.md` - Code patterns

### Dependencies

**Depends on:** Iteration 1 glass components (already complete)

**Blocks:** Nothing (other builders can work in parallel)

### Implementation Notes

**Critical Constraints:**
1. **DO NOT modify tRPC queries** - useDashboard hook must remain unchanged
2. **Preserve stagger animation** - Use `animated={false}` on GlassCard components
3. **Keep WelcomeSection as-is** - Focus on page-level components, not nested components
4. **Navigation is page-specific** - Don't create app-wide navigation (out of scope)

**Stagger Animation Strategy:**
```tsx
// Existing stagger logic (PRESERVE)
const { itemRefs, isItemVisible } = useStaggerAnimation(5, { delay: 150, duration: 800 })

// Apply to cards with GlassCard wrapper
<div ref={itemRefs[0]} className={isItemVisible[0] ? 'visible' : 'hidden'}>
  <GlassCard animated={false} variant="elevated" hoverable>
    <UsageCard />
  </GlassCard>
</div>
```

**Navigation Replacement Strategy:**
- Current navigation uses inline styles (lines 230-353)
- Wrap entire navigation in GlassCard component
- Preserve all navigation logic (links, dropdown, refresh)
- Update buttons to GlowButton components

**Toast System Strategy:**
- Current toasts at lines 411-434
- Replace with AnimatePresence + GlassCard + GlowBadge
- Preserve auto-dismiss logic (setTimeout)
- Add entrance/exit animations with Framer Motion

### Patterns to Follow

Reference patterns from `patterns.md`:

- **Pattern 1:** Loading Spinner → CosmicLoader
- **Pattern 2:** Buttons → GlowButton
- **Pattern 6:** Toast Notifications → GlassCard + GlowBadge
- **Pattern 8:** Navigation Glass Wrapper
- **Pattern 12:** Error Banner with Glass Styling
- **Pattern 13:** Disable Glass Animations (for stagger cards)
- **Pattern 14:** Page-Level Stagger Animation (preserve)
- **Pattern 15:** Mobile-First Responsive Buttons

### Testing Requirements

**Functionality Testing:**
- [ ] Dashboard loads with all data (usage, reflections, dreams, evolution)
- [ ] "Reflect Now" button navigates to /reflection
- [ ] Refresh button refetches data
- [ ] User dropdown menu opens/closes correctly
- [ ] Logout functionality works
- [ ] Upgrade button shows for free users
- [ ] Toast notifications appear and auto-dismiss
- [ ] Error banner appears for critical errors
- [ ] All navigation links work

**Visual Testing:**
- [ ] Before/after screenshots captured for each section
- [ ] Navigation glass effect matches design
- [ ] Cards stagger in sequence (150ms delay between each)
- [ ] Buttons have hover glow effect
- [ ] Toast notifications slide in/out smoothly
- [ ] Mobile layout stacks properly

**Performance Testing:**
- [ ] Lighthouse audit >85 (no regression from current 90+)
- [ ] Animations smooth at 60fps on desktop
- [ ] No layout shift during stagger animation
- [ ] Bundle size change <10KB

**Coverage Target:** 100% of dashboard page-level components

---

## Builder-2: Dreams Page Redesign

### Scope

Transform the Dreams page (`/app/dreams/page.tsx`, 369 lines) from inline styled-jsx to glass components. This includes the main page, DreamCard component, and CreateDreamModal. Replace filters, header, cards, and modal while preserving tRPC query integration and status filtering.

### Complexity Estimate

**MEDIUM-HIGH**

Dreams page is straightforward, but involves 3 interconnected components:
1. Main page (369 lines)
2. DreamCard component (250 lines)
3. CreateDreamModal component (300+ lines)

The modal may require multi-step conversion (optional enhancement) which increases complexity.

**Recommendation:** Consider splitting into 2 sub-builders if modal complexity is high.

### Success Criteria

- [ ] Loading spinner replaced with CosmicLoader
- [ ] Page header replaced with glass styling
- [ ] "Create Dream" button replaced with GlowButton
- [ ] All filter buttons replaced with GlowButton
- [ ] Limits banner replaced with GlassCard
- [ ] Empty state replaced with GlassCard
- [ ] DreamCard component redesigned with glass effects
- [ ] CreateDreamModal wrapped with GlassModal
- [ ] Grid layout preserved with masonry pattern
- [ ] Status filtering works (Active, Achieved, Archived, All)
- [ ] tRPC queries unchanged (dreams.list, dreams.getLimits)
- [ ] All inline styled-jsx removed
- [ ] Visual parity achieved
- [ ] Mobile responsive

### Files to Create/Modify

**Modify:**
- `app/dreams/page.tsx` - Main dreams page
- `components/dreams/DreamCard.tsx` - Individual dream card (250 lines)
- `components/dreams/CreateDreamModal.tsx` - Create dream modal (300+ lines)

**Preserve (DO NOT MODIFY):**
- tRPC queries (dreams.list, dreams.getLimits)
- Filter state logic (statusFilter useState)
- Grid layout logic

**Reference:**
- `components/ui/glass/GlassDreamCard.tsx` - Glass version of dream card (from Iteration 1)
- `.2L/plan-2/iteration-2/plan/patterns.md` - Code patterns

### Dependencies

**Depends on:** Iteration 1 glass components (already complete)

**Blocks:** Nothing (can work in parallel with Builder-1 and Builder-3)

### Implementation Notes

**Critical Constraints:**
1. **DO NOT modify tRPC queries** - dreams.list and dreams.getLimits must remain unchanged
2. **Preserve grid layout** - `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` responsive pattern
3. **Preserve filter logic** - Status filtering state must work identically

**DreamCard Strategy:**
Two approaches available:

**Option A (Recommended):** Replace existing DreamCard with glass version
```tsx
// Use GlassDreamCard from iteration 1 (renamed to avoid conflict)
import { GlassDreamCard } from '@/components/ui/glass'

<GlassDreamCard
  dream={dream}
  onClick={() => router.push(`/dreams/${dream.id}`)}
/>
```

**Option B:** Update existing DreamCard to use glass components internally
```tsx
// Wrap existing DreamCard content in GlassCard
<GlassCard variant="elevated" hoverable glowColor="purple">
  {/* Existing DreamCard content */}
</GlassCard>
```

**CreateDreamModal Strategy:**

**Minimum Viable (Quick Win):**
- Wrap modal in GlassModal component
- Keep single-step form (don't convert to multi-step)
- Replace buttons with GlowButton
- Add glass styling to form inputs

**Optional Enhancement (If Time Permits):**
- Convert to multi-step flow (Details → Category → Timeline)
- Add ProgressOrbs component
- Convert category dropdown to visual card selection

**Recommendation:** Start with minimum viable approach. If ahead of schedule, add multi-step enhancement.

### Patterns to Follow

Reference patterns from `patterns.md`:

- **Pattern 1:** Loading Spinner → CosmicLoader
- **Pattern 2:** Buttons → GlowButton (Create, Filters)
- **Pattern 3:** Cards → GlassCard (Header, Limits, Empty State)
- **Pattern 4:** Modal → GlassModal
- **Pattern 10:** Visual Selection Cards (if multi-step modal)
- **Pattern 11:** Glassmorphic Input Fields
- **Pattern 15:** Mobile-First Responsive Buttons
- **Pattern 16:** Responsive Grid Layouts

### Testing Requirements

**Functionality Testing:**
- [ ] Dreams list loads with correct data
- [ ] Filter buttons change displayed dreams (Active/Achieved/Archived/All)
- [ ] Create Dream button opens modal
- [ ] Create Dream form submits successfully
- [ ] Form validation works (required fields, max lengths)
- [ ] Dream cards are clickable (navigate to /dreams/[id])
- [ ] Limits banner shows correct usage (X/Y dreams)
- [ ] Empty state shows when no dreams
- [ ] Grid layout responsive (3 cols → 2 cols → 1 col)

**Visual Testing:**
- [ ] Before/after screenshots for page, card, modal
- [ ] Dream cards have gradient borders based on category (optional enhancement)
- [ ] Filter buttons show active state with glow
- [ ] Modal has glass overlay with fade-in animation
- [ ] Grid maintains masonry layout on all screen sizes

**Performance Testing:**
- [ ] No performance regression
- [ ] Modal animations smooth (open/close)
- [ ] Grid renders quickly with 10+ dreams

**Coverage Target:** 100% of dreams page components

### Potential Split Strategy

If complexity proves too high (estimated >12 hours), split into:

**Sub-builder 2A: Dreams Page Layout (6 hours)**
- Main page (`app/dreams/page.tsx`)
- Header section with glass styling
- Filter buttons with GlowButton
- Limits banner with GlassCard
- Empty state with GlassCard
- Grid layout with responsive breakpoints
- Loading state with CosmicLoader

**Sub-builder 2B: Dream Components (6 hours)**
- DreamCard redesign (`components/dreams/DreamCard.tsx`)
- CreateDreamModal redesign (`components/dreams/CreateDreamModal.tsx`)
- Gradient borders based on category
- Modal multi-step conversion (optional)
- Form inputs with glass styling

**Handoff:** Sub-builder 2A completes page layout first, Sub-builder 2B integrates DreamCard and modal components.

---

## Builder-3A: Reflection Flow - Foundation

### Scope

Transform the Reflection flow foundation from inline styled-jsx to glass components. Focus on mirror frame, progress indicator, navigation buttons, and dream selection. This is the first half of the reflection redesign, providing the structural foundation for Builder-3B.

### Complexity Estimate

**MEDIUM-HIGH**

Reflection flow has 1,172 lines of complex logic with multi-step state machine. This sub-builder focuses on structural components (mirror frame, progress, navigation) which are medium complexity but critical to get right.

### Success Criteria

- [ ] Loading spinner replaced with CosmicLoader (wrapper page)
- [ ] Mirror frame wrapper replaced with GlassCard
- [ ] Progress Ring replaced with ProgressOrbs component
- [ ] Navigation buttons replaced with GlowButton (Back, Next, Continue)
- [ ] Dream selection cards replaced with glass styling
- [ ] Multi-step state machine preserved (CRITICAL)
- [ ] Step transitions work correctly (0 → 1 → 2 → ... → 6)
- [ ] All inline styles removed for covered sections
- [ ] No TypeScript errors, no console errors
- [ ] Visual parity with before state

### Files to Create/Modify

**Modify:**
- `app/reflection/page.tsx` - Wrapper page (40 lines, loading state)
- `app/reflection/MirrorExperience.tsx` - Main flow (focus on lines 630-725, 1050-1143, 806-850)

**Sections to Replace:**
- Mirror frame glass wrapper (lines 630-665)
- Progress indicator SVG → ProgressOrbs (lines 695-725)
- Navigation buttons (lines 806-850)
- Dream selection list (lines 1050-1143)

**DO NOT MODIFY:**
- State management logic (all useState hooks)
- Form data handling (formData state)
- Step progression logic (handleNext, handleBack)
- Tone-based ambient animations (lines 179-221)
- Cosmic particles (lines 224-232)

**Reference:**
- `.2L/plan-2/iteration-2/plan/patterns.md` - Code patterns

### Dependencies

**Depends on:** Iteration 1 glass components (already complete)

**Blocks:** Builder-3B (needs foundation components before adding interactivity)

### Implementation Notes

**Critical Constraints:**
1. **PRESERVE ALL STATE LOGIC** - Do not refactor useState hooks
2. **PRESERVE STEP MACHINE** - handleNext, handleBack, currentStep logic must work identically
3. **PRESERVE TONE ANIMATIONS** - DO NOT remove fusion-breath, gentle-stars, intense-swirl CSS
4. **PRESERVE COSMIC PARTICLES** - Background animations stay as-is

**Mirror Frame Strategy:**
```tsx
// Old (lines 630-665)
<div className="mirror-frame">
  <style jsx>{`
    .mirror-frame {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, ...);
      backdrop-filter: blur(40px) saturate(150%);
      border-radius: 30px;
      padding: 48px;
    }
  `}</style>
  {/* Mirror content */}
</div>

// New
import { GlassCard } from '@/components/ui/glass'

<GlassCard
  variant="elevated"
  glassIntensity="strong"
  className="mirror-frame p-12 rounded-[30px]"
>
  {/* Mirror content - UNCHANGED */}
</GlassCard>
```

**Progress Indicator Strategy:**
```tsx
// Old (lines 695-725)
<svg className="progress-svg" viewBox="0 0 120 120">
  {/* Complex SVG ring with gradient */}
</svg>

// New
import { ProgressOrbs } from '@/components/ui/glass'

<ProgressOrbs
  steps={5}
  currentStep={currentStep - 1}  // 0-indexed (step 1 = index 0)
  className="mb-6"
/>
```

**Navigation Buttons Strategy:**
```tsx
// Old (lines 806-850)
<button className="back-button" onClick={handleBack}>
  ← Back
</button>
<button className="next-button" onClick={handleNext}>
  Continue →
</button>

// New
import { GlowButton } from '@/components/ui/glass'

<div className="flex gap-4 mt-6">
  <GlowButton
    variant="ghost"
    size="md"
    onClick={handleBack}
    className="flex-1"
  >
    ← Back
  </GlowButton>
  <GlowButton
    variant="primary"
    size="md"
    onClick={handleNext}
    className="flex-1"
  >
    Continue →
  </GlowButton>
</div>
```

**Dream Selection Strategy:**
Follow **Pattern 10** from patterns.md (Visual Selection Cards)

### Patterns to Follow

Reference patterns from `patterns.md`:

- **Pattern 1:** Loading Spinner → CosmicLoader
- **Pattern 2:** Buttons → GlowButton (Navigation)
- **Pattern 3:** Cards → GlassCard (Mirror frame)
- **Pattern 5:** Progress Indicator → ProgressOrbs
- **Pattern 10:** Visual Selection Cards (Dream selection)
- **Pattern 13:** Disable Glass Animations (preserve tone animations)

### Testing Requirements

**Functionality Testing (CRITICAL):**
- [ ] Step 0: Dream selection works, Continue button enabled when dream selected
- [ ] Step 1-5: All questions display correctly
- [ ] Back button navigates to previous step
- [ ] Next/Continue button navigates to next step
- [ ] Progress indicator shows correct step (1/5, 2/5, etc.)
- [ ] Step 3 branching: "Do you have a timeline?" Yes/No choice works
- [ ] If No to step 3, skip to step 5 (relationship question)
- [ ] If Yes to step 3, show step 4 (date input)
- [ ] Form data preserved during navigation (answers don't disappear)

**Visual Testing:**
- [ ] Before/after screenshots for mirror frame, progress indicator, navigation
- [ ] Mirror frame has strong glass effect (blur, glow border)
- [ ] Progress orbs show completed/current/upcoming states
- [ ] Dream selection cards have glow on selection
- [ ] Navigation buttons have proper spacing and sizing

**State Testing:**
- [ ] Console log currentStep after each navigation
- [ ] Console log formData to verify preservation
- [ ] No state reset bugs (answers persist during back/forward navigation)

**Coverage Target:** 100% of foundation components (mirror frame, progress, navigation, dream selection)

### Handoff to Builder-3B

**What Builder-3B Needs:**
1. Working mirror frame with GlassCard
2. ProgressOrbs showing correct step
3. Navigation buttons functional (Back, Next)
4. Dream selection working with glass styling
5. All state logic unchanged

**Handoff Checklist:**
- [ ] All foundation components replaced
- [ ] State machine tested (all step transitions work)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation of any edge cases discovered

---

## Builder-3B: Reflection Flow - Interactivity

### Scope

Transform the Reflection flow interactive components from inline styled-jsx to glass components. Focus on input fields, choice buttons, tone selection, submit flow, and output display. This is the second half of the reflection redesign, building on Builder-3A's foundation.

### Complexity Estimate

**MEDIUM**

This sub-builder handles interactive elements (inputs, buttons, cards) which are more straightforward than the structural components in Builder-3A. However, tone selection cards and output display require careful styling to maintain the magical aesthetic.

### Success Criteria

- [ ] All question input fields use glass styling
- [ ] Choice buttons (Yes/No) replaced with GlowButton
- [ ] Tone selection cards replaced with glass styling
- [ ] Submit button replaced with GlowButton
- [ ] Loading state during submission uses CosmicLoader
- [ ] Output page mirror frame replaced with GlassCard
- [ ] New Reflection button replaced with GlowButton
- [ ] Character counters preserved for all text inputs
- [ ] Form validation unchanged
- [ ] Tone-based ambient effects PRESERVED (fusion-breath, gentle-stars, intense-swirl)
- [ ] All inline styles removed for covered sections
- [ ] Visual parity with before state

### Files to Create/Modify

**Modify:**
- `app/reflection/MirrorExperience.tsx` - Main flow (focus on lines 736-804, 853-916, 991-1047)
- `app/reflection/output/page.tsx` - Output display (204 lines)

**Sections to Replace:**
- Answer input fields (lines 736-776)
- Choice buttons (lines 779-804)
- Submit button (lines 853-871)
- Tone selection cards (lines 893-916)
- Loading state (lines 991-1047)
- Output page mirror frame and actions

**DO NOT MODIFY:**
- Tone-based ambient animations (PRESERVE)
- Form validation logic
- tRPC mutation (reflection.create)
- Output HTML rendering

**Reference:**
- `.2L/plan-2/iteration-2/plan/patterns.md` - Code patterns
- Builder-3A's completed work (mirror frame, progress, navigation)

### Dependencies

**Depends on:** Builder-3A (foundation must be complete)

**Blocks:** Nothing (final builder in sequence)

### Implementation Notes

**Critical Constraints:**
1. **PRESERVE TONE ANIMATIONS** - DO NOT remove or modify ambient effect CSS
2. **PRESERVE FORM VALIDATION** - Character limits, required fields must work identically
3. **PRESERVE tRPC MUTATION** - reflection.create must remain unchanged

**Input Fields Strategy:**

Create shared `GlassInput` component (see **Pattern 11** in patterns.md) and use throughout:

```tsx
import { GlassInput } from '@/components/ui/glass'

<GlassInput
  variant="textarea"
  value={formData.dream}
  onChange={(value) => setFormData({ ...formData, dream: value })}
  placeholder="Describe your deepest dream..."
  maxLength={2000}
  showCounter={true}
  label={question.text}
/>
```

**Choice Buttons Strategy:**

Follow **Pattern 9** from patterns.md:

```tsx
import { GlowButton } from '@/components/ui/glass'

<div className="grid grid-cols-2 gap-4">
  <GlowButton
    variant={selectedChoice === 'yes' ? 'primary' : 'secondary'}
    size="lg"
    onClick={() => handleChoiceSelect('yes')}
    className="w-full"
  >
    Yes
  </GlowButton>
  <GlowButton
    variant={selectedChoice === 'no' ? 'primary' : 'secondary'}
    size="lg"
    onClick={() => handleChoiceSelect('no')}
    className="w-full"
  >
    No
  </GlowButton>
</div>
```

**Tone Selection Strategy:**

Follow **Pattern 10** from patterns.md (Visual Selection Cards):

```tsx
const TONES = [
  { id: 'fusion', name: 'Fusion', emoji: '⚡', color: 'gold' },
  { id: 'gentle', name: 'Gentle', emoji: '🌸', color: 'cyan' },
  { id: 'intense', name: 'Intense', emoji: '🔥', color: 'purple' },
]

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {TONES.map((tone) => (
    <GlassCard
      key={tone.id}
      variant={selectedTone === tone.id ? 'elevated' : 'default'}
      glowColor={selectedTone === tone.id ? tone.color : undefined}
      hoverable
      className="cursor-pointer"
      onClick={() => setSelectedTone(tone.id)}
    >
      <div className="text-center space-y-2">
        <span className="text-4xl">{tone.emoji}</span>
        <GradientText variant="subtitle">{tone.name}</GradientText>
      </div>
    </GlassCard>
  ))}
</div>
```

**Submit Button Strategy:**

```tsx
<GlowButton
  variant="primary"
  size="lg"
  onClick={handleSubmit}
  disabled={isSubmitting || !isFormValid}
  className="w-full"
>
  {isSubmitting ? (
    <span className="flex items-center gap-2">
      <CosmicLoader size="sm" />
      Creating your reflection...
    </span>
  ) : (
    <>
      <span className="text-2xl mr-2">🪞</span>
      Gaze into the Mirror
    </>
  )}
</GlowButton>
```

**Output Page Strategy:**

```tsx
// app/reflection/output/page.tsx

import { GlassCard, GlowButton, GradientText } from '@/components/ui/glass'

<div className="min-h-screen flex items-center justify-center p-6">
  <GlassCard
    variant="elevated"
    glassIntensity="strong"
    className="max-w-3xl w-full p-12"
  >
    <GradientText variant="title" className="mb-6">
      Your Reflection
    </GradientText>

    <div
      className="reflection-content prose prose-invert"
      dangerouslySetInnerHTML={{ __html: reflection.content }}
    />

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
      <GlowButton variant="secondary" size="sm" onClick={handleCopy}>
        <span className="text-xl">📋</span>
        Copy
      </GlowButton>
      <GlowButton variant="secondary" size="sm" onClick={handleNewReflection}>
        <span className="text-xl">✨</span>
        New
      </GlowButton>
      <GlowButton variant="secondary" size="sm" onClick={handleViewJourney}>
        <span className="text-xl">📖</span>
        Journey
      </GlowButton>
      <GlowButton variant="secondary" size="sm" onClick={handleDashboard}>
        <span className="text-xl">🏠</span>
        Home
      </GlowButton>
    </div>
  </GlassCard>
</div>
```

### Patterns to Follow

Reference patterns from `patterns.md`:

- **Pattern 1:** Loading Spinner → CosmicLoader
- **Pattern 2:** Buttons → GlowButton (Submit, New Reflection, Actions)
- **Pattern 3:** Cards → GlassCard (Tone selection, Output mirror)
- **Pattern 7:** Gradient Text → GradientText (Output title)
- **Pattern 9:** Choice Buttons (Yes/No)
- **Pattern 10:** Visual Selection Cards (Tone selection)
- **Pattern 11:** Glassmorphic Input Fields (Create GlassInput component)
- **Pattern 15:** Mobile-First Responsive Buttons

### Testing Requirements

**Functionality Testing:**
- [ ] All question inputs accept text correctly
- [ ] Character counters update in real-time
- [ ] Choice buttons (Yes/No) select correctly
- [ ] Tone selection cards select correctly (fusion/gentle/intense)
- [ ] Submit button disabled when form incomplete
- [ ] Submit button triggers reflection creation
- [ ] Loading state shows CosmicLoader during submission
- [ ] Output page displays reflection HTML correctly
- [ ] All action buttons work (Copy, New, Journey, Home)
- [ ] Tone-based ambient animations still active

**Visual Testing:**
- [ ] Before/after screenshots for inputs, choices, tone cards, output
- [ ] Input fields have glass effect with focus glow
- [ ] Choice buttons show active state with glow
- [ ] Tone selection cards have color-coded glow (gold/cyan/purple)
- [ ] Submit button has pulse animation on hover
- [ ] Output display has gradient text for title

**State Testing:**
- [ ] Form data persists during tone selection
- [ ] Tone-based ambient effects change when tone selected
- [ ] Submit doesn't trigger multiple times (debounce works)

**Coverage Target:** 100% of interactive components (inputs, buttons, tone selection, output)

### Coordination with Builder-3A

**What Builder-3A Provides:**
- Mirror frame with GlassCard
- ProgressOrbs component
- Navigation buttons
- Dream selection with glass styling

**What Builder-3B Adds:**
- Input fields with glass styling
- Choice buttons with GlowButton
- Tone selection with glass cards
- Submit button with loading state
- Output page with glass display

**Integration Testing:**
- [ ] Full reflection flow works end-to-end (dream selection → questions → tone → submit → output)
- [ ] All steps have consistent glass styling
- [ ] No visual inconsistencies between 3A and 3B sections

---

## Shared Component Creation

### GlassInput Component (Any Builder)

**Who:** Any builder can create this (recommend Builder-3B since Reflection uses it most)

**Estimated Time:** 2 hours

**File to Create:**
- `components/ui/glass/GlassInput.tsx` - Glassmorphic input component

**Specification:** See **Pattern 11** in patterns.md for full implementation

**Features:**
- Text input and textarea variants
- Glass background with focus glow
- Character counter (optional)
- Auto-resize for textarea
- Label support
- Max length enforcement
- TypeScript types

**Export:**
Add to `components/ui/glass/index.ts`:
```tsx
export { GlassInput } from './GlassInput'
```

**Usage:**
- Reflection: All question inputs (5 questions)
- Dreams: CreateDreamModal form fields (title, description)

---

## Builder Execution Order

### Parallel Group 1 (No Dependencies) - Days 1-2

**Builder-1: Dashboard** (8 hours)
- Navigation, buttons, loading, toasts, errors
- Can complete independently

**Builder-2: Dreams** (12 hours, or split into 2A + 2B)
- Page layout, DreamCard, CreateDreamModal
- Can complete independently

**Builder-3A: Reflection Foundation** (7 hours)
- Mirror frame, progress, navigation, dream selection
- Can start immediately

### Sequential Group 2 (Depends on 3A) - Day 3

**Builder-3B: Reflection Interactivity** (6 hours)
- Input fields, choice buttons, tone selection, output
- Must wait for Builder-3A to complete foundation

### Integration Phase - Day 4

**All Builders:** Merge branches, test cross-page flows, resolve conflicts

---

## Integration Notes

### Shared Navigation

**Decision:** Each page keeps its own navigation for now
- Dashboard: Custom navigation (inline)
- Dreams: No navigation (uses layout.tsx default)
- Reflection: No navigation (full-screen experience)

**Future Iteration:** Could unify navigation in `app/layout.tsx` (out of scope)

### CSS File Strategy

**Dashboard:** Minimize `@/styles/dashboard.css` usage
- Remove rules as components replaced
- Keep only critical global styles
- Final cleanup: Delete file if unused

**Reflection:** Minimize `@/styles/mirror.css` usage
- Keep tone-based animation keyframes (fusion-breath, gentle-stars, intense-swirl)
- Remove component-specific rules
- Preserve cosmic particles CSS

### Conflict Areas

**DreamCard Naming:**
- Existing: `components/dreams/DreamCard.tsx`
- Glass version: `components/ui/glass/GlassDreamCard.tsx` (renamed)
- Resolution: Import with clear name

**CosmicBackground:**
- All pages use CosmicBackground component
- Preserve as-is (already magical)
- Z-index coordination: background z-0, content z-10

**Stagger Animation:**
- Dashboard uses custom stagger hook
- Disable glass component animations: `animated={false}`
- Preserve existing stagger system

### Testing Coordination

**Each Builder Must Provide:**
1. Before/after screenshots for all modified sections
2. Testing checklist completion (see Pattern 18)
3. List of any edge cases discovered
4. Documentation of any state preserved
5. Confirmation of no console/TypeScript errors

**Integration Testing (All Builders):**
- Cross-page navigation works (Dashboard → Dreams → Reflection)
- Consistent glass styling across all pages
- No z-index conflicts (modals, navigation, toasts)
- Mobile responsive on all pages
- Lighthouse performance >85

---

## Risk Mitigation

### High-Risk Areas

**Reflection State Machine (Builder-3A/3B):**
- **Risk:** Breaking multi-step flow
- **Mitigation:** Test every step transition, preserve all state logic

**Dashboard Stagger Animation (Builder-1):**
- **Risk:** Breaking card entrance animations
- **Mitigation:** Use `animated={false}` on glass components, preserve stagger hook

**Dreams CreateDreamModal (Builder-2):**
- **Risk:** Breaking form submission
- **Mitigation:** Preserve form validation, tRPC mutation unchanged

### Low-Risk Areas

**Loading States (All Builders):**
- Simple component replacement (spinner → CosmicLoader)
- Low risk, quick wins

**Buttons (All Builders):**
- Simple component replacement (inline → GlowButton)
- Low risk, high visual impact

**Toasts/Banners (Builder-1):**
- Straightforward replacement with GlassCard
- Medium risk (animation coordination)

---

## Success Metrics

### Per-Builder Metrics

**Builder-1 (Dashboard):**
- [ ] 8 components replaced (nav, buttons, toasts, etc.)
- [ ] 0 inline styled-jsx blocks remaining
- [ ] Lighthouse score >85
- [ ] All user flows tested

**Builder-2 (Dreams):**
- [ ] 8 components replaced (page, card, modal, etc.)
- [ ] 0 inline styled-jsx blocks remaining
- [ ] Grid responsive at all breakpoints
- [ ] Modal animations smooth

**Builder-3A (Reflection Foundation):**
- [ ] 4 components replaced (mirror, progress, nav, dream selection)
- [ ] All step transitions work
- [ ] State machine preserved
- [ ] Handoff to 3B successful

**Builder-3B (Reflection Interactivity):**
- [ ] 6 components replaced (inputs, choices, tone, submit, output)
- [ ] GlassInput component created
- [ ] Full reflection flow works end-to-end
- [ ] Tone animations preserved

### Overall Success

- [ ] All 3 pages redesigned
- [ ] 1,783+ lines of inline styled-jsx removed
- [ ] 10/10 glass components used
- [ ] Visual parity achieved on all pages
- [ ] No functional regressions
- [ ] Lighthouse >85 on all pages
- [ ] Mobile responsive on all pages
- [ ] No console errors
- [ ] No TypeScript errors

---

**Builders should reference this document continuously and update the checklist as they progress. Communication between Builder-3A and Builder-3B is critical for successful handoff.**
