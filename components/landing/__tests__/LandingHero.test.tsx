// components/landing/__tests__/LandingHero.test.tsx
// Tests for LandingHero component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

const mockMutateAsync = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      loginDemo: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, variant, size, disabled }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} disabled={disabled}>
      {children}
    </button>
  ),
}));

import LandingHero from '../LandingHero';

describe('LandingHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('rendering', () => {
    it('renders headline', () => {
      render(<LandingHero />);
      expect(screen.getByText('Your dreams know things')).toBeInTheDocument();
    });

    it('renders subheadline', () => {
      render(<LandingHero />);
      expect(
        screen.getByText(/A companion for listening to what your inner life/)
      ).toBeInTheDocument();
    });

    it('renders Try It button', () => {
      render(<LandingHero />);
      expect(screen.getByText('Try It')).toBeInTheDocument();
    });

    it('renders Begin button', () => {
      render(<LandingHero />);
      expect(screen.getByText('Begin')).toBeInTheDocument();
    });
  });

  describe('Try It button', () => {
    it('has warm variant', () => {
      render(<LandingHero />);
      const button = screen.getByText('Try It');
      expect(button).toHaveAttribute('data-variant', 'warm');
    });

    it('has lg size', () => {
      render(<LandingHero />);
      const button = screen.getByText('Try It');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('calls loginDemo mutation when clicked', async () => {
      render(<LandingHero />);

      fireEvent.click(screen.getByText('Try It'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('redirects to dashboard after successful login', async () => {
      mockMutateAsync.mockResolvedValue({});
      render(<LandingHero />);

      fireEvent.click(screen.getByText('Try It'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Begin button', () => {
    it('has cosmic variant', () => {
      render(<LandingHero />);
      const button = screen.getByText('Begin');
      expect(button).toHaveAttribute('data-variant', 'cosmic');
    });

    it('navigates to signup when clicked', () => {
      render(<LandingHero />);

      fireEvent.click(screen.getByText('Begin'));

      expect(mockPush).toHaveBeenCalledWith('/auth/signup');
    });
  });

  describe('responsive layout', () => {
    it('has max width constraint', () => {
      const { container } = render(<LandingHero />);
      expect(container.firstChild).toHaveClass('max-w-4xl');
    });

    it('has centered text', () => {
      const { container } = render(<LandingHero />);
      expect(container.firstChild).toHaveClass('text-center');
    });
  });

  describe('styling', () => {
    it('applies gradient to headline', () => {
      render(<LandingHero />);
      const headline = screen.getByText('Your dreams know things');
      expect(headline).toHaveClass('bg-clip-text');
      expect(headline).toHaveClass('text-transparent');
    });
  });
});
