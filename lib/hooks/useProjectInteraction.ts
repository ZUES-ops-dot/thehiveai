'use client'

import { useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'

/**
 * Hook to track project interactions (clicking Launch counts as a visit)
 * Returns a function to record the interaction
 */
export function useProjectInteraction() {
  const { user } = useAuthStore()
  // Use ref to track recorded platforms to avoid stale closure issues
  const recordedRef = useRef<Set<string>>(new Set())

  const recordInteraction = useCallback(async (platform: string) => {
    if (!user) {
      console.log('Project interaction: No user logged in')
      return
    }
    if (!platform) {
      console.log('Project interaction: No platform specified')
      return
    }
    if (recordedRef.current.has(platform)) {
      console.log(`Project interaction: ${platform} already recorded this session`)
      return
    }

    console.log(`Recording project interaction: ${platform}`)

    try {
      const response = await fetch('/api/projects/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hive-user': encodeURIComponent(JSON.stringify(user)),
        },
        body: JSON.stringify({
          platform,
          durationSeconds: 1, // Instant - just a click
        }),
      })

      const data = await response.json()
      console.log('Project interaction response:', data)

      if (response.ok && data.success) {
        recordedRef.current.add(platform)
        console.log(`✅ Project interaction recorded: ${platform}`)
      } else {
        console.error('Project interaction failed:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to record project interaction:', error)
    }
  }, [user])

  const isRecorded = useCallback((platform: string) => {
    return recordedRef.current.has(platform)
  }, [])

  return {
    recordInteraction,
    isRecorded,
    recordedCount: recordedRef.current.size,
  }
}
