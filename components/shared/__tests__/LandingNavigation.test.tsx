// components/shared/__tests__/LandingNavigation.test.tsx
// Tests for LandingNavigation component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../NavigationBase', () => ({
  default: ({ children, transparent, homeHref }: any) => (
    <nav data-transparent={transparent} data-home-href={homeHref}>
      {children}
    </nav>
  ),
}));

vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

import LandingNavigation from '../LandingNavigation';

describe('LandingNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders navigation', () => {
      render(<LandingNavigation />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders Sign In button', () => {
      render(<LandingNavigation />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('sign in button', () => {
    it('navigates to signin page on click', () => {
      render(<LandingNavigation />);
      fireEvent.click(screen.getByText('Sign In'));
      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('uses secondary variant', () => {
      render(<LandingNavigation />);
      expect(screen.getByText('Sign In')).toHaveAttribute('data-variant', 'secondary');
    });

    it('uses sm size', () => {
      render(<LandingNavigation />);
      expect(screen.getByText('Sign In')).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('transparent prop', () => {
    it('defaults to false', () => {
      render(<LandingNavigation />);
      expect(screen.getByRole('navigation')).toHaveAttribute('data-transparent', 'false');
    });

    it('passes transparent prop to NavigationBase', () => {
      render(<LandingNavigation transparent />);
      expect(screen.getByRole('navigation')).toHaveAttribute('data-transparent', 'true');
    });
  });

  describe('home link', () => {
    it('sets home href to root', () => {
      render(<LandingNavigation />);
      expect(screen.getByRole('navigation')).toHaveAttribute('data-home-href', '/');
    });
  });
});
