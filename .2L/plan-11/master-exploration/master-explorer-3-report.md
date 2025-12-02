# Master Exploration Report

## Explorer ID
master-explorer-3

## Focus Area
User Experience & Integration Points (Reflection Flow Focus)

## Vision Summary
Transform Mirror of Dreams from a "responsive desktop" experience to a mobile-first application, with particular emphasis on creating an immersive, full-screen step-by-step reflection flow that feels native to touch devices.

---

## Current Reflection Experience Analysis

### Current Implementation Overview

The reflection flow is implemented in `/app/reflection/MirrorExperience.tsx` (1007 lines) as a single-page experience with two main states:

1. **Questionnaire Mode** - User answers 4 questions and selects tone
2. **Output Mode** - User views AI-generated reflection response

**Key Finding:** The current implementation shows ALL 4 questions on a single scrollable page, which contradicts the vision's goal of "one question per screen."

### Current Question Flow Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ReflectionQuestionCard` | `/components/reflection/ReflectionQuestionCard.tsx` | Displays individual question with textarea |
| `ToneSelectionCard` | `/components/reflection/ToneSelectionCard.tsx` | Grid of 3 tone options |
| `ProgressBar` | `/components/reflection/ProgressBar.tsx` | Visual step indicator |
| `GlassInput` | `/components/ui/glass/GlassInput.tsx` | Enhanced textarea with word counter |

### Current Form Data Structure

```typescript
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}
```

### Current Dream Selection

Dream selection is currently handled inline within the MirrorExperience component:
- Uses a scrollable list of `GlassCard` components
- Click/tap to select
- Shows category emoji and days remaining
- No bottom sheet implementation exists

### Current Loading/Gazing State

The "gazing" loading state (lines 658-703 of MirrorExperience.tsx) uses:
- Full-screen overlay with backdrop blur
- `CosmicLoader` component (spinning gradient ring)
- Animated status text that changes after 3 seconds
- Breathing animation on the loader
- Fixed positioning over entire viewport

**Current Code Pattern:**
```tsx
{isSubmitting && (
  <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg">
    <CosmicLoader size="lg" />
    <p className="text-white/90 text-xl font-light">{statusText}</p>
  </motion.div>
)}
```

---

## Dashboard Analysis

### Current Dashboard Layout

The dashboard (`/app/dashboard/page.tsx`) uses a 2-column grid on desktop that collapses to single column on mobile:

**Current Grid Configuration (DashboardGrid.module.css):**
```css
grid-template-columns: repeat(2, 1fr);  /* Desktop */
grid-template-columns: 1fr;             /* Mobile < 1024px */
```

### Dashboard Cards Inventory

| Card | Component | Data Needs | Priority |
|------|-----------|------------|----------|
| Hero/Welcome | `DashboardHero.tsx` | User name, time of day | Primary |
| Dreams | `DreamsCard.tsx` | Active dreams list, limits | Primary |
| Reflections | `ReflectionsCard.tsx` | Recent 3 reflections | Primary |
| Progress Stats | `ProgressStatsCard.tsx` | Usage statistics | Secondary |
| Evolution | `EvolutionCard.tsx` | Evolution report data | Tertiary |
| Visualization | `VisualizationCard.tsx` | Visualization data | Tertiary |
| Subscription | `SubscriptionCard.tsx` | Tier, upgrade info | Tertiary |

### Vision Requirements for Dashboard

Per the vision document:
- Hero section: Compact greeting + prominent "Reflect Now" CTA
- Quick stats strip: Horizontal scroll of key metrics
- Primary action cards: Dreams + Reflections only (most important)
- Secondary content: Collapsible or accessible via horizontal scroll/tabs
- **Remove or relocate:** Evolution, Visualization, Subscription cards (move to dedicated pages/profile)

---

## Form Handling Analysis

### Current Input Behavior

The `GlassInput` component (`/components/ui/glass/GlassInput.tsx`) provides:

**Existing Features:**
- Focus state management with `isFocused` state
- Character/word counting with color transitions
- Error state shake animation
- Password toggle support
- Framer Motion animations for focus glow

**Missing Mobile Features (per vision):**
- No auto-scroll when keyboard appears
- No sticky submit button positioning
- No explicit keyboard handling
- Standard 5 rows default (not optimized for mobile)

### Current Touch Handling

**Found in ToneSelectionCard.tsx:**
```tsx
whileHover={{ boxShadow: ..., y: -2 }}
whileTap={{ scale: 0.98 }}
```

**Issue:** Uses `whileHover` which doesn't translate to mobile. Need `:active` equivalents.

### Form Progress Persistence

**Current State:** Form data is stored in React state only (`useState`). No persistence mechanism exists for:
- Recovering from app backgrounding
- Preventing data loss on navigation
- Resuming incomplete reflections

---

## Transformation Requirements Analysis

### Full-Screen Reflection: What Needs to Change

| Current State | Required State | Complexity |
|--------------|----------------|------------|
| All 4 questions visible | One question per screen | HIGH |
| Inline dream selection | Bottom sheet component | MEDIUM |
| Basic loading overlay | Immersive gazing animation | MEDIUM |
| Tone alongside questions | Dedicated tone step | LOW |
| No swipe navigation | Swipe between questions | MEDIUM |
| No exit confirmation | Prompt on unsaved changes | LOW |
| Static progress bar | Interactive step indicator | LOW |

### Step-by-Step Wizard Implementation Requirements

**New State Structure Needed:**
```typescript
interface WizardState {
  currentStep: number;           // 0=dream, 1-4=questions, 5=tone, 6=submit
  totalSteps: number;            // 6 or 7 depending on design
  formData: FormData;
  selectedDreamId: string;
  selectedTone: ToneId;
  isDirty: boolean;              // For exit confirmation
  direction: 'forward' | 'back'; // For animation direction
}
```

**Required Components:**
1. `MobileReflectionWizard` - New wrapper component
2. `StepTransition` - Animated step transitions (slide/fade)
3. `DreamSelectionSheet` - New bottom sheet for dream selection
4. `GazingExperience` - Enhanced loading animation
5. `ExitConfirmation` - Modal for unsaved changes

### Animation Requirements

**Framer Motion patterns needed:**
- Horizontal slide transitions between questions
- Swipe gesture detection (`useDrag` or `PanInfo`)
- Bottom sheet spring animations
- Progress indicator animations

**Example Transition Pattern:**
```tsx
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};
```

---

## Navigation Analysis

### Current Navigation Structure

**AppNavigation.tsx Features:**
- Fixed top navigation bar
- Desktop: Horizontal link tabs
- Mobile: Hamburger menu with slide-down animation
- User dropdown menu
- No bottom navigation exists

### Required Changes for Mobile-First

1. **New Component:** `BottomNavigation`
   - Fixed position at bottom
   - 4-5 tabs: Home, Dreams, Reflect, Evolution, Profile
   - Active state animation
   - Hide on scroll down, reveal on scroll up
   - Safe area padding for notched devices

2. **Conditional Rendering:**
   ```tsx
   // Show bottom nav on mobile only
   {isMobile && <BottomNavigation />}
   // Keep top nav on desktop
   {!isMobile && <AppNavigation />}
   ```

---

## User Flow Integration Points

### Critical User Journey: Morning Reflection Flow

**Current Flow (10+ taps):**
1. Open app -> Dashboard
2. See "Reflect Now" CTA -> Tap
3. See dream list (inline) -> Scroll and tap
4. See all 4 questions (cramped) -> Scroll and fill each
5. Scroll to tone selection -> Tap
6. Scroll to submit -> Tap "Gaze into Mirror"
7. Wait for loading
8. View response

**Target Flow (per vision, ~7 taps):**
1. Open app -> Dashboard with prominent CTA
2. Tap "Reflect Now"
3. Bottom sheet slides up -> Tap dream
4. Full-screen Question 1 -> Type, swipe right
5. Question 2 -> Type, swipe right
6. Question 3 -> Type, swipe right
7. Question 4 -> Type, swipe right
8. Tone selection (full screen) -> Tap choice
9. Tap "Gaze into Mirror"
10. Immersive loading
11. Full-screen response

### API Integration Points

**Existing tRPC endpoints used:**
- `trpc.dreams.list.useQuery()` - Fetch active dreams
- `trpc.reflection.create.useMutation()` - Submit reflection
- `trpc.reflections.getById.useQuery()` - Fetch completed reflection

**No new API endpoints required** - This is purely frontend transformation.

---

## Modal Analysis

### Current GlassModal Implementation

Location: `/components/ui/glass/GlassModal.tsx`

**Current Features:**
- Focus trap (react-focus-lock)
- Escape key to close
- Backdrop blur overlay
- Max-width constraint (max-w-lg)
- Centered positioning

**Missing Mobile Features:**
- No full-screen mode on mobile
- No slide-up animation from bottom
- No swipe-to-dismiss

**Required Enhancement:**
```tsx
// Mobile-aware modal
<GlassModal
  isOpen={isOpen}
  onClose={onClose}
  fullScreenOnMobile={true}
  slideFrom="bottom"
  swipeToDismiss={true}
>
```

---

## Technical Complexity Assessment

### High Complexity Areas

1. **Step-by-step wizard state management**
   - Preserving form state across steps
   - Navigation between steps (including swipe)
   - Progress persistence (localStorage or server)
   - Exit confirmation logic

2. **Swipe gesture implementation**
   - Detecting horizontal swipe direction
   - Threshold handling
   - Integration with step transitions
   - Preventing interference with text selection in inputs

3. **Keyboard handling**
   - Detecting keyboard appearance (no native API)
   - Adjusting viewport or scrolling
   - Managing focus across step transitions

### Medium Complexity Areas

1. **Bottom sheet component**
   - Spring physics for natural feel
   - Snap points (collapsed, expanded)
   - Backdrop interaction
   - Performance on touch devices

2. **Bottom navigation bar**
   - Scroll-aware show/hide
   - Safe area padding
   - Active state management
   - Route-based highlighting

3. **Touch-optimized interactions**
   - Converting hover states to active states
   - Scale animations on tap
   - Haptic feedback (where supported)

### Low Complexity Areas

1. **Progress indicator enhancement**
2. **Exit confirmation modal**
3. **Full-screen modal mode**
4. **Enhanced loading animation**

---

## Recommendations for Implementation

### Iteration Phasing Suggestion

**Phase 1: Foundation Navigation (Iteration 1)**
- Bottom navigation component
- Navigation state management
- Safe area handling
- Keep existing reflection flow intact

**Phase 2: Reflection Flow Transformation (Iteration 2)**
- Step-by-step wizard component
- Dream selection bottom sheet
- Question transitions with swipe
- Enhanced gazing experience

**Phase 3: Polish & Dashboard (Iteration 3)**
- Mobile-optimized dashboard layout
- Touch-optimized cards
- Form improvements across app
- Modal full-screen treatment

### Critical Integration Points

1. **State Management:** Consider using Zustand or Context for wizard state (avoids prop drilling through step components)

2. **Animation Coordination:** Use Framer Motion's `AnimatePresence` with custom variants for consistent transitions

3. **Responsive Detection:** Create `useIsMobile()` hook using `matchMedia` for conditional rendering

4. **Form Persistence:** Implement `useEffect` with `localStorage` for auto-saving form progress

---

## Risk Assessment

### User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Swipe conflicts with text selection | HIGH | Implement gesture boundaries, only detect at screen edges |
| Keyboard covers input on iOS Safari | HIGH | Use CSS `env(safe-area-inset-bottom)` + scroll into view |
| Lost form data on navigation | MEDIUM | Auto-save to localStorage every keystroke |
| Animation jank on low-end devices | MEDIUM | Test on real devices, provide reduced-motion fallback |

### Integration Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing desktop experience | HIGH | Use responsive conditional rendering, not replacement |
| State desync between steps | MEDIUM | Single source of truth in wizard state |
| Accessibility regression | MEDIUM | Maintain focus management, screen reader support |

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| Components to modify | 8-10 |
| New components needed | 5-7 |
| CSS files affected | 4-5 |
| Estimated effort | 12-16 hours |
| Mobile breakpoint | 768px |
| Touch target size | 48px minimum |

---

*Exploration completed: 2025-12-02*
*This report informs master planning decisions for reflection flow and UX transformation*
