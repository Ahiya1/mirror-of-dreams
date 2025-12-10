import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { DreamStatusIcon, DreamStatus } from '../DreamStatusIcon';

describe('DreamStatusIcon', () => {
  describe('rendering', () => {
    test('renders icon element', () => {
      render(<DreamStatusIcon status="active" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('renders as span element', () => {
      render(<DreamStatusIcon status="achieved" />);
      const element = screen.getByRole('img');
      expect(element.tagName).toBe('SPAN');
    });
  });

  describe('statuses', () => {
    const statusLabels: Record<DreamStatus, string> = {
      active: 'Active',
      achieved: 'Achieved',
      archived: 'Archived',
      released: 'Released',
    };

    Object.keys(statusLabels).forEach((status) => {
      test(`renders ${status} status icon`, () => {
        render(<DreamStatusIcon status={status as DreamStatus} />);
        const icon = screen.getByRole('img');
        expect(icon).toBeInTheDocument();
      });
    });

    Object.entries(statusLabels).forEach(([status, label]) => {
      test(`${status} status has correct aria-label: ${label}`, () => {
        render(<DreamStatusIcon status={status as DreamStatus} />);
        const icon = screen.getByRole('img');
        expect(icon).toHaveAttribute('aria-label', label);
      });
    });
  });

  describe('showLabel prop', () => {
    test('does not show label by default', () => {
      render(<DreamStatusIcon status="active" />);
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    test('shows label when showLabel is true', () => {
      render(<DreamStatusIcon status="active" showLabel />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('renders icon and label in flex container when showLabel is true', () => {
      render(<DreamStatusIcon status="achieved" showLabel />);
      const container = screen.getByText('Achieved').parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('gap-2');
    });

    test('all statuses show correct label', () => {
      const labels: Record<DreamStatus, string> = {
        active: 'Active',
        achieved: 'Achieved',
        archived: 'Archived',
        released: 'Released',
      };

      Object.entries(labels).forEach(([status, label]) => {
        const { unmount } = render(<DreamStatusIcon status={status as DreamStatus} showLabel />);
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('styling', () => {
    test('applies text-xl class to icon', () => {
      render(<DreamStatusIcon status="archived" />);
      expect(screen.getByRole('img')).toHaveClass('text-xl');
    });

    test('applies text-xl class to icon when showLabel is true', () => {
      render(<DreamStatusIcon status="released" showLabel />);
      expect(screen.getByRole('img')).toHaveClass('text-xl');
    });
  });

  describe('custom className', () => {
    test('applies custom className without showLabel', () => {
      render(<DreamStatusIcon status="active" className="custom-class" />);
      expect(screen.getByRole('img')).toHaveClass('custom-class');
    });

    test('applies custom className with showLabel', () => {
      render(<DreamStatusIcon status="achieved" className="custom-class" showLabel />);
      const container = screen.getByText('Achieved').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<DreamStatusIcon status="archived" className="ml-2" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('ml-2');
      expect(icon).toHaveClass('text-xl');
    });
  });

  describe('accessibility', () => {
    test('has role="img"', () => {
      render(<DreamStatusIcon status="released" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('has aria-label for accessibility', () => {
      render(<DreamStatusIcon status="active" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label');
      expect(icon.getAttribute('aria-label')).toBeTruthy();
    });

    test('active status icon is accessible', () => {
      render(<DreamStatusIcon status="active" />);
      expect(screen.getByRole('img', { name: 'Active' })).toBeInTheDocument();
    });

    test('achieved status icon is accessible', () => {
      render(<DreamStatusIcon status="achieved" />);
      expect(screen.getByRole('img', { name: 'Achieved' })).toBeInTheDocument();
    });

    test('archived status icon is accessible', () => {
      render(<DreamStatusIcon status="archived" />);
      expect(screen.getByRole('img', { name: 'Archived' })).toBeInTheDocument();
    });

    test('released status icon is accessible', () => {
      render(<DreamStatusIcon status="released" />);
      expect(screen.getByRole('img', { name: 'Released' })).toBeInTheDocument();
    });
  });
});
