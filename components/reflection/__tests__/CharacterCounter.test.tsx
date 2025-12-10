import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CharacterCounter from '../CharacterCounter';

describe('CharacterCounter', () => {
  describe('display', () => {
    test('shows current count', () => {
      render(<CharacterCounter current={50} max={200} />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    test('shows max count', () => {
      render(<CharacterCounter current={50} max={200} />);
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    test('shows separator between counts', () => {
      render(<CharacterCounter current={50} max={200} />);
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    test('displays zero as current count', () => {
      render(<CharacterCounter current={0} max={100} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('displays large numbers correctly', () => {
      render(<CharacterCounter current={9999} max={10000} />);
      expect(screen.getByText('9999')).toBeInTheDocument();
      expect(screen.getByText('10000')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    test('renders progress bar element', () => {
      render(<CharacterCounter current={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    test('has correct aria-valuenow', () => {
      render(<CharacterCounter current={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    test('has correct aria-valuemin', () => {
      render(<CharacterCounter current={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    test('has correct aria-valuemax', () => {
      render(<CharacterCounter current={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '200');
    });

    test('has accessible label', () => {
      render(<CharacterCounter current={75} max={100} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Character count: 75 of 100');
    });
  });

  describe('container classes', () => {
    test('has character-counter class', () => {
      render(<CharacterCounter current={50} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).toBeInTheDocument();
    });
  });

  describe('warning state', () => {
    test('adds warning class at exactly 85% (default threshold)', () => {
      render(<CharacterCounter current={170} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).toHaveClass('warning');
    });

    test('adds warning class above 85%', () => {
      render(<CharacterCounter current={180} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).toHaveClass('warning');
    });

    test('does not add warning class below 85%', () => {
      render(<CharacterCounter current={100} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).not.toHaveClass('warning');
    });

    test('does not add warning class at exactly 84%', () => {
      render(<CharacterCounter current={168} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).not.toHaveClass('warning');
    });

    test('uses custom warning threshold', () => {
      render(<CharacterCounter current={150} max={200} warning={140} />);
      const container = document.querySelector('.character-counter');
      expect(container).toHaveClass('warning');
    });

    test('does not add warning when error state is active', () => {
      render(<CharacterCounter current={200} max={200} />);
      const container = document.querySelector('.character-counter');
      // When at 100%, it should have error but not warning
      expect(container).toHaveClass('error');
      // The class should not include "warning" when "error" is applied
      expect(container?.className).not.toMatch(/\bwarning\b/);
    });
  });

  describe('error state', () => {
    test('adds error class at exactly 100%', () => {
      render(<CharacterCounter current={200} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).toHaveClass('error');
    });

    test('adds error class when exceeding max', () => {
      render(<CharacterCounter current={250} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).toHaveClass('error');
    });

    test('does not add error class below max', () => {
      render(<CharacterCounter current={199} max={200} />);
      const container = document.querySelector('.character-counter');
      expect(container).not.toHaveClass('error');
    });
  });

  describe('screen reader announcements', () => {
    test('announces limit reached when at max', () => {
      render(<CharacterCounter current={200} max={200} />);
      expect(screen.getByText('Character limit reached')).toBeInTheDocument();
    });

    test('announces limit reached when exceeding max', () => {
      render(<CharacterCounter current={250} max={200} />);
      expect(screen.getByText('Character limit reached')).toBeInTheDocument();
    });

    test('does not announce limit when below max', () => {
      render(<CharacterCounter current={199} max={200} />);
      expect(screen.queryByText('Character limit reached')).not.toBeInTheDocument();
    });

    test('screen reader announcement has aria-live polite', () => {
      render(<CharacterCounter current={200} max={200} />);
      const announcement = screen.getByText('Character limit reached');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    test('screen reader announcement has aria-atomic true', () => {
      render(<CharacterCounter current={200} max={200} />);
      const announcement = screen.getByText('Character limit reached');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    test('screen reader announcement is visually hidden', () => {
      render(<CharacterCounter current={200} max={200} />);
      const announcement = screen.getByText('Character limit reached');
      expect(announcement).toHaveClass('sr-only');
    });
  });
});
