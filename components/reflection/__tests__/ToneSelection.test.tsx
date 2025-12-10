import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import ToneSelection from '../ToneSelection';

// Mock GlowButton
vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
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

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('ToneSelection', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders all three tone options', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
      expect(screen.getByText('Gentle Clarity')).toBeInTheDocument();
      expect(screen.getByText('Luminous Intensity')).toBeInTheDocument();
    });

    test('renders tone labels from TONES constant', () => {
      render(<ToneSelection selectedTone="gentle" onSelect={mockOnSelect} />);
      // These are the exact labels from the TONES constant
      expect(screen.getByText('Sacred Fusion')).toBeInTheDocument();
      expect(screen.getByText('Gentle Clarity')).toBeInTheDocument();
      expect(screen.getByText('Luminous Intensity')).toBeInTheDocument();
    });

    test('renders label text', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Choose the voice of your reflection')).toBeInTheDocument();
    });

    test('renders radiogroup with correct aria-label', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-label', 'Reflection tone selection');
    });

    test('renders radiogroup with aria-required', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-required', 'true');
    });

    test('shows sparkle indicator for selected tone (fusion)', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      // Look for the sparkle emoji indicator
      const fusionButton = screen.getByText('Sacred Fusion').closest('button');
      expect(fusionButton).toContainHTML('✨');
    });

    test('shows sparkle indicator for selected tone (gentle)', () => {
      render(<ToneSelection selectedTone="gentle" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByText('Gentle Clarity').closest('button');
      expect(gentleButton).toContainHTML('✨');
    });

    test('shows sparkle indicator for selected tone (intense)', () => {
      render(<ToneSelection selectedTone="intense" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByText('Luminous Intensity').closest('button');
      expect(intenseButton).toContainHTML('✨');
    });

    test('does not show sparkle indicator for unselected tones', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByText('Gentle Clarity').closest('button');
      expect(gentleButton).not.toContainHTML('✨');
    });

    test('shows ring styling for selected tone', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const fusionButton = screen.getByText('Sacred Fusion').closest('button');
      expect(fusionButton).toHaveClass('ring-2');
    });
  });

  describe('interactions', () => {
    test('calls onSelect when unselected tone clicked', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).toHaveBeenCalledWith('gentle');
    });

    test('does not call onSelect when clicking already selected tone', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Sacred Fusion'));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    test('calls onSelect with intense when intense clicked', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Luminous Intensity'));
      expect(mockOnSelect).toHaveBeenCalledWith('intense');
    });

    test('triggers haptic feedback when tone selected', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    test('does not trigger haptic feedback when clicking selected tone', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      fireEvent.click(screen.getByText('Sacred Fusion'));
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    test('respects disabled prop - does not call onSelect', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} disabled={true} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    test('buttons have disabled attribute when disabled', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} disabled={true} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    test('does not trigger haptic feedback when disabled', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} disabled={true} />);
      fireEvent.click(screen.getByText('Gentle Clarity'));
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('tone description', () => {
    test('shows description for fusion tone in aria-live region', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      expect(screen.getByText('Balanced wisdom where all voices become one')).toBeInTheDocument();
    });

    test('shows description for gentle tone in aria-live region', () => {
      render(<ToneSelection selectedTone="gentle" onSelect={mockOnSelect} />);
      expect(screen.getByText('Soft wisdom that illuminates gently')).toBeInTheDocument();
    });

    test('shows description for intense tone in aria-live region', () => {
      render(<ToneSelection selectedTone="intense" onSelect={mockOnSelect} />);
      expect(screen.getByText('Piercing truth that burns away illusions')).toBeInTheDocument();
    });

    test('description has aria-live polite attribute', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const description = document.querySelector('.tone-description');
      expect(description).toHaveAttribute('aria-live', 'polite');
    });

    test('description has aria-atomic true attribute', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const description = document.querySelector('.tone-description');
      expect(description).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('button variants', () => {
    test('uses secondary variant for unselected tones', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByText('Gentle Clarity').closest('button');
      expect(gentleButton).toHaveAttribute('data-variant', 'secondary');
    });

    test('uses primary variant for selected gentle tone', () => {
      render(<ToneSelection selectedTone="gentle" onSelect={mockOnSelect} />);
      const gentleButton = screen.getByText('Gentle Clarity').closest('button');
      expect(gentleButton).toHaveAttribute('data-variant', 'primary');
    });

    test('uses cosmic variant for selected fusion tone', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const fusionButton = screen.getByText('Sacred Fusion').closest('button');
      expect(fusionButton).toHaveAttribute('data-variant', 'cosmic');
    });

    test('uses cosmic variant for selected intense tone', () => {
      render(<ToneSelection selectedTone="intense" onSelect={mockOnSelect} />);
      const intenseButton = screen.getByText('Luminous Intensity').closest('button');
      expect(intenseButton).toHaveAttribute('data-variant', 'cosmic');
    });
  });

  describe('container classes', () => {
    test('has tone-selection container class', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const container = document.querySelector('.tone-selection');
      expect(container).toBeInTheDocument();
    });

    test('has tone-label class', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const label = document.querySelector('.tone-label');
      expect(label).toBeInTheDocument();
    });

    test('has tone-buttons class', () => {
      render(<ToneSelection selectedTone="fusion" onSelect={mockOnSelect} />);
      const buttons = document.querySelector('.tone-buttons');
      expect(buttons).toBeInTheDocument();
    });
  });
});
