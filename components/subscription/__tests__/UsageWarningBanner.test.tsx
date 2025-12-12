// components/subscription/__tests__/UsageWarningBanner.test.tsx
// Tests for UsageWarningBanner component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, variant, size }: any) => (
    <button data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock('@/lib/utils/constants', () => ({
  TIER_LIMITS: {
    free: 10,
    pro: 50,
    unlimited: Infinity,
  },
}));

import { UsageWarningBanner } from '../UsageWarningBanner';

describe('UsageWarningBanner', () => {
  describe('visibility', () => {
    it('does not render when usage is below 80%', () => {
      const { container } = render(<UsageWarningBanner tier="free" used={5} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when usage is 80%', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('renders when usage exceeds limit', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });
  });

  describe('variant auto-detection', () => {
    it('uses warning variant at 80-99% usage', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByText('Almost at Your Limit')).toBeInTheDocument();
    });

    it('uses error variant at 100% usage', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByText('Reflection Limit Reached')).toBeInTheDocument();
    });
  });

  describe('messages', () => {
    it('shows remaining count message at 80-89%', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByText(/You've used 8 of 10 reflections this month/)).toBeInTheDocument();
    });

    it('shows 1 reflection remaining singular', () => {
      render(<UsageWarningBanner tier="free" used={9} />);
      expect(screen.getByText(/1 reflection remaining/)).toBeInTheDocument();
    });

    it('shows consider upgrading message when remaining > 1 at 90%+', () => {
      render(<UsageWarningBanner tier="pro" used={46} />);
      expect(screen.getByText(/Consider upgrading/)).toBeInTheDocument();
    });

    it('shows upgrade message when limit reached', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByText(/Upgrade to continue your journey/)).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('shows usage stats', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByText('8 / 10 reflections used')).toBeInTheDocument();
    });

    it('shows percentage', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('caps percentage at 100%', () => {
      render(<UsageWarningBanner tier="free" used={15} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('upgrade button', () => {
    it('shows upgrade button when limit reached', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByText('Upgrade')).toBeInTheDocument();
    });

    it('does not show upgrade button when limit not reached', () => {
      render(<UsageWarningBanner tier="free" used={9} />);
      expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
    });

    it('links to pricing page', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing');
    });
  });

  describe('tier limits', () => {
    it('uses free tier limit (10)', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByText('8 / 10 reflections used')).toBeInTheDocument();
    });

    it('uses pro tier limit (50)', () => {
      render(<UsageWarningBanner tier="pro" used={40} />);
      expect(screen.getByText('40 / 50 reflections used')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<UsageWarningBanner tier="free" used={8} className="custom-class" />);
      expect(screen.getByTestId('glass-card')).toHaveClass('custom-class');
    });

    it('applies warning styling', () => {
      render(<UsageWarningBanner tier="free" used={8} />);
      expect(screen.getByTestId('glass-card')).toHaveClass('bg-mirror-warning/10');
    });

    it('applies error styling when limit reached', () => {
      render(<UsageWarningBanner tier="free" used={10} />);
      expect(screen.getByTestId('glass-card')).toHaveClass('bg-mirror-error/10');
    });
  });

  describe('explicit variant override', () => {
    it('respects info variant', () => {
      render(<UsageWarningBanner tier="free" used={8} variant="info" />);
      // Info variant at 80%+ should still render
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('respects error variant override', () => {
      render(<UsageWarningBanner tier="free" used={8} variant="error" />);
      expect(screen.getByText('Reflection Limit Reached')).toBeInTheDocument();
    });
  });
});
