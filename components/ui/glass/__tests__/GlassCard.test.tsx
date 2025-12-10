import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { GlassCard } from '../GlassCard';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('GlassCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GlassCard>Card content</GlassCard>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('renders complex children', () => {
      render(
        <GlassCard>
          <span data-testid="inner">Inner content</span>
          <p>Paragraph content</p>
        </GlassCard>
      );
      expect(screen.getByTestId('inner')).toBeInTheDocument();
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    });

    test('applies base glass styling classes', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('backdrop-blur-crystal');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('rounded-xl');
    });

    test('has gradient background', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-gradient-to-br');
    });

    test('has relative positioning', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('relative');
    });

    test('has default padding', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('p-6');
    });
  });

  describe('elevated state', () => {
    test('applies elevated styling when elevated=true', () => {
      render(<GlassCard elevated>Elevated</GlassCard>);
      const card = screen.getByText('Elevated').closest('div');
      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveClass('border-white/15');
    });

    test('does not apply elevated styling by default', () => {
      render(<GlassCard>Normal</GlassCard>);
      const card = screen.getByText('Normal').closest('div');
      expect(card).not.toHaveClass('shadow-lg');
      expect(card).not.toHaveClass('border-white/15');
    });

    test('applies elevated=false explicitly', () => {
      render(<GlassCard elevated={false}>Not Elevated</GlassCard>);
      const card = screen.getByText('Not Elevated').closest('div');
      expect(card).not.toHaveClass('shadow-lg');
    });

    test('elevated state can be combined with interactive', () => {
      render(
        <GlassCard elevated interactive>
          Combined
        </GlassCard>
      );
      const card = screen.getByRole('button');
      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('interactive state', () => {
    test('sets tabIndex=0 when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    test('sets role="button" when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('applies cursor-pointer when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
    });

    test('does not set role when not interactive', () => {
      render(<GlassCard>Non-interactive</GlassCard>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('does not set tabIndex when not interactive', () => {
      render(<GlassCard>Non-interactive</GlassCard>);
      const card = screen.getByText('Non-interactive').closest('div');
      expect(card).not.toHaveAttribute('tabindex');
    });

    test('applies transition classes when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-250');
    });

    test('applies hover transform class when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('hover:-translate-y-0.5');
    });

    test('applies active scale class when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('active:scale-[0.99]');
    });
  });

  describe('click handler', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(
        <GlassCard interactive onClick={handleClick}>
          Clickable
        </GlassCard>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Enter key press when interactive', () => {
      const handleClick = vi.fn();
      render(
        <GlassCard interactive onClick={handleClick}>
          Keyboard
        </GlassCard>
      );
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Space key press when interactive', () => {
      const handleClick = vi.fn();
      render(
        <GlassCard interactive onClick={handleClick}>
          Keyboard
        </GlassCard>
      );
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick on other keys when interactive', () => {
      const handleClick = vi.fn();
      render(
        <GlassCard interactive onClick={handleClick}>
          Keyboard
        </GlassCard>
      );
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not trigger keyboard handlers when not interactive', () => {
      const handleClick = vi.fn();
      render(<GlassCard onClick={handleClick}>Not interactive</GlassCard>);
      const card = screen.getByText('Not interactive').closest('div');
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles click without onClick handler gracefully', () => {
      render(<GlassCard interactive>No handler</GlassCard>);
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });

    test('onClick works when not interactive (onClick still attached)', () => {
      const handleClick = vi.fn();
      render(<GlassCard onClick={handleClick}>Clickable</GlassCard>);
      const card = screen.getByText('Clickable').closest('div');
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<GlassCard className="custom-class">Custom</GlassCard>);
      const card = screen.getByText('Custom').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<GlassCard className="ml-4">Custom</GlassCard>);
      const card = screen.getByText('Custom').closest('div');
      expect(card).toHaveClass('ml-4');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('backdrop-blur-crystal');
    });

    test('applies inline style prop', () => {
      render(<GlassCard style={{ marginTop: '20px' }}>Styled</GlassCard>);
      const card = screen.getByText('Styled').closest('div');
      expect(card).toHaveStyle({ marginTop: '20px' });
    });

    test('supports data-* attributes', () => {
      render(<GlassCard data-testid="test-card">Data attr</GlassCard>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    test('supports custom data attributes', () => {
      render(<GlassCard data-custom="value">Custom data</GlassCard>);
      const card = screen.getByText('Custom data').closest('div');
      expect(card).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('accessibility', () => {
    test('has focus-visible ring styles when interactive', () => {
      render(<GlassCard interactive>Focusable</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('focus:outline-none');
      expect(card).toHaveClass('focus-visible:ring-2');
      expect(card).toHaveClass('focus-visible:ring-purple-500');
    });

    test('has ring offset when interactive', () => {
      render(<GlassCard interactive>Focusable</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('focus-visible:ring-offset-2');
    });

    test('can receive focus when interactive', () => {
      render(<GlassCard interactive>Focusable</GlassCard>);
      const card = screen.getByRole('button');
      card.focus();
      expect(card).toHaveFocus();
    });

    test('cannot receive focus via tabIndex when not interactive', () => {
      render(<GlassCard>Not focusable</GlassCard>);
      const card = screen.getByText('Not focusable').closest('div');
      expect(card).not.toHaveAttribute('tabindex', '0');
    });
  });

  describe('reduced motion', () => {
    test('renders correctly with reduced motion', async () => {
      const framerMotion = await import('framer-motion');
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

      render(
        <GlassCard interactive onClick={() => {}}>
          Reduced motion
        </GlassCard>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles empty children', () => {
      render(<GlassCard>{''}</GlassCard>);
      const cards = document.querySelectorAll('.backdrop-blur-crystal');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('handles null children', () => {
      render(<GlassCard>{null}</GlassCard>);
      const cards = document.querySelectorAll('.backdrop-blur-crystal');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('handles undefined children', () => {
      render(<GlassCard>{undefined}</GlassCard>);
      const cards = document.querySelectorAll('.backdrop-blur-crystal');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('handles numeric children', () => {
      render(<GlassCard>{42}</GlassCard>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
