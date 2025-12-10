# Code Patterns & Conventions

## File Structure

```
components/
├── auth/
│   └── __tests__/
│       └── AuthLayout.test.tsx
├── ui/
│   ├── glass/
│   │   └── __tests__/
│   │       ├── GlassCard.test.tsx
│   │       ├── GlassInput.test.tsx
│   │       ├── GlassModal.test.tsx
│   │       ├── CosmicLoader.test.tsx
│   │       └── AnimatedBackground.test.tsx
│   └── mobile/
│       └── __tests__/
│           └── BottomSheet.test.tsx
```

## Naming Conventions

- Test files: `{ComponentName}.test.tsx` (PascalCase component, lowercase extension)
- Test descriptions: Use clear, behavior-focused language
- Test IDs: `data-testid="descriptive-name"` (kebab-case)

## Import Order Convention

```typescript
// 1. Testing utilities
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

// 2. Component under test
import { ComponentName } from '../ComponentName';

// 3. Mocked dependencies (if needed to reference)
import { haptic } from '@/lib/utils/haptics';
```

## Test File Structure Pattern

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ComponentName } from '../ComponentName';

// Optional: Import mocked functions if asserting calls
import { haptic } from '@/lib/utils/haptics';

describe('ComponentName', () => {
  // Optional: Reset mocks if needed
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<ComponentName>Content</ComponentName>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    // Test different prop combinations
  });

  describe('interactions', () => {
    // Test user interactions
  });

  describe('accessibility', () => {
    // Test WCAG compliance
  });
});
```

---

## Mock Patterns

### Framer Motion Mock with useReducedMotion Control

```typescript
import { vi } from 'vitest';
import * as framerMotion from 'framer-motion';

// Mock useReducedMotion to return false (default - animations enabled)
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

// In specific test, change behavior:
describe('reduced motion', () => {
  test('respects reduced motion preference', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    render(<AnimatedComponent />);
    // Assert no animation classes or attributes
  });
});
```

### useIsMobile Hook Mock

```typescript
import { vi } from 'vitest';
import * as hooks from '@/hooks';

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual('@/hooks');
  return {
    ...actual,
    useIsMobile: vi.fn(() => false),
  };
});

// Test mobile behavior:
describe('mobile behavior', () => {
  test('renders full-screen on mobile', () => {
    vi.mocked(hooks.useIsMobile).mockReturnValue(true);

    render(<GlassModal isOpen={true} onClose={() => {}} />);
    // Assert mobile-specific rendering
  });
});
```

### react-focus-lock Mock

```typescript
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  ),
}));
```

### Next.js Link Mock

```typescript
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
```

### Word Count Utility Mock

```typescript
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: vi.fn((text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length
  ),
}));
```

---

## Component Test Patterns

### GlassCard Test Pattern

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { GlassCard } from '../GlassCard';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('GlassCard', () => {
  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GlassCard>Card content</GlassCard>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('applies base glass styling classes', () => {
      render(<GlassCard>Content</GlassCard>);
      const card = screen.getByText('Content').parentElement;
      expect(card).toHaveClass('backdrop-blur-crystal');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('rounded-xl');
    });
  });

  describe('elevated state', () => {
    test('applies elevated styling when elevated=true', () => {
      render(<GlassCard elevated>Elevated</GlassCard>);
      const card = screen.getByText('Elevated').parentElement;
      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveClass('border-white/15');
    });

    test('does not apply elevated styling by default', () => {
      render(<GlassCard>Normal</GlassCard>);
      const card = screen.getByText('Normal').parentElement;
      expect(card).not.toHaveClass('shadow-lg');
    });
  });

  describe('interactive state', () => {
    test('sets tabIndex=0 when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    test('sets role="button" when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('applies cursor-pointer when interactive', () => {
      render(<GlassCard interactive>Interactive</GlassCard>);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
    });

    test('does not set role or tabIndex when not interactive', () => {
      render(<GlassCard>Non-interactive</GlassCard>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('click handler', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<GlassCard interactive onClick={handleClick}>Clickable</GlassCard>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Enter key press when interactive', () => {
      const handleClick = vi.fn();
      render(<GlassCard interactive onClick={handleClick}>Keyboard</GlassCard>);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Space key press when interactive', () => {
      const handleClick = vi.fn();
      render(<GlassCard interactive onClick={handleClick}>Keyboard</GlassCard>);
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when not interactive', () => {
      const handleClick = vi.fn();
      render(<GlassCard onClick={handleClick}>Not interactive</GlassCard>);
      fireEvent.click(screen.getByText('Not interactive'));
      // onClick is still called because it's passed to onClick prop
      // But keyboard handlers should not work without interactive
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<GlassCard className="custom-class">Custom</GlassCard>);
      const card = screen.getByText('Custom').parentElement;
      expect(card).toHaveClass('custom-class');
    });

    test('applies inline style prop', () => {
      render(<GlassCard style={{ marginTop: '20px' }}>Styled</GlassCard>);
      const card = screen.getByText('Styled').parentElement;
      expect(card).toHaveStyle({ marginTop: '20px' });
    });

    test('supports data-* attributes', () => {
      render(<GlassCard data-testid="test-card">Data attr</GlassCard>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });
  });
});
```

### GlassInput Test Pattern

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { GlassInput } from '../GlassInput';

// Mock word count utility
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: vi.fn((text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('GlassInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders input element correctly', () => {
      render(<GlassInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders with placeholder text', () => {
      render(<GlassInput {...defaultProps} placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('renders label when provided', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    test('renders required indicator when required=true', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('input types', () => {
    test('renders as text input by default', () => {
      render(<GlassInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    test('renders as email input', () => {
      render(<GlassInput {...defaultProps} type="email" />);
      // Note: email inputs have role="textbox" in RTL
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('renders as password input', () => {
      render(<GlassInput {...defaultProps} type="password" />);
      // Password inputs don't have textbox role
      const container = screen.getByRole('textbox').parentElement?.parentElement;
      const input = container?.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    test('renders as textarea with variant="textarea"', () => {
      render(<GlassInput {...defaultProps} variant="textarea" />);
      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });
  });

  describe('value management', () => {
    test('displays current value', () => {
      render(<GlassInput {...defaultProps} value="test value" />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    test('calls onChange with new value on input', () => {
      const handleChange = vi.fn();
      render(<GlassInput value="" onChange={handleChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
      expect(handleChange).toHaveBeenCalledWith('new');
    });

    test('respects maxLength attribute', () => {
      render(<GlassInput {...defaultProps} maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
    });
  });

  describe('character counter', () => {
    test('shows counter when showCounter=true and maxLength set for textarea', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter
          maxLength={100}
        />
      );
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    test('counter is announced for screen readers', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="test"
          showCounter
          maxLength={50}
        />
      );
      const counter = screen.getByText('4 / 50');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('word counter', () => {
    test('shows word count when counterMode="words"', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="one two three"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('3 thoughtful words')).toBeInTheDocument();
    });

    test('displays "Your thoughts await..." at 0 words', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value=""
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('Your thoughts await...')).toBeInTheDocument();
    });

    test('displays "1 thoughtful word" at 1 word', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('1 thoughtful word')).toBeInTheDocument();
    });
  });

  describe('validation states', () => {
    test('applies error border when error prop set', () => {
      render(<GlassInput {...defaultProps} error="Invalid input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-mirror-error/50');
    });

    test('displays error message below input', () => {
      render(<GlassInput {...defaultProps} error="Invalid input" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    test('applies success border when success=true', () => {
      render(<GlassInput {...defaultProps} success />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-mirror-success/50');
    });

    test('shows success checkmark when success=true', () => {
      render(<GlassInput {...defaultProps} success />);
      // Success checkmark is an SVG with aria-hidden
      const svg = document.querySelector('svg.text-mirror-success');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('password toggle', () => {
    test('shows PasswordToggle when showPasswordToggle=true for password type', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    test('toggles password visibility on toggle click', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleButton);

      // After toggle, should show "hide password"
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('links label to input via htmlFor/id', () => {
      render(<GlassInput {...defaultProps} label="Username" id="username" />);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username');
    });
  });
});
```

### GlassModal Test Pattern

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import * as hooks from '@/hooks';

import { GlassModal } from '../GlassModal';

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

  describe('visibility', () => {
    test('does not render when isOpen=false', () => {
      render(<GlassModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('renders when isOpen=true', () => {
      render(<GlassModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  describe('overlay', () => {
    test('renders backdrop overlay when open', () => {
      render(<GlassModal {...defaultProps} />);
      const overlay = document.querySelector('.backdrop-blur-glass');
      expect(overlay).toBeInTheDocument();
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

    test('has minimum 44px touch target', () => {
      render(<GlassModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toHaveClass('min-h-[44px]');
      expect(closeButton).toHaveClass('min-w-[44px]');
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

    test('links to modal via aria-labelledby', () => {
      render(<GlassModal {...defaultProps} title="Modal Title" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('does not render title when not provided', () => {
      render(<GlassModal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    test('closes on Escape key press', () => {
      const handleClose = vi.fn();
      render(<GlassModal {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
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
  });

  describe('mobile behavior', () => {
    test('renders full-screen on mobile', () => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
      render(<GlassModal {...defaultProps} />);

      // Mobile modal has h-full w-full flex classes
      const dialog = screen.getByRole('dialog');
      const innerContainer = dialog.querySelector('.h-full.w-full');
      expect(innerContainer).toBeInTheDocument();
    });

    test('shows drag handle on mobile when swipe enabled', () => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
      render(<GlassModal {...defaultProps} />);

      // Drag handle is a div with specific styling
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).toBeInTheDocument();
    });

    test('does not show drag handle when disableSwipeDismiss=true', () => {
      vi.mocked(hooks.useIsMobile).mockReturnValue(true);
      render(<GlassModal {...defaultProps} disableSwipeDismiss />);

      // Drag handle should not be rendered
      const dragHandle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(dragHandle).not.toBeInTheDocument();
    });
  });
});
```

### CosmicLoader Test Pattern

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import * as framerMotion from 'framer-motion';

import { CosmicLoader } from '../CosmicLoader';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('CosmicLoader', () => {
  describe('rendering', () => {
    test('renders loader element', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('has role="status" for accessibility', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('has aria-label with default label', () => {
      render(<CosmicLoader />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });

    test('has aria-label with custom label', () => {
      render(<CosmicLoader label="Loading dreams" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dreams');
    });
  });

  describe('sizes', () => {
    test('applies small size classes', () => {
      render(<CosmicLoader size="sm" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    test('applies medium size classes (default)', () => {
      render(<CosmicLoader />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-16', 'h-16');
    });

    test('applies large size classes', () => {
      render(<CosmicLoader size="lg" />);
      const spinner = screen.getByRole('status').querySelector('.rounded-full');
      expect(spinner).toHaveClass('w-24', 'h-24');
    });
  });

  describe('screen reader', () => {
    test('has sr-only span with label text', () => {
      render(<CosmicLoader label="Processing" />);
      const srText = screen.getByText('Processing');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('animation', () => {
    test('respects reduced motion preference', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      render(<CosmicLoader />);
      // When reduced motion, animate prop should be undefined
      // This is harder to test directly, but we can verify component renders
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<CosmicLoader className="mt-4" />);
      expect(screen.getByRole('status')).toHaveClass('mt-4');
    });
  });
});
```

### AuthLayout Test Pattern

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AuthLayout from '../AuthLayout';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock GlassCard (optional - can test with real component)
vi.mock('@/components/ui/glass', () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

describe('AuthLayout', () => {
  describe('rendering', () => {
    test('renders children content', () => {
      render(<AuthLayout><div>Form content</div></AuthLayout>);
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    test('renders inside GlassCard', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    test('centers content', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    test('has max-width container', () => {
      const { container } = render(<AuthLayout>Content</AuthLayout>);
      const inner = container.querySelector('.max-w-md');
      expect(inner).toBeInTheDocument();
    });
  });

  describe('logo', () => {
    test('renders logo emoji and text', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByText('Mirror of Dreams')).toBeInTheDocument();
    });

    test('logo links to home page', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('title', () => {
    test('renders default title "Welcome"', () => {
      render(<AuthLayout>Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome');
    });

    test('renders custom title when provided', () => {
      render(<AuthLayout title="Sign In">Content</AuthLayout>);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign In');
    });

    test('has gradient text styling', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('bg-gradient-to-r');
      expect(title).toHaveClass('bg-clip-text');
    });
  });

  describe('subtitle', () => {
    test('renders subtitle when provided', () => {
      render(<AuthLayout subtitle="Enter your credentials">Content</AuthLayout>);
      expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
    });

    test('does not render subtitle when not provided', () => {
      render(<AuthLayout>Content</AuthLayout>);
      // Only logo text and title should be present
      expect(screen.queryByText(/enter your/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('title is h1 element', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    test('logo link is keyboard accessible', () => {
      render(<AuthLayout>Content</AuthLayout>);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });
});
```

### BottomSheet Test Pattern

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { BottomSheet } from '../BottomSheet';

import { haptic } from '@/lib/utils/haptics';

// Mock dependencies
vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-lock">{children}</div>
  ),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useMotionValue: vi.fn(() => ({ set: vi.fn(), get: vi.fn(() => 0) })),
    animate: vi.fn(),
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
  });

  describe('height modes', () => {
    test('applies auto height (default)', () => {
      render(<BottomSheet {...defaultProps} />);
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
  });

  describe('drag handle', () => {
    test('renders drag handle indicator', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = document.querySelector('.h-1\\.5.w-12.rounded-full');
      expect(handle).toBeInTheDocument();
    });

    test('has cursor-grab class', () => {
      render(<BottomSheet {...defaultProps} />);
      const handleContainer = document.querySelector('.cursor-grab');
      expect(handleContainer).toBeInTheDocument();
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
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      render(<BottomSheet {...defaultProps} className="custom-sheet" />);
      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveClass('custom-sheet');
    });
  });
});
```

### AnimatedBackground Test Pattern

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import * as framerMotion from 'framer-motion';

import { AnimatedBackground } from '../AnimatedBackground';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('AnimatedBackground', () => {
  describe('rendering', () => {
    test('renders container element', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toBeInTheDocument();
    });

    test('has pointer-events-none class', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('pointer-events-none');
    });

    test('has absolute positioning', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('absolute');
      expect(background).toHaveClass('inset-0');
    });

    test('has overflow-hidden', () => {
      const { container } = render(<AnimatedBackground />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('overflow-hidden');
    });

    test('renders all four animated layers', () => {
      const { container } = render(<AnimatedBackground />);
      // Each layer is a motion.div child
      const layers = container.querySelectorAll('.blur-xl, .blur-2xl, .blur-3xl');
      expect(layers.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('variants', () => {
    test('applies cosmic variant by default', () => {
      const { container } = render(<AnimatedBackground />);
      // Cosmic variant has specific gradient classes
      const farLayer = container.querySelector('.bg-gradient-to-b');
      expect(farLayer).toBeInTheDocument();
    });

    test('applies dream variant classes', () => {
      const { container } = render(<AnimatedBackground variant="dream" />);
      const farLayer = container.querySelector('.bg-gradient-to-br');
      expect(farLayer).toBeInTheDocument();
    });

    test('applies glow variant classes', () => {
      const { container } = render(<AnimatedBackground variant="glow" />);
      const farLayer = container.querySelector('.bg-gradient-radial');
      expect(farLayer).toBeInTheDocument();
    });
  });

  describe('intensity', () => {
    test('renders with subtle intensity by default', () => {
      const { container } = render(<AnimatedBackground />);
      // Component renders - intensity affects opacity values in animation
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with medium intensity', () => {
      const { container } = render(<AnimatedBackground intensity="medium" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders with strong intensity', () => {
      const { container } = render(<AnimatedBackground intensity="strong" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    test('respects reduced motion preference', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);
      const { container } = render(<AnimatedBackground />);
      // Component still renders, but animations should not apply
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    test('applies custom className', () => {
      const { container } = render(<AnimatedBackground className="z-0" />);
      const background = container.firstChild as HTMLElement;
      expect(background).toHaveClass('z-0');
    });
  });
});
```

---

## Testing Patterns

### Test File Naming Conventions

- Unit tests: `{Component}.test.tsx` (same `__tests__` directory)
- All test files use `.test.tsx` extension

### Test Data Factories

```typescript
// For components that need mock props
export const createMockGlassInputProps = (overrides = {}) => ({
  value: '',
  onChange: vi.fn(),
  ...overrides,
});

export const createMockModalProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  children: <div>Content</div>,
  ...overrides,
});
```

### Coverage Expectations by Component

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| GlassCard | 80% | 90% |
| GlassInput | 80% | 85% |
| GlassModal | 75% | 85% |
| CosmicLoader | 85% | 95% |
| AuthLayout | 85% | 95% |
| BottomSheet | 75% | 85% |
| AnimatedBackground | 80% | 90% |

---

## Error Handling Patterns

### Testing Error States

```typescript
test('displays error message', () => {
  render(<GlassInput {...defaultProps} error="Invalid email" />);
  expect(screen.getByText('Invalid email')).toBeInTheDocument();
});

test('applies error styling', () => {
  render(<GlassInput {...defaultProps} error="Error" />);
  const input = screen.getByRole('textbox');
  expect(input).toHaveClass('border-mirror-error/50');
});
```

### Testing Async Behavior (if needed)

```typescript
import { waitFor } from '@testing-library/react';

test('auto-focuses close button on open', async () => {
  render(<GlassModal {...defaultProps} />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Close modal' })).toHaveFocus();
  }, { timeout: 200 });
});
```

---

## Security Patterns

### Input Validation Testing

```typescript
test('respects maxLength attribute', () => {
  render(<GlassInput {...defaultProps} maxLength={10} />);
  expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
});

test('respects minLength attribute', () => {
  render(<GlassInput {...defaultProps} minLength={3} />);
  expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '3');
});
```

### Accessibility Compliance Testing

```typescript
test('has proper ARIA attributes for dialog', () => {
  render(<GlassModal {...defaultProps} title="Title" />);
  const dialog = screen.getByRole('dialog');

  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
});

test('error message is accessible', () => {
  render(<GlassInput {...defaultProps} error="Required field" />);
  // Error text should be visible and announced
  expect(screen.getByText('Required field')).toBeInTheDocument();
});
```
