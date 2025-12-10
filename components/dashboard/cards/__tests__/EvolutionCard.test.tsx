import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import EvolutionCard from '../EvolutionCard';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    evolution: {
      list: { useQuery: vi.fn() },
      checkEligibility: { useQuery: vi.fn() },
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

interface MockEvolutionReport {
  id: string;
  evolution: string;
  reflection_count: number;
  created_at: string;
  dreams?: { title: string };
}

const createMockEvolutionReport = (
  overrides: Partial<MockEvolutionReport> = {}
): MockEvolutionReport => ({
  id: 'report-1',
  evolution: 'Your growth insights and evolution analysis...',
  reflection_count: 4,
  created_at: '2025-01-15T10:00:00.000Z',
  dreams: { title: 'Test Dream' },
  ...overrides,
});

interface MockReportsResponse {
  reports: MockEvolutionReport[];
  total: number;
}

const createMockReportsResponse = (
  reports: MockEvolutionReport[] = [],
  total?: number
): MockReportsResponse => ({
  reports,
  total: total ?? reports.length,
});

interface MockEligibility {
  eligible: boolean;
  reason?: string;
}

const createMockEligibility = (overrides: Partial<MockEligibility> = {}): MockEligibility => ({
  eligible: false,
  reason: 'Create at least 4 reflections on a dream to generate an evolution report.',
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('EvolutionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render card with title "Evolution Insights"', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility())
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Evolution Insights')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility())
      );

      render(<EvolutionCard className="custom-class" />);

      const card = document.querySelector('.evolution-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Loading State Tests
  // --------------------------------------------------------------------------
  describe('loading state', () => {
    it('should show loading state when reports query is loading', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(createMockLoadingResult());
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility())
      );

      render(<EvolutionCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });

    it('should show loading state when eligibility query is loading', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockLoadingResult()
      );

      render(<EvolutionCard />);

      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });
  });

  // --------------------------------------------------------------------------
  // With Reports Tests
  // --------------------------------------------------------------------------
  describe('with reports', () => {
    beforeEach(() => {
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );
    });

    it('should render report preview card when has reports', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Latest Report')).toBeInTheDocument();
    });

    it('should show "Latest Report" label', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Latest Report')).toBeInTheDocument();
    });

    it('should show report date formatted (month, day)', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([
            createMockEvolutionReport({ created_at: '2025-01-15T10:00:00.000Z' }),
          ])
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Jan 15')).toBeInTheDocument();
    });

    it('should show evolution preview text via MarkdownPreview', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([
            createMockEvolutionReport({
              evolution: 'Your evolution journey shows great progress...',
            }),
          ])
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should show reflection count meta', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([createMockEvolutionReport({ reflection_count: 8 })])
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByText('8 reflections analyzed')).toBeInTheDocument();
    });

    it('should show dream title meta if available', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([
            createMockEvolutionReport({ dreams: { title: 'Career Growth' } }),
          ])
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Career Growth')).toBeInTheDocument();
    });

    it('should show "View all reports" link', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );

      render(<EvolutionCard />);

      expect(screen.getByRole('button', { name: /view all reports/i })).toBeInTheDocument();
    });

    it('should show "View Reports" button', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );

      render(<EvolutionCard />);

      expect(screen.getByRole('button', { name: 'View Reports' })).toBeInTheDocument();
    });

    it('should show fallback text when evolution is empty', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([createMockEvolutionReport({ evolution: '' })])
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByText('View report')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Without Reports - Eligible Tests
  // --------------------------------------------------------------------------
  describe('without reports - eligible', () => {
    it('should show "Ready to Generate" status', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Ready to Generate')).toBeInTheDocument();
    });

    it('should show eligibility message', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      expect(
        screen.getByText(/You can generate your first evolution report based on your reflections/i)
      ).toBeInTheDocument();
    });

    it('should show "Generate Report" button', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument();
    });

    it('should apply eligible status class', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      const statusElement = document.querySelector('.evolution-status--eligible');
      expect(statusElement).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Without Reports - Not Eligible Tests
  // --------------------------------------------------------------------------
  describe('without reports - not eligible', () => {
    it('should show "Keep Reflecting" status', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Keep Reflecting')).toBeInTheDocument();
    });

    it('should show reason from eligibility data', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockEligibility({
            eligible: false,
            reason: 'Need 4 reflections on a dream',
          })
        )
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Need 4 reflections on a dream')).toBeInTheDocument();
    });

    it('should show default reason when no reason provided', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false, reason: undefined }))
      );

      render(<EvolutionCard />);

      expect(
        screen.getByText(
          /Create at least 4 reflections on a dream to generate an evolution report/i
        )
      ).toBeInTheDocument();
    });

    it('should show progress bar toward first report', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('Progress to First Report')).toBeInTheDocument();
    });

    it('should show progress count', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      expect(screen.getByText('0 of 4')).toBeInTheDocument();
    });

    it('should show "Create Reflections" button', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      expect(screen.getByRole('button', { name: 'Create Reflections' })).toBeInTheDocument();
    });

    it('should apply ineligible status class', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      const statusElement = document.querySelector('.evolution-status--ineligible');
      expect(statusElement).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Interactions Tests
  // --------------------------------------------------------------------------
  describe('interactions', () => {
    it('should navigate to /evolution/{id} on report preview click', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(
          createMockReportsResponse([createMockEvolutionReport({ id: 'report-123' })])
        )
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      const previewCard = document.querySelector('.report-preview-card');
      fireEvent.click(previewCard!);

      expect(mockPush).toHaveBeenCalledWith('/evolution/report-123');
    });

    it('should navigate to /evolution on "View all reports" click', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      const viewAllLink = screen.getByRole('button', { name: /view all reports/i });
      fireEvent.click(viewAllLink);

      expect(mockPush).toHaveBeenCalledWith('/evolution');
    });

    it('should navigate to /evolution on "View Reports" button click', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      const viewReportsButton = screen.getByRole('button', { name: 'View Reports' });
      fireEvent.click(viewReportsButton);

      expect(mockPush).toHaveBeenCalledWith('/evolution');
    });

    it('should navigate to /evolution on "Generate Report" button click', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: true }))
      );

      render(<EvolutionCard />);

      const generateButton = screen.getByRole('button', { name: 'Generate Report' });
      fireEvent.click(generateButton);

      expect(mockPush).toHaveBeenCalledWith('/evolution');
    });

    it('should navigate to /dreams on "Create Reflections" button click', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility({ eligible: false }))
      );

      render(<EvolutionCard />);

      const createButton = screen.getByRole('button', { name: 'Create Reflections' });
      fireEvent.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/dreams');
    });
  });

  // --------------------------------------------------------------------------
  // Animation Tests
  // --------------------------------------------------------------------------
  describe('animation props', () => {
    it('should accept animated prop without error', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility())
      );

      render(<EvolutionCard animated={false} />);

      expect(screen.getByText('Evolution Insights')).toBeInTheDocument();
    });

    it('should render correctly with animated=true', () => {
      vi.mocked(trpc.evolution.list.useQuery).mockReturnValue(
        createMockQueryResult(createMockReportsResponse([createMockEvolutionReport()]))
      );
      vi.mocked(trpc.evolution.checkEligibility.useQuery).mockReturnValue(
        createMockQueryResult(createMockEligibility())
      );

      render(<EvolutionCard animated={true} />);

      expect(screen.getByText('Evolution Insights')).toBeInTheDocument();
    });
  });
});
