# Code Patterns & Conventions

## File Structure

```
{project-root}/
├── lib/
│   └── anthropic/           # NEW - Anthropic type utilities
│       ├── types.ts         # Type re-exports and extensions
│       └── type-guards.ts   # Reusable type guard functions
├── server/
│   ├── lib/
│   │   └── temporal-distribution.ts  # Fix Reflection interface
│   └── trpc/routers/
│       ├── evolution.ts     # Remove any types
│       └── visualizations.ts # Remove any types
├── components/
│   ├── ui/glass/
│   │   └── __tests__/       # NEW - Component tests
│   ├── reflection/
│   │   └── __tests__/       # NEW - Component tests
│   └── dashboard/shared/
│       └── __tests__/       # NEW - Component tests
├── vitest.config.ts         # Update coverage include
└── vitest.setup.ts          # Add testing-library matchers
```

## Naming Conventions

- Components: PascalCase (`ToneBadge.tsx`)
- Test Files: `{ComponentName}.test.tsx` (in `__tests__/` directory)
- Type Files: camelCase (`types.ts`, `type-guards.ts`)
- Type Guards: `is{TypeName}` pattern (`isTextBlock`, `isThinkingBlock`)
- Test Describe Blocks: Component name, then feature groups

---

## Anthropic Type Patterns

### Pattern 1: Type Re-exports

**When to use:** When you need Anthropic SDK types in your code

**Code example:**
```typescript
// lib/anthropic/types.ts
import type Anthropic from '@anthropic-ai/sdk';

// Re-export commonly used types from SDK
export type ContentBlock = Anthropic.ContentBlock;
export type TextBlock = Anthropic.TextBlock;
export type ThinkingBlock = Anthropic.ThinkingBlock;
export type ToolUseBlock = Anthropic.ToolUseBlock;
export type Message = Anthropic.Message;
export type MessageCreateParams = Anthropic.MessageCreateParams;
export type Usage = Anthropic.Usage;

/**
 * Extended Usage interface that includes thinking_tokens
 * The SDK's Usage type doesn't expose thinking_tokens yet,
 * but it's returned by the API when using extended thinking.
 */
export interface ExtendedUsage extends Anthropic.Usage {
  thinking_tokens?: number;
}

/**
 * Extended Message with ExtendedUsage
 */
export interface ExtendedMessage extends Omit<Anthropic.Message, 'usage'> {
  usage: ExtendedUsage;
}

/**
 * Thinking configuration for extended thinking requests
 */
export interface ThinkingConfig {
  type: 'enabled';
  budget_tokens: number;
}

/**
 * Extended MessageCreateParams that includes thinking
 */
export interface ExtendedMessageCreateParams extends Anthropic.MessageCreateParams {
  thinking?: ThinkingConfig;
}
```

**Key points:**
- Use `import type` for type-only imports (better tree-shaking)
- Extend SDK types rather than recreating them
- Document why extensions are needed

### Pattern 2: Type Guards

**When to use:** When processing Claude API response content blocks

**Code example:**
```typescript
// lib/anthropic/type-guards.ts
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Type guard to check if a content block is a TextBlock
 */
export function isTextBlock(block: Anthropic.ContentBlock): block is Anthropic.TextBlock {
  return block.type === 'text';
}

/**
 * Type guard to check if a content block is a ThinkingBlock
 */
export function isThinkingBlock(block: Anthropic.ContentBlock): block is Anthropic.ThinkingBlock {
  return block.type === 'thinking';
}

/**
 * Type guard to check if a content block is a ToolUseBlock
 */
export function isToolUseBlock(block: Anthropic.ContentBlock): block is Anthropic.ToolUseBlock {
  return block.type === 'tool_use';
}

/**
 * Extract text from a Message response
 * Returns the first TextBlock's content or empty string
 */
export function extractText(response: Anthropic.Message): string {
  const textBlock = response.content.find(isTextBlock);
  return textBlock?.text ?? '';
}

/**
 * Extract thinking from a Message response
 * Returns the first ThinkingBlock's thinking or null
 */
export function extractThinking(response: Anthropic.Message): string | null {
  const thinkingBlock = response.content.find(isThinkingBlock);
  return thinkingBlock?.thinking ?? null;
}
```

**Key points:**
- Type guards use `is` keyword for TypeScript narrowing
- Keep guards simple and focused on one type
- Add helper functions for common extraction patterns

### Pattern 3: Request Configuration

**When to use:** Building Claude API requests with optional thinking

**Code example:**
```typescript
// BEFORE (any type):
const requestConfig: any = {
  model: modelId,
  max_tokens: 4000,
  messages: [{ role: 'user', content: prompt }],
};
if (thinkingBudget > 0) {
  requestConfig.thinking = { type: 'enabled', budget_tokens: thinkingBudget };
}

// AFTER (proper types):
import type { ExtendedMessageCreateParams, ThinkingConfig } from '@/lib/anthropic/types';

const requestConfig: ExtendedMessageCreateParams = {
  model: modelId,
  max_tokens: 4000,
  temperature: 1,
  messages: [{ role: 'user', content: prompt }],
};

if (thinkingBudget > 0) {
  requestConfig.thinking = {
    type: 'enabled',
    budget_tokens: thinkingBudget,
  };
}
```

**Key points:**
- Use `ExtendedMessageCreateParams` instead of `any`
- The `thinking` property is optional in the extended type
- Temperature is required by the API but sometimes omitted

### Pattern 4: Usage with Thinking Tokens

**When to use:** Accessing thinking_tokens from API response

**Code example:**
```typescript
// BEFORE (any cast):
const thinkingTokens = (response.usage as any).thinking_tokens || 0;

// AFTER (proper type guard):
import type { ExtendedUsage } from '@/lib/anthropic/types';
import { isThinkingBlock } from '@/lib/anthropic/type-guards';

// Check if thinking was used first
const thinkingBlock = response.content.find(isThinkingBlock);

// Only access thinking_tokens if thinking was enabled
const thinkingTokens = thinkingBlock
  ? (response.usage as ExtendedUsage).thinking_tokens ?? 0
  : 0;
```

**Key points:**
- Cast to `ExtendedUsage` only when thinking was enabled
- Use optional chaining with nullish coalescing (`?? 0`)
- Check for ThinkingBlock presence before accessing thinking_tokens

### Pattern 5: Reflection Interface Fix

**When to use:** Defining the Reflection interface in temporal-distribution.ts

**Code example:**
```typescript
// BEFORE:
export interface Reflection {
  id: string;
  created_at: string;
  [key: string]: any;  // Bad - allows any property
}

// AFTER:
export interface Reflection {
  id: string;
  created_at: string;
  dream?: string;
  plan?: string;
  relationship?: string;
  offering?: string;
  dream_date?: string;
  dreams?: {
    title: string;
    category: string;
  };
  [key: string]: string | { title: string; category: string } | undefined;
}
```

**Key points:**
- Define known properties explicitly
- Index signature uses union of actual types
- Optional properties for fields that may not exist

---

## Component Testing Patterns

### Pattern 1: Basic Component Test Structure

**When to use:** Every component test file

**Code example:**
```typescript
// components/ui/glass/__tests__/GlowButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { GlowButton } from '../GlowButton';

describe('GlowButton', () => {
  describe('rendering', () => {
    test('renders children correctly', () => {
      render(<GlowButton>Click me</GlowButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    test('applies default variant', () => {
      render(<GlowButton>Default</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
    });
  });

  describe('variants', () => {
    test('applies cosmic variant', () => {
      render(<GlowButton variant="cosmic">Cosmic</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
    });

    test('applies danger variant', () => {
      render(<GlowButton variant="danger">Danger</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-mirror-error');
    });
  });

  describe('sizes', () => {
    test('applies small size', () => {
      render(<GlowButton size="sm">Small</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    test('applies large size', () => {
      render(<GlowButton size="lg">Large</GlowButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-4');
    });
  });

  describe('interactions', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick}>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick} disabled>Click</GlowButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('has correct button type', () => {
      render(<GlowButton type="submit">Submit</GlowButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    test('is disabled when disabled prop is true', () => {
      render(<GlowButton disabled>Disabled</GlowButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

**Key points:**
- Group tests by feature (rendering, variants, interactions, accessibility)
- Use `screen.getByRole` for accessible queries
- Mock functions with `vi.fn()`
- Test both positive and negative cases

### Pattern 2: Pure Presentational Component Test

**When to use:** Components that only render props (ToneBadge, GradientText, etc.)

**Code example:**
```typescript
// components/reflection/__tests__/ToneBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ToneBadge } from '../ToneBadge';

describe('ToneBadge', () => {
  describe('rendering', () => {
    test('renders tone text', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toBeInTheDocument();
    });

    test('capitalizes tone text', () => {
      render(<ToneBadge tone="fusion" />);
      expect(screen.getByText('fusion')).toHaveClass('capitalize');
    });
  });

  describe('tone colors', () => {
    test('applies gentle (purple) colors', () => {
      render(<ToneBadge tone="gentle" />);
      const badge = screen.getByText('gentle');
      expect(badge).toHaveClass('bg-purple-500/20', 'text-purple-300');
    });

    test('applies fusion (amber) colors', () => {
      render(<ToneBadge tone="fusion" />);
      const badge = screen.getByText('fusion');
      expect(badge).toHaveClass('bg-amber-500/20', 'text-amber-300');
    });

    test('applies intense (red) colors', () => {
      render(<ToneBadge tone="intense" />);
      const badge = screen.getByText('intense');
      expect(badge).toHaveClass('bg-red-500/20', 'text-red-300');
    });

    test('falls back to gentle colors for unknown tone', () => {
      render(<ToneBadge tone="unknown" />);
      const badge = screen.getByText('unknown');
      expect(badge).toHaveClass('bg-purple-500/20');
    });
  });

  describe('glow effect', () => {
    test('shows glow by default', () => {
      render(<ToneBadge tone="gentle" />);
      expect(screen.getByText('gentle')).toHaveClass('shadow-lg');
    });

    test('hides glow when showGlow is false', () => {
      render(<ToneBadge tone="gentle" showGlow={false} />);
      expect(screen.getByText('gentle')).not.toHaveClass('shadow-lg');
    });
  });

  describe('custom className', () => {
    test('applies custom className', () => {
      render(<ToneBadge tone="gentle" className="custom-class" />);
      expect(screen.getByText('gentle')).toHaveClass('custom-class');
    });
  });
});
```

**Key points:**
- Test all prop variations
- Test fallback/default behavior
- Test CSS class application
- No interaction tests needed for pure components

### Pattern 3: Character Counter / Progress Component Test

**When to use:** Components with calculated display values

**Code example:**
```typescript
// components/reflection/__tests__/CharacterCounter.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CharacterCounter from '../CharacterCounter';

describe('CharacterCounter', () => {
  describe('display', () => {
    test('shows current and max count', () => {
      render(<CharacterCounter current={50} max={200} />);
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    test('shows separator between counts', () => {
      render(<CharacterCounter current={50} max={200} />);
      expect(screen.getByText('/')).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    test('renders progress bar with correct aria attributes', () => {
      render(<CharacterCounter current={50} max={200} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '200');
    });

    test('has accessible label', () => {
      render(<CharacterCounter current={75} max={100} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Character count: 75 of 100');
    });
  });

  describe('warning state', () => {
    test('adds warning class at 85% by default', () => {
      render(<CharacterCounter current={170} max={200} />);
      const container = screen.getByText('170').closest('.character-counter');
      expect(container).toHaveClass('warning');
    });

    test('does not add warning class below threshold', () => {
      render(<CharacterCounter current={100} max={200} />);
      const container = screen.getByText('100').closest('.character-counter');
      expect(container).not.toHaveClass('warning');
    });

    test('uses custom warning threshold', () => {
      render(<CharacterCounter current={150} max={200} warning={140} />);
      const container = screen.getByText('150').closest('.character-counter');
      expect(container).toHaveClass('warning');
    });
  });

  describe('error state', () => {
    test('adds error class at 100%', () => {
      render(<CharacterCounter current={200} max={200} />);
      const container = screen.getByText('200').closest('.character-counter');
      expect(container).toHaveClass('error');
    });

    test('adds error class when exceeding max', () => {
      render(<CharacterCounter current={250} max={200} />);
      const container = screen.getByText('250').closest('.character-counter');
      expect(container).toHaveClass('error');
    });

    test('announces limit reached for screen readers', () => {
      render(<CharacterCounter current={200} max={200} />);
      expect(screen.getByText('Character limit reached')).toBeInTheDocument();
    });
  });
});
```

**Key points:**
- Test threshold behaviors (warning at 85%, error at 100%)
- Test accessibility attributes (aria-*)
- Test calculated values (percentages, colors)
- Test screen reader announcements

### Pattern 4: Mocking Haptic Feedback

**When to use:** Components that use haptic feedback (GlowButton)

**Code example:**
```typescript
// At the top of test file
vi.mock('@/lib/utils/haptics', () => ({
  haptic: vi.fn(),
}));

import { haptic } from '@/lib/utils/haptics';

// In test
test('triggers haptic feedback on click', () => {
  render(<GlowButton onClick={() => {}}>Click</GlowButton>);
  fireEvent.click(screen.getByRole('button'));
  expect(haptic).toHaveBeenCalledWith('light');
});

test('does not trigger haptic when disabled', () => {
  render(<GlowButton onClick={() => {}} disabled>Click</GlowButton>);
  fireEvent.click(screen.getByRole('button'));
  expect(haptic).not.toHaveBeenCalled();
});
```

### Pattern 5: Testing with Framer Motion

**When to use:** Components that use framer-motion animations

**Code example:**
```typescript
// Mock framer-motion for predictable testing
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,  // Disable animations in tests
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
      ),
      span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
        <span {...props}>{children}</span>
      ),
    },
  };
});
```

**Key points:**
- Mock motion components to plain HTML elements
- Set `useReducedMotion` to true for consistent tests
- Import actual module for non-mocked exports

---

## Setup File Patterns

### vitest.setup.ts Addition

**Code example:**
```typescript
// vitest.setup.ts - ADD this import at the top
import '@testing-library/jest-dom/vitest';

// ... existing setup code ...
```

### vitest.config.ts Coverage Update

**Code example:**
```typescript
// In vitest.config.ts, update coverage.include:
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: [
    'lib/**/*.ts',
    'server/**/*.ts',
    'types/**/*.ts',
    'components/**/*.tsx',  // ADD THIS LINE
  ],
  exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
  // ... rest of config
}
```

---

## Import Order Convention

```typescript
// 1. React and testing imports
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

// 2. Component being tested (relative path)
import { ComponentName } from '../ComponentName';

// 3. Other local imports (absolute paths)
import { helper } from '@/lib/utils';
```

---

## Test File Naming Convention

| Component Location | Test File Location |
|-------------------|-------------------|
| `components/ui/glass/GlowButton.tsx` | `components/ui/glass/__tests__/GlowButton.test.tsx` |
| `components/reflection/ToneBadge.tsx` | `components/reflection/__tests__/ToneBadge.test.tsx` |
| `components/dashboard/shared/TierBadge.tsx` | `components/dashboard/shared/__tests__/TierBadge.test.tsx` |

---

## Code Quality Standards

- **No `any` types in production code** - Use proper types or `unknown`
- **Type guards for narrowing** - Use `is` keyword for type predicates
- **Test describe blocks** - Group by feature (rendering, interactions, accessibility)
- **Accessible queries first** - Prefer `getByRole` over `getByTestId`
- **Mock only what's necessary** - Import actual utilities when possible
