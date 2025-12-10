import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

// Mock framer-motion to simplify testing
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({
        children,
        className,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }) => (
        <div className={className} data-testid="progress-segment" {...props}>
          {children}
        </div>
      ),
    },
  };
});

import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  describe('rendering', () => {
    test('renders progress bar', () => {
      render(<ProgressBar currentStep={2} totalSteps={4} />);
      // Should render 4 segments
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments).toHaveLength(4);
    });

    test('renders correct number of segments for different totals', () => {
      render(<ProgressBar currentStep={1} totalSteps={6} />);
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments).toHaveLength(6);
    });

    test('renders step counter text', () => {
      render(<ProgressBar currentStep={2} totalSteps={4} />);
      expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
    });

    test('updates step counter for different current steps', () => {
      render(<ProgressBar currentStep={3} totalSteps={5} />);
      expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
    });
  });

  describe('step states', () => {
    test('applies current step classes to active step', () => {
      render(<ProgressBar currentStep={2} totalSteps={4} />);
      const segments = screen.getAllByTestId('progress-segment');
      // Second segment (index 1) should be current
      expect(segments[1]).toHaveClass('bg-mirror-purple');
      expect(segments[1]).toHaveClass('shadow-lg');
    });

    test('applies completed step classes to previous steps', () => {
      render(<ProgressBar currentStep={3} totalSteps={4} />);
      const segments = screen.getAllByTestId('progress-segment');
      // First two segments should be completed
      expect(segments[0]).toHaveClass('bg-mirror-purple/80');
      expect(segments[1]).toHaveClass('bg-mirror-purple/80');
    });

    test('applies pending step classes to future steps', () => {
      render(<ProgressBar currentStep={2} totalSteps={4} />);
      const segments = screen.getAllByTestId('progress-segment');
      // Third and fourth segments should be pending
      expect(segments[2]).toHaveClass('bg-white/20');
      expect(segments[3]).toHaveClass('bg-white/20');
    });

    test('first step as current has no completed steps', () => {
      render(<ProgressBar currentStep={1} totalSteps={3} />);
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments[0]).toHaveClass('bg-mirror-purple');
      expect(segments[1]).toHaveClass('bg-white/20');
      expect(segments[2]).toHaveClass('bg-white/20');
    });

    test('last step as current has all previous steps completed', () => {
      render(<ProgressBar currentStep={4} totalSteps={4} />);
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments[0]).toHaveClass('bg-mirror-purple/80');
      expect(segments[1]).toHaveClass('bg-mirror-purple/80');
      expect(segments[2]).toHaveClass('bg-mirror-purple/80');
      expect(segments[3]).toHaveClass('bg-mirror-purple');
    });
  });

  describe('styling', () => {
    test('applies base segment classes', () => {
      render(<ProgressBar currentStep={1} totalSteps={2} />);
      const segments = screen.getAllByTestId('progress-segment');
      segments.forEach((segment) => {
        expect(segment).toHaveClass('h-2');
        expect(segment).toHaveClass('rounded-full');
      });
    });

    test('step counter has correct text styling', () => {
      render(<ProgressBar currentStep={1} totalSteps={4} />);
      const stepText = screen.getByText(/Step 1 of 4/);
      expect(stepText).toHaveClass('text-sm');
      expect(stepText).toHaveClass('font-light');
      expect(stepText).toHaveClass('text-white/60');
    });
  });

  describe('custom className', () => {
    test('applies custom className to container', () => {
      render(<ProgressBar currentStep={1} totalSteps={3} className="custom-class" />);
      const container = screen.getByText(/Step 1 of 3/).parentElement;
      expect(container).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<ProgressBar currentStep={1} totalSteps={3} className="mt-4" />);
      const container = screen.getByText(/Step 1 of 3/).parentElement;
      expect(container).toHaveClass('mt-4');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
    });
  });

  describe('edge cases', () => {
    test('handles single step progress', () => {
      render(<ProgressBar currentStep={1} totalSteps={1} />);
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments).toHaveLength(1);
      expect(segments[0]).toHaveClass('bg-mirror-purple');
    });

    test('handles many steps', () => {
      render(<ProgressBar currentStep={5} totalSteps={10} />);
      const segments = screen.getAllByTestId('progress-segment');
      expect(segments).toHaveLength(10);
    });
  });
});
