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

vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
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

    it('renders desktop Sign In button', () => {
      render(<LandingNavigation />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('renders mobile menu button', () => {
      render(<LandingNavigation />);
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });
  });

  describe('desktop sign in', () => {
    it('navigates to signin page', () => {
      render(<LandingNavigation />);
      // Find the desktop Sign In button (first one)
      const buttons = screen.getAllByText('Sign In');
      fireEvent.click(buttons[0]);
      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('uses secondary variant', () => {
      render(<LandingNavigation />);
      const buttons = screen.getAllByText('Sign In');
      expect(buttons[0]).toHaveAttribute('data-variant', 'secondary');
    });

    it('uses sm size', () => {
      render(<LandingNavigation />);
      const buttons = screen.getAllByText('Sign In');
      expect(buttons[0]).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('mobile menu', () => {
    it('toggles mobile menu on button click', () => {
      render(<LandingNavigation />);
      const toggleButton = screen.getByLabelText('Toggle menu');

      // Initially menu is closed, click to open
      fireEvent.click(toggleButton);

      // Mobile menu should now be visible (two Sign In elements)
      expect(screen.getAllByText('Sign In')).toHaveLength(2);
    });

    it('closes menu on second click', () => {
      render(<LandingNavigation />);
      const toggleButton = screen.getByLabelText('Toggle menu');

      // Open menu
      fireEvent.click(toggleButton);
      expect(screen.getAllByText('Sign In')).toHaveLength(2);

      // Close menu
      fireEvent.click(toggleButton);
      expect(screen.getAllByText('Sign In')).toHaveLength(1);
    });

    it('mobile menu links to signin', () => {
      render(<LandingNavigation />);
      fireEvent.click(screen.getByLabelText('Toggle menu'));

      const mobileLink = screen.getByRole('link', { name: 'Sign In' });
      expect(mobileLink).toHaveAttribute('href', '/auth/signin');
    });

    it('closes menu when mobile link clicked', () => {
      render(<LandingNavigation />);
      fireEvent.click(screen.getByLabelText('Toggle menu'));

      const mobileLink = screen.getByRole('link', { name: 'Sign In' });
      fireEvent.click(mobileLink);

      // Menu should close
      expect(screen.getAllByText('Sign In')).toHaveLength(1);
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
