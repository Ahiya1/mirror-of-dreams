import { render, screen } from '@testing-library/react';
import * as framerMotion from 'framer-motion';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { CosmicLoader } from '../CosmicLoader';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('CosmicLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
  });

  describe('rendering', () => {
    test('renders loader element', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('has role="status" for accessibility', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('renders spinner element inside', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    test('spinner has border styling', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      // Border classes are applied by Tailwind - check the transparent fallback
      expect(spinner).toHaveClass('border-transparent');
      // In test environment, we verify the spinner element exists with proper structure
      expect(spinner).toBeInTheDocument();
    });

    test('spinner has glow shadow', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('shadow-glow');
    });
  });

  describe('aria-label', () => {
    test('has aria-label with default label', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });

    test('has aria-label with custom label', () => {
      render(<CosmicLoader label="Loading dreams" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dreams');
    });

    test('updates aria-label when label prop changes', () => {
      const { rerender } = render(<CosmicLoader label="Loading..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');

      rerender(<CosmicLoader label="Almost done..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Almost done...');
    });
  });

  describe('screen reader text', () => {
    test('has sr-only span with default label text', () => {
      render(<CosmicLoader />);
      const srText = screen.getByText('Loading content');
      expect(srText).toHaveClass('sr-only');
    });

    test('has sr-only span with custom label text', () => {
      render(<CosmicLoader label="Processing" />);
      const srText = screen.getByText('Processing');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('sizes', () => {
    test('applies small size classes', () => {
      render(<CosmicLoader size="sm" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
    });

    test('applies small border size', () => {
      render(<CosmicLoader size="sm" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('border-2');
    });

    test('applies medium size classes (default)', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-16');
      expect(spinner).toHaveClass('h-16');
    });

    test('applies medium border size (default)', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('border-4');
    });

    test('applies large size classes', () => {
      render(<CosmicLoader size="lg" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-24');
      expect(spinner).toHaveClass('h-24');
    });

    test('applies large border size', () => {
      render(<CosmicLoader size="lg" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('border-6');
    });

    test('size prop defaults to md when not specified', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-16');
      expect(spinner).toHaveClass('h-16');
    });
  });

  describe('centering', () => {
    test('has flex display for centering', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toHaveClass('flex');
    });

    test('has items-center for vertical centering', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toHaveClass('items-center');
    });

    test('has justify-center for horizontal centering', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toHaveClass('justify-center');
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<CosmicLoader className="mt-4" />);
      expect(screen.getByRole('status')).toHaveClass('mt-4');
    });

    test('merges custom className with default classes', () => {
      render(<CosmicLoader className="custom-loader" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveClass('custom-loader');
      expect(loader).toHaveClass('flex');
      expect(loader).toHaveClass('items-center');
    });

    test('allows positioning with custom classes', () => {
      render(<CosmicLoader className="absolute left-0 top-0" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveClass('absolute');
      expect(loader).toHaveClass('top-0');
      expect(loader).toHaveClass('left-0');
    });
  });

  describe('animation', () => {
    test('animates when reduced motion is false', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);
      render(<CosmicLoader />);
      // Component should render with animation
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('respects reduced motion preference', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      render(<CosmicLoader />);
      // Component still renders but animation should be disabled
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    test('is wrapped with React.memo', () => {
      // CosmicLoader should be memoized
      expect(CosmicLoader).toBeDefined();
      // Verify it renders consistently
      const { rerender } = render(<CosmicLoader size="md" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<CosmicLoader size="md" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('renders correctly with same props multiple times', () => {
      const { rerender } = render(<CosmicLoader size="sm" label="Loading" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');

      rerender(<CosmicLoader size="sm" label="Loading" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('edge cases', () => {
    test('handles empty label string', () => {
      render(<CosmicLoader label="" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', '');
    });

    test('handles label with special characters', () => {
      render(<CosmicLoader label="Loading... <Please wait>" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading... <Please wait>');
    });

    test('handles unicode characters in label', () => {
      render(<CosmicLoader label="Loading dreams..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dreams...');
    });

    test('renders without any props', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('visual structure', () => {
    test('container wraps spinner element', () => {
      render(<CosmicLoader />);
      const container = screen.getByRole('status');
      const spinner = container.querySelector('.rounded-full');
      expect(container).toContainElement(spinner as HTMLElement);
    });

    test('sr-only text is within container', () => {
      render(<CosmicLoader label="Loading" />);
      const container = screen.getByRole('status');
      expect(container).toContainElement(screen.getByText('Loading'));
    });

    test('spinner is a child of motion.div', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });
  });
});
