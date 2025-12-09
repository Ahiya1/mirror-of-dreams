// server/trpc/routers/_app.ts - Root router

import { router } from '../trpc';
import { authRouter } from './auth';
import { reflectionsRouter } from './reflections';
import { reflectionRouter } from './reflection';
import { usersRouter } from './users';
import { evolutionRouter } from './evolution';
import { visualizationsRouter } from './visualizations';
import { artifactRouter } from './artifact';
import { subscriptionsRouter } from './subscriptions';
import { adminRouter } from './admin';
import { dreamsRouter } from './dreams';
import { lifecycleRouter } from './lifecycle';
import { clarifyRouter } from './clarify';

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
