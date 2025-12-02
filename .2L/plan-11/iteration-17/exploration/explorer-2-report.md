# Explorer 2 Report: Bottom Sheet & Mobile Patterns

## Executive Summary

This exploration analyzes the bottom sheet component requirements and mobile reflection patterns for the Full-Screen Reflection Experience (Iteration 17). The codebase already has Framer Motion 11.18.2 with drag/gesture capabilities, safe area CSS variables, and haptic feedback utilities from Iteration 16. The primary work involves creating a new BottomSheet component with snap points and swipe-to-dismiss, implementing step navigation with swipe gestures, keyboard handling via visualViewport API, and leveraging existing ProgressOrbs/ProgressBar components for step indicators.

## Discoveries

### 1. Bottom Sheet Requirements

#### Current State
- **No bottom sheet component exists** in the codebase
- `GlassModal` (`/components/ui/glass/GlassModal.tsx`) uses centered desktop pattern with fade animation
- Modal animation variants exist in `/lib/animations/variants.ts`:
  - `modalOverlayVariants`: Simple opacity fade
  - `modalContentVariants`: Slide up from y:20 (subtle, not full bottom sheet)

#### Existing Related Patterns
- `bottomNavVariants` already defined in `/lib/animations/variants.ts` lines 357-379:
  ```typescript
  export const bottomNavVariants: Variants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
  };
  ```
  This pattern can be adapted for bottom sheet slide-up animation.

### 2. Framer Motion Drag/Gesture Capabilities

#### Available Features (framer-motion v11.18.2)
The package supports full gesture APIs:

1. **Drag Controls:**
   - `drag="y"` - Vertical drag constraint
   - `dragConstraints={{ top: 0 }}` - Prevent upward drag beyond content
   - `dragElastic={{ top: 0, bottom: 0.5 }}` - Elastic drag at bottom
   - `onDragEnd` - Handle gesture completion

2. **Motion Values (for snap points):**
   - `useMotionValue` - Track drag position
   - `useTransform` - Transform y position to opacity/scale
   - `animate()` - Programmatic animation to snap points

3. **Pattern from Master Explorer 2 Report:**
   ```typescript
   const y = useMotionValue(0);
   
   <motion.div
     drag="y"
     dragConstraints={{ top: 0 }}
     dragElastic={{ top: 0, bottom: 0.5 }}
     onDragEnd={(_, info) => {
       if (info.offset.y > 100) onClose();
     }}
   />
   ```

### 3. Recommended Bottom Sheet Implementation

#### Component Structure
**Location:** `/components/ui/mobile/BottomSheet.tsx`

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: 'auto' | 'half' | 'full';
  snapPoints?: number[];  // e.g., [0.5, 0.9] for 50% and 90% heights
  children: React.ReactNode;
}
```

#### Snap Points Logic
```typescript
const SNAP_POINTS = {
  auto: undefined,        // Content height
  half: 0.5,              // 50% of viewport
  full: 0.9               // 90% of viewport (leave room for status bar)
};

// Determine snap behavior on drag end
const handleDragEnd = (_, info) => {
  const velocityThreshold = 500;  // px/s
  const distanceThreshold = 100;  // px
  
  // Fast swipe down = dismiss
  if (info.velocity.y > velocityThreshold) {
    onClose();
    return;
  }
  
  // Slow drag beyond threshold = dismiss
  if (info.offset.y > distanceThreshold) {
    onClose();
    return;
  }
  
  // Otherwise snap back
  animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
};
```

#### Swipe-to-Dismiss Threshold
- **Velocity-based:** > 500px/s downward = dismiss immediately
- **Distance-based:** > 100px or > 30% of sheet height = dismiss
- **Both fail:** Snap back to original position with spring animation

### 4. Step Navigation Patterns

#### Swipe Gesture for Step Navigation
```typescript
interface SwipeNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (newStep: number) => void;
  children: React.ReactNode;
}

const handleDragEnd = (_, info) => {
  const threshold = 50; // px
  
  if (info.offset.x < -threshold && currentStep < totalSteps - 1) {
    onStepChange(currentStep + 1);  // Swipe left = next
  } else if (info.offset.x > threshold && currentStep > 0) {
    onStepChange(currentStep - 1);  // Swipe right = previous
  }
};
```

#### Handling Swipe vs Text Selection Conflict

**Problem:** Horizontal swipe gesture conflicts with text selection in textarea.

**Solutions:**

1. **Disable swipe on textarea focus:**
   ```typescript
   const [isTextareaFocused, setIsTextareaFocused] = useState(false);
   
   <motion.div
     drag={isTextareaFocused ? false : 'x'}
   >
     <textarea
       onFocus={() => setIsTextareaFocused(true)}
       onBlur={() => setIsTextareaFocused(false)}
     />
   </motion.div>
   ```

2. **Use vertical swipe indicator instead (recommended):**
   - Small drag handle at bottom of screen
   - Only that element triggers swipe navigation
   - Content area allows normal text selection

3. **Button navigation with swipe as enhancement:**
   - Next/Previous buttons always visible
   - Swipe only triggers from edges (first 50px of screen)

#### Animation Variants for Step Transitions

```typescript
// Add to /lib/animations/variants.ts
export const stepTransitionVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: { duration: 0.2 }
  })
};
```

### 5. Keyboard Handling Research

#### visualViewport API Approach

The `visualViewport` API is the modern approach for keyboard detection:

```typescript
// /lib/hooks/useKeyboardHeight.ts
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }
    
    const viewport = window.visualViewport;
    const windowHeight = window.innerHeight;
    
    const handleResize = () => {
      const viewportHeight = viewport.height;
      const newKeyboardHeight = windowHeight - viewportHeight;
      
      // Only consider it keyboard if difference > 150px
      // (to avoid triggering on address bar changes)
      if (newKeyboardHeight > 150) {
        setKeyboardHeight(newKeyboardHeight);
      } else {
        setKeyboardHeight(0);
      }
    };
    
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);
  
  return keyboardHeight;
}
```

#### Browser Support
- **visualViewport API:** Chrome 61+, Safari 13+, Firefox 91+
- Fallback for older browsers: Use `window.innerHeight` changes

#### Auto-Scroll Input into View

```typescript
// /lib/hooks/useAutoScrollOnFocus.ts
export function useAutoScrollOnFocus(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleFocus = () => {
      // Wait for keyboard animation
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    };
    
    element.addEventListener('focus', handleFocus);
    return () => element.removeEventListener('focus', handleFocus);
  }, [ref]);
}
```

#### Integration Pattern

```typescript
const MobileQuestionStep = () => {
  const keyboardHeight = useKeyboardHeight();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useAutoScrollOnFocus(textareaRef);
  
  return (
    <div
      style={{
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 'var(--safe-area-bottom)'
      }}
    >
      <textarea ref={textareaRef} />
    </div>
  );
};
```

### 6. Progress Indicator Analysis

#### Existing Progress Components

1. **ProgressOrbs** (`/components/ui/glass/ProgressOrbs.tsx`):
   - Multi-step progress with animated orbs
   - Breathing animation with cosmic glow
   - Respects reduced motion
   - **Perfect for mobile step indicator**
   - Usage: `<ProgressOrbs steps={5} currentStep={2} />`

2. **ProgressBar** (`/components/reflection/ProgressBar.tsx`):
   - Horizontal bar segments
   - Current step highlighted with glow
   - Shows "Step X of Y" text
   - Uses Framer Motion for smooth transitions

3. **ProgressIndicator** (`/components/reflection/ProgressIndicator.tsx`):
   - Simple percentage-based bar
   - Text-based "Question X of Y"
   - Less styled than ProgressBar

#### Recommendation

**Use ProgressOrbs for mobile** - it's compact, visually rich, and already has the cosmic aesthetic. For mobile, position at top:

```typescript
<div className="fixed top-0 inset-x-0 pt-[env(safe-area-inset-top)] z-50 flex justify-center py-4">
  <ProgressOrbs steps={5} currentStep={currentStep} />
</div>
```

#### Animating Step Changes

ProgressOrbs already handles animation via Framer Motion. When `currentStep` changes:
- Inactive orbs: `scale: [0.8, 1, 0.95]`, `opacity: [0.3, 0.4, 0.35]`
- Active orb: `scale: [1, 1.15, 1.1]`, full opacity, cosmic glow
- Completed orbs: Solid fill with mid-level shadow

### 7. Exit Confirmation

#### Current Confirmation Patterns

**CancelSubscriptionModal** (`/components/subscription/CancelSubscriptionModal.tsx`):
- Uses checkbox confirmation pattern
- Requires user to check "I understand..."
- Dual buttons: Keep/Cancel
- Good pattern but too complex for exit confirmation

#### Recommended Exit Confirmation Pattern

```typescript
interface ExitConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  hasUnsavedChanges: boolean;
}

const ExitConfirmation = ({ isOpen, onConfirm, onCancel, hasUnsavedChanges }) => {
  if (!hasUnsavedChanges) {
    // No changes = allow immediate exit
    return null;
  }
  
  return (
    <GlassModal isOpen={isOpen} onClose={onCancel} title="Leave reflection?">
      <p className="text-white/80 mb-6">
        Your answers will be lost if you leave now.
      </p>
      <div className="flex gap-3">
        <GlowButton variant="secondary" onClick={onCancel}>
          Keep Writing
        </GlowButton>
        <GlowButton variant="primary" onClick={onConfirm}>
          Leave
        </GlowButton>
      </div>
    </GlassModal>
  );
};
```

#### Detecting Dirty Form State

The `MirrorExperience.tsx` component already tracks form state:
```typescript
const [formData, setFormData] = useState<FormData>({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
});
```

**Recommended isDirty check:**
```typescript
const isDirty = useMemo(() => {
  return Object.values(formData).some(value => value.trim().length > 0);
}, [formData]);
```

#### Browser Back/Navigation Prevention

```typescript
useEffect(() => {
  if (!isDirty) return;
  
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

### 8. Safe Areas & Full Screen

#### Current Safe Area Support

Already implemented in `/styles/variables.css` lines 326-337:
```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);

--bottom-nav-height: 64px;
--bottom-nav-total: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
```

#### Viewport Meta Tag

Already configured in `/app/layout.tsx` lines 17-22:
```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,       // Prevent zoom on input focus
  viewportFit: 'cover',  // Enable safe area insets
};
```

#### Making Reflection Truly Full-Screen

**Option 1: Conditional Bottom Nav Hide (Recommended)**

The `BottomNavigation` component already exists at `/components/navigation/BottomNavigation.tsx`.

Add a global context or route-based detection:
```typescript
// In MobileReflectionFlow.tsx
useEffect(() => {
  document.body.classList.add('reflection-active');
  return () => document.body.classList.remove('reflection-active');
}, []);

// In BottomNavigation.tsx
const isReflectionActive = document.body.classList.contains('reflection-active');
if (isReflectionActive) return null;
```

**Better approach - Context-based:**
```typescript
// /contexts/NavigationContext.tsx
const NavigationContext = createContext({ showBottomNav: true });

export function useHideBottomNav() {
  const { setShowBottomNav } = useContext(NavigationContext);
  useEffect(() => {
    setShowBottomNav(false);
    return () => setShowBottomNav(true);
  }, []);
}
```

**Option 2: Portal-based Full Screen**

Render reflection outside the main layout:
```typescript
import { createPortal } from 'react-dom';

const MobileReflectionFlow = () => {
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-cosmic-bg">
      {/* Full screen content */}
    </div>,
    document.body
  );
};
```

#### Full-Screen Styling

```css
.reflection-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
  
  /* Safe area padding */
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
  
  /* Match cosmic background */
  background: var(--cosmic-bg);
}
```

## Complexity Assessment

### High Complexity Areas

1. **BottomSheet Component** (Estimated: 3-4 hours)
   - Framer Motion drag integration
   - Snap points logic
   - Swipe-to-dismiss with velocity detection
   - Safe area handling
   - Focus trap integration
   
2. **Step Navigation with Swipe** (Estimated: 2-3 hours)
   - Gesture handling
   - Textarea conflict resolution
   - AnimatePresence transitions
   - State management for steps

### Medium Complexity Areas

1. **Keyboard Handling** (Estimated: 1-2 hours)
   - visualViewport hook
   - Auto-scroll behavior
   - Cross-browser testing needed

2. **Exit Confirmation** (Estimated: 1 hour)
   - Dirty state detection
   - Modal integration
   - Browser back prevention

### Low Complexity Areas

1. **Progress Indicator** (Estimated: 30 min)
   - ProgressOrbs already exists
   - Just positioning and integration

2. **Safe Area Handling** (Estimated: 30 min)
   - CSS already exists
   - Apply to new components

## Technology Recommendations

### Primary Pattern: Framer Motion Gestures

Use Framer Motion's built-in drag system rather than a separate gesture library:
- Already in project (v11.18.2)
- Well-integrated with existing animation patterns
- No additional bundle size

### Supporting Patterns

| Feature | Approach | Why |
|---------|----------|-----|
| Bottom Sheet | Custom component with `drag="y"` | No good React library matches cosmic aesthetic |
| Keyboard Detection | `visualViewport` API | Modern, accurate, good browser support |
| Step Transitions | `AnimatePresence` + custom variants | Already used for modal transitions |
| Dirty State | React state comparison | Simple, no library needed |

## Risks & Challenges

### Technical Risks

1. **Swipe vs Text Selection (Medium)**
   - Impact: User frustration if swipe triggers during text selection
   - Mitigation: Disable swipe when textarea focused

2. **iOS Keyboard Behavior (Medium)**
   - Impact: Viewport resize quirks on iOS Safari
   - Mitigation: Use `visualViewport` API with 150px threshold

3. **Performance on Low-End Devices (Low)**
   - Impact: Janky animations
   - Mitigation: Use `will-change: transform`, respect reduced motion

### UX Risks

1. **Accidental Dismissal (Medium)**
   - Impact: User loses context by swiping bottom sheet closed
   - Mitigation: Require intentional swipe (velocity + distance)

## Recommendations for Planner

1. **Create BottomSheet component first** - It's needed for dream selection and can be reused
2. **Use existing ProgressOrbs** - Don't create new progress indicator
3. **Context-based nav hiding** - Create NavigationContext for clean bottom nav control
4. **Disable swipe during text input** - Avoid gesture conflicts
5. **Keep exit confirmation simple** - Two buttons, no checkbox
6. **Create useKeyboardHeight hook** - Reusable for all mobile forms

## Resource Map

### Critical Files to Create

| File | Purpose |
|------|---------|
| `/components/ui/mobile/BottomSheet.tsx` | Draggable bottom sheet with snap points |
| `/lib/hooks/useKeyboardHeight.ts` | visualViewport keyboard detection |
| `/lib/hooks/useAutoScrollOnFocus.ts` | Auto-scroll input into view |
| `/contexts/NavigationContext.tsx` | Control bottom nav visibility |
| `/lib/animations/variants.ts` | Add `stepTransitionVariants`, `bottomSheetVariants` |

### Critical Files to Modify

| File | Changes |
|------|---------|
| `/components/navigation/BottomNavigation.tsx` | Respect NavigationContext |
| `/app/layout.tsx` | Wrap with NavigationProvider |
| `/app/reflection/MirrorExperience.tsx` | Add mobile flow conditional |

### Existing Components to Leverage

| Component | Location | Use For |
|-----------|----------|---------|
| ProgressOrbs | `/components/ui/glass/ProgressOrbs.tsx` | Step indicator |
| GlassModal | `/components/ui/glass/GlassModal.tsx` | Exit confirmation |
| haptic | `/lib/utils/haptics.ts` | Tap feedback |
| useScrollDirection | `/lib/hooks/useScrollDirection.ts` | Pattern reference |

## Questions for Planner

1. Should the bottom sheet have multiple snap points (e.g., half/full) or just auto-height with dismiss?
2. For step navigation, prefer swipe everywhere or button-only with swipe as optional enhancement?
3. Should exit confirmation save draft to localStorage or just warn and discard?
4. Is there a specific animation timing preference for step transitions (fast/normal)?

---

*Exploration completed: 2025-12-02*
*Explorer: Explorer-2 (Bottom Sheet & Mobile Patterns)*
*Iteration: 17 - Full-Screen Reflection Experience*
