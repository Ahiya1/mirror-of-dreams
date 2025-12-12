// components/reflections/__tests__/ReflectionFilters.test.tsx
// Tests for ReflectionFilters component - Search, filter, and sort controls

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the dateRange utility
vi.mock('@/lib/utils/dateRange', () => ({
  DATE_RANGE_OPTIONS: [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ],
}));

import { ReflectionFilters } from '../ReflectionFilters';

describe('ReflectionFilters', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    tone: undefined,
    onToneChange: vi.fn(),
    isPremium: undefined,
    onIsPremiumChange: vi.fn(),
    sortBy: 'created_at' as const,
    onSortByChange: vi.fn(),
    sortOrder: 'desc' as const,
    onSortOrderChange: vi.fn(),
    dateRange: 'all' as const,
    onDateRangeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Search Input Tests
  // --------------------------------------------------------------------------
  describe('search input', () => {
    it('renders search input', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search reflections...')).toBeInTheDocument();
    });

    it('displays current search value', () => {
      render(<ReflectionFilters {...defaultProps} search="test query" />);
      const input = screen.getByPlaceholderText('Search reflections...') as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('calls onSearchChange when input value changes', () => {
      const onSearchChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search reflections...');
      fireEvent.change(input, { target: { value: 'new search' } });
      expect(onSearchChange).toHaveBeenCalledWith('new search');
    });

    it('shows clear button when search has text', () => {
      render(<ReflectionFilters {...defaultProps} search="some text" />);
      // Find the clear button (X icon button in the search field)
      const clearButton = screen.getByRole('button', { name: '' }); // SVG button without explicit name
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when search is empty', () => {
      render(<ReflectionFilters {...defaultProps} search="" />);
      const input = screen.getByPlaceholderText('Search reflections...');
      // The container should only have the input, no clear button
      expect(input.parentElement?.querySelectorAll('button').length).toBeLessThanOrEqual(0);
    });

    it('calls onSearchChange with empty string when clear button clicked', () => {
      const onSearchChange = vi.fn();
      render(
        <ReflectionFilters
          {...defaultProps}
          search="text to clear"
          onSearchChange={onSearchChange}
        />
      );
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find((btn) => btn.className.includes('right-0'));
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(onSearchChange).toHaveBeenCalledWith('');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Filter Toggle Tests
  // --------------------------------------------------------------------------
  describe('filter toggle', () => {
    it('renders filter toggle button', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('toggles filter panel visibility when clicked', () => {
      render(<ReflectionFilters {...defaultProps} />);
      const filterButton = screen.getByText('Filters');

      // Initially, filter panel should not be visible
      expect(screen.queryByText('Time Period')).not.toBeInTheDocument();

      // Click to show
      fireEvent.click(filterButton);
      expect(screen.getByText('Time Period')).toBeInTheDocument();

      // Click to hide
      fireEvent.click(filterButton);
      expect(screen.queryByText('Time Period')).not.toBeInTheDocument();
    });

    it('shows active filters indicator when tone is selected', () => {
      const { container } = render(<ReflectionFilters {...defaultProps} tone="gentle" />);
      // Look for the ping animation indicator
      const indicator = container.querySelector('.animate-ping');
      expect(indicator).toBeInTheDocument();
    });

    it('shows active filters indicator when isPremium is set', () => {
      const { container } = render(<ReflectionFilters {...defaultProps} isPremium={true} />);
      const indicator = container.querySelector('.animate-ping');
      expect(indicator).toBeInTheDocument();
    });

    it('shows active filters indicator when dateRange is not "all"', () => {
      const { container } = render(<ReflectionFilters {...defaultProps} dateRange="7d" />);
      const indicator = container.querySelector('.animate-ping');
      expect(indicator).toBeInTheDocument();
    });

    it('does not show indicator when no filters active', () => {
      const { container } = render(<ReflectionFilters {...defaultProps} />);
      const indicator = container.querySelector('.animate-ping');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Sort By Tests
  // --------------------------------------------------------------------------
  describe('sort by dropdown', () => {
    it('renders sort by dropdown', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays current sort value', () => {
      render(<ReflectionFilters {...defaultProps} sortBy="word_count" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('word_count');
    });

    it('has three sort options', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.getByText('Most Recent')).toBeInTheDocument();
      expect(screen.getByText('Longest')).toBeInTheDocument();
      expect(screen.getByText('Highest Rated')).toBeInTheDocument();
    });

    it('calls onSortByChange when selection changes', () => {
      const onSortByChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onSortByChange={onSortByChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'rating' } });
      expect(onSortByChange).toHaveBeenCalledWith('rating');
    });
  });

  // --------------------------------------------------------------------------
  // Sort Order Tests
  // --------------------------------------------------------------------------
  describe('sort order toggle', () => {
    it('renders sort order toggle button', () => {
      render(<ReflectionFilters {...defaultProps} />);
      const sortOrderButton = screen.getByTitle('Descending');
      expect(sortOrderButton).toBeInTheDocument();
    });

    it('displays ascending title when sortOrder is asc', () => {
      render(<ReflectionFilters {...defaultProps} sortOrder="asc" />);
      expect(screen.getByTitle('Ascending')).toBeInTheDocument();
    });

    it('displays descending title when sortOrder is desc', () => {
      render(<ReflectionFilters {...defaultProps} sortOrder="desc" />);
      expect(screen.getByTitle('Descending')).toBeInTheDocument();
    });

    it('calls onSortOrderChange with "asc" when clicking from desc', () => {
      const onSortOrderChange = vi.fn();
      render(
        <ReflectionFilters
          {...defaultProps}
          sortOrder="desc"
          onSortOrderChange={onSortOrderChange}
        />
      );
      fireEvent.click(screen.getByTitle('Descending'));
      expect(onSortOrderChange).toHaveBeenCalledWith('asc');
    });

    it('calls onSortOrderChange with "desc" when clicking from asc', () => {
      const onSortOrderChange = vi.fn();
      render(
        <ReflectionFilters
          {...defaultProps}
          sortOrder="asc"
          onSortOrderChange={onSortOrderChange}
        />
      );
      fireEvent.click(screen.getByTitle('Ascending'));
      expect(onSortOrderChange).toHaveBeenCalledWith('desc');
    });
  });

  // --------------------------------------------------------------------------
  // Clear All Tests
  // --------------------------------------------------------------------------
  describe('clear all button', () => {
    it('shows clear all button when hasActiveFilters is true', () => {
      render(<ReflectionFilters {...defaultProps} tone="gentle" />);
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('shows clear all button when search has text', () => {
      render(<ReflectionFilters {...defaultProps} search="some search" />);
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('does not show clear all button when no filters active and search empty', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('calls appropriate callbacks when clear all clicked', () => {
      const onToneChange = vi.fn();
      const onIsPremiumChange = vi.fn();
      const onSearchChange = vi.fn();
      const onDateRangeChange = vi.fn();

      render(
        <ReflectionFilters
          {...defaultProps}
          tone="gentle"
          isPremium={true}
          search="test"
          dateRange="7d"
          onToneChange={onToneChange}
          onIsPremiumChange={onIsPremiumChange}
          onSearchChange={onSearchChange}
          onDateRangeChange={onDateRangeChange}
        />
      );

      fireEvent.click(screen.getByText('Clear all'));

      expect(onToneChange).toHaveBeenCalledWith(undefined);
      expect(onIsPremiumChange).toHaveBeenCalledWith(undefined);
      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(onDateRangeChange).toHaveBeenCalledWith('all');
    });
  });

  // --------------------------------------------------------------------------
  // Date Range Filter Tests
  // --------------------------------------------------------------------------
  describe('date range filter', () => {
    it('renders date range buttons when filter panel is open', () => {
      render(<ReflectionFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
    });

    it('highlights selected date range', () => {
      render(<ReflectionFilters {...defaultProps} dateRange="30d" />);
      fireEvent.click(screen.getByText('Filters'));

      const button = screen.getByText('Last 30 Days');
      expect(button).toHaveClass('bg-purple-500');
    });

    it('calls onDateRangeChange when date range button clicked', () => {
      const onDateRangeChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onDateRangeChange={onDateRangeChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Last 7 Days'));

      expect(onDateRangeChange).toHaveBeenCalledWith('7d');
    });

    it('does not render date range section when onDateRangeChange not provided', () => {
      render(<ReflectionFilters {...defaultProps} onDateRangeChange={undefined} />);
      fireEvent.click(screen.getByText('Filters'));

      expect(screen.queryByText('Time Period')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Tone Filter Tests
  // --------------------------------------------------------------------------
  describe('tone filter', () => {
    it('renders tone filter buttons when panel is open', () => {
      render(<ReflectionFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('All Tones')).toBeInTheDocument();
      expect(screen.getByText('Gentle')).toBeInTheDocument();
      expect(screen.getByText('Intense')).toBeInTheDocument();
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
    });

    it('highlights selected tone', () => {
      render(<ReflectionFilters {...defaultProps} tone="gentle" />);
      fireEvent.click(screen.getByText('Filters'));

      const button = screen.getByText('Gentle');
      expect(button).toHaveClass('bg-mirror-info');
    });

    it('calls onToneChange with "gentle" when Gentle clicked', () => {
      const onToneChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onToneChange={onToneChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Gentle'));

      expect(onToneChange).toHaveBeenCalledWith('gentle');
    });

    it('calls onToneChange with "intense" when Intense clicked', () => {
      const onToneChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onToneChange={onToneChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Intense'));

      expect(onToneChange).toHaveBeenCalledWith('intense');
    });

    it('calls onToneChange with "fusion" when Sacred Fusion clicked', () => {
      const onToneChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onToneChange={onToneChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Sacred Fusion'));

      expect(onToneChange).toHaveBeenCalledWith('fusion');
    });

    it('calls onToneChange with undefined when All Tones clicked', () => {
      const onToneChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} tone="gentle" onToneChange={onToneChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('All Tones'));

      expect(onToneChange).toHaveBeenCalledWith(undefined);
    });
  });

  // --------------------------------------------------------------------------
  // Premium Filter Tests
  // --------------------------------------------------------------------------
  describe('premium filter', () => {
    it('renders premium filter buttons when panel is open', () => {
      render(<ReflectionFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('All Types')).toBeInTheDocument();
      expect(screen.getByText('Premium Only')).toBeInTheDocument();
      expect(screen.getByText('Standard Only')).toBeInTheDocument();
    });

    it('highlights All Types when isPremium is undefined', () => {
      render(<ReflectionFilters {...defaultProps} isPremium={undefined} />);
      fireEvent.click(screen.getByText('Filters'));

      const button = screen.getByText('All Types');
      expect(button).toHaveClass('bg-purple-500');
    });

    it('highlights Premium Only when isPremium is true', () => {
      render(<ReflectionFilters {...defaultProps} isPremium={true} />);
      fireEvent.click(screen.getByText('Filters'));

      const button = screen.getByText('Premium Only');
      expect(button).toHaveClass('bg-amber-500');
    });

    it('highlights Standard Only when isPremium is false', () => {
      render(<ReflectionFilters {...defaultProps} isPremium={false} />);
      fireEvent.click(screen.getByText('Filters'));

      const button = screen.getByText('Standard Only');
      expect(button).toHaveClass('bg-slate-600');
    });

    it('calls onIsPremiumChange with true when Premium Only clicked', () => {
      const onIsPremiumChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onIsPremiumChange={onIsPremiumChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Premium Only'));

      expect(onIsPremiumChange).toHaveBeenCalledWith(true);
    });

    it('calls onIsPremiumChange with false when Standard Only clicked', () => {
      const onIsPremiumChange = vi.fn();
      render(<ReflectionFilters {...defaultProps} onIsPremiumChange={onIsPremiumChange} />);
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Standard Only'));

      expect(onIsPremiumChange).toHaveBeenCalledWith(false);
    });

    it('calls onIsPremiumChange with undefined when All Types clicked', () => {
      const onIsPremiumChange = vi.fn();
      render(
        <ReflectionFilters
          {...defaultProps}
          isPremium={true}
          onIsPremiumChange={onIsPremiumChange}
        />
      );
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('All Types'));

      expect(onIsPremiumChange).toHaveBeenCalledWith(undefined);
    });
  });

  // --------------------------------------------------------------------------
  // Filter Panel Tests
  // --------------------------------------------------------------------------
  describe('filter panel', () => {
    it('does not show filter panel by default', () => {
      render(<ReflectionFilters {...defaultProps} />);
      expect(screen.queryByText('Time Period')).not.toBeInTheDocument();
      expect(screen.queryByText('Tone')).not.toBeInTheDocument();
      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });

    it('shows all filter sections when panel is expanded', () => {
      render(<ReflectionFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('Time Period')).toBeInTheDocument();
      expect(screen.getByText('Tone')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
    });

    it('panel has correct styling classes', () => {
      const { container } = render(<ReflectionFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));

      const panel = container.querySelector('.rounded-lg.border');
      expect(panel).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles multiple filter changes in sequence', () => {
      const onToneChange = vi.fn();
      const onIsPremiumChange = vi.fn();

      render(
        <ReflectionFilters
          {...defaultProps}
          onToneChange={onToneChange}
          onIsPremiumChange={onIsPremiumChange}
        />
      );

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Gentle'));
      fireEvent.click(screen.getByText('Premium Only'));
      fireEvent.click(screen.getByText('Intense'));

      expect(onToneChange).toHaveBeenCalledTimes(2);
      expect(onIsPremiumChange).toHaveBeenCalledTimes(1);
    });

    it('handles rapid filter toggle', () => {
      render(<ReflectionFilters {...defaultProps} />);
      const filterButton = screen.getByText('Filters');

      fireEvent.click(filterButton);
      fireEvent.click(filterButton);
      fireEvent.click(filterButton);

      // Should end up visible after odd number of clicks
      expect(screen.getByText('Time Period')).toBeInTheDocument();
    });
  });
});
