// lib/hooks/usePrefersReducedMotion.ts
// Respects user's motion preferences for accessibility

'use client'

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Hook to detect if user prefers reduced motion.
 * Use this to conditionally disable animations.
 * 
 * @example
 * const prefersReduced = usePrefersReducedMotion()
 * 
 * return (
 *   <motion.div
 *     animate={prefersReduced ? undefined : { y: [0, -5, 0] }}
 *   />
 * )
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(QUERY)
    
    // Set initial value
    setPrefersReduced(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    
    // Fallback for older browsers
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReduced
}

export default usePrefersReducedMotion
