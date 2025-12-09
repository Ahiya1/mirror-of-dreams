// server/trpc/routers/_app.ts - Root router

import { router } from '../trpc';
import { adminRouter } from './admin';
import { artifactRouter } from './artifact';
import { authRouter } from './auth';
import { clarifyRouter } from './clarify';
import { dreamsRouter } from './dreams';
import { evolutionRouter } from './evolution';
import { lifecycleRouter } from './lifecycle';
import { reflectionRouter } from './reflection';
import { reflectionsRouter } from './reflections';
import { subscriptionsRouter } from './subscriptions';
import { usersRouter } from './users';
import { visualizationsRouter } from './visualizations';

export const appRouter = router({
  auth: authRouter,
  dreams: dreamsRouter,
  reflections: reflectionsRouter,
  reflection: reflectionRouter, // AI generation
  users: usersRouter,
  evolution: evolutionRouter,
  visualizations: visualizationsRouter,
  artifact: artifactRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
  lifecycle: lifecycleRouter,
  clarify: clarifyRouter,
});

export type AppRouter = typeof appRouter;
