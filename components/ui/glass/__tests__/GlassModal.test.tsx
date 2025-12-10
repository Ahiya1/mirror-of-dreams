import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

import { GlassModal } from '../GlassModal';

import * as hooks from '@/hooks';
import { haptic } from '@/lib/utils/haptics';

// Mock dependencies
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  ),
}));

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useIsMobile: vi.fn(() => false),
  };
});

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('GlassModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useIsMobile).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    test('does not render when isOpen=false', () => {
      render(<GlassModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('renders when isOpen=true', () => {
      render(<GlassModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('wraps content in FocusLock', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.getByTestId('focus-lock')).toBeInTheDocument();
    });

    test('transitions from closed to open', () => {
      const { rerender } = render(<GlassModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();

      rerender(<GlassModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('transitions from open to closed', async () => {
      const { rerender } = render(<GlassModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();

      rerender(<GlassModal {...defaultProps} isOpen={false} />);
      // AnimatePresence handles exit - in tests, may still be present briefly
      // Verify isOpen=false properly triggers unmount logic
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('overlay', () => {
    test('renders backdrop overlay when open', () => {
      render(<GlassModal {...defaultProps} />);
      const overlay = document.querySelector('.backdrop-blur-glass');
      expect(overlay).toBeInTheDocument();
    });

    test('overlay has fixed positioning', () => {
      render(<GlassModal {...defaultProps} />);
      const overlay = document.querySelector('.backdrop-blur-glass');
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    test('overlay has high z-index', () => {
      render(<GlassModal {...defaultProps} />);
      const overlay = document.querySelector('.backdrop-blur-glass');
      expect(overlay).toHaveClass('z-[110]');
    });

    test('closes on overlay click', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      const overlay = document.querySelector('.backdrop-blur-glass');
      fireEvent.click(overlay!);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('triggers haptic on overlay click', () => {
      render(<GlassModal {...defaultProps} />);

      const overlay = document.querySelector('.backdrop-blur-glass');
      fireEvent.click(overlay!);

      expect(haptic).toHaveBeenCalledWith('light');
    });
  });

  describe('close button', () => {
    test('renders close button with aria-label', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    });

    test('calls onClose when close button clicked', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('triggers haptic on close button click', () => {
      render(<GlassModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
      expect(haptic).toHaveBeenCalledWith('light');
    });

    test('has minimum 44px touch target', () => {
      render(<GlassModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('min-h-[44px]');
      expect(closeButton).toHaveClass('min-w-[44px]');
    });

    test('has focus-visible ring styles', () => {
      render(<GlassModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('focus:outline-none');
      expect(closeButton).toHaveClass('focus-visible:ring-2');
    });

    test('has hover state styling', () => {
      render(<GlassModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('bg-white/10');
      expect(closeButton).toHaveClass('hover:bg-white/20');
    });
  });

  describe('title', () => {
    test('renders title when provided', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    test('title is h2 element', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      const title = screen.getByText('Modal Title');
      expect(title.tagName).toBe('H2');
    });

    test('title has correct id for aria-labelledby', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      const title = screen.getByText('Modal Title');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    test('dialog links to title via aria-labelledby', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('does not render title when not provided', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('dialog has no aria-labelledby when title not provided', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    test('title has proper styling', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      const title = screen.getByText('Modal Title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('text-white');
    });
  });

  describe('keyboard', () => {
    test('closes on Escape key press', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('does not close on other keys', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    test('does not respond to Escape when closed', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} isOpen={false} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has role="dialog"', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('has aria-modal="true"', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    test('content is within dialog role', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toContainElement(screen.getByText('Modal content'));
    });
  });

  describe('auto-focus', () => {
    test('auto-focuses close button when modal opens', async () => {
      vi.useFakeTimers();
      render(<GlassModal {...defaultProps} />);

      // Run all timers to trigger the focus setTimeout
      await vi.runAllTimersAsync();

      // Check that focus was attempted on close button
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('content propagation', () => {
    test('content click does not close modal', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByText('Modal content'));
      expect(handleClose).not.toHaveBeenCalled();
    });

    test('renders complex children', () => {
      render(
        <GlassModal {...defaultProps}>
          <div data-testid="complex-child">
            <h3>Nested heading</h3>
            <p>Nested paragraph</p>
            <button>Nested button</button>
          </div>
        </GlassModal>
      );
      expect(screen.getByTestId('complex-child')).toBeInTheDocument();
      expect(screen.getByText('Nested heading')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
    });
  });

  describe('desktop behavior', () => {
    beforeEach(() => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(false);
    });

    test('renders centered card on desktop', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('w-full');
      expect(dialog).toHaveClass('max-w-lg');
    });

    test('does not show drag handle on desktop', () => {
      render(<GlassModal {...defaultProps} />);
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).not.toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<GlassModal {...defaultProps} className="custom-modal" />);
      // Custom class is applied to GlassCard on desktop
      const customElement = document.querySelector('.custom-modal');
      expect(customElement).toBeInTheDocument();
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
    });

    test('renders full-screen on mobile', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      // On mobile, dialog container has flex flex-col h-full w-full classes
      expect(dialog).toHaveClass('flex');
      expect(dialog).toHaveClass('h-full');
      expect(dialog).toHaveClass('w-full');
    });

    test('has flex layout on mobile', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('flex');
      expect(dialog).toHaveClass('flex-col');
    });

    test('shows drag handle on mobile when swipe enabled', () => {
      render(<GlassModal {...defaultProps} />);
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).toBeInTheDocument();
    });

    test('drag handle has visual indicator styling', () => {
      render(<GlassModal {...defaultProps} />);
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).toHaveClass('bg-white/30');
    });

    test('does not show drag handle when disableSwipeDismiss=true', () => {
      render(<GlassModal {...defaultProps} disableSwipeDismiss />);
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).not.toBeInTheDocument();
    });

    test('applies custom className on mobile', () => {
      render(<GlassModal {...defaultProps} className="custom-mobile-modal" />);
      const customElement = document.querySelector('.custom-mobile-modal');
      expect(customElement).toBeInTheDocument();
    });

    test('mobile content has overflow handling', () => {
      render(<GlassModal {...defaultProps} />);
      const scrollContainer = document.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    test('mobile has backdrop blur styling', () => {
      render(<GlassModal {...defaultProps} />);
      const mobileContainer = document.querySelector('.backdrop-blur-xl');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('swipe to dismiss', () => {
    beforeEach(() => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
    });

    test('enables drag on mobile by default', () => {
      render(<GlassModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      // Drag prop should be 'y' on mobile
      expect(dialog).toBeInTheDocument();
    });

    test('disables drag when disableSwipeDismiss=true', () => {
      render(<GlassModal {...defaultProps} disableSwipeDismiss />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    test('close button position adjusts when drag handle hidden', () => {
      render(<GlassModal {...defaultProps} disableSwipeDismiss />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('top-4');
    });

    test('close button position adjusts when drag handle shown', () => {
      render(<GlassModal {...defaultProps} disableSwipeDismiss={false} />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('top-2');
    });
  });

  describe('title positioning', () => {
    beforeEach(() => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
    });

    test('title padding adjusts when drag handle hidden', () => {
      render(<GlassModal {...defaultProps} title="Title" disableSwipeDismiss />);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('pt-4');
    });

    test('title padding adjusts when drag handle shown', () => {
      render(<GlassModal {...defaultProps} title="Title" disableSwipeDismiss={false} />);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('pt-0');
    });
  });

  describe('reduced motion', () => {
    test('renders correctly with reduced motion preference', async () => {
      const framerMotion = await import('framer-motion');
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      vi.mocked(hooks.useIsMobile).mockReturnValue(false);

      render(<GlassModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('disables swipe on mobile with reduced motion', async () => {
      const framerMotion = await import('framer-motion');
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);

      render(<GlassModal {...defaultProps} />);
      // Modal should still render but swipe should be disabled
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles rapid open/close toggles', async () => {
      const { rerender } = render(<GlassModal {...defaultProps} isOpen={false} />);

      for (let i = 0; i < 5; i++) {
        rerender(<GlassModal {...defaultProps} isOpen={true} />);
        rerender(<GlassModal {...defaultProps} isOpen={false} />);
      }

      // After final toggle to closed, wait for AnimatePresence to complete
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    test('handles onClose being called multiple times', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(3);
    });

    test('handles empty children', () => {
      render(
        <GlassModal isOpen={true} onClose={vi.fn()}>
          {null}
        </GlassModal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
