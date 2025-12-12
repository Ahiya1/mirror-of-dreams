// components/dreams/__tests__/DreamCard.test.tsx
// Tests for DreamCard component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, elevated, interactive }: any) => (
    <div
      data-testid="glass-card"
      className={className}
      data-elevated={elevated}
      data-interactive={interactive}
    >
      {children}
    </div>
  ),
  GlowButton: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
  GlowBadge: ({ children, variant }: any) => (
    <span data-variant={variant} data-testid="glow-badge">
      {children}
    </span>
  ),
}));

import { DreamCard } from '../DreamCard';

describe('DreamCard', () => {
  const defaultProps = {
    id: 'dream-123',
    title: 'Learn to Play Piano',
    status: 'active' as const,
    reflectionCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders title', () => {
      render(<DreamCard {...defaultProps} />);
      expect(screen.getByText('Learn to Play Piano')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <DreamCard
          {...defaultProps}
          description="Practice scales daily and learn my favorite songs"
        />
      );
      expect(
        screen.getByText('Practice scales daily and learn my favorite songs')
      ).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<DreamCard {...defaultProps} />);
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });

    it('renders reflection count', () => {
      render(<DreamCard {...defaultProps} reflectionCount={5} />);
      expect(screen.getByText('5 reflections')).toBeInTheDocument();
    });

    it('shows singular reflection text when count is 1', () => {
      render(<DreamCard {...defaultProps} reflectionCount={1} />);
      expect(screen.getByText('1 reflection')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('shows active status badge', () => {
      render(<DreamCard {...defaultProps} status="active" />);
      expect(screen.getByText(/✨ Active/)).toBeInTheDocument();
    });

    it('shows achieved status badge', () => {
      render(<DreamCard {...defaultProps} status="achieved" />);
      expect(screen.getByText(/🎉 Achieved/)).toBeInTheDocument();
    });

    it('shows archived status badge', () => {
      render(<DreamCard {...defaultProps} status="archived" />);
      expect(screen.getByText(/📦 Archived/)).toBeInTheDocument();
    });

    it('shows released status badge', () => {
      render(<DreamCard {...defaultProps} status="released" />);
      expect(screen.getByText(/🕊️ Released/)).toBeInTheDocument();
    });
  });

  describe('category emojis', () => {
    it('shows health category emoji', () => {
      render(<DreamCard {...defaultProps} category="health" />);
      expect(screen.getByText('🏃')).toBeInTheDocument();
    });

    it('shows career category emoji', () => {
      render(<DreamCard {...defaultProps} category="career" />);
      expect(screen.getByText('💼')).toBeInTheDocument();
    });

    it('shows relationships category emoji', () => {
      render(<DreamCard {...defaultProps} category="relationships" />);
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('shows default emoji when no category', () => {
      render(<DreamCard {...defaultProps} />);
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });
  });

  describe('days left display', () => {
    it('shows days left when positive', () => {
      render(<DreamCard {...defaultProps} daysLeft={30} />);
      expect(screen.getByText('30 days left')).toBeInTheDocument();
    });

    it('shows 1 day left singular', () => {
      render(<DreamCard {...defaultProps} daysLeft={1} />);
      expect(screen.getByText('1 day left')).toBeInTheDocument();
    });

    it('does not show days left when 0 (falsy value)', () => {
      // Note: 0 is falsy in JS, so the code treats it as no daysLeft
      render(<DreamCard {...defaultProps} daysLeft={0} />);
      expect(screen.queryByText('Today!')).not.toBeInTheDocument();
    });

    it('shows overdue when negative days', () => {
      render(<DreamCard {...defaultProps} daysLeft={-5} />);
      expect(screen.getByText('5 days overdue')).toBeInTheDocument();
    });

    it('does not show days left when null', () => {
      render(<DreamCard {...defaultProps} daysLeft={null} />);
      expect(screen.queryByText(/days/)).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('shows Reflect button for active status', () => {
      render(<DreamCard {...defaultProps} status="active" />);
      expect(screen.getByText('Reflect')).toBeInTheDocument();
    });

    it('does not show action buttons for non-active status', () => {
      render(<DreamCard {...defaultProps} status="achieved" />);
      expect(screen.queryByText('Reflect')).not.toBeInTheDocument();
    });

    it('shows Evolution button when reflectionCount >= 4', () => {
      render(<DreamCard {...defaultProps} status="active" reflectionCount={4} />);
      expect(screen.getByText('Evolution')).toBeInTheDocument();
    });

    it('shows Visualize button when reflectionCount >= 4', () => {
      render(<DreamCard {...defaultProps} status="active" reflectionCount={4} />);
      expect(screen.getByText('Visualize')).toBeInTheDocument();
    });

    it('does not show Evolution/Visualize when reflectionCount < 4', () => {
      render(<DreamCard {...defaultProps} status="active" reflectionCount={3} />);
      expect(screen.queryByText('Evolution')).not.toBeInTheDocument();
      expect(screen.queryByText('Visualize')).not.toBeInTheDocument();
    });

    it('calls onReflect when Reflect clicked', () => {
      const onReflect = vi.fn();
      render(<DreamCard {...defaultProps} status="active" onReflect={onReflect} />);

      fireEvent.click(screen.getByText('Reflect'));

      expect(onReflect).toHaveBeenCalledTimes(1);
    });

    it('calls onEvolution when Evolution clicked', () => {
      const onEvolution = vi.fn();
      render(
        <DreamCard
          {...defaultProps}
          status="active"
          reflectionCount={5}
          onEvolution={onEvolution}
        />
      );

      fireEvent.click(screen.getByText('Evolution'));

      expect(onEvolution).toHaveBeenCalledTimes(1);
    });

    it('calls onVisualize when Visualize clicked', () => {
      const onVisualize = vi.fn();
      render(
        <DreamCard
          {...defaultProps}
          status="active"
          reflectionCount={5}
          onVisualize={onVisualize}
        />
      );

      fireEvent.click(screen.getByText('Visualize'));

      expect(onVisualize).toHaveBeenCalledTimes(1);
    });

    it('handles missing callback gracefully', () => {
      render(<DreamCard {...defaultProps} status="active" />);

      // Should not throw when clicking without callback
      expect(() => fireEvent.click(screen.getByText('Reflect'))).not.toThrow();
    });
  });

  describe('link', () => {
    it('links to dream detail page', () => {
      render(<DreamCard {...defaultProps} id="dream-456" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dreams/dream-456');
    });
  });

  describe('GlassCard', () => {
    it('renders elevated GlassCard', () => {
      render(<DreamCard {...defaultProps} />);

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-elevated', 'true');
    });

    it('renders interactive GlassCard', () => {
      render(<DreamCard {...defaultProps} />);

      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });
  });
});
