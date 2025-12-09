import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import type { Campaign, NarrativeAnalytics, Json } from '@/lib/supabase/types'
import type {
  NarrativeAnalyticsResponse,
  NarrativeAnalyticsRecord,
  NarrativeAnalyticsPayload,
  NarrativeKeywordEntry,
  NarrativeTopAccountEntry,
  NarrativeSponsorEntry,
} from '@/lib/types/narratives'

function coerceNumber(value: string | null, fallback: number, { min, max }: { min: number; max: number }) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.max(min, Math.min(parsed, max))
}

function normalizeCampaignIds(single: string | null, multi: string | null): string[] {
  const ids = new Set<string>()
  if (single) {
    ids.add(single)
  }
  if (multi) {
    multi
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .forEach((id) => ids.add(id))
  }
  return Array.from(ids)
}

function fromJson<T>(value: Json | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback
  return value as T
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const params = request.nextUrl.searchParams

    const limit = coerceNumber(params.get('limit'), 12, { min: 1, max: 50 })
    const campaignIds = normalizeCampaignIds(params.get('campaignId'), params.get('campaignIds'))

    let analyticsQuery = supabase
      .from('narrative_analytics')
      .select('campaign_id, keywords, top_accounts, sponsor_pool, last_synced')
      .order('last_synced', { ascending: false })
      .limit(limit)

    if (campaignIds.length > 0) {
      analyticsQuery = analyticsQuery.in('campaign_id', campaignIds)
    }

    const { data: analyticsRows, error: analyticsError } = await analyticsQuery.returns<
      Pick<NarrativeAnalytics, 'campaign_id' | 'keywords' | 'top_accounts' | 'sponsor_pool' | 'last_synced'>[]
    >()

    if (analyticsError) {
      throw analyticsError
    }

    const rows = analyticsRows ?? []

    if (rows.length === 0) {
      return NextResponse.json<NarrativeAnalyticsResponse>({
        records: [],
        count: 0,
        lastSynced: null,
      })
    }

    const referencedCampaignIds = Array.from(new Set(rows.map((row) => row.campaign_id)))
    const { data: campaignRows, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, project_tag, status, reward_pool')
      .in('id', referencedCampaignIds)
      .order('name', { ascending: true })
      .returns<Pick<Campaign, 'id' | 'name' | 'project_tag' | 'status' | 'reward_pool'>[]>()

    if (campaignsError) {
      throw campaignsError
    }

    // Filter out the synthetic Invite Rewards campaign
    const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID
    const filteredCampaigns = (campaignRows ?? []).filter(
      (c) => c.id !== INVITE_REWARDS_CAMPAIGN_ID && c.project_tag !== 'invite_rewards'
    )
    const campaignMap = new Map(filteredCampaigns.map((campaign) => [campaign.id, campaign]))

    const records: NarrativeAnalyticsRecord[] = rows
      .filter((row) => campaignMap.has(row.campaign_id))
      .map((row) => {
      const campaign = campaignMap.get(row.campaign_id)
      const analytics: NarrativeAnalyticsPayload = {
        campaignId: row.campaign_id,
        keywords: fromJson<NarrativeKeywordEntry[]>(row.keywords, []),
        topAccounts: fromJson<NarrativeTopAccountEntry[]>(row.top_accounts, []),
        sponsorPool: fromJson<NarrativeSponsorEntry[]>(row.sponsor_pool, []),
        lastSynced: row.last_synced,
      }

      return {
        campaign: campaign
          ? {
              id: campaign.id,
              name: campaign.name,
              projectTag: campaign.project_tag,
              status: campaign.status,
              rewardPool: campaign.reward_pool,
            }
          : null,
        analytics,
      }
    })

    return NextResponse.json<NarrativeAnalyticsResponse>({
      records,
      count: records.length,
      lastSynced: records[0]?.analytics.lastSynced ?? null,
    })
  } catch (error) {
    console.error('Narrative analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch narrative analytics' }, { status: 500 })
  }
}
