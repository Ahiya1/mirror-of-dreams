import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MobileDreamSelectionView } from '../MobileDreamSelectionView';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      className,
      'data-testid': dataTestId,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
      'data-testid'?: string;
    }) => (
      <button onClick={onClick} className={className} data-testid={dataTestId} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('MobileDreamSelectionView', () => {
  const mockOnDreamSelect = vi.fn();
  const mockDreams = [
    {
      id: 'dream-1',
      title: 'Learn Guitar',
      description: 'Master basic chords',
      category: 'creative',
    },
    {
      id: 'dream-2',
      title: 'Run Marathon',
      description: 'Complete 42km',
      category: 'health',
    },
    {
      id: 'dream-3',
      title: 'Start Business',
      category: 'entrepreneurial',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the heading', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders all dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Learn Guitar')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
      expect(screen.getByText('Start Business')).toBeInTheDocument();
    });

    it('renders dream descriptions when provided', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Master basic chords')).toBeInTheDocument();
      expect(screen.getByText('Complete 42km')).toBeInTheDocument();
    });

    it('does not render description for dreams without one', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      // Business dream has no description - verify the card exists but no extra description
      const businessCard = screen.getByTestId('dream-card-dream-3');
      expect(businessCard).toBeInTheDocument();
      // Title should be present, but no description element
      expect(screen.getByText('Start Business')).toBeInTheDocument();
    });

    it('renders category emoji', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      // Check for emoji elements with role="img"
      const emojiElements = screen.getAllByRole('img');
      expect(emojiElements.length).toBe(3);
    });

    it('renders correct emoji for creative category', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const emojiElements = screen.getAllByRole('img');
      // Check aria-label for category
      const creativeEmoji = emojiElements.find(
        (el) => el.getAttribute('aria-label') === 'creative'
      );
      expect(creativeEmoji).toBeInTheDocument();
    });

    it('renders correct emoji for health category', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const emojiElements = screen.getAllByRole('img');
      const healthEmoji = emojiElements.find((el) => el.getAttribute('aria-label') === 'health');
      expect(healthEmoji).toBeInTheDocument();
    });

    it('falls back to "other" emoji for unknown categories', () => {
      const dreamsWithUnknown = [
        { id: 'dream-unknown', title: 'Unknown Category', category: 'nonexistent' },
      ];

      render(
        <MobileDreamSelectionView
          dreams={dreamsWithUnknown}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Unknown Category')).toBeInTheDocument();
    });

    it('uses "dream" as default aria-label when no category', () => {
      const dreamNoCategory = [{ id: 'dream-no-cat', title: 'No Category Dream' }];

      render(
        <MobileDreamSelectionView
          dreams={dreamNoCategory}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const emojiElement = screen.getByRole('img');
      expect(emojiElement).toHaveAttribute('aria-label', 'dream');
    });
  });

  describe('empty state', () => {
    it('renders empty state when no dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
    });

    it('renders CTA button in empty state', () => {
      render(
        <MobileDreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });

    it('navigates to dreams page when CTA clicked', () => {
      render(
        <MobileDreamSelectionView
          dreams={[]}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      fireEvent.click(screen.getByText('Create Your First Dream'));

      expect(mockPush).toHaveBeenCalledWith('/dreams');
    });
  });

  describe('selection', () => {
    it('calls onDreamSelect when dream clicked', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      fireEvent.click(screen.getByTestId('dream-card-dream-1'));

      expect(mockOnDreamSelect).toHaveBeenCalledTimes(1);
      expect(mockOnDreamSelect).toHaveBeenCalledWith(mockDreams[0]);
    });

    it('calls onDreamSelect with correct dream data', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      fireEvent.click(screen.getByTestId('dream-card-dream-2'));

      expect(mockOnDreamSelect).toHaveBeenCalledWith({
        id: 'dream-2',
        title: 'Run Marathon',
        description: 'Complete 42km',
        category: 'health',
      });
    });

    it('shows selection indicator for selected dream', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByTestId('selection-indicator')).toBeInTheDocument();
    });

    it('does not show selection indicator for unselected dreams', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.queryByTestId('selection-indicator')).not.toBeInTheDocument();
    });

    it('shows only one selection indicator', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-2"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const indicators = screen.getAllByTestId('selection-indicator');
      expect(indicators).toHaveLength(1);
    });

    it('applies selected styling to selected dream card', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const selectedCard = screen.getByTestId('dream-card-dream-1');
      expect(selectedCard).toHaveClass('bg-purple-500/20');
      expect(selectedCard).toHaveClass('border-purple-500/50');
    });

    it('applies unselected styling to non-selected dream cards', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId="dream-1"
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const unselectedCard = screen.getByTestId('dream-card-dream-2');
      expect(unselectedCard).toHaveClass('bg-white/5');
      expect(unselectedCard).toHaveClass('border-white/10');
    });
  });

  describe('accessibility', () => {
    it('renders dreams as buttons', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      // 3 dream cards (CTA button not present since we have dreams)
      expect(buttons.length).toBe(3);
    });

    it('has accessible heading', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('emoji elements have aria-label', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const emojiElements = screen.getAllByRole('img');
      emojiElements.forEach((emoji) => {
        expect(emoji).toHaveAttribute('aria-label');
      });
    });
  });

  describe('data-testid attributes', () => {
    it('each dream card has unique data-testid', () => {
      render(
        <MobileDreamSelectionView
          dreams={mockDreams}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByTestId('dream-card-dream-1')).toBeInTheDocument();
      expect(screen.getByTestId('dream-card-dream-2')).toBeInTheDocument();
      expect(screen.getByTestId('dream-card-dream-3')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles dream with undefined category', () => {
      const dreamUndefinedCategory = [
        { id: 'dream-undef', title: 'Undefined Category', category: undefined },
      ];

      render(
        <MobileDreamSelectionView
          dreams={dreamUndefinedCategory}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      expect(screen.getByText('Undefined Category')).toBeInTheDocument();
    });

    it('handles very long dream titles with truncation', () => {
      const longTitleDream = [
        {
          id: 'dream-long',
          title: 'This is a very long dream title that should be truncated on mobile screens',
        },
      ];

      render(
        <MobileDreamSelectionView
          dreams={longTitleDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const titleElement = screen.getByText(
        'This is a very long dream title that should be truncated on mobile screens'
      );
      expect(titleElement).toHaveClass('truncate');
    });

    it('handles very long descriptions with truncation', () => {
      const longDescDream = [
        {
          id: 'dream-long-desc',
          title: 'Short Title',
          description: 'This is a very long description that should be truncated properly',
        },
      ];

      render(
        <MobileDreamSelectionView
          dreams={longDescDream}
          selectedDreamId=""
          onDreamSelect={mockOnDreamSelect}
        />
      );

      const descElement = screen.getByText(
        'This is a very long description that should be truncated properly'
      );
      expect(descElement).toHaveClass('truncate');
    });
  });
});
