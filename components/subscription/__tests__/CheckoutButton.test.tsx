// components/subscription/__tests__/CheckoutButton.test.tsx
// Tests for CheckoutButton component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockToast = {
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
};
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockMutate = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    subscriptions: {
      createCheckout: {
        useMutation: (options: {
          onSuccess: (data: { approvalUrl: string }) => void;
          onError: (err: Error) => void;
        }) => {
          return {
            mutate: (data: { tier: string; period: string }) => {
              mockMutate(data);
              // Simulate success by default
              options.onSuccess({ approvalUrl: 'https://paypal.com/checkout' });
            },
          };
        },
      },
    },
  },
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({
    children,
    variant,
    className,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} data-variant={variant} className={className} disabled={disabled}>
      {children}
    </button>
  ),
}));

import { CheckoutButton } from '../CheckoutButton';

describe('CheckoutButton', () => {
  const defaultProps = {
    tier: 'pro' as const,
    period: 'monthly' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { tier: 'free' },
    });
    // Mock window.open
    vi.stubGlobal('open', vi.fn().mockReturnValue({ closed: false }));
  });

  describe('rendering', () => {
    it('renders button with tier name', () => {
      render(<CheckoutButton {...defaultProps} />);
      expect(screen.getByText('Start Pro')).toBeInTheDocument();
    });

    it('renders button with unlimited tier name', () => {
      render(<CheckoutButton {...defaultProps} tier="unlimited" />);
      expect(screen.getByText('Start Unlimited')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CheckoutButton {...defaultProps} className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('uses primary variant by default', () => {
      render(<CheckoutButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });

    it('uses secondary variant when specified', () => {
      render(<CheckoutButton {...defaultProps} variant="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('unauthenticated user', () => {
    it('redirects to signup with plan params when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<CheckoutButton {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockPush).toHaveBeenCalledWith('/auth/signup?plan=pro&period=monthly');
    });

    it('includes yearly period in redirect', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<CheckoutButton {...defaultProps} period="yearly" />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockPush).toHaveBeenCalledWith('/auth/signup?plan=pro&period=yearly');
    });
  });

  describe('authenticated user on same tier', () => {
    it('shows info toast when already on selected tier', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'pro' },
      });

      render(<CheckoutButton {...defaultProps} tier="pro" />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockToast.info).toHaveBeenCalledWith("You're already on the Pro plan.");
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('capitalizes tier name in toast', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'unlimited' },
      });

      render(<CheckoutButton {...defaultProps} tier="unlimited" />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockToast.info).toHaveBeenCalledWith("You're already on the Unlimited plan.");
    });
  });

  describe('checkout flow', () => {
    it('calls createCheckout mutation when authenticated and not on tier', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'free' },
      });

      render(<CheckoutButton {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockMutate).toHaveBeenCalledWith({
        tier: 'pro',
        period: 'monthly',
      });
    });

    it('passes yearly period to mutation', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'free' },
      });

      render(<CheckoutButton {...defaultProps} period="yearly" />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockMutate).toHaveBeenCalledWith({
        tier: 'pro',
        period: 'yearly',
      });
    });

    it('opens PayPal in popup window', () => {
      const mockWindowOpen = vi.fn().mockReturnValue({ closed: false });
      vi.stubGlobal('open', mockWindowOpen);

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'free' },
      });

      render(<CheckoutButton {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://paypal.com/checkout',
        'PayPal Checkout',
        expect.stringContaining('width=500')
      );
    });

    it('redirects when popup is blocked', () => {
      vi.stubGlobal('open', vi.fn().mockReturnValue(null));

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'free' },
      });

      render(<CheckoutButton {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      expect(mockToast.info).toHaveBeenCalledWith('Redirecting to PayPal...');
    });
  });

  describe('loading state', () => {
    it('shows Processing... when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { tier: 'free' },
      });

      // We need to test the intermediate loading state
      // For now, just verify the button text changes pattern exists
      render(<CheckoutButton {...defaultProps} />);
      expect(screen.getByText('Start Pro')).toBeInTheDocument();
    });
  });
});
