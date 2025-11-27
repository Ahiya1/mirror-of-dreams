// app/api/trpc/[trpc]/route.ts - tRPC API route handler

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@/server/trpc/context';
import { appRouter } from '@/server/trpc/routers/_app';

// Force dynamic rendering (prevent static optimization at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
