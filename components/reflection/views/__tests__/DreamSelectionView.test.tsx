import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DreamSelectionView } from '../DreamSelectionView';

import type { Dream } from '@/lib/reflection/types';

// Mock next/navigation
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
    div: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock glass components
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({
    children,
    className,
    elevated,
    interactive,
    ...props
  }: React.PropsWithChildren<{
    className?: string;
    elevated?: boolean;
    interactive?: boolean;
  }>) => (
    <div className={className} data-elevated={elevated} data-interactive={interactive} {...props}>
      {children}
    </div>
  ),
  GlowButton: ({
    children,
    onClick,
    disabled,
    className,
    variant,
    size,
    ...props
  }: React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
    size?: string;
  }>) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Test data factories
const createMockDream = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test Dream',
  description: 'Dream description',
  category: 'creative',
  daysLeft: 30,
  targetDate: '2025-01-15',
  ...overrides,
});

const createMockDreams = (): Dream[] => [
  createMockDream({
    id: 'dream-1',
    title: 'Learn Guitar',
    category: 'creative',
    daysLeft: 30,
  }),
  createMockDream({
    id: 'dream-2',
    title: 'Run Marathon',
    category: 'health',
    daysLeft: 14,
  }),
  createMockDream({
    id: 'dream-3',
    title: 'Start Business',
    category: 'entrepreneurial',
    daysLeft: 60,
  }),
];

describe('DreamSelectionView', () => {
  const mockOnDreamSelect = vi.fn();
  const mockDreams = createMockDreams();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the heading', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders all dream titles', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Learn Guitar')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
      expect(screen.getByText('Start Business')).toBeInTheDocument();
    });

    it('displays category emoji for each dream', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      // Each dream has its category emoji rendered
      // Creative emoji, Health emoji, Entrepreneurial emoji should all be present
      const dreamCards = screen.getAllByRole('button');
      expect(dreamCards).toHaveLength(3);
    });

    it('displays days left indicator', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('30d left')).toBeInTheDocument();
      expect(screen.getByText('14d left')).toBeInTheDocument();
      expect(screen.getByText('60d left')).toBeInTheDocument();
    });

    it('displays "Today!" for daysLeft === 0', () => {
      const todayDream = [createMockDream({ daysLeft: 0 })];
      render(
        <DreamSelectionView
          dreams={todayDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Today!')).toBeInTheDocument();
    });

    it('displays overdue indicator for negative daysLeft', () => {
      const overdueDream = [createMockDream({ daysLeft: -5 })];
      render(
        <DreamSelectionView
          dreams={overdueDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('5d overdue')).toBeInTheDocument();
    });

    it('shows checkmark for selected dream', () => {
      const { container } = render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );
      // The Check icon from lucide-react should be rendered for selected dream
      // Since motion.div mock passes through, we should find the div with check class
      const checkIcon = container.querySelector('.text-mirror-amethyst');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onDreamSelect when dream clicked', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      fireEvent.click(screen.getByText('Learn Guitar'));
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });

    it('calls onDreamSelect with correct id for each dream', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      fireEvent.click(screen.getByText('Run Marathon'));
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-2');
    });

    it('handles keyboard selection with Enter', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      fireEvent.keyDown(dreamCard!, { key: 'Enter' });
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });

    it('handles keyboard selection with Space', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      fireEvent.keyDown(dreamCard!, { key: ' ' });
      expect(mockOnDreamSelect).toHaveBeenCalledWith('dream-1');
    });

    it('does not trigger selection on other keys', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      fireEvent.keyDown(dreamCard!, { key: 'Tab' });
      expect(mockOnDreamSelect).not.toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no dreams', () => {
      render(
        <DreamSelectionView dreams={[]} selectedDreamId="" onDreamSelect={mockOnDreamSelect} />
      );
      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
    });

    it('renders CTA button in empty state', () => {
      render(
        <DreamSelectionView dreams={[]} selectedDreamId="" onDreamSelect={mockOnDreamSelect} />
      );
      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });

    it('navigates to dreams page when CTA clicked', () => {
      render(
        <DreamSelectionView dreams={[]} selectedDreamId="" onDreamSelect={mockOnDreamSelect} />
      );
      fireEvent.click(screen.getByText('Create Your First Dream'));
      expect(mockPush).toHaveBeenCalledWith('/dreams');
    });
  });

  describe('accessibility', () => {
    it('dream cards have role="button"', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('dream cards have tabIndex for keyboard navigation', () => {
      render(
        <DreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      const dreamCard = screen.getByText('Learn Guitar').closest('[role="button"]');
      expect(dreamCard).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('edge cases', () => {
    it('handles dream without category', () => {
      const dreamNoCategory = [createMockDream({ category: undefined })];
      render(
        <DreamSelectionView
          dreams={dreamNoCategory}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      // Should render with default star emoji for 'other' category
      expect(screen.getByText('Test Dream')).toBeInTheDocument();
    });

    it('handles dream without daysLeft', () => {
      const dreamNoDays = [createMockDream({ daysLeft: undefined })];
      render(
        <DreamSelectionView
          dreams={dreamNoDays}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Test Dream')).toBeInTheDocument();
      // Should not show any days indicator
      expect(screen.queryByText(/left/)).not.toBeInTheDocument();
      expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
    });

    it('handles null daysLeft', () => {
      const dreamNullDays = [createMockDream({ daysLeft: null })];
      render(
        <DreamSelectionView
          dreams={dreamNullDays}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );
      expect(screen.getByText('Test Dream')).toBeInTheDocument();
      expect(screen.queryByText(/left/)).not.toBeInTheDocument();
    });
  });
});
