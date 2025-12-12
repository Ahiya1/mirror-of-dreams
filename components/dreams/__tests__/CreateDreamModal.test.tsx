// components/dreams/__tests__/CreateDreamModal.test.tsx
// Tests for CreateDreamModal component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockMutateAsync = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      create: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('@/components/ui/glass', () => ({
  GlassModal: ({ children, isOpen, onClose, title, className }: any) =>
    isOpen ? (
      <div data-testid="modal" className={className}>
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
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
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

import { CreateDreamModal } from '../CreateDreamModal';

describe('CreateDreamModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<CreateDreamModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('shows modal title', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByText('Create Your Dream 🌟')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('renders title input', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByLabelText(/Dream Title/)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByLabelText(/Describe Your Dream/)).toBeInTheDocument();
    });

    it('renders target date input', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByLabelText(/Target Date/)).toBeInTheDocument();
    });

    it('renders category select', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    });

    it('renders all category options', () => {
      render(<CreateDreamModal {...defaultProps} />);
      const select = screen.getByLabelText(/Category/);
      expect(select).toContainHTML('🏃 Health & Fitness');
      expect(select).toContainHTML('💼 Career');
      expect(select).toContainHTML('❤️ Relationships');
    });
  });

  describe('character counters', () => {
    it('shows title character count', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByText('0 / 200')).toBeInTheDocument();
    });

    it('updates title character count', () => {
      render(<CreateDreamModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Test Title' },
      });
      expect(screen.getByText('10 / 200')).toBeInTheDocument();
    });

    it('shows description character count', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByText('0 / 2000')).toBeInTheDocument();
    });

    it('updates description character count', () => {
      render(<CreateDreamModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(/Describe Your Dream/), {
        target: { value: 'Test description' },
      });
      expect(screen.getByText('16 / 2000')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('requires title field', () => {
      render(<CreateDreamModal {...defaultProps} />);
      const titleInput = screen.getByLabelText(/Dream Title/);
      expect(titleInput).toHaveAttribute('required');
    });

    it('shows error when title is only whitespace', async () => {
      render(<CreateDreamModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: '   ' },
      });

      // Submit the form directly to bypass browser validation
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Please enter a dream title')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls mutateAsync with form data', async () => {
      render(<CreateDreamModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.change(screen.getByLabelText(/Describe Your Dream/), {
        target: { value: 'Practice daily' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          title: 'Learn Piano',
          description: 'Practice daily',
          targetDate: undefined,
          category: 'personal_growth',
          priority: 5,
        });
      });
    });

    it('trims whitespace from title and description', async () => {
      render(<CreateDreamModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: '  Learn Piano  ' },
      });
      fireEvent.change(screen.getByLabelText(/Describe Your Dream/), {
        target: { value: '  Practice daily  ' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Learn Piano',
            description: 'Practice daily',
          })
        );
      });
    });

    it('calls onSuccess after successful creation', async () => {
      const onSuccess = vi.fn();
      render(<CreateDreamModal {...defaultProps} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('calls onClose after successful creation', async () => {
      const onClose = vi.fn();
      render(<CreateDreamModal {...defaultProps} onClose={onClose} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('resets form after successful creation', async () => {
      render(<CreateDreamModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Dream Title/)).toHaveValue('');
      });
    });
  });

  describe('error handling', () => {
    it('shows error message on mutation failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Server error'));
      render(<CreateDreamModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows generic error for non-Error failures', async () => {
      mockMutateAsync.mockRejectedValue('Unknown error');
      render(<CreateDreamModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/Dream Title/), {
        target: { value: 'Learn Piano' },
      });
      fireEvent.click(screen.getByText('Create Dream'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create dream')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('renders Cancel button', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders Create Dream button', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByText('Create Dream')).toBeInTheDocument();
    });

    it('calls onClose when Cancel clicked', () => {
      const onClose = vi.fn();
      render(<CreateDreamModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('category selection', () => {
    it('defaults to personal_growth', () => {
      render(<CreateDreamModal {...defaultProps} />);
      expect(screen.getByLabelText(/Category/)).toHaveValue('personal_growth');
    });

    it('can select different category', () => {
      render(<CreateDreamModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(/Category/), {
        target: { value: 'health' },
      });
      expect(screen.getByLabelText(/Category/)).toHaveValue('health');
    });
  });

  describe('target date', () => {
    it('has min date set to today', () => {
      render(<CreateDreamModal {...defaultProps} />);
      const dateInput = screen.getByLabelText(/Target Date/);
      expect(dateInput).toHaveAttribute('min', new Date().toISOString().split('T')[0]);
    });
  });
});
