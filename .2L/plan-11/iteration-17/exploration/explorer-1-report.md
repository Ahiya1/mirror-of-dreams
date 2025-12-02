# Explorer 1 Report: Current Reflection Architecture

## Executive Summary

The MirrorExperience.tsx is a 1007-line monolithic component that manages the complete reflection flow. It currently displays all 4 questions on a single page with vertical scrolling - the opposite of the mobile step-by-step experience we need. The component has clean state management, established tRPC patterns, and reusable sub-components, but the core UI structure needs transformation for mobile. The foundation from Iteration 16 (bottom nav, safe areas, haptics, scroll direction) is ready to support this work.

## Discoveries

### MirrorExperience.tsx Analysis

**Location:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/app/reflection/MirrorExperience.tsx`
**Lines:** 1007

**State Management:**
```typescript
// Key states (lines 72-83)
const [viewMode, setViewMode] = useState<ViewMode>(initialMode);           // 'questionnaire' | 'output'
const [selectedDreamId, setSelectedDreamId] = useState<string>(dreamIdFromUrl || '');
const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
const [isSubmitting, setIsSubmitting] = useState(false);
const [statusText, setStatusText] = useState('Gazing into the mirror...');
const [mirrorGlow, setMirrorGlow] = useState(false);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
```

**FormData Interface (lines 22-27):**
```typescript
interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}
```

**Component Flow:**
1. **Dream Selection View** (lines 424-501): Displayed when no dream is selected
2. **One-Page Form** (lines 503-596): All 4 questions + tone selection shown vertically
3. **Output View** (lines 602-654): AI response display after submission
4. **Loading Overlay** (lines 658-703): Full-screen "gazing" animation

**Current Question Display (lines 542-557):**
```typescript
{/* All 4 Questions with enhanced sacred styling */}
<div className="questions-container">
  {questions.map((question) => (
    <ReflectionQuestionCard
      key={question.id}
      questionNumber={question.number}
      totalQuestions={4}
      questionText={question.text}
      guidingText={question.guide}
      placeholder={question.placeholder}
      value={formData[question.id]}
      onChange={(value) => handleFieldChange(question.id, value)}
      maxLength={question.limit}
    />
  ))}
</div>
```

### Dream Selection Implementation

**Current Pattern (lines 432-500):**
- Dreams fetched via tRPC: `trpc.dreams.list.useQuery({ status: 'active', includeStats: true })`
- Displayed as clickable GlassCard components
- Category emojis for visual identity
- Selection shows checkmark indicator
- Links from URL param: `dreamIdFromUrl = searchParams.get('dreamId')`

**Dream Interface (lines 29-36):**
```typescript
interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}
```

### Tone Selection Implementation

**Current Pattern (lines 559-565):**
- Uses `ToneSelectionCard` component (172 lines)
- Grid layout: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Three tones: 'fusion', 'gentle', 'intense'
- Visual cards with icons, names, descriptions
- Framer Motion for hover effects: `whileHover`, `whileTap`

### Gazing Loading State (lines 658-703)

**Implementation:**
```typescript
{isSubmitting && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg"
  >
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <CosmicLoader size="lg" />
    </motion.div>
    <motion.div className="text-center space-y-2">
      <p className="text-white/90 text-xl font-light">{statusText}</p>
      <p className="text-white/60 text-sm">This may take a few moments</p>
    </motion.div>
  </motion.div>
)}
```

**Status Text Progression (lines 186-192):**
```typescript
setStatusText('Gazing into the mirror...');
setTimeout(() => {
  setStatusText('Crafting your insight...');
}, 3000);
```

### tRPC Mutation (lines 104-118)

```typescript
const createReflection = trpc.reflection.create.useMutation({
  onSuccess: (data) => {
    setStatusText('Reflection complete!');
    setMirrorGlow(true);
    setTimeout(() => {
      router.push(`/reflection?id=${data.reflectionId}`);
      setViewMode('output');
    }, 1000);
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`);
    setIsSubmitting(false);
  },
});
```

**Mutation Input Schema (from types/schemas.ts lines 56-64):**
```typescript
export const createReflectionSchema = z.object({
  dreamId: z.string().uuid(),
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});
```

### Textarea/Input Configuration

**GlassInput Component (222 lines):**
- Uses Framer Motion for focus animations
- Word/character counter with color states
- Default textarea rows: 5
- Focus glow animation via `inputFocusVariants`
- No native keyboard handling
- No scroll-into-view behavior

**ReflectionQuestionCard Usage:**
```typescript
<GlassInput
  variant="textarea"
  value={value}
  onChange={onChange}
  placeholder={placeholder}
  maxLength={maxLength}
  showCounter={true}
  counterMode="words"
  rows={6}
  className="w-full"
/>
```

## Patterns Identified

### Pattern 1: ViewMode State Machine
**Description:** Component uses simple string union for view states
**Current:** `type ViewMode = 'questionnaire' | 'output'`
**For Mobile:** Need to extend to `'dreamSelect' | 'questions' | 'tone' | 'loading' | 'output'`
**Recommendation:** Create step-based state machine with forward/back navigation

### Pattern 2: Form Data Preservation
**Description:** All form data stored in single `formData` state object
**Current:** `useState<FormData>({ dream: '', plan: '', relationship: '', offering: '' })`
**For Mobile:** This pattern works well for step navigation - data persists between steps
**Recommendation:** Reuse this pattern, add localStorage backup for session recovery

### Pattern 3: Question Array Structure
**Description:** Questions defined as array with consistent interface
**Current (lines 204-237):**
```typescript
const questions = [
  { id: 'dream', number: 1, text: '...', guide: '...', placeholder: '...', limit: QUESTION_LIMITS.dream },
  // ... 3 more
];
```
**Recommendation:** Perfect for step-by-step iteration - use `currentStep` index

### Pattern 4: Tone-Based Ambient Effects
**Description:** Background decorations change based on selected tone
**Current (lines 350-392):** Fusion breath, gentle stars, intense swirl animations
**For Mobile:** Keep but simplify - reduce particle count for performance
**Recommendation:** Enable/disable based on `prefers-reduced-motion`

## Complexity Assessment

### High Complexity: Mobile Reflection Wizard
**Why:** Core UI paradigm shift from vertical scroll to step-by-step
**Components Needed:**
- Full-screen step container with swipe gestures
- Progress dots component
- Keyboard-aware positioning
- Exit confirmation modal
- Step transition animations

**Estimated Effort:** Major new component (~400-500 lines)

### Medium Complexity: Dream Selection Bottom Sheet
**Why:** Transform list into swipeable bottom sheet
**Components Needed:**
- BottomSheet wrapper component
- Dream list with large touch targets (60px+)
- Swipe-to-dismiss gesture handling

**Estimated Effort:** New BottomSheet component (~150-200 lines)

### Low Complexity: Enhanced Gazing State
**Why:** Mostly enhancement of existing loading overlay
**Changes Needed:**
- Additional status text transitions
- Mobile-optimized animation sizing

**Estimated Effort:** Modify existing (~30-50 lines)

## Technology Recommendations

### Primary Patterns

**State Management:**
- Use React Context for wizard state (not Redux - overkill)
- Pattern: `ReflectionWizardContext` with step, formData, navigation functions

**Gesture Handling:**
- Framer Motion `useDragControls` for swipe navigation
- `drag="x"` with `dragConstraints` for step transitions
- Existing `bottomNavVariants` pattern for show/hide

**Keyboard Handling:**
- CSS approach: `pb-[env(keyboard-inset-height, 0px)]` where supported
- JS fallback: `visualViewport` API for resize detection
- Scroll into view on focus with slight delay

### Component Architecture

**Recommended Structure:**
```
/components/reflection/mobile/
  MobileReflectionFlow.tsx      // Main container, conditional render
  ReflectionWizardContext.tsx   // State management
  ProgressDots.tsx              // Step indicator
  QuestionStep.tsx              // Individual question screen
  ToneStep.tsx                  // Tone selection screen
  DreamBottomSheet.tsx          // Dream picker

/components/ui/mobile/
  BottomSheet.tsx               // Reusable bottom sheet
```

## Integration Points

### With Iteration 16 Foundation

**Ready to Use:**
- `useScrollDirection` hook: Hide nav during reflection
- `haptic()` utility: Feedback on step transitions
- `bottomNavVariants`: Animation pattern for bottom sheet
- Safe area CSS variables: `--safe-area-bottom`, `--safe-area-top`

**Integration Pattern:**
```typescript
// Hide bottom nav during full-screen reflection
const isReflectionActive = viewMode !== 'output';
// In layout: {!isReflectionActive && <BottomNavigation />}
```

### With MirrorExperience.tsx

**Conditional Rendering:**
```typescript
// In MirrorExperience.tsx
const isMobile = useIsMobile(); // Need to create this hook

if (isMobile && viewMode === 'questionnaire') {
  return <MobileReflectionFlow 
    dreams={dreams}
    selectedDreamId={selectedDreamId}
    onDreamSelect={handleDreamSelect}
    formData={formData}
    onFieldChange={handleFieldChange}
    selectedTone={selectedTone}
    onToneSelect={setSelectedTone}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
    statusText={statusText}
  />;
}

// Desktop path unchanged
return (/* existing JSX */);
```

### With tRPC

**No Changes Needed:**
- `trpc.dreams.list.useQuery` works as-is
- `createReflection.mutate()` works as-is
- Just pass same data from mobile flow

## Risks & Challenges

### Technical Risks

**Keyboard Handling on iOS Safari:**
- Impact: HIGH - iOS viewport behavior is complex
- Mitigation: Use `visualViewport` API, test on real devices
- Fallback: Scroll-into-view on focus

**Gesture Conflicts:**
- Impact: MEDIUM - Swipe navigation vs. scroll in textarea
- Mitigation: Disable swipe when textarea is focused
- Pattern: `onFocus={() => setSwipeEnabled(false)}`

**Animation Performance:**
- Impact: LOW-MEDIUM - Many concurrent animations on step change
- Mitigation: Use `will-change: transform`, reduce particle count on mobile

### UX Risks

**Form Data Loss:**
- Impact: HIGH - User loses answers on accidental exit
- Mitigation: Exit confirmation modal, localStorage persistence
- Pattern: `beforeunload` event + confirm dialog

**Step Navigation Confusion:**
- Impact: MEDIUM - Users might not realize they can swipe
- Mitigation: Visual hints (arrows), onboarding pulse on first use

## Recommendations for Planner

1. **Create useIsMobile Hook First**
   - Essential for conditional rendering
   - Simple: `window.innerWidth < 768`
   - Already have pattern from bottom nav

2. **Build BottomSheet Component Before MobileReflectionFlow**
   - Reusable for dream selection and other features
   - Test swipe-to-dismiss independently
   - Establish gesture handling patterns

3. **Keep Desktop Path Unchanged**
   - Conditional render at top of MirrorExperience
   - Mobile components are additive, not replacement
   - Zero desktop regression risk

4. **Test Keyboard Handling Early**
   - This is the biggest unknown
   - Create simple proof-of-concept with single textarea
   - Test on real iOS and Android devices

5. **Consider Step State Persistence**
   - If user backgrounds app, preserve state
   - `localStorage` + `useEffect` on mount
   - Pattern: `STORAGE_KEYS.FORM_STATE` already exists in constants

## Resource Map

### Critical Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `/app/reflection/MirrorExperience.tsx` | Main component | Add mobile conditional render |
| `/app/layout.tsx` | Root layout | Hide bottom nav during reflection |
| `/lib/animations/variants.ts` | Animation definitions | Add step transition variants |

### New Components Needed

| File | Purpose | Estimated Lines |
|------|---------|-----------------|
| `/components/ui/mobile/BottomSheet.tsx` | Reusable sheet | 150-200 |
| `/components/reflection/mobile/MobileReflectionFlow.tsx` | Mobile wizard | 400-500 |
| `/components/reflection/mobile/ProgressDots.tsx` | Step indicator | 50-80 |
| `/components/reflection/mobile/QuestionStep.tsx` | Question screen | 100-150 |
| `/lib/hooks/useIsMobile.ts` | Breakpoint hook | 30-40 |

### Existing Components to Reuse

| Component | Location | Use Case |
|-----------|----------|----------|
| `GlassInput` | `/components/ui/glass/GlassInput.tsx` | Textarea in steps |
| `GlassCard` | `/components/ui/glass/GlassCard.tsx` | Container styling |
| `CosmicLoader` | `/components/ui/glass/` | Loading state |
| `ToneSelectionCard` | `/components/reflection/ToneSelectionCard.tsx` | Tone step (may need mobile variant) |

### Dependencies from Iteration 16

| Resource | Location | Status |
|----------|----------|--------|
| `useScrollDirection` | `/lib/hooks/useScrollDirection.ts` | Ready |
| `haptic()` | `/lib/utils/haptics.ts` | Ready |
| `bottomNavVariants` | `/lib/animations/variants.ts` | Ready |
| Safe area variables | `/styles/variables.css` | Ready |
| `BottomNavigation` | `/components/navigation/BottomNavigation.tsx` | Ready |

## Questions for Planner

1. **Exit Confirmation:** Should we implement localStorage persistence (more robust) or just show a confirmation dialog (simpler)?

2. **Dream Creation Inline:** The vision mentions "Quick Create Dream option at bottom" of bottom sheet. Should this be a full form or just title input with minimal fields?

3. **Tone Selection Sizing:** Current `ToneSelectionCard` uses 3-column grid. For mobile, should we:
   - Stack vertically (3 rows)?
   - Use horizontal scroll?
   - Simplify to compact buttons?

4. **Navigation During Reflection:** Should we completely hide all navigation (immersive) or keep a minimal "X" close button?

5. **Step Transition Direction:** Vision says "swipe left to advance, swipe right to go back". Should we also support tap navigation (Next/Back buttons) for users who don't discover swipe?

---

**Report Generated:** 2025-12-02
**Explorer:** Explorer-1 (Current Reflection Architecture)
**Iteration:** 17 (Full-Screen Reflection Experience)
