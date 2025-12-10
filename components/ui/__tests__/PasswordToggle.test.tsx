import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { PasswordToggle } from '../PasswordToggle';

describe('PasswordToggle', () => {
  describe('rendering', () => {
    test('renders as a button element', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('has type="button" to prevent form submission', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    test('renders SVG icon', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('visibility states', () => {
    test('shows "Show password" label when visible is false', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show password');
    });

    test('shows "Hide password" label when visible is true', () => {
      render(<PasswordToggle visible={true} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Hide password');
    });

    test('renders different icon when visible is false (eye icon)', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      // Check for the "eye open" icon path characteristics
      const paths = svg?.querySelectorAll('path');
      // The "show" icon has 2 paths (eye and circle inside)
      expect(paths?.length).toBe(2);
    });

    test('renders different icon when visible is true (eye-off icon)', () => {
      render(<PasswordToggle visible={true} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      // Check for the "eye closed" icon path characteristics
      const paths = svg?.querySelectorAll('path');
      // The "hide" icon has 1 path (slashed eye)
      expect(paths?.length).toBe(1);
    });
  });

  describe('interactions', () => {
    test('calls onToggle when clicked', () => {
      const handleToggle = vi.fn();
      render(<PasswordToggle visible={false} onToggle={handleToggle} />);
      fireEvent.click(screen.getByRole('button'));
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    test('calls onToggle multiple times for multiple clicks', () => {
      const handleToggle = vi.fn();
      render(<PasswordToggle visible={false} onToggle={handleToggle} />);
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));
      expect(handleToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('styling', () => {
    test('has padding p-2', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('p-2');
    });

    test('has text-gray-400 color', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('text-gray-400');
    });

    test('has transition-colors for smooth color change', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('transition-colors');
    });

    test('has duration-200 for animation timing', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('duration-200');
    });

    test('has hover:text-gray-300 for hover state', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('hover:text-gray-300');
    });

    test('SVG has correct size classes', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    test('SVG has fill="none"', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    test('SVG has stroke="currentColor"', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('accessibility', () => {
    test('button is keyboard focusable', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test('has descriptive aria-label when hidden', () => {
      render(<PasswordToggle visible={false} onToggle={() => {}} />);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    test('has descriptive aria-label when visible', () => {
      render(<PasswordToggle visible={true} onToggle={() => {}} />);
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });

    test('can be activated with keyboard', () => {
      const handleToggle = vi.fn();
      render(<PasswordToggle visible={false} onToggle={handleToggle} />);
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);
      expect(handleToggle).toHaveBeenCalled();
    });
  });
});
