import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReflectionFormView } from '../ReflectionFormView';

import type { FormData, Dream } from '@/lib/reflection/types';
import type { ToneId } from '@/lib/utils/constants';

// Mock child components
vi.mock('@/components/reflection/ProgressBar', () => ({
  ProgressBar: ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div data-testid="progress-bar" data-step={currentStep} data-total={totalSteps}>
      Progress: {currentStep}/{totalSteps}
    </div>
  ),
}));

vi.mock('@/components/reflection/ReflectionQuestionCard', () => ({
  ReflectionQuestionCard: ({
    questionNumber,
    questionText,
    value,
    onChange,
  }: {
    questionNumber: number;
    questionText: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
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
  ToneSelectionCard: ({
    selectedTone,
    onSelect,
  }: {
    selectedTone: ToneId;
    onSelect: (tone: ToneId) => void;
  }) => (
    <div data-testid="tone-selection-card" data-selected={selectedTone}>
      <button data-testid="tone-fusion" onClick={() => onSelect('fusion')}>
        Fusion
      </button>
      <button data-testid="tone-gentle" onClick={() => onSelect('gentle')}>
        Gentle
      </button>
      <button data-testid="tone-intense" onClick={() => onSelect('intense')}>
        Intense
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({
    children,
    onClick,
    disabled,
    className,
    ...props
  }: React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }>) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
  CosmicLoader: ({ size }: { size?: string }) => (
    <span data-testid="cosmic-loader" data-size={size}>
      Loading
    </span>
  ),
}));

// Test data factories
const createMockDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'Dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-01-15',
  ...overrides,
});

const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
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
    selectedTone: 'fusion' as ToneId,
    onToneSelect: mockOnToneSelect,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders welcome message from REFLECTION_MICRO_COPY', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(
        screen.getByText('Welcome to your sacred space for reflection. Take a deep breath.')
      ).toBeInTheDocument();
    });

    it('renders dream context banner when selectedDream provided', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText(/Reflecting on: Test Dream/)).toBeInTheDocument();
    });

    it('does not render dream banner when selectedDream is null', () => {
      render(<ReflectionFormView {...defaultProps} selectedDream={null} />);
      expect(screen.queryByText(/Reflecting on:/)).not.toBeInTheDocument();
    });

    it('renders ProgressBar component', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('renders all 4 ReflectionQuestionCard components', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByTestId('question-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-4')).toBeInTheDocument();
    });

    it('renders ToneSelectionCard with correct props', () => {
      render(<ReflectionFormView {...defaultProps} selectedTone="gentle" />);
      const toneCard = screen.getByTestId('tone-selection-card');
      expect(toneCard).toHaveAttribute('data-selected', 'gentle');
    });

    it('renders submit button with "Gaze into the Mirror" text', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('Gaze into the Mirror')).toBeInTheDocument();
    });

    it('renders ready message', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('Ready when you are. There is no rush.')).toBeInTheDocument();
    });
  });

  describe('dream context banner', () => {
    it('shows dream title in banner', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText(/Test Dream/)).toBeInTheDocument();
    });

    it('shows dream category', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('creative')).toBeInTheDocument();
    });

    it('shows days remaining', () => {
      render(<ReflectionFormView {...defaultProps} />);
      expect(screen.getByText('30 days remaining')).toBeInTheDocument();
    });

    it('shows "Today!" for daysLeft === 0', () => {
      const todayDream = createMockDream({ daysLeft: 0 });
      render(<ReflectionFormView {...defaultProps} selectedDream={todayDream} />);
      expect(screen.getByText('Today!')).toBeInTheDocument();
    });

    it('shows overdue text for negative daysLeft', () => {
      const overdueDream = createMockDream({ daysLeft: -5 });
      render(<ReflectionFormView {...defaultProps} selectedDream={overdueDream} />);
      expect(screen.getByText('5 days overdue')).toBeInTheDocument();
    });

    it('does not show category badge when category is missing', () => {
      const dreamNoCategory = createMockDream({ category: undefined });
      render(<ReflectionFormView {...defaultProps} selectedDream={dreamNoCategory} />);
      expect(screen.queryByText('creative')).not.toBeInTheDocument();
    });

    it('does not show days remaining when daysLeft is null', () => {
      const dreamNoDays = createMockDream({ daysLeft: null });
      render(<ReflectionFormView {...defaultProps} selectedDream={dreamNoDays} />);
      expect(screen.queryByText(/days remaining/)).not.toBeInTheDocument();
      expect(screen.queryByText(/days overdue/)).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onFieldChange when question input changes', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const input = screen.getByTestId('question-input-1');
      fireEvent.change(input, { target: { value: 'New text' } });
      expect(mockOnFieldChange).toHaveBeenCalledWith('dream', 'New text');
    });

    it('calls onFieldChange with correct field for question 2', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const input = screen.getByTestId('question-input-2');
      fireEvent.change(input, { target: { value: 'Plan text' } });
      expect(mockOnFieldChange).toHaveBeenCalledWith('plan', 'Plan text');
    });

    it('calls onFieldChange with correct field for question 3', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const input = screen.getByTestId('question-input-3');
      fireEvent.change(input, { target: { value: 'Relationship text' } });
      expect(mockOnFieldChange).toHaveBeenCalledWith('relationship', 'Relationship text');
    });

    it('calls onFieldChange with correct field for question 4', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const input = screen.getByTestId('question-input-4');
      fireEvent.change(input, { target: { value: 'Offering text' } });
      expect(mockOnFieldChange).toHaveBeenCalledWith('offering', 'Offering text');
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
    });

    it('shows "Gazing..." text when isSubmitting', () => {
      render(<ReflectionFormView {...defaultProps} isSubmitting={true} />);
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

    it('does not show CosmicLoader when not submitting', () => {
      render(<ReflectionFormView {...defaultProps} isSubmitting={false} />);
      expect(screen.queryByTestId('cosmic-loader')).not.toBeInTheDocument();
    });
  });

  describe('form data', () => {
    it('passes formData values to question cards', () => {
      const filledFormData = createMockFormData({
        dream: 'My dream content',
        plan: 'My plan content',
        relationship: 'My relationship content',
        offering: 'My offering content',
      });
      render(<ReflectionFormView {...defaultProps} formData={filledFormData} />);

      expect(screen.getByTestId('question-input-1')).toHaveValue('My dream content');
      expect(screen.getByTestId('question-input-2')).toHaveValue('My plan content');
      expect(screen.getByTestId('question-input-3')).toHaveValue('My relationship content');
      expect(screen.getByTestId('question-input-4')).toHaveValue('My offering content');
    });
  });

  describe('accessibility', () => {
    it('has heading structure in dream banner', () => {
      render(<ReflectionFormView {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Reflecting on:/);
    });
  });
});
