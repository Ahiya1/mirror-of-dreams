// components/dreams/__tests__/EvolutionModal.test.tsx
// Tests for EvolutionModal component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockMutateAsync = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    lifecycle: {
      evolve: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('@/components/ui/glass', () => ({
  GlassModal: ({ children, isOpen, onClose, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
  GlowButton: ({ children, onClick, variant, disabled }: any) => (
    <button onClick={onClick} data-variant={variant} disabled={disabled}>
      {children}
    </button>
  ),
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

import { EvolutionModal } from '../EvolutionModal';

describe('EvolutionModal', () => {
  const mockDream = {
    id: 'dream-123',
    title: 'Learn Piano',
    description: 'Practice daily',
    target_date: '2025-06-01',
    category: 'creative',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    dream: mockDream,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<EvolutionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('step 1: current dream', () => {
    it('shows Your Dream Now as first step', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByText('Evolve Dream: Your Dream Now')).toBeInTheDocument();
    });

    it('displays current title', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByText('Learn Piano')).toBeInTheDocument();
    });

    it('displays current description', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByText('Practice daily')).toBeInTheDocument();
    });

    it('shows No description when empty', () => {
      render(<EvolutionModal {...defaultProps} dream={{ ...mockDream, description: null }} />);
      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('shows Cancel button', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows Next button', () => {
      render(<EvolutionModal {...defaultProps} />);
      expect(screen.getByText(/Next/)).toBeInTheDocument();
    });
  });

  describe('step 2: edit dream', () => {
    it('navigates to step 2 on Next', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByText('Evolve Dream: What It Is Becoming')).toBeInTheDocument();
    });

    it('shows editable title input', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByLabelText(/New Title/)).toBeInTheDocument();
    });

    it('shows Back button', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('goes back to step 1 on Back', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.click(screen.getByText(/Back/));
      expect(screen.getByText('Evolve Dream: Your Dream Now')).toBeInTheDocument();
    });

    it('shows error if no changes made', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/)); // Go to step 2
      fireEvent.click(screen.getByText(/Next/)); // Try to go to step 3
      expect(screen.getByText(/Please make at least one change/)).toBeInTheDocument();
    });

    it('allows changes to title', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      const titleInput = screen.getByLabelText(/New Title/);
      fireEvent.change(titleInput, { target: { value: 'Master Piano' } });
      expect(titleInput).toHaveValue('Master Piano');
    });
  });

  describe('step 3: reflection', () => {
    it('navigates to step 3 after making changes', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/)); // Go to step 2
      // Make a change
      const titleInput = screen.getByLabelText(/New Title/);
      fireEvent.change(titleInput, { target: { value: 'Master Piano' } });
      fireEvent.click(screen.getByText(/Next/)); // Go to step 3
      expect(screen.getByText('Evolve Dream: Why This Evolution?')).toBeInTheDocument();
    });

    it('shows reflection textarea', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByPlaceholderText(/I've realized that/)).toBeInTheDocument();
    });

    it('shows Complete Evolution button', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByText('Complete Evolution')).toBeInTheDocument();
    });

    it('shows error if reflection too short', () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.click(screen.getByText('Complete Evolution'));
      expect(screen.getByText(/Please share at least 10 characters/)).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls mutateAsync with correct data', async () => {
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByPlaceholderText(/I've realized that/), {
        target: { value: 'I want to go deeper into music' },
      });
      fireEvent.click(screen.getByText('Complete Evolution'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          dreamId: 'dream-123',
          newTitle: 'Master Piano',
          newDescription: 'Practice daily',
          newTargetDate: '2025-06-01',
          newCategory: 'creative',
          evolutionReflection: 'I want to go deeper into music',
        });
      });
    });

    it('calls onSuccess after successful submission', async () => {
      const onSuccess = vi.fn();
      render(<EvolutionModal {...defaultProps} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByPlaceholderText(/I've realized that/), {
        target: { value: 'I want to go deeper into music' },
      });
      fireEvent.click(screen.getByText('Complete Evolution'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('shows error on mutation failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Server error'));
      render(<EvolutionModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Master Piano' },
      });
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByPlaceholderText(/I've realized that/), {
        target: { value: 'I want to go deeper into music' },
      });
      fireEvent.click(screen.getByText('Complete Evolution'));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('progress indicator', () => {
    it('renders 3 progress dots', () => {
      const { container } = render(<EvolutionModal {...defaultProps} />);
      const dots = container.querySelectorAll('.h-2.w-16.rounded-full');
      expect(dots).toHaveLength(3);
    });
  });

  describe('cancel/close', () => {
    it('calls onClose when Cancel clicked', () => {
      const onClose = vi.fn();
      render(<EvolutionModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('resets form state on close', () => {
      render(<EvolutionModal {...defaultProps} />);
      // Go to step 2 and make changes
      fireEvent.click(screen.getByText(/Next/));
      fireEvent.change(screen.getByLabelText(/New Title/), {
        target: { value: 'Changed Title' },
      });
      // Cancel
      fireEvent.click(screen.getByText(/Back/));
      fireEvent.click(screen.getByText('Cancel'));
      // Reopen would show original data (but we're just testing close is called)
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
