import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import VisualizationCard from '../VisualizationCard';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    visualizations: {
      list: { useQuery: vi.fn() },
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

// Mock MarkdownPreview
vi.mock('@/components/shared/MarkdownPreview', () => ({
  MarkdownPreview: ({ content, maxLength }: any) => (
    <span data-testid="markdown-preview">{maxLength ? content.slice(0, maxLength) : content}</span>
  ),
}));

// Import trpc after mock
import { trpc } from '@/lib/trpc';
import { createMockQueryResult, createMockLoadingResult } from '@/test/helpers';

// ============================================================================
// Test Data Factories
// ============================================================================

interface MockVisualization {
  id: string;
  narrative: string;
  style: 'achievement' | 'spiral' | 'synthesis';
  reflection_count: number;
  created_at: string;
  dreams?: { title: string };
}

const createMockVisualization = (
  overrides: Partial<MockVisualization> = {}
): MockVisualization => ({
  id: 'viz-1',
  narrative: 'Your visualization narrative describing your dream as achieved...',
  style: 'synthesis',
  reflection_count: 3,
  created_at: '2025-01-15T10:00:00.000Z',
  dreams: { title: 'Test Dream' },
  ...overrides,
});

interface MockVisualizationsResponse {
  items: MockVisualization[];
  total: number;
}

const createMockVisualizationsResponse = (
  items: MockVisualization[] = [],
  total?: number
): MockVisualizationsResponse => ({
  items,
  total: total ?? items.length,
});

// ============================================================================
// Tests
// ============================================================================

describe('VisualizationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render card with title "Visualizations"', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      expect(screen.getByText('Visualizations')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard className="custom-class" />);

      const card = document.querySelector('.visualization-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('should show loading state when query is loading', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(createMockLoadingResult());

      render(<VisualizationCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });
  });

  // --------------------------------------------------------------------------
  // With Visualization Tests
  // --------------------------------------------------------------------------
  describe('with visualization', () => {
    it('should render visualization preview card', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      const previewCard = document.querySelector('.viz-preview-card');
      expect(previewCard).toBeInTheDocument();
    });

    it('should show style icon for achievement style', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ style: 'achievement' })])
        )
      );

      render(<VisualizationCard />);

      const iconElement = document.querySelector('.preview-icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDFD4\uFE0F');
    });

    it('should show style icon for spiral style', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ style: 'spiral' })])
        )
      );

      render(<VisualizationCard />);

      const iconElement = document.querySelector('.preview-icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDF00');
    });

    it('should show style icon for synthesis style', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ style: 'synthesis' })])
        )
      );

      render(<VisualizationCard />);

      const iconElement = document.querySelector('.preview-icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDF0C');
    });

    it('should show default icon for unknown style', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ style: 'unknown' as any })])
        )
      );

      render(<VisualizationCard />);

      const iconElement = document.querySelector('.preview-icon');
      expect(iconElement?.textContent).toBe('\uD83C\uDF0C');
    });

    it('should show style label capitalized', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ style: 'achievement' })])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByText(/Achievement Style/)).toBeInTheDocument();
    });

    it('should show visualization date formatted', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([
            createMockVisualization({ created_at: '2025-01-15T10:00:00.000Z' }),
          ])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByText('Jan 15')).toBeInTheDocument();
    });

    it('should show narrative preview text via MarkdownPreview', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([
            createMockVisualization({ narrative: 'Your dream has manifested...' }),
          ])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should show reflection count', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ reflection_count: 7 })])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByText('7 reflections')).toBeInTheDocument();
    });

    it('should show dream title if available', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([
            createMockVisualization({ dreams: { title: 'Career Growth' } }),
          ])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByText('Career Growth')).toBeInTheDocument();
    });

    it('should not show dream title when not available', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ dreams: undefined })])
        )
      );

      render(<VisualizationCard />);

      // Should still render but without dream title
      expect(screen.queryByText('Test Dream')).not.toBeInTheDocument();
    });

    it('should show "View all visualizations" link', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      expect(screen.getByRole('button', { name: /view all visualizations/i })).toBeInTheDocument();
    });

    it('should show "View All" button when has visualizations', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
    });

    it('should show fallback text when narrative is empty', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ narrative: '' })])
        )
      );

      render(<VisualizationCard />);

      expect(screen.getByText('View visualization')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Empty State Tests
  // --------------------------------------------------------------------------
  describe('empty state', () => {
    it('should show "Create Your First Visualization" message', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      expect(screen.getByText('Create Your First Visualization')).toBeInTheDocument();
    });

    it('should show instructional message in empty state', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      expect(
        screen.getByText(
          /Generate your first visualization to experience your dream as already achieved/i
        )
      ).toBeInTheDocument();
    });

    it('should show "Create Visualization" button in empty state', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      expect(screen.getByRole('button', { name: 'Create Visualization' })).toBeInTheDocument();
    });

    it('should render empty state container', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      const emptyState = document.querySelector('.visualization-empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Interactions Tests
  // --------------------------------------------------------------------------
  describe('interactions', () => {
    it('should navigate to /visualizations/{id} on preview click', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockVisualizationsResponse([createMockVisualization({ id: 'viz-123' })])
        )
      );

      render(<VisualizationCard />);

      const previewCard = document.querySelector('.viz-preview-card');
      fireEvent.click(previewCard!);

      expect(mockPush).toHaveBeenCalledWith('/visualizations/viz-123');
    });

    it('should navigate to /visualizations on "View all visualizations" click', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      const viewAllLink = screen.getByRole('button', { name: /view all visualizations/i });
      fireEvent.click(viewAllLink);

      expect(mockPush).toHaveBeenCalledWith('/visualizations');
    });

    it('should navigate to /visualizations on "View All" button click', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      const viewAllButton = screen.getByRole('button', { name: 'View All' });
      fireEvent.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith('/visualizations');
    });

    it('should navigate to /visualizations on "Create Visualization" button click', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      const createButton = screen.getByRole('button', { name: 'Create Visualization' });
      fireEvent.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/visualizations');
    });
  });

  // --------------------------------------------------------------------------
  // Button Variant Tests
  // --------------------------------------------------------------------------
  describe('button variants', () => {
    it('should show secondary variant button when has visualizations', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard />);

      const button = screen.getByRole('button', { name: 'View All' });
      expect(button).toHaveAttribute('data-variant', 'secondary');
    });

    it('should show cosmic variant button when no visualizations', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      const button = screen.getByRole('button', { name: 'Create Visualization' });
      expect(button).toHaveAttribute('data-variant', 'cosmic');
    });
  });

  // --------------------------------------------------------------------------
  // Animation Tests
  // --------------------------------------------------------------------------
  describe('animation props', () => {
    it('should accept animated prop without error', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard animated={false} />);

      expect(screen.getByText('Visualizations')).toBeInTheDocument();
    });

    it('should render correctly with animated=true', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()]))
      );

      render(<VisualizationCard animated={true} />);

      expect(screen.getByText('Visualizations')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Data Handling Tests
  // --------------------------------------------------------------------------
  describe('data handling', () => {
    it('should handle undefined items gracefully', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult({ items: undefined as any, total: 0 })
      );

      render(<VisualizationCard />);

      // Should render empty state
      expect(screen.getByText('Create Your First Visualization')).toBeInTheDocument();
    });

    it('should handle null data gracefully', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(null as any)
      );

      render(<VisualizationCard />);

      // Should render empty state
      expect(screen.getByText('Create Your First Visualization')).toBeInTheDocument();
    });

    it('should correctly determine hasVisualizations from total', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([createMockVisualization()], 5))
      );

      render(<VisualizationCard />);

      // Should show "View All" button (hasVisualizations is true)
      expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Query Parameters Tests
  // --------------------------------------------------------------------------
  describe('query parameters', () => {
    it('should query with page=1 and limit=1', () => {
      vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockVisualizationsResponse([]))
      );

      render(<VisualizationCard />);

      expect(trpc.visualizations.list.useQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 1,
      });
    });
  });

  // --------------------------------------------------------------------------
  // All Style Types Tests
  // --------------------------------------------------------------------------
  describe('all style types', () => {
    const styleTests = [
      { style: 'achievement', icon: '\uD83C\uDFD4\uFE0F', label: 'Achievement Style' },
      { style: 'spiral', icon: '\uD83C\uDF00', label: 'Spiral Style' },
      { style: 'synthesis', icon: '\uD83C\uDF0C', label: 'Synthesis Style' },
    ] as const;

    styleTests.forEach(({ style, icon, label }) => {
      it(`should correctly display ${style} style`, () => {
        vi.mocked(trpc.visualizations.list.useQuery).mockReturnValue(
          createMockQueryResult(
            createMockVisualizationsResponse([createMockVisualization({ style })])
          )
        );

        render(<VisualizationCard />);

        const iconElement = document.querySelector('.preview-icon');
        expect(iconElement?.textContent).toBe(icon);
        expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      });
    });
  });
});
