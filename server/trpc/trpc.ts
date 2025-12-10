// server/trpc/trpc.ts - tRPC instance and base procedures

import * as Sentry from '@sentry/nextjs';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

import { type Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson, // Preserves Date, Map, Set, etc.
  errorFormatter({ shape, error, ctx }) {
    // Don't report auth errors (expected, not bugs)
    if (error.code !== 'UNAUTHORIZED' && error.code !== 'FORBIDDEN') {
      Sentry.captureException(error.cause ?? error, {
        user: ctx?.user
          ? {
              id: ctx.user.id,
              email: ctx.user.email,
            }
          : undefined,
        tags: {
          trpcCode: error.code,
        },
        extra: {
          trpcPath: shape.data?.path,
        },
      });
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? (error.cause as any).flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
