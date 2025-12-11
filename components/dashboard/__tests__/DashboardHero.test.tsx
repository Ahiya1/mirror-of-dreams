import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DashboardHero from '../DashboardHero';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      list: { useQuery: vi.fn() },
    },
  },
}));

// Mock GlowButton
vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, disabled, className, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

// Import mocked modules
import type { User } from '@/types';

import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { createMockUser } from '@/test/factories';
import { createMockQueryResult, createMockLoadingResult } from '@/test/helpers';

/**
 * Helper to set up auth mock
 */
const mockAuth = (
  overrides: {
    user?: Partial<User> | null;
    isLoading?: boolean;
    isAuthenticated?: boolean;
    error?: string | null;
  } = {}
) => {
  // Build user: if overrides.user is null, use null; if overrides.user has partial props, merge with defaults
  let user: User | null;
  if (overrides.user === null) {
    user = null;
  } else if (overrides.user !== undefined) {
    user = createMockUser({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      ...overrides.user,
    });
  } else {
    user = createMockUser({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    });
  }

  const defaultAuth = {
    user,
    isLoading: overrides.isLoading ?? false,
    isAuthenticated: overrides.isAuthenticated ?? true,
    error: overrides.error ?? null,
    signin: vi.fn(),
    signup: vi.fn(),
    signout: vi.fn(),
    refreshUser: vi.fn(),
    setUser: vi.fn(),
  };
  vi.mocked(useAuth).mockReturnValue(defaultAuth);
  return defaultAuth;
};

/**
 * Helper to set up dreams query mock
 */
const mockDreams = (dreams: any[] | undefined = []) => {
  vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));
};

describe('DashboardHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('time-based greeting', () => {
    it('should show "Good morning" greeting for 5am', () => {
      vi.setSystemTime(new Date('2025-01-10T05:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show "Good morning" greeting for 9am', () => {
      vi.setSystemTime(new Date('2025-01-10T09:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show "Good morning" greeting for 11:59am', () => {
      vi.setSystemTime(new Date('2025-01-10T11:59:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good morning/i)).toBeInTheDocument();
    });

    it('should show "Good afternoon" greeting for 12pm', () => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show "Good afternoon" greeting for 3pm', () => {
      vi.setSystemTime(new Date('2025-01-10T15:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show "Good afternoon" greeting for 5:59pm', () => {
      vi.setSystemTime(new Date('2025-01-10T17:59:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
    });

    it('should show "Good evening" greeting for 6pm', () => {
      vi.setSystemTime(new Date('2025-01-10T18:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show "Good evening" greeting for 8pm', () => {
      vi.setSystemTime(new Date('2025-01-10T20:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show "Good evening" greeting for 11pm', () => {
      vi.setSystemTime(new Date('2025-01-10T23:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show "Good evening" greeting for midnight (12am)', () => {
      vi.setSystemTime(new Date('2025-01-10T00:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });

    it('should show "Good evening" greeting for 4am', () => {
      vi.setSystemTime(new Date('2025-01-10T04:00:00'));
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText(/good evening/i)).toBeInTheDocument();
    });
  });

  describe('user name display', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should show first name from user.name', () => {
      mockAuth({ user: { id: 'user-1', name: 'John Doe' } });
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should show full name if single word', () => {
      mockAuth({ user: { id: 'user-1', name: 'Alice' } });
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should show "Dreamer" as fallback when no name', () => {
      mockAuth({ user: { id: 'user-1', name: undefined } });
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText('Dreamer')).toBeInTheDocument();
    });

    it('should show "Dreamer" as fallback when name is empty string', () => {
      mockAuth({ user: { id: 'user-1', name: '' } });
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText('Dreamer')).toBeInTheDocument();
    });

    it('should show "Dreamer" when user is null', () => {
      mockAuth({ user: null });
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByText('Dreamer')).toBeInTheDocument();
    });
  });

  describe('CTA button', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should show "Reflect Now" button', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(screen.getByRole('button', { name: /reflect now/i })).toBeInTheDocument();
    });

    it('should enable button when user has active dreams', () => {
      mockAuth();
      mockDreams([{ id: 'dream-1', title: 'Test Dream' }]);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).not.toBeDisabled();
    });

    it('should disable button when no active dreams', () => {
      mockAuth();
      mockDreams([]);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).toBeDisabled();
    });

    it('should disable button when dreams is undefined', () => {
      mockAuth();
      mockDreams(undefined);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).toBeDisabled();
    });

    it('should navigate to /reflection when clicked with active dreams', () => {
      mockAuth();
      mockDreams([{ id: 'dream-1', title: 'Test Dream' }]);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/reflection');
    });

    it('should not navigate when clicked without active dreams', () => {
      mockAuth();
      mockDreams([]);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      fireEvent.click(button);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should have cosmic variant', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).toHaveAttribute('data-variant', 'cosmic');
    });

    it('should have large size', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('empty state hint', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should show hint to create first dream when no active dreams', () => {
      mockAuth();
      mockDreams([]);

      render(<DashboardHero />);

      expect(screen.getByText(/name your first dream/i)).toBeInTheDocument();
      expect(screen.getByText('to begin')).toBeInTheDocument();
    });

    it('should have hint link to /dreams', () => {
      mockAuth();
      mockDreams([]);

      render(<DashboardHero />);

      const link = screen.getByRole('link', { name: /name your first dream/i });
      expect(link).toHaveAttribute('href', '/dreams');
    });

    it('should hide hint when user has active dreams', () => {
      mockAuth();
      mockDreams([{ id: 'dream-1', title: 'Test Dream' }]);

      render(<DashboardHero />);

      expect(screen.queryByText(/name your first dream/i)).not.toBeInTheDocument();
    });
  });

  describe('motivational copy', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should show "Your dreams are waiting to be heard" when has dreams', () => {
      mockAuth();
      mockDreams([{ id: 'dream-1', title: 'Test Dream' }]);

      render(<DashboardHero />);

      expect(screen.getByText('Your dreams are waiting to be heard')).toBeInTheDocument();
    });

    it('should show alternative message when no dreams', () => {
      mockAuth();
      mockDreams([]);

      render(<DashboardHero />);

      expect(screen.getByText("When you're ready, name what you're holding")).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should render dashboard-hero container', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(document.querySelector('.dashboard-hero')).toBeInTheDocument();
    });

    it('should render sparkle emoji', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      const sparkle = document.querySelector('.dashboard-hero__sparkle');
      expect(sparkle).toBeInTheDocument();
    });

    it('should render title heading', () => {
      mockAuth({ user: { id: 'user-1', name: 'Jane' } });
      mockDreams();

      render(<DashboardHero />);

      const title = document.querySelector('.dashboard-hero__title');
      expect(title).toBeInTheDocument();
      expect(title?.tagName).toBe('H1');
    });

    it('should render actions container', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(document.querySelector('.dashboard-hero__actions')).toBeInTheDocument();
    });

    it('should render subtitle with motivational copy', () => {
      mockAuth();
      mockDreams();

      render(<DashboardHero />);

      expect(document.querySelector('.dashboard-hero__subtitle')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-10T12:00:00'));
    });

    it('should handle loading dreams query', () => {
      mockAuth();
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<DashboardHero />);

      // Button should be disabled when loading
      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).toBeDisabled();
    });

    it('should handle name with multiple spaces', () => {
      mockAuth({ user: { id: 'user-1', name: 'John  Paul  Jones' } });
      mockDreams();

      render(<DashboardHero />);

      // Should split on first space and show 'John'
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should handle multiple active dreams', () => {
      mockAuth();
      mockDreams([
        { id: 'dream-1', title: 'Dream 1' },
        { id: 'dream-2', title: 'Dream 2' },
        { id: 'dream-3', title: 'Dream 3' },
      ]);

      render(<DashboardHero />);

      const button = screen.getByRole('button', { name: /reflect now/i });
      expect(button).not.toBeDisabled();
    });
  });
});
