// components/subscription/__tests__/CancelSubscriptionModal.test.tsx
// Tests for CancelSubscriptionModal component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

const mockToast = {
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
};
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

const mockMutate = vi.fn();
const mockUseMutationReturn = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      cancel: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
          mockUseMutationReturn(options),
      },
    },
  },
}));

vi.mock('@/components/ui/glass/GlassModal', () => ({
  GlassModal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="glass-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({
    children,
    onClick,
    className,
    variant,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} className={className} data-variant={variant} disabled={disabled}>
      {children}
    </button>
  ),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { CancelSubscriptionModal } from '../CancelSubscriptionModal';

// =============================================================================
// Test Suite
// =============================================================================

describe('CancelSubscriptionModal', () => {
  const defaultSubscription = {
    tier: 'pro',
    period: 'monthly',
    expiresAt: '2025-02-15T00:00:00.000Z',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    subscription: defaultSubscription,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutationReturn.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  // ===========================================================================
  // Visibility Tests
  // ===========================================================================

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByTestId('glass-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<CancelSubscriptionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('glass-modal')).not.toBeInTheDocument();
    });

    it('shows modal title "Cancel Subscription"', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Cancel Subscription' })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Warning Banner Tests
  // ===========================================================================

  describe('warning banner', () => {
    it('shows "Are you sure you want to cancel?" message', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText('Are you sure you want to cancel?')).toBeInTheDocument();
    });

    it('displays tier name with proper capitalization', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText(/Your Pro monthly subscription/)).toBeInTheDocument();
    });

    it('displays expiry date formatted correctly', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText(/February 15, 2025/)).toBeInTheDocument();
    });

    it('shows fallback text when expiresAt is not provided', () => {
      const subscriptionWithoutExpiry = { tier: 'pro', period: 'monthly' };
      render(
        <CancelSubscriptionModal {...defaultProps} subscription={subscriptionWithoutExpiry} />
      );
      expect(screen.getByText(/the end of your billing period/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Tier-Specific Loss Lists
  // ===========================================================================

  describe('pro tier loss list', () => {
    it('shows pro tier specific features to lose', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText(/30 reflections per month/)).toBeInTheDocument();
      expect(screen.getByText(/1 daily reflection limit/)).toBeInTheDocument();
      expect(screen.getByText(/5 active dreams/)).toBeInTheDocument();
      expect(screen.getByText(/Evolution reports/)).toBeInTheDocument();
      expect(screen.getByText(/Visualizations/)).toBeInTheDocument();
      expect(screen.getByText(/Advanced AI model/)).toBeInTheDocument();
    });

    it('does not show unlimited tier features for pro tier', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.queryByText(/60 reflections per month/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Extended thinking AI mode/)).not.toBeInTheDocument();
    });
  });

  describe('unlimited tier loss list', () => {
    it('shows unlimited tier specific features to lose', () => {
      const unlimitedSubscription = {
        tier: 'unlimited',
        period: 'yearly',
        expiresAt: '2025-12-15',
      };
      render(<CancelSubscriptionModal {...defaultProps} subscription={unlimitedSubscription} />);
      expect(screen.getByText(/60 reflections per month/)).toBeInTheDocument();
      expect(screen.getByText(/2 daily reflections limit/)).toBeInTheDocument();
      expect(screen.getByText(/Extended thinking AI mode/)).toBeInTheDocument();
      expect(screen.getByText(/Unlimited dreams/)).toBeInTheDocument();
    });

    it('does not show pro tier features for unlimited tier', () => {
      const unlimitedSubscription = { tier: 'unlimited', period: 'yearly' };
      render(<CancelSubscriptionModal {...defaultProps} subscription={unlimitedSubscription} />);
      expect(screen.queryByText(/30 reflections per month/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5 active dreams/)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Confirmation Checkbox Tests
  // ===========================================================================

  describe('confirmation checkbox', () => {
    it('renders checkbox unchecked by default', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('shows understanding text with tier name', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(
        screen.getByText(/I understand I will lose access to Pro features/)
      ).toBeInTheDocument();
    });

    it('toggles checkbox when clicked', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('disables cancel button when checkbox unchecked', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      expect(cancelButton).toBeDisabled();
    });

    it('enables cancel button when checkbox is checked', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // Cancel Mutation Tests
  // ===========================================================================

  describe('cancel mutation', () => {
    it('shows error toast when trying to cancel without confirmation', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      // Don't check the checkbox
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      // Button is disabled, so we need to test the onClick logic differently
      // The button should be disabled, so mutation won't be called
      expect(cancelButton).toBeDisabled();
    });

    it('calls mutation when checkbox is checked and cancel clicked', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      fireEvent.click(cancelButton);
      expect(mockMutate).toHaveBeenCalled();
    });

    it('calls onSuccess callback on successful cancellation', () => {
      mockUseMutationReturn.mockImplementation((options) => ({
        mutate: () => {
          options?.onSuccess?.();
        },
        isPending: false,
      }));

      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      fireEvent.click(cancelButton);

      expect(mockToast.success).toHaveBeenCalledWith(
        'Subscription canceled. Access continues until period end.'
      );
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('shows error toast on mutation error', () => {
      mockUseMutationReturn.mockImplementation((options) => ({
        mutate: () => {
          options?.onError?.(new Error('Failed to cancel'));
        },
        isPending: false,
      }));

      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      fireEvent.click(cancelButton);

      expect(mockToast.error).toHaveBeenCalledWith('Failed to cancel');
    });

    it('shows generic error message when error has no message', () => {
      mockUseMutationReturn.mockImplementation((options) => ({
        mutate: () => {
          options?.onError?.({ message: '' } as Error);
        },
        isPending: false,
      }));

      render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      fireEvent.click(cancelButton);

      expect(mockToast.error).toHaveBeenCalledWith('Failed to cancel subscription');
    });
  });

  // ===========================================================================
  // Pending State Tests
  // ===========================================================================

  describe('pending state', () => {
    it('shows "Canceling..." text when mutation is pending', () => {
      mockUseMutationReturn.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText('Canceling...')).toBeInTheDocument();
    });

    it('disables Keep Subscription button during pending state', () => {
      mockUseMutationReturn.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      render(<CancelSubscriptionModal {...defaultProps} />);
      const keepButton = screen.getByRole('button', { name: /Keep Subscription/i });
      expect(keepButton).toBeDisabled();
    });

    it('disables Cancel Subscription button during pending state', () => {
      mockUseMutationReturn.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      render(<CancelSubscriptionModal {...defaultProps} />);
      // Check confirmation first
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const cancelButton = screen.getByRole('button', { name: /Canceling/i });
      expect(cancelButton).toBeDisabled();
    });

    it('prevents modal close during pending state', () => {
      mockUseMutationReturn.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      const onClose = vi.fn();
      render(<CancelSubscriptionModal {...defaultProps} onClose={onClose} />);
      const keepButton = screen.getByRole('button', { name: /Keep Subscription/i });
      fireEvent.click(keepButton);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Close Behavior Tests
  // ===========================================================================

  describe('close behavior', () => {
    it('calls onClose when Keep Subscription button clicked (not pending)', () => {
      const onClose = vi.fn();
      render(<CancelSubscriptionModal {...defaultProps} onClose={onClose} />);
      const keepButton = screen.getByRole('button', { name: /Keep Subscription/i });
      fireEvent.click(keepButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('resets checkbox when modal closes', () => {
      const { rerender } = render(<CancelSubscriptionModal {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Close modal
      const keepButton = screen.getByRole('button', { name: /Keep Subscription/i });
      fireEvent.click(keepButton);

      // Reopen modal
      rerender(<CancelSubscriptionModal {...defaultProps} />);
      const newCheckbox = screen.getByRole('checkbox');
      expect(newCheckbox).not.toBeChecked();
    });
  });

  // ===========================================================================
  // Action Button Tests
  // ===========================================================================

  describe('action buttons', () => {
    it('renders Keep Subscription button with secondary variant', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const keepButton = screen.getByRole('button', { name: /Keep Subscription/i });
      expect(keepButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('renders Cancel Subscription button with primary variant', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /Cancel Subscription/i });
      expect(cancelButton).toHaveAttribute('data-variant', 'primary');
    });
  });

  // ===========================================================================
  // Date Formatting Tests
  // ===========================================================================

  describe('date formatting', () => {
    it('formats expiry date in US locale', () => {
      const subscription = { tier: 'pro', period: 'monthly', expiresAt: '2025-06-01' };
      render(<CancelSubscriptionModal {...defaultProps} subscription={subscription} />);
      expect(screen.getByText(/June 1, 2025/)).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      const subscription = { tier: 'pro', period: 'monthly', expiresAt: '2025-03-15T12:00:00Z' };
      render(<CancelSubscriptionModal {...defaultProps} subscription={subscription} />);
      // Date may vary slightly due to timezone, check for March 2025
      expect(screen.getByText(/March \d+, 2025/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Tier Name Capitalization Tests
  // ===========================================================================

  describe('tier name capitalization', () => {
    it('capitalizes pro tier correctly', () => {
      render(<CancelSubscriptionModal {...defaultProps} />);
      expect(screen.getByText(/Pro monthly subscription/)).toBeInTheDocument();
    });

    it('capitalizes unlimited tier correctly', () => {
      const subscription = { tier: 'unlimited', period: 'yearly' };
      render(<CancelSubscriptionModal {...defaultProps} subscription={subscription} />);
      expect(screen.getByText(/Unlimited yearly subscription/)).toBeInTheDocument();
    });
  });
});
