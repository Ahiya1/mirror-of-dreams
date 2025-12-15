// components/navigation/__tests__/BottomNavigation.test.tsx
// Tests for BottomNavigation component

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks - MUST be before component imports
// =============================================================================

const mockPathname = vi.fn().mockReturnValue('/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    className,
    'aria-current': ariaCurrent,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | boolean;
    'aria-label'?: string;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}));

const mockUseNavigation = vi.fn();
vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => mockUseNavigation(),
}));

const mockUseScrollDirection = vi.fn();
vi.mock('@/hooks', () => ({
  useScrollDirection: () => mockUseScrollDirection(),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

vi.mock('@/lib/animations/variants', () => ({
  bottomNavVariants: {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
  },
}));

vi.mock('framer-motion', () => {
  const MotionNav = React.forwardRef<HTMLElement, any>(
    ({ children, className, role, 'aria-label': ariaLabel, ...props }, ref) => (
      <nav ref={ref as any} className={className} role={role} aria-label={ariaLabel} {...props}>
        {children}
      </nav>
    )
  );
  MotionNav.displayName = 'MotionNav';

  const MotionDiv = React.forwardRef<HTMLDivElement, any>(
    ({ children, className, 'aria-hidden': ariaHidden, ...props }, ref) => (
      <div ref={ref} className={className} aria-hidden={ariaHidden} {...props}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';

  return {
    motion: {
      nav: MotionNav,
      div: MotionDiv,
    },
    AnimatePresence: ({ children, mode }: { children: React.ReactNode; mode?: string }) => (
      <>{children}</>
    ),
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="home-icon" className={className} aria-hidden={ariaHidden} />
  ),
  Sparkles: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="sparkles-icon" className={className} aria-hidden={ariaHidden} />
  ),
  Layers: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="layers-icon" className={className} aria-hidden={ariaHidden} />
  ),
  TrendingUp: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="trending-icon" className={className} aria-hidden={ariaHidden} />
  ),
  User: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="user-icon" className={className} aria-hidden={ariaHidden} />
  ),
  MessageSquare: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="message-icon" className={className} aria-hidden={ariaHidden} />
  ),
  Eye: ({ className, 'aria-hidden': ariaHidden }: any) => (
    <svg data-testid="eye-icon" className={className} aria-hidden={ariaHidden} />
  ),
}));

// =============================================================================
// Component Import - AFTER mocks
// =============================================================================

import { BottomNavigation } from '../BottomNavigation';

import { haptic } from '@/lib/utils/haptics';

// =============================================================================
// Test Helpers
// =============================================================================

const createMockUser = (tier: 'free' | 'pro' | 'unlimited' = 'free') => ({
  tier,
  name: 'Test User',
  email: 'test@example.com',
});

// =============================================================================
// Test Suite
// =============================================================================

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigation.mockReturnValue({ showBottomNav: true, setShowBottomNav: vi.fn() });
    mockUseScrollDirection.mockReturnValue('up');
    mockUseAuth.mockReturnValue({ user: createMockUser() });
    mockPathname.mockReturnValue('/dashboard');
  });

  describe('visibility', () => {
    it('renders when showBottomNav is true and scroll direction is up', () => {
      render(<BottomNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('does not render when showBottomNav is false', () => {
      mockUseNavigation.mockReturnValue({ showBottomNav: false, setShowBottomNav: vi.fn() });

      render(<BottomNavigation />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('does not render when scroll direction is down', () => {
      mockUseScrollDirection.mockReturnValue('down');

      render(<BottomNavigation />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('renders when scroll direction is up', () => {
      mockUseScrollDirection.mockReturnValue('up');

      render(<BottomNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders when scroll direction is null (at top)', () => {
      mockUseScrollDirection.mockReturnValue(null);

      render(<BottomNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('base navigation items', () => {
    it('renders Home link', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to home/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders Dreams link', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to dreams/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dreams');
    });

    it('renders Reflect link', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to reflect/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/reflection');
    });

    it('renders Evolution link', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to evolution/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/evolution');
    });

    it('renders Profile link', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to profile/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/profile');
    });
  });

  describe('Clarify tab visibility', () => {
    it('does not show Clarify tab for free users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser('free') });

      render(<BottomNavigation />);

      expect(screen.queryByRole('link', { name: /navigate to clarify/i })).not.toBeInTheDocument();
    });

    it('shows Clarify tab for pro users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser('pro') });

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to clarify/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/clarify');
    });

    it('shows Clarify tab for unlimited users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser('unlimited') });

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to clarify/i });
      expect(link).toBeInTheDocument();
    });

    it('shows Clarify tab when user is null (undefined tier !== "free")', () => {
      // Note: This behavior may be a bug - when user is null, user?.tier is undefined,
      // and undefined !== 'free' is true, so Clarify shows
      mockUseAuth.mockReturnValue({ user: null });

      render(<BottomNavigation />);

      expect(screen.getByRole('link', { name: /navigate to clarify/i })).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows dashboard as active for exact /dashboard path', () => {
      mockPathname.mockReturnValue('/dashboard');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to home/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('does not show dashboard as active for /dashboard/sub path', () => {
      mockPathname.mockReturnValue('/dashboard/sub');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to home/i });
      expect(link).not.toHaveAttribute('aria-current', 'page');
    });

    it('shows dreams as active for /dreams path', () => {
      mockPathname.mockReturnValue('/dreams');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to dreams/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('shows dreams as active for /dreams/123 sub path', () => {
      mockPathname.mockReturnValue('/dreams/123');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to dreams/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('shows reflect as active for /reflection path', () => {
      mockPathname.mockReturnValue('/reflection');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to reflect/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('shows evolution as active for /evolution path', () => {
      mockPathname.mockReturnValue('/evolution');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to evolution/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('shows profile as active for /profile path', () => {
      mockPathname.mockReturnValue('/profile');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to profile/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('shows clarify as active for /clarify path', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser('pro') });
      mockPathname.mockReturnValue('/clarify');

      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to clarify/i });
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('haptic feedback', () => {
    it('triggers haptic feedback on link click', () => {
      render(<BottomNavigation />);

      const link = screen.getByRole('link', { name: /navigate to home/i });
      fireEvent.click(link);

      expect(haptic).toHaveBeenCalledWith('light');
    });

    it('triggers haptic feedback for each link click', () => {
      render(<BottomNavigation />);

      fireEvent.click(screen.getByRole('link', { name: /navigate to dreams/i }));
      fireEvent.click(screen.getByRole('link', { name: /navigate to reflect/i }));

      expect(haptic).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('has navigation role', () => {
      render(<BottomNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has aria-label for main navigation', () => {
      render(<BottomNavigation />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('has aria-current on active link', () => {
      mockPathname.mockReturnValue('/dashboard');

      render(<BottomNavigation />);

      const activeLink = screen.getByRole('link', { name: /navigate to home/i });
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not have aria-current on inactive links', () => {
      mockPathname.mockReturnValue('/dashboard');

      render(<BottomNavigation />);

      const inactiveLink = screen.getByRole('link', { name: /navigate to dreams/i });
      expect(inactiveLink).not.toHaveAttribute('aria-current');
    });

    it('has descriptive aria-labels for all links', () => {
      render(<BottomNavigation />);

      expect(screen.getByRole('link', { name: /navigate to home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /navigate to dreams/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /navigate to reflect/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /navigate to evolution/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /navigate to profile/i })).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(<BottomNavigation className="custom-class" />);

      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<BottomNavigation className="my-nav" />);

      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('my-nav');
      expect(nav.className).toContain('fixed');
    });
  });

  describe('labels', () => {
    it('displays Home label', () => {
      render(<BottomNavigation />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('displays Dreams label', () => {
      render(<BottomNavigation />);

      expect(screen.getByText('Dreams')).toBeInTheDocument();
    });

    it('displays Reflect label', () => {
      render(<BottomNavigation />);

      expect(screen.getByText('Reflect')).toBeInTheDocument();
    });

    it('displays Evolution label', () => {
      render(<BottomNavigation />);

      expect(screen.getByText('Evolution')).toBeInTheDocument();
    });

    it('displays Profile label', () => {
      render(<BottomNavigation />);

      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('displays Clarify label for paid users', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser('pro') });

      render(<BottomNavigation />);

      expect(screen.getByText('Clarify')).toBeInTheDocument();
    });
  });
});
