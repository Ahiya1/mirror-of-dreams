// components/dashboard/cards/__tests__/UsageCard.test.tsx
// Tests for UsageCard component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockUseQuery = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    reflections: {
      checkUsage: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

vi.mock('@/components/dashboard/shared/DashboardCard', () => ({
  default: ({ children, className, isLoading, hasError, animated, hoverable }: any) => (
    <div
      data-testid="dashboard-card"
      className={className}
      data-loading={isLoading}
      data-error={hasError}
      data-animated={animated}
      data-hoverable={hoverable}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, icon }: any) => (
    <h3 data-icon={icon} data-testid="card-title">
      {children}
    </h3>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardActions: ({ children }: any) => <div data-testid="card-actions">{children}</div>,
  HeaderAction: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, variant }: any) => <button data-variant={variant}>{children}</button>,
}));

import UsageCard from '../UsageCard';

describe('UsageCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { used: 5, limit: 10, canReflect: true },
      isLoading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('renders card', () => {
      render(<UsageCard />);
      expect(screen.getByTestId('dashboard-card')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<UsageCard />);
      expect(screen.getByTestId('card-title')).toHaveTextContent('This Month');
    });

    it('renders usage display', () => {
      render(<UsageCard />);
      expect(screen.getByText('5 / 10 reflections this month')).toBeInTheDocument();
    });

    it('renders Create Reflection button', () => {
      render(<UsageCard />);
      expect(screen.getByText('Create Reflection')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading when data is loading', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });
      render(<UsageCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-loading', 'true');
    });

    it('shows default count when no data', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      render(<UsageCard />);
      expect(screen.getByText('0 / 1 reflections this month')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error state when query fails', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed'),
      });
      render(<UsageCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-error', 'true');
    });
  });

  describe('usage display', () => {
    it('shows count and limit', () => {
      mockUseQuery.mockReturnValue({
        data: { used: 3, limit: 15, canReflect: true },
        isLoading: false,
        error: null,
      });
      render(<UsageCard />);
      expect(screen.getByText('3 / 15 reflections this month')).toBeInTheDocument();
    });

    it('shows infinity symbol for unlimited users', () => {
      mockUseQuery.mockReturnValue({
        data: { used: 7, limit: 999999, canReflect: true },
        isLoading: false,
        error: null,
      });
      render(<UsageCard />);
      expect(screen.getByText('7 / ∞ reflections this month')).toBeInTheDocument();
    });

    it('handles missing used value', () => {
      mockUseQuery.mockReturnValue({
        data: { limit: 10, canReflect: true },
        isLoading: false,
        error: null,
      });
      render(<UsageCard />);
      expect(screen.getByText('0 / 10 reflections this month')).toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('links to reflection page', () => {
      render(<UsageCard />);
      const link = screen.getByRole('link', { name: /Create Reflection/i });
      expect(link).toHaveAttribute('href', '/reflection');
    });

    it('links to reflections list from header', () => {
      render(<UsageCard />);
      const link = screen.getByRole('link', { name: /View All/i });
      expect(link).toHaveAttribute('href', '/reflections');
    });
  });

  describe('props', () => {
    it('applies custom className', () => {
      render(<UsageCard className="custom-class" />);
      expect(screen.getByTestId('dashboard-card')).toHaveClass('custom-class');
    });

    it('passes animated prop', () => {
      render(<UsageCard animated={false} />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-animated', 'false');
    });

    it('defaults animated to true', () => {
      render(<UsageCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-animated', 'true');
    });

    it('sets hoverable', () => {
      render(<UsageCard />);
      expect(screen.getByTestId('dashboard-card')).toHaveAttribute('data-hoverable', 'true');
    });
  });

  describe('icon', () => {
    it('shows chart emoji in title', () => {
      render(<UsageCard />);
      expect(screen.getByTestId('card-title')).toHaveAttribute('data-icon', '📊');
    });
  });

  describe('button variant', () => {
    it('uses cosmic variant for Create Reflection button', () => {
      render(<UsageCard />);
      expect(screen.getByText('Create Reflection')).toHaveAttribute('data-variant', 'cosmic');
    });
  });
});
