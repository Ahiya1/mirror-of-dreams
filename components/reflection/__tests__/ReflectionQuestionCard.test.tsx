import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ReflectionQuestionCard } from '../ReflectionQuestionCard';

// Mock GlassInput from the glass barrel import
vi.mock('@/components/ui/glass', () => ({
  GlassInput: ({
    value,
    onChange,
    placeholder,
    maxLength,
    showCounter,
    counterMode,
    rows,
    variant,
    className,
    ...props
  }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className={className}
      data-testid="glass-input"
      data-show-counter={showCounter}
      data-counter-mode={counterMode}
      data-variant={variant}
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
    placeholder: 'Your thoughts are safe here...',
    value: '',
    onChange: mockOnChange,
    maxLength: 3200,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders guiding text with italic styling', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const guidingText = screen.getByText(defaultProps.guidingText);
      expect(guidingText).toBeInTheDocument();
      expect(guidingText).toHaveClass('italic');
    });

    test('renders question number and text combined', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('1. What is your dream?');
    });

    test('renders textarea with correct placeholder', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('placeholder', defaultProps.placeholder);
    });

    test('renders textarea with correct maxLength', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('maxLength', '3200');
    });

    test('passes showCounter prop to GlassInput', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('data-show-counter', 'true');
    });

    test('passes counterMode as words to GlassInput', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('data-counter-mode', 'words');
    });

    test('passes variant as textarea to GlassInput', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('data-variant', 'textarea');
    });
  });

  describe('interactions', () => {
    test('calls onChange when text entered', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const textarea = screen.getByTestId('glass-input');
      fireEvent.change(textarea, { target: { value: 'My dream is...' } });
      expect(mockOnChange).toHaveBeenCalledWith('My dream is...');
    });

    test('calls onChange with empty string when cleared', () => {
      render(<ReflectionQuestionCard {...defaultProps} value="Some text" />);
      const textarea = screen.getByTestId('glass-input');
      fireEvent.change(textarea, { target: { value: '' } });
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    test('displays current value in textarea', () => {
      render(<ReflectionQuestionCard {...defaultProps} value="Existing text" />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveValue('Existing text');
    });
  });

  describe('styling', () => {
    test('applies gradient text styling to question heading', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const questionHeading = screen.getByRole('heading', { level: 3 });
      expect(questionHeading).toHaveClass('bg-gradient-to-r');
      expect(questionHeading).toHaveClass('bg-clip-text');
      expect(questionHeading).toHaveClass('text-transparent');
    });

    test('applies font-light styling to guiding text', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const guidingText = screen.getByText(defaultProps.guidingText);
      expect(guidingText).toHaveClass('font-light');
    });

    test('applies correct CSS classes on container', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const container = document.querySelector('.reflection-question-card');
      expect(container).toBeInTheDocument();
    });

    test('heading has gradient color classes', () => {
      render(<ReflectionQuestionCard {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('from-mirror-purple');
      expect(heading).toHaveClass('via-mirror-violet');
      expect(heading).toHaveClass('to-mirror-blue');
    });
  });

  describe('different question numbers', () => {
    test('renders question number 2 correctly', () => {
      render(<ReflectionQuestionCard {...defaultProps} questionNumber={2} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('2. What is your dream?');
    });

    test('renders question number 4 correctly', () => {
      render(
        <ReflectionQuestionCard
          {...defaultProps}
          questionNumber={4}
          questionText="What are you offering?"
        />
      );
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('4. What are you offering?');
    });
  });

  describe('different max lengths', () => {
    test('passes different maxLength to GlassInput', () => {
      render(<ReflectionQuestionCard {...defaultProps} maxLength={500} />);
      const textarea = screen.getByTestId('glass-input');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });
});
