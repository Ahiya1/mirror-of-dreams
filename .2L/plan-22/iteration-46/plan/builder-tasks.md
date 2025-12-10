# Builder Task Breakdown - Iteration 46

## Overview

2 primary builders will work in parallel on separate component sets.
No splitting expected due to clear scope boundaries.

## Builder Assignment Strategy

- **Builder-1**: Desktop view components (3 files, ~30 test cases)
- **Builder-2**: Shared components (3 files, ~29 test cases)
- Builders work on isolated directories - no file conflicts
- Both builders can complete independently

---

## Builder-1: Desktop View Component Tests

### Scope

Create comprehensive tests for the 3 desktop view components:
1. DreamSelectionView
2. ReflectionFormView
3. ReflectionOutputView

### Complexity Estimate

**MEDIUM**

- 3 component test files
- ~30 test cases total
- ReflectionFormView is most complex (orchestrates child components)
- Standard mocking patterns apply

### Success Criteria

- [ ] DreamSelectionView.test.tsx created with 10+ test cases
- [ ] ReflectionFormView.test.tsx created with 13+ test cases
- [ ] ReflectionOutputView.test.tsx created with 7+ test cases
- [ ] All tests pass with `npm run test`
- [ ] No TypeScript errors
- [ ] 80%+ coverage for these components

### Files to Create

```
components/reflection/views/__tests__/
  DreamSelectionView.test.tsx  (~10 tests)
  ReflectionFormView.test.tsx  (~13 tests)
  ReflectionOutputView.test.tsx (~7 tests)
```

### Dependencies

**Depends on:** None
**Blocks:** None (parallel with Builder-2)

### Implementation Notes

#### DreamSelectionView (~10 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/views/DreamSelectionView.tsx`

**Required Mocks:**
- `next/navigation` - for router.push()
- `framer-motion` - for motion.div animation
- `@/components/ui/glass` - for GlassCard, GlowButton

**Test Cases:**
1. Renders heading "Which dream are you reflecting on?"
2. Renders all dream cards with correct titles
3. Displays correct category emoji for each dream
4. Shows days left indicator (X days left)
5. Shows "Today!" for daysLeft === 0
6. Shows "Xd overdue" for negative daysLeft
7. Shows checkmark for selected dream
8. Calls onDreamSelect when dream clicked
9. Handles keyboard selection (Enter/Space)
10. Empty state shows message and CTA button
11. Empty state CTA navigates to /dreams

**Key Props:**
```typescript
interface DreamSelectionViewProps {
  dreams: Dream[];
  selectedDreamId: string;
  onDreamSelect: (dreamId: string) => void;
}
```

#### ReflectionFormView (~13 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/views/ReflectionFormView.tsx`

**Required Mocks:**
- `@/components/reflection/ProgressBar`
- `@/components/reflection/ReflectionQuestionCard`
- `@/components/reflection/ToneSelectionCard`
- `@/components/ui/glass` - for GlowButton, CosmicLoader

**Test Cases:**
1. Renders welcome message from REFLECTION_MICRO_COPY
2. Renders dream context banner when selectedDream provided
3. Does not render banner when selectedDream is null
4. Dream banner shows title, category, and days remaining
5. Shows "Today!" for daysLeft === 0
6. Shows "X days overdue" for negative daysLeft
7. Renders ProgressBar component
8. Renders all 4 ReflectionQuestionCard components
9. Calls onFieldChange when question input changes
10. Renders ToneSelectionCard with correct props
11. Calls onToneSelect when tone changed
12. Submit button shows "Gaze into the Mirror" text
13. Submit button shows loading state when isSubmitting
14. Submit button is disabled when isSubmitting
15. Calls onSubmit when button clicked

**Key Props:**
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

#### ReflectionOutputView (~7 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/views/ReflectionOutputView.tsx`

**Required Mocks:**
- `@/components/reflections/AIResponseRenderer`
- `@/components/ui/glass` - for GlassCard, GlowButton, CosmicLoader

**Test Cases:**
1. Shows CosmicLoader when isLoading=true
2. Shows "Loading reflection..." text when loading
3. Does not show content when loading
4. Renders AIResponseRenderer with content when not loading
5. Renders "Your Reflection" heading
6. Renders "Create New Reflection" button
7. Calls onCreateNew when button clicked
8. Handles empty content gracefully

**Key Props:**
```typescript
interface ReflectionOutputViewProps {
  content: string;
  isLoading: boolean;
  onCreateNew: () => void;
}
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use framer-motion mock pattern for DreamSelectionView
- Use barrel import mock for glass components
- Use child component mocks for ReflectionFormView
- Follow test file structure pattern with describe blocks

### Testing Requirements

- Unit tests for all 3 components
- Coverage target: 80%+
- All tests must pass

---

## Builder-2: Shared Component Tests

### Scope

Create comprehensive tests for the 3 shared reflection components:
1. ReflectionQuestionCard
2. ToneSelection
3. ToneSelectionCard

### Complexity Estimate

**MEDIUM**

- 3 component test files
- ~29 test cases total
- ToneSelectionCard has most complexity (animations, keyboard handling)
- Standard mocking patterns apply

### Success Criteria

- [ ] ReflectionQuestionCard.test.tsx created with 9+ test cases
- [ ] ToneSelection.test.tsx created with 10+ test cases
- [ ] ToneSelectionCard.test.tsx created with 10+ test cases
- [ ] All tests pass with `npm run test`
- [ ] No TypeScript errors
- [ ] 80%+ coverage for these components

### Files to Create

```
components/reflection/__tests__/
  ReflectionQuestionCard.test.tsx (~9 tests)
  ToneSelection.test.tsx (~10 tests)
  ToneSelectionCard.test.tsx (~10 tests)
```

### Dependencies

**Depends on:** None
**Blocks:** None (parallel with Builder-1)

### Implementation Notes

#### ReflectionQuestionCard (~9 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ReflectionQuestionCard.tsx`

**Required Mocks:**
- `@/components/ui/glass` - for GlassInput (as textarea mock)

**Test Cases:**
1. Renders guiding text with italic styling
2. Renders question number and text combined
3. Renders textarea with correct placeholder
4. Renders textarea with correct maxLength
5. Passes showCounter prop to GlassInput
6. Calls onChange when text entered
7. Displays current value in textarea
8. Applies gradient text styling to question heading
9. Has correct CSS classes on container

**Key Props:**
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

**Note:** Component uses React.memo - focus on behavioral tests, not memoization.

#### ToneSelection (~10 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelection.tsx`

**Required Mocks:**
- `@/components/ui/glass/GlowButton`

**Test Cases:**
1. Renders all 3 tone options (fusion, gentle, intense)
2. Renders tone labels from TONES constant
3. Renders radiogroup with correct aria attributes
4. Shows sparkle indicator (emoji) for selected tone
5. Shows ring styling for selected tone
6. Calls onSelect when tone clicked
7. Does not call onSelect when clicking already selected tone
8. Respects disabled prop
9. Shows tone description in aria-live region
10. Uses correct variant per tone (primary/cosmic)

**Key Props:**
```typescript
interface ToneSelectionProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
  disabled?: boolean;
}
```

**Note:** Component uses navigator.vibrate for haptic - already mocked globally.

#### ToneSelectionCard (~10 test cases)

**Component Path:** `/home/ahiya/Ahiya/2L/Prod/mirror-of-dreams/components/reflection/ToneSelectionCard.tsx`

**Required Mocks:**
- `framer-motion` - for motion.button, useReducedMotion
- `@/components/ui/glass` - for GlassCard

**Test Cases:**
1. Renders section heading "Choose Your Reflection Tone"
2. Renders subheading "How shall the mirror speak to you?"
3. Renders all 3 tone cards in grid
4. Each card shows icon, name, and description
5. Shows "Selected" indicator with checkmark on selected card
6. Calls onSelect when card clicked
7. Handles keyboard selection with Enter
8. Handles keyboard selection with Space
9. Has aria-pressed="true" for selected card
10. Has aria-pressed="false" for unselected cards
11. Has descriptive aria-label for each card

**Key Props:**
```typescript
interface ToneSelectionCardProps {
  selectedTone: ToneId;
  onSelect: (tone: ToneId) => void;
}
```

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use GlassInput mock pattern for ReflectionQuestionCard
- Use GlowButton mock pattern for ToneSelection
- Use framer-motion mock pattern for ToneSelectionCard
- Follow test file structure pattern with describe blocks

### Testing Requirements

- Unit tests for all 3 components
- Coverage target: 80%+
- All tests must pass

---

## Builder Execution Order

### Parallel Group (No dependencies)

Both builders can start immediately and work in parallel:

| Builder | Components | Directory | Test Count |
|---------|------------|-----------|------------|
| Builder-1 | Desktop views | `views/__tests__/` | ~30 |
| Builder-2 | Shared components | `__tests__/` | ~29 |

### Integration Notes

1. No file conflicts - builders work in separate directories
2. Both use same mocking patterns from `patterns.md`
3. Final validation runs full test suite
4. Both builders should verify their tests pass before completion

### Shared Test Data Factories

Both builders should use consistent test data factories:

```typescript
// Dream factory
const createMockDream = (overrides = {}) => ({
  id: 'dream-1',
  title: 'Test Dream',
  category: 'creative',
  daysLeft: 30,
  ...overrides,
});

// FormData factory
const createMockFormData = (overrides = {}) => ({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
  ...overrides,
});
```

### Validation Checklist

After both builders complete:

- [ ] Run `npm run test` - all tests pass
- [ ] Run `npm run test:coverage` - verify 80%+ coverage
- [ ] Verify 6 new test files created
- [ ] No TypeScript errors
- [ ] Total ~59 test cases across both builders
