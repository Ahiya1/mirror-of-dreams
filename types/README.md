# Types Directory

This directory contains all shared TypeScript type definitions for the Mirror of Dreams application.

## Structure

```
types/
├── index.ts         # Re-exports all types
├── user.ts          # User, JWTPayload, UserRow, transformation functions
├── reflection.ts    # Reflection, ReflectionCreateInput, etc.
├── subscription.ts  # Subscription, Payment, Usage types
├── evolution.ts     # EvolutionReport types
├── artifact.ts      # Artifact types
├── api.ts           # ApiResponse, PaginatedResponse, utility types
├── schemas.ts       # Zod validation schemas for tRPC
└── README.md        # This file
```

## Usage

### Importing Types

```typescript
// Import all types
import { User, Reflection, ApiResponse } from '@/types';

// Import specific module
import { User, UserRow, userRowToUser } from '@/types/user';

// Import validation schemas
import { createReflectionSchema, signupSchema } from '@/types/schemas';
```

## Type Categories

### User Types (`user.ts`)

- **User**: Application representation of a user
- **UserRow**: Database row from Supabase
- **JWTPayload**: JWT token structure
- **userRowToUser()**: Transformation function

### Reflection Types (`reflection.ts`)

- **Reflection**: Application representation
- **ReflectionRow**: Database row
- **ReflectionCreateInput**: Input for creating reflections
- **reflectionRowToReflection()**: Transformation function

### Subscription Types (`subscription.ts`)

- **Subscription**: Subscription details
- **Usage**: Monthly usage information
- **TierLimits**: Reflection limits per tier
- **PaymentIntentInput**: Payment creation input

### Evolution Types (`evolution.ts`)

- **EvolutionReport**: Evolution report data
- **EvolutionProgress**: Progress tracking
- **evolutionReportRowToEvolutionReport()**: Transformation

### Artifact Types (`artifact.ts`)

- **Artifact**: Generated artifact data
- **ArtifactCreateInput**: Input for artifact generation

### API Types (`api.ts`)

- **ApiResponse<T>**: Generic API response wrapper
- **PaginatedResponse<T>**: Paginated list response
- **ApiError**: Error response structure

### Validation Schemas (`schemas.ts`)

All Zod schemas for tRPC input validation:

- **signupSchema**, **signinSchema**
- **createReflectionSchema**, **reflectionListSchema**
- **evolutionReportInputSchema**
- **paymentIntentSchema**
- And more...

## Naming Conventions

### Types/Interfaces

- **PascalCase** for types and interfaces
- Suffix `Input` for creation/update inputs
- Suffix `Row` for database row types

### Functions

- **camelCase** for transformation functions
- Pattern: `{entityName}RowTo{EntityName}`

### Enums/Unions

- **PascalCase** for type names
- **kebab-case** for string literal values

## Transformation Functions

Database rows use `snake_case` (Supabase convention), but application code uses `camelCase`.

Use transformation functions to convert:

```typescript
import { userRowToUser } from '@/types/user';

const row: UserRow = await supabase.from('users').select('*').single();
const user: User = userRowToUser(row);
```

## Integration with tRPC

Validation schemas are used in tRPC procedures:

```typescript
import { createReflectionSchema } from '@/types/schemas';

export const reflectionsRouter = router({
  create: protectedProcedure.input(createReflectionSchema).mutation(async ({ ctx, input }) => {
    // input is fully typed and validated
  }),
});
```

## TypeScript Configuration

All types use strict mode:

- `strict: true`
- `strictNullChecks: true`
- `noImplicitAny: true`

## Future Enhancements

- Add Dream types (Iteration 2)
- Add Visualization types (Iteration 3)
- Add PayPal payment types (Iteration 4)
