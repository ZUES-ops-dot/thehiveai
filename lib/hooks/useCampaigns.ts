'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { fetchJson, ApiError } from '@/lib/utils/api'

interface CampaignApiRecord {
  id: string
  name: string
  project_tag: string
  description: string | null
  reward_pool: number | null
  start_date: string
  end_date: string | null
  status: 'active' | 'upcoming' | 'ended'
  participantCount?: number
  totalMsp?: number
}

export interface CampaignSummary {
  id: string
  name: string
  projectTag: string
  description: string
  rewardPool: number
  startDate: string
  endDate: string | null
  status: 'active' | 'upcoming' | 'ended'
  isActive: boolean
  totalParticipants: number
  totalMSP: number
}

export interface LeaderboardEntry {
  id: string
  userId: string
  username: string
  displayName: string
  profileImageUrl: string | null
  msp: number
  postCount: number
  rank: number
}

import type { GlowTier } from '@/lib/types/economy'

export interface CreatorProfileData {
  glowTier: GlowTier
  mspLifetime: number
  mspWeekly: number
  mspMonthly: number
  mspYearly: number
  narrativesAmplified: number
  currentStreak: number
  conversionScore: number
  creditsEarned: number
  bestRankAchieved: number | null
}

export interface UserCampaignData {
  user: {
    id: string
    username: string
    name: string
    profileImageUrl?: string | null
    verified?: boolean
  }
  stats: {
    totalMsp: number
    totalPosts: number
    campaignCount: number
    bestRank: number | null
    inviteBonusMsp: number
    campaignMsp: number
  }
  creatorProfile: CreatorProfileData
  participations: Array<{
    campaignId: string
    msp: number
    postCount: number
    rank: number | null
    joinedAt: string
  }>
}

function mapCampaign(record: CampaignApiRecord): CampaignSummary {
  return {
    id: record.id,
    name: record.name,
    projectTag: record.project_tag,
    description: record.description ?? '',
    rewardPool: record.reward_pool ?? 0,
    startDate: record.start_date,
    endDate: record.end_date,
    status: record.status,
    isActive: record.status === 'active',
    totalParticipants: record.participantCount ?? 0,
    totalMSP: record.totalMsp ?? 0,
  }
}

export function useCampaigns(status: 'active' | 'all' = 'all') {
  return useQuery({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      const query = status === 'active' ? '?status=active' : ''
      const data = await fetchJson<{ campaigns: CampaignApiRecord[] }>(`/api/campaigns${query}`)
      return data.campaigns.map(mapCampaign)
    },
  })
}

export function useCampaign(campaignId?: string | null) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const data = await fetchJson<{ campaign: CampaignApiRecord }>(`/api/campaigns/${campaignId}`)
      return mapCampaign(data.campaign)
    },
  })
}

export function useCampaignLeaderboard(campaignId?: string | null, limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', campaignId, limit],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const data = await fetchJson<{
        campaignId: string
        campaignName: string
        leaderboard: Array<{
          id: string
          user_id: string
          username: string
          display_name: string
          profile_image_url: string | null
          msp: number
          post_count: number
          rank: number | null
        }>
      }>(`/api/leaderboard/${campaignId}?limit=${limit}`)

      const leaderboard: LeaderboardEntry[] = data.leaderboard.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        username: entry.username,
        displayName: entry.display_name,
        profileImageUrl: entry.profile_image_url,
        msp: entry.msp,
        postCount: entry.post_count,
        rank: entry.rank ?? 0,
      }))

      return {
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        leaderboard,
        total: leaderboard.length,
      }
    },
  })
}

export function useUserCampaignData() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hydrated = useAuthStore(state => state.hydrated)

  return useQuery({
    queryKey: ['user', 'campaigns'],
    enabled: hydrated && isAuthenticated,
    queryFn: async () => {
      try {
        const data = await fetchJson<UserCampaignData>('/api/user')
        return data
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          return null
        }
        throw error
      }
    },
  })
}

export function useJoinCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['campaign', 'join'],
    mutationFn: async ({ campaignId }: { campaignId: string }) => {
      return fetchJson(`/api/campaigns/${campaignId}/join`, { method: 'POST' })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'campaigns'] })
    },
  })
}

export function useLeaveCampaignMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['campaign', 'leave'],
    mutationFn: async ({ campaignId }: { campaignId: string }) => {
      return fetchJson(`/api/campaigns/${campaignId}/join`, { method: 'DELETE' })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'campaigns'] })
    },
  })
}
