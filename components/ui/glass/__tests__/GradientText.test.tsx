import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { GradientText } from '../GradientText';

describe('GradientText', () => {
  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GradientText>Hello World</GradientText>);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    test('renders as a span element', () => {
      render(<GradientText>Span</GradientText>);
      const element = screen.getByText('Span');
      expect(element.tagName).toBe('SPAN');
    });

    test('renders complex children', () => {
      render(
        <GradientText>
          Text with <strong>bold</strong>
        </GradientText>
      );
      expect(screen.getByText(/Text with/)).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });
  });

  describe('gradient variants', () => {
    test('applies cosmic gradient by default', () => {
      render(<GradientText>Cosmic</GradientText>);
      expect(screen.getByText('Cosmic')).toHaveClass('gradient-text-cosmic');
    });

    test('applies cosmic gradient when specified', () => {
      render(<GradientText gradient="cosmic">Cosmic</GradientText>);
      expect(screen.getByText('Cosmic')).toHaveClass('gradient-text-cosmic');
    });

    test('applies primary gradient', () => {
      render(<GradientText gradient="primary">Primary</GradientText>);
      expect(screen.getByText('Primary')).toHaveClass('gradient-text-amethyst');
    });

    test('applies dream gradient', () => {
      render(<GradientText gradient="dream">Dream</GradientText>);
      expect(screen.getByText('Dream')).toHaveClass('gradient-text-ethereal');
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<GradientText className="custom-class">Text</GradientText>);
      expect(screen.getByText('Text')).toHaveClass('custom-class');
    });

    test('merges custom className with gradient class', () => {
      render(<GradientText className="text-2xl">Text</GradientText>);
      const element = screen.getByText('Text');
      expect(element).toHaveClass('text-2xl');
      expect(element).toHaveClass('gradient-text-cosmic');
    });

    test('preserves gradient class when custom className is applied', () => {
      render(
        <GradientText gradient="dream" className="font-bold">
          Text
        </GradientText>
      );
      const element = screen.getByText('Text');
      expect(element).toHaveClass('font-bold');
      expect(element).toHaveClass('gradient-text-ethereal');
    });
  });

  describe('edge cases', () => {
    test('handles empty children', () => {
      render(<GradientText>{''}</GradientText>);
      // Should render without crashing
      expect(document.querySelector('.gradient-text-cosmic')).toBeInTheDocument();
    });

    test('handles number children', () => {
      render(<GradientText>{42}</GradientText>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
