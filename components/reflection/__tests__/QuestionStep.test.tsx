// components/reflection/__tests__/QuestionStep.test.tsx
// Tests for QuestionStep component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../CharacterCounter', () => ({
  default: ({ current, max }: { current: number; max: number }) => (
    <div data-testid="character-counter">
      {current}/{max}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, variant, size, className }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      role="radio"
    >
      {children}
    </button>
  ),
}));

import QuestionStep from '../QuestionStep';

describe('QuestionStep', () => {
  const defaultProps = {
    questionNumber: 1,
    question: 'What is your dream?',
    value: '',
    onChange: vi.fn(),
    maxLength: 500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('textarea type (default)', () => {
    it('renders question number', () => {
      render(<QuestionStep {...defaultProps} />);
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('renders question text', () => {
      render(<QuestionStep {...defaultProps} />);
      expect(screen.getByText('What is your dream?')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<QuestionStep {...defaultProps} subtitle="Share your thoughts" />);
      expect(screen.getByText('Share your thoughts')).toBeInTheDocument();
    });

    it('renders textarea', () => {
      render(<QuestionStep {...defaultProps} />);
      expect(screen.getByPlaceholderText('Write your authentic response...')).toBeInTheDocument();
    });

    it('displays current value in textarea', () => {
      render(<QuestionStep {...defaultProps} value="My dream is..." />);
      expect(screen.getByDisplayValue('My dream is...')).toBeInTheDocument();
    });

    it('calls onChange when textarea value changes', () => {
      const onChange = vi.fn();
      render(<QuestionStep {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByPlaceholderText('Write your authentic response...'), {
        target: { value: 'New text' },
      });

      expect(onChange).toHaveBeenCalledWith('New text');
    });

    it('renders character counter', () => {
      render(<QuestionStep {...defaultProps} value="Hello" />);
      expect(screen.getByTestId('character-counter')).toHaveTextContent('5/500');
    });

    it('shows error when provided', () => {
      render(<QuestionStep {...defaultProps} error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('marks textarea as invalid when error present', () => {
      render(<QuestionStep {...defaultProps} error="Error" />);
      const textarea = screen.getByPlaceholderText('Write your authentic response...');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('has accessible labels', () => {
      render(<QuestionStep {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-labelledby', 'question-1-title');
    });

    it('has accessible description when subtitle provided', () => {
      render(<QuestionStep {...defaultProps} subtitle="Help text" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'question-1-subtitle');
    });

    it('has required attribute', () => {
      render(<QuestionStep {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('required');
    });

    it('has maxLength attribute', () => {
      render(<QuestionStep {...defaultProps} maxLength={300} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '300');
    });
  });

  describe('choice type', () => {
    const choiceProps = {
      ...defaultProps,
      type: 'choice' as const,
      choices: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
      onChoiceSelect: vi.fn(),
    };

    it('renders choice buttons', () => {
      render(<QuestionStep {...choiceProps} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('calls onChoiceSelect when choice clicked', () => {
      const onChoiceSelect = vi.fn();
      render(<QuestionStep {...choiceProps} onChoiceSelect={onChoiceSelect} />);

      fireEvent.click(screen.getByText('Option 2'));

      expect(onChoiceSelect).toHaveBeenCalledWith('option2');
    });

    it('highlights selected choice', () => {
      render(<QuestionStep {...choiceProps} selectedChoice="option1" />);

      const selectedButton = screen.getByText('Option 1');
      expect(selectedButton).toHaveAttribute('data-variant', 'primary');

      const unselectedButton = screen.getByText('Option 2');
      expect(unselectedButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('renders radiogroup role', () => {
      render(<QuestionStep {...choiceProps} />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('does not render textarea', () => {
      render(<QuestionStep {...choiceProps} />);
      expect(
        screen.queryByPlaceholderText('Write your authentic response...')
      ).not.toBeInTheDocument();
    });
  });

  describe('date input', () => {
    const dateProps = {
      ...defaultProps,
      type: 'choice' as const,
      choices: [{ value: 'yes', label: 'Yes' }],
      showDateInput: true,
      dateValue: '2024-12-31',
      onDateChange: vi.fn(),
    };

    it('renders date input when showDateInput is true', () => {
      render(<QuestionStep {...dateProps} />);
      expect(screen.getByLabelText('Target Date:')).toBeInTheDocument();
    });

    it('displays date value', () => {
      render(<QuestionStep {...dateProps} />);
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
    });

    it('calls onDateChange when date changes', () => {
      const onDateChange = vi.fn();
      render(<QuestionStep {...dateProps} onDateChange={onDateChange} />);

      fireEvent.change(screen.getByLabelText('Target Date:'), {
        target: { value: '2025-01-15' },
      });

      expect(onDateChange).toHaveBeenCalledWith('2025-01-15');
    });

    it('has min date set to today', () => {
      render(<QuestionStep {...dateProps} />);
      const dateInput = screen.getByLabelText('Target Date:');
      expect(dateInput).toHaveAttribute('min', new Date().toISOString().split('T')[0]);
    });

    it('does not render date input when showDateInput is false', () => {
      render(<QuestionStep {...dateProps} showDateInput={false} />);
      expect(screen.queryByLabelText('Target Date:')).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows error in textarea mode', () => {
      render(<QuestionStep {...defaultProps} error="Please enter your response" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter your response');
    });

    it('shows error in choice mode', () => {
      const choiceProps = {
        ...defaultProps,
        type: 'choice' as const,
        choices: [{ value: 'opt', label: 'Option' }],
        error: 'Please make a selection',
      };
      render(<QuestionStep {...choiceProps} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Please make a selection');
    });
  });

  describe('accessibility', () => {
    it('includes screen reader text for required field', () => {
      render(<QuestionStep {...defaultProps} />);
      expect(screen.getByText('(required)')).toHaveClass('sr-only');
    });

    it('has proper heading structure', () => {
      render(<QuestionStep {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('What is your dream?');
    });
  });
});
