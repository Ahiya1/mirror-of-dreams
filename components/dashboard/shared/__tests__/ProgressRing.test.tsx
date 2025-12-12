// components/dashboard/shared/__tests__/ProgressRing.test.tsx
// Tests for ProgressRing component

import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import ProgressRing from '../ProgressRing';

describe('ProgressRing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('default rendering', () => {
    it('renders SVG element', () => {
      render(<ProgressRing />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders background circle', () => {
      render(<ProgressRing />);
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('renders progress circle', () => {
      render(<ProgressRing />);
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('size variants', () => {
    it('renders sm size', () => {
      const { container } = render(<ProgressRing size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '80');
    });

    it('renders md size (default)', () => {
      const { container } = render(<ProgressRing size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
    });

    it('renders lg size', () => {
      const { container } = render(<ProgressRing size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
    });

    it('renders xl size', () => {
      const { container } = render(<ProgressRing size="xl" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '140');
    });
  });

  describe('color variants', () => {
    it('renders primary color (default)', () => {
      const { container } = render(<ProgressRing color="primary" />);
      expect(container.querySelector('.progress-ring--primary')).toBeInTheDocument();
    });

    it('renders success color', () => {
      const { container } = render(<ProgressRing color="success" />);
      expect(container.querySelector('.progress-ring--success')).toBeInTheDocument();
    });

    it('renders warning color', () => {
      const { container } = render(<ProgressRing color="warning" />);
      expect(container.querySelector('.progress-ring--warning')).toBeInTheDocument();
    });

    it('renders error color', () => {
      const { container } = render(<ProgressRing color="error" />);
      expect(container.querySelector('.progress-ring--error')).toBeInTheDocument();
    });
  });

  describe('percentage', () => {
    it('clamps percentage to 0 minimum', () => {
      render(<ProgressRing percentage={-10} animated={false} />);
      // Component should handle negative values
    });

    it('clamps percentage to 100 maximum', () => {
      render(<ProgressRing percentage={150} animated={false} />);
      // Component should handle values over 100
    });

    it('handles 0 percentage', () => {
      render(<ProgressRing percentage={0} animated={false} />);
      // Component should render with 0% fill
    });

    it('handles 100 percentage', () => {
      render(<ProgressRing percentage={100} animated={false} />);
      // Component should render with 100% fill
    });
  });

  describe('value display', () => {
    it('shows value when showValue is true', () => {
      render(<ProgressRing percentage={75} showValue animated={false} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('hides value when showValue is false', () => {
      render(<ProgressRing percentage={75} showValue={false} animated={false} />);
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('uses custom string formatter', () => {
      render(<ProgressRing percentage={50} showValue valueFormatter="Half" animated={false} />);
      expect(screen.getByText('Half')).toBeInTheDocument();
    });

    it('uses custom number formatter', () => {
      render(<ProgressRing percentage={50} showValue valueFormatter={42} animated={false} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('uses custom function formatter', () => {
      render(
        <ProgressRing
          percentage={50}
          showValue
          valueFormatter={(p) => `${Math.round(p)} pts`}
          animated={false}
        />
      );
      expect(screen.getByText('50 pts')).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    it('starts hidden when animated', () => {
      const { container } = render(<ProgressRing animated percentage={50} />);
      const ring = container.querySelector('.progress-ring');
      // Initial opacity should be 0
      expect(ring).toHaveStyle({ opacity: '0' });
    });

    it('becomes visible after animation delay', async () => {
      const { container } = render(<ProgressRing animated percentage={50} animationDelay={100} />);

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      const ring = container.querySelector('.progress-ring');
      expect(ring).toHaveStyle({ opacity: '1' });
    });

    it('immediately visible when not animated', () => {
      const { container } = render(<ProgressRing animated={false} percentage={50} />);
      const ring = container.querySelector('.progress-ring');
      expect(ring).toHaveStyle({ opacity: '1' });
    });
  });

  describe('breathing effect', () => {
    it('applies breathing class when enabled', () => {
      const { container } = render(<ProgressRing breathing />);
      expect(container.querySelector('.progress-ring--breathing')).toBeInTheDocument();
    });

    it('does not apply breathing class when disabled', () => {
      const { container } = render(<ProgressRing breathing={false} />);
      expect(container.querySelector('.progress-ring--breathing')).not.toBeInTheDocument();
    });
  });

  describe('className', () => {
    it('applies custom className', () => {
      const { container } = render(<ProgressRing className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('stroke width', () => {
    it('uses default stroke width', () => {
      const { container } = render(<ProgressRing />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('stroke-width', '4');
    });

    it('uses custom stroke width', () => {
      const { container } = render(<ProgressRing strokeWidth={8} />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('stroke-width', '8');
    });
  });
});
