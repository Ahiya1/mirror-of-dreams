// components/subscription/__tests__/PricingCard.test.tsx
// Tests for PricingCard component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({
    children,
    className,
    elevated,
    interactive,
  }: {
    children: React.ReactNode;
    className?: string;
    elevated?: boolean;
    interactive?: boolean;
  }) => (
    <div
      data-testid="glass-card"
      className={className}
      data-elevated={elevated}
      data-interactive={interactive}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({
    children,
    variant,
    className,
    disabled,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
    disabled?: boolean;
  }) => (
    <button data-variant={variant} className={className} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('../CheckoutButton', () => ({
  CheckoutButton: ({
    tier,
    period,
    variant,
    className,
  }: {
    tier: string;
    period: string;
    variant?: string;
    className?: string;
  }) => (
    <button
      data-testid="checkout-button"
      data-tier={tier}
      data-period={period}
      data-variant={variant}
      className={className}
    >
      Get {tier}
    </button>
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { PricingCard } from '../PricingCard';

describe('PricingCard', () => {
  const defaultFeatures = [
    { name: 'Feature 1', included: true },
    { name: 'Feature 2', included: true },
    { name: 'Feature 3', included: false },
  ];

  const defaultProps = {
    tier: 'seeker' as const,
    name: 'Seeker',
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: 'For dedicated dreamers',
    features: defaultFeatures,
    billingPeriod: 'monthly' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders tier name', () => {
      render(<PricingCard {...defaultProps} />);
      expect(screen.getByText('Seeker')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<PricingCard {...defaultProps} />);
      expect(screen.getByText('For dedicated dreamers')).toBeInTheDocument();
    });

    it('renders monthly price when billingPeriod is monthly', () => {
      render(<PricingCard {...defaultProps} billingPeriod="monthly" />);
      expect(screen.getByText('$19')).toBeInTheDocument();
      expect(screen.getByText('per month')).toBeInTheDocument();
    });

    it('renders yearly price when billingPeriod is yearly', () => {
      render(<PricingCard {...defaultProps} billingPeriod="yearly" />);
      expect(screen.getByText('$190')).toBeInTheDocument();
      expect(screen.getByText('per year')).toBeInTheDocument();
    });
  });

  describe('features list', () => {
    it('renders all features', () => {
      render(<PricingCard {...defaultProps} />);
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Feature 3')).toBeInTheDocument();
    });

    it('shows checkmark for included features', () => {
      render(<PricingCard {...defaultProps} />);
      // Check icons are rendered for included features
      const feature1 = screen.getByText('Feature 1');
      expect(feature1).toHaveClass('text-white');
    });

    it('shows X for non-included features', () => {
      render(<PricingCard {...defaultProps} />);
      const feature3 = screen.getByText('Feature 3');
      expect(feature3).toHaveClass('text-white/40');
    });
  });

  describe('yearly savings', () => {
    it('shows savings percentage when yearly billing', () => {
      render(<PricingCard {...defaultProps} billingPeriod="yearly" />);
      // 190 vs 228 (19*12) = 17% savings
      expect(screen.getByText(/Save \d+% yearly/)).toBeInTheDocument();
    });

    it('does not show savings for monthly billing', () => {
      render(<PricingCard {...defaultProps} billingPeriod="monthly" />);
      expect(screen.queryByText(/Save.*yearly/)).not.toBeInTheDocument();
    });

    it('does not show savings for free tier', () => {
      render(
        <PricingCard
          {...defaultProps}
          tier="free"
          monthlyPrice={0}
          yearlyPrice={0}
          billingPeriod="yearly"
        />
      );
      expect(screen.queryByText(/Save.*yearly/)).not.toBeInTheDocument();
    });
  });

  describe('popular badge', () => {
    it('shows popular badge when popular is true', () => {
      render(<PricingCard {...defaultProps} popular={true} />);
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });

    it('does not show popular badge when popular is false', () => {
      render(<PricingCard {...defaultProps} popular={false} />);
      expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
    });

    it('does not show popular badge when is current plan', () => {
      render(<PricingCard {...defaultProps} popular={true} currentUserTier="seeker" />);
      expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
    });
  });

  describe('current plan badge', () => {
    it('shows current plan badge when tier matches currentUserTier', () => {
      render(<PricingCard {...defaultProps} currentUserTier="seeker" />);
      // May have multiple "Current Plan" elements (badge + button)
      expect(screen.getAllByText('Current Plan').length).toBeGreaterThan(0);
    });

    it('does not show current plan badge when tiers dont match', () => {
      render(<PricingCard {...defaultProps} currentUserTier="free" />);
      expect(screen.queryByText('Current Plan')).not.toBeInTheDocument();
    });
  });

  describe('free tier CTA', () => {
    it('shows Start Free button for free tier', () => {
      render(<PricingCard {...defaultProps} tier="free" />);
      expect(screen.getByText('Start Free')).toBeInTheDocument();
    });

    it('links to signup for free tier', () => {
      render(<PricingCard {...defaultProps} tier="free" />);
      const link = screen.getByText('Start Free').closest('a');
      expect(link).toHaveAttribute('href', '/auth/signup');
    });

    it('shows Current Plan for free tier when user is on free', () => {
      render(<PricingCard {...defaultProps} tier="free" currentUserTier="free" />);
      // The button text and badge both show "Current Plan"
      expect(screen.getAllByText('Current Plan').length).toBeGreaterThan(0);
    });
  });

  describe('paid tier CTA', () => {
    it('shows checkout button for paid tiers when not current plan', () => {
      render(<PricingCard {...defaultProps} tier="seeker" currentUserTier="free" />);
      expect(screen.getByTestId('checkout-button')).toBeInTheDocument();
    });

    it('shows disabled Current Plan button when on current plan', () => {
      render(<PricingCard {...defaultProps} tier="seeker" currentUserTier="seeker" />);
      const button = screen.getByRole('button', { name: 'Current Plan' });
      expect(button).toBeDisabled();
    });

    it('passes correct props to CheckoutButton', () => {
      render(<PricingCard {...defaultProps} tier="seeker" billingPeriod="yearly" popular />);
      const checkoutButton = screen.getByTestId('checkout-button');
      expect(checkoutButton).toHaveAttribute('data-tier', 'seeker');
      expect(checkoutButton).toHaveAttribute('data-period', 'yearly');
      expect(checkoutButton).toHaveAttribute('data-variant', 'primary');
    });

    it('uses secondary variant for non-popular tiers', () => {
      render(
        <PricingCard {...defaultProps} tier="seeker" billingPeriod="monthly" popular={false} />
      );
      const checkoutButton = screen.getByTestId('checkout-button');
      expect(checkoutButton).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('card styling', () => {
    it('applies border styling when popular', () => {
      render(<PricingCard {...defaultProps} popular={true} />);
      const card = screen.getByTestId('glass-card');
      expect(card.className).toContain('border-purple-500');
    });

    it('applies border styling when current plan', () => {
      render(<PricingCard {...defaultProps} currentUserTier="seeker" />);
      const card = screen.getByTestId('glass-card');
      expect(card.className).toContain('border-green-500');
    });

    it('is interactive when popular and not current', () => {
      render(<PricingCard {...defaultProps} popular={true} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });

    it('is not interactive when current plan', () => {
      render(<PricingCard {...defaultProps} popular={true} currentUserTier="seeker" />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-interactive', 'false');
    });
  });
});
