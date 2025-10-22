// server/trpc/routers/_app.ts - Root router

import { router } from '../trpc';
import { authRouter } from './auth';
import { reflectionsRouter } from './reflections';
import { reflectionRouter } from './reflection';
import { usersRouter } from './users';
import { evolutionRouter } from './evolution';
import { artifactRouter } from './artifact';
import { subscriptionsRouter } from './subscriptions';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter, // AI generation
  users: usersRouter,
  evolution: evolutionRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
