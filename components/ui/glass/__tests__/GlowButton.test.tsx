import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GlowButton } from '../GlowButton';

import { haptic } from '@/lib/utils/haptics';

describe('GlowButton', () => {
  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GlowButton>Click me</GlowButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    test('renders as a button element', () => {
      render(<GlowButton>Test</GlowButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('renders complex children', () => {
      render(
        <GlowButton>
          <span data-testid="inner">Inner content</span>
        </GlowButton>
      );
      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('applies primary variant by default', () => {
      render(<GlowButton>Primary</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
      expect(button).toHaveClass('text-white');
    });

    test('applies secondary variant', () => {
      render(<GlowButton variant="secondary">Secondary</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-purple-600');
    });

    test('applies ghost variant', () => {
      render(<GlowButton variant="ghost">Ghost</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-gray-300');
    });

    test('applies cosmic variant', () => {
      render(<GlowButton variant="cosmic">Cosmic</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('backdrop-blur-md');
    });

    test('applies warm variant', () => {
      render(<GlowButton variant="warm">Warm</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('text-amber-100');
    });

    test('applies success variant', () => {
      render(<GlowButton variant="success">Success</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-mirror-success');
      expect(button).toHaveClass('text-white');
    });

    test('applies danger variant', () => {
      render(<GlowButton variant="danger">Danger</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-mirror-error');
      expect(button).toHaveClass('text-white');
    });

    test('applies info variant', () => {
      render(<GlowButton variant="info">Info</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-mirror-info');
      expect(button).toHaveClass('text-white');
    });
  });

  describe('sizes', () => {
    test('applies medium size by default', () => {
      render(<GlowButton>Medium</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3');
      expect(button).toHaveClass('text-base');
      expect(button).toHaveClass('min-h-[48px]');
    });

    test('applies small size', () => {
      render(<GlowButton size="sm">Small</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('min-h-[44px]');
    });

    test('applies large size', () => {
      render(<GlowButton size="lg">Large</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-4');
      expect(button).toHaveClass('text-lg');
      expect(button).toHaveClass('min-h-[52px]');
    });
  });

  describe('button type', () => {
    test('has button type by default', () => {
      render(<GlowButton>Default</GlowButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    test('can be set to submit type', () => {
      render(<GlowButton type="submit">Submit</GlowButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    test('can be set to reset type', () => {
      render(<GlowButton type="reset">Reset</GlowButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('interactions', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick}>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('triggers haptic feedback on click', () => {
      render(<GlowButton onClick={() => {}}>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(haptic).toHaveBeenCalledWith('light');
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <GlowButton onClick={handleClick} disabled>
          Click
        </GlowButton>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not trigger haptic when disabled', () => {
      vi.clearAllMocks();
      render(
        <GlowButton onClick={() => {}} disabled>
          Click
        </GlowButton>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(haptic).not.toHaveBeenCalled();
    });

    test('handles click without onClick handler', () => {
      render(<GlowButton>No handler</GlowButton>);
      // Should not throw
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('disabled state', () => {
    test('is not disabled by default', () => {
      render(<GlowButton>Enabled</GlowButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    test('is disabled when disabled prop is true', () => {
      render(<GlowButton disabled>Disabled</GlowButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('applies disabled styling', () => {
      render(<GlowButton disabled>Disabled</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('accessibility', () => {
    test('has focus-visible ring styles', () => {
      render(<GlowButton>Focusable</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-purple-500');
    });

    test('meets minimum touch target size', () => {
      render(<GlowButton size="sm">Small</GlowButton>);
      const button = screen.getByRole('button');
      // Smallest size should still meet WCAG AA (44px)
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<GlowButton className="custom-class">Custom</GlowButton>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<GlowButton className="ml-4">Custom</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('ml-4');
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('font-medium');
    });
  });

  describe('styling', () => {
    test('has rounded-lg class', () => {
      render(<GlowButton>Rounded</GlowButton>);
      expect(screen.getByRole('button')).toHaveClass('rounded-lg');
    });

    test('has font-medium class', () => {
      render(<GlowButton>Font</GlowButton>);
      expect(screen.getByRole('button')).toHaveClass('font-medium');
    });

    test('has transition classes', () => {
      render(<GlowButton>Transition</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });

    test('has relative positioning', () => {
      render(<GlowButton>Relative</GlowButton>);
      expect(screen.getByRole('button')).toHaveClass('relative');
    });
  });
});
