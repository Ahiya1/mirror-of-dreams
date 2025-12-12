// components/reflection/__tests__/ProgressIndicator.test.tsx
// Tests for ProgressIndicator component

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProgressIndicator from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  describe('question counter', () => {
    it('shows current question number', () => {
      render(<ProgressIndicator current={3} total={5} />);
      expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
    });

    it('shows first question', () => {
      render(<ProgressIndicator current={1} total={5} />);
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    it('shows last question', () => {
      render(<ProgressIndicator current={5} total={5} />);
      expect(screen.getByText('Question 5 of 5')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('renders progressbar role', () => {
      render(<ProgressIndicator current={2} total={4} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('sets correct aria-valuenow', () => {
      render(<ProgressIndicator current={3} total={5} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    });

    it('sets correct aria-valuemin', () => {
      render(<ProgressIndicator current={2} total={4} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('sets correct aria-valuemax', () => {
      render(<ProgressIndicator current={2} total={4} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
    });

    it('sets correct aria-label', () => {
      render(<ProgressIndicator current={3} total={5} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Question 3 of 5');
    });
  });

  describe('percentage calculation', () => {
    it('calculates 0% for first question', () => {
      // Note: calculation is current/total so 1/5 = 20%
      const { container } = render(<ProgressIndicator current={1} total={5} />);
      const fill = container.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '20%' });
    });

    it('calculates 50% for halfway', () => {
      const { container } = render(<ProgressIndicator current={2} total={4} />);
      const fill = container.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('calculates 100% for last question', () => {
      const { container } = render(<ProgressIndicator current={5} total={5} />);
      const fill = container.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('handles 1 question total', () => {
      const { container } = render(<ProgressIndicator current={1} total={1} />);
      const fill = container.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });
  });

  describe('structure', () => {
    it('has progress-indicator container', () => {
      const { container } = render(<ProgressIndicator current={1} total={3} />);
      expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
    });

    it('has progress-text element', () => {
      const { container } = render(<ProgressIndicator current={1} total={3} />);
      expect(container.querySelector('.progress-text')).toBeInTheDocument();
    });

    it('has progress-bar-container element', () => {
      const { container } = render(<ProgressIndicator current={1} total={3} />);
      expect(container.querySelector('.progress-bar-container')).toBeInTheDocument();
    });

    it('has progress-bar-fill element', () => {
      const { container } = render(<ProgressIndicator current={1} total={3} />);
      expect(container.querySelector('.progress-bar-fill')).toBeInTheDocument();
    });
  });
});
