# Explorer 1 Report: UI and Auth Components Analysis for Testing

## Executive Summary

This exploration analyzed all UI components in `/components/ui/` and `/components/auth/` directories to assess current test coverage and identify priority components for testing. The project has **4 tested UI components** (PasswordToggle, GlowButton, GlowBadge, GradientText) and **7 untested components** that require test implementation. The auth component (AuthLayout) is completely untested.

## Component Inventory

### UI Components (`/components/ui/`)

| Component | File | Lines | Has Tests | Priority |
|-----------|------|-------|-----------|----------|
| PasswordToggle | `PasswordToggle.tsx` | 45 | YES | - |

### Glass UI Components (`/components/ui/glass/`)

| Component | File | Lines | Has Tests | Priority |
|-----------|------|-------|-----------|----------|
| GlowButton | `GlowButton.tsx` | 141 | YES | - |
| GlowBadge | `GlowBadge.tsx` | 58 | YES | - |
| GradientText | `GradientText.tsx` | 36 | YES | - |
| GlassCard | `GlassCard.tsx` | 82 | NO | HIGH |
| GlassInput | `GlassInput.tsx` | 245 | NO | HIGH |
| GlassModal | `GlassModal.tsx` | 246 | NO | HIGH |
| CosmicLoader | `CosmicLoader.tsx` | 74 | NO | MEDIUM |
| ProgressOrbs | `ProgressOrbs.tsx` | 111 | NO | MEDIUM |
| AnimatedBackground | `AnimatedBackground.tsx` | 186 | NO | LOW |

### Mobile UI Components (`/components/ui/mobile/`)

| Component | File | Lines | Has Tests | Priority |
|-----------|------|-------|-----------|----------|
| BottomSheet | `BottomSheet.tsx` | 235 | NO | MEDIUM |

### Auth Components (`/components/auth/`)

| Component | File | Lines | Has Tests | Priority |
|-----------|------|-------|-----------|----------|
| AuthLayout | `AuthLayout.tsx` | 63 | NO | HIGH |

## Current Test Coverage

### Tested Components (4)

1. **PasswordToggle** (`/components/ui/__tests__/PasswordToggle.test.tsx`)
   - 23 test cases
   - Covers: rendering, visibility states, interactions, styling, accessibility

2. **GlowButton** (`/components/ui/glass/__tests__/GlowButton.test.tsx`)
   - 35+ test cases
   - Covers: rendering, variants (8), sizes (3), button types, interactions, disabled state, accessibility, haptic feedback

3. **GlowBadge** (`/components/ui/glass/__tests__/GlowBadge.test.tsx`)
   - 20+ test cases
   - Covers: rendering, variants (4), styling, custom className, edge cases

4. **GradientText** (`/components/ui/glass/__tests__/GradientText.test.tsx`)
   - 12 test cases
   - Covers: rendering, gradient variants (3), custom className, edge cases

### Untested Components (7)

1. **GlassCard** - Interactive card component with animations
2. **GlassInput** - Form input with validation, counters, password toggle
3. **GlassModal** - Modal dialog with focus trap, swipe-to-dismiss
4. **CosmicLoader** - Animated loading spinner
5. **ProgressOrbs** - Multi-step progress indicator
6. **AnimatedBackground** - Background animation layer
7. **BottomSheet** - Mobile bottom sheet with swipe gesture
8. **AuthLayout** - Authentication page layout wrapper

## Priority Components for Testing

### HIGH Priority

#### 1. GlassInput (Most Complex - 245 lines)

**Purpose:** Versatile form input component supporting text, email, password, and textarea types with validation, counters, and animations.

**Props:**
```typescript
interface GlassInputProps {
  type?: 'text' | 'email' | 'password' | 'textarea';
  variant?: 'text' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: boolean;
  maxLength?: number;
  showCounter?: boolean;
  counterMode?: 'characters' | 'words';
  counterFormat?: (count: number, max: number) => string;
  showPasswordToggle?: boolean;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  id?: string;
  className?: string;
  rows?: number;
}
```

**User Interactions:**
- Text input/change
- Focus/blur states
- Password visibility toggle
- Error state shake animation trigger

**Test Cases Needed:**
1. Rendering
   - Renders input element correctly
   - Renders textarea when type='textarea'
   - Renders label when provided
   - Renders with placeholder text
   - Renders required indicator when required=true

2. Input Types
   - Renders as text input by default
   - Renders as email input
   - Renders as password input
   - Renders as textarea with variant='textarea'
   - Password toggle shows/hides password text

3. Value Management
   - Calls onChange with new value on input
   - Displays current value
   - Respects maxLength attribute

4. Character Counter
   - Shows counter when showCounter=true and maxLength set
   - Displays correct character count
   - Shows correct format with counterFormat function
   - Counter color changes based on percentage (safe/warning/danger)

5. Word Counter
   - Shows word count when counterMode='words'
   - Displays "Your thoughts await..." at 0 words
   - Displays "1 thoughtful word" at 1 word
   - Displays "X thoughtful words" at multiple words

6. Validation States
   - Applies error border when error prop set
   - Displays error message below input
   - Applies success border when success=true
   - Shows success checkmark when success=true

7. Focus States
   - Updates border color on focus
   - Triggers focus animation (box-shadow)
   - Removes focus styles on blur

8. Password Toggle Integration
   - Shows PasswordToggle when showPasswordToggle=true
   - Toggles input type between password/text

9. Accessibility
   - Links label to input via htmlFor/id
   - Has proper aria attributes
   - Error message is announced

#### 2. GlassCard (82 lines)

**Purpose:** Glass-morphism styled card container with optional interactive and elevated states.

**Props:**
```typescript
interface GlassCardProps {
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  [key: `data-${string}`]: string | boolean | undefined;
}
```

**User Interactions:**
- Click (when interactive)
- Keyboard activation (Enter/Space when interactive)
- Hover effects

**Test Cases Needed:**
1. Rendering
   - Renders children correctly
   - Renders as motion.div element
   - Applies base glass styling classes

2. Elevated State
   - Applies elevated styling when elevated=true
   - Has shadow-lg class when elevated
   - Has enhanced border when elevated

3. Interactive State
   - Applies cursor-pointer when interactive=true
   - Has hover transition classes when interactive
   - Sets tabIndex=0 when interactive
   - Sets role="button" when interactive
   - Does not set role/tabIndex when not interactive

4. Click Handler
   - Calls onClick when clicked
   - Calls onClick on Enter key press when interactive
   - Calls onClick on Space key press when interactive
   - Does not call onClick when not interactive

5. Touch Feedback
   - Applies whileTap scale animation when interactive with onClick
   - Does not apply animation when no onClick
   - Respects reduced motion preference

6. Custom Styling
   - Applies custom className
   - Applies inline style prop
   - Supports data-* attributes

#### 3. GlassModal (246 lines)

**Purpose:** Modal dialog with glass overlay, focus trap, swipe-to-dismiss on mobile, and responsive layouts.

**Props:**
```typescript
interface GlassModalProps extends GlassBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  disableSwipeDismiss?: boolean;
}
```

**User Interactions:**
- Close button click
- Escape key press
- Overlay click
- Swipe down to dismiss (mobile)

**Test Cases Needed:**
1. Visibility
   - Does not render when isOpen=false
   - Renders when isOpen=true
   - Removes from DOM on close

2. Overlay
   - Renders backdrop overlay when open
   - Closes on overlay click
   - Has blur effect class

3. Close Button
   - Renders close button with X icon
   - Calls onClose when close button clicked
   - Has accessible aria-label
   - Has minimum 44px touch target

4. Title
   - Renders title when provided
   - Does not render title element when not provided
   - Has correct heading level (h2)
   - Links to modal via aria-labelledby

5. Content
   - Renders children content
   - Content is scrollable

6. Keyboard
   - Closes on Escape key press
   - Focus is trapped within modal
   - Returns focus to trigger on close

7. Accessibility
   - Has role="dialog"
   - Has aria-modal="true"
   - Focus auto-moves to close button on open

8. Mobile Behavior (requires useIsMobile mock)
   - Renders full-screen on mobile
   - Shows drag handle on mobile
   - Swipe down dismisses modal (when enabled)
   - disableSwipeDismiss prevents swipe dismiss

9. Animation
   - Animates in when opening
   - Animates out when closing
   - Respects reduced motion preference

#### 4. AuthLayout (63 lines)

**Purpose:** Shared layout wrapper for sign-in/sign-up pages with logo, title, subtitle, and GlassCard container.

**Props:**
```typescript
interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}
```

**User Interactions:**
- Logo link click (navigates to home)

**Test Cases Needed:**
1. Rendering
   - Renders children content
   - Renders inside GlassCard
   - Centers content vertically and horizontally
   - Has max-width container

2. Logo
   - Renders logo emoji and text
   - Logo links to home page "/"
   - Logo has hover effect classes

3. Title
   - Renders title with default "Welcome"
   - Renders custom title when provided
   - Does not render title when explicitly null/undefined
   - Has gradient text styling

4. Subtitle
   - Renders subtitle when provided
   - Does not render subtitle when not provided
   - Has correct styling classes

5. Spacing
   - Has proper spacing when subtitle present
   - Has proper spacing when no subtitle

6. Accessibility
   - Title is h1 element
   - Link is keyboard accessible

### MEDIUM Priority

#### 5. CosmicLoader (74 lines)

**Purpose:** Animated gradient ring loader with configurable sizes and accessibility support.

**Props:**
```typescript
interface CosmicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}
```

**Test Cases Needed:**
1. Rendering
   - Renders loader element
   - Has role="status" for accessibility
   - Has aria-label with custom or default label

2. Sizes
   - Applies small size classes (w-8 h-8)
   - Applies medium size classes (w-16 h-16)
   - Applies large size classes (w-24 h-24)
   - Medium is default size

3. Screen Reader
   - Has sr-only span with label text
   - Custom label overrides default

4. Animation
   - Rotates when motion not reduced
   - Does not animate when prefers-reduced-motion

5. Custom Styling
   - Applies custom className

#### 6. ProgressOrbs (111 lines)

**Purpose:** Multi-step progress indicator with animated orbs and connector lines.

**Props:**
```typescript
interface ProgressOrbsProps {
  steps: number;
  currentStep: number;
  className?: string;
}
```

**Test Cases Needed:**
1. Rendering
   - Renders correct number of orbs
   - Renders connector lines between orbs
   - Does not render connector after last orb

2. Step States
   - Current step orb has active styling
   - Completed steps have completed styling
   - Future steps have inactive styling

3. Visual Indicators
   - Active orb has glow effect
   - Completed orbs have different gradient
   - Connector lines show completion state

4. Animation
   - Orbs animate when motion enabled
   - Respects reduced motion preference

5. Custom Styling
   - Applies custom className

#### 7. BottomSheet (235 lines)

**Purpose:** Mobile-native bottom sheet with swipe-to-dismiss, multiple height modes, and focus trap.

**Props:**
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: 'auto' | 'half' | 'full';
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

**Test Cases Needed:**
1. Visibility
   - Does not render when isOpen=false
   - Renders when isOpen=true
   - Animates in from bottom

2. Height Modes
   - Applies auto height (max-h-[90vh])
   - Applies half height (h-[50vh])
   - Applies full height (h-[90vh])
   - Auto is default

3. Title
   - Renders title when provided
   - Does not render title when not provided

4. Drag Handle
   - Renders drag handle indicator
   - Has cursor-grab class

5. Dismiss Behaviors
   - Closes on backdrop click
   - Closes on Escape key
   - Swipe down dismisses (velocity or distance threshold)
   - Snaps back on incomplete swipe

6. Body Scroll Lock
   - Locks body scroll when open
   - Restores body scroll on close

7. Focus
   - Traps focus within sheet
   - Returns focus on close

8. Accessibility
   - Has role="dialog"
   - Has aria-modal="true"
   - Has aria-labelledby when title present

### LOW Priority

#### 8. AnimatedBackground (186 lines)

**Purpose:** Decorative three-layer atmospheric background with animated gradients.

**Props:**
```typescript
interface AnimatedBackgroundProps {
  variant?: 'cosmic' | 'dream' | 'glow';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}
```

**Test Cases Needed:**
1. Rendering
   - Renders container element
   - Has pointer-events-none class
   - Has absolute positioning
   - Has overflow-hidden

2. Variants
   - Applies cosmic variant classes
   - Applies dream variant classes
   - Applies glow variant classes
   - Cosmic is default

3. Intensity
   - Applies subtle intensity (default)
   - Applies medium intensity
   - Applies strong intensity

4. Animation
   - Disables animation when prefers-reduced-motion
   - Renders all four animated layers

5. Custom Styling
   - Applies custom className

## Mocking Requirements

### Required Mocks

#### 1. Framer Motion (`framer-motion`)

Already partially mocked. For testing animated components, consider:

```typescript
// Mock useReducedMotion hook
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false), // or true for reduced motion tests
  };
});
```

#### 2. useIsMobile Hook (`@/hooks`)

Required for GlassModal and BottomSheet mobile behavior testing:

```typescript
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useIsMobile: vi.fn(() => false), // or true for mobile tests
  };
});
```

#### 3. Haptic Feedback (`@/lib/utils/haptics`)

Already mocked globally in `vitest.setup.ts`:
```typescript
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
  isHapticSupported: vi.fn(() => true),
}));
```

#### 4. react-focus-lock

For modal/sheet focus trap testing:
```typescript
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
```

#### 5. Next.js Link (`next/link`)

For AuthLayout testing:
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
```

#### 6. Word Count Utility (`@/lib/utils/wordCount`)

For GlassInput word counter tests:
```typescript
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: vi.fn((text: string) => text.trim().split(/\s+/).filter(Boolean).length),
}));
```

### Test Utilities Available

The project has existing test infrastructure:
- `@testing-library/react` for rendering and queries
- `@testing-library/jest-dom` for matchers
- `vitest` for test runner
- `happy-dom` as test environment
- Existing mocks in `/test/mocks/` (supabase, anthropic, cookies)

### Testing Pattern Recommendations

Based on existing tests, follow these patterns:

1. **Group tests by category:**
   - `describe('rendering', ...)`
   - `describe('variants', ...)`
   - `describe('interactions', ...)`
   - `describe('accessibility', ...)`

2. **Use screen queries from RTL:**
   - `screen.getByRole()` for interactive elements
   - `screen.getByText()` for content
   - `screen.getByLabelText()` for form controls

3. **Test class assertions:**
   ```typescript
   expect(element).toHaveClass('expected-class');
   ```

4. **Test interactions:**
   ```typescript
   fireEvent.click(element);
   fireEvent.keyDown(element, { key: 'Enter' });
   ```

## Recommendations for Builder

1. **Start with GlassInput** - Most complex component with highest user impact
2. **Use existing test patterns** - Mirror structure from GlowButton.test.tsx
3. **Create helper for motion mocking** - Reusable mock for useReducedMotion
4. **Group mobile-specific tests** - Use describe blocks for mobile behavior
5. **Test accessibility first** - Ensure WCAG compliance in all components

## File Structure for New Tests

```
components/
├── auth/
│   └── __tests__/
│       └── AuthLayout.test.tsx          # NEW
├── ui/
│   ├── glass/
│   │   └── __tests__/
│   │       ├── GlassCard.test.tsx       # NEW
│   │       ├── GlassInput.test.tsx      # NEW
│   │       ├── GlassModal.test.tsx      # NEW
│   │       ├── CosmicLoader.test.tsx    # NEW
│   │       ├── ProgressOrbs.test.tsx    # NEW
│   │       ├── AnimatedBackground.test.tsx # NEW
│   │       ├── GlowButton.test.tsx      # EXISTS
│   │       ├── GlowBadge.test.tsx       # EXISTS
│   │       └── GradientText.test.tsx    # EXISTS
│   ├── mobile/
│   │   └── __tests__/
│   │       └── BottomSheet.test.tsx     # NEW
│   └── __tests__/
│       └── PasswordToggle.test.tsx      # EXISTS
```

## Estimated Test Count

| Component | Estimated Tests | Complexity |
|-----------|-----------------|------------|
| GlassInput | 35-45 | HIGH |
| GlassModal | 25-35 | HIGH |
| GlassCard | 20-25 | MEDIUM |
| AuthLayout | 12-15 | LOW |
| BottomSheet | 25-30 | HIGH |
| CosmicLoader | 10-12 | LOW |
| ProgressOrbs | 12-15 | MEDIUM |
| AnimatedBackground | 10-12 | LOW |

**Total Estimated: 149-189 new test cases**
