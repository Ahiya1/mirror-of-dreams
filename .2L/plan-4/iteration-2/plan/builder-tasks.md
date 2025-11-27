# Builder Task Breakdown - Iteration 2

## Overview

**Total Builders:** 3 primary builders (sequential execution recommended)
**Total Estimated Time:** 8-12 hours
**Complexity:** MEDIUM-HIGH (widespread changes but mostly subtractive work)

**Strategy:** Sequential execution allows each builder to see previous work and maintain consistency. Parallel execution possible but requires coordination to avoid style conflicts.

**Recommended Order:**
1. Builder-1: Dashboard Simplification (foundation)
2. Builder-2: Remove Flash (visual consistency)
3. Builder-3: Clear Copy + Integration (polish)

---

## Builder-1: Dashboard Simplification

### Scope

Simplify dashboard to show ONE clear primary action and remove visual competition. Transform WelcomeSection from 258 lines of mystical messaging to ~50 lines of simple greeting. Establish restrained design patterns for other builders to follow.

### Complexity Estimate

**MEDIUM-HIGH**

**Reasoning:**
- WelcomeSection has complex conditional logic (24 message variations)
- Usage display has tier-specific logic and progress animations
- Dashboard layout currently uses 2x3 grid (need single-column or simplified grid)
- 258 lines → 50 lines requires careful deletion and testing

### Success Criteria

- [ ] Greeting is simple time-based: "Good [morning/afternoon/evening], [Name]"
- [ ] WelcomeSection reduced from 258 lines to ~50 lines
- [ ] "Reflect Now" button is visually dominant (2-3x larger than other buttons)
- [ ] "Reflect Now" button has NO emoji (remove ✨)
- [ ] Usage display is simple: "X/Y reflections this month" (no progress ring, no percentages)
- [ ] Dashboard has max 1 emoji total (or 0 if "Reflect Now" emoji removed)
- [ ] No competing sections fighting for attention
- [ ] Test: Ahiya sees dashboard and knows "Reflect Now" is primary action

### Files to Create

No new files - all modifications to existing components.

### Files to Modify

**Primary:**
1. `components/dashboard/shared/WelcomeSection.tsx` (258 lines → ~50 lines)
   - Simplify `getGreeting()` function (lines 39-74)
   - Remove all welcome message logic (lines 79-156)
   - Remove quick actions generation
   - Keep only: simple greeting + user name

2. `components/dashboard/shared/WelcomeSection.module.css` (320 lines)
   - Remove complex animations (breathe, slideIn, etc.)
   - Simplify to basic layout styles
   - Estimated reduction: 320 → ~80 lines

3. `app/dashboard/page.tsx` (237 lines)
   - Line 129: Remove ✨ emoji from "Reflect Now" button
   - Make "Reflect Now" button larger (increase padding, font size)
   - Optional: Adjust layout if grid feels too busy

4. `components/dashboard/cards/UsageCard.tsx` (340 lines)
   - Replace progress ring with simple text display
   - Remove usage percentage calculation
   - Remove mystical status messages ("Building momentum beautifully")
   - Display: "X/Y reflections this month" or "X/∞ reflections this month"

**Secondary (if time allows):**
5. `components/dashboard/shared/DashboardGrid.tsx`
   - Simplify grid layout if needed
   - Consider hiding Evolution/Visualization/Subscription cards

### Dependencies

**Depends on:** None (first builder)

**Blocks:** Builder-2 and Builder-3 (should see simplified dashboard as reference)

### Implementation Notes

#### WelcomeSection Simplification

**Current complexity:**
- Time-based greetings with weekend variations
- Usage-based welcome messages (first time, active, out of limit)
- Evolution-based messages (eligible, ineligible)
- Tier-based messages (free, essential, premium, creator)
- Quick actions generation based on state

**Target simplicity:**
- ONE greeting function: "Good [morning/afternoon/evening]"
- NO welcome messages (just greeting)
- NO quick actions in WelcomeSection

**Pattern to follow:**
```typescript
// From patterns.md - Greeting Pattern
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good evening';
};

const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

return (
  <div className="mb-8">
    <h1 className="text-3xl font-light text-white">
      {getGreeting()}, {firstName}
    </h1>
  </div>
);
```

#### Usage Display Simplification

**Current complexity:**
- ProgressRing component with animated fill
- Percentage calculation and display
- Three stats: Used / Limit / Total
- Status messages based on usage tier
- Animated counters with useAnimatedCounter hook

**Target simplicity:**
```typescript
// Simple text display - no progress ring, no percentage
<div className="text-center">
  <p className="text-2xl font-light text-white">
    {currentCount} / {limit === 'unlimited' ? '∞' : limit} reflections this month
  </p>
</div>
```

#### "Reflect Now" Button Prominence

**Current state:**
- Uses GlowButton component
- Has ✨ emoji
- Same size as other action buttons

**Target state:**
```tsx
<button className="
  px-8 py-4
  text-xl font-medium
  bg-mirror-amethyst
  text-white
  rounded-lg
  transition-opacity duration-200
  hover:opacity-90
  active:opacity-85
">
  Reflect Now
</button>
```

**Visual prominence:**
- Larger padding (px-8 py-4 vs px-4 py-2)
- Larger font (text-xl vs text-base)
- No emoji (clean text)
- Solid background (not transparent border)

### Testing Requirements

**Unit Tests:** Not required (visual changes only)

**Manual Testing:**
1. **Greeting accuracy:**
   - Test at different times of day (use browser dev tools to change system time)
   - Morning (8am): "Good morning, Ahiya"
   - Afternoon (2pm): "Good afternoon, Ahiya"
   - Evening (7pm): "Good evening, Ahiya"
   - Late night (1am): "Good evening, Ahiya" (not "Deep night wisdom")

2. **Visual hierarchy:**
   - "Reflect Now" button is clearly most prominent element
   - User name displays correctly (first name only)
   - Layout is clean (not cluttered)

3. **Usage display:**
   - Shows correct count (test with different usage states)
   - Handles "unlimited" correctly (shows ∞ symbol)
   - No progress ring visible
   - No confusing percentages

4. **Emoji count:**
   - Dashboard has 0-1 emojis total (NOT 30+)
   - If category icons shown on dream cards, count as functional (exempt)

**Coverage target:** Manual visual review (100% of modified components)

### Potential Split Strategy

If task proves too complex (unlikely), consider:

**Foundation (Builder-1A - 2 hours):**
- Simplify WelcomeSection greeting only
- Remove ✨ from "Reflect Now" button
- Test greeting logic

**Refinement (Builder-1B - 1-2 hours):**
- Simplify UsageCard display
- Make "Reflect Now" visually dominant
- Final layout adjustments

**Recommendation:** Keep as single builder task (3-4 hours total). Splitting adds coordination overhead.

---

## Builder-2: Remove Flash (Emojis + Animations)

### Scope

Remove decorative emojis (130+ instances), pop-up/bounce animations, and continuous breathing effects throughout the app. Simplify glass component library to remove decorative props. Establish visual consistency with restrained interactions.

### Complexity Estimate

**HIGH**

**Reasoning:**
- 150+ emoji instances across 15+ files
- 67 files use Framer Motion (need to audit each)
- Animation variants deeply integrated into component APIs
- Glass components used in 30+ locations
- Risk of breaking layouts or interactions if not careful

### Success Criteria

- [ ] Maximum 2 decorative emojis per page (functional category/status icons exempt)
- [ ] Dashboard: 0-1 emojis (category icons on dream cards don't count)
- [ ] Auth pages: 0 decorative emojis (use SVG for password toggle)
- [ ] Reflection flow: 0 decorative emojis (category selection icons don't count)
- [ ] NO scale effects on any button hover/tap
- [ ] NO continuous breathing/pulsing animations on foreground elements
- [ ] Animation durations reduced: 600ms → 200-300ms
- [ ] Glass components simplified (no breathe-slow, no decorative glows)
- [ ] Background atmospheric layers remain (ambient depth, not flash)
- [ ] Test: No pop-up or bounce effects visible anywhere in app

### Files to Create

1. `components/icons/DreamCategoryIcon.tsx`
   - Purpose: Centralized functional icon component
   - Pattern from patterns.md

2. `components/icons/DreamStatusIcon.tsx`
   - Purpose: Status icon component (active, completed, archived, paused)
   - Similar to DreamCategoryIcon

3. `components/ui/PasswordToggle.tsx`
   - Purpose: SVG-based password visibility toggle
   - Replaces emoji (👁️🙈)
   - Pattern from patterns.md

### Files to Modify

**Animation System (HIGH PRIORITY):**

1. `lib/animations/variants.ts`
   - Remove `scale` property from all variants
   - Line 23: `hover: { y: -4, scale: 1.02 }` → `hover: { y: -2 }` (remove scale)
   - Line 26: `hidden: { opacity: 0, y: 20, scale: 0.95 }` → remove scale
   - Update all entrance animations: remove scale, keep fade/slide
   - Reduce durations: 600ms → 300ms

2. `components/ui/glass/GlassCard.tsx` (84 lines)
   - Remove `whileHover` prop usage (lines 59-63)
   - Remove `breathe-slow` class application
   - Remove decorative glow variants
   - Simplify to: `elevated` boolean, `interactive` boolean
   - Pattern from patterns.md

3. `components/ui/glass/GlowButton.tsx` (64 lines)
   - Remove `whileHover={{ scale: 1.02 }}` (line 40)
   - Remove `whileTap={{ scale: 0.98 }}` (line 41)
   - Remove `amethyst-breathing` class
   - Convert to CSS-only hover (see patterns.md Button pattern)

4. `components/ui/glass/GlowBadge.tsx` (90 lines)
   - Remove `glowing` prop and pulse animation (lines 54-73)
   - Use static box-shadow for active states
   - Keep color variants (functional status indication)

5. `components/ui/glass/ProgressOrbs.tsx` (102 lines)
   - Remove infinite pulse animation (lines 30-42)
   - Only animate on state change, not continuously
   - OR remove component if not used

6. `styles/animations.css` (755 lines)
   - **DELETE these keyframes:**
     - `@keyframes breathe` (lines ~144-152)
     - `@keyframes breatheSubtle` (lines ~154-164)
     - `@keyframes pulseGlow` (lines ~176-184)
     - `@keyframes float` (lines ~187-195)
     - `@keyframes floatGentle` (lines ~197-205)
     - `@keyframes bob` (lines ~207-218)
     - `@keyframes scaleInBounce` (lines ~70-87)
     - `@keyframes bounceIn` (lines ~380-397)
   - **DELETE these utility classes:**
     - `.animate-breathe`
     - `.animate-breathe-subtle`
     - `.animate-pulse-glow`
     - `.animate-float`
     - `.animate-float-gentle`
     - `.animate-bob`
     - `.animate-scale-bounce`
     - `.animate-bounce-in`
   - **UPDATE durations:**
     - fadeIn, slideInUp, etc.: 600ms → 300ms

7. `hooks/useStaggerAnimation.ts`
   - Update default duration: 600 → 300
   - Update default delay: 100 → 80

**Emoji Removal (HIGH PRIORITY):**

8. `app/auth/signup/page.tsx`
   - Lines 113-116: **REMOVE entire "Free Forever ✨" badge**
   - Line 264: "Create Free Account" → "Create Account"
   - Update to use PasswordToggle component (not emoji)

9. `app/auth/signin/page.tsx`
   - Update to use PasswordToggle component (not emoji)
   - Line 228: Remove ✨ from footer link

10. `app/dashboard/page.tsx`
    - Line 129: Already handled by Builder-1 (remove ✨ from "Reflect Now")

11. `app/reflection/MirrorExperience.tsx`
    - Line 276: Remove ✨ from dream selection header
    - Line 363: Remove ⭐ from selected dream icon
    - Lines 409-411: Replace tone emoji selectors (⚡🌸🔥) with colored borders
    - Line 470: Remove 🪞 from mirror button
    - Line 523: Remove ✨ from "Create New Reflection"
    - Use DreamCategoryIcon component for category selection

12. `components/dashboard/cards/ReflectionsCard.tsx`
    - Line 36: Remove 🪞 from empty state
    - Line 40: Remove ✨ from "Start Reflecting" button

13. `components/dashboard/cards/EvolutionCard.tsx`
    - Remove 🦋 from buttons
    - Remove ✨ from action buttons

14. `components/dashboard/cards/VisualizationCard.tsx`
    - Remove 🏔️🌀🌌 from headers and buttons

15. `components/dashboard/cards/SubscriptionCard.tsx`
    - Remove 💎✨🌟⚙️ from tier badges and buttons
    - Use text labels only

**Background (LOW PRIORITY - Keep but simplify):**

16. `components/ui/glass/AnimatedBackground.tsx`
    - Keep as-is (atmospheric depth, not foreground flash)
    - Ensure default intensity is `subtle` not `strong`
    - Document that this is earned beauty (ambient atmosphere)

### Dependencies

**Depends on:** Builder-1 (dashboard simplification provides reference)

**Blocks:** Builder-3 (copy updates should build on visual consistency)

### Implementation Notes

#### Emoji Removal Strategy

**Systematic approach:**
1. Create DreamCategoryIcon and DreamStatusIcon components first
2. Replace all button emojis with text-only labels
3. Update auth pages to use SVG PasswordToggle
4. Replace tone selector emojis with colored borders
5. Remove all header/badge emojis
6. Validate each page for emoji count (max 2 decorative)

**Use grep to find remaining emojis:**
```bash
# Find all emoji usage
rg "[\u{1F000}-\u{1F9FF}]" app/ -l

# Find specific decorative emojis
rg "✨|💎|🌱|🦋|🏔️" --type tsx
```

#### Animation Removal Strategy

**Systematic approach:**
1. Update variants.ts first (foundation)
2. Update glass components (GlassCard, GlowButton, GlowBadge)
3. Delete decorative CSS animations
4. Update useStaggerAnimation durations
5. Test all page transitions and hover states
6. Verify no broken layouts from removed animations

**Test each component in isolation before moving to next.**

#### Glass Component Simplification

**Before (complex API):**
```typescript
<GlassCard
  variant="elevated"
  glowColor="cosmic"
  hoverable={true}
  animated={true}
/>
```

**After (simple API):**
```typescript
<GlassCard
  elevated={true}
  interactive={false}
/>
```

**Update all 30+ usages** - use find/replace for common patterns.

#### Tone Selector Redesign

**Before (emoji-based):**
```tsx
<button>⚡ Sacred Fusion</button>
<button>🌸 Gentle Clarity</button>
<button>🔥 Luminous Intensity</button>
```

**After (color-coded):**
```tsx
<button className={`
  p-4 rounded-lg border-2
  ${tone === 'fusion' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}
`}>
  <span className="text-lg font-medium">Fusion</span>
  <p className="text-sm text-gray-400">Balanced and thoughtful</p>
</button>
```

### Testing Requirements

**Emoji Count Validation:**
```bash
# Count emojis per page
rg -o "[\u{1F000}-\u{1F9FF}]" app/dashboard/page.tsx | wc -l  # Should be 0-2
rg -o "[\u{1F000}-\u{1F9FF}]" app/auth/signin/page.tsx | wc -l  # Should be 0
rg -o "[\u{1F000}-\u{1F9FF}]" app/auth/signup/page.tsx | wc -l  # Should be 0
```

**Animation Validation:**
```bash
# Find remaining scale effects
rg "scale: 1\.|whileHover.*scale|whileTap.*scale" --type tsx

# Find continuous animations
rg "repeat: Infinity" --type tsx

# Find decorative animation classes
rg "breathe|pulse-glow|float|bob" --type tsx
```

**Manual Testing:**
1. **Button interactions:**
   - Hover over any button: Should see opacity change (NO scale/bounce)
   - Click any button: Should see subtle opacity change (NO scale)
   - All buttons clickable and responsive

2. **Card interactions:**
   - Hover over interactive cards: Should see subtle 2px lift (NO scale)
   - Non-interactive cards: No hover effect

3. **Page transitions:**
   - Navigate between pages: Should see smooth 300ms fade (NO scale)
   - Dashboard load: Cards appear with subtle stagger (fast, not slow)

4. **Emoji count:**
   - Visually count emojis on each page
   - Dashboard: 0-2 (functional category icons exempt)
   - Auth pages: 0
   - Reflection flow: 0 (category selection icons exempt)

5. **Auth pages:**
   - Password toggle uses SVG icon (not emoji)
   - "Free Forever" badge is gone
   - Sign-in and sign-up look identical

6. **Continuous animations:**
   - Open browser DevTools Performance tab
   - Record for 5 seconds on dashboard
   - Should see NO continuous animation frames (only on interaction)

**Coverage target:** 100% of modified components tested manually

### Potential Split Strategy

**HIGH complexity justifies sub-builders:**

**Sub-Builder 2A: Glass Components & Animations (3-4 hours)**
- Update lib/animations/variants.ts
- Simplify GlassCard, GlowButton, GlowBadge
- Delete decorative CSS animations
- Update useStaggerAnimation
- Test component library in isolation

**Sub-Builder 2B: Emoji Removal (2-3 hours)**
- Create DreamCategoryIcon, DreamStatusIcon components
- Create PasswordToggle component
- Remove all button/badge/header emojis
- Update tone selectors (remove emoji, add color)
- Test emoji count on all pages

**Dependencies:**
- 2B can start in parallel with 2A (independent work)
- Both must complete before Builder-3 starts

**Recommendation:** If single builder, allocate 5-6 hours. If splitting, use 2 sub-builders (cleaner separation).

---

## Builder-3: Clear Copy + Integration

### Scope

Replace 47 instances of marketing speak with clear, honest copy across landing, auth, dashboard, and reflection pages. Update all user-facing strings to match vision ("Reflect. Understand. Evolve."). Validate entire iteration against success criteria. Perform integration testing across all user flows.

### Complexity Estimate

**MEDIUM**

**Reasoning:**
- 47 copy instances to update across 8 files
- Mostly simple string replacements (low technical complexity)
- Requires judgment calls on tone (medium complexity)
- Integration testing requires systematic validation
- Low risk (text changes unlikely to break functionality)

### Success Criteria

- [ ] Landing page tagline: "Reflect. Understand. Evolve." (exact vision quote)
- [ ] Auth pages: "Welcome Back" and "Create Account" (no spiritual taglines)
- [ ] Dashboard greeting: "Good [time], [Name]" (no mysticism)
- [ ] Dashboard welcome messages: Data-driven (no flowery language)
- [ ] Reflection placeholders: Direct questions (no "calls to your soul")
- [ ] Button text: Action-oriented (no marketing verbs)
- [ ] Zero instances of forbidden words: "sacred," "journey," "consciousness," "unlock," "reveal"
- [ ] Auth pages have identical styling (validated)
- [ ] All pages pass emoji count limit (max 2 decorative)
- [ ] Full user flow works: Sign in → Dashboard → Reflect → View reflection
- [ ] Test: Ahiya reads copy and feels it's grounded and trustworthy

### Files to Create

No new files - all modifications to existing components.

### Files to Modify

**Landing Page (CRITICAL):**

1. `components/portal/hooks/usePortalState.ts` (Lines 214-247)
   - Line 214: "Your dreams hold the mirror..." → "Reflect. Understand. Evolve."
   - Line 215: "Start completely free. 90-second guided setup." → "Free to start."
   - Line 224: "Dream without limits. Reflect without bounds." → "Unlimited reflections."
   - Line 231: "Which dream calls to you in this moment?" → "Which dream will you reflect on?"
   - Line 238: "Your dreams deserve deeper exploration." → "Monthly limit reached."
   - Remove all "journey," "sacred," "consciousness" language

**Auth Pages (HIGH PRIORITY):**

2. `app/auth/signin/page.tsx`
   - Line 142: Remove "Continue your journey of self-discovery" subheading
     - Replace with "Sign in to your account" OR remove entirely
   - Line 214: "Continue Your Journey" → "Sign In"
   - Line 228: "✨ Begin your journey" → "Create account"

3. `app/auth/signup/page.tsx`
   - Line 112: Remove "Start your journey of self-discovery" subheading
     - Replace with "Get started with Mirror of Dreams" OR remove entirely
   - Line 264: "Create Free Account" → "Create Account"
   - Badge already removed by Builder-2

**Dashboard (HIGH PRIORITY):**

4. `components/dashboard/shared/WelcomeSection.tsx`
   - Already simplified by Builder-1 (greeting logic)
   - Validate no marketing messages remain
   - Ensure only data-driven messages if any

5. `components/dashboard/cards/ReflectionsCard.tsx`
   - Line 36: "Your Journey Awaits" → "No reflections yet"
   - Line 37: "...begin seeing yourself clearly" → "...to get started"
   - Line 40: "Start Reflecting" → "Create Reflection"
   - Line 49: "Loading your journey..." → "Loading reflections..."

6. `components/dashboard/cards/EvolutionCard.tsx`
   - Lines 118-119: "...deep patterns in your consciousness journey" → "...based on your reflections"
   - Lines 129-130: "Each reflection adds depth to your journey" → "...to generate an evolution report"

**Reflection Flow (MEDIUM PRIORITY):**

7. `app/reflection/MirrorExperience.tsx`
   - Line 158: "Describe the vision that calls to your soul..." → "Describe your dream in detail..."
   - Line 172: "Describe how you want to relate to this aspiration..." → "Describe your relationship with this dream..."
   - Line 405: "How shall the mirror speak to you?" → "Select the tone for your AI reflection."
   - Line 409: "Sacred Fusion" → "Fusion"
   - Line 409 description: "Balanced wisdom and warmth" → "Balanced and thoughtful"
   - Line 411: "Luminous Intensity" → "Intense"
   - Line 411 description: "Direct and transformative" → "Direct and challenging"
   - Line 471: "🪞 Gaze into the Mirror" → "Submit Reflection"
   - Line 487: "Revealing your reflection..." → "Loading reflection..."
   - Line 523: "Create New Reflection" (emoji already removed by Builder-2)

**Other Pages (LOW PRIORITY - if time allows):**

8. `app/page.tsx` (Landing page root)
   - Validate taglines match vision
   - Update any marketing copy in hero section

### Dependencies

**Depends on:**
- Builder-1 (dashboard simplification)
- Builder-2 (emoji removal, animation cleanup)

**Blocks:** None (final builder)

### Implementation Notes

#### Copy Update Strategy

**Systematic approach:**
1. Landing page first (first impression)
2. Auth pages second (entry points)
3. Dashboard third (main experience)
4. Reflection flow fourth (core interaction)
5. Dashboard cards last (supporting elements)

**After each file:**
- Grep for forbidden words to ensure nothing missed
- Visual review of page to verify copy makes sense in context

#### Forbidden Words Validation

**Use grep after each update:**
```bash
# Find forbidden words
rg -i "sacred|consciousness|journey|mystical|unlock|reveal|embrace|embark|weaving" app/

# Find marketing phrases
rg "self-discovery|inner landscape|deep wisdom|transformation" app/

# Find "calls to you" pattern
rg "calls to|speaks to" app/
```

#### Button Text Standards

**Follow pattern:** `[Action] [Object]`

**Examples:**
- "Sign In" (not "Continue Your Journey")
- "Create Account" (not "Begin Your Journey")
- "Reflect Now" (not "Gaze into the Mirror")
- "Submit Reflection" (not "Reveal Your Insights")
- "View Reports" (not "Unlock Your Evolution")
- "Create Dream" (not "Embark on New Dream")

#### Auth Page Consistency

**Validation checklist:**
- [ ] Both pages use same button component
- [ ] Both pages use same layout (spacing, alignment)
- [ ] Both pages use same error handling UI
- [ ] Both pages use same PasswordToggle component (SVG, not emoji)
- [ ] Neither page has "Free Forever" badge
- [ ] Neither page has spiritual taglines

**Visual diff:**
- Open sign-in and sign-up side-by-side
- Compare spacing, button sizes, input styling
- Should look nearly identical (only content differs)

#### Integration Testing

**Full user flow validation:**

1. **Sign In Flow:**
   - Navigate to /auth/signin
   - Verify heading: "Welcome Back"
   - Verify NO subheading with "journey" language
   - Verify button: "Sign In"
   - Verify password toggle is SVG icon (not emoji)
   - Enter credentials: ahiya.butman@gmail.com / mirror-creator
   - Click "Sign In"
   - Should redirect to /dashboard

2. **Dashboard:**
   - Verify greeting: "Good [time], Ahiya"
   - Verify "Reflect Now" button is large and emoji-free
   - Verify usage display: "X/Y reflections this month"
   - Verify max 2 emojis on page (functional category icons only)
   - Verify no mystical welcome messages

3. **Reflection Flow:**
   - Click "Reflect Now"
   - Verify question placeholders are direct (no "soul" language)
   - Verify tone selectors use colored borders (no emojis)
   - Verify submit button: "Submit Reflection"
   - Fill out form and submit
   - Verify loading text: "Loading reflection..."
   - View reflection output
   - Verify "Create New Reflection" button (no emoji)

4. **Sign Up Flow (if testing new user):**
   - Navigate to /auth/signup
   - Verify NO "Free Forever" badge
   - Verify heading: "Create Account"
   - Verify button: "Create Account"
   - Verify password toggle is SVG

**Error cases:**
- Test invalid login: Error message should be clear (not mystical)
- Test empty form submission: Validation messages should be direct

### Testing Requirements

**Copy Validation:**
```bash
# Verify vision tagline
rg "Reflect\. Understand\. Evolve\." app/

# Verify NO forbidden words
rg -i "sacred|consciousness|journey|mystical|unlock|reveal|embrace|embark" app/
# Should return 0 results in user-facing strings

# Verify button text patterns
rg "Sign In|Create Account|Reflect Now|Submit Reflection|View Reports" app/
```

**Emoji Validation:**
```bash
# Count emojis per page
rg -o "[\u{1F000}-\u{1F9FF}]" app/dashboard/page.tsx | wc -l  # 0-2
rg -o "[\u{1F000}-\u{1F9FF}]" app/auth/signin/page.tsx | wc -l  # 0
rg -o "[\u{1F000}-\u{1F9FF}]" app/auth/signup/page.tsx | wc -l  # 0
```

**Visual Validation:**
- [ ] Landing page tagline visible: "Reflect. Understand. Evolve."
- [ ] Auth pages identical in styling
- [ ] Dashboard greeting is simple and clear
- [ ] Reflection questions are direct
- [ ] All button text is action-oriented
- [ ] No marketing speak visible anywhere

**Functional Validation:**
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] "Reflect Now" navigates to reflection page
- [ ] Reflection submission works
- [ ] View reflection output works
- [ ] Sign out works

**Coverage target:** 100% of user flows tested end-to-end

### Potential Split Strategy

**NOT RECOMMENDED** - Task is cohesive and medium complexity.

If absolutely necessary:

**Sub-Builder 3A: Copy Updates (2 hours)**
- Update all 47 copy instances
- Validate forbidden words removed
- Visual review of each page

**Sub-Builder 3B: Integration Testing (1 hour)**
- Test full user flow
- Validate emoji counts
- Verify auth page consistency

**Recommendation:** Single builder (2-3 hours total). Splitting creates unnecessary overhead for straightforward task.

---

## Builder Execution Order & Dependencies

### Recommended: Sequential Execution

**Iteration Timeline:**

1. **Builder-1: Dashboard Simplification (3-4 hours)**
   - Start: Day 1, Hour 0
   - End: Day 1, Hour 4
   - Deliverable: Simplified dashboard with clear hierarchy

2. **Builder-2: Remove Flash (5-6 hours)**
   - Start: Day 1, Hour 4 (after Builder-1 complete)
   - End: Day 1, Hour 10
   - Deliverable: No emojis/animations, visual consistency

3. **Builder-3: Clear Copy + Integration (2-3 hours)**
   - Start: Day 1, Hour 10 (after Builder-2 complete)
   - End: Day 1, Hour 13
   - Deliverable: Clear copy, validated iteration

**Total: 10-13 hours (single day if focused, 2 days if relaxed)**

### Alternative: Parallel Execution with Coordination

**Parallel Timeline:**

**Day 1:**
- Builder-1: Dashboard Simplification (3-4 hours)
- Builder-2A: Glass Components & Animations (3-4 hours, parallel)
- **Risk:** Potential style conflicts if both touch same components

**Day 2:**
- Builder-2B: Emoji Removal (2-3 hours)
- Builder-3: Clear Copy (2-3 hours, parallel)
- **Risk:** Emoji removal might conflict with copy updates

**Not recommended unless time-critical.** Sequential execution avoids conflicts and maintains consistency.

---

## Integration Notes

### Shared Components

**Glass components modified by Builder-2 affect:**
- Dashboard (Builder-1's work)
- Auth pages (Builder-3's work)
- Reflection flow (Builder-3's work)

**Resolution:** Builder-2 updates components, other builders automatically benefit.

### Copy + Emoji Interaction

**Example conflict:**
- Builder-2 removes ✨ from "Reflect Now" button
- Builder-3 updates button text
- Both touching same line

**Resolution:** Builder-2 completes first, Builder-3 sees updated button and only changes text.

### Style Consistency

**Builder-1 establishes patterns:**
- Simple greeting format
- Restrained button styling
- Clear visual hierarchy

**Builder-2 follows patterns:**
- No emoji in buttons (consistent with Builder-1's "Reflect Now")
- Simple hover states (consistent with restrained design)

**Builder-3 validates patterns:**
- All copy matches restrained tone
- No decorative elements sneak back in

---

## Validation Checklist (All Builders)

**Before marking iteration complete:**

### Visual Validation
- [ ] Dashboard has ONE clear primary action ("Reflect Now")
- [ ] Greeting is "Good [time], [Name]" (no mysticism)
- [ ] Maximum 2 decorative emojis per page (functional icons exempt)
- [ ] No pop-up or bounce animations on any button
- [ ] Auth pages look identical (button, layout, spacing)
- [ ] "Free Forever" badge is gone
- [ ] Landing page says "Reflect. Understand. Evolve."

### Copy Validation
- [ ] Zero instances of "sacred," "journey," "consciousness"
- [ ] Button text is action-oriented (no marketing verbs)
- [ ] Reflection questions are direct (no "soul" language)
- [ ] Welcome messages are data-driven (no flowery language)

### Animation Validation
- [ ] No scale effects on hover/tap (check multiple buttons)
- [ ] No continuous breathing/pulsing on foreground elements
- [ ] Page transitions are smooth 300ms fade
- [ ] Dashboard cards appear with subtle stagger (not slow)

### Functional Validation
- [ ] Sign in flow works
- [ ] Dashboard loads correctly
- [ ] Reflect Now navigates to reflection page
- [ ] Reflection submission works
- [ ] View reflection output works
- [ ] All buttons clickable and responsive

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] No broken imports
- [ ] All modified files properly formatted

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader compatible (test key flows)
- [ ] Color contrast meets WCAG AA

---

## Post-Iteration Recommendations

**After iteration 2 complete:**

1. **Document Earned Beauty Guidelines**
   - Create `.2L/plan-4/earned-beauty-guidelines.md`
   - Define what makes beauty "earned" vs "decorative"
   - Use as reference for future development

2. **Create Voice & Tone Guide**
   - Document forbidden words and approved patterns
   - Include button text standards
   - Share with future developers

3. **Consider Visual Regression Testing**
   - Snapshot dashboard before/after
   - Helps catch unintended changes in future

4. **Plan Evolution/Visualization Card Improvements**
   - Currently these cards are lower priority
   - After restraint established, revisit with same patterns

5. **Evaluate Animation Performance**
   - Measure CPU usage before/after
   - Validate improvement from removing continuous animations

---

**Builder Tasks Status:** READY FOR ASSIGNMENT
**Recommended Order:** Sequential (Builder-1 → Builder-2 → Builder-3)
**Alternative:** Parallel with sub-builders (coordinate carefully)
**Total Effort:** 10-13 hours
**Validation:** Use checklists above + explorer reports
