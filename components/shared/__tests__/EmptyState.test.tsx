// components/shared/__tests__/EmptyState.test.tsx
// Tests for EmptyState component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, elevated }: any) => (
    <div data-testid="glass-card" className={className} data-elevated={elevated}>
      {children}
    </div>
  ),
  GlowButton: ({ children, variant, size, onClick, className }: any) => (
    <button data-variant={variant} data-size={size} className={className} onClick={onClick}>
      {children}
    </button>
  ),
  GradientText: ({ children, gradient, className }: any) => (
    <span data-gradient={gradient} className={className}>
      {children}
    </span>
  ),
}));

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    icon: '🌟',
    title: 'No Items Yet',
    description: 'Start by adding your first item.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders title', () => {
      render(<EmptyState {...defaultProps} />);
      expect(screen.getByText('No Items Yet')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<EmptyState {...defaultProps} />);
      expect(screen.getByText('Start by adding your first item.')).toBeInTheDocument();
    });

    it('renders icon when no illustration provided', () => {
      render(<EmptyState {...defaultProps} />);
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });
  });

  describe('illustration', () => {
    it('renders illustration instead of icon when provided', () => {
      const illustration = <div data-testid="custom-illustration">Custom Image</div>;
      render(<EmptyState {...defaultProps} illustration={illustration} />);

      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
      // Icon should still be in DOM but illustration takes priority visually
    });
  });

  describe('CTA button', () => {
    it('renders CTA button when both ctaLabel and ctaAction provided', () => {
      const ctaAction = vi.fn();
      render(<EmptyState {...defaultProps} ctaLabel="Get Started" ctaAction={ctaAction} />);

      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('does not render CTA button when ctaLabel not provided', () => {
      const ctaAction = vi.fn();
      render(<EmptyState {...defaultProps} ctaAction={ctaAction} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render CTA button when ctaAction not provided', () => {
      render(<EmptyState {...defaultProps} ctaLabel="Get Started" />);

      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('calls ctaAction when CTA button clicked', () => {
      const ctaAction = vi.fn();
      render(<EmptyState {...defaultProps} ctaLabel="Get Started" ctaAction={ctaAction} />);

      fireEvent.click(screen.getByText('Get Started'));

      expect(ctaAction).toHaveBeenCalledTimes(1);
    });

    it('uses lg size for default variant', () => {
      render(
        <EmptyState {...defaultProps} ctaLabel="Action" ctaAction={vi.fn()} variant="default" />
      );

      const button = screen.getByText('Action');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('uses md size for compact variant', () => {
      render(
        <EmptyState {...defaultProps} ctaLabel="Action" ctaAction={vi.fn()} variant="compact" />
      );

      const button = screen.getByText('Action');
      expect(button).toHaveAttribute('data-size', 'md');
    });
  });

  describe('progress indicator', () => {
    it('renders progress when provided', () => {
      render(
        <EmptyState
          {...defaultProps}
          progress={{
            current: 2,
            total: 4,
            label: 'reflections',
          }}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('4 reflections')).toBeInTheDocument();
    });

    it('does not render progress when not provided', () => {
      render(<EmptyState {...defaultProps} />);

      expect(screen.queryByText('reflections')).not.toBeInTheDocument();
    });

    it('calculates progress bar width correctly', () => {
      const { container } = render(
        <EmptyState
          {...defaultProps}
          progress={{
            current: 1,
            total: 4,
            label: 'items',
          }}
        />
      );

      const progressBar = container.querySelector('[style*="width: 25%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styles by default', () => {
      const { container } = render(<EmptyState {...defaultProps} />);

      expect(container.firstChild).toHaveClass('min-h-[50vh]');
    });

    it('applies compact variant styles when specified', () => {
      const { container } = render(<EmptyState {...defaultProps} variant="compact" />);

      expect(container.firstChild).toHaveClass('min-h-[30vh]');
    });
  });

  describe('className', () => {
    it('applies custom className', () => {
      const { container } = render(<EmptyState {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('GlassCard', () => {
    it('renders elevated GlassCard', () => {
      render(<EmptyState {...defaultProps} />);

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-elevated', 'true');
    });
  });

  describe('GradientText', () => {
    it('renders title with cosmic gradient', () => {
      render(<EmptyState {...defaultProps} />);

      const title = screen.getByText('No Items Yet');
      expect(title).toHaveAttribute('data-gradient', 'cosmic');
    });
  });
});
