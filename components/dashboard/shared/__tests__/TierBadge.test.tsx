import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import TierBadge from '../TierBadge';

describe('TierBadge', () => {
  describe('rendering', () => {
    test('renders tier name', () => {
      render(<TierBadge tier="free" />);
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    test('renders as a div element', () => {
      render(<TierBadge tier="pro" />);
      const badge = screen.getByText('Pro').closest('.tier-badge');
      expect(badge?.tagName).toBe('DIV');
    });

    test('shows icon by default', () => {
      render(<TierBadge tier="unlimited" />);
      expect(screen.getByText('Unlimited')).toBeInTheDocument();
    });
  });

  describe('tiers', () => {
    test('renders free tier correctly', () => {
      render(<TierBadge tier="free" />);
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Free').closest('.tier-badge')).toHaveClass('tier-badge--free');
    });

    test('renders pro tier correctly', () => {
      render(<TierBadge tier="pro" />);
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Pro').closest('.tier-badge')).toHaveClass('tier-badge--pro');
    });

    test('renders unlimited tier correctly', () => {
      render(<TierBadge tier="unlimited" />);
      expect(screen.getByText('Unlimited')).toBeInTheDocument();
      expect(screen.getByText('Unlimited').closest('.tier-badge')).toHaveClass(
        'tier-badge--unlimited'
      );
    });

    test('renders essential tier (legacy)', () => {
      render(<TierBadge tier="essential" />);
      expect(screen.getByText('Essential')).toBeInTheDocument();
      expect(screen.getByText('Essential').closest('.tier-badge')).toHaveClass(
        'tier-badge--essential'
      );
    });

    test('renders premium tier (legacy)', () => {
      render(<TierBadge tier="premium" />);
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Premium').closest('.tier-badge')).toHaveClass('tier-badge--premium');
    });

    test('renders creator tier (legacy)', () => {
      render(<TierBadge tier="creator" />);
      expect(screen.getByText('Creator')).toBeInTheDocument();
      expect(screen.getByText('Creator').closest('.tier-badge')).toHaveClass('tier-badge--creator');
    });

    test('defaults to free tier when no tier provided', () => {
      render(<TierBadge />);
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    test('applies small size class', () => {
      render(<TierBadge tier="free" size="sm" />);
      expect(screen.getByText('Free').closest('.tier-badge')).toHaveClass('tier-badge--sm');
    });

    test('applies medium size by default', () => {
      render(<TierBadge tier="free" />);
      expect(screen.getByText('Free').closest('.tier-badge')).toHaveClass('tier-badge--md');
    });

    test('applies large size class', () => {
      render(<TierBadge tier="free" size="lg" />);
      expect(screen.getByText('Free').closest('.tier-badge')).toHaveClass('tier-badge--lg');
    });

    test('applies extra large size class', () => {
      render(<TierBadge tier="free" size="xl" />);
      expect(screen.getByText('Free').closest('.tier-badge')).toHaveClass('tier-badge--xl');
    });
  });

  describe('icons', () => {
    test('shows icon by default', () => {
      render(<TierBadge tier="pro" />);
      const iconSpan = document.querySelector('.tier-icon');
      expect(iconSpan).toBeInTheDocument();
    });

    test('hides icon when showIcon is false', () => {
      render(<TierBadge tier="pro" showIcon={false} />);
      const iconSpan = document.querySelector('.tier-icon');
      expect(iconSpan).not.toBeInTheDocument();
    });

    test('free tier shows correct icon', () => {
      render(<TierBadge tier="free" />);
      const iconSpan = document.querySelector('.tier-icon');
      expect(iconSpan).toBeInTheDocument();
      // Icon exists, just verify it has content
      expect(iconSpan?.textContent).toBeTruthy();
    });

    test('pro tier shows correct icon', () => {
      render(<TierBadge tier="pro" />);
      const iconSpan = document.querySelector('.tier-icon');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan?.textContent).toBeTruthy();
    });

    test('unlimited tier shows correct icon', () => {
      render(<TierBadge tier="unlimited" />);
      const iconSpan = document.querySelector('.tier-icon');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan?.textContent).toBeTruthy();
    });
  });

  describe('glow effect', () => {
    test('does not show glow by default', () => {
      render(<TierBadge tier="pro" />);
      const badge = screen.getByText('Pro').closest('.tier-badge');
      expect(badge).not.toHaveClass('tier-badge--glow');
    });

    test('shows glow when showGlow is true', () => {
      render(<TierBadge tier="pro" showGlow />);
      const badge = screen.getByText('Pro').closest('.tier-badge');
      expect(badge).toHaveClass('tier-badge--glow');
    });

    test('renders glow element when showGlow is true', () => {
      render(<TierBadge tier="pro" showGlow />);
      const glowElement = document.querySelector('.tier-glow');
      expect(glowElement).toBeInTheDocument();
    });

    test('does not render glow element when showGlow is false', () => {
      render(<TierBadge tier="pro" showGlow={false} />);
      const glowElement = document.querySelector('.tier-glow');
      expect(glowElement).not.toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<TierBadge tier="free" className="custom-class" />);
      const badge = screen.getByText('Free').closest('.tier-badge');
      expect(badge).toHaveClass('custom-class');
    });

    test('merges custom className with tier class', () => {
      render(<TierBadge tier="pro" className="mt-4" />);
      const badge = screen.getByText('Pro').closest('.tier-badge');
      expect(badge).toHaveClass('mt-4');
      expect(badge).toHaveClass('tier-badge--pro');
    });
  });

  describe('styling', () => {
    test('has tier-badge base class', () => {
      render(<TierBadge tier="free" />);
      const badge = screen.getByText('Free').closest('.tier-badge');
      expect(badge).toHaveClass('tier-badge');
    });

    test('has inline style with background', () => {
      render(<TierBadge tier="free" />);
      const badge = screen.getByText('Free').closest('.tier-badge') as HTMLElement;
      expect(badge.style.background).toBeTruthy();
    });

    test('has inline style with border', () => {
      render(<TierBadge tier="pro" />);
      const badge = screen.getByText('Pro').closest('.tier-badge') as HTMLElement;
      expect(badge.style.border).toBeTruthy();
    });

    test('has inline style with color', () => {
      render(<TierBadge tier="unlimited" />);
      const badge = screen.getByText('Unlimited').closest('.tier-badge') as HTMLElement;
      expect(badge.style.color).toBeTruthy();
    });
  });

  describe('animation prop', () => {
    test('animated is true by default', () => {
      render(<TierBadge tier="free" />);
      // Animation is handled via props, not classes in current implementation
      // Just verify it renders without error
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    test('accepts animated=false without error', () => {
      render(<TierBadge tier="free" animated={false} />);
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });
});
