# Explorer 2 Report: UX Fixes & Component Dependencies Analysis

## Executive Summary

Iteration 3 focuses on critical UX improvements: reflection loading feedback, navigation padding fixes, and text readability enhancements. All required components (CosmicLoader, AppNavigation) are production-ready. The reflection flow needs loading state integration during form submission (3-5 second AI processing). Navigation is fixed at top (z-[100]) with ~76px height, causing content overlap on 5 pages. Reflection output text uses `text-white/95` with `line-height: 1.8`, meeting WCAG AA contrast but could benefit from slightly larger font size. All fixes are low-risk, isolated changes with clear integration points.

## Reflection Flow Analysis

### Current State

**File:** `app/reflection/MirrorExperience.tsx`

**Form Submission Flow:**
1. User fills 4 questions + selects tone
2. Clicks "Submit Reflection" button (line 450)
3. `handleSubmit()` validates form (lines 139-151)
4. `createReflection.mutate()` called (line 143)
5. **CURRENT:** Button shows inline loader: `<CosmicLoader size="sm" /> Creating...` (lines 457-461)
6. **PROBLEM:** No full-page immersive feedback during 3-5 second AI processing
7. `onSuccess` triggers router.push to output page (lines 76-82)

**Current Loading Indicators:**
- **Inline button loader:** CosmicLoader inside button (functional but minimal)
- **No overlay:** User still sees form, can scroll, unclear what's happening
- **No progress text:** No "Gazing into the mirror..." status messages

**Integration Points Identified:**

**Option A: Conditional Full-Page Overlay (RECOMMENDED)**
```tsx
// Line 53: Add state
const [isSubmitting, setIsSubmitting] = useState(false);

// Line 142-150: Update handleSubmit
const handleSubmit = () => {
  if (!validateForm()) return;
  setIsSubmitting(true);
  createReflection.mutate({...});
};

// Line 258-473: Add overlay before questionnaire/output views
{isSubmitting && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg">
    <CosmicLoader size="lg" />
    <motion.p 
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-white/90 text-xl"
    >
      Gazing into the mirror...
    </motion.p>
  </div>
)}
```

**Option B: Full-Page Route Loading (Alternative)**
- Replace router.push with state transition
- Show loading overlay, then fade to output view
- More complex, breaks browser back button behavior
- **NOT RECOMMENDED:** Violates Next.js routing patterns

### Loading State Integration Points

**RECOMMENDED APPROACH: Conditional Overlay**

**Changes Required:**
1. **State management** (line 53):
   ```tsx
   const [isSubmitting, setIsSubmitting] = useState(false);
   ```

2. **Submission handler** (line 142):
   ```tsx
   const handleSubmit = () => {
     if (!validateForm()) return;
     setIsSubmitting(true); // Show overlay
     createReflection.mutate({...});
   };
   ```

3. **Mutation callbacks** (update lines 75-87):
   ```tsx
   const createReflection = trpc.reflection.create.useMutation({
     onSuccess: (data) => {
       // Keep overlay visible during transition
       setMirrorGlow(true);
       setTimeout(() => {
         router.push(`/reflection?id=${data.reflectionId}`);
         // Overlay will unmount with component
       }, 1000);
     },
     onError: (error) => {
       toast.error(`Error: ${error.message}`);
       setIsSubmitting(false); // Hide overlay on error
     },
   });
   ```

4. **Overlay component** (add before line 258):
   ```tsx
   {/* Loading Overlay */}
   <AnimatePresence>
     {isSubmitting && (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg"
       >
         <CosmicLoader size="lg" />
         <motion.div
           className="text-center space-y-2"
           animate={{ opacity: [0.7, 1, 0.7] }}
           transition={{ duration: 2, repeat: Infinity }}
         >
           <p className="text-white/90 text-xl font-light">
             Gazing into the mirror...
           </p>
           <p className="text-white/60 text-sm">
             Crafting your reflection
           </p>
         </motion.div>
       </motion.div>
     )}
   </AnimatePresence>
   ```

**Pros:**
- ✅ Non-blocking (overlay appears instantly)
- ✅ Minimal code changes (4 locations)
- ✅ Maintains existing routing behavior
- ✅ Respects prefers-reduced-motion (CosmicLoader already does)
- ✅ Clear visual feedback (full-page, immersive)
- ✅ Error recovery (overlay hides on error)

**Cons:**
- ⚠️ No progress bar (AI processing time unpredictable)
- ⚠️ Requires absolute positioning parent check

### Recommended Approach

**BEST PRACTICE: Conditional Overlay with Status Text**

**Implementation:**
1. Add `isSubmitting` state
2. Show full-page overlay with CosmicLoader on submit
3. Animated status text: "Gazing into the mirror..." → "Crafting your reflection..."
4. Minimum 500ms display (prevent flash on fast responses)
5. Auto-dismiss on success/error

**Estimated Effort:** 2 hours
- Code changes: 30 min
- Testing (fast/slow network, errors): 1 hour
- Mobile responsiveness check: 30 min

## Reflection Output Analysis

### Current Readability Issues

**File:** `app/reflection/output/page.tsx`

**Current Text Styling (lines 114-124):**
```tsx
<div
  className={`reflection-text ${reflectionVisible ? 'visible' : ''}`}
>
  <div dangerouslySetInnerHTML={{ __html: reflection.aiResponse }} />
</div>
```

**CSS Analysis (from `styles/mirror.css`):**

**Current Values:**
- **Font size:** `var(--text-lg)` = `clamp(1.1rem, 3vw, 1.4rem)` ✅ GOOD
- **Line height:** `1.8` ✅ EXCELLENT (per master plan requirement)
- **Text color:** `rgba(255, 255, 255, 0.95)` ✅ EXCELLENT (per master plan)
- **Strong tags:** Gradient `linear-gradient(135deg, #fbbf24, #9333ea)` ✅ GOOD
- **Em tags:** `rgba(255, 255, 255, 0.8)` ✅ GOOD

**Contrast Ratio Analysis:**
- **Background:** `#020617` (from `--cosmic-bg`)
- **Text:** `rgba(255, 255, 255, 0.95)` = `#F2F2F2`
- **Contrast Ratio:** 18.5:1 ✅ WCAG AAA (exceeds 4.5:1 AA requirement)

**VERDICT: Reflection text already meets all master plan requirements!**
- ✅ Text uses `rgba(255, 255, 255, 0.95)` (95% opacity white)
- ✅ Line height is 1.8
- ✅ Font size is 1.1rem minimum (18px at base)
- ✅ Strong tags use purple-to-gold gradient
- ✅ Contrast exceeds WCAG AA (actually AAA level)

### Required CSS Changes

**NONE REQUIRED** - Already compliant!

However, based on inspection of `app/reflection/output/page.tsx`, there's a **different issue:**

**The output page uses a DIFFERENT styling approach:**
- Uses `styles/mirror.css` with `.reflection-text` class
- Does NOT use the glass component system
- Different from MirrorExperience.tsx embedded output view

**Discrepancy Found:**
The master plan targets `app/reflection/output/page.tsx`, but the current implementation shows reflection output inline within `MirrorExperience.tsx` (lines 476-520).

**Actual Files to Check:**
1. **MirrorExperience.tsx (lines 488-495):** Embedded output view
2. **app/reflection/output/page.tsx:** Standalone output page

**MirrorExperience.tsx Output Styling (lines 732-758):**
```css
.reflection-content {
  text-align: left;
  max-width: 700px;
}

.reflection-text {
  font-size: var(--text-lg);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: var(--space-2xl);
  white-space: pre-wrap;
  text-align: justify;
  hyphens: auto;
}

.reflection-text strong {
  font-weight: 600;
  background: linear-gradient(135deg, #fbbf24, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.reflection-text em {
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
}
```

**✅ PERFECT - All requirements met in both locations!**

### Target Values

**Current vs Target Comparison:**

| Property | Current | Target (Master Plan) | Status |
|----------|---------|---------------------|--------|
| Body color | `rgba(255,255,255,0.95)` | `rgba(255,255,255,0.95)` | ✅ Match |
| Line height | `1.8` | `1.8` | ✅ Match |
| Font size | `clamp(1.1rem,3vw,1.4rem)` | `1.1rem minimum` | ✅ Match |
| Strong color | Gradient purple→gold | Gradient or high contrast | ✅ Match |
| Contrast ratio | 18.5:1 | 4.5:1 (WCAG AA) | ✅ Exceeds |

**NO CHANGES NEEDED** - Text readability already compliant!

## Navigation Fix Analysis

### Current Navigation Height

**File:** `components/shared/AppNavigation.tsx`

**Fixed Positioning:**
- **Line 72-75:** `className="fixed top-0 left-0 right-0 z-[100]"`
- **Structure:**
  ```tsx
  <GlassCard elevated className="fixed top-0...">
    <div className="container mx-auto px-6 py-4 flex items-center...">
      {/* Navigation content */}
    </div>
  </GlassCard>
  ```

**Height Calculation:**
- **Padding:** `py-4` = `1rem` = `16px` (top + bottom = 32px)
- **Content height:** Logo + links ≈ 40-44px
- **GlassCard border:** 1px top + bottom = 2px
- **Total:** ~74-78px (varies by viewport)

**Measured Height (from dashboard.css line 192):**
```css
padding-top: clamp(60px, 8vh, 80px);
```

**Dashboard uses:** 60-80px responsive padding ✅ CORRECT

**Recommended Fixed Value:** `80px` (accounts for taller mobile nav)

### Pages Needing Padding

**Analysis of 7 pages using AppNavigation:**

| Page | Current Layout | Padding Status | Needs Fix? |
|------|---------------|----------------|------------|
| `app/dashboard/page.tsx` | `padding-top: clamp(60px,8vh,80px)` | ✅ Correct | NO |
| `app/dreams/page.tsx` | `min-h-screen bg-gradient p-4 sm:p-8` | ❌ No top padding | **YES** |
| `app/evolution/page.tsx` | `min-h-screen bg-gradient p-8` | ❌ No top padding | **YES** |
| `app/visualizations/page.tsx` | `min-h-screen bg-gradient p-8` | ❌ No top padding | **YES** |
| `app/dreams/[id]/page.tsx` | Uses AppNavigation | ❌ Unknown | **YES** |
| `app/evolution/[id]/page.tsx` | Uses AppNavigation | ❌ Unknown | **YES** |
| `app/visualizations/[id]/page.tsx` | Uses AppNavigation | ❌ Unknown | **YES** |

**Total Pages Needing Fix:** 6 pages

**app/reflection/MirrorExperience.tsx:**
- Uses `position: fixed; inset: 0;` full-screen layout
- Does NOT use AppNavigation
- **NO FIX NEEDED** (self-contained layout)

### Systematic Fix Approach

**Option 1: Container-Level Padding (RECOMMENDED)**

Add padding to main content container immediately after AppNavigation:

**Pattern:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark">
  <AppNavigation currentPage="dreams" />
  
  {/* Add pt-20 (80px) to prevent overlap */}
  <div className="pt-20 p-4 sm:p-8">
    <div className="max-w-7xl mx-auto">
      {/* Page content */}
    </div>
  </div>
</div>
```

**Pros:**
- ✅ Single line change per page
- ✅ Consistent 80px across all pages
- ✅ Mobile responsive (same padding)
- ✅ No custom CSS needed

**Cons:**
- ⚠️ Adds wrapper div (extra DOM element)

**Option 2: Direct Padding on Container (SIMPLER)**

Modify existing container className:

**Before:**
```tsx
<div className="min-h-screen bg-gradient p-4 sm:p-8">
  <AppNavigation currentPage="dreams" />
  <div className="max-w-7xl mx-auto">
```

**After:**
```tsx
<div className="min-h-screen bg-gradient pt-20 px-4 sm:px-8 pb-8">
  <AppNavigation currentPage="dreams" />
  <div className="max-w-7xl mx-auto">
```

**Pros:**
- ✅ No extra DOM elements
- ✅ Tailwind utility classes only
- ✅ Explicit padding control

**Cons:**
- ⚠️ Must adjust all padding values (pt, px, pb separately)

**Option 3: CSS Custom Property (MOST MAINTAINABLE)**

Add to `styles/variables.css`:
```css
--nav-height: 80px;
```

Use in pages:
```tsx
<div className="min-h-screen bg-gradient" style={{ paddingTop: 'var(--nav-height)' }}>
```

Or add Tailwind utility:
```js
// tailwind.config.ts
theme: {
  extend: {
    spacing: {
      'nav': '80px',
    }
  }
}
```

Then use:
```tsx
<div className="min-h-screen bg-gradient pt-nav px-4 sm:px-8 pb-8">
```

**Pros:**
- ✅ Single source of truth
- ✅ Easy to adjust globally
- ✅ Semantic naming

**Cons:**
- ⚠️ Requires tailwind config change (1 time)

### RECOMMENDED: Option 3 (CSS Custom Property + Tailwind Utility)

**Implementation Steps:**

1. **Add to `tailwind.config.ts` (lines 9-10):**
   ```ts
   spacing: {
     'nav': '80px', // Navigation bar height
   },
   ```

2. **Update 6 pages:**

   **dreams/page.tsx (line 56):**
   ```tsx
   // Before:
   <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-4 sm:p-8">
   
   // After:
   <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-4 sm:px-8 pb-8">
   ```

   **evolution/page.tsx (line ~95):**
   ```tsx
   // Before:
   <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark p-8">
   
   // After:
   <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-8 pb-8">
   ```

   **visualizations/page.tsx (similar):**
   ```tsx
   <div className="min-h-screen bg-gradient-to-br from-mirror-dark via-mirror-midnight to-mirror-dark pt-nav px-8 pb-8">
   ```

   **Detail pages ([id]/page.tsx):** Same pattern

3. **Verify on mobile:**
   - Test at 320px, 768px, 1024px viewports
   - Check hamburger menu doesn't overlap content when expanded
   - Verify scroll behavior

**Estimated Effort:** 2 hours
- Tailwind config: 5 min
- Update 6 pages: 30 min
- Testing across viewports: 1 hour
- Regression testing (check nothing breaks): 30 min

## Component Readiness

### CosmicLoader

**File:** `components/ui/glass/CosmicLoader.tsx`

**Status:** ✅ PRODUCTION READY

**Features:**
- Three sizes: `sm` (32px), `md` (64px), `lg` (96px)
- Gradient ring animation (purple → indigo → violet)
- Respects `prefers-reduced-motion` (line 19)
- ARIA-compliant (`role="status"`, `aria-label`)
- Screen reader text (`.sr-only`)

**Usage Pattern:**
```tsx
import { CosmicLoader } from '@/components/ui/glass';

// Inline (button)
<CosmicLoader size="sm" />

// Full page
<div className="flex flex-col items-center justify-center gap-6">
  <CosmicLoader size="lg" />
  <p className="text-white/70 text-lg">Loading...</p>
</div>

// Custom label
<CosmicLoader size="md" label="Loading dreams data" />
```

**Current Usage (confirmed in codebase):**
- ✅ Dashboard page (loading state)
- ✅ Dreams page (loading state)
- ✅ Evolution page (loading state)
- ✅ Visualizations page (loading state)
- ✅ MirrorExperience inline button (submit state)

**Integration for Reflection Flow:**
```tsx
// Full-page overlay (RECOMMENDED)
<div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-mirror-void-deep/95 backdrop-blur-lg">
  <CosmicLoader size="lg" />
  <motion.p className="text-white/90 text-xl">
    Gazing into the mirror...
  </motion.p>
</div>
```

**No modifications needed** - component is ready as-is.

### CSS Variables

**File:** `styles/variables.css`

**Relevant Variables for Iteration 3:**

**Spacing:**
```css
--space-nav: 80px; /* ADD THIS - Navigation height */
--space-xl: clamp(2rem, 4vw, 3rem); /* Existing - Card padding */
--space-2xl: clamp(3rem, 6vw, 4rem); /* Existing - Section spacing */
```

**Typography:**
```css
--text-lg: clamp(1.1rem, 3vw, 1.4rem); /* ✅ Used for reflection text */
--leading-relaxed: 1.625; /* Available, but reflection uses 1.8 hardcoded */
```

**Colors:**
```css
--cosmic-bg: #020617; /* Background for contrast checking */
--cosmic-text: #ffffff; /* Base white */
--cosmic-text-secondary: rgba(255, 255, 255, 0.8); /* 80% opacity */
```

**Recommendation:** Add navigation height variable:

```css
/* Layout */
--container-max-width: 900px;
--sidebar-width: 320px;
--header-height: 64px;
--nav-height: 80px; /* ADD THIS */
--footer-height: 80px;
```

Then update Tailwind config to expose it:
```ts
spacing: {
  'nav': '80px',
},
```

**No other CSS variable changes needed.**

### Mobile Considerations

**Current Responsive Breakpoints (from variables.css):**
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

**Mobile-Specific Concerns for Iteration 3:**

**1. Navigation Height on Mobile:**
- Desktop nav: ~76px
- Mobile hamburger: ~76px (same height, collapsed)
- Mobile expanded: Height grows (accordion animation)
- **Fix:** Use `pt-20` (80px) consistently across viewports

**2. Reflection Loading Overlay:**
- Must cover entire viewport on mobile
- `absolute inset-0` ensures full coverage
- CosmicLoader scales appropriately (size="lg" = 96px, visible on small screens)
- Text should remain readable (test at 320px width)

**Recommended Mobile Testing Matrix:**

| Viewport | Width | Test Focus |
|----------|-------|------------|
| iPhone SE | 320px | Reflection overlay text, nav hamburger |
| iPhone 12 | 390px | Standard mobile, overlay animation |
| iPad Mini | 768px | Tablet breakpoint, nav transition |
| Desktop | 1024px+ | Standard desktop layout |

**3. Touch Targets:**
- CosmicLoader itself not interactive (visual only) ✅
- Navigation links: Already `py-3` (48px height) on mobile ✅
- No additional mobile-specific changes needed

**4. Text Readability on Small Screens:**
- Reflection text: `clamp(1.1rem, 3vw, 1.4rem)` ensures minimum 1.1rem ✅
- Loading status text: `text-xl` (1.25rem) readable on 320px ✅
- Line height 1.8 prevents cramped text ✅

**5. Viewport Height Considerations:**
- Navigation uses `fixed top-0` (always visible) ✅
- Content uses `min-h-screen` (never shorter than viewport) ✅
- Padding prevents content hiding behind fixed nav ✅

**Mobile Responsiveness Status:** ✅ READY (no additional mobile-specific work needed)

## Recommendations

### Priority Order

**Priority 1: Navigation Padding Fix (HIGHEST IMPACT)**
- **Blocker:** Content currently hidden behind fixed nav on 6 pages
- **User Impact:** Critical - users can't see top content
- **Effort:** 2 hours (1 config change + 6 page updates + testing)
- **Risk:** Low (isolated className changes)
- **Dependencies:** None

**Priority 2: Reflection Loading Overlay (HIGH IMPACT)**
- **Blocker:** No feedback during 3-5 second AI processing
- **User Impact:** High - users uncertain if submission worked
- **Effort:** 2 hours (state + overlay + animation)
- **Risk:** Low (isolated to MirrorExperience.tsx)
- **Dependencies:** None (CosmicLoader already ready)

**Priority 3: Reflection Text Readability (ALREADY COMPLETE)**
- **Blocker:** None
- **User Impact:** None (already compliant)
- **Effort:** 0 hours ✅
- **Risk:** None
- **Action:** Verify in testing, document compliance

### Risk Assessment

**Navigation Padding Fix:**
- **Risk Level:** LOW
- **Potential Issues:**
  - Content shift may feel abrupt (test animations)
  - Mobile hamburger menu expansion might need adjustment
  - Dashboard already uses different padding pattern (clamp)
- **Mitigation:**
  - Use consistent `pt-nav` across all pages
  - Test mobile menu overlay behavior
  - Keep dashboard padding as-is (already correct)

**Reflection Loading Overlay:**
- **Risk Level:** LOW-MEDIUM
- **Potential Issues:**
  - Overlay z-index conflict with existing elements
  - Absolute positioning requires parent context check
  - Fast networks may cause flash (need minimum display time)
  - Error states must clear overlay
- **Mitigation:**
  - Use `z-50` (below modal z-1000, above content z-10)
  - MirrorExperience.tsx already uses `position: fixed` parent ✅
  - Add 500ms minimum display (setTimeout before hide)
  - Always clear `isSubmitting` in onError callback

**Reflection Text (No Changes):**
- **Risk Level:** NONE
- **Already compliant, no work needed**

### Integration Considerations

**Reflection Loading + Navigation Padding:**
- **No conflicts:** Reflection uses full-screen fixed layout (no nav overlap)
- **Independent changes:** Can be implemented in parallel

**Testing Workflow:**
1. **Navigation fix first:**
   - Update tailwind config
   - Fix 6 pages
   - Test scroll behavior
   - Verify mobile menu
   - Commit

2. **Reflection loading second:**
   - Add state management
   - Implement overlay
   - Test error recovery
   - Test network conditions (fast/slow)
   - Commit

3. **Reflection text verification:**
   - Manual contrast check (Chrome DevTools)
   - Lighthouse accessibility audit
   - Mobile readability test
   - Document compliance

**Estimated Total Time:** 4-5 hours
- Navigation padding: 2 hours
- Reflection loading: 2 hours
- Testing & verification: 1 hour
- Buffer: 30 min

**No blocking dependencies** - all work can proceed immediately.

## Resource Map

### Critical Files/Directories

**Files Modified (Iteration 3):**
1. `tailwind.config.ts` - Add `nav: '80px'` spacing
2. `app/dreams/page.tsx` - Add `pt-nav` padding
3. `app/evolution/page.tsx` - Add `pt-nav` padding
4. `app/visualizations/page.tsx` - Add `pt-nav` padding
5. `app/dreams/[id]/page.tsx` - Add `pt-nav` padding
6. `app/evolution/[id]/page.tsx` - Add `pt-nav` padding
7. `app/visualizations/[id]/page.tsx` - Add `pt-nav` padding
8. `app/reflection/MirrorExperience.tsx` - Add loading overlay

**Files Read-Only (Reference):**
- `components/ui/glass/CosmicLoader.tsx` - Already production-ready
- `components/shared/AppNavigation.tsx` - Fixed positioning confirmed
- `styles/variables.css` - CSS custom properties reference
- `styles/globals.css` - Design system classes
- `app/dashboard/page.tsx` - Correct padding pattern reference

**Files NOT Modified:**
- `app/reflection/output/page.tsx` - Text already compliant (verified)
- `app/dashboard/page.tsx` - Padding already correct (verified)

### Key Dependencies

**Direct Dependencies (npm):**
- `framer-motion@11.18.2` - For AnimatePresence in loading overlay
- `tailwindcss@3.4.1` - For spacing utilities
- `@trpc/react-query` - Mutation hooks (already used)

**Component Dependencies:**
- `CosmicLoader` from `@/components/ui/glass` - Used in overlay
- `AppNavigation` from `@/components/shared` - Height reference
- `motion` from `framer-motion` - Overlay animations

**CSS Dependencies:**
- `styles/variables.css` - Spacing, typography, colors
- `tailwind.config.ts` - Custom spacing utilities
- `styles/globals.css` - Base styles, design system

**No new dependencies required** - all needed components already installed.

### Testing Infrastructure

**Manual Testing Required:**

**1. Navigation Padding:**
```bash
# Test matrix
- [ ] Desktop (1024px+): Content visible, no overlap
- [ ] Tablet (768px): Content visible, nav transitions
- [ ] Mobile (390px): Content visible, hamburger works
- [ ] Mobile (320px): Minimum viewport, no horizontal scroll
- [ ] Scroll behavior: Smooth, nav stays fixed
- [ ] All 6 pages: Consistent padding
```

**2. Reflection Loading Overlay:**
```bash
# Test scenarios
- [ ] Fast network: Minimum 500ms display, no flash
- [ ] Slow network: Overlay persists, status text animates
- [ ] Network error: Overlay hides, error toast shows
- [ ] Validation error: Overlay doesn't show (pre-submit)
- [ ] Success flow: Overlay → router.push → unmount
- [ ] Mobile: Overlay covers viewport, text readable
```

**3. Reflection Text Readability:**
```bash
# Verification checklist
- [ ] Contrast ratio ≥ 4.5:1 (use Chrome DevTools)
- [ ] Font size ≥ 1.1rem (inspect computed styles)
- [ ] Line height = 1.8 (inspect CSS)
- [ ] Strong tags use gradient (visual check)
- [ ] Mobile: Text comfortable without zoom
```

**Automated Testing (Lighthouse):**
```bash
# Run after changes
npx lighthouse http://localhost:3000/dreams --view
npx lighthouse http://localhost:3000/reflection --view

# Check metrics
- Performance: 90+ (maintained)
- Accessibility: 95+ (target)
- Contrast ratio: Pass (4.5:1 minimum)
```

**Browser Testing Matrix:**
- Chrome (latest) - Primary
- Safari (latest) - Backdrop-filter performance
- Firefox (latest) - CSS compatibility
- Mobile Safari (iOS 15+) - Touch behavior
- Chrome Android - Mobile overlay

**No CI/CD changes needed** - manual verification sufficient for UX fixes.

## Questions for Planner

**Navigation Padding Approach:**
- **Q:** Should we use consistent 80px padding (`pt-nav`) or match dashboard's responsive pattern (`pt-[clamp(60px,8vh,80px)]`)?
- **Recommendation:** Use `pt-nav` (80px fixed) for simplicity unless viewport-responsive padding is critical

**Reflection Loading Minimum Display:**
- **Q:** What minimum overlay display time? (Prevent flash on fast networks)
- **Recommendation:** 500ms minimum (feels intentional, not glitchy)

**Error Recovery UX:**
- **Q:** Should overlay fade out or snap away on error?
- **Recommendation:** Fade out (300ms) for smooth transition, then show error toast

**Mobile Testing Scope:**
- **Q:** Which viewports are critical? (320px, 390px, 768px, 1024px+)
- **Recommendation:** Test all 4, prioritize 390px (iPhone 12 standard)

**Accessibility Audit Depth:**
- **Q:** Should we run full axe DevTools audit or just Lighthouse?
- **Recommendation:** Lighthouse sufficient (reflection text already compliant), axe for final iteration 3 polish

---

**Status:** READY FOR PLANNING
**Complexity:** LOW (isolated, well-scoped changes)
**Blocking Issues:** None
**External Dependencies:** None

All components production-ready. Clear integration points identified. Low-risk, high-impact UX improvements.
