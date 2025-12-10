# Technology Stack

## Core Framework

**Decision:** Next.js 14 with App Router (existing)

**Rationale:**
- Project already uses Next.js 14
- No changes to framework required
- Server Components / Client Components patterns already established

## UI Framework

**Decision:** React 18 with 'use client' directive

**Rationale:**
- MobileReflectionFlow requires client-side state (wizard navigation)
- All components in mobile reflection flow are client components
- Hooks require client-side React features

## State Management

**Decision:** React hooks (useState, useCallback, useMemo, useEffect)

**Rationale:**
- Component-local state is sufficient for wizard navigation
- No need for global state management (Redux, Zustand)
- Form state already managed by parent via props

## Animation Library

**Decision:** Framer Motion (existing)

**Rationale:**
- Already used throughout the codebase
- GazingOverlay uses shared animation variants
- Swipe gesture handling via PanInfo
- AnimatePresence for step transitions

**Key APIs Used:**
- `motion` - Animated components
- `AnimatePresence` - Exit animations
- `useReducedMotion` - Accessibility
- `PanInfo` - Swipe gesture data

## Styling

**Decision:** Tailwind CSS (existing)

**Rationale:**
- Project standard
- All existing components use Tailwind
- `cn()` utility for conditional classes

## Testing Framework

**Decision:** Vitest + React Testing Library

**Rationale:**
- Project already configured with Vitest
- happy-dom environment for DOM simulation
- Established patterns in codebase

**Key Testing Tools:**
- `vitest` - Test runner
- `@testing-library/react` - renderHook, render, screen, fireEvent
- `@testing-library/user-event` - User interaction simulation

## Type System

**Decision:** TypeScript 5.x (strict mode)

**Rationale:**
- Project standard
- Strict mode enabled
- All new code must be fully typed

## Dependencies

### Runtime Dependencies (Already Installed)

| Package | Purpose | Usage |
|---------|---------|-------|
| `framer-motion` | Animations, gestures | Step transitions, swipe handling |
| `lucide-react` | Icons | Navigation icons (X, ChevronLeft, ChevronRight, Check) |
| `next` | Framework | useRouter for navigation |

### Development Dependencies (Already Installed)

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner |
| `@testing-library/react` | Component testing |
| `@testing-library/user-event` | User interactions |
| `happy-dom` | DOM environment |

## Shared Modules to Import

### From `@/lib/reflection/constants`

```typescript
import {
  QUESTIONS,           // Question content array
  STORAGE_KEY,         // LocalStorage key
  CATEGORY_EMOJI,      // Category icon mapping
  GAZING_STATUS_MESSAGES,  // Loading messages
  EMPTY_FORM_DATA,     // Default form state
} from '@/lib/reflection/constants';
```

### From `@/lib/reflection/types`

```typescript
import type {
  FormData,            // Form data interface
  ReflectionQuestion,  // Question interface
} from '@/lib/reflection/types';
```

### From `@/lib/utils/constants`

```typescript
import {
  QUESTION_LIMITS,     // Character limits per field
  type ToneId,         // Tone type
} from '@/lib/utils/constants';
```

## Component Imports

### Existing Mobile Components to Reuse

```typescript
// Question step - full-screen question display
import { QuestionStep } from '@/components/reflection/mobile/QuestionStep';

// Tone selection step
import { ToneStep } from '@/components/reflection/mobile/ToneStep';

// Exit confirmation modal
import { ExitConfirmation } from '@/components/reflection/mobile/ExitConfirmation';

// Loading overlay
import { GazingOverlay } from '@/components/reflection/mobile/GazingOverlay';
```

### UI Components

```typescript
import { GlowButton, GlassInput } from '@/components/ui/glass';
import { ProgressOrbs } from '@/components/ui/glass/ProgressOrbs';
```

### Utilities

```typescript
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/utils/haptics';
```

### Hooks

```typescript
import { useKeyboardHeight } from '@/hooks';
import { useHideBottomNav } from '@/contexts/NavigationContext';
```

### Animation Variants

```typescript
import { stepTransitionVariants } from '@/lib/animations/variants';
```

## Environment Variables

No new environment variables required for this refactoring.

## Performance Considerations

### Bundle Size
- No new dependencies added
- Existing component reuse reduces duplication
- Hook extraction doesn't affect bundle size

### Runtime Performance
- Same animation performance (Framer Motion)
- Same gesture handling (existing thresholds)
- Memoization via useCallback/useMemo preserved

## Security Considerations

### LocalStorage
- Uses existing STORAGE_KEY constant
- Same 24-hour expiry logic
- Cleared on successful submit or exit confirmation

### Input Validation
- Handled by parent component (useReflectionForm)
- QUESTION_LIMITS enforced by GlassInput

## Code Quality Standards

### TypeScript
- Strict mode enabled
- All interfaces explicitly typed
- No `any` types

### Testing
- Hooks: 90% coverage target
- Components: 80% coverage target
- Integration: 80% coverage target

### Linting
- ESLint with project config
- No unused imports
- Consistent import ordering
