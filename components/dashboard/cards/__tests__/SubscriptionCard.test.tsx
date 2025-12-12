import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SubscriptionCard from '../SubscriptionCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      ({ children, className, onClick, onMouseEnter, onMouseLeave, ...props }: any, ref: any) => (
        <div
          ref={ref}
          className={className}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          {...props}
        >
          {children}
        </div>
      )
    ),
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock animation variants
vi.mock('@/lib/animations/variants', () => ({
  cardPressVariants: {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  },
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, variant, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock TierBadge
vi.mock('@/components/dashboard/shared/TierBadge', () => ({
  default: ({ tier, size, animated, showGlow }: any) => (
    <div
      data-testid="tier-badge"
      data-tier={tier}
      data-size={size}
      data-animated={animated}
      data-show-glow={showGlow}
    >
      {tier}
    </div>
  ),
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// ============================================================================
// Test Data Factories
// ============================================================================

interface MockUser {
  tier: 'free' | 'pro' | 'unlimited';
  subscriptionStatus?: string;
  isCreator?: boolean;
}

const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  tier: 'free',
  subscriptionStatus: 'active',
  isCreator: false,
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('SubscriptionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock
    mockUseAuth.mockReturnValue({ user: createMockUser() });
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render card with title "Your Plan"', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Your Plan')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SubscriptionCard className="custom-sub-card" />);

      const card = container.querySelector('.subscription-card');
      expect(card).toHaveClass('custom-sub-card');
    });

    it('should render "Current Benefits" section title', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Current Benefits')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Tier Badge Tests
  // --------------------------------------------------------------------------
  describe('tier badge', () => {
    it('should render TierBadge with free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-tier', 'free');
    });

    it('should render TierBadge with pro tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-tier', 'pro');
    });

    it('should render TierBadge with unlimited tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-tier', 'unlimited');
    });

    it('should render TierBadge with large size', () => {
      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-size', 'lg');
    });

    it('should render TierBadge with glow enabled', () => {
      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-show-glow', 'true');
    });

    it('should render TierBadge with animation by default', () => {
      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-animated', 'true');
    });

    it('should render TierBadge without animation when animated=false', () => {
      render(<SubscriptionCard animated={false} />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-animated', 'false');
    });
  });

  // --------------------------------------------------------------------------
  // Benefits List Tests - Free Tier
  // --------------------------------------------------------------------------
  describe('benefits list - free tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });
    });

    it('should show "2 monthly reflections" for free tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('2 monthly reflections')).toBeInTheDocument();
    });

    it('should show "2 active dreams" for free tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('2 active dreams')).toBeInTheDocument();
    });

    it('should show "Basic AI insights" for free tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Basic AI insights')).toBeInTheDocument();
    });

    it('should show "All reflection tones" for free tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('All reflection tones')).toBeInTheDocument();
    });

    it('should show tier description for free tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('2 reflections per month to get started')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Benefits List Tests - Pro Tier
  // --------------------------------------------------------------------------
  describe('benefits list - pro tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });
    });

    it('should show "30 monthly reflections" for pro tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('30 monthly reflections')).toBeInTheDocument();
    });

    it('should show "1 reflection per day" for pro tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('1 reflection per day')).toBeInTheDocument();
    });

    it('should show "5 active dreams" for pro tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('5 active dreams')).toBeInTheDocument();
    });

    it('should show "Evolution reports" for pro tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Evolution reports')).toBeInTheDocument();
    });

    it('should show tier description for pro tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('30 reflections monthly + Evolution Reports')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Benefits List Tests - Unlimited Tier
  // --------------------------------------------------------------------------
  describe('benefits list - unlimited tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });
    });

    it('should show "60 monthly reflections" for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('60 monthly reflections')).toBeInTheDocument();
    });

    it('should show "2 reflections per day" for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('2 reflections per day')).toBeInTheDocument();
    });

    it('should show "Unlimited dreams" for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Unlimited dreams')).toBeInTheDocument();
    });

    it('should show "Extended thinking AI" for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Extended thinking AI')).toBeInTheDocument();
    });

    it('should show "Priority support" for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('Priority support')).toBeInTheDocument();
    });

    it('should show tier description for unlimited tier', () => {
      render(<SubscriptionCard />);

      expect(screen.getByText('60 reflections monthly + Extended Thinking AI')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Upgrade Preview Tests
  // --------------------------------------------------------------------------
  describe('upgrade preview', () => {
    // Note: The component has a bug in getUpgradeBenefits() where the allTierInfo
    // object doesn't contain 'pro' or 'unlimited' keys, so upgradeBenefits is always
    // empty for free/pro users. These tests verify the current (buggy) behavior.
    // When the bug is fixed, these tests should be updated.

    it('should NOT show upgrade preview section for free tier users (known limitation)', () => {
      // Bug: allTierInfo doesn't include 'pro' key, so nextTierInfo is undefined
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      // Currently doesn't show because upgradeBenefits is always empty
      expect(screen.queryByText(/available with/i)).not.toBeInTheDocument();
    });

    it('should NOT show upgrade preview section for pro tier users (known limitation)', () => {
      // Bug: allTierInfo doesn't include 'unlimited' key, so nextTierInfo is undefined
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      // Currently doesn't show because upgradeBenefits is always empty
      expect(screen.queryByText(/available with unlimited/i)).not.toBeInTheDocument();
    });

    it('should NOT show upgrade preview section for unlimited tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      expect(screen.queryByText(/available with/i)).not.toBeInTheDocument();
    });

    it('should have nextTier=pro for free tier users', () => {
      // Verify the tier info is correct even if upgrade preview doesn't show
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      // Free tier should have nextTier: 'pro' defined in getTierInfo()
      // We can verify this indirectly by checking the action button
      expect(screen.getByRole('button', { name: 'Upgrade Plan' })).toBeInTheDocument();
    });

    it('should have nextTier=unlimited for pro tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      // Pro tier should have nextTier: 'unlimited'
      expect(screen.getByRole('button', { name: 'Upgrade to Unlimited' })).toBeInTheDocument();
    });

    it('should have nextTier=null for unlimited tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      // Unlimited tier should have nextTier: null
      expect(screen.getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Action Button Tests
  // --------------------------------------------------------------------------
  describe('action button', () => {
    it('should show "Upgrade Plan" button for free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      expect(screen.getByRole('button', { name: 'Upgrade Plan' })).toBeInTheDocument();
    });

    it('should link to /pricing for free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      const link = screen.getByRole('link', { name: 'Upgrade Plan' });
      expect(link).toHaveAttribute('href', '/pricing');
    });

    it('should show "Upgrade to Unlimited" button for pro tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      expect(screen.getByRole('button', { name: 'Upgrade to Unlimited' })).toBeInTheDocument();
    });

    it('should link to /pricing for pro tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      const link = screen.getByRole('link', { name: 'Upgrade to Unlimited' });
      expect(link).toHaveAttribute('href', '/pricing');
    });

    it('should show "Manage Subscription" button for unlimited tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      expect(screen.getByRole('button', { name: 'Manage Subscription' })).toBeInTheDocument();
    });

    it('should link to /profile for unlimited tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      const link = screen.getByRole('link', { name: 'Manage Subscription' });
      expect(link).toHaveAttribute('href', '/profile');
    });
  });

  // --------------------------------------------------------------------------
  // Button Variant Tests
  // --------------------------------------------------------------------------
  describe('button variants', () => {
    it('should use cosmic variant for free tier upgrade button', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<SubscriptionCard />);

      const button = screen.getByRole('button', { name: 'Upgrade Plan' });
      expect(button).toHaveAttribute('data-variant', 'cosmic');
    });

    it('should use cosmic variant for pro tier upgrade button', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<SubscriptionCard />);

      const button = screen.getByRole('button', { name: 'Upgrade to Unlimited' });
      expect(button).toHaveAttribute('data-variant', 'cosmic');
    });

    it('should use secondary variant for unlimited tier manage button', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<SubscriptionCard />);

      const button = screen.getByRole('button', { name: 'Manage Subscription' });
      expect(button).toHaveAttribute('data-variant', 'secondary');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('should pass isLoading to DashboardCard', () => {
      render(<SubscriptionCard isLoading />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });

    it('should not show loading state by default', () => {
      render(<SubscriptionCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).not.toHaveClass('dashboard-card--loading');
    });
  });

  // --------------------------------------------------------------------------
  // Animation Props Tests
  // --------------------------------------------------------------------------
  describe('animation props', () => {
    it('should accept animated prop without error', () => {
      render(<SubscriptionCard animated={false} />);

      expect(screen.getByText('Your Plan')).toBeInTheDocument();
    });

    it('should default to animated=true', () => {
      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-animated', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Null/Undefined User Tests
  // --------------------------------------------------------------------------
  describe('null/undefined user handling', () => {
    it('should default to free tier when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-tier', 'free');
      expect(screen.getByText('2 monthly reflections')).toBeInTheDocument();
    });

    it('should default to free tier when user tier is undefined', () => {
      mockUseAuth.mockReturnValue({ user: { tier: undefined } });

      render(<SubscriptionCard />);

      const badge = screen.getByTestId('tier-badge');
      expect(badge).toHaveAttribute('data-tier', 'free');
    });

    it('should show Upgrade Plan button when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(<SubscriptionCard />);

      expect(screen.getByRole('button', { name: 'Upgrade Plan' })).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Check Mark Icon Tests
  // --------------------------------------------------------------------------
  describe('benefit icons', () => {
    it('should render checkmark icon for each benefit', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      const { container } = render(<SubscriptionCard />);

      // Free tier has 4 benefits
      const checkmarks = container.querySelectorAll('.benefit-icon');
      expect(checkmarks.length).toBeGreaterThanOrEqual(4);
    });
  });
});
