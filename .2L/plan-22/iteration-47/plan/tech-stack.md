# Technology Stack - Dashboard Component Tests

## Testing Framework

**Decision:** Vitest + React Testing Library

**Rationale:**
- Already configured in project via `vitest.config.ts`
- Provides fast, Vite-native test execution
- React Testing Library promotes testing user behavior over implementation
- happy-dom environment already configured for DOM testing

**Alternatives Considered:**
- Jest: Would require separate configuration, slower than Vitest

## Test Environment

**Decision:** happy-dom

**Rationale:**
- Already configured in `vitest.setup.ts`
- Lighter weight than jsdom
- Sufficient for component testing needs

## Assertion Library

**Decision:** @testing-library/jest-dom/vitest

**Rationale:**
- Provides DOM-specific matchers like `toBeInTheDocument()`, `toHaveClass()`
- Already integrated in project setup

## Mock Utilities

**Decision:** Vitest built-in mocking (`vi.mock`, `vi.fn`, `vi.mocked`)

**Rationale:**
- Native to Vitest, no additional dependencies
- Existing test helpers already use these utilities
- Type-safe mocking with `vi.mocked()`

## Test Helpers

**Location:** `@/test/helpers`

**Available Utilities:**
- `renderWithProviders` - Renders components with QueryClient provider
- `createTestQueryClient` - Creates test-configured QueryClient
- `createMockQueryResult` - Creates successful query result mock
- `createMockLoadingResult` - Creates loading state query result mock
- `createMockErrorResult` - Creates error state query result mock
- `createMockMutation` - Creates mutation mock with configurable states
- Testing Library re-exports (screen, fireEvent, waitFor, etc.)

## Dependencies for Tests

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | Existing | Test runner |
| @testing-library/react | Existing | React component testing |
| @testing-library/jest-dom | Existing | DOM assertions |
| happy-dom | Existing | DOM environment |

## Mock Strategies by Component Type

### tRPC Queries (All Card Components)

```typescript
vi.mock('@/lib/trpc', () => ({
  trpc: {
    dreams: { list: { useQuery: vi.fn() }, getLimits: { useQuery: vi.fn() } },
    reflections: { list: { useQuery: vi.fn() } },
    evolution: { list: { useQuery: vi.fn() }, checkEligibility: { useQuery: vi.fn() } },
    visualizations: { list: { useQuery: vi.fn() } },
  },
}));
```

### Next.js Router (Card Components with Navigation)

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
```

### useAuth Hook (DashboardHero)

```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { name: 'Test User', tier: 'free' }, isLoading: false })),
}));
```

### Framer Motion (DashboardCard)

```typescript
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  useReducedMotion: vi.fn(() => false),
}));
```

### Glass UI Components (All Cards)

```typescript
vi.mock('@/components/ui/glass', () => ({
  GlowButton: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  CosmicLoader: ({ label }) => <div data-testid="loader">{label}</div>,
}));
```

## Coverage Targets

| Component | Target Coverage |
|-----------|-----------------|
| DashboardCard | 80% |
| DreamsCard | 80% |
| EvolutionCard | 80% |
| ReflectionsCard | 80% |
| VisualizationCard | 80% |
| ReflectionItem | 80% |
| DashboardHero | 80% |

## Test File Naming Convention

- Test files: `{ComponentName}.test.tsx`
- Location: `__tests__/` directory adjacent to component
- Example: `components/dashboard/cards/__tests__/DreamsCard.test.tsx`

## Test Organization

```
describe('ComponentName', () => {
  describe('rendering', () => { ... });
  describe('loading state', () => { ... });
  describe('error state', () => { ... });
  describe('empty state', () => { ... });
  describe('with data', () => { ... });
  describe('interactions', () => { ... });
});
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- components/dashboard/cards/__tests__/DreamsCard.test.tsx

# Run with coverage
npm run test:coverage
```
