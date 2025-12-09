'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useMissionStore } from '@/lib/stores/useMissionStore'
import type { MissionType, MissionCategory } from '@/lib/types/missions'

interface MissionWithProgress {
  id: string
  title: string
  description: string
  type: MissionType
  category: MissionCategory
  target: number
  mspReward: number
  creditsReward?: number
  badgeReward?: string
  cosmeticReward?: string
  trackingType: string
  progress: number
  status: 'active' | 'completed' | 'claimed'
  userMissionId?: string
}

interface MissionsResponse {
  missions: MissionWithProgress[]
  stats: {
    daily: { total: number; completed: number }
    weekly: { total: number; completed: number }
    monthly: { total: number; completed: number }
    special: { total: number; completed: number }
    claimable: number
    totalClaimableMsp: number
  }
  streak: {
    currentStreak: number
    longestStreak: number
  }
  resets: {
    daily: string
    weekly: string
    monthly: string
  }
}

interface ClaimResponse {
  success: boolean
  mspAwarded?: number
  mission?: {
    id: string
    title: string
    mspReward: number
    badgeReward?: string
  }
  error?: string
}

export function useMissionsQuery() {
  const { user, isAuthenticated } = useAuthStore()
  const setClaimableMissions = useMissionStore((state) => state.setClaimableMissions)

  const query = useQuery({
    queryKey: ['missions', user?.id],
    enabled: isAuthenticated && !!user,
    queryFn: async (): Promise<MissionsResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (user) {
        headers['x-hive-user'] = encodeURIComponent(JSON.stringify(user))
      }

      const response = await fetch('/api/missions', { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch missions')
      }

      return response.json()
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })

  // Sync claimable missions count to global store
  useEffect(() => {
    if (query.data?.stats?.claimable !== undefined) {
      setClaimableMissions(query.data.stats.claimable)
    }
  }, [query.data?.stats?.claimable, setClaimableMissions])

  return query
}

export function useClaimMission() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (missionId: string): Promise<ClaimResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (user) {
        headers['x-hive-user'] = encodeURIComponent(JSON.stringify(user))
      }

      const response = await fetch('/api/missions/claim', {
        method: 'POST',
        headers,
        body: JSON.stringify({ missionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim mission')
      }

      return data
    },
    onSuccess: () => {
      // Invalidate missions query to refresh data
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      // Also invalidate leaderboard since MSP changed
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

// Helper to get time until reset
export function useTimeUntilReset(resetTime: string | undefined) {
  const now = new Date()
  if (!resetTime) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  
  const reset = new Date(resetTime)
  const totalMs = Math.max(0, reset.getTime() - now.getTime())
  
  return {
    hours: Math.floor(totalMs / (1000 * 60 * 60)),
    minutes: Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((totalMs % (1000 * 60)) / 1000),
    totalMs,
  }
}
