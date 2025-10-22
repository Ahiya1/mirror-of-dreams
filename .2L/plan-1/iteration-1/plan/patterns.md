# Code Patterns & Conventions

## File Structure

```
mirror-of-dreams/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page (/)
│   ├── auth/                      # Authentication pages
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx         # User dashboard
│   ├── reflection/                # Reflection flow
│   │   ├── page.tsx               # Questionnaire
│   │   └── output/page.tsx        # AI output
│   ├── reflections/               # NEW: Reflection history
│   │   ├── page.tsx               # List view
│   │   └── [id]/page.tsx          # Detail view
│   └── api/
│       ├── trpc/[trpc]/route.ts   # tRPC handler
│       └── webhooks/
│           └── stripe/route.ts    # Stripe webhooks (NOT tRPC)
├── components/                    # React components
│   ├── auth/                      # Auth forms
│   ├── dashboard/                 # Dashboard cards
│   ├── mirror/                    # Reflection components
│   ├── portal/                    # Landing page
│   ├── shared/                    # Shared UI components
│   └── ui/                        # shadcn/ui components
├── server/                        # Backend code
│   ├── trpc/
│   │   ├── trpc.ts                # tRPC instance
│   │   ├── context.ts             # Request context
│   │   ├── middleware.ts          # Auth middleware
│   │   └── routers/
│   │       ├── _app.ts            # Root router
│   │       ├── auth.ts            # Authentication
│   │       ├── reflections.ts     # Reflection CRUD
│   │       ├── reflection.ts      # AI generation
│   │       ├── users.ts           # User management
│   │       ├── evolution.ts       # Evolution reports
│   │       ├── artifact.ts        # Artifact generation
│   │       ├── subscriptions.ts   # Subscription management
│   │       ├── payment.ts         # Payment intents
│   │       └── admin.ts           # Admin operations
│   └── lib/
│       ├── claude.ts              # Claude API client
│       ├── supabase.ts            # Supabase client
│       └── prompts.ts             # Prompt loader
├── lib/                           # Shared utilities (client + server)
│   ├── utils.ts                   # General utilities
│   └── constants.ts               # Tier limits, etc.
├── types/                         # TypeScript types
│   ├── index.ts                   # Re-export all types
│   ├── user.ts                    # User types
│   ├── reflection.ts              # Reflection types
│   ├── subscription.ts            # Subscription types
│   └── schemas.ts                 # Zod validation schemas
├── prompts/                       # AI prompts (preserved)
│   ├── base_instructions.txt
│   ├── gentle_clarity.txt
│   ├── luminous_intensity.txt
│   ├── sacred_fusion.txt
│   ├── creator_context.txt
│   └── evolution_instructions.txt
├── public/                        # Static assets
│   └── [images, fonts, etc.]
├── styles/                        # Global CSS
│   └── globals.css                # Tailwind imports + custom CSS
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind config
├── next.config.js                 # Next.js config
└── package.json                   # Dependencies
```

---

## Naming Conventions

**Components:** PascalCase
```typescript
SigninForm.tsx
DashboardCard.tsx
ReflectionDetail.tsx
```

**Files:** camelCase (except components)
```typescript
utils.ts
formatCurrency.ts
tierLimits.ts
```

**Types/Interfaces:** PascalCase
```typescript
type User = { ... }
interface ReflectionCreateInput { ... }
type SubscriptionTier = 'free' | 'essential' | 'premium'
```

**Functions:** camelCase
```typescript
function calculateUsage() { ... }
async function generateReflection() { ... }
const fetchUserData = async () => { ... }
```

**Constants:** SCREAMING_SNAKE_CASE
```typescript
const MAX_REFLECTIONS = 10;
const TIER_LIMITS = { ... };
const JWT_EXPIRY_DAYS = 30;
```

**tRPC Procedures:** camelCase
```typescript
export const authRouter = router({
  signup: publicProcedure...,
  signin: publicProcedure...,
  verifyToken: publicProcedure...,
});
```

**Database Tables:** snake_case (Supabase convention)
```sql
users
reflections
evolution_reports
usage_tracking
```

---

## TypeScript Patterns

### User Type Definition

**File:** `types/user.ts`

```typescript
export type SubscriptionTier = 'free' | 'essential' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
export type Language = 'en' | 'he';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriod: 'monthly' | 'yearly' | null;
  reflectionCountThisMonth: number;
  totalReflections: number;
  currentMonthYear: string; // "2025-01"
  isCreator: boolean;
  isAdmin: boolean;
  language: Language;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  isCreator: boolean;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

// Utility type: User without sensitive fields
export type PublicUser = Omit<User, 'passwordHash'>;

// Database row type (matches Supabase)
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: string;
  subscription_status: string;
  subscription_period: string | null;
  reflection_count_this_month: number;
  total_reflections: number;
  current_month_year: string;
  is_creator: boolean;
  is_admin: boolean;
  language: string;
  email_verified: boolean;
  created_at: string;
  last_sign_in_at: string;
  updated_at: string;
}

// Transform database row to User type
export function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    tier: row.tier as SubscriptionTier,
    subscriptionStatus: row.subscription_status as SubscriptionStatus,
    subscriptionPeriod: row.subscription_period as 'monthly' | 'yearly' | null,
    reflectionCountThisMonth: row.reflection_count_this_month,
    totalReflections: row.total_reflections,
    currentMonthYear: row.current_month_year,
    isCreator: row.is_creator,
    isAdmin: row.is_admin,
    language: row.language as Language,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    updatedAt: row.updated_at,
  };
}
```

### Reflection Type Definition

**File:** `types/reflection.ts`

```typescript
export type ReflectionTone = 'gentle' | 'intense' | 'fusion';
export type HasDate = 'yes' | 'no';

export interface Reflection {
  id: string;
  userId: string;
  dream: string;
  plan: string;
  hasDate: HasDate;
  dreamDate: string | null;
  relationship: string;
  offering: string;
  aiResponse: string;
  tone: ReflectionTone;
  isPremium: boolean;
  wordCount: number;
  estimatedReadTime: number;
  title: string;
  tags: string[];
  rating: number | null;
  userFeedback: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionCreateInput {
  dream: string;
  plan: string;
  hasDate: HasDate;
  dreamDate: string | null;
  relationship: string;
  offering: string;
  tone?: ReflectionTone;
  isPremium?: boolean;
}

export interface ReflectionListParams {
  page?: number;
  limit?: number;
  tone?: ReflectionTone;
  isPremium?: boolean;
  search?: string;
  sortBy?: 'created_at' | 'word_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
```

### Shared Type Index

**File:** `types/index.ts`

```typescript
// Re-export all types for easy importing
export * from './user';
export * from './reflection';
export * from './subscription';
export * from './evolution';
export * from './schemas';

// Utility types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
```

---

## tRPC Patterns

### tRPC Instance Setup

**File:** `server/trpc/trpc.ts`

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson, // Preserves Date, Map, Set, etc.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
```

### Context Creation

**File:** `server/trpc/context.ts`

```typescript
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';
import { type User, userRowToUser } from '@/types';

export async function createContext({ req, res }: CreateNextContextOptions) {
  // Extract JWT token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user: User | null = null;

  if (token) {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      // Fetch fresh user data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error) throw error;

      // Check if monthly usage needs reset
      const currentMonthYear = new Date().toISOString().slice(0, 7); // "2025-01"
      if (data.current_month_year !== currentMonthYear) {
        // Reset monthly counters
        await supabase
          .from('users')
          .update({
            reflection_count_this_month: 0,
            current_month_year: currentMonthYear,
          })
          .eq('id', data.id);

        data.reflection_count_this_month = 0;
        data.current_month_year = currentMonthYear;
      }

      user = userRowToUser(data);
    } catch (e) {
      // Invalid token or database error
      console.error('Context creation error:', e);
      user = null;
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Protected Procedure Middleware

**File:** `server/trpc/middleware.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { middleware } from './trpc';

// Ensure user is authenticated
export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowed to User (not null)
    },
  });
});

// Ensure user is creator or admin
export const isCreatorOrAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (!ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Creator or admin access required.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Ensure user has premium tier
export const isPremium = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.user.tier === 'free' && !ctx.user.isCreator && !ctx.user.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Premium tier required. Please upgrade your subscription.',
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Check usage limits
export const checkUsageLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Creators and admins have unlimited usage
  if (ctx.user.isCreator || ctx.user.isAdmin) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  const TIER_LIMITS = {
    free: 1,
    essential: 5,
    premium: 10,
  };

  const limit = TIER_LIMITS[ctx.user.tier];
  const usage = ctx.user.reflectionCountThisMonth;

  if (usage >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly reflection limit reached (${limit}). Please upgrade or wait until next month.`,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Create protected procedures:**

```typescript
// server/trpc/trpc.ts (add to existing file)
import { isAuthed, isCreatorOrAdmin, isPremium, checkUsageLimit } from './middleware';

export const protectedProcedure = publicProcedure.use(isAuthed);
export const creatorProcedure = publicProcedure.use(isCreatorOrAdmin);
export const premiumProcedure = publicProcedure.use(isAuthed).use(isPremium);
export const usageLimitedProcedure = publicProcedure.use(isAuthed).use(checkUsageLimit);
```

### Authentication Router Example

**File:** `server/trpc/routers/auth.ts`

```typescript
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/server/lib/supabase';
import { type JWTPayload, userRowToUser } from '@/types';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  language: z.enum(['en', 'he']).default('en'),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRouter = router({
  // Sign up new user
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      const { email, password, name, language } = input;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email already registered',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          name,
          language,
          tier: 'free',
          subscription_status: 'active',
          reflection_count_this_month: 0,
          total_reflections: 0,
          current_month_year: new Date().toISOString().slice(0, 7),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }

      // Generate JWT
      const payload: JWTPayload = {
        userId: newUser.id,
        email: newUser.email,
        tier: newUser.tier,
        isCreator: newUser.is_creator,
        isAdmin: newUser.is_admin,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!);

      return {
        user: userRowToUser(newUser),
        token,
        message: 'Account created successfully',
      };
    }),

  // Sign in existing user
  signin: publicProcedure
    .input(signinSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Fetch user with password hash
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if monthly usage needs reset
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      if (user.current_month_year !== currentMonthYear) {
        await supabase
          .from('users')
          .update({
            reflection_count_this_month: 0,
            current_month_year: currentMonthYear,
            last_sign_in_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        user.reflection_count_this_month = 0;
        user.current_month_year = currentMonthYear;
      } else {
        // Update last sign in
        await supabase
          .from('users')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Generate JWT
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!);

      return {
        user: userRowToUser(user),
        token,
        message: 'Signed in successfully',
      };
    }),

  // Verify token and get current user
  verifyToken: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    return {
      user: ctx.user,
      message: 'Token valid',
    };
  }),

  // Get current user (protected)
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        language: z.enum(['en', 'he']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return {
        user: userRowToUser(data),
        message: 'Profile updated successfully',
      };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch user with password hash
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(
        input.currentPassword,
        user.password_hash
      );

      if (!passwordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

      // Update password
      await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id);

      return {
        message: 'Password changed successfully',
      };
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify email matches
      if (input.confirmEmail !== ctx.user.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email confirmation does not match',
        });
      }

      // Fetch user with password hash
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', ctx.user.id)
        .single();

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(input.password, user.password_hash);

      if (!passwordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password is incorrect',
        });
      }

      // Delete user (cascade deletes reflections)
      await supabase.from('users').delete().eq('id', ctx.user.id);

      return {
        message: 'Account deleted successfully',
      };
    }),
});
```

### Reflection CRUD Router Example

**File:** `server/trpc/routers/reflections.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { supabase } from '@/server/lib/supabase';

const createReflectionSchema = z.object({
  dream: z.string().min(1).max(3200),
  plan: z.string().min(1).max(4000),
  hasDate: z.enum(['yes', 'no']),
  dreamDate: z.string().nullable(),
  relationship: z.string().min(1).max(4000),
  offering: z.string().min(1).max(2400),
  tone: z.enum(['gentle', 'intense', 'fusion']).default('fusion'),
  isPremium: z.boolean().default(false),
});

export const reflectionsRouter = router({
  // Get paginated reflection history
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        tone: z.enum(['gentle', 'intense', 'fusion']).optional(),
        isPremium: z.boolean().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['created_at', 'word_count', 'rating']).default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, tone, isPremium, search, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('reflections')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id);

      // Apply filters
      if (tone) {
        query = query.eq('tone', tone);
      }
      if (isPremium !== undefined) {
        query = query.eq('is_premium', isPremium);
      }
      if (search) {
        query = query.or(
          `dream.ilike.%${search}%,plan.ilike.%${search}%,relationship.ilike.%${search}%`
        );
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reflections',
        });
      }

      return {
        items: data || [],
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      };
    }),

  // Get single reflection by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id) // Ensure user owns reflection
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reflection not found',
        });
      }

      // Increment view count
      await supabase
        .from('reflections')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', input.id);

      return data;
    }),

  // Update reflection (title/tags)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('reflections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update reflection',
        });
      }

      return {
        reflection: data,
        message: 'Reflection updated successfully',
      };
    }),

  // Delete reflection
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before delete
      const { data: reflection } = await supabase
        .from('reflections')
        .select('id')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (!reflection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reflection not found',
        });
      }

      // Delete reflection
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete reflection',
        });
      }

      // Decrement usage counter
      await supabase.rpc('decrement_reflection_count', {
        user_id: ctx.user.id,
      });

      return {
        message: 'Reflection deleted successfully',
      };
    }),

  // Submit feedback for reflection
  submitFeedback: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        rating: z.number().min(1).max(10),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rating, feedback } = input;

      const { data, error } = await supabase
        .from('reflections')
        .update({
          rating,
          user_feedback: feedback || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit feedback',
        });
      }

      return {
        reflection: data,
        message: 'Feedback submitted successfully',
      };
    }),

  // Check current usage status
  checkUsage: protectedProcedure.query(async ({ ctx }) => {
    const TIER_LIMITS = {
      free: 1,
      essential: 5,
      premium: 10,
    };

    const limit = ctx.user.isCreator || ctx.user.isAdmin
      ? 999999
      : TIER_LIMITS[ctx.user.tier];

    const used = ctx.user.reflectionCountThisMonth;
    const remaining = Math.max(0, limit - used);
    const canReflect = remaining > 0;

    return {
      tier: ctx.user.tier,
      limit,
      used,
      remaining,
      canReflect,
      isCreator: ctx.user.isCreator,
      currentMonth: ctx.user.currentMonthYear,
    };
  }),
});
```

### Root Router

**File:** `server/trpc/routers/_app.ts`

```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
import { reflectionsRouter } from './reflections';
import { reflectionRouter } from './reflection';
import { usersRouter } from './users';
import { evolutionRouter } from './evolution';
import { artifactRouter } from './artifact';
import { subscriptionsRouter } from './subscriptions';
import { paymentRouter } from './payment';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter, // AI generation
  users: usersRouter,
  evolution: evolutionRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  payment: paymentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
```

---

## Next.js Patterns

### tRPC API Route Handler

**File:** `app/api/trpc/[trpc]/route.ts`

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers/_app';
import { createContext } from '@/server/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### Client-Side tRPC Setup

**File:** `lib/trpc.ts`

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/trpc/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

**File:** `components/providers/TRPCProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import superjson from 'superjson';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers() {
            const token = localStorage.getItem('token');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

**File:** `app/layout.tsx`

```typescript
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import '@/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

### Using tRPC in Components

**Example:** Reflection list page

**File:** `app/reflections/page.tsx`

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export default function ReflectionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // tRPC query with pagination
  const { data, isLoading, error } = trpc.reflections.getHistory.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  if (isLoading) return <div>Loading reflections...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Reflections</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search reflections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded-lg mb-6"
      />

      {/* Reflection List */}
      <div className="space-y-4">
        {data?.items.map((reflection) => (
          <div key={reflection.id} className="border rounded-lg p-6 hover:shadow-lg">
            <h3 className="text-xl font-semibold mb-2">{reflection.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-2">{reflection.dream}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{new Date(reflection.created_at).toLocaleDateString()}</span>
              <span className="capitalize">{reflection.tone} tone</span>
              {reflection.is_premium && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  Premium
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Example:** Mutation (create reflection)

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateReflectionForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dream: '',
    plan: '',
    hasDate: 'no' as 'yes' | 'no',
    dreamDate: null as string | null,
    relationship: '',
    offering: '',
    tone: 'fusion' as 'gentle' | 'intense' | 'fusion',
  });

  // tRPC mutation
  const createMutation = trpc.reflection.create.useMutation({
    onSuccess: (data) => {
      router.push(`/reflection/output?id=${data.reflection.id}`);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <textarea
        placeholder="What is your dream?"
        value={formData.dream}
        onChange={(e) => setFormData({ ...formData, dream: e.target.value })}
        className="w-full p-4 border rounded-lg"
        rows={4}
        required
      />

      {/* Other fields... */}

      <button
        type="submit"
        disabled={createMutation.isLoading}
        className="w-full py-3 bg-purple-600 text-white rounded-lg disabled:opacity-50"
      >
        {createMutation.isLoading ? 'Generating Reflection...' : 'Create Reflection'}
      </button>

      {createMutation.error && (
        <div className="text-red-600">{createMutation.error.message}</div>
      )}
    </form>
  );
}
```

### Server Components (Data Fetching)

**File:** `app/dashboard/page.tsx`

```typescript
import { headers } from 'next/headers';
import { createCaller } from '@/server/trpc/routers/_app';
import { createContext } from '@/server/trpc/context';

export default async function DashboardPage() {
  // Create tRPC caller for server-side data fetching
  const ctx = await createContext({
    req: {
      headers: Object.fromEntries(headers()),
    } as any,
    res: {} as any,
  });

  const trpc = createCaller(ctx);

  // Fetch data server-side
  const usage = await trpc.reflections.checkUsage();
  const reflections = await trpc.reflections.getHistory({ page: 1, limit: 5 });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Usage Card */}
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">This Month's Usage</h2>
        <p>
          {usage.used} / {usage.limit} reflections used
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${(usage.used / usage.limit) * 100}%` }}
          />
        </div>
      </div>

      {/* Recent Reflections */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reflections</h2>
        <div className="space-y-4">
          {reflections.items.map((reflection) => (
            <div key={reflection.id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-medium">{reflection.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-1">{reflection.dream}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Stripe Webhook Pattern (Non-tRPC)

**File:** `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/server/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function getRawBody(req: NextRequest): Promise<string> {
  const text = await req.text();
  return text;
}

export async function POST(req: NextRequest) {
  const body = await getRawBody(req);
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle webhook events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { userId, tier } = paymentIntent.metadata;

  if (!userId || !tier) {
    console.error('Missing metadata in payment intent');
    return;
  }

  // Update user tier
  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`Payment succeeded for user ${userId}, tier: ${tier}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const tier = subscription.items.data[0].price.metadata.tier || 'free';

  await supabase
    .from('users')
    .update({
      tier,
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`Subscription canceled for user ${userId}`);
}

// CRITICAL: Disable body parsing for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

---

## Import Order Convention

```typescript
// 1. React and Next.js imports
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries (alphabetical)
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 3. tRPC and React Query
import { trpc } from '@/lib/trpc';
import { TRPCError } from '@trpc/server';

// 4. Internal imports (alphabetical by path)
import { supabase } from '@/server/lib/supabase';
import { Button } from '@/components/ui/button';
import { type User, type Reflection } from '@/types';

// 5. Relative imports
import { DashboardCard } from './DashboardCard';
import styles from './Dashboard.module.css';

// 6. Type imports (separate section if needed)
import type { AppRouter } from '@/server/trpc/routers/_app';
```

---

## Error Handling Patterns

### tRPC Error Handling

```typescript
// In tRPC procedure
import { TRPCError } from '@trpc/server';

// Bad Request (400)
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Email is required',
});

// Unauthorized (401)
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Invalid credentials',
});

// Forbidden (403)
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Premium tier required',
});

// Not Found (404)
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Reflection not found',
});

// Internal Server Error (500)
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Database operation failed',
});
```

### Client-Side Error Handling

```typescript
'use client';

import { trpc } from '@/lib/trpc';

export function MyComponent() {
  const mutation = trpc.auth.signin.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    },
    onError: (error) => {
      // error.data.code: tRPC error code
      // error.message: error message
      if (error.data?.code === 'UNAUTHORIZED') {
        toast.error('Invalid email or password');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    },
  });

  return (
    <button
      onClick={() => mutation.mutate({ email, password })}
      disabled={mutation.isLoading}
    >
      {mutation.isLoading ? 'Signing in...' : 'Sign In'}
    </button>
  );
}
```

---

## Performance Patterns

### React Query Caching

```typescript
// Stale time: How long data stays fresh
const { data } = trpc.reflections.getHistory.useQuery(
  { page: 1 },
  {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  }
);

// Manual refetch
const utils = trpc.useUtils();
utils.reflections.getHistory.invalidate(); // Refetch data
```

### Optimistic Updates

```typescript
const deleteMutation = trpc.reflections.delete.useMutation({
  onMutate: async ({ id }) => {
    // Cancel ongoing queries
    await utils.reflections.getHistory.cancel();

    // Snapshot current data
    const previousData = utils.reflections.getHistory.getData();

    // Optimistically remove item
    utils.reflections.getHistory.setData(
      { page: 1 },
      (old) => ({
        ...old,
        items: old?.items.filter((item) => item.id !== id) || [],
      })
    );

    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousData) {
      utils.reflections.getHistory.setData({ page: 1 }, context.previousData);
    }
  },
  onSettled: () => {
    // Refetch after mutation
    utils.reflections.getHistory.invalidate();
  },
});
```

---

## Security Patterns

### Protected Route (Client Component)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = trpc.auth.verifyToken.useQuery();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

### Input Sanitization

```typescript
import { z } from 'zod';

const safeStringSchema = z.string().trim().min(1).max(1000);

const createPostSchema = z.object({
  title: safeStringSchema,
  content: z.string().max(10000),
  email: z.string().email().toLowerCase(),
});
```

---

## Utility Functions

### Date Formatting

```typescript
// lib/utils.ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(date);
}
```

### Class Names

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## Code Quality Standards

### TypeScript Best Practices

1. **Always define return types for functions**
```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

2. **Use strict null checks**
```typescript
// Good
const user: User | null = await getUser();
if (user) {
  console.log(user.name);
}

// Bad
const user: User = await getUser(); // Might be null
console.log(user.name); // Runtime error
```

3. **Prefer interfaces over types for objects**
```typescript
// Good
interface User {
  id: string;
  name: string;
}

// Use type for unions
type Status = 'active' | 'inactive';
```

### React Best Practices

1. **Use destructuring for props**
```typescript
// Good
function Button({ children, onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}

// Avoid
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

2. **Extract complex logic into custom hooks**
```typescript
// Good
function useAuth() {
  const { data: user } = trpc.auth.verifyToken.useQuery();
  const isAuthenticated = !!user;
  return { user, isAuthenticated };
}

// Usage
function MyComponent() {
  const { user, isAuthenticated } = useAuth();
}
```

3. **Use proper key props in lists**
```typescript
// Good
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// Bad
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

---

## Testing Patterns (Defer to Iteration 4)

Basic testing examples for reference:

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { calculateUsage } from './tierLimits';

describe('calculateUsage', () => {
  it('should calculate remaining usage correctly', () => {
    const result = calculateUsage('free', 0);
    expect(result.remaining).toBe(1);
  });

  it('should handle unlimited usage for creators', () => {
    const result = calculateUsage('free', 0, true);
    expect(result.remaining).toBe(Infinity);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';

describe('auth router', () => {
  it('should sign up new user', async () => {
    const caller = appRouter.createCaller({ user: null } as any);

    const result = await caller.auth.signup({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });
});
```

---

**This patterns file is the single source of truth for all code conventions in this project. All builders must follow these patterns exactly.**
