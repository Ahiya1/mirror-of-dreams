# Explorer 1 Report: Reflection Components Analysis for Testing

## Executive Summary

The reflection component directory contains 14 component files across 3 subdirectories. Currently, only 5 components have test coverage (CharacterCounter, ProgressBar, ToneBadge, MobileReflectionFlow, and MobileDreamSelectionView). The priority components from the vision document include 3 desktop views, 1 mobile view, and 2 shared components - of which only MobileDreamSelectionView has tests. This iteration should focus on creating comprehensive tests for the 6 untested priority components: DreamSelectionView, ReflectionFormView, ReflectionOutputView, ReflectionQuestionCard, ToneSelection, and ToneSelectionCard.

## Component Inventory

### Root Components (`/components/reflection/`)

| Component | Lines | Has Tests | Test Coverage |
|-----------|-------|-----------|---------------|
| CharacterCounter.tsx | 50 | Yes | Full coverage |
| ProgressBar.tsx | 66 | Yes | Full coverage |
| ProgressIndicator.tsx | 27 | No | None |
| QuestionStep.tsx | 158 | No | None |
| ReflectionQuestionCard.tsx | 67 | No | **PRIORITY** |
| ToneBadge.tsx | 46 | Yes | Full coverage |
| ToneSelection.tsx | 104 | No | **PRIORITY** |
| ToneSelectionCard.tsx | 172 | No | **PRIORITY** |

### Desktop Views (`/components/reflection/views/`)

| Component | Lines | Has Tests | Test Coverage |
|-----------|-------|-----------|---------------|
| DreamSelectionView.tsx | 109 | No | **PRIORITY** |
| ReflectionFormView.tsx | 128 | No | **PRIORITY** |
| ReflectionOutputView.tsx | 56 | No | **PRIORITY** |

### Mobile Components (`/components/reflection/mobile/`)

| Component | Lines | Has Tests | Test Coverage |
|-----------|-------|-----------|---------------|
| DreamBottomSheet.tsx | 281 | No | None |
| ExitConfirmation.tsx | 37 | No | None |
| GazingOverlay.tsx | 355 | No | None |
| MobileReflectionFlow.tsx | ~400 | Yes | Comprehensive |
| QuestionStep.tsx | 146 | No | None |
| ToneStep.tsx | 168 | No | None |

### Mobile Views (`/components/reflection/mobile/views/`)

| Component | Lines | Has Tests | Test Coverage |
|-----------|-------|-----------|---------------|
| MobileDreamSelectionView.tsx | 101 | Yes | Full coverage |

## Current Test Coverage

### Existing Test Files

1. **`/components/reflection/__tests__/CharacterCounter.test.tsx`** (171 lines)
   - Tests: display, progress bar, warning/error states, accessibility
   - Coverage: Comprehensive

2. **`/components/reflection/__tests__/ProgressBar.test.tsx`** (148 lines)
   - Tests: rendering, step states, styling, edge cases
   - Coverage: Comprehensive

3. **`/components/reflection/__tests__/ToneBadge.test.tsx`** (117 lines)
   - Tests: rendering, tone colors, glow effect, custom className
   - Coverage: Comprehensive

4. **`/components/reflection/mobile/__tests__/MobileReflectionFlow.test.tsx`** (398 lines)
   - Tests: rendering, wizard flow, exit confirmation, gazing overlay, accessibility
   - Coverage: Comprehensive integration tests

5. **`/components/reflection/mobile/views/__tests__/MobileDreamSelectionView.test.tsx`** (459 lines)
   - Tests: rendering, empty state, selection, accessibility, edge cases
   - Coverage: Comprehensive

### Test Infrastructure

- **Test Runner:** Vitest with happy-dom environment
- **Setup File:** `/vitest.setup.ts` with:
  - `@testing-library/jest-dom/vitest` matchers
  - Haptics mock globally applied
  - Environment variables configured
  - Global fetch mock

## Priority Components for Testing

### 1. DreamSelectionView.tsx (PRIORITY 1)

**Location:** `/components/reflection/views/DreamSelectionView.tsx`

**Purpose:** Desktop dream selection view for reflection questionnaire

**Props Interface:**
```typescript
interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
}
```

**User Interactions:**
- Click on dream card to select
- Keyboard navigation (Enter/Space to select)
- Click "Create Your First Dream" button in empty state

**Test Cases Required:**
1. Renders heading "Which dream are you reflecting on?"
2. Renders all dream cards with correct titles
3. Displays correct category emoji for each dream
4. Shows days left indicator (overdue, today, days remaining)
5. Shows checkmark for selected dream
6. Applies selected styling (border-mirror-amethyst/60)
7. Calls onDreamSelect when dream clicked
8. Keyboard accessibility - Enter/Space triggers selection
9. Empty state shows "No active dreams yet." message
10. Empty state button navigates to /dreams

---

### 2. ReflectionFormView.tsx (PRIORITY 1)

**Location:** `/components/reflection/views/ReflectionFormView.tsx`

**Purpose:** Main reflection form with all questions and tone selection

**Props Interface:**
```typescript
interface ReflectionFormViewProps {
  selectedDream: Dream | null;
  formData: FormData;
  onFieldChange: (field: keyof FormData, value: string) => void;
  selectedTone: ToneId;
  onToneSelect: (tone: ToneId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}
```

**User Interactions:**
- Fill in each question textarea
- Select tone
- Click submit button

**Test Cases Required:**
1. Renders welcome message from REFLECTION_MICRO_COPY
2. Renders dream context banner when selectedDream provided
3. Dream banner shows title, category, and days remaining
4. Renders ProgressBar with correct steps
5. Renders all 4 ReflectionQuestionCard components
6. Each question receives correct props (text, guide, placeholder, maxLength)
7. Calls onFieldChange when question input changes
8. Renders ToneSelectionCard with correct props
9. Calls onToneSelect when tone changed
10. Submit button shows "Gaze into the Mirror" text
11. Submit button shows loading state when isSubmitting=true
12. Submit button is disabled when isSubmitting=true
13. Calls onSubmit when button clicked

---

### 3. ReflectionOutputView.tsx (PRIORITY 1)

**Location:** `/components/reflection/views/ReflectionOutputView.tsx`

**Purpose:** Display AI-generated reflection output

**Props Interface:**
```typescript
interface ReflectionOutputViewProps {
  content: string;
  isLoading: boolean;
  onCreateNew: () => void;
}
```

**User Interactions:**
- Click "Create New Reflection" button

**Test Cases Required:**
1. Shows CosmicLoader when isLoading=true
2. Shows "Loading reflection..." text when loading
3. Renders AIResponseRenderer with content when not loading
4. Renders "Your Reflection" heading
5. Renders "Create New Reflection" button
6. Calls onCreateNew when button clicked
7. Handles empty content gracefully

---

### 4. ReflectionQuestionCard.tsx (PRIORITY 2)

**Location:** `/components/reflection/ReflectionQuestionCard.tsx`

**Purpose:** Individual question card with guiding text and input

**Props Interface:**
```typescript
interface ReflectionQuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  guidingText: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}
```

**User Interactions:**
- Type in textarea

**Test Cases Required:**
1. Renders guiding text with italic styling
2. Renders question number and text
3. Renders GlassInput textarea with correct props
4. Input shows word counter
5. Calls onChange when text entered
6. Handles maxLength restriction
7. React.memo prevents unnecessary re-renders
8. Correct placeholder text displayed
9. Gradient text styling applied to question

---

### 5. ToneSelection.tsx (PRIORITY 2)

**Location:** `/components/reflection/ToneSelection.tsx`

**Purpose:** Tone picker with button interface

**Props Interface:**
```typescript
interface ToneSelectionProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
  disabled?: boolean;
}
```

**User Interactions:**
- Click tone button to select
- Keyboard navigation (Enter/Space)

**Test Cases Required:**
1. Renders all 3 tone options (fusion, gentle, intense)
2. Shows tone labels from TONES constant
3. Selected tone has ring styling and sparkle indicator
4. Unselected tones show secondary variant
5. Calls onSelect when tone clicked
6. Keyboard accessibility - Enter/Space triggers selection
7. Respects disabled prop
8. Shows tone description in aria-live region
9. Correct variant applied per tone (primary/cosmic)
10. Haptic feedback triggered on selection

---

### 6. ToneSelectionCard.tsx (PRIORITY 2)

**Location:** `/components/reflection/ToneSelectionCard.tsx`

**Purpose:** Rich card-based tone selection with icons

**Props Interface:**
```typescript
interface ToneSelectionCardProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
}
```

**User Interactions:**
- Click tone card to select
- Keyboard navigation (Enter/Space)

**Test Cases Required:**
1. Renders section heading "Choose Your Reflection Tone"
2. Renders subheading "How shall the mirror speak to you?"
3. Renders all 3 tone cards in grid
4. Each card shows icon, name, and description
5. Selected card has elevated and highlighted styling
6. Shows "Selected" indicator with checkmark on selected
7. Calls onSelect when card clicked
8. Keyboard accessibility - aria-pressed attribute
9. Hover effect with glow color per tone
10. Animation respects prefers-reduced-motion

## Mocking Requirements

### Required Mocks

1. **next/navigation**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
```

2. **framer-motion** (for components with motion elements)
```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>{children}</div>
    ),
    button: ({ children, onClick, className, ...props }) => (
      <button onClick={onClick} className={className} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));
```

3. **Haptics** (already globally mocked in vitest.setup.ts)
```typescript
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));
```

4. **AIResponseRenderer** (for ReflectionOutputView)
```typescript
vi.mock('@/components/reflections/AIResponseRenderer', () => ({
  AIResponseRenderer: ({ content }: { content: string }) => (
    <div data-testid="ai-response">{content}</div>
  ),
}));
```

5. **GlassInput** (for form components)
```typescript
vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({ value, onChange, placeholder, ...props }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid="glass-input"
      {...props}
    />
  ),
}));
```

### Test Data Factories

**Dream Factory:**
```typescript
const createMockDream = (overrides = {}) => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'Dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-01-15',
  ...overrides,
});
```

**FormData Factory:**
```typescript
const createMockFormData = (overrides = {}) => ({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
  ...overrides,
});
```

## Testing Patterns to Follow

### From Existing Tests

Based on analysis of existing test files, follow these patterns:

1. **Use `describe` blocks** for logical groupings:
   - `describe('rendering', () => {...})`
   - `describe('interactions', () => {...})`
   - `describe('accessibility', () => {...})`
   - `describe('edge cases', () => {...})`

2. **Use `screen` queries** from React Testing Library:
   - `screen.getByText()` for visible text
   - `screen.getByRole()` for accessibility
   - `screen.getByTestId()` for specific elements
   - `screen.queryBy*()` for assertions on non-existence

3. **Use `fireEvent` or `userEvent`** for interactions:
   - `fireEvent.click()` for simple clicks
   - `fireEvent.keyDown()` for keyboard events

4. **Mock framer-motion** with simplified components that preserve class names and data-testid attributes

5. **Clear mocks** in `beforeEach`:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Complexity Assessment

### Low Complexity (Easy to test)

- **ReflectionOutputView**: Simple conditional rendering, one interaction
- **ExitConfirmation**: Pure presentational with callbacks

### Medium Complexity

- **DreamSelectionView**: List rendering, selection state, keyboard events
- **ReflectionQuestionCard**: Memoized component, GlassInput integration
- **ToneSelection**: Multiple buttons, variant logic

### High Complexity

- **ReflectionFormView**: Orchestrates multiple child components
- **ToneSelectionCard**: Animations, hover effects, reduced motion support

## Recommendations for Builder

1. **Start with Low Complexity Components:**
   - ReflectionOutputView (simplest, ~7 test cases)
   - Then DreamSelectionView (~10 test cases)

2. **Create Shared Test Utilities:**
   - Mock factory for Dream objects
   - Mock factory for FormData objects
   - Shared framer-motion mock

3. **Test File Structure:**
```
components/reflection/
  __tests__/
    DreamSelectionView.test.tsx (NEW)
    ReflectionFormView.test.tsx (NEW)
    ReflectionOutputView.test.tsx (NEW)
    ReflectionQuestionCard.test.tsx (NEW)
    ToneSelection.test.tsx (NEW)
    ToneSelectionCard.test.tsx (NEW)
```

4. **Focus on User-Visible Behavior:**
   - Test what users see and do
   - Avoid testing implementation details
   - Use accessible queries (getByRole, getByLabelText)

5. **Consider Test Performance:**
   - Use mocked framer-motion to avoid animation delays
   - Reuse mock factories across tests

## Resource Map

### Critical Files

| Path | Purpose |
|------|---------|
| `/components/reflection/views/DreamSelectionView.tsx` | Priority 1 - Desktop dream selection |
| `/components/reflection/views/ReflectionFormView.tsx` | Priority 1 - Main form view |
| `/components/reflection/views/ReflectionOutputView.tsx` | Priority 1 - Output display |
| `/components/reflection/ReflectionQuestionCard.tsx` | Priority 2 - Question card |
| `/components/reflection/ToneSelection.tsx` | Priority 2 - Button tone picker |
| `/components/reflection/ToneSelectionCard.tsx` | Priority 2 - Card tone picker |

### Type Dependencies

| Path | Purpose |
|------|---------|
| `/lib/reflection/types.ts` | Dream, FormData, ViewMode interfaces |
| `/lib/utils/constants.ts` | ToneId, TONES, REFLECTION_MICRO_COPY |
| `/lib/reflection/constants.ts` | QUESTIONS, CATEGORY_EMOJI |

### UI Components Used

| Component | Location |
|-----------|----------|
| GlassCard | `/components/ui/glass/GlassCard.tsx` |
| GlowButton | `/components/ui/glass/GlowButton.tsx` |
| GlassInput | `/components/ui/glass/GlassInput.tsx` |
| CosmicLoader | `/components/ui/glass/CosmicLoader.tsx` |
| AIResponseRenderer | `/components/reflections/AIResponseRenderer.tsx` |

## Questions for Planner

1. Should ToneSelectionCard be tested separately or as integration with ToneSelection?
2. Are snapshot tests desired for visual consistency of styled components?
3. Should accessibility testing include axe-core integration?
4. What is the target line coverage percentage for this iteration (80% per vision)?

---

**Report Generated:** 2025-12-10
**Explorer:** 1
**Iteration:** 46
**Plan:** plan-22
