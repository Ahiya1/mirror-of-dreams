import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

import { BottomSheet } from '../BottomSheet';

import { haptic } from '@/lib/utils/haptics';

// Mock dependencies - use hoisted mocks
vi.mock('react-focus-lock', () => ({
  default: ({ children, returnFocus }: { children: React.ReactNode; returnFocus?: boolean }) => (
    <div data-testid="focus-lock" data-return-focus={returnFocus}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/variants', () => ({
  bottomSheetVariants: {},
  bottomSheetBackdropVariants: {},
}));

// Create a stable mock for useMotionValue
const mockMotionValue = {
  set: vi.fn(),
  get: vi.fn(() => 0),
  onChange: vi.fn(),
};

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');

  // Create a motion.div that handles props properly
  const MotionDiv = React.forwardRef<HTMLDivElement, any>(
    (
      {
        children,
        className,
        onClick,
        style,
        _drag,
        _dragConstraints,
        _dragElastic,
        _onDragEnd,
        _variants,
        _initial,
        _animate,
        _exit,
        ...rest
      },
      ref
    ) => (
      <div ref={ref} className={className} onClick={onClick} style={style} {...rest}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';

  return {
    ...actual,
    useMotionValue: () => mockMotionValue,
    animate: vi.fn(),
    motion: {
      div: MotionDiv,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('BottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Sheet content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the motion value mock
    mockMotionValue.set.mockClear();
    mockMotionValue.get.mockClear();
    mockMotionValue.get.mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
  });

  describe('visibility', () => {
    test('does not render when isOpen=false', () => {
      render(<BottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
    });

    test('renders when isOpen=true', () => {
      render(<BottomSheet {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });

    test('renders children inside sheet', () => {
      render(
        <BottomSheet {...defaultProps}>
          <button>Action Button</button>
        </BottomSheet>
      );
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    test('renders multiple children correctly', () => {
      render(
        <BottomSheet {...defaultProps}>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </BottomSheet>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('height modes', () => {
    test('applies auto height by default', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('max-h-[90vh]');
    });

    test('applies auto height when specified', () => {
      render(<BottomSheet {...defaultProps} height="auto" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('max-h-[90vh]');
    });

    test('applies half height', () => {
      render(<BottomSheet {...defaultProps} height="half" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('h-[50vh]');
    });

    test('applies full height', () => {
      render(<BottomSheet {...defaultProps} height="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('h-[90vh]');
    });

    test('half height does not have auto max-height', () => {
      render(<BottomSheet {...defaultProps} height="half" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).not.toHaveClass('max-h-[90vh]');
    });

    test('full height does not have auto max-height', () => {
      render(<BottomSheet {...defaultProps} height="full" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).not.toHaveClass('max-h-[90vh]');
    });
  });

  describe('title', () => {
    test('renders title when provided', () => {
      render(<BottomSheet {...defaultProps} title="Select Option" />);
      expect(screen.getByText('Select Option')).toBeInTheDocument();
    });

    test('does not render title when not provided', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('title has correct id for aria-labelledby', () => {
      render(<BottomSheet {...defaultProps} title="Title" />);
      const title = screen.getByText('Title');
      expect(title).toHaveAttribute('id', 'bottom-sheet-title');
    });

    test('title is h2 element', () => {
      render(<BottomSheet {...defaultProps} title="Sheet Title" />);
      const title = screen.getByText('Sheet Title');
      expect(title.tagName).toBe('H2');
    });

    test('title has correct styling', () => {
      render(<BottomSheet {...defaultProps} title="Sheet Title" />);
      const title = screen.getByText('Sheet Title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-white');
    });

    test('title is inside bordered container', () => {
      render(<BottomSheet {...defaultProps} title="Sheet Title" />);
      const title = screen.getByText('Sheet Title');
      const container = title.parentElement;
      expect(container).toHaveClass('border-b');
      expect(container).toHaveClass('border-white/10');
    });
  });

  describe('drag handle', () => {
    test('renders drag handle indicator', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(handle).toBeInTheDocument();
    });

    test('drag handle has correct styling', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handle = sheet.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(handle).toHaveClass('bg-white/30');
    });

    test('has cursor-grab class on handle container', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handleContainer = sheet.querySelector('.cursor-grab');
      expect(handleContainer).toBeInTheDocument();
    });

    test('handle container has flex centering', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handleContainer = sheet.querySelector('.cursor-grab');
      expect(handleContainer).toHaveClass('flex');
      expect(handleContainer).toHaveClass('justify-center');
    });

    test('handle container has padding', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const handleContainer = sheet.querySelector('.cursor-grab');
      expect(handleContainer).toHaveClass('pt-3');
      expect(handleContainer).toHaveClass('pb-2');
    });
  });

  describe('dismiss behaviors', () => {
    test('closes on backdrop click', () => {
      const handleClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={handleClose} />);

      const backdrop = document.querySelector('.bg-black\\/60');
      fireEvent.click(backdrop!);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('triggers haptic on backdrop click', () => {
      render(<BottomSheet {...defaultProps} />);

      const backdrop = document.querySelector('.bg-black\\/60');
      fireEvent.click(backdrop!);

      expect(haptic).toHaveBeenCalledWith('light');
    });

    test('closes on Escape key', () => {
      const handleClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose on Escape when closed', () => {
      const handleClose = vi.fn();
      render(<BottomSheet {...defaultProps} isOpen={false} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    test('does not respond to other keys', () => {
      const handleClose = vi.fn();
      render(<BottomSheet {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('backdrop', () => {
    test('renders backdrop overlay when open', () => {
      render(<BottomSheet {...defaultProps} />);
      const backdrop = document.querySelector('.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
    });

    test('backdrop has blur effect', () => {
      render(<BottomSheet {...defaultProps} />);
      const backdrop = document.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    test('backdrop covers full screen', () => {
      render(<BottomSheet {...defaultProps} />);
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
    });

    test('backdrop has high z-index', () => {
      render(<BottomSheet {...defaultProps} />);
      const backdrop = document.querySelector('.z-50.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
    });

    test('backdrop is aria-hidden', () => {
      render(<BottomSheet {...defaultProps} />);
      const backdrop = document.querySelector('.bg-black\\/60');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('accessibility', () => {
    test('has role="dialog"', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('has aria-modal="true"', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    test('has aria-labelledby when title present', () => {
      render(<BottomSheet {...defaultProps} title="Sheet Title" />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'bottom-sheet-title');
    });

    test('does not have aria-labelledby when no title', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    test('uses focus lock for focus trap', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByTestId('focus-lock')).toBeInTheDocument();
    });

    test('focus lock has returnFocus enabled', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByTestId('focus-lock')).toHaveAttribute('data-return-focus', 'true');
    });
  });

  describe('sheet positioning', () => {
    test('sheet is fixed at bottom', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('fixed');
      expect(sheet).toHaveClass('bottom-0');
    });

    test('sheet spans full horizontal width', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('inset-x-0');
    });

    test('sheet has high z-index', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('z-50');
    });
  });

  describe('glass morphism styling', () => {
    test('has glass background', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('bg-mirror-void-deep/95');
    });

    test('has backdrop blur', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('backdrop-blur-xl');
    });

    test('has top border', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('border-t');
      expect(sheet).toHaveClass('border-white/10');
    });

    test('has rounded top corners', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('rounded-t-3xl');
    });
  });

  describe('content area', () => {
    test('content is scrollable', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const contentArea = sheet.querySelector('.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();
    });

    test('content has overscroll contain', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const contentArea = sheet.querySelector('.overscroll-contain');
      expect(contentArea).toBeInTheDocument();
    });

    test('content fills available space', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      const contentArea = sheet.querySelector('.flex-1');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('safe area support', () => {
    test('has safe area bottom padding', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      // Safe area is applied via pb-[env(safe-area-inset-bottom)]
      expect(sheet.className).toContain('pb-[env(safe-area-inset-bottom)]');
    });
  });

  describe('flex layout', () => {
    test('sheet uses flex column layout', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('flex');
      expect(sheet).toHaveClass('flex-col');
    });

    test('title container shrinks if needed', () => {
      render(<BottomSheet {...defaultProps} title="Title" />);
      const titleContainer = screen.getByText('Title').parentElement;
      expect(titleContainer).toHaveClass('shrink-0');
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<BottomSheet {...defaultProps} className="custom-sheet" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('custom-sheet');
    });

    test('merges custom className with default classes', () => {
      render(<BottomSheet {...defaultProps} className="my-4" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('my-4');
      expect(sheet).toHaveClass('fixed');
    });

    test('custom className can override styling', () => {
      render(<BottomSheet {...defaultProps} className="z-10" />);
      const sheet = screen.getByRole('dialog');
      // cn() allows custom classes to merge/override, last class wins with Tailwind merge
      expect(sheet).toHaveClass('z-10');
    });
  });

  describe('touch handling', () => {
    test('has touch-none for drag handling', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('touch-none');
    });

    test('has overflow-hidden to prevent content overflow', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('overflow-hidden');
    });
  });

  describe('edge cases', () => {
    test('handles null children', () => {
      render(<BottomSheet {...defaultProps}>{null}</BottomSheet>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('handles empty title string', () => {
      render(<BottomSheet {...defaultProps} title="" />);
      // Empty title should not render
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('handles long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines in the sheet';
      render(<BottomSheet {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('handles special characters in title', () => {
      render(<BottomSheet {...defaultProps} title="Options & Settings" />);
      expect(screen.getByText('Options & Settings')).toBeInTheDocument();
    });

    test('handles rapid open/close', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<BottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<BottomSheet {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('body scroll lock', () => {
    test('component renders without errors', () => {
      // Body scroll lock is an effect - we test that component works
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('motion value integration', () => {
    test('resets y position when sheet opens', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} isOpen={false} />);
      rerender(<BottomSheet {...defaultProps} isOpen={true} />);
      expect(mockMotionValue.set).toHaveBeenCalledWith(0);
    });
  });
});
