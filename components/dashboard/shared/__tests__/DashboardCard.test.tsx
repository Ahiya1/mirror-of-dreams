import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DashboardCard, {
  CardHeader,
  CardTitle,
  CardContent,
  CardActions,
  HeaderAction,
} from '../DashboardCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      ({ children, className, onClick, onMouseEnter, onMouseLeave, ...props }: any, ref: any) => (
        <div
          ref={ref}
          className={className}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          {...props}
        >
          {children}
        </div>
      )
    ),
  },
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock animation variants
vi.mock('@/lib/animations/variants', () => ({
  cardPressVariants: {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  },
}));

describe('DashboardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children content', () => {
      render(
        <DashboardCard>
          <span>Test Content</span>
        </DashboardCard>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply base dashboard-card class', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toBeInTheDocument();
    });

    it('should apply default variant class', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--default');
    });

    it('should apply premium variant class', () => {
      render(<DashboardCard variant="premium">Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--premium');
    });

    it('should apply creator variant class', () => {
      render(<DashboardCard variant="creator">Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--creator');
    });

    it('should apply custom className', () => {
      render(<DashboardCard className="custom-class">Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should render gradient overlay', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const gradient = document.querySelector('.dashboard-card__gradient');
      expect(gradient).toBeInTheDocument();
    });

    it('should render shimmer effect', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const shimmer = document.querySelector('.dashboard-card__shimmer');
      expect(shimmer).toBeInTheDocument();
    });

    it('should render content wrapper', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const content = document.querySelector('.dashboard-card__content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading overlay when isLoading is true', () => {
      render(<DashboardCard isLoading>Content</DashboardCard>);
      const loadingOverlay = document.querySelector('.dashboard-card__loading');
      expect(loadingOverlay).toBeInTheDocument();
    });

    it('should show spinner in loading overlay', () => {
      render(<DashboardCard isLoading>Content</DashboardCard>);
      const spinner = document.querySelector('.dashboard-card__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply dashboard-card--loading class', () => {
      render(<DashboardCard isLoading>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--loading');
    });

    it('should not show loading overlay when isLoading is false', () => {
      render(<DashboardCard isLoading={false}>Content</DashboardCard>);
      const loadingOverlay = document.querySelector('.dashboard-card__loading');
      expect(loadingOverlay).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error overlay when hasError is true', () => {
      render(<DashboardCard hasError>Content</DashboardCard>);
      const errorOverlay = document.querySelector('.dashboard-card__error');
      expect(errorOverlay).toBeInTheDocument();
    });

    it('should show error icon', () => {
      render(<DashboardCard hasError>Content</DashboardCard>);
      const errorIcon = document.querySelector('.dashboard-card__error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show error message', () => {
      render(<DashboardCard hasError>Content</DashboardCard>);
      expect(screen.getByText('Unable to load data')).toBeInTheDocument();
    });

    it('should apply dashboard-card--error class', () => {
      render(<DashboardCard hasError>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--error');
    });

    it('should not show error overlay when hasError is false', () => {
      render(<DashboardCard hasError={false}>Content</DashboardCard>);
      const errorOverlay = document.querySelector('.dashboard-card__error');
      expect(errorOverlay).not.toBeInTheDocument();
    });
  });

  describe('hover behavior', () => {
    it('should add hovered class on mouseenter when hoverable', () => {
      render(<DashboardCard hoverable>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      fireEvent.mouseEnter(card);

      expect(card).toHaveClass('dashboard-card--hovered');
    });

    it('should remove hovered class on mouseleave when hoverable', () => {
      render(<DashboardCard hoverable>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      fireEvent.mouseEnter(card);
      expect(card).toHaveClass('dashboard-card--hovered');

      fireEvent.mouseLeave(card);
      expect(card).not.toHaveClass('dashboard-card--hovered');
    });

    it('should not add hovered class when hoverable is false', () => {
      render(<DashboardCard hoverable={false}>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      fireEvent.mouseEnter(card);

      expect(card).not.toHaveClass('dashboard-card--hovered');
    });

    it('should be hoverable by default', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      fireEvent.mouseEnter(card);

      expect(card).toHaveClass('dashboard-card--hovered');
    });
  });

  describe('click behavior', () => {
    it('should add clickable class when onClick is provided', () => {
      const onClick = vi.fn();
      render(<DashboardCard onClick={onClick}>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--clickable');
    });

    it('should not add clickable class when onClick is not provided', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).not.toHaveClass('dashboard-card--clickable');
    });

    it('should call onClick handler when clicked', () => {
      const onClick = vi.fn();
      render(<DashboardCard onClick={onClick}>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should create ripple effect element on click', () => {
      const onClick = vi.fn();
      render(<DashboardCard onClick={onClick}>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      // Mock getBoundingClientRect
      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.click(card, { clientX: 50, clientY: 50 });

      const ripple = document.querySelector('.dashboard-card-ripple');
      expect(ripple).toBeInTheDocument();
    });

    it('should not call onClick when no handler is provided', () => {
      render(<DashboardCard>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card') as HTMLElement;

      // Should not throw
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('breathing effect', () => {
    it('should apply breathing class when breathing is true', () => {
      render(<DashboardCard breathing>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--breathing');
    });

    it('should not apply breathing class when breathing is false', () => {
      render(<DashboardCard breathing={false}>Content</DashboardCard>);
      const card = document.querySelector('.dashboard-card');
      expect(card).not.toHaveClass('dashboard-card--breathing');
    });
  });

  describe('combined states', () => {
    it('should handle both loading and error states (loading takes precedence)', () => {
      render(
        <DashboardCard isLoading hasError>
          Content
        </DashboardCard>
      );
      const loadingOverlay = document.querySelector('.dashboard-card__loading');
      const errorOverlay = document.querySelector('.dashboard-card__error');

      // Both should render when both are true
      expect(loadingOverlay).toBeInTheDocument();
      expect(errorOverlay).toBeInTheDocument();
    });

    it('should apply multiple variant classes correctly', () => {
      const onClick = vi.fn();
      render(
        <DashboardCard variant="premium" className="custom-class" isLoading onClick={onClick}>
          Content
        </DashboardCard>
      );
      const card = document.querySelector('.dashboard-card');
      expect(card).toHaveClass('dashboard-card--premium');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('dashboard-card--loading');
      expect(card).toHaveClass('dashboard-card--clickable');
    });
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply dashboard-card__header class', () => {
    render(<CardHeader>Content</CardHeader>);
    const header = document.querySelector('.dashboard-card__header');
    expect(header).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CardHeader className="custom-header">Content</CardHeader>);
    const header = document.querySelector('.dashboard-card__header');
    expect(header).toHaveClass('custom-header');
  });

  it('should merge custom className with base class', () => {
    render(<CardHeader className="my-class">Content</CardHeader>);
    const header = document.querySelector('.dashboard-card__header');
    expect(header).toHaveClass('dashboard-card__header');
    expect(header).toHaveClass('my-class');
  });
});

describe('CardTitle', () => {
  it('should render title text', () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('should apply dashboard-card__title class', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = document.querySelector('.dashboard-card__title');
    expect(title).toBeInTheDocument();
  });

  it('should render title in text span', () => {
    render(<CardTitle>Title Text</CardTitle>);
    const textSpan = document.querySelector('.dashboard-card__title-text');
    expect(textSpan).toBeInTheDocument();
    expect(textSpan).toHaveTextContent('Title Text');
  });

  it('should render with icon', () => {
    render(<CardTitle icon={<span data-testid="test-icon">Icon</span>}>Title</CardTitle>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should wrap icon in icon span', () => {
    render(<CardTitle icon={<span>Icon</span>}>Title</CardTitle>);
    const iconSpan = document.querySelector('.dashboard-card__title-icon');
    expect(iconSpan).toBeInTheDocument();
  });

  it('should not render icon span when no icon provided', () => {
    render(<CardTitle>Title</CardTitle>);
    const iconSpan = document.querySelector('.dashboard-card__title-icon');
    expect(iconSpan).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    const title = document.querySelector('.dashboard-card__title');
    expect(title).toHaveClass('custom-title');
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Inner Content</CardContent>);
    expect(screen.getByText('Inner Content')).toBeInTheDocument();
  });

  it('should apply dashboard-card__content-inner class', () => {
    render(<CardContent>Content</CardContent>);
    const content = document.querySelector('.dashboard-card__content-inner');
    expect(content).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    const content = document.querySelector('.dashboard-card__content-inner');
    expect(content).toHaveClass('custom-content');
  });
});

describe('CardActions', () => {
  it('should render children', () => {
    render(<CardActions>Action Buttons</CardActions>);
    expect(screen.getByText('Action Buttons')).toBeInTheDocument();
  });

  it('should apply dashboard-card__actions class', () => {
    render(<CardActions>Actions</CardActions>);
    const actions = document.querySelector('.dashboard-card__actions');
    expect(actions).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CardActions className="custom-actions">Actions</CardActions>);
    const actions = document.querySelector('.dashboard-card__actions');
    expect(actions).toHaveClass('custom-actions');
  });
});

describe('HeaderAction', () => {
  it('should render as button when onClick is provided', () => {
    const onClick = vi.fn();
    render(<HeaderAction onClick={onClick}>Click Me</HeaderAction>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('should call onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<HeaderAction onClick={onClick}>Click Me</HeaderAction>);
    const button = screen.getByRole('button', { name: 'Click Me' });

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render as link when href is provided', () => {
    render(<HeaderAction href="/path">Go There</HeaderAction>);
    const link = screen.getByRole('link', { name: 'Go There' });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/path');
  });

  it('should apply dashboard-card__header-action class', () => {
    render(<HeaderAction onClick={() => {}}>Action</HeaderAction>);
    const action = document.querySelector('.dashboard-card__header-action');
    expect(action).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <HeaderAction onClick={() => {}} className="custom-action">
        Action
      </HeaderAction>
    );
    const action = document.querySelector('.dashboard-card__header-action');
    expect(action).toHaveClass('custom-action');
  });

  it('should render children content', () => {
    render(<HeaderAction href="/test">View All</HeaderAction>);
    expect(screen.getByText('View All')).toBeInTheDocument();
  });
});
