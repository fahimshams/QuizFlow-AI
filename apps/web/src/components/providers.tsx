/**
 * Providers Component
 *
 * ARCHITECTURE:
 * - Wraps entire app with necessary providers
 * - React Query for server state management
 * - Auth context for user state
 * - Client-side only (use client directive)
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create Query Client instance
  // useState ensures it's only created once per session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent automatic refetching in background
            staleTime: 60 * 1000, // 1 minute
            // Retry failed requests
            retry: 1,
            // Don't refetch on window focus (can be annoying)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

