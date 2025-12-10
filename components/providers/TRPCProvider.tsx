// components/providers/TRPCProvider.tsx - React Query + tRPC provider wrapper

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';

import { trpc } from '@/lib/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 5 minutes (no refetch during this time)
            staleTime: 1000 * 60 * 5,

            // Keep inactive query data in cache for 30 minutes
            // After this time, data is garbage collected to free memory
            gcTime: 1000 * 60 * 30,

            // Refetch stale data when window regains focus
            refetchOnWindowFocus: true,

            // Retry failed requests once before showing error
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include', // Send cookies with requests
            });
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
