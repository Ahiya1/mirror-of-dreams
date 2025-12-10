import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReflectionsCard from '../ReflectionsCard';

import { trpc } from '@/lib/trpc';
import {
  createMockQueryResult,
  createMockLoadingResult,
  createMockErrorResult,
} from '@/test/helpers';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    reflections: {
      list: { useQuery: vi.fn() },
    },
  },
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
  GlowButton: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  CosmicLoader: ({ label, size }: any) => (
    <div data-testid="cosmic-loader" data-size={size}>
      {label}
    </div>
  ),
}));

// Mock ReflectionItem component
vi.mock('@/components/dashboard/shared/ReflectionItem', () => ({
  default: ({ reflection, index, animated, animationDelay }: any) => (
    <div
      data-testid={`reflection-item-${reflection.id}`}
      data-index={index}
      data-animated={animated}
      data-animation-delay={animationDelay}
    >
      <span>{reflection.title || reflection.dreams?.title || 'Reflection'}</span>
      <span>{reflection.content?.slice(0, 50)}</span>
    </div>
  ),
}));

// Import trpc after mock

// ============================================================================
// Test Data Factories
// ============================================================================

interface MockReflection {
  id: string;
  title?: string;
  content?: string;
  created_at: string;
  tone: string;
  is_premium: boolean;
  dreams?: { title: string };
}

const createMockReflection = (overrides: Partial<MockReflection> = {}): MockReflection => ({
  id: 'reflection-1',
  title: 'Test Reflection',
  content: 'Reflection content preview text that shows what the user reflected on...',
  created_at: new Date().toISOString(),
  tone: 'fusion',
  is_premium: false,
  dreams: { title: 'Test Dream' },
  ...overrides,
});

interface MockReflectionsResponse {
  items: MockReflection[];
  total?: number;
  page?: number;
  limit?: number;
}

const createMockReflectionsResponse = (
  items: MockReflection[] = [],
  total?: number
): MockReflectionsResponse => ({
  items,
  total: total ?? items.length,
  page: 1,
  limit: 3,
});

// ============================================================================
// Tests
// ============================================================================

describe('ReflectionsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render card with title "Recent Reflections"', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([createMockReflection()]))
      );

      render(<ReflectionsCard />);

      expect(screen.getByText('Recent Reflections')).toBeInTheDocument();
    });

    it('should render "View All" header action link to /reflections', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([createMockReflection()]))
      );

      render(<ReflectionsCard />);

      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', '/reflections');
    });

    it('should apply custom className', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([createMockReflection()]))
      );

      render(<ReflectionsCard className="custom-class" />);

      const card = document.querySelector('.reflections-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('should show CosmicLoader when isLoading', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<ReflectionsCard />);

      expect(screen.getByTestId('cosmic-loader')).toBeInTheDocument();
    });

    it('should show "Loading reflections..." text', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<ReflectionsCard />);

      expect(screen.getByText('Loading reflections...')).toBeInTheDocument();
    });

    it('should apply loading class to card', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<ReflectionsCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });
  });

  // --------------------------------------------------------------------------
  // Error State Tests
  // --------------------------------------------------------------------------
  describe('error state', () => {
    it('should show error overlay when query has error', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockErrorResult(new Error('Failed to fetch reflections'))
      );

      render(<ReflectionsCard />);

      expect(screen.getByText('Unable to load data')).toBeInTheDocument();
    });

    it('should apply error class to card', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockErrorResult(new Error('Network error'))
      );

      render(<ReflectionsCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--error');
    });
  });

  // --------------------------------------------------------------------------
  // Empty State Tests
  // --------------------------------------------------------------------------
  describe('empty state', () => {
    it('should render "No Reflections Yet" message when no reflections', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([]))
      );

      render(<ReflectionsCard />);

      expect(screen.getByText('No Reflections Yet')).toBeInTheDocument();
    });

    it('should show "Start Reflecting" CTA button', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([]))
      );

      render(<ReflectionsCard />);

      expect(screen.getByRole('button', { name: 'Start Reflecting' })).toBeInTheDocument();
    });

    it('should have CTA wrapped in link to /reflection', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([]))
      );

      render(<ReflectionsCard />);

      const link = screen.getByRole('link', { name: 'Start Reflecting' });
      expect(link).toHaveAttribute('href', '/reflection');
    });

    it('should show instructional text in empty state', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([]))
      );

      render(<ReflectionsCard />);

      expect(screen.getByText('Create your first reflection to get started.')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // With Reflections Data Tests
  // --------------------------------------------------------------------------
  describe('with reflections data', () => {
    it('should render up to 3 reflections', () => {
      const reflections = [
        createMockReflection({ id: 'ref-1', title: 'Reflection One' }),
        createMockReflection({ id: 'ref-2', title: 'Reflection Two' }),
        createMockReflection({ id: 'ref-3', title: 'Reflection Three' }),
        createMockReflection({ id: 'ref-4', title: 'Reflection Four' }),
      ];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard />);

      expect(screen.getByTestId('reflection-item-ref-1')).toBeInTheDocument();
      expect(screen.getByTestId('reflection-item-ref-2')).toBeInTheDocument();
      expect(screen.getByTestId('reflection-item-ref-3')).toBeInTheDocument();
      expect(screen.queryByTestId('reflection-item-ref-4')).not.toBeInTheDocument();
    });

    it('should render ReflectionItem for each reflection', () => {
      const reflections = [
        createMockReflection({ id: 'ref-1', title: 'First Reflection' }),
        createMockReflection({ id: 'ref-2', title: 'Second Reflection' }),
      ];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard />);

      expect(screen.getByTestId('reflection-item-ref-1')).toBeInTheDocument();
      expect(screen.getByTestId('reflection-item-ref-2')).toBeInTheDocument();
    });

    it('should pass correct props to ReflectionItem', () => {
      const reflections = [createMockReflection({ id: 'ref-1', title: 'Test Reflection' })];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard animated={true} />);

      const reflectionItem = screen.getByTestId('reflection-item-ref-1');
      expect(reflectionItem).toHaveAttribute('data-index', '0');
      expect(reflectionItem).toHaveAttribute('data-animated', 'true');
      expect(reflectionItem).toHaveAttribute('data-animation-delay', '0');
    });

    it('should pass animation delay based on index', () => {
      const reflections = [
        createMockReflection({ id: 'ref-1' }),
        createMockReflection({ id: 'ref-2' }),
        createMockReflection({ id: 'ref-3' }),
      ];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard animated={true} />);

      expect(screen.getByTestId('reflection-item-ref-1')).toHaveAttribute(
        'data-animation-delay',
        '0'
      );
      expect(screen.getByTestId('reflection-item-ref-2')).toHaveAttribute(
        'data-animation-delay',
        '100'
      );
      expect(screen.getByTestId('reflection-item-ref-3')).toHaveAttribute(
        'data-animation-delay',
        '200'
      );
    });

    it('should pass animated=false when card is not animated', () => {
      const reflections = [createMockReflection({ id: 'ref-1' })];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard animated={false} />);

      const reflectionItem = screen.getByTestId('reflection-item-ref-1');
      expect(reflectionItem).toHaveAttribute('data-animated', 'false');
    });

    it('should handle reflections without id using index as key', () => {
      const reflections = [createMockReflection({ id: '', title: 'Reflection without ID' })];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard />);

      // Should still render without error
      expect(screen.getByText('Reflection without ID')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Query Parameters Tests
  // --------------------------------------------------------------------------
  describe('query parameters', () => {
    it('should query with page=1 and limit=3', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([]))
      );

      render(<ReflectionsCard />);

      expect(trpc.reflections.list.useQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 3,
      });
    });
  });

  // --------------------------------------------------------------------------
  // Animation Tests
  // --------------------------------------------------------------------------
  describe('animation props', () => {
    it('should accept animated prop without error', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([createMockReflection()]))
      );

      render(<ReflectionsCard animated={false} />);

      expect(screen.getByText('Recent Reflections')).toBeInTheDocument();
    });

    it('should render correctly with animated=true', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse([createMockReflection()]))
      );

      render(<ReflectionsCard animated={true} />);

      expect(screen.getByText('Recent Reflections')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Data Handling Tests
  // --------------------------------------------------------------------------
  describe('data handling', () => {
    it('should handle undefined items gracefully', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult({ items: undefined as any })
      );

      render(<ReflectionsCard />);

      // Should render empty state
      expect(screen.getByText('No Reflections Yet')).toBeInTheDocument();
    });

    it('should handle null data gracefully', () => {
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(createMockQueryResult(null as any));

      render(<ReflectionsCard />);

      // Should render empty state
      expect(screen.getByText('No Reflections Yet')).toBeInTheDocument();
    });

    it('should show reflections with dream title', () => {
      const reflections = [
        createMockReflection({
          id: 'ref-1',
          title: undefined,
          dreams: { title: 'Career Growth Dream' },
        }),
      ];
      vi.mocked(trpc.reflections.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReflectionsResponse(reflections))
      );

      render(<ReflectionsCard />);

      expect(screen.getByText('Career Growth Dream')).toBeInTheDocument();
    });
  });
});
