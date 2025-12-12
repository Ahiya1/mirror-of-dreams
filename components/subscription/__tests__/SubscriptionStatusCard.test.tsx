// components/subscription/__tests__/SubscriptionStatusCard.test.tsx
// Tests for SubscriptionStatusCard component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

const mockRefetch = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      getStatus: {
        useQuery: vi.fn(),
      },
    },
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({
    children,
    elevated,
    className,
  }: {
    children: React.ReactNode;
    elevated?: boolean;
    className?: string;
  }) => (
    <div data-testid="glass-card" data-elevated={elevated} className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowBadge', () => ({
  GlowBadge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="glow-badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({
    children,
    onClick,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
  }) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock CancelSubscriptionModal
vi.mock('../CancelSubscriptionModal', () => ({
  CancelSubscriptionModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    subscription: { tier: string; period: string; expiresAt?: string };
    onSuccess?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="cancel-modal">
        <button onClick={onClose} data-testid="cancel-modal-close">
          Close
        </button>
        <button onClick={onSuccess} data-testid="cancel-modal-success">
          Confirm
        </button>
      </div>
    ) : null,
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { SubscriptionStatusCard } from '../SubscriptionStatusCard';

import { trpc } from '@/lib/trpc';

// =============================================================================
// Test Helpers
// =============================================================================

const createSubscriptionData = (overrides = {}) => ({
  tier: 'pro',
  status: 'active',
  isActive: true,
  isCanceled: false,
  period: 'monthly',
  expiresAt: '2025-02-15T00:00:00.000Z',
  ...overrides,
});

// =============================================================================
// Test Suite
// =============================================================================

describe('SubscriptionStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('loading state', () => {
    it('shows loading skeleton when data is loading', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);

      expect(screen.getByText('Subscription & Billing')).toBeInTheDocument();
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
      // Check for pulse animation class (loading skeleton indicator)
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders GlassCard with elevated prop during loading', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-elevated', 'true');
    });
  });

  // ===========================================================================
  // Null Data Tests
  // ===========================================================================

  describe('null data state', () => {
    it('returns null when subscription data is null', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: null,
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      const { container } = render(<SubscriptionStatusCard />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when subscription data is undefined', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      const { container } = render(<SubscriptionStatusCard />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ===========================================================================
  // Free Tier Display Tests
  // ===========================================================================

  describe('free tier display', () => {
    it('shows Free tier name', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'free', status: null, period: null, expiresAt: null }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('does not show status badge for free tier', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'free', status: null, period: null }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.queryByTestId('glow-badge')).not.toBeInTheDocument();
    });

    it('shows Upgrade Plan button for free tier', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'free', period: null }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByRole('button', { name: /Upgrade Plan/i })).toBeInTheDocument();
    });

    it('links Upgrade Plan button to pricing page', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'free', period: null }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/pricing');
    });

    it('does not show billing period for free tier', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'free', period: null }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.queryByText('Billing Period')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Paid Tier Display Tests
  // ===========================================================================

  describe('paid tier display', () => {
    it('shows Pro tier name with proper capitalization', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('shows Unlimited tier name with proper capitalization', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'unlimited' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Unlimited')).toBeInTheDocument();
    });

    it('shows status badge for paid tiers', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', status: 'active' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByTestId('glow-badge')).toBeInTheDocument();
    });

    it('shows success variant badge for active subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isActive: true, isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const badge = screen.getByTestId('glow-badge');
      expect(badge).toHaveAttribute('data-variant', 'success');
    });

    it('shows warning variant badge for canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isActive: false, isCanceled: true }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const badge = screen.getByTestId('glow-badge');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    it('shows info variant badge for inactive non-canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isActive: false, isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const badge = screen.getByTestId('glow-badge');
      expect(badge).toHaveAttribute('data-variant', 'info');
    });

    it('formats status text with underscores replaced by spaces', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', status: 'past_due' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('past due')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Billing Period Display Tests
  // ===========================================================================

  describe('billing period display', () => {
    it('shows Monthly for monthly period', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ period: 'monthly' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Billing Period')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('shows Yearly for yearly period', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ period: 'yearly' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Yearly')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Next Billing Date Tests
  // ===========================================================================

  describe('next billing date', () => {
    it('shows next billing date for active non-canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isActive: true,
          isCanceled: false,
          expiresAt: '2025-02-15T00:00:00.000Z',
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Next Billing Date')).toBeInTheDocument();
      expect(screen.getByText(/February 15, 2025/)).toBeInTheDocument();
    });

    it('does not show next billing date for canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isActive: true,
          isCanceled: true,
          expiresAt: '2025-02-15',
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.queryByText('Next Billing Date')).not.toBeInTheDocument();
    });

    it('shows relative time for next billing date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isActive: true,
          isCanceled: false,
          expiresAt: futureDate.toISOString(),
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      // formatDistanceToNow should show something like "in 7 days"
      expect(screen.getByText(/\(in \d+ days\)/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Cancellation Notice Tests
  // ===========================================================================

  describe('cancellation notice', () => {
    it('shows cancellation notice for canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isCanceled: true,
          expiresAt: '2025-02-15',
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText('Subscription Canceling')).toBeInTheDocument();
    });

    it('shows expiry date in cancellation notice', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isCanceled: true,
          expiresAt: '2025-02-15',
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText(/will end on/)).toBeInTheDocument();
      expect(screen.getByText(/February 15, 2025/)).toBeInTheDocument();
    });

    it('shows downgrade to Free message', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          isCanceled: true,
          expiresAt: '2025-02-15',
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByText(/downgraded to Free tier/)).toBeInTheDocument();
    });

    it('does not show cancellation notice for active non-canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.queryByText('Subscription Canceling')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Action Buttons Tests
  // ===========================================================================

  describe('action buttons', () => {
    it('shows Change Plan button for paid users', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByRole('button', { name: /Change Plan/i })).toBeInTheDocument();
    });

    it('shows Cancel button for active paid users', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    });

    it('does not show Cancel button for canceled subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isCanceled: true }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.textContent === 'Cancel');
      expect(cancelButton).toBeUndefined();
    });

    it('Change Plan button links to pricing page', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro' }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/pricing');
    });
  });

  // ===========================================================================
  // Cancel Modal Tests
  // ===========================================================================

  describe('cancel modal', () => {
    it('opens cancel modal when Cancel button clicked', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('cancel-modal')).toBeInTheDocument();
    });

    it('closes cancel modal when close button clicked', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);

      // Open modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);
      expect(screen.getByTestId('cancel-modal')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByTestId('cancel-modal-close');
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('cancel-modal')).not.toBeInTheDocument();
    });

    it('calls refetch on successful cancellation', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({ tier: 'pro', isCanceled: false }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);

      // Open modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      // Trigger success callback
      const successButton = screen.getByTestId('cancel-modal-success');
      fireEvent.click(successButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('handles missing expiresAt in subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          tier: 'pro',
          isActive: true,
          isCanceled: false,
          expiresAt: null,
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      // Should not show next billing date section
      expect(screen.queryByText('Next Billing Date')).not.toBeInTheDocument();
    });

    it('handles missing period in subscription', () => {
      vi.mocked(trpc.subscriptions.getStatus.useQuery).mockReturnValue({
        data: createSubscriptionData({
          tier: 'pro',
          period: null,
        }),
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      render(<SubscriptionStatusCard />);
      expect(screen.queryByText('Billing Period')).not.toBeInTheDocument();
    });
  });
});
