// components/landing/__tests__/LandingFeatureCard.test.tsx
// Tests for LandingFeatureCard component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, interactive }: any) => (
    <div data-testid="glass-card" className={className} data-interactive={interactive}>
      {children}
    </div>
  ),
}));

import LandingFeatureCard from '../LandingFeatureCard';

describe('LandingFeatureCard', () => {
  const defaultProps = {
    icon: '🌟',
    title: 'Feature Title',
    description: 'This is a feature description',
  };

  describe('rendering', () => {
    it('renders icon', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      expect(screen.getByText('Feature Title')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      expect(screen.getByText('This is a feature description')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders icon with large text size', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const iconContainer = screen.getByText('🌟').closest('div');
      expect(iconContainer).toHaveClass('text-6xl');
    });

    it('renders icon as hidden from accessibility tree', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const iconContainer = screen.getByText('🌟').closest('div');
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders title with gradient styling', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const title = screen.getByText('Feature Title');
      expect(title).toHaveClass('bg-gradient-to-r');
      expect(title).toHaveClass('bg-clip-text');
      expect(title).toHaveClass('text-transparent');
    });

    it('renders title as h3', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Feature Title');
    });

    it('renders description with muted text', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const description = screen.getByText('This is a feature description');
      expect(description).toHaveClass('text-white/70');
    });
  });

  describe('GlassCard', () => {
    it('renders interactive GlassCard', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });

    it('renders with full height', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('h-full');
    });

    it('renders centered text', () => {
      render(<LandingFeatureCard {...defaultProps} />);
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('text-center');
    });
  });

  describe('different content', () => {
    it('renders with emoji icon', () => {
      render(<LandingFeatureCard icon="🎯" title="Goal" description="Set goals" />);
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });

    it('renders with long description', () => {
      const longDescription =
        'This is a very long description that explains the feature in detail with many words and sentences that wrap to multiple lines.';
      render(<LandingFeatureCard icon="📝" title="Writing" description={longDescription} />);
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('renders with special characters in title', () => {
      render(<LandingFeatureCard icon="✨" title="Dreams & Goals" description="Plan" />);
      expect(screen.getByText('Dreams & Goals')).toBeInTheDocument();
    });
  });
});
