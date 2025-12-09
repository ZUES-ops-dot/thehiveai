'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHiveMotion } from '@/lib/stores/useHiveMotion'
import { applyTheme } from '@/lib/themes/hiveThemes'
import { useAuthStore } from '@/lib/stores/useAuthStore'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      <ThemeController />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </QueryClientProvider>
  )
}

function AuthHydrator() {
  const hydrateSession = useAuthStore(state => state.hydrateSession)
  const hydrated = useAuthStore(state => state.hydrated)
  const loading = useAuthStore(state => state.loading)

  useEffect(() => {
    if (!hydrated && !loading) {
      hydrateSession()
    }
  }, [hydrateSession, hydrated, loading])

  return null
}

function ThemeController() {
  const activeTheme = useHiveMotion((state) => state.activeTheme)

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

  return null
}
