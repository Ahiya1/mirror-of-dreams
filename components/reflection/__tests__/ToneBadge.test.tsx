import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ToneBadge } from '../ToneBadge';

describe('ToneBadge', () => {
  describe('rendering', () => {
    test('renders tone text', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toBeInTheDocument();
    });

    test('renders with capitalize class for proper formatting', () => {
      render(<ToneBadge tone="fusion" />);
      expect(screen.getByText('fusion')).toHaveClass('capitalize');
    });

    test('renders as a span element', () => {
      render(<ToneBadge tone="intense" />);
      const badge = screen.getByText('intense');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('tone colors', () => {
    test('applies gentle (purple) colors', () => {
      render(<ToneBadge tone="gentle" />);
      const badge = screen.getByText('gentle');
      expect(badge).toHaveClass('bg-purple-500/20');
      expect(badge).toHaveClass('text-purple-300');
      expect(badge).toHaveClass('border-purple-500/30');
    });

    test('applies fusion (amber) colors', () => {
      render(<ToneBadge tone="fusion" />);
      const badge = screen.getByText('fusion');
      expect(badge).toHaveClass('bg-amber-500/20');
      expect(badge).toHaveClass('text-amber-300');
      expect(badge).toHaveClass('border-amber-500/30');
    });

    test('applies intense (red) colors', () => {
      render(<ToneBadge tone="intense" />);
      const badge = screen.getByText('intense');
      expect(badge).toHaveClass('bg-red-500/20');
      expect(badge).toHaveClass('text-red-300');
      expect(badge).toHaveClass('border-red-500/30');
    });

    test('falls back to gentle colors for unknown tone', () => {
      render(<ToneBadge tone="unknown" />);
      const badge = screen.getByText('unknown');
      expect(badge).toHaveClass('bg-purple-500/20');
      expect(badge).toHaveClass('text-purple-300');
    });
  });

  describe('glow effect', () => {
    test('shows glow by default', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('shadow-lg');
      expect(screen.getByText('gentle')).toHaveClass('shadow-purple-500/30');
    });

    test('shows correct glow color for fusion tone', () => {
      render(<ToneBadge tone="fusion" />);
      expect(screen.getByText('fusion')).toHaveClass('shadow-amber-500/30');
    });

    test('shows correct glow color for intense tone', () => {
      render(<ToneBadge tone="intense" />);
      expect(screen.getByText('intense')).toHaveClass('shadow-red-500/30');
    });

    test('hides glow when showGlow is false', () => {
      render(<ToneBadge tone="gentle" showGlow={false} />);
      expect(screen.getByText('gentle')).not.toHaveClass('shadow-lg');
    });
  });

  describe('styling', () => {
    test('applies rounded-full class', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('rounded-full');
    });

    test('applies border class', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('border');
    });

    test('applies padding classes', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('px-3', 'py-1');
    });

    test('applies font classes', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<ToneBadge tone="gentle" className="custom-class" />);
      expect(screen.getByText('gentle')).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<ToneBadge tone="gentle" className="mt-4" />);
      const badge = screen.getByText('gentle');
      expect(badge).toHaveClass('mt-4');
      expect(badge).toHaveClass('rounded-full');
    });
  });
});
