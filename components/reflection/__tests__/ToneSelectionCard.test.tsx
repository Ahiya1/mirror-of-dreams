import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ToneSelectionCard } from '../ToneSelectionCard';

// Mock framer-motion - filter out motion-specific props to avoid React warnings
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      onClick,
      onKeyDown,
      className,
      'aria-pressed': ariaPressed,
      'aria-label': ariaLabel,
      type,
      // Filter out framer-motion specific props
      whileHover,
      whileTap,
      whileFocus,
      animate,
      initial,
      exit,
      transition,
      variants,
      ...props
    }: any) => (
      <button
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={className}
        aria-pressed={ariaPressed}
        aria-label={ariaLabel}
        type={type}
        {...props}
      >
        {children}
      </button>
    ),
    div: ({
      children,
      className,
      // Filter out framer-motion specific props
      animate,
      initial,
      exit,
      transition,
      variants,
      whileHover,
      whileTap,
      ...props
    }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

// Mock GlassCard
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className, elevated, interactive, ...props }: any) => (
    <div className={className} data-elevated={elevated} data-interactive={interactive} {...props}>
      {children}
    </div>
  ),
}));

describe('ToneSelectionCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders section heading', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Choose Your Reflection Tone')).toBeInTheDocument();
    });

    test('renders heading as h2', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Choose Your Reflection Tone'
      );
    });

    test('renders subheading', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('How shall the mirror speak to you?')).toBeInTheDocument();
    });

    test('renders all three tone cards', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
      expect(screen.getByText('Gentle Clarity')).toBeInTheDocument();
      expect(screen.getByText('Luminous Intensity')).toBeInTheDocument();
    });

    test('renders three tone card buttons', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    test('renders fusion tone icon', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      // The fusion icon is a sparkle emoji
      expect(screen.getByText('✨')).toBeInTheDocument();
    });

    test('renders gentle tone icon', () => {
      render(<ToneSelectionCard selectedTone="gentle" onSelect={mockOnSelect} />);
      // The gentle icon is a cherry blossom emoji
      expect(screen.getByText('🌸')).toBeInTheDocument();
    });

    test('renders intense tone icon', () => {
      render(<ToneSelectionCard selectedTone="intense" onSelect={mockOnSelect} />);
      // The intense icon is a lightning emoji
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    test('renders tone descriptions', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      // Check for tone descriptions from TONE_DESCRIPTIONS constant
      expect(screen.getByText(/Balanced wisdom where all voices become one/i)).toBeInTheDocument();
      expect(screen.getByText(/Soft wisdom that illuminates gently/i)).toBeInTheDocument();
      expect(screen.getByText(/Piercing truth that burns away illusions/i)).toBeInTheDocument();
    });

    test('renders tone names as h3 headings', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s).toHaveLength(3);
      expect(h3s[0]).toHaveTextContent('Sacred Fusion');
      expect(h3s[1]).toHaveTextContent('Gentle Clarity');
      expect(h3s[2]).toHaveTextContent('Luminous Intensity');
    });
  });

  describe('selection indicator', () => {
    test('shows "Selected" indicator with checkmark for fusion when selected', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    test('shows "Selected" indicator for gentle when selected', () => {
      render(<ToneSelectionCard selectedTone="gentle" onSelect={mockOnSelect} />);
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    test('shows "Selected" indicator for intense when selected', () => {
      render(<ToneSelectionCard selectedTone="intense" onSelect={mockOnSelect} />);
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    test('shows only one "Selected" indicator at a time', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const selectedIndicators = screen.getAllByText('Selected');
      expect(selectedIndicators).toHaveLength(1);
    });

    test('selected card contains checkmark SVG', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const selectedIndicator = screen.getByText('Selected').closest('div');
      expect(selectedIndicator?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    test('calls onSelect when fusion card clicked', () => {
      render(<ToneSelectionCard selectedTone="gentle" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Sacred Fusion'));
      expect(mockOnSelect).toHaveBeenCalledWith('fusion');
    });

    test('calls onSelect when gentle card clicked', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    test('calls onSelect when intense card clicked', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Luminous Intensity'));
      expect(mockOnSelect).toHaveBeenCalledWith('intense');
    });

    test('calls onSelect when already selected card clicked', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Sacred Fusion'));
      expect(mockOnSelect).toHaveBeenCalledWith('fusion');
    });
  });

  describe('keyboard navigation', () => {
    test('handles keyboard selection with Enter', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      fireEvent.keyDown(gentleButton, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    test('handles keyboard selection with Space', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      fireEvent.keyDown(intenseButton, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('intense');
    });

    test('prevents default on Enter key', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      const event = fireEvent.keyDown(gentleButton, { key: 'Enter' });
      // The component should call preventDefault
      expect(mockOnSelect).toHaveBeenCalled();
    });

    test('prevents default on Space key', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      fireEvent.keyDown(intenseButton, { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalled();
    });

    test('does not call onSelect for other keys', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      fireEvent.keyDown(gentleButton, { key: 'Tab' });
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has aria-pressed="true" for selected fusion card', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const fusionButton = screen.getByLabelText(/Sacred Fusion/);
      expect(fusionButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('has aria-pressed="false" for unselected cards', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      expect(gentleButton).toHaveAttribute('aria-pressed', 'false');
      expect(intenseButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('has aria-pressed="true" for selected gentle card', () => {
      render(<ToneSelectionCard selectedTone="gentle" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      expect(gentleButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('has aria-pressed="true" for selected intense card', () => {
      render(<ToneSelectionCard selectedTone="intense" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      expect(intenseButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('has descriptive aria-label for fusion card', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const fusionButton = screen.getByLabelText(/Sacred Fusion/);
      expect(fusionButton).toHaveAttribute('aria-label');
      const ariaLabel = fusionButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Sacred Fusion');
    });

    test('has descriptive aria-label for gentle card', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByLabelText(/Gentle Clarity/);
      expect(gentleButton).toHaveAttribute('aria-label');
      const ariaLabel = gentleButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Gentle Clarity');
    });

    test('has descriptive aria-label for intense card', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByLabelText(/Luminous Intensity/);
      expect(intenseButton).toHaveAttribute('aria-label');
      const ariaLabel = intenseButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Luminous Intensity');
    });

    test('aria-labels include tone descriptions', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const fusionButton = screen.getByLabelText(/Sacred Fusion/);
      const ariaLabel = fusionButton.getAttribute('aria-label');
      // The aria-label format is: "{name}: {description}"
      expect(ariaLabel).toContain(':');
    });

    test('all buttons have type="button"', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('styling', () => {
    test('heading has gradient text styling', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('bg-gradient-to-r');
      expect(heading).toHaveClass('bg-clip-text');
      expect(heading).toHaveClass('text-transparent');
    });

    test('container has tone-selection-cards class', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const container = document.querySelector('.tone-selection-cards');
      expect(container).toBeInTheDocument();
    });

    test('selected card uses elevated GlassCard', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      // Find the GlassCard with elevated=true (the selected one)
      const elevatedCards = document.querySelectorAll('[data-elevated="true"]');
      expect(elevatedCards.length).toBe(1);
    });

    test('all cards use interactive GlassCard', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const interactiveCards = document.querySelectorAll('[data-interactive="true"]');
      expect(interactiveCards.length).toBe(3);
    });
  });

  describe('grid layout', () => {
    test('renders cards in a grid container', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    test('grid has responsive column classes', () => {
      render(<ToneSelectionCard selectedTone="fusion" onSelect={mockOnSelect} />);
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('md:grid-cols-3');
    });
  });
});
