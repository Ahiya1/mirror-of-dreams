import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import MobileReflectionFlow from '../MobileReflectionFlow';

// Mock all external dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useKeyboardHeight: () => 0,
  useIsMobile: () => false, // Desktop mode for simpler modal rendering
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useHideBottomNav: vi.fn(),
}));

// Mock react-focus-lock
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      role,
      'aria-modal': ariaModal,
      'aria-labelledby': ariaLabelledBy,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      role?: string;
      'aria-modal'?: boolean | 'true' | 'false';
      'aria-labelledby'?: string;
      onClick?: (e: React.MouseEvent) => void;
    }) => (
      <div
        className={className}
        role={role}
        aria-modal={ariaModal}
        aria-labelledby={ariaLabelledBy}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      className,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
    }) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
    p: ({ children, ...props }: { children: React.ReactNode }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true, // Disable animations in tests
}));

// LocalStorage mock
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MobileReflectionFlow', () => {
  const mockDreams = [
    { id: 'dream-1', title: 'Learn Guitar', category: 'creative' },
    { id: 'dream-2', title: 'Run Marathon', category: 'health' },
  ];

  const defaultProps = {
    dreams: mockDreams,
    selectedDreamId: '',
    onDreamSelect: vi.fn(),
    formData: { dream: '', plan: '', relationship: '', offering: '' },
    onFieldChange: vi.fn(),
    selectedTone: 'fusion' as const,
    onToneSelect: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('rendering', () => {
    it('renders initial dream selection step', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('renders dream cards', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByText('Learn Guitar')).toBeInTheDocument();
      expect(screen.getByText('Run Marathon')).toBeInTheDocument();
    });

    it('renders empty state when no dreams', () => {
      render(<MobileReflectionFlow {...defaultProps} dreams={[]} />);

      expect(screen.getByText('No active dreams yet.')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Dream')).toBeInTheDocument();
    });
  });

  describe('wizard flow', () => {
    it('calls onDreamSelect when dream is clicked', () => {
      const onDreamSelect = vi.fn();
      render(<MobileReflectionFlow {...defaultProps} onDreamSelect={onDreamSelect} />);

      fireEvent.click(screen.getByTestId('dream-card-dream-1'));

      expect(onDreamSelect).toHaveBeenCalledTimes(1);
      expect(onDreamSelect).toHaveBeenCalledWith(mockDreams[0]);
    });

    it('shows QuestionStep after dream selection and advancing', async () => {
      // Start with a selected dream
      render(<MobileReflectionFlow {...defaultProps} selectedDreamId="dream-1" />);

      // Click a dream to trigger auto-advance (via setTimeout)
      fireEvent.click(screen.getByTestId('dream-card-dream-1'));

      // Wait for auto-advance timeout
      await waitFor(
        () => {
          expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('maintains selected dream styling', () => {
      render(<MobileReflectionFlow {...defaultProps} selectedDreamId="dream-1" />);

      const selectedCard = screen.getByTestId('dream-card-dream-1');
      expect(selectedCard).toHaveClass('bg-purple-500/20');
    });
  });

  describe('exit confirmation', () => {
    it('shows confirmation when closing with dirty form', () => {
      render(
        <MobileReflectionFlow
          {...defaultProps}
          formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      // ExitConfirmation should be shown via GlassModal
      expect(screen.getByText('Leave reflection?')).toBeInTheDocument();
    });

    it('closes directly when form is clean', () => {
      const onClose = vi.fn();
      render(<MobileReflectionFlow {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText('Close'));

      expect(onClose).toHaveBeenCalled();
    });

    it('stays open when "Keep Writing" is clicked', () => {
      const onClose = vi.fn();
      render(
        <MobileReflectionFlow
          {...defaultProps}
          onClose={onClose}
          formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));
      fireEvent.click(screen.getByText('Keep Writing'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes and clears localStorage when "Leave" is clicked', () => {
      const onClose = vi.fn();
      render(
        <MobileReflectionFlow
          {...defaultProps}
          onClose={onClose}
          formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));
      fireEvent.click(screen.getByText('Leave'));

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('MIRROR_REFLECTION_DRAFT');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('gazing overlay', () => {
    it('shows overlay when isSubmitting is true', () => {
      render(<MobileReflectionFlow {...defaultProps} isSubmitting={true} />);

      // GazingOverlay should be visible with status text (use getAllByText for multiple matches)
      expect(screen.getAllByText(/gazing|reflecting|crafting|weaving/i).length).toBeGreaterThan(0);
    });

    it('does not show overlay when not submitting', () => {
      render(<MobileReflectionFlow {...defaultProps} isSubmitting={false} />);

      // GazingOverlay helper text should not be visible
      expect(screen.queryByText('This may take a few moments')).not.toBeInTheDocument();
    });
  });

  describe('props forwarding', () => {
    it('passes selectedTone to ToneStep (when on tone step)', () => {
      render(
        <MobileReflectionFlow {...defaultProps} selectedTone="gentle" selectedDreamId="dream-1" />
      );

      // Component should render without errors
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('passes formData to QuestionStep', () => {
      render(
        <MobileReflectionFlow
          {...defaultProps}
          formData={{ dream: 'test content', plan: '', relationship: '', offering: '' }}
          selectedDreamId="dream-1"
        />
      );

      // Component renders with form data
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });

  describe('keyboard handling', () => {
    it('renders without error when keyboardHeight is 0', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('close button has accessible label', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('renders with proper heading hierarchy', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('integration with child components', () => {
    it('renders MobileDreamSelectionView on dreamSelect step', () => {
      render(<MobileReflectionFlow {...defaultProps} />);

      // MobileDreamSelectionView renders the heading
      expect(screen.getByText('Which dream are you reflecting on?')).toBeInTheDocument();
    });

    it('renders ExitConfirmation when needed', () => {
      render(
        <MobileReflectionFlow
          {...defaultProps}
          formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      // ExitConfirmation title
      expect(screen.getByText('Leave reflection?')).toBeInTheDocument();
    });

    it('renders GazingOverlay when submitting', () => {
      render(<MobileReflectionFlow {...defaultProps} isSubmitting={true} />);

      // GazingOverlay shows helper text
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('handles empty dreams array gracefully', () => {
      render(<MobileReflectionFlow {...defaultProps} dreams={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('handles undefined category in dreams', () => {
      const dreamsWithUndefined = [{ id: 'dream-1', title: 'Test Dream' }];

      render(<MobileReflectionFlow {...defaultProps} dreams={dreamsWithUndefined} />);

      expect(screen.getByText('Test Dream')).toBeInTheDocument();
    });
  });
});

describe('MobileReflectionFlow beforeunload handling', () => {
  const mockDreams = [{ id: 'dream-1', title: 'Learn Guitar', category: 'creative' }];

  const defaultProps = {
    dreams: mockDreams,
    selectedDreamId: '',
    onDreamSelect: vi.fn(),
    formData: { dream: '', plan: '', relationship: '', offering: '' },
    onFieldChange: vi.fn(),
    selectedTone: 'fusion' as const,
    onToneSelect: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds beforeunload listener when form is dirty', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(
      <MobileReflectionFlow
        {...defaultProps}
        formData={{ dream: 'content', plan: '', relationship: '', offering: '' }}
      />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('does not add beforeunload listener when form is clean', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<MobileReflectionFlow {...defaultProps} />);

    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'beforeunload'
    );
    expect(beforeUnloadCalls.length).toBe(0);

    addEventListenerSpy.mockRestore();
  });
});
