'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Single QueryClient for the app. Editor sections are cached per
// page/section key, so moving between editors doesn't refetch what's
// already fresh. refetchOnWindowFocus stays off on purpose: editors hold
// unsaved local state and must not swap content under the cursor.
export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
