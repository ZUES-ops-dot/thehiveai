'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Campaign, CampaignParticipant, TrackedPost } from '@/lib/types/auth'
import campaignsData from '@/lib/mock/campaigns.json'

interface CampaignState {
  campaigns: Campaign[]
  activeCampaignId: string | null
  
  // Actions
  getCampaign: (id: string) => Campaign | undefined
  getActiveCampaigns: () => Campaign[]
  setActiveCampaign: (id: string | null) => void
  
  // Participation
  joinCampaign: (campaignId: string, participant: CampaignParticipant) => void
  leaveCampaign: (campaignId: string, participantId: string) => void
  getParticipant: (campaignId: string, participantId: string) => CampaignParticipant | undefined
  getCampaignLeaderboard: (campaignId: string) => CampaignParticipant[]
  
  // Stats
  updateParticipantStats: (
    campaignId: string, 
    participantId: string, 
    stats: { mspEarned?: number; postsCount?: number; validPostsCount?: number }
  ) => void
  
  // Refresh from mock
  refreshCampaigns: () => void
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: campaignsData.campaigns as Campaign[],
      activeCampaignId: null,

      getCampaign: (id: string) => {
        return get().campaigns.find(c => c.id === id)
      },

      getActiveCampaigns: () => {
        return get().campaigns.filter(c => c.isActive)
      },

      setActiveCampaign: (id: string | null) => {
        set({ activeCampaignId: id })
      },

      joinCampaign: (campaignId: string, participant: CampaignParticipant) => {
        set(state => ({
          campaigns: state.campaigns.map(campaign => {
            if (campaign.id !== campaignId) return campaign
            
            // Check if already joined
            const exists = campaign.participants.some(p => p.id === participant.id)
            if (exists) return campaign

            // Add participant with rank 0 (everyone starts equal)
            const newParticipant: CampaignParticipant = {
              ...participant,
              mspEarned: 0,
              postsCount: 0,
              validPostsCount: 0,
              rank: 0, // Everyone starts at 0
            }

            return {
              ...campaign,
              participants: [...campaign.participants, newParticipant],
              totalParticipants: campaign.totalParticipants + 1,
            }
          })
        }))
      },

      leaveCampaign: (campaignId: string, participantId: string) => {
        set(state => ({
          campaigns: state.campaigns.map(campaign => {
            if (campaign.id !== campaignId) return campaign
            
            return {
              ...campaign,
              participants: campaign.participants.filter(p => p.id !== participantId),
              totalParticipants: Math.max(0, campaign.totalParticipants - 1),
            }
          })
        }))
      },

      getParticipant: (campaignId: string, participantId: string) => {
        const campaign = get().getCampaign(campaignId)
        return campaign?.participants.find(p => p.id === participantId)
      },

      getCampaignLeaderboard: (campaignId: string) => {
        const campaign = get().getCampaign(campaignId)
        if (!campaign) return []

        // Sort by MSP and assign ranks
        const sorted = [...campaign.participants].sort((a, b) => b.mspEarned - a.mspEarned)
        
        return sorted.map((participant, index) => ({
          ...participant,
          rank: participant.mspEarned > 0 ? index + 1 : 0, // Only rank if they have MSP
        }))
      },

      updateParticipantStats: (campaignId, participantId, stats) => {
        set(state => ({
          campaigns: state.campaigns.map(campaign => {
            if (campaign.id !== campaignId) return campaign

            const updatedParticipants = campaign.participants.map(p => {
              if (p.id !== participantId) return p
              return {
                ...p,
                mspEarned: stats.mspEarned ?? p.mspEarned,
                postsCount: stats.postsCount ?? p.postsCount,
                validPostsCount: stats.validPostsCount ?? p.validPostsCount,
                lastPostAt: new Date().toISOString(),
              }
            })

            // Recalculate total MSP
            const totalMSP = updatedParticipants.reduce((sum, p) => sum + p.mspEarned, 0)
            const totalPosts = updatedParticipants.reduce((sum, p) => sum + p.validPostsCount, 0)

            return {
              ...campaign,
              participants: updatedParticipants,
              totalMSP,
              totalPosts,
            }
          })
        }))
      },

      refreshCampaigns: () => {
        // Merge with persisted participant data
        const currentCampaigns = get().campaigns
        const freshCampaigns = campaignsData.campaigns as Campaign[]

        const merged = freshCampaigns.map(fresh => {
          const existing = currentCampaigns.find(c => c.id === fresh.id)
          if (existing) {
            return {
              ...fresh,
              participants: existing.participants,
              totalParticipants: existing.participants.length,
              totalMSP: existing.totalMSP,
              totalPosts: existing.totalPosts,
            }
          }
          return fresh
        })

        set({ campaigns: merged })
      },
    }),
    {
      name: 'hive-campaigns-storage',
      partialize: (state) => ({
        campaigns: state.campaigns,
        activeCampaignId: state.activeCampaignId,
      })
    }
  )
)
