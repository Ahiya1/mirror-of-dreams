// components/clarify/__tests__/ClarifyCard.test.tsx
// Tests for ClarifyCard component - Clarify sessions card for dashboard

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import ClarifyCard from '../ClarifyCard';

import type { User } from '@/types';

// Mock hooks/useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock trpc
const mockGetLimitsQuery = vi.fn();
const mockListSessionsQuery = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    clarify: {
      getLimits: { useQuery: () => mockGetLimitsQuery() },
      listSessions: { useQuery: () => mockListSessionsQuery() },
    },
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return '30 minutes ago';
    if (diff < 86400000) return '5 hours ago';
    return '2 days ago';
  }),
}));

// Mock DashboardCard and its subcomponents
vi.mock('@/components/dashboard/shared/DashboardCard', () => ({
  default: ({ children, className, isLoading, animated, animationDelay, hoverable }: any) => (
    <div
      data-testid="dashboard-card"
      className={className}
      data-is-loading={isLoading}
      data-animated={animated}
      data-animation-delay={animationDelay}
      data-hoverable={hoverable}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  HeaderAction: ({ children, href }: any) => (
    <a href={href} data-testid="header-action">
      {children}
    </a>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/glass', () => ({
  CosmicLoader: ({ size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>
      Loading...
    </div>
  ),
  GlowButton: ({ children, variant, size }: any) => (
    <button data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MessageCircle: () => <span data-testid="message-circle-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock constants
vi.mock('@/lib/utils/constants', () => ({
  CLARIFY_SESSION_LIMITS: {
    free: 0,
    pro: 20,
    unlimited: 30,
  },
}));

describe('ClarifyCard', () => {
  // Helper to create a mock user
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'pro',
    subscriptionStatus: 'active',
    subscriptionPeriod: 'monthly',
    reflectionCountThisMonth: 5,
    reflectionsToday: 1,
    lastReflectionDate: '2025-01-01',
    totalReflections: 50,
    clarifySessionsThisMonth: 5,
    totalClarifySessions: 25,
    currentMonthYear: '2025-01',
    cancelAtPeriodEnd: false,
    isCreator: false,
    isAdmin: false,
    isDemo: false,
    language: 'en',
    emailVerified: true,
    preferences: {
      notification_email: true,
      reflection_reminders: 'off',
      evolution_email: true,
      marketing_emails: false,
      default_tone: 'fusion',
      show_character_counter: true,
      reduce_motion_override: null,
      analytics_opt_in: true,
    },
    createdAt: new Date().toISOString(),
    lastSignInAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  // Helper to create mock session
  const createMockSession = (overrides: any = {}) => ({
    id: 'session-1',
    title: 'Test Session',
    messageCount: 10,
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks - pro user with some sessions
    mockUseAuth.mockReturnValue({ user: createMockUser() });
    mockGetLimitsQuery.mockReturnValue({
      data: { sessionsUsed: 5 },
      isLoading: false,
    });
    mockListSessionsQuery.mockReturnValue({
      data: { sessions: [createMockSession()] },
      isLoading: false,
    });
  });

  // --------------------------------------------------------------------------
  // Access Control Tests
  // --------------------------------------------------------------------------
  describe('access control', () => {
    it('returns null for free tier user', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free' }) });
      const { container } = render(<ClarifyCard />);
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { container } = render(<ClarifyCard />);
      expect(container).toBeEmptyDOMElement();
    });

    it('shows for pro tier user', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
    });

    it('shows for unlimited tier user', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
    });

    it('shows for creator user even if free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free', isCreator: true }) });
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
    });

    it('shows for admin user even if free tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'free', isAdmin: true }) });
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('shows loading state when limits are loading', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });
      mockListSessionsQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('shows loading state when sessions are loading', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: { sessionsUsed: 5 },
        isLoading: false,
      });
      mockListSessionsQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });
      render(<ClarifyCard />);
      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('passes isLoading to DashboardCard', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-is-loading', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Empty State Tests
  // --------------------------------------------------------------------------
  describe('empty state', () => {
    it('shows empty state when no sessions exist', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('Start Exploring')).toBeInTheDocument();
    });

    it('shows CTA in empty state', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('Start Session')).toBeInTheDocument();
    });

    it('shows description text in empty state', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText(/Begin a Clarify session/i)).toBeInTheDocument();
    });

    it('shows sparkles icon in empty state', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Sessions List Tests
  // --------------------------------------------------------------------------
  describe('sessions list', () => {
    it('renders session list when sessions exist', () => {
      const sessions = [
        createMockSession({ id: 'session-1', title: 'First Session' }),
        createMockSession({ id: 'session-2', title: 'Second Session' }),
      ];
      mockListSessionsQuery.mockReturnValue({
        data: { sessions },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('First Session')).toBeInTheDocument();
      expect(screen.getByText('Second Session')).toBeInTheDocument();
    });

    it('renders session with message count', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [createMockSession({ messageCount: 15 })] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText(/15 messages/)).toBeInTheDocument();
    });

    it('renders session with relative time', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [createMockSession()] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      // The mock returns '5 hours ago' for time < 1 day
      expect(screen.getByText(/5 hours ago/)).toBeInTheDocument();
    });

    it('session links to correct URL', () => {
      mockListSessionsQuery.mockReturnValue({
        data: { sessions: [createMockSession({ id: 'session-123' })] },
        isLoading: false,
      });
      render(<ClarifyCard />);
      const sessionLink = screen.getByText('Test Session').closest('a');
      expect(sessionLink).toHaveAttribute('href', '/clarify/session-123');
    });
  });

  // --------------------------------------------------------------------------
  // Usage Bar Tests
  // --------------------------------------------------------------------------
  describe('usage bar', () => {
    it('displays sessions used count', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: { sessionsUsed: 12 },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays session limit for pro tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'pro' }) });
      mockGetLimitsQuery.mockReturnValue({
        data: { sessionsUsed: 5 },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText(/\/ 20 this month/)).toBeInTheDocument();
    });

    it('displays session limit for unlimited tier', () => {
      mockUseAuth.mockReturnValue({ user: createMockUser({ tier: 'unlimited' }) });
      mockGetLimitsQuery.mockReturnValue({
        data: { sessionsUsed: 5 },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText(/\/ 30 this month/)).toBeInTheDocument();
    });

    it('handles null sessionsUsed gracefully', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: { sessionsUsed: null },
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles undefined limits data gracefully', () => {
      mockGetLimitsQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      });
      render(<ClarifyCard />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Card Header Tests
  // --------------------------------------------------------------------------
  describe('card header', () => {
    it('displays card title "Clarify Sessions"', () => {
      render(<ClarifyCard />);
      expect(screen.getByText('Clarify Sessions')).toBeInTheDocument();
    });

    it('displays message circle icon', () => {
      render(<ClarifyCard />);
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
    });

    it('has View All link to /clarify', () => {
      render(<ClarifyCard />);
      const viewAllLink = screen.getByTestId('header-action');
      expect(viewAllLink).toHaveAttribute('href', '/clarify');
    });
  });

  // --------------------------------------------------------------------------
  // Props Tests
  // --------------------------------------------------------------------------
  describe('props', () => {
    it('applies custom className', () => {
      render(<ClarifyCard className="custom-class" />);
      const card = screen.getByTestId('dashboard-card');
      expect(card.className).toContain('custom-class');
    });

    it('passes animated prop to DashboardCard', () => {
      render(<ClarifyCard animated={false} />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-animated', 'false');
    });

    it('defaults animated to true', () => {
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-animated', 'true');
    });

    it('passes animationDelay to DashboardCard', () => {
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-animation-delay', '300');
    });

    it('passes hoverable to DashboardCard', () => {
      render(<ClarifyCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-hoverable', 'true');
    });
  });
});
