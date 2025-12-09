import type { Campaign } from '@/lib/supabase/types'

export interface NarrativeKeywordEntry {
  tag: string
  count: number
}

export interface NarrativeTopAccountEntry {
  userId: string
  username: string
  displayName: string
  msp: number
  followers: number
  profileImageUrl: string | null
}

export interface NarrativeSponsorEntry {
  sponsorName: string
  amount: number
  logoUrl: string | null
  metadata?: Record<string, unknown> | null
}

export interface NarrativeAnalyticsPayload {
  campaignId: string
  keywords: NarrativeKeywordEntry[]
  topAccounts: NarrativeTopAccountEntry[]
  sponsorPool: NarrativeSponsorEntry[]
  lastSynced: string | null
}

export interface NarrativeAnalyticsRecord {
  campaign: {
    id: string
    name: string
    projectTag: string
    status: Campaign['status']
    rewardPool: number | null
  } | null
  analytics: NarrativeAnalyticsPayload
}

export interface NarrativeAnalyticsResponse {
  records: NarrativeAnalyticsRecord[]
  count: number
  lastSynced: string | null
}
