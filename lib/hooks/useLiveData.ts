'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { fetchJson } from '@/lib/utils/api'
import type { NarrativeAnalyticsResponse } from '@/lib/types/narratives'

interface RecentPostsResponse {
  posts: Array<{
    id: string
    tweetId: string
    campaignId: string
    userId: string
    content: string
    metrics: {
      likes: number
      retweets: number
      replies: number
      quotes: number
    }
    msp: number
    postedAt: string
    trackedAt: string
    author: {
      username: string
      displayName: string
      profileImageUrl: string | null
    } | null
  }>
  count: number
  campaignId: string | null
  limit: number
}

interface TopInfluencersResponse {
  influencers: Array<{
    id: string
    userId: string
    campaignId: string
    name: string
    username: string
    followers: number
    engagementRate: number
    viralityScore: number
    profileImageUrl: string | null
    rank: number | null
    msp: number
    postCount: number
  }>
  count: number
  campaignId: string | null
  limit: number
}

export interface UseRecentPostsOptions {
  limit?: number
  campaignId?: string
  projectTag?: string
  filterByConnected?: boolean
}

export interface UseTopInfluencersOptions {
  limit?: number
  campaignId?: string
  projectTag?: string
  filterByConnected?: boolean
}

function buildQuery(base: string, params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const queryString = searchParams.toString()
  return queryString ? `${base}?${queryString}` : base
}

function useAuthQueryState(filterByConnected: boolean) {
  const { isAuthenticated, hydrated, connectedAccounts } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    hydrated: state.hydrated,
    connectedAccounts: state.connectedAccounts,
  }))

  const enabled = filterByConnected ? hydrated && isAuthenticated : true
  const connectedKey = filterByConnected
    ? connectedAccounts.map((account) => account.id).sort().join(',')
    : 'all'

  return { enabled, connectedKey }
}

export function useRecentPostsQuery(options: UseRecentPostsOptions = {}) {
  const { limit = 10, campaignId, projectTag, filterByConnected = false } = options
  const { enabled, connectedKey } = useAuthQueryState(filterByConnected)

  return useQuery({
    queryKey: ['recentPosts', limit, campaignId ?? 'all', projectTag ?? 'all', filterByConnected ? connectedKey : 'all'],
    enabled,
    queryFn: async () => {
      const url = buildQuery('/api/posts/recent', {
        limit,
        campaignId,
        projectTag,
        filterByConnected: filterByConnected ? 'true' : undefined,
      })
      return fetchJson<RecentPostsResponse>(url)
    },
  })
}

export function useTopInfluencersQuery(options: UseTopInfluencersOptions = {}) {
  const { limit = 10, campaignId, projectTag, filterByConnected = false } = options
  const { enabled, connectedKey } = useAuthQueryState(filterByConnected)

  return useQuery({
    queryKey: ['topInfluencers', limit, campaignId ?? 'all', projectTag ?? 'all', filterByConnected ? connectedKey : 'all'],
    enabled,
    queryFn: async () => {
      const url = buildQuery('/api/influencers/top', {
        limit,
        campaignId,
        projectTag,
        filterByConnected: filterByConnected ? 'true' : undefined,
      })
      return fetchJson<TopInfluencersResponse>(url)
    },
  })
}

// Dashboard metrics types
interface DashboardMetricsResponse {
  stats: {
    activeCampaigns: number
    trackedAccounts: number
    totalPosts: number
    viralPosts: number
    totalMsp: number
  }
  trendingCampaigns: Array<{
    id: string
    name: string
    projectTag: string
    postCount: number
    growth: number
  }>
  topParticipants: Array<{
    userId: string
    username: string
    displayName: string
    profileImageUrl: string | null
    followers: number
    msp: number
    postCount: number
    rank: number
    campaignId: string
  }>
  lastUpdated: string
}

type CampaignIdList = string[] | undefined

export interface UseDashboardMetricsOptions {
  filterByConnected?: boolean
}

export function useDashboardMetricsQuery(options: UseDashboardMetricsOptions = {}) {
  const { filterByConnected = false } = options
  const { enabled, connectedKey } = useAuthQueryState(filterByConnected)

  return useQuery({
    queryKey: ['dashboardMetrics', filterByConnected ? connectedKey : 'all'],
    enabled,
    queryFn: async () => {
      const url = buildQuery('/api/dashboard/metrics', {
        filterByConnected: filterByConnected ? 'true' : undefined,
      })
      return fetchJson<DashboardMetricsResponse>(url)
    },
    staleTime: 30000, // 30 seconds
  })
}

export interface UseNarrativeAnalyticsOptions {
  limit?: number
  campaignIds?: CampaignIdList
}

export function useNarrativeAnalyticsQuery(options: UseNarrativeAnalyticsOptions = {}) {
  const { limit, campaignIds } = options
  const normalizedIds = useMemo(() => {
    if (!campaignIds || campaignIds.length === 0) return []
    return Array.from(new Set(campaignIds)).sort()
  }, [campaignIds])

  const enabled = normalizedIds.length > 0 || !campaignIds

  return useQuery({
    queryKey: ['narrativeAnalytics', limit ?? 'default', normalizedIds.join(',')],
    enabled,
    queryFn: async () => {
      const url = buildQuery('/api/narratives/analytics', {
        limit,
        campaignIds: normalizedIds.length > 0 ? normalizedIds.join(',') : undefined,
      })
      return fetchJson<NarrativeAnalyticsResponse>(url)
    },
    staleTime: 60000,
  })
}

// Leaderboard types
interface LeaderboardResponse {
  participants: Array<{
    userId: string
    username: string
    displayName: string
    profileImageUrl: string | null
    msp: number
    postCount: number
    rank: number
    campaignId: string
  }>
  totalCount: number
  totalMsp: number
}

export interface UseLeaderboardOptions {
  limit?: number
  campaignId?: string
  period?: 'weekly' | 'monthly' | 'yearly' | 'alltime'
  filterByConnected?: boolean
}

export function useLeaderboardQuery(options: UseLeaderboardOptions = {}) {
  const { limit = 50, campaignId, period, filterByConnected = false } = options
  const { enabled, connectedKey } = useAuthQueryState(filterByConnected)

  return useQuery({
    queryKey: ['leaderboard', limit, campaignId ?? 'all', period ?? 'alltime', filterByConnected ? connectedKey : 'all'],
    enabled,
    queryFn: async () => {
      const url = buildQuery('/api/leaderboard', {
        limit,
        campaignId,
        period,
        filterByConnected: filterByConnected ? 'true' : undefined,
      })
      return fetchJson<LeaderboardResponse>(url)
    },
  })
}
