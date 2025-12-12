// components/shared/__tests__/Toast.test.tsx
// Tests for Toast notification component

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

import { Toast } from '../Toast';

describe('Toast', () => {
  const defaultProps = {
    type: 'info' as const,
    message: 'Test notification message',
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the message', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByText('Test notification message')).toBeInTheDocument();
    });

    it('renders dismiss button', () => {
      render(<Toast {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
    });
  });

  describe('toast types', () => {
    it('renders success type with correct styling', () => {
      const { container } = render(<Toast {...defaultProps} type="success" />);
      expect(container.firstChild).toHaveClass('border-mirror-success/30');
    });

    it('renders error type with correct styling', () => {
      const { container } = render(<Toast {...defaultProps} type="error" />);
      expect(container.firstChild).toHaveClass('border-mirror-error/30');
    });

    it('renders warning type with correct styling', () => {
      const { container } = render(<Toast {...defaultProps} type="warning" />);
      expect(container.firstChild).toHaveClass('border-mirror-warning/30');
    });

    it('renders info type with correct styling', () => {
      const { container } = render(<Toast {...defaultProps} type="info" />);
      expect(container.firstChild).toHaveClass('border-mirror-info/30');
    });
  });

  describe('dismiss behavior', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<Toast {...defaultProps} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('action button', () => {
    it('renders action button when action prop is provided', () => {
      const action = {
        label: 'Undo',
        onClick: vi.fn(),
      };
      render(<Toast {...defaultProps} action={action} />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('does not render action button when action prop is not provided', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    });

    it('calls action onClick and onDismiss when action button is clicked', () => {
      const onDismiss = vi.fn();
      const action = {
        label: 'Retry',
        onClick: vi.fn(),
      };
      render(<Toast {...defaultProps} onDismiss={onDismiss} action={action} />);

      fireEvent.click(screen.getByText('Retry'));

      expect(action.onClick).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has accessible dismiss button', () => {
      render(<Toast {...defaultProps} />);

      const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
    });
  });

  describe('styling', () => {
    it('applies base styling classes', () => {
      const { container } = render(<Toast {...defaultProps} />);
      expect(container.firstChild).toHaveClass('rounded-xl');
      expect(container.firstChild).toHaveClass('backdrop-blur-xl');
    });

    it('has max width constraint', () => {
      const { container } = render(<Toast {...defaultProps} />);
      expect(container.firstChild).toHaveClass('max-w-sm');
    });
  });
});
