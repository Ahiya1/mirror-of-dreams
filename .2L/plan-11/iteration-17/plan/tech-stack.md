# Technology Stack

**Iteration:** 17 - Full-Screen Reflection Experience
**Created:** 2025-12-02

---

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**Rationale:**
- Already in use - no changes to core framework
- App Router provides clean layout composition for navigation context
- Server components not relevant here - all mobile UX is client-side

**No Changes Required:** This iteration is purely client-side UI work.

---

## Animation & Gestures

**Decision:** Framer Motion 11.18.2 (existing)

**Rationale:**
- Already in project with extensive usage
- `drag` prop provides native swipe gesture support
- `AnimatePresence` handles step transitions beautifully
- `useMotionValue` and `animate` for snap point logic
- No additional bundle size

**Key Features Used:**
- `drag="y"` - Vertical drag for bottom sheet dismiss
- `drag="x"` - Horizontal swipe for step navigation (when textarea not focused)
- `dragConstraints` - Limit drag boundaries
- `dragElastic` - Elastic feel at drag limits
- `onDragEnd` - Handle gesture completion
- `AnimatePresence` - Exit animations for steps
- `useMotionValue` + `animate()` - Snap-back animation

**Pattern Example:**
```typescript
import { motion, useMotionValue, animate } from 'framer-motion';

const y = useMotionValue(0);

const handleDragEnd = (_, info) => {
  if (info.offset.y > 100 || info.velocity.y > 500) {
    onClose();
  } else {
    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
  }
};

<motion.div
  drag="y"
  dragConstraints={{ top: 0 }}
  dragElastic={{ top: 0, bottom: 0.5 }}
  style={{ y }}
  onDragEnd={handleDragEnd}
/>
```

---

## Styling

**Decision:** Tailwind CSS 3.x (existing) + CSS Variables

**Rationale:**
- Already in use throughout the project
- Safe area variables already defined in `variables.css`
- Mobile-first utilities available
- No changes to styling approach

**Critical CSS Variables (from variables.css):**
```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
--bottom-nav-height: 64px;
--bottom-nav-total: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
```

**Mobile-First Classes Used:**
- `fixed inset-0` - Full-screen positioning
- `pb-[env(safe-area-inset-bottom)]` - Safe area padding
- `md:hidden` - Desktop hide
- `touch-none` - Prevent touch scrolling during drag
- `overscroll-contain` - Prevent scroll chaining

---

## State Management

**Decision:** React Context + useState (no external library)

**Rationale:**
- Navigation visibility is simple boolean state
- Wizard step state is local to MobileReflectionFlow
- Redux/Zustand overkill for this use case
- Context propagates nav visibility from reflection to layout

**Contexts Created:**
1. `NavigationContext` - Controls bottom nav visibility
   - `showBottomNav: boolean`
   - `setShowBottomNav: (show: boolean) => void`

**Local State in MobileReflectionFlow:**
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
});
const [selectedDreamId, setSelectedDreamId] = useState<string>('');
const [selectedTone, setSelectedTone] = useState<ToneId>('fusion');
const [isTextareaFocused, setIsTextareaFocused] = useState(false);
```

---

## Keyboard Detection

**Decision:** visualViewport API with fallback

**Rationale:**
- Modern, accurate keyboard detection
- Better than `resize` events (more reliable on iOS)
- Good browser support: Chrome 61+, Safari 13+, Firefox 91+
- Threshold-based detection avoids false positives from address bar changes

**Implementation:**
```typescript
// useKeyboardHeight.ts
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  if (typeof window === 'undefined' || !window.visualViewport) {
    return;
  }

  const viewport = window.visualViewport;
  const windowHeight = window.innerHeight;

  const handleResize = () => {
    const viewportHeight = viewport.height;
    const diff = windowHeight - viewportHeight;

    // Only consider keyboard if difference > 150px
    if (diff > 150) {
      setKeyboardHeight(diff);
    } else {
      setKeyboardHeight(0);
    }
  };

  viewport.addEventListener('resize', handleResize);
  return () => viewport.removeEventListener('resize', handleResize);
}, []);
```

**Browser Fallback:**
- For browsers without visualViewport, fall back to scroll-into-view on focus
- CSS `env(keyboard-inset-height)` where supported (iOS 15+)

---

## Mobile Detection

**Decision:** Window width check with SSR safety

**Rationale:**
- Simple, reliable detection
- Matches Tailwind's `md` breakpoint (768px)
- SSR-safe with useEffect + useState pattern
- ResizeObserver for dynamic updates

**Implementation:**
```typescript
// useIsMobile.ts
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);

  checkMobile(); // Initial check
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

return isMobile;
```

---

## Form Persistence

**Decision:** localStorage with session key

**Rationale:**
- Prevents data loss if user backgrounds app
- Simple to implement
- No server-side storage needed
- Clear on successful submission

**Storage Key:** `MIRROR_REFLECTION_DRAFT`

**Pattern:**
```typescript
// Save on change
useEffect(() => {
  if (isDirty) {
    localStorage.setItem('MIRROR_REFLECTION_DRAFT', JSON.stringify({
      formData,
      selectedDreamId,
      currentStep,
      timestamp: Date.now(),
    }));
  }
}, [formData, selectedDreamId, currentStep, isDirty]);

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem('MIRROR_REFLECTION_DRAFT');
  if (saved) {
    const data = JSON.parse(saved);
    // Only restore if less than 24 hours old
    if (Date.now() - data.timestamp < 86400000) {
      // Restore state...
    }
  }
}, []);

// Clear on submit
localStorage.removeItem('MIRROR_REFLECTION_DRAFT');
```

---

## API Layer

**Decision:** tRPC (existing, no changes)

**Rationale:**
- All mutations already exist
- Same data flow, different UI
- No new endpoints needed

**Mutations Used:**
- `trpc.reflection.create.useMutation()` - Submit reflection
- `trpc.dreams.list.useQuery()` - Fetch dreams for selection
- `trpc.dreams.create.useMutation()` - Quick create dream (existing)

---

## Existing Components to Leverage

| Component | Location | Use For |
|-----------|----------|---------|
| `ProgressOrbs` | `/components/ui/glass/ProgressOrbs.tsx` | Step indicator at top |
| `GlassInput` | `/components/ui/glass/GlassInput.tsx` | Textarea in question steps |
| `GlassCard` | `/components/ui/glass/GlassCard.tsx` | Dream selection items |
| `GlassModal` | `/components/ui/glass/GlassModal.tsx` | Exit confirmation |
| `GlowButton` | `/components/ui/glass/GlowButton.tsx` | Next/Previous buttons |
| `CosmicLoader` | `/components/ui/glass/CosmicLoader.tsx` | Gazing state |
| `ToneSelectionCard` | `/components/reflection/ToneSelectionCard.tsx` | Tone step |
| `ReflectionQuestionCard` | `/components/reflection/ReflectionQuestionCard.tsx` | Question content (adapt for mobile) |
| `haptic` | `/lib/utils/haptics.ts` | Touch feedback |
| `useScrollDirection` | `/lib/hooks/useScrollDirection.ts` | Pattern reference |
| `bottomNavVariants` | `/lib/animations/variants.ts` | Bottom sheet animation base |

---

## Dependencies Overview

**No New Dependencies Required**

Existing dependencies that power this iteration:
- `framer-motion@11.18.2` - Animations and gestures
- `lucide-react` - Icons (X close, arrows, etc.)
- `@trpc/react-query` - API calls
- `tailwindcss` - Styling

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle increase | < 15KB gzipped | `npm run build` output |
| Step transition | < 300ms | Visual inspection |
| Keyboard response | < 100ms | Focus to visible input |
| Touch response | < 100ms | Tap to visual feedback |
| First Contentful Paint | Maintain current | Lighthouse mobile |

---

## Security Considerations

1. **LocalStorage Data**
   - Only stores draft form data temporarily
   - No sensitive information (dreams are user-created text)
   - Cleared after 24 hours or successful submission

2. **Exit Confirmation**
   - Uses native `beforeunload` for browser back/refresh
   - Custom modal for in-app navigation
   - No data sent to server until explicit submit

3. **Input Validation**
   - Same validation as desktop (character/word limits)
   - Server-side validation unchanged (tRPC schemas)

---

## Accessibility Considerations

1. **Reduced Motion**
   - Check `useReducedMotion()` from Framer Motion
   - Disable swipe animation, use instant transitions
   - ProgressOrbs already respects this preference

2. **Focus Management**
   - Auto-focus textarea when step changes
   - Trap focus within bottom sheet when open
   - Return focus to trigger element on sheet close

3. **Screen Reader Support**
   - Announce step changes: "Question 2 of 4"
   - Bottom sheet has proper ARIA attributes
   - Exit confirmation is dialog with proper role

4. **Touch Targets**
   - Minimum 48px for all interactive elements
   - Dreams in bottom sheet: 60px+ height
   - Adequate spacing between tap targets

---

## Environment Variables

**No New Environment Variables Required**

Existing variables used (no changes):
- `DATABASE_URL` - Prisma connection
- `OPENAI_API_KEY` - AI responses
- All auth/subscription variables unchanged

---

## Testing Strategy

1. **Unit Tests** (if time permits)
   - `useKeyboardHeight` hook
   - `useIsMobile` hook
   - Step navigation logic

2. **Manual Testing** (required)
   - iPhone Safari (keyboard handling)
   - Android Chrome (haptic feedback)
   - Desktop Chrome (no regressions)
   - Tablet (breakpoint behavior)

3. **Test Scenarios**
   - Complete reflection flow on mobile
   - Exit mid-reflection, confirm prompt
   - Background app, return, state preserved
   - Dream selection with 10+ dreams
   - Swipe vs text selection in textarea
