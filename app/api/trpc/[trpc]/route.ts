// app/api/trpc/[trpc]/route.ts - tRPC API route handler

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@/server/trpc/context';

// Force dynamic rendering (prevent static optimization at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load appRouter to avoid build-time initialization
let _appRouter: any = null;
function getAppRouter() {
  if (!_appRouter) {
    _appRouter = require('@/server/trpc/routers/_app').appRouter;
  }
  return _appRouter;
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: getAppRouter(),
    createContext,
  });

export { handler as GET, handler as POST };
