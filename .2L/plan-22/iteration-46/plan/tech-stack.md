# Technology Stack - Iteration 46

## Testing Framework

**Decision:** Vitest with React Testing Library

**Rationale:**
- Already configured in project (`vitest.config.ts`, `vitest.setup.ts`)
- Fast execution with happy-dom environment
- Excellent React Testing Library integration
- Jest-compatible matchers via `@testing-library/jest-dom/vitest`

## Test Configuration

### Vitest Setup
- **Environment:** happy-dom
- **Setup file:** `/vitest.setup.ts`
- **Config file:** `/vitest.config.ts`

### Pre-configured Global Mocks

The following are already mocked in `vitest.setup.ts`:

```typescript
// Haptic feedback - globally mocked
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
  isHapticSupported: vi.fn(() => true),
}));

// Global fetch mock
global.fetch = vi.fn();
```

### Environment Variables (Pre-set)

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.DOMAIN = 'http://localhost:3000';
```

## Required Test Dependencies

All dependencies are already installed:

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^2.x | Test runner |
| @testing-library/react | ^14.x | React component testing |
| @testing-library/jest-dom | ^6.x | DOM matchers |
| happy-dom | ^12.x | DOM environment |

## Component Dependencies to Mock

### 1. next/navigation

Required for components using `useRouter`:

```typescript
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));
```

**Used by:** DreamSelectionView (empty state navigation)

### 2. framer-motion

Required for animated components:

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));
```

**Used by:** DreamSelectionView, ToneSelectionCard

### 3. UI Glass Components

Mock complex UI components to isolate test scope:

```typescript
// GlassCard - pass-through mock
vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="glass-card" {...props}>{children}</div>
  ),
}));

// GlowButton - pass-through mock
vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

// GlassInput - textarea mock
vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid="glass-input"
      {...props}
    />
  ),
}));

// CosmicLoader - simple mock
vi.mock('@/components/ui/glass/CosmicLoader', () => ({
  CosmicLoader: ({ size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>Loading...</div>
  ),
}));
```

### 4. AIResponseRenderer

```typescript
vi.mock('@/components/reflections/AIResponseRenderer', () => ({
  AIResponseRenderer: ({ content }: { content: string }) => (
    <div data-testid="ai-response">{content}</div>
  ),
}));
```

**Used by:** ReflectionOutputView

### 5. Child Components (for ReflectionFormView)

```typescript
// Mock ProgressBar
vi.mock('@/components/reflection/ProgressBar', () => ({
  ProgressBar: ({ currentStep, totalSteps }: any) => (
    <div data-testid="progress-bar" data-step={currentStep} data-total={totalSteps} />
  ),
}));

// Mock ReflectionQuestionCard
vi.mock('@/components/reflection/ReflectionQuestionCard', () => ({
  ReflectionQuestionCard: ({ questionNumber, questionText, value, onChange }: any) => (
    <div data-testid={`question-card-${questionNumber}`}>
      <span>{questionText}</span>
      <textarea
        data-testid={`question-input-${questionNumber}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

// Mock ToneSelectionCard
vi.mock('@/components/reflection/ToneSelectionCard', () => ({
  ToneSelectionCard: ({ selectedTone, onSelect }: any) => (
    <div data-testid="tone-selection-card" data-selected={selectedTone}>
      <button onClick={() => onSelect('fusion')}>Fusion</button>
      <button onClick={() => onSelect('gentle')}>Gentle</button>
      <button onClick={() => onSelect('intense')}>Intense</button>
    </div>
  ),
}));
```

## Type Dependencies

### Core Types

```typescript
// From lib/reflection/types.ts
interface Dream {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  daysLeft?: number | null;
  category?: string;
}

interface FormData {
  dream: string;
  plan: string;
  relationship: string;
  offering: string;
}

// From lib/utils/constants.ts
type ToneId = 'fusion' | 'gentle' | 'intense';
```

### Constants Used

```typescript
// From lib/reflection/constants.ts
CATEGORY_EMOJI: Record<string, string>
QUESTIONS: ReflectionQuestion[]

// From lib/utils/constants.ts
TONES: Array<{ id: ToneId; label: string; description: string }>
REFLECTION_MICRO_COPY: { welcome: string; readyToSubmit: string; ... }
TONE_DESCRIPTIONS: { fusion: string; gentle: string; intense: string }
```

## Testing Best Practices

### Query Priority (React Testing Library)

1. `getByRole` - accessibility-first queries
2. `getByLabelText` - form elements
3. `getByText` - visible text content
4. `getByTestId` - last resort for complex elements

### Assertion Patterns

```typescript
// Element presence
expect(screen.getByText('text')).toBeInTheDocument();
expect(screen.queryByText('text')).not.toBeInTheDocument();

// Class assertions
expect(element).toHaveClass('expected-class');

// Attribute assertions
expect(element).toHaveAttribute('aria-pressed', 'true');

// Callback assertions
expect(mockFn).toHaveBeenCalledWith(expectedArg);
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Test Isolation

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Coverage Targets

| Metric | Target |
|--------|--------|
| Line Coverage | 80%+ |
| Branch Coverage | 75%+ |
| Function Coverage | 80%+ |

## Test Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- DreamSelectionView.test.tsx

# Run tests in watch mode
npm run test -- --watch
```
