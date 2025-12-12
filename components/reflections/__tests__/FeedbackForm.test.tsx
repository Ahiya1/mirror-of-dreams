// components/reflections/__tests__/FeedbackForm.test.tsx
// Tests for FeedbackForm component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, type, variant, disabled, className }: any) => (
    <button
      onClick={onClick}
      type={type}
      data-variant={variant}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  ),
}));

import { FeedbackForm } from '../FeedbackForm';

describe('FeedbackForm', () => {
  const defaultProps = {
    reflectionId: 'ref-123',
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders rating question', () => {
      render(<FeedbackForm {...defaultProps} />);
      expect(screen.getByText('How did this reflection land for you?')).toBeInTheDocument();
    });

    it('renders 10 rating buttons', () => {
      render(<FeedbackForm {...defaultProps} />);
      const buttons = screen.getAllByRole('button', { name: /Rate \d+ out of 10/ });
      expect(buttons).toHaveLength(10);
    });

    it('renders feedback textarea', () => {
      render(<FeedbackForm {...defaultProps} />);
      expect(screen.getByPlaceholderText(/What resonated/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<FeedbackForm {...defaultProps} />);
      expect(screen.getByText('Share Feedback')).toBeInTheDocument();
    });

    it('shows Update text when currentRating exists', () => {
      render(<FeedbackForm {...defaultProps} currentRating={7} />);
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  describe('initial values', () => {
    it('defaults rating to 5 when no currentRating', () => {
      render(<FeedbackForm {...defaultProps} />);
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('uses currentRating when provided', () => {
      render(<FeedbackForm {...defaultProps} currentRating={8} />);
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('uses currentFeedback when provided', () => {
      render(<FeedbackForm {...defaultProps} currentFeedback="Great reflection!" />);
      expect(screen.getByDisplayValue('Great reflection!')).toBeInTheDocument();
    });
  });

  describe('rating interaction', () => {
    it('updates rating when clicking a rating button', () => {
      render(<FeedbackForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 7 out of 10' }));

      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('shows hover state on mouseEnter', () => {
      render(<FeedbackForm {...defaultProps} />);

      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Rate 3 out of 10' }));

      // Should show hovered value
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('resets to selected rating on mouseLeave', () => {
      render(<FeedbackForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 7 out of 10' }));
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Rate 3 out of 10' }));
      expect(screen.getByText('3/10')).toBeInTheDocument();

      fireEvent.mouseLeave(screen.getByRole('button', { name: 'Rate 3 out of 10' }));
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });
  });

  describe('rating messages', () => {
    it('shows message for low rating (1-3)', () => {
      render(<FeedbackForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rate 2 out of 10' }));
      expect(screen.getByText('Thank you for your honesty')).toBeInTheDocument();
    });

    it('shows message for medium-low rating (4-5)', () => {
      render(<FeedbackForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 10' }));
      expect(screen.getByText('Your feedback helps me grow')).toBeInTheDocument();
    });

    it('shows message for medium rating (6-7)', () => {
      render(<FeedbackForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rate 6 out of 10' }));
      expect(screen.getByText("I'm glad this resonated")).toBeInTheDocument();
    });

    it('shows message for high rating (8-9)', () => {
      render(<FeedbackForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rate 8 out of 10' }));
      expect(screen.getByText('That means a lot')).toBeInTheDocument();
    });

    it('shows message for highest rating (10)', () => {
      render(<FeedbackForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rate 10 out of 10' }));
      expect(screen.getByText("I'm honored to walk with you")).toBeInTheDocument();
    });
  });

  describe('feedback textarea', () => {
    it('updates feedback value on change', () => {
      render(<FeedbackForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/What resonated/);
      fireEvent.change(textarea, { target: { value: 'Great insight!' } });

      expect(screen.getByDisplayValue('Great insight!')).toBeInTheDocument();
    });

    it('shows character count', () => {
      render(<FeedbackForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/What resonated/);
      fireEvent.change(textarea, { target: { value: 'Test' } });

      expect(screen.getByText('4/500')).toBeInTheDocument();
    });

    it('has maxLength of 500', () => {
      render(<FeedbackForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/What resonated/);
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with rating and feedback', () => {
      const onSubmit = vi.fn();
      render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 8 out of 10' }));

      const textarea = screen.getByPlaceholderText(/What resonated/);
      fireEvent.change(textarea, { target: { value: 'Helpful reflection!' } });

      fireEvent.click(screen.getByText('Share Feedback'));

      expect(onSubmit).toHaveBeenCalledWith(8, 'Helpful reflection!');
    });

    it('calls onSubmit with undefined feedback when empty', () => {
      const onSubmit = vi.fn();
      render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: 'Rate 6 out of 10' }));
      fireEvent.click(screen.getByText('Share Feedback'));

      expect(onSubmit).toHaveBeenCalledWith(6, undefined);
    });

    it('prevents default form submission', () => {
      const onSubmit = vi.fn();
      render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

      const form = document.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form?.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('submitting state', () => {
    it('disables button when submitting', () => {
      render(<FeedbackForm {...defaultProps} isSubmitting={true} />);

      const button = screen.getByRole('button', { name: /Sharing/ });
      expect(button).toBeDisabled();
    });

    it('shows loading state when submitting', () => {
      render(<FeedbackForm {...defaultProps} isSubmitting={true} />);

      expect(screen.getByText('Sharing...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible labels for rating buttons', () => {
      render(<FeedbackForm {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        expect(screen.getByRole('button', { name: `Rate ${i} out of 10` })).toBeInTheDocument();
      }
    });

    it('has label for feedback textarea', () => {
      render(<FeedbackForm {...defaultProps} />);

      const label = screen.getByText(/Anything you'd like to share/);
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'feedback');
    });
  });
});
