// components/shared/__tests__/MobileNavigationMenu.test.tsx
// Tests for MobileNavigationMenu component

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => {
  const MotionNav = React.forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement> & { id?: string; role?: string; 'aria-label'?: string }
  >(({ children, className, id, role, ...props }, ref) => (
    <nav ref={ref as React.Ref<HTMLElement>} className={className} id={id} role={role} {...props}>
      {children}
    </nav>
  ));
  MotionNav.displayName = 'MotionNav';

  return {
    motion: {
      nav: MotionNav,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { MobileNavigationMenu } from '../MobileNavigationMenu';

// =============================================================================
// Test Helpers
// =============================================================================

const defaultProps = {
  user: {
    tier: 'free' as const,
    isCreator: false,
    isAdmin: false,
  },
  currentPage: 'dashboard',
  isOpen: true,
  onClose: vi.fn(),
};

// =============================================================================
// Test Suite
// =============================================================================

describe('MobileNavigationMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('navigation links rendering', () => {
    it('renders Journey (dashboard) link', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      const link = screen.getByRole('link', { name: /journey/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders Dreams link', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      const link = screen.getByRole('link', { name: /dreams/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dreams');
    });

    it('renders Reflect link', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      const link = screen.getByRole('link', { name: /reflect/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/reflection');
    });

    it('renders Evolution link', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      const link = screen.getByRole('link', { name: /evolution/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/evolution');
    });

    it('renders Visualizations link', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      const link = screen.getByRole('link', { name: /visualizations/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/visualizations');
    });
  });

  describe('active link styling', () => {
    it('applies active styling to dashboard when currentPage is dashboard', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /journey/i });
      expect(link.className).toContain('bg-white/12');
      expect(link.className).toContain('font-medium');
    });

    it('applies inactive styling to dreams when currentPage is dashboard', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /dreams/i });
      expect(link.className).toContain('bg-white/4');
      expect(link.className).toContain('text-white/70');
    });

    it('applies active styling to dreams when currentPage is dreams', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="dreams" />);

      const link = screen.getByRole('link', { name: /dreams/i });
      expect(link.className).toContain('bg-white/12');
      expect(link.className).toContain('font-medium');
    });

    it('applies active styling to reflection when currentPage is reflection', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="reflection" />);

      const link = screen.getByRole('link', { name: /reflect/i });
      expect(link.className).toContain('bg-white/12');
    });

    it('applies active styling to evolution when currentPage is evolution', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="evolution" />);

      const link = screen.getByRole('link', { name: /evolution/i });
      expect(link.className).toContain('bg-white/12');
    });

    it('applies active styling to visualizations when currentPage is visualizations', () => {
      render(<MobileNavigationMenu {...defaultProps} currentPage="visualizations" />);

      const link = screen.getByRole('link', { name: /visualizations/i });
      expect(link.className).toContain('bg-white/12');
    });
  });

  describe('Clarify link visibility', () => {
    it('hides Clarify link for free tier users', () => {
      render(
        <MobileNavigationMenu {...defaultProps} user={{ ...defaultProps.user, tier: 'free' }} />
      );

      expect(screen.queryByRole('link', { name: /clarify/i })).not.toBeInTheDocument();
    });

    it('shows Clarify link for pro tier users', () => {
      render(
        <MobileNavigationMenu {...defaultProps} user={{ ...defaultProps.user, tier: 'pro' }} />
      );

      const link = screen.getByRole('link', { name: /clarify/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/clarify');
    });

    it('shows Clarify link for unlimited tier users', () => {
      render(
        <MobileNavigationMenu
          {...defaultProps}
          user={{ ...defaultProps.user, tier: 'unlimited' }}
        />
      );

      const link = screen.getByRole('link', { name: /clarify/i });
      expect(link).toBeInTheDocument();
    });

    it('applies active styling to clarify when currentPage is clarify', () => {
      render(
        <MobileNavigationMenu
          {...defaultProps}
          user={{ ...defaultProps.user, tier: 'pro' }}
          currentPage="clarify"
        />
      );

      const link = screen.getByRole('link', { name: /clarify/i });
      expect(link.className).toContain('bg-white/12');
    });
  });

  describe('Admin link visibility', () => {
    it('hides Admin link for non-admin users', () => {
      render(
        <MobileNavigationMenu
          {...defaultProps}
          user={{ ...defaultProps.user, isAdmin: false, isCreator: false }}
        />
      );

      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('shows Admin link for admin users', () => {
      render(
        <MobileNavigationMenu {...defaultProps} user={{ ...defaultProps.user, isAdmin: true }} />
      );

      const link = screen.getByRole('link', { name: /admin/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/admin');
    });

    it('shows Admin link for creator users', () => {
      render(
        <MobileNavigationMenu {...defaultProps} user={{ ...defaultProps.user, isCreator: true }} />
      );

      const link = screen.getByRole('link', { name: /admin/i });
      expect(link).toBeInTheDocument();
    });

    it('applies active styling to admin when currentPage is admin', () => {
      render(
        <MobileNavigationMenu
          {...defaultProps}
          user={{ ...defaultProps.user, isAdmin: true }}
          currentPage="admin"
        />
      );

      const link = screen.getByRole('link', { name: /admin/i });
      expect(link.className).toContain('bg-white/12');
    });
  });

  describe('accessibility', () => {
    it('has navigation role', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('has correct id for menu', () => {
      render(<MobileNavigationMenu {...defaultProps} />);

      expect(screen.getByRole('navigation')).toHaveAttribute('id', 'mobile-navigation');
    });
  });

  describe('null user handling', () => {
    it('shows Clarify link when user is null (undefined tier !== "free")', () => {
      // Note: This behavior may be a bug - when user is null, user?.tier is undefined,
      // and undefined !== 'free' is true, so Clarify shows
      render(<MobileNavigationMenu {...defaultProps} user={null} />);

      expect(screen.getByRole('link', { name: /clarify/i })).toBeInTheDocument();
    });

    it('hides Admin link when user is null', () => {
      render(<MobileNavigationMenu {...defaultProps} user={null} />);

      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('still renders base navigation links when user is null', () => {
      render(<MobileNavigationMenu {...defaultProps} user={null} />);

      expect(screen.getByRole('link', { name: /journey/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dreams/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /reflect/i })).toBeInTheDocument();
    });
  });
});
