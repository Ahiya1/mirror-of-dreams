// components/shared/__tests__/AppNavigation.test.tsx
// Tests for AppNavigation component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

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

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockMutateAsync = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      signout: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<HTMLDivElement, any>(
    ({ children, className, id, role, ...props }, ref) => (
      <div ref={ref} className={className} id={id} role={role} {...props}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';

  const MotionNav = React.forwardRef<HTMLElement, any>(
    ({ children, className, id, role, ...props }, ref) => (
      <nav ref={ref as any} className={className} id={id} role={role} {...props}>
        {children}
      </nav>
    )
  );
  MotionNav.displayName = 'MotionNav';

  return {
    motion: {
      div: MotionDiv,
      nav: MotionNav,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('lucide-react', () => ({
  Menu: ({ className }: any) => <svg data-testid="menu-icon" className={className} />,
  X: ({ className }: any) => <svg data-testid="close-icon" className={className} />,
}));

vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    elevated,
    className,
    style,
    'data-nav-container': dataNavContainer,
  }: {
    children: React.ReactNode;
    elevated?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'data-nav-container'?: boolean;
  }) => (
    <div
      data-testid="glass-card"
      data-elevated={elevated}
      className={className}
      style={style}
      data-nav-container={dataNavContainer}
    >
      {children}
    </div>
  ),
  GlowButton: ({
    children,
    onClick,
    variant,
    size,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      data-testid="glow-button"
    >
      {children}
    </button>
  ),
}));

vi.mock('../DemoBanner', () => ({
  DemoBanner: () => <div data-testid="demo-banner">Demo Banner</div>,
}));

vi.mock('../MobileNavigationMenu', () => ({
  MobileNavigationMenu: ({ user, currentPage, isOpen, onClose }: any) =>
    isOpen ? (
      <nav data-testid="mobile-nav-menu" data-current-page={currentPage}>
        Mobile Navigation Menu
      </nav>
    ) : null,
}));

vi.mock('../UserDropdownMenu', () => ({
  UserDropdownMenu: ({ user, currentPage, onSignOut, onClose }: any) => (
    <div data-testid="user-dropdown-menu" role="menu">
      <button onClick={onSignOut} data-testid="sign-out-button">
        Sign Out
      </button>
    </div>
  ),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { AppNavigation } from '../AppNavigation';

// =============================================================================
// Test Helpers
// =============================================================================

const createMockUser = (
  overrides: Partial<{
    tier: 'free' | 'pro' | 'unlimited';
    name: string | null;
    email: string;
    isCreator: boolean;
    isAdmin: boolean;
    isDemo: boolean;
  }> = {}
) => ({
  tier: 'free' as const,
  name: 'Test User',
  email: 'test@example.com',
  isCreator: false,
  isAdmin: false,
  isDemo: false,
  ...overrides,
});

// =============================================================================
// Test Suite
// =============================================================================

describe('AppNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: createMockUser() });
    mockMutateAsync.mockResolvedValue({});
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      height: 64,
      width: 1200,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 64,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logo and branding', () => {
    it('renders logo link to dashboard', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const logoLink = screen.getByRole('link', { name: /mirror of dreams/i });
      expect(logoLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders logo emoji', () => {
      render(<AppNavigation currentPage="dashboard" />);

      // The component contains emoji in the logo
      const logoLink = screen.getByRole('link', { name: /mirror of dreams/i });
      expect(logoLink).toBeInTheDocument();
    });
  });

  describe('desktop navigation links', () => {
    it('renders Journey (dashboard) link', () => {
      render(<AppNavigation currentPage="dreams" />);

      const link = screen.getByRole('link', { name: /journey/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders Dreams link', () => {
      render(<AppNavigation currentPage="dashboard" />);

      // Use getAllByRole to find links containing "Dreams" and filter for the nav link
      const links = screen.getAllByRole('link', { name: /dreams/i });
      const dreamsLink = links.find((link) => link.getAttribute('href') === '/dreams');
      expect(dreamsLink).toBeInTheDocument();
    });

    it('renders Reflect link', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /reflect/i });
      expect(link).toHaveAttribute('href', '/reflection');
    });

    it('renders Evolution link', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /evolution/i });
      expect(link).toHaveAttribute('href', '/evolution');
    });

    it('renders Visualizations link', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /visualizations/i });
      expect(link).toHaveAttribute('href', '/visualizations');
    });
  });

  describe('active page highlighting', () => {
    it('highlights dashboard link when currentPage is dashboard', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /journey/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });

    it('highlights dreams link when currentPage is dreams', () => {
      render(<AppNavigation currentPage="dreams" />);

      // Use getAllByRole to find links containing "Dreams" and filter for the nav link
      const links = screen.getAllByRole('link', { name: /dreams/i });
      const dreamsLink = links.find((link) => link.getAttribute('href') === '/dreams');
      expect(dreamsLink?.className).toContain('dashboard-nav-link--active');
    });

    it('highlights reflection link when currentPage is reflection', () => {
      render(<AppNavigation currentPage="reflection" />);

      const link = screen.getByRole('link', { name: /reflect/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });

    it('highlights evolution link when currentPage is evolution', () => {
      render(<AppNavigation currentPage="evolution" />);

      const link = screen.getByRole('link', { name: /evolution/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });

    it('highlights visualizations link when currentPage is visualizations', () => {
      render(<AppNavigation currentPage="visualizations" />);

      const link = screen.getByRole('link', { name: /visualizations/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });

    it('does not highlight non-active links', () => {
      render(<AppNavigation currentPage="dashboard" />);

      // Use getAllByRole to find links containing "Dreams" and filter for the nav link
      const links = screen.getAllByRole('link', { name: /dreams/i });
      const dreamsLink = links.find((link) => link.getAttribute('href') === '/dreams');
      expect(dreamsLink?.className).not.toContain('dashboard-nav-link--active');
    });
  });

  describe('Clarify link visibility', () => {
    it('hides Clarify link for free tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.queryByRole('link', { name: /clarify/i })).not.toBeInTheDocument();
    });

    it('shows Clarify link for pro tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /clarify/i });
      expect(link).toHaveAttribute('href', '/clarify');
    });

    it('shows Clarify link for unlimited tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByRole('link', { name: /clarify/i })).toBeInTheDocument();
    });

    it('highlights Clarify link when currentPage is clarify', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<AppNavigation currentPage="clarify" />);

      const link = screen.getByRole('link', { name: /clarify/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });
  });

  describe('Admin link visibility', () => {
    it('hides Admin link for non-admin users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ isAdmin: false, isCreator: false }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('shows Admin link for admin users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ isAdmin: true }) });

      render(<AppNavigation currentPage="dashboard" />);

      const link = screen.getByRole('link', { name: /admin/i });
      expect(link).toHaveAttribute('href', '/admin');
    });

    it('shows Admin link for creator users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ isCreator: true }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    });

    it('highlights Admin link when currentPage is admin', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ isAdmin: true }) });

      render(<AppNavigation currentPage="admin" />);

      const link = screen.getByRole('link', { name: /admin/i });
      expect(link.className).toContain('dashboard-nav-link--active');
    });
  });

  describe('upgrade button', () => {
    it('shows upgrade button for free tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByTestId('glow-button')).toBeInTheDocument();
    });

    it('hides upgrade button for pro tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.queryByTestId('glow-button')).not.toBeInTheDocument();
    });

    it('hides upgrade button for unlimited tier users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.queryByTestId('glow-button')).not.toBeInTheDocument();
    });

    it('navigates to pricing page when upgrade button is clicked', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<AppNavigation currentPage="dashboard" />);

      fireEvent.click(screen.getByTestId('glow-button'));

      expect(mockPush).toHaveBeenCalledWith('/pricing');
    });
  });

  describe('user dropdown', () => {
    it('shows user dropdown menu when toggle clicked', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();
    });

    it('hides user dropdown menu on second click', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup attribute', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      expect(toggleButton).toHaveAttribute('aria-haspopup', 'true');
    });

    it('has aria-controls attribute', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      expect(toggleButton).toHaveAttribute('aria-controls', 'user-dropdown-menu');
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown with Enter key', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.keyDown(toggleButton, { key: 'Enter' });

      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.keyDown(toggleButton, { key: ' ' });

      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();
    });

    it('closes dropdown with Escape key', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();

      fireEvent.keyDown(toggleButton, { key: 'Escape' });
      expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
    });
  });

  describe('click outside behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('user-dropdown-menu')).toBeInTheDocument();

      // Simulate click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByTestId('user-dropdown-menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('sign out', () => {
    it('calls signout mutation when sign out is clicked', async () => {
      render(<AppNavigation currentPage="dashboard" />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Click sign out
      fireEvent.click(screen.getByTestId('sign-out-button'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('redirects to signin page after sign out', async () => {
      render(<AppNavigation currentPage="dashboard" />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Click sign out
      fireEvent.click(screen.getByTestId('sign-out-button'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin');
      });
    });
  });

  describe('mobile menu', () => {
    it('renders mobile menu button', () => {
      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
    });

    it('opens mobile menu when button is clicked', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);

      expect(screen.getByTestId('mobile-nav-menu')).toBeInTheDocument();
    });

    it('closes mobile menu on second click', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-nav-menu')).toBeInTheDocument();

      // Now the button should say "Close navigation menu"
      const closeButton = screen.getByRole('button', { name: /close navigation menu/i });
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('mobile-nav-menu')).not.toBeInTheDocument();
    });

    it('has aria-expanded attribute on mobile menu button', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);
      expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('has aria-controls attribute on mobile menu button', () => {
      render(<AppNavigation currentPage="dashboard" />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation');
    });
  });

  describe('demo banner', () => {
    it('renders demo banner component', () => {
      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
    });
  });

  describe('refresh button', () => {
    it('shows refresh button when onRefresh is provided', () => {
      const onRefresh = vi.fn();
      render(<AppNavigation currentPage="dashboard" onRefresh={onRefresh} />);

      expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
    });

    it('hides refresh button when onRefresh is not provided', () => {
      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.queryByRole('button', { name: /refresh data/i })).not.toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = vi.fn();
      render(<AppNavigation currentPage="dashboard" onRefresh={onRefresh} />);

      fireEvent.click(screen.getByRole('button', { name: /refresh data/i }));

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('user tier icons', () => {
    it('shows user icon for free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });

      render(<AppNavigation currentPage="dashboard" />);

      const toggleButton = screen.getByRole('button', { name: /user menu/i });
      expect(toggleButton.innerHTML).toContain('span');
    });

    it('shows first name in user menu button', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ name: 'John Doe' }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('shows fallback text when name is null', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ name: null }) });

      render(<AppNavigation currentPage="dashboard" />);

      expect(screen.getByText('Friend')).toBeInTheDocument();
    });
  });
});
