# Code Patterns & Conventions

This document provides copy-pasteable code patterns for all builders. Every pattern includes full working examples that can be adapted for specific use cases.

---

## File Structure

```
mirror-of-dreams/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline
├── app/                        # Next.js app router
├── components/                 # React components
│   └── __tests__/             # Component tests (future)
├── lib/
│   ├── utils/                 # Utility functions
│   │   └── __tests__/        # Utility tests
│   ├── clarify/               # Clarify feature
│   │   └── __tests__/        # Clarify tests
│   └── voice/                 # Voice/tone utilities
├── server/
│   ├── lib/                   # Server utilities
│   │   └── __tests__/        # Server tests (existing)
│   └── trpc/                  # tRPC routers
│       └── __tests__/        # tRPC tests (existing)
├── test/
│   ├── mocks/                 # Shared mock factories
│   └── fixtures/              # Test data factories
├── types/
│   └── __tests__/            # Type/schema tests
├── eslint.config.mjs          # ESLint flat config
├── .prettierrc                # Prettier config
├── .prettierignore            # Prettier ignore
├── vitest.config.ts           # Vitest config
├── vitest.setup.ts            # Test setup
└── package.json
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AccountCard.tsx` |
| Utility files | camelCase | `formatCurrency.ts` |
| Test files | `*.test.ts` | `limits.test.ts` |
| Type files | camelCase | `user.ts` |
| Types/Interfaces | PascalCase | `User`, `ReflectionData` |
| Functions | camelCase | `calculateCost()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Env variables | SCREAMING_SNAKE_CASE | `SUPABASE_URL` |

---

## ESLint Patterns

### ESLint Flat Config (eslint.config.mjs)

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      '.2L/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Next.js specific
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
```

### Disabling Rules Inline

```typescript
// Disable for single line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response.body;

// Disable for block
/* eslint-disable no-console */
console.log('Debug info');
console.log('More debug');
/* eslint-enable no-console */

// Disable for file (at top)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

---

## Prettier Patterns

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Prettier Ignore (.prettierignore)

```
node_modules
.next
out
coverage
.2L
*.min.js
pnpm-lock.yaml
package-lock.json
```

---

## Vitest Patterns

### Vitest Configuration (vitest.config.ts)

```typescript
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', '.2L'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'server/**/*.ts', 'types/**/*.ts'],
      exclude: ['**/*.d.ts', '**/__tests__/**', '**/test/**'],
    },
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/server': path.resolve(__dirname, './server'),
    },
  },
});
```

### Vitest Setup (vitest.setup.ts)

```typescript
import { beforeEach, vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.PAYPAL_CLIENT_ID = 'test-paypal-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-secret';

// Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
});

// Global fetch mock (can be overridden in individual tests)
global.fetch = vi.fn();
```

---

## Test Patterns

### Basic Unit Test Structure

```typescript
import { describe, expect, test } from 'vitest';

import { functionToTest } from '../functionToTest';

describe('functionToTest', () => {
  describe('when given valid input', () => {
    test('should return expected output', () => {
      // Arrange
      const input = 'test input';
      const expected = 'expected output';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('when given invalid input', () => {
    test('should throw an error', () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      expect(() => functionToTest(invalidInput)).toThrow('Input required');
    });
  });
});
```

### Async Function Test

```typescript
import { describe, expect, test } from 'vitest';

import { asyncFunction } from '../asyncFunction';

describe('asyncFunction', () => {
  test('should resolve with data', async () => {
    // Arrange
    const input = { id: '123' };

    // Act
    const result = await asyncFunction(input);

    // Assert
    expect(result).toEqual({ id: '123', processed: true });
  });

  test('should reject on error', async () => {
    // Arrange
    const badInput = { id: '' };

    // Act & Assert
    await expect(asyncFunction(badInput)).rejects.toThrow('Invalid ID');
  });
});
```

### Test with Mocks

```typescript
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { functionWithDependency } from '../functionWithDependency';
import * as dependency from '../dependency';

// Mock the dependency module
vi.mock('../dependency', () => ({
  externalCall: vi.fn(),
}));

describe('functionWithDependency', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should call dependency and return transformed result', async () => {
    // Arrange
    const mockResponse = { data: 'from dependency' };
    vi.mocked(dependency.externalCall).mockResolvedValue(mockResponse);

    // Act
    const result = await functionWithDependency('input');

    // Assert
    expect(dependency.externalCall).toHaveBeenCalledWith('input');
    expect(result).toEqual({ processed: 'from dependency' });
  });

  test('should handle dependency error', async () => {
    // Arrange
    vi.mocked(dependency.externalCall).mockRejectedValue(new Error('API error'));

    // Act & Assert
    await expect(functionWithDependency('input')).rejects.toThrow('API error');
  });
});
```

### Fetch Mock Pattern

```typescript
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { apiClient } from '../apiClient';

describe('apiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = mockFetch;
  });

  test('should make GET request and return data', async () => {
    // Arrange
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await apiClient.get('/users/1');

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  test('should handle API error response', async () => {
    // Arrange
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
    mockFetch.mockResolvedValue(mockResponse);

    // Act & Assert
    await expect(apiClient.get('/users/999')).rejects.toThrow('Not Found');
  });
});
```

---

## Mock Factory Patterns

### User Mock Factory (test/fixtures/users.ts)

```typescript
import type { User } from '@/types/user';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-uuid-1234',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free',
  subscriptionStatus: 'active',
  reflectionCountThisMonth: 0,
  reflectionsToday: 0,
  lastReflectionDate: null,
  totalReflections: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Pre-configured user scenarios
export const freeTierUser = createMockUser({
  tier: 'free',
  reflectionCountThisMonth: 0,
});

export const freeTierAtLimit = createMockUser({
  tier: 'free',
  reflectionCountThisMonth: 2, // Free tier limit
});

export const proTierUser = createMockUser({
  tier: 'pro',
  subscriptionStatus: 'active',
});

export const proTierAtDailyLimit = createMockUser({
  tier: 'pro',
  reflectionsToday: 1, // Pro daily limit
  lastReflectionDate: new Date().toISOString().split('T')[0],
});

export const unlimitedTierUser = createMockUser({
  tier: 'unlimited',
  subscriptionStatus: 'active',
});
```

### Supabase Mock Factory (test/mocks/supabase.ts)

```typescript
import { vi } from 'vitest';

/**
 * Creates a chainable Supabase query mock
 * Usage: mockSupabaseQuery({ data: [...], error: null })
 */
export const createSupabaseQueryMock = <T>(response: {
  data: T | null;
  error: Error | null;
}) => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
    then: vi.fn((resolve) => resolve(response)),
  };

  return mockChain;
};

/**
 * Creates a full Supabase client mock
 */
export const createSupabaseMock = () => ({
  from: vi.fn((table: string) => createSupabaseQueryMock({ data: null, error: null })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signIn: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    }),
  },
});

// Module mock for vi.mock()
export const supabaseMock = createSupabaseMock();
```

### Using Supabase Mock in Tests

```typescript
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getUserById } from '@/server/lib/users';
import { createSupabaseQueryMock, supabaseMock } from '@/test/mocks/supabase';
import { createMockUser } from '@/test/fixtures/users';

// Mock the supabase module
vi.mock('@/server/lib/supabase', () => ({
  supabase: supabaseMock,
}));

describe('getUserById', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should return user when found', async () => {
    // Arrange
    const mockUser = createMockUser({ id: 'user-123' });
    const queryMock = createSupabaseQueryMock({
      data: mockUser,
      error: null,
    });
    supabaseMock.from.mockReturnValue(queryMock);

    // Act
    const result = await getUserById('user-123');

    // Assert
    expect(supabaseMock.from).toHaveBeenCalledWith('users');
    expect(queryMock.eq).toHaveBeenCalledWith('id', 'user-123');
    expect(result).toEqual(mockUser);
  });

  test('should return null when user not found', async () => {
    // Arrange
    const queryMock = createSupabaseQueryMock({
      data: null,
      error: null,
    });
    supabaseMock.from.mockReturnValue(queryMock);

    // Act
    const result = await getUserById('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});
```

---

## Zod Schema Test Pattern

```typescript
import { describe, expect, test } from 'vitest';

import { signupSchema } from '@/types/schemas';

describe('signupSchema', () => {
  describe('valid inputs', () => {
    test('should accept valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('email validation', () => {
    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    test('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('password validation', () => {
    test('should reject password shorter than minimum length', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      };

      const result = signupSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });
});
```

---

## Date Handling in Tests

```typescript
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { checkDailyLimit } from '@/lib/utils/limits';

describe('checkDailyLimit', () => {
  beforeEach(() => {
    // Fix the current date for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should return true when user has not reflected today', () => {
    const user = {
      lastReflectionDate: '2024-06-14', // Yesterday
      reflectionsToday: 0,
    };

    const result = checkDailyLimit(user);

    expect(result).toBe(true);
  });

  test('should return false when user at daily limit', () => {
    const user = {
      lastReflectionDate: '2024-06-15', // Today
      reflectionsToday: 1,
      tier: 'pro',
    };

    const result = checkDailyLimit(user);

    expect(result).toBe(false);
  });
});
```

---

## Husky + lint-staged Patterns

### Husky Setup Commands

```bash
# Initialize Husky (run once)
npx husky init

# Creates .husky/pre-commit automatically
```

### Pre-commit Hook (.husky/pre-commit)

```bash
npx lint-staged
```

### lint-staged Configuration (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

---

## Import Order Convention

```typescript
// 1. Node.js built-in modules
import path from 'path';
import { readFileSync } from 'fs';

// 2. External packages (npm modules)
import { z } from 'zod';
import { describe, expect, test } from 'vitest';

// 3. Internal modules (absolute imports with @/)
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';

// 4. Parent imports
import { helperFunction } from '../helpers';

// 5. Sibling imports
import { localUtil } from './localUtil';

// 6. Type-only imports (at the end)
import type { Config } from './types';
```

---

## GitHub Actions Workflow Pattern

### CI Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false
```

---

## Error Handling Pattern in Tests

```typescript
import { describe, expect, test } from 'vitest';

import { riskyOperation } from '../riskyOperation';

describe('riskyOperation error handling', () => {
  test('should throw specific error type', () => {
    expect(() => riskyOperation(null)).toThrow(TypeError);
  });

  test('should throw with specific message', () => {
    expect(() => riskyOperation(null)).toThrow('Input cannot be null');
  });

  test('should throw error matching pattern', () => {
    expect(() => riskyOperation(null)).toThrow(/cannot be null/i);
  });

  test('async function should reject with error', async () => {
    await expect(riskyOperation(null)).rejects.toThrow('Input cannot be null');
  });

  test('should contain error details', () => {
    try {
      riskyOperation(null);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as Error).message).toContain('null');
    }
  });
});
```

---

## Code Quality Standards

| Standard | Description | Example |
|----------|-------------|---------|
| No `any` types | Use specific types or `unknown` | `data: unknown` not `data: any` |
| No console.log | Use proper logging or remove | Remove debug logs before commit |
| Explicit returns | All functions should have clear return paths | Avoid implicit undefined returns |
| Const by default | Use `const` unless mutation needed | `const x = 1` not `let x = 1` |
| Descriptive names | Variable names should be self-documenting | `userEmail` not `e` |
| Test descriptions | Tests should read as documentation | `should return user when found` |

---

*Code patterns for Iteration 29: Code Quality & Testing Foundation*
