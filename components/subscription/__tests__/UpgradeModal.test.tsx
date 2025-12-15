// components/subscription/__tests__/UpgradeModal.test.tsx
// Tests for UpgradeModal component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
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

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { UpgradeModal } from '../UpgradeModal';

describe('UpgradeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    reason: 'monthly_limit' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByTestId('glass-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<UpgradeModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('glass-modal')).not.toBeInTheDocument();
    });
  });

  describe('monthly_limit reason', () => {
    it('shows correct title for monthly limit', () => {
      render(<UpgradeModal {...defaultProps} reason="monthly_limit" />);
      expect(screen.getByText("You've Filled This Month's Space")).toBeInTheDocument();
    });

    it('shows correct message for monthly limit', () => {
      render(<UpgradeModal {...defaultProps} reason="monthly_limit" />);
      expect(screen.getByText(/Your reflections are held safe/)).toBeInTheDocument();
    });
  });

  describe('daily_limit reason', () => {
    it('shows correct title for daily limit', () => {
      render(<UpgradeModal {...defaultProps} reason="daily_limit" />);
      expect(screen.getByText('Rest Until Tomorrow')).toBeInTheDocument();
    });

    it('shows generic message when no resetTime provided', () => {
      render(<UpgradeModal {...defaultProps} reason="daily_limit" />);
      expect(
        screen.getByText(/You've reflected deeply today\. Return tomorrow/)
      ).toBeInTheDocument();
    });

    it('shows time-specific message when resetTime provided', () => {
      const resetTime = new Date('2024-01-15T14:30:00');
      render(<UpgradeModal {...defaultProps} reason="daily_limit" resetTime={resetTime} />);
      expect(screen.getByText(/Return after/)).toBeInTheDocument();
    });
  });

  describe('feature_locked reason', () => {
    it('shows correct title for feature locked', () => {
      render(<UpgradeModal {...defaultProps} reason="feature_locked" />);
      expect(screen.getByText("When You're Ready for More")).toBeInTheDocument();
    });

    it('shows custom feature name in title when provided', () => {
      render(
        <UpgradeModal {...defaultProps} reason="feature_locked" featureName="Voice Reflection" />
      );
      expect(screen.getByText("When You're Ready for Voice Reflection")).toBeInTheDocument();
    });

    it('shows custom feature name in message when provided', () => {
      render(
        <UpgradeModal {...defaultProps} reason="feature_locked" featureName="Voice Reflection" />
      );
      expect(screen.getByText(/Voice Reflection awaits you/)).toBeInTheDocument();
    });
  });

  describe('dream_limit reason', () => {
    it('shows correct title for dream limit', () => {
      render(<UpgradeModal {...defaultProps} reason="dream_limit" />);
      expect(screen.getByText('Your Dreams Are Full')).toBeInTheDocument();
    });

    it('shows correct message for dream limit', () => {
      render(<UpgradeModal {...defaultProps} reason="dream_limit" />);
      expect(screen.getByText(/You're holding the maximum number of dreams/)).toBeInTheDocument();
    });
  });

  describe('tier comparison cards', () => {
    it('shows Seeker tier card', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('Seeker')).toBeInTheDocument();
      expect(screen.getByText('$19')).toBeInTheDocument();
    });

    it('shows Devoted tier card', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('Devoted')).toBeInTheDocument();
      expect(screen.getByText('$39')).toBeInTheDocument();
    });

    it('shows Seeker features', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('• 30 reflections/month')).toBeInTheDocument();
      expect(screen.getByText('• Hold 5 dreams at once')).toBeInTheDocument();
    });

    it('shows Devoted features', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('• 60 reflections/month')).toBeInTheDocument();
      expect(screen.getByText('• Hold unlimited dreams')).toBeInTheDocument();
    });
  });

  describe('tier-specific UI', () => {
    it('shows Become Seeker button when currentTier is free', () => {
      render(<UpgradeModal {...defaultProps} currentTier="free" />);
      expect(screen.getByText('Become Seeker')).toBeInTheDocument();
    });

    it('always shows Become Devoted button', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('Become Devoted')).toBeInTheDocument();
    });

    it('hides Become Seeker button when not free tier', () => {
      render(<UpgradeModal {...defaultProps} currentTier="seeker" />);
      expect(screen.queryByText('Become Seeker')).not.toBeInTheDocument();
    });
  });

  describe('pricing links', () => {
    it('has pricing link for Seeker tier', () => {
      render(<UpgradeModal {...defaultProps} currentTier="free" />);
      const seekerLink = screen.getByText('Become Seeker').closest('a');
      expect(seekerLink).toHaveAttribute('href', '/pricing');
    });

    it('has pricing link for Devoted tier', () => {
      render(<UpgradeModal {...defaultProps} />);
      const devotedLink = screen.getByText('Become Devoted').closest('a');
      expect(devotedLink).toHaveAttribute('href', '/pricing');
    });

    it('has view pricing comparison link', () => {
      render(<UpgradeModal {...defaultProps} />);
      const comparisonLink = screen.getByText('View full pricing comparison');
      expect(comparisonLink.closest('a')).toHaveAttribute('href', '/pricing');
    });
  });

  describe('annual pricing note', () => {
    it('shows annual savings note', () => {
      render(<UpgradeModal {...defaultProps} />);
      expect(screen.getByText('Save 17% with annual billing')).toBeInTheDocument();
    });
  });

  describe('onClose behavior', () => {
    it('calls onClose when clicking Become Seeker button', () => {
      const onClose = vi.fn();
      render(<UpgradeModal {...defaultProps} onClose={onClose} currentTier="free" />);
      fireEvent.click(screen.getByText('Become Seeker'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking Become Devoted button', () => {
      const onClose = vi.fn();
      render(<UpgradeModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Become Devoted'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking pricing comparison link', () => {
      const onClose = vi.fn();
      render(<UpgradeModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('View full pricing comparison'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('default props', () => {
    it('defaults currentTier to free', () => {
      render(<UpgradeModal isOpen={true} onClose={vi.fn()} reason="monthly_limit" />);
      // When currentTier is free, Become Seeker button should be visible
      expect(screen.getByText('Become Seeker')).toBeInTheDocument();
    });
  });

  describe('default reason handling', () => {
    it('shows generic content for unknown reason', () => {
      render(
        <UpgradeModal
          {...defaultProps}
          // @ts-expect-error Testing unknown reason
          reason="unknown_reason"
        />
      );
      expect(screen.getByText('Expand Your Space')).toBeInTheDocument();
    });
  });
});
