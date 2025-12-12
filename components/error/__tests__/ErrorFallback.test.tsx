// components/error/__tests__/ErrorFallback.test.tsx
// Tests for ErrorFallback component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock GlowButton
vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

import ErrorFallback from '../ErrorFallback';

describe('ErrorFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default rendering', () => {
    it('renders default title', () => {
      render(<ErrorFallback />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Something went wrong');
    });

    it('renders default message', () => {
      render(<ErrorFallback />);
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });

    it('does not render buttons without handlers', () => {
      render(<ErrorFallback />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('custom content', () => {
    it('renders custom title', () => {
      render(<ErrorFallback title="Custom Error Title" />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Custom Error Title');
    });

    it('renders custom message', () => {
      render(<ErrorFallback message="Custom error message" />);
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('renders error digest when provided', () => {
      render(<ErrorFallback errorDigest="abc123" />);
      expect(screen.getByText('Error ID: abc123')).toBeInTheDocument();
    });

    it('does not render error digest when not provided', () => {
      render(<ErrorFallback />);
      expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders Try Again button when onRetry provided', () => {
      render(<ErrorFallback onRetry={() => {}} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('renders Go Home button when onGoHome provided', () => {
      render(<ErrorFallback onGoHome={() => {}} />);
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('calls onRetry when Try Again clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorFallback onRetry={onRetry} />);
      fireEvent.click(screen.getByText('Try Again'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onGoHome when Go Home clicked', () => {
      const onGoHome = vi.fn();
      render(<ErrorFallback onGoHome={onGoHome} />);
      fireEvent.click(screen.getByText('Go Home'));
      expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('renders both buttons when both handlers provided', () => {
      render(<ErrorFallback onRetry={() => {}} onGoHome={() => {}} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('variant styling', () => {
    it('renders default variant by default', () => {
      const { container } = render(<ErrorFallback />);
      expect(container.querySelector('.p-8')).toBeInTheDocument();
    });

    it('renders minimal variant', () => {
      const { container } = render(<ErrorFallback variant="minimal" />);
      expect(container.querySelector('.p-6')).toBeInTheDocument();
    });

    it('hides icon in minimal variant', () => {
      const { container } = render(<ErrorFallback variant="minimal" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows icon in default variant', () => {
      const { container } = render(<ErrorFallback variant="default" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies max-w-lg for full variant', () => {
      const { container } = render(<ErrorFallback variant="full" />);
      expect(container.querySelector('.max-w-lg')).toBeInTheDocument();
    });
  });

  describe('button sizes', () => {
    it('uses md size for default variant', () => {
      render(<ErrorFallback onRetry={() => {}} />);
      expect(screen.getByText('Try Again')).toHaveAttribute('data-size', 'md');
    });

    it('uses sm size for minimal variant', () => {
      render(<ErrorFallback variant="minimal" onRetry={() => {}} />);
      expect(screen.getByText('Try Again')).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('button variants', () => {
    it('uses danger variant for Try Again', () => {
      render(<ErrorFallback onRetry={() => {}} />);
      expect(screen.getByText('Try Again')).toHaveAttribute('data-variant', 'danger');
    });

    it('uses ghost variant for Go Home', () => {
      render(<ErrorFallback onGoHome={() => {}} />);
      expect(screen.getByText('Go Home')).toHaveAttribute('data-variant', 'ghost');
    });
  });
});
