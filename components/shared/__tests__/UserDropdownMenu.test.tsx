// components/shared/__tests__/UserDropdownMenu.test.tsx
// Tests for UserDropdownMenu component

import { render, screen, fireEvent } from '@testing-library/react';
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
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { id?: string; role?: string; 'aria-label'?: string }
  >(({ children, className, id, role, ...props }, ref) => (
    <div ref={ref} className={className} id={id} role={role} {...props}>
      {children}
    </div>
  ));
  MotionDiv.displayName = 'MotionDiv';

  return {
    motion: {
      div: MotionDiv,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    elevated,
    className,
  }: {
    children: React.ReactNode;
    elevated?: boolean;
    className?: string;
  }) => (
    <div data-testid="glass-card" data-elevated={elevated} className={className}>
      {children}
    </div>
  ),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { UserDropdownMenu } from '../UserDropdownMenu';

// =============================================================================
// Test Helpers
// =============================================================================

const defaultProps = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    tier: 'free' as const,
  },
  currentPage: 'dashboard',
  onSignOut: vi.fn(),
  onClose: vi.fn(),
};

// =============================================================================
// Test Suite
// =============================================================================

describe('UserDropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user info display', () => {
    it('renders user name', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders user email', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows fallback name when user name is null', () => {
      render(<UserDropdownMenu {...defaultProps} user={{ ...defaultProps.user, name: null }} />);

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('shows fallback email when user email is null', () => {
      render(<UserDropdownMenu {...defaultProps} user={{ ...defaultProps.user, email: null }} />);

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('handles null user gracefully', () => {
      render(<UserDropdownMenu {...defaultProps} user={null} />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('renders profile link', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('renders settings link', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('renders help link', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const helpLink = screen.getByRole('link', { name: /help/i });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute('href', '/help');
    });
  });

  describe('upgrade link visibility', () => {
    it('shows upgrade link for free tier users', () => {
      render(<UserDropdownMenu {...defaultProps} user={{ ...defaultProps.user, tier: 'free' }} />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toBeInTheDocument();
      expect(upgradeLink).toHaveAttribute('href', '/pricing');
    });

    it('shows upgrade link for pro tier users', () => {
      render(<UserDropdownMenu {...defaultProps} user={{ ...defaultProps.user, tier: 'pro' }} />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toBeInTheDocument();
    });

    it('hides upgrade link for unlimited tier users', () => {
      render(
        <UserDropdownMenu {...defaultProps} user={{ ...defaultProps.user, tier: 'unlimited' }} />
      );

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('shows upgrade link when tier is undefined', () => {
      render(
        <UserDropdownMenu {...defaultProps} user={{ name: 'Test', email: 'test@example.com' }} />
      );

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toBeInTheDocument();
    });
  });

  describe('sign out button', () => {
    it('renders sign out button', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('triggers onSignOut callback when clicked', () => {
      const onSignOut = vi.fn();
      render(<UserDropdownMenu {...defaultProps} onSignOut={onSignOut} />);

      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
    });

    it('has error styling class for sign out button', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton.className).toContain('text-mirror-error');
    });
  });

  describe('accessibility', () => {
    it('has menu role', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('has aria-label for menu', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'User menu options');
    });

    it('has correct id for dropdown', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      expect(screen.getByRole('menu')).toHaveAttribute('id', 'user-dropdown-menu');
    });
  });

  describe('icons', () => {
    it('displays profile icon', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink.textContent).toContain('Profile');
    });

    it('displays settings icon', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink.textContent).toContain('Settings');
    });

    it('displays sign out icon', () => {
      render(<UserDropdownMenu {...defaultProps} />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton.textContent).toContain('Sign Out');
    });
  });
});
