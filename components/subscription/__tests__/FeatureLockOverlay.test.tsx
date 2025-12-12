// components/subscription/__tests__/FeatureLockOverlay.test.tsx
// Tests for FeatureLockOverlay component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, className, elevated }: any) => (
    <div data-testid="glass-card" className={className} data-elevated={elevated}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlowBadge', () => ({
  GlowBadge: ({ children, variant }: any) => (
    <span data-testid="glow-badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, variant }: any) => <button data-variant={variant}>{children}</button>,
}));

import { FeatureLockOverlay } from '../FeatureLockOverlay';

describe('FeatureLockOverlay', () => {
  const defaultProps = {
    featureName: 'Advanced Analytics',
    description: 'Unlock powerful insights about your progress',
    requiredTier: 'pro' as const,
  };

  describe('rendering', () => {
    it('renders feature name', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.getByText('Unlock powerful insights about your progress')).toBeInTheDocument();
    });

    it('renders tier badge', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.getByText('Pro+')).toBeInTheDocument();
    });

    it('renders upgrade button', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    it('links to pricing page', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing');
    });
  });

  describe('tier variations', () => {
    it('shows Pro for pro tier', () => {
      render(<FeatureLockOverlay {...defaultProps} requiredTier="pro" />);
      expect(screen.getByText('Pro+')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    it('shows Unlimited for unlimited tier', () => {
      render(<FeatureLockOverlay {...defaultProps} requiredTier="unlimited" />);
      expect(screen.getByText('Unlimited+')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Unlimited')).toBeInTheDocument();
    });
  });

  describe('benefits list', () => {
    it('does not render benefits section when not provided', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      expect(screen.queryByText('This feature includes:')).not.toBeInTheDocument();
    });

    it('does not render benefits section when empty array', () => {
      render(<FeatureLockOverlay {...defaultProps} benefits={[]} />);
      expect(screen.queryByText('This feature includes:')).not.toBeInTheDocument();
    });

    it('renders benefits when provided', () => {
      const benefits = ['Detailed charts', 'Export data', 'AI insights'];
      render(<FeatureLockOverlay {...defaultProps} benefits={benefits} />);

      expect(screen.getByText('This feature includes:')).toBeInTheDocument();
      expect(screen.getByText('Detailed charts')).toBeInTheDocument();
      expect(screen.getByText('Export data')).toBeInTheDocument();
      expect(screen.getByText('AI insights')).toBeInTheDocument();
    });

    it('renders benefits as list items', () => {
      const benefits = ['Benefit 1', 'Benefit 2'];
      render(<FeatureLockOverlay {...defaultProps} benefits={benefits} />);

      const list = screen.getByRole('list');
      expect(list.querySelectorAll('li')).toHaveLength(2);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<FeatureLockOverlay {...defaultProps} className="custom-class" />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('custom-class');
    });

    it('renders elevated GlassCard', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-elevated', 'true');
    });

    it('has purple border', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('border-purple-500/50');
    });

    it('uses warning variant for badge', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      const badge = screen.getByTestId('glow-badge');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });
  });

  describe('heading structure', () => {
    it('renders feature name as h3', () => {
      render(<FeatureLockOverlay {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Advanced Analytics');
    });
  });
});
