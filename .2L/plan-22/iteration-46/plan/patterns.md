# Code Patterns & Conventions - Iteration 46

## File Structure

```
components/reflection/
  __tests__/
    CharacterCounter.test.tsx (existing)
    ProgressBar.test.tsx (existing)
    ToneBadge.test.tsx (existing)
    ReflectionQuestionCard.test.tsx (NEW)
    ToneSelection.test.tsx (NEW)
    ToneSelectionCard.test.tsx (NEW)
  views/
    __tests__/
      DreamSelectionView.test.tsx (NEW)
      ReflectionFormView.test.tsx (NEW)
      ReflectionOutputView.test.tsx (NEW)
```

## Naming Conventions

- Test files: `{ComponentName}.test.tsx`
- Mock functions: `mock{FunctionName}` (e.g., `mockOnDreamSelect`)
- Mock data: `mock{DataType}` (e.g., `mockDreams`, `mockFormData`)
- Test factories: `createMock{Type}` (e.g., `createMockDream`)

## Import Order Convention

```typescript
// 1. Testing library imports
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 2. React (if needed)
import React from 'react';

// 3. Component under test
import { ComponentName } from '../ComponentName';

// 4. Types (if needed)
import type { SomeType } from '@/lib/types';
```

---

## Test Data Factories

### Dream Factory

```typescript
const createMockDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'Dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-01-15',
  ...overrides,
});

// Usage examples
const dreamWithOverdue = createMockDream({ daysLeft: -5 });
const dreamToday = createMockDream({ daysLeft: 0 });
const dreamNoCategory = createMockDream({ category: undefined });
```

### FormData Factory

```typescript
const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
  ...overrides,
});

// Usage examples
const filledFormData = createMockFormData({
  dream: 'My dream content',
  plan: 'My plan content',
});
```

### Multiple Dreams Factory

```typescript
const createMockDreams = (): Dream[] => [
  createMockDream({
    id: 'dream-1',
    title: 'Learn Guitar',
    description: 'Master basic chords',
    category: 'creative',
    daysLeft: 30,
  }),
  createMockDream({
    id: 'dream-2',
    title: 'Run Marathon',
    description: 'Complete 42km',
    category: 'health',
    daysLeft: 14,
  }),
  createMockDream({
    id: 'dream-3',
    title: 'Start Business',
    category: 'entrepreneurial',
    daysLeft: 60,
  }),
];
```

---

## Mock Patterns

### next/navigation Mock

```typescript
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
}));
```

### framer-motion Mock (Complete Pattern)

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, 'data-testid': dataTestId, ...props }: any) => (
      <div className={className} data-testid={dataTestId} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, 'data-testid': dataTestId, type, ...props }: any) => (
      <button
        onClick={onClick}
        className={className}
        data-testid={dataTestId}
        type={type}
        {...props}
      >
        {children}
      </button>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));
```

### GlassCard Mock

```typescript
vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, className, elevated, interactive, ...props }: any) => (
    <div
      className={className}
      data-testid="glass-card"
      data-elevated={elevated}
      data-interactive={interactive}
      {...props}
    >
      {children}
    </div>
  ),
}));
```

### GlowButton Mock

```typescript
vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));
```

### GlassInput Mock

```typescript
vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({ value, onChange, placeholder, maxLength, showCounter, rows, className, ...props }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className={className}
      data-testid="glass-input"
      data-show-counter={showCounter}
      {...props}
    />
  ),
}));
```

### CosmicLoader Mock

```typescript
vi.mock('@/components/ui/glass/CosmicLoader', () => ({
  CosmicLoader: ({ size }: { size?: string }) => (
    <div data-testid="cosmic-loader" data-size={size}>
      Loading...
    </div>
  ),
}));
```

### AIResponseRenderer Mock

```typescript
vi.mock('@/components/reflections/AIResponseRenderer', () => ({
  AIResponseRenderer: ({ content }: { content: string }) => (
    <div data-testid="ai-response">{content}</div>
  ),
}));
```

### Barrel Import Mock (Glass Components)

```typescript
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, elevated, interactive, ...props }: any) => (
    <div className={className} data-elevated={elevated} {...props}>
      {children}
    </div>
  ),
  GlowButton: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
  GlassInput: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid="glass-input"
      {...props}
    />
  ),
  CosmicLoader: ({ size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>Loading...</div>
  ),
}));
```

---

## Test Structure Patterns

### Standard Test File Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ComponentName } from '../ComponentName';

// Mocks at top level
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Test data factories
const createMockData = () => ({ /* ... */ });

describe('ComponentName', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders main heading', () => {
      render(<ComponentName />);
      expect(screen.getByText('Expected Heading')).toBeInTheDocument();
    });

    it('renders with correct props', () => {
      render(<ComponentName prop="value" />);
      expect(screen.getByText('value')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls callback on click', () => {
      render(<ComponentName onClick={mockCallback} />);
      fireEvent.click(screen.getByRole('button'));
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation', () => {
      render(<ComponentName onSelect={mockCallback} />);
      const element = screen.getByRole('button');
      fireEvent.keyDown(element, { key: 'Enter' });
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has accessible heading structure', () => {
      render(<ComponentName />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      render(<ComponentName isSelected={true} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('edge cases', () => {
    it('handles empty data gracefully', () => {
      render(<ComponentName items={[]} />);
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('handles undefined values', () => {
      render(<ComponentName value={undefined} />);
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });
});
```

---

## Component-Specific Test Patterns

### DreamSelectionView Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DreamSelectionView } from '../DreamSelectionView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  GlowButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

const createMockDream = (overrides = {}) => ({
  id: 'dream-1',
  title: 'Test Dream',
  category: 'creative',
  daysLeft: 30,
  ...overrides,
});

describe('DreamSelectionView', () => {
  const mockOnDreamSelect = vi.fn();
  const mockDreams = [
    createMockDream({ id: 'dream-1', title: 'Learn Guitar', category: 'creative', daysLeft: 30 }),
    createMockDream({ id: 'dream-2', title: 'Run Marathon', category: 'health', daysLeft: 14 }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the heading', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders all dream titles', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Learn Guitar')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
    });

    it('displays days left indicator', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('30d left')).toBeInTheDocument();
      expect(screen.getByText('14d left')).toBeInTheDocument();
    });

    it('displays overdue indicator for negative daysLeft', () => {
      const overdueDream = [createMockDream({ daysLeft: -5 })];
      render(
        <DreamSelectionView
          dreams={overdueDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('5d overdue')).toBeInTheDocument();
    });

    it('displays "Today!" for daysLeft === 0', () => {
      const todayDream = [createMockDream({ daysLeft: 0 })];
      render(
        <DreamSelectionView
          dreams={todayDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Today!')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onDreamSelect when dream clicked', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      fireEvent.click(screen.getByText('Learn Guitar'));
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });

    it('handles keyboard selection with Enter', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      fireEvent.keyDown(dreamCard!, { key: 'Enter' });
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });

    it('handles keyboard selection with Space', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      fireEvent.keyDown(dreamCard!, { key: ' ' });
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });
  });

  describe('empty state', () => {
    it('renders empty state when no dreams', () => {
      render(
        <DreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
    });

    it('renders CTA button in empty state', () => {
      render(
        <DreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });

    it('navigates to dreams page when CTA clicked', () => {
      render(
        <DreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      fireEvent.click(screen.getByText('Create Your First Dream'));
      expect(mockPush).toHaveBeenCalledWith('/dreams');
    });
  });
});
```

### ReflectionOutputView Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReflectionOutputView } from '../ReflectionOutputView';

vi.mock('@/components/reflections/AIResponseRenderer', () => ({
  AIResponseRenderer: ({ content }: { content: string }) => (
    <div data-testid="ai-response">{content}</div>
  ),
}));

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  GlowButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  CosmicLoader: ({ size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>Loading...</div>
  ),
}));

describe('ReflectionOutputView', () => {
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows CosmicLoader when isLoading is true', () => {
      render(
        <ReflectionOutputView
          content=""
          isLoading={true}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('shows loading text when isLoading is true', () => {
      render(
        <ReflectionOutputView
          content=""
          isLoading={true}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Loading reflection...')).toBeInTheDocument();
    });

    it('does not show content when loading', () => {
      render(
        <ReflectionOutputView
          content="Test content"
          isLoading={true}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.queryByTestId('ai-response')).not.toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('renders AIResponseRenderer with content when not loading', () => {
      render(
        <ReflectionOutputView
          content="Your reflection content"
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByTestId('ai-response')).toBeInTheDocument();
      expect(screen.getByText('Your reflection content')).toBeInTheDocument();
    });

    it('renders "Your Reflection" heading', () => {
      render(
        <ReflectionOutputView
          content="Content"
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Your Reflection')).toBeInTheDocument();
    });

    it('renders "Create New Reflection" button', () => {
      render(
        <ReflectionOutputView
          content="Content"
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByText('Create New Reflection')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onCreateNew when button clicked', () => {
      render(
        <ReflectionOutputView
          content="Content"
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      fireEvent.click(screen.getByText('Create New Reflection'));
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty content gracefully', () => {
      render(
        <ReflectionOutputView
          content=""
          isLoading={false}
          onCreateNew={mockOnCreateNew}
        />
      );
      expect(screen.getByTestId('ai-response')).toBeInTheDocument();
    });
  });
});
```

### ToneSelection Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ToneSelection from '../ToneSelection';

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, className, variant, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('ToneSelection', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all three tone options', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
      expect(screen.getByText('Gentle Clarity')).toBeInTheDocument();
      expect(screen.getByText('Luminous Intensity')).toBeInTheDocument();
    });

    it('renders label text', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Choose the voice of your reflection')).toBeInTheDocument();
    });

    it('shows sparkle indicator for selected tone', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      // The sparkle emoji should be visible
      expect(screen.getByText(/Sacred Fusion/)).toBeInTheDocument();
    });

    it('renders radiogroup with correct aria attributes', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-label', 'Reflection tone selection');
      expect(radiogroup).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('interactions', () => {
    it('calls onSelect when tone clicked', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    it('does not call onSelect when clicking already selected tone', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
        />
      );
      fireEvent.click(screen.getByText('Sacred Fusion'));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('respects disabled prop', () => {
      render(
        <ToneSelection
          selectedTone="fusion"
          onSelect={mockOnSelect}
          disabled={true}
        />
      );
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('tone description', () => {
    it('shows description for selected tone in aria-live region', () => {
      render(
        <ToneSelection
          selectedTone="gentle"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Soft wisdom that illuminates gently')).toBeInTheDocument();
    });
  });
});
```

### ReflectionQuestionCard Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReflectionQuestionCard } from '../ReflectionQuestionCard';

vi.mock('@/components/ui/glass', () => ({
  GlassInput: ({ value, onChange, placeholder, maxLength, showCounter, rows, ...props }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      data-testid="glass-input"
      data-show-counter={showCounter}
      {...props}
    />
  ),
}));

describe('ReflectionQuestionCard', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    questionNumber: 1,
    totalQuestions: 4,
    questionText: 'What is your dream?',
    guidingText: 'Take a moment to describe your dream in vivid detail...',
    placeholder: "Your thoughts are safe here...",
    value: '',
    onChange: mockOnChange,
    maxLength: 3200,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders guiding text with italic styling', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const guidingText = screen.getByText(defaultProps.guidingText);
      expect(guidingText).toBeInTheDocument();
      expect(guidingText).toHaveClass('italic');
    });

    it('renders question number and text', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      expect(screen.getByText(/1\. What is your dream\?/)).toBeInTheDocument();
    });

    it('renders textarea with correct placeholder', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('placeholder', defaultProps.placeholder);
    });

    it('renders textarea with correct maxLength', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('maxLength', '3200');
    });

    it('passes showCounter prop to GlassInput', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('data-show-counter', 'true');
    });
  });

  describe('interactions', () => {
    it('calls onChange when text entered', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      fireEvent.change(textarea, { target: { value: 'My dream is...' } });
      expect(mockOnChange).toHaveBeenCalledWith('My dream is...');
    });

    it('displays current value', () => {
      render(<ReflectionQuestionCard {...defaultProps} value="Existing text" />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveValue('Existing text');
    });
  });

  describe('styling', () => {
    it('applies gradient text styling to question', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const questionHeading = screen.getByRole('heading', { level: 3 });
      expect(questionHeading).toHaveClass('bg-gradient-to-r');
      expect(questionHeading).toHaveClass('bg-clip-text');
    });
  });
});
```

### ToneSelectionCard Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ToneSelectionCard } from '../ToneSelectionCard';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, 'aria-pressed': ariaPressed, 'aria-label': ariaLabel, ...props }: any) => (
      <button
        onClick={onClick}
        className={className}
        aria-pressed={ariaPressed}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    ),
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, elevated, ...props }: any) => (
    <div className={className} data-elevated={elevated} {...props}>
      {children}
    </div>
  ),
}));

describe('ToneSelectionCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders section heading', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Choose Your Reflection Tone')).toBeInTheDocument();
    });

    it('renders subheading', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('How shall the mirror speak to you?')).toBeInTheDocument();
    });

    it('renders all three tone cards', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
      expect(screen.getByText('Gentle Clarity')).toBeInTheDocument();
      expect(screen.getByText('Luminous Intensity')).toBeInTheDocument();
    });

    it('renders tone icons', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      // Check for emoji icons
      expect(screen.getByText(/[^a-zA-Z]/)).toBeInTheDocument(); // Has emoji
    });

    it('shows "Selected" indicator for selected tone', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSelect when card clicked', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    it('handles keyboard selection with Enter', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      fireEvent.keyDown(gentleButton, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    it('handles keyboard selection with Space', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      fireEvent.keyDown(intenseButton, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('intense');
    });
  });

  describe('accessibility', () => {
    it('has aria-pressed attribute for selected card', () => {
      render(<ToneSelectionCard selectedTone="gentle" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      expect(gentleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('has aria-pressed="false" for unselected cards', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      expect(gentleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('has descriptive aria-label for each card', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});
```

### ReflectionFormView Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReflectionFormView } from '../ReflectionFormView';

// Mock child components
vi.mock('@/components/reflection/ProgressBar', () => ({
  ProgressBar: ({ currentStep, totalSteps }: any) => (
    <div data-testid="progress-bar" data-step={currentStep} data-total={totalSteps} />
  ),
}));

vi.mock('@/components/reflection/ReflectionQuestionCard', () => ({
  ReflectionQuestionCard: ({ questionNumber, questionText, value, onChange }: any) => (
    <div data-testid={`question-card-${questionNumber}`}>
      <span data-testid={`question-text-${questionNumber}`}>{questionText}</span>
      <textarea
        data-testid={`question-input-${questionNumber}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('@/components/reflection/ToneSelectionCard', () => ({
  ToneSelectionCard: ({ selectedTone, onSelect }: any) => (
    <div data-testid="tone-selection-card" data-selected={selectedTone}>
      <button data-testid="tone-fusion" onClick={() => onSelect('fusion')}>Fusion</button>
      <button data-testid="tone-gentle" onClick={() => onSelect('gentle')}>Gentle</button>
      <button data-testid="tone-intense" onClick={() => onSelect('intense')}>Intense</button>
    </div>
  ),
}));

vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
  CosmicLoader: ({ size }: any) => (
    <span data-testid="cosmic-loader" data-size={size}>Loading</span>
  ),
}));

const createMockDream = (overrides = {}) => ({
  id: 'dream-1',
  title: 'Test Dream',
  category: 'creative',
  daysLeft: 30,
  ...overrides,
});

const createMockFormData = (overrides = {}) => ({
  dream: '',
  plan: '',
  relationship: '',
  offering: '',
  ...overrides,
});

describe('ReflectionFormView', () => {
  const mockOnFieldChange = vi.fn();
  const mockOnToneSelect = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    selectedDream: createMockDream(),
    formData: createMockFormData(),
    onFieldChange: mockOnFieldChange,
    selectedTone: 'fusion' as const,
    onToneSelect: mockOnToneSelect,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders welcome message', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText(/Welcome to your sacred space/)).toBeInTheDocument();
    });

    it('renders dream context banner when selectedDream provided', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText(/Reflecting on: Test Dream/)).toBeInTheDocument();
    });

    it('does not render dream banner when selectedDream is null', () => {
      render(<ReflectionFormView {...defaultProps} selectedDream={null} />);
      expect(screen.queryByText(/Reflecting on:/)).not.toBeInTheDocument();
    });

    it('renders ProgressBar', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('renders all 4 question cards', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByTestId('question-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-4')).toBeInTheDocument();
    });

    it('renders ToneSelectionCard', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByTestId('tone-selection-card')).toBeInTheDocument();
    });

    it('renders submit button with correct text', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('Gaze into the Mirror')).toBeInTheDocument();
    });
  });

  describe('dream context banner', () => {
    it('shows dream category', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('creative')).toBeInTheDocument();
    });

    it('shows days remaining', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('30 days remaining')).toBeInTheDocument();
    });

    it('shows overdue text for negative daysLeft', () => {
      const overdueDream = createMockDream({ daysLeft: -5 });
      render(<ReflectionFormView {...defaultProps} selectedDream={overdueDream} />);
      expect(screen.getByText('5 days overdue')).toBeInTheDocument();
    });

    it('shows "Today!" for daysLeft === 0', () => {
      const todayDream = createMockDream({ daysLeft: 0 });
      render(<ReflectionFormView {...defaultProps} selectedDream={todayDream} />);
      expect(screen.getByText('Today!')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onFieldChange when question input changes', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const input = screen.getByTestId('question-input-1');
      fireEvent.change(input, { target: { value: 'New text' } });
      expect(mockOnFieldChange).toHaveBeenCalledWith('dream', 'New text');
    });

    it('calls onToneSelect when tone changed', () => {
      render(<ReflectionFormView {...defaultProps} />);
      fireEvent.click(screen.getByTestId('tone-gentle'));
      expect(mockOnToneSelect).toHaveBeenCalledWith('gentle');
    });

    it('calls onSubmit when button clicked', () => {
      render(<ReflectionFormView {...defaultProps} />);
      fireEvent.click(screen.getByText('Gaze into the Mirror'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('submit button states', () => {
    it('shows loading state when isSubmitting', () => {
      render(<ReflectionFormView {...defaultProps} isSubmitting={true} />);
      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
      expect(screen.getByText('Gazing...')).toBeInTheDocument();
    });

    it('disables button when isSubmitting', () => {
      render(<ReflectionFormView {...defaultProps} isSubmitting={true} />);
      const button = screen.getByRole('button', { name: /Gazing/i });
      expect(button).toBeDisabled();
    });

    it('button is enabled when not submitting', () => {
      render(<ReflectionFormView {...defaultProps} isSubmitting={false} />);
      const button = screen.getByText('Gaze into the Mirror');
      expect(button).not.toBeDisabled();
    });
  });
});
```

---

## Error Handling Patterns

### Testing Error States

```typescript
describe('error handling', () => {
  it('handles undefined props gracefully', () => {
    // Component should not crash with undefined optional props
    render(<Component value={undefined} />);
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('handles null array gracefully', () => {
    // TypeScript would catch this, but good for runtime safety
    render(<Component items={null as any} />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });
});
```

---

## Accessibility Testing Patterns

### ARIA Attributes

```typescript
describe('accessibility', () => {
  it('has correct role', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has accessible name', () => {
    render(<Component label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('has aria-pressed for toggle buttons', () => {
    render(<Component isSelected={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has aria-live for dynamic content', () => {
    render(<Component />);
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
```

### Keyboard Navigation

```typescript
describe('keyboard navigation', () => {
  it('responds to Enter key', () => {
    const mockHandler = vi.fn();
    render(<Component onActivate={mockHandler} />);

    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: 'Enter' });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('responds to Space key', () => {
    const mockHandler = vi.fn();
    render(<Component onActivate={mockHandler} />);

    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: ' ' });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('has focusable elements', () => {
    render(<Component />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });
});
```

---

## Security Considerations for Tests

### Input Validation Testing

```typescript
describe('input validation', () => {
  it('handles XSS-like content safely', () => {
    render(<Component content="<script>alert('xss')</script>" />);
    // Content should be escaped/sanitized
    expect(screen.queryByRole('script')).not.toBeInTheDocument();
  });

  it('handles very long input', () => {
    const longText = 'a'.repeat(10000);
    render(<Component value={longText} />);
    // Component should handle without crashing
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });
});
```

---

## CI/CD Test Commands

```bash
# Run all tests (used in CI)
npm run test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm run test -- --filter="DreamSelectionView"

# Run tests in watch mode (development)
npm run test -- --watch

# Run tests with verbose output
npm run test -- --reporter=verbose
```

## Coverage Expectations

| Component | Target Coverage |
|-----------|-----------------|
| DreamSelectionView | 80%+ |
| ReflectionFormView | 80%+ |
| ReflectionOutputView | 90%+ |
| ReflectionQuestionCard | 85%+ |
| ToneSelection | 85%+ |
| ToneSelectionCard | 80%+ |
