// components/dreams/__tests__/EvolutionHistory.test.tsx
// Tests for EvolutionHistory component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

import { EvolutionHistory } from '../EvolutionHistory';

describe('EvolutionHistory', () => {
  const mockEvents = [
    {
      id: 'ev-1',
      created_at: '2025-01-15T10:00:00Z',
      old_title: 'Learn Guitar',
      old_description: 'Learn to play',
      new_title: 'Master Guitar',
      new_description: 'Master playing',
      evolution_reflection: 'I want to go deeper',
    },
    {
      id: 'ev-2',
      created_at: '2025-02-20T10:00:00Z',
      old_title: 'Master Guitar',
      old_description: 'Master playing',
      new_title: 'Perform Live',
      new_description: 'Master playing',
      evolution_reflection: 'Ready to share with others',
    },
  ];

  describe('visibility', () => {
    it('renders when events provided', () => {
      render(<EvolutionHistory events={mockEvents} />);
      expect(screen.getByText('Evolution History (2)')).toBeInTheDocument();
    });

    it('returns null when no events', () => {
      const { container } = render(<EvolutionHistory events={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('title and count', () => {
    it('shows correct event count', () => {
      render(<EvolutionHistory events={mockEvents} />);
      expect(screen.getByText('Evolution History (2)')).toBeInTheDocument();
    });

    it('shows count of 1 for single event', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      expect(screen.getByText('Evolution History (1)')).toBeInTheDocument();
    });
  });

  describe('event rendering', () => {
    it('renders all events', () => {
      render(<EvolutionHistory events={mockEvents} />);
      expect(screen.getAllByTestId('glass-card')).toHaveLength(2);
    });

    it('shows old title with strikethrough', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      const oldTitle = screen.getByText('Learn Guitar');
      expect(oldTitle).toHaveClass('line-through');
    });

    it('shows new title', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      expect(screen.getByText('Master Guitar')).toBeInTheDocument();
    });

    it('shows evolution reflection', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      expect(screen.getByText('"I want to go deeper"')).toBeInTheDocument();
    });

    it('formats date correctly', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument();
    });
  });

  describe('description change', () => {
    it('shows description updated when descriptions differ', () => {
      render(<EvolutionHistory events={[mockEvents[0]]} />);
      expect(screen.getByText('Description updated')).toBeInTheDocument();
    });

    it('does not show description updated when same', () => {
      render(<EvolutionHistory events={[mockEvents[1]]} />);
      expect(screen.queryByText('Description updated')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EvolutionHistory events={mockEvents} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has heading with Sparkles icon', () => {
      render(<EvolutionHistory events={mockEvents} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Evolution History');
    });
  });

  describe('timeline', () => {
    it('renders timeline dots for each event', () => {
      const { container } = render(<EvolutionHistory events={mockEvents} />);
      // Each event has a relative positioned container with the dot
      const events = container.querySelectorAll('.relative.pl-10');
      expect(events).toHaveLength(2);
    });
  });
});
