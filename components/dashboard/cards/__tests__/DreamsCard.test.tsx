import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DreamsCard from '../DreamsCard';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: {
      list: { useQuery: vi.fn() },
      getLimits: { useQuery: vi.fn() },
    },
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      ({ children, className, onClick, onMouseEnter, onMouseLeave, ...props }: any, ref: any) => (
        <div
          ref={ref}
          className={className}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          {...props}
        >
          {children}
        </div>
      )
    ),
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock UI components
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
  CosmicLoader: ({ label, size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>
      {label}
    </div>
  ),
}));

// Import trpc after mock
import { trpc } from '@/lib/trpc';
import {
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
} from '@/test/helpers';

// ============================================================================
// Test Data Factories
// ============================================================================

interface MockDream {
  id: string;
  title: string;
  description?: string;
  category: string;
  daysLeft: number | null;
  targetDate?: string;
  reflectionCount: number;
}

const createMockDream = (overrides: Partial<MockDream> = {}): MockDream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'A test dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-02-01',
  reflectionCount: 5,
  ...overrides,
});

interface MockLimits {
  dreamsUsed: number;
  dreamsLimit: number;
}

const createMockLimits = (overrides: Partial<MockLimits> = {}): MockLimits => ({
  dreamsUsed: 2,
  dreamsLimit: 3,
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('DreamsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for limits
    vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
      createMockQueryResult(createMockLimits())
    );
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render card with title "Active Dreams"', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );

      render(<DreamsCard />);

      expect(screen.getByText('Active Dreams')).toBeInTheDocument();
    });

    it('should render "View All" header action link', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );

      render(<DreamsCard />);

      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', '/dreams');
    });

    it('should apply custom className', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );

      render(<DreamsCard className="custom-class" />);

      const card = document.querySelector('.dreams-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('should show CosmicLoader when isLoading', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<DreamsCard />);

      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('should show "Loading your dreams..." text', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<DreamsCard />);

      expect(screen.getByText('Loading your dreams...')).toBeInTheDocument();
    });

    it('should apply loading class to card', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<DreamsCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });

    it('should not show dream limit indicator while loading', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<DreamsCard />);

      expect(screen.queryByText(/\/ \d+ dreams/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Error State Tests
  // --------------------------------------------------------------------------
  describe('error state', () => {
    it('should show error overlay when query has error', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockErrorResult(new Error('Failed to fetch dreams'))
      );

      render(<DreamsCard />);

      expect(screen.getByText('Unable to load data')).toBeInTheDocument();
    });

    it('should apply error class to card', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockErrorResult(new Error('Network error'))
      );

      render(<DreamsCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--error');
    });
  });

  // --------------------------------------------------------------------------
  // Empty State Tests
  // --------------------------------------------------------------------------
  describe('empty state', () => {
    it('should render empty state message when no dreams', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult([]));

      render(<DreamsCard />);

      expect(screen.getByText('Your journey begins with a dream')).toBeInTheDocument();
    });

    it('should render "Create Your First Dream" CTA button', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult([]));

      render(<DreamsCard />);

      expect(screen.getByRole('button', { name: 'Create Your First Dream' })).toBeInTheDocument();
    });

    it('should have CTA wrapped in link to /dreams', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult([]));

      render(<DreamsCard />);

      const link = screen.getByRole('link', { name: 'Create Your First Dream' });
      expect(link).toHaveAttribute('href', '/dreams');
    });

    it('should show instructional text in empty state', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult([]));

      render(<DreamsCard />);

      expect(
        screen.getByText(/What calls to you\? Create your first dream to start reflecting\./i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // With Dreams Data Tests
  // --------------------------------------------------------------------------
  describe('with dreams data', () => {
    it('should render up to 3 dreams', () => {
      const dreams = [
        createMockDream({ id: 'dream-1', title: 'Dream One' }),
        createMockDream({ id: 'dream-2', title: 'Dream Two' }),
        createMockDream({ id: 'dream-3', title: 'Dream Three' }),
        createMockDream({ id: 'dream-4', title: 'Dream Four' }),
      ];
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));

      render(<DreamsCard />);

      expect(screen.getByText('Dream One')).toBeInTheDocument();
      expect(screen.getByText('Dream Two')).toBeInTheDocument();
      expect(screen.getByText('Dream Three')).toBeInTheDocument();
      expect(screen.queryByText('Dream Four')).not.toBeInTheDocument();
    });

    it('should display dream title for each dream', () => {
      const dreams = [
        createMockDream({ id: 'dream-1', title: 'My Career Goal' }),
        createMockDream({ id: 'dream-2', title: 'Health Journey' }),
      ];
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));

      render(<DreamsCard />);

      expect(screen.getByText('My Career Goal')).toBeInTheDocument();
      expect(screen.getByText('Health Journey')).toBeInTheDocument();
    });

    it('should show "Reflect" button for each dream', () => {
      const dreams = [
        createMockDream({ id: 'dream-1', title: 'Dream One' }),
        createMockDream({ id: 'dream-2', title: 'Dream Two' }),
      ];
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));

      render(<DreamsCard />);

      const reflectButtons = screen.getAllByRole('button', { name: 'Reflect' });
      expect(reflectButtons).toHaveLength(2);
    });

    it('should show reflection count for each dream', () => {
      const dreams = [
        createMockDream({ id: 'dream-1', reflectionCount: 5 }),
        createMockDream({ id: 'dream-2', reflectionCount: 12 }),
      ];
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));

      render(<DreamsCard />);

      expect(screen.getByText('5 reflections')).toBeInTheDocument();
      expect(screen.getByText('12 reflections')).toBeInTheDocument();
    });

    it('should show 0 reflections for dreams without reflections', () => {
      const dreams = [createMockDream({ id: 'dream-1', reflectionCount: 0 })];
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(createMockQueryResult(dreams));

      render(<DreamsCard />);

      expect(screen.getByText('0 reflections')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Category Emoji Tests
  // --------------------------------------------------------------------------
  describe('category emoji', () => {
    it('should show correct emoji for creative category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'creative' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDFA8');
    });

    it('should show correct emoji for health category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'health' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDFC3');
    });

    it('should show correct emoji for career category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'career' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toBe('\uD83D\uDCBC');
    });

    it('should show correct emoji for relationships category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'relationships' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toContain('\u2764');
    });

    it('should show correct emoji for financial category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'financial' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toBe('\uD83D\uDCB0');
    });

    it('should show star emoji for other/unknown category', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ category: 'unknown' })])
      );

      render(<DreamsCard />);

      const iconElement = document.querySelector('.dream-item__icon');
      expect(iconElement?.textContent).toBe('\u2B50');
    });
  });

  // --------------------------------------------------------------------------
  // Days Left Display Tests
  // --------------------------------------------------------------------------
  describe('days left display', () => {
    it('should show "Xd left" for positive daysLeft', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: 30 })])
      );

      render(<DreamsCard />);

      expect(screen.getByText('30d left')).toBeInTheDocument();
    });

    it('should show "Today!" for daysLeft === 0', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: 0 })])
      );

      render(<DreamsCard />);

      expect(screen.getByText('Today!')).toBeInTheDocument();
    });

    it('should show "Xd overdue" for negative daysLeft', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: -5 })])
      );

      render(<DreamsCard />);

      expect(screen.getByText('5d overdue')).toBeInTheDocument();
    });

    it('should apply overdue urgency class for negative daysLeft', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: -1 })])
      );

      render(<DreamsCard />);

      const daysElement = document.querySelector('.dream-item__days--overdue');
      expect(daysElement).toBeInTheDocument();
    });

    it('should apply soon urgency class for daysLeft <= 7', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: 3 })])
      );

      render(<DreamsCard />);

      const daysElement = document.querySelector('.dream-item__days--soon');
      expect(daysElement).toBeInTheDocument();
    });

    it('should apply normal urgency class for daysLeft > 7', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: 30 })])
      );

      render(<DreamsCard />);

      const daysElement = document.querySelector('.dream-item__days--normal');
      expect(daysElement).toBeInTheDocument();
    });

    it('should not show days indicator when daysLeft is null', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ daysLeft: null })])
      );

      render(<DreamsCard />);

      expect(screen.queryByText(/left|overdue|Today!/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Dream Limits Tests
  // --------------------------------------------------------------------------
  describe('dream limits', () => {
    it('should show dream limit indicator "X / Y dreams"', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );
      vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
        createMockQueryResult(createMockLimits({ dreamsUsed: 2, dreamsLimit: 3 }))
      );

      render(<DreamsCard />);

      expect(screen.getByText('2 / 3 dreams')).toBeInTheDocument();
    });

    it('should show infinity symbol for unlimited tier', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );
      vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
        createMockQueryResult(createMockLimits({ dreamsUsed: 5, dreamsLimit: 999999 }))
      );

      render(<DreamsCard />);

      expect(screen.getByText(/5.*\/.*\u221E.*dreams/)).toBeInTheDocument();
    });

    it('should not show dream limit when limits data is not available', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );
      vi.mocked(trpc.dreams.getLimits.useQuery).mockReturnValue(
        createMockQueryResult(undefined as any)
      );

      render(<DreamsCard />);

      expect(screen.queryByText(/dreams$/)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Interactions Tests
  // --------------------------------------------------------------------------
  describe('interactions', () => {
    it('should have dream link to /dreams/{id}', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ id: 'dream-123', title: 'Test Dream' })])
      );

      render(<DreamsCard />);

      const dreamLink = screen.getByRole('link', { name: /test dream/i });
      expect(dreamLink).toHaveAttribute('href', '/dreams/dream-123');
    });

    it('should navigate to /reflection?dreamId={id} on "Reflect" button click', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream({ id: 'dream-456' })])
      );

      render(<DreamsCard />);

      const reflectButton = screen.getByRole('button', { name: 'Reflect' });
      fireEvent.click(reflectButton);

      expect(mockPush).toHaveBeenCalledWith('/reflection?dreamId=dream-456');
    });

    it('should navigate to correct dream when multiple dreams exist', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([
          createMockDream({ id: 'dream-1', title: 'Dream One' }),
          createMockDream({ id: 'dream-2', title: 'Dream Two' }),
        ])
      );

      render(<DreamsCard />);

      const reflectButtons = screen.getAllByRole('button', { name: 'Reflect' });
      fireEvent.click(reflectButtons[1]);

      expect(mockPush).toHaveBeenCalledWith('/reflection?dreamId=dream-2');
    });
  });

  // --------------------------------------------------------------------------
  // Animation Tests
  // --------------------------------------------------------------------------
  describe('animation props', () => {
    it('should accept animated prop without error', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );

      render(<DreamsCard animated={false} />);

      expect(screen.getByText('Active Dreams')).toBeInTheDocument();
    });

    it('should render correctly with animated=true', () => {
      vi.mocked(trpc.dreams.list.useQuery).mockReturnValue(
        createMockQueryResult([createMockDream()])
      );

      render(<DreamsCard animated={true} />);

      expect(screen.getByText('Active Dreams')).toBeInTheDocument();
    });
  });
});
