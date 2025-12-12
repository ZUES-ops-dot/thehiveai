'use client'

import { ReactNode, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHiveMotion } from '@/lib/stores/useHiveMotion'
import { applyTheme } from '@/lib/themes/hiveThemes'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <ThemeController />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </>
  )
}

function ThemeController() {
  const activeTheme = useHiveMotion((state) => state.activeTheme)

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

  return null
}
