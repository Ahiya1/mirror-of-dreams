import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { GlowBadge } from '../GlowBadge';

describe('GlowBadge', () => {
  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GlowBadge>Status</GlowBadge>);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('renders as a span element', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      const element = screen.getByText('Badge');
      expect(element.tagName).toBe('SPAN');
    });

    test('renders complex children', () => {
      render(
        <GlowBadge>
          <span data-testid="icon">*</span> Active
        </GlowBadge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText(/Active/)).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('applies info variant by default', () => {
      render(<GlowBadge>Info</GlowBadge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-mirror-info/20');
      expect(badge).toHaveClass('text-mirror-info');
      expect(badge).toHaveClass('border-mirror-info/30');
    });

    test('applies success variant', () => {
      render(<GlowBadge variant="success">Success</GlowBadge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-mirror-success/20');
      expect(badge).toHaveClass('text-mirror-success');
      expect(badge).toHaveClass('border-mirror-success/30');
    });

    test('applies warning variant', () => {
      render(<GlowBadge variant="warning">Warning</GlowBadge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-mirror-warning/20');
      expect(badge).toHaveClass('text-mirror-warning');
      expect(badge).toHaveClass('border-mirror-warning/30');
    });

    test('applies error variant', () => {
      render(<GlowBadge variant="error">Error</GlowBadge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-mirror-error/20');
      expect(badge).toHaveClass('text-mirror-error');
      expect(badge).toHaveClass('border-mirror-error/30');
    });
  });

  describe('styling', () => {
    test('has inline-flex display', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('inline-flex');
    });

    test('has items-center alignment', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('items-center');
    });

    test('has proper padding', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
    });

    test('has text-xs font size', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('text-xs');
    });

    test('has font-medium weight', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('font-medium');
    });

    test('has rounded-full shape', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('rounded-full');
    });

    test('has border-2 width', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('border-2');
    });

    test('has backdrop-blur-sm', () => {
      render(<GlowBadge>Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('backdrop-blur-sm');
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<GlowBadge className="custom-class">Badge</GlowBadge>);
      expect(screen.getByText('Badge')).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<GlowBadge className="ml-2">Badge</GlowBadge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('ml-2');
      expect(badge).toHaveClass('rounded-full');
    });

    test('preserves variant classes when custom className is applied', () => {
      render(
        <GlowBadge variant="success" className="uppercase">
          Badge
        </GlowBadge>
      );
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('uppercase');
      expect(badge).toHaveClass('bg-mirror-success/20');
    });
  });

  describe('edge cases', () => {
    test('handles empty children', () => {
      render(<GlowBadge>{''}</GlowBadge>);
      // Should render without crashing
      const badge = document.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
    });

    test('handles number children', () => {
      render(<GlowBadge>99</GlowBadge>);
      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });
});
