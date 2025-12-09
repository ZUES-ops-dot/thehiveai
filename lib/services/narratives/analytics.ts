import { getSupabaseServerClient } from '@/lib/supabase/client'
import type { Database, NarrativeAnalytics, NarrativeSponsor, Participant, PostEvent, Json } from '@/lib/supabase/types'
import type {
  NarrativeAnalyticsPayload,
  NarrativeKeywordEntry,
  NarrativeSponsorEntry,
  NarrativeTopAccountEntry,
} from '@/lib/types/narratives'

interface GenerateNarrativeAnalyticsOptions {
  campaignIds: string[]
  connectedUserIds?: string[]
  persist?: boolean
  lookbackDays?: number
  maxKeywords?: number
  maxAccounts?: number
}

const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g
const DEFAULT_LOOKBACK_DAYS = 7
const DEFAULT_KEYWORD_LIMIT = 6
const DEFAULT_ACCOUNT_LIMIT = 5
const NARRATIVE_ANALYTICS_TABLE: keyof Database['public']['Tables'] = 'narrative_analytics'
type NarrativeAnalyticsInsert = Database['public']['Tables']['narrative_analytics']['Insert']

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function extractHashtags(content: string | null | undefined): string[] {
  if (!content) return []
  const matches = content.match(HASHTAG_REGEX)
  if (!matches) return []
  return matches
    .map((match) => match.slice(1).toLowerCase())
    .filter(Boolean)
}

function toJson(value: unknown): Json {
  return value as Json
}

export async function generateNarrativeAnalytics({
  campaignIds,
  connectedUserIds,
  persist = true,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  maxKeywords = DEFAULT_KEYWORD_LIMIT,
  maxAccounts = DEFAULT_ACCOUNT_LIMIT,
}: GenerateNarrativeAnalyticsOptions): Promise<NarrativeAnalyticsPayload[]> {
  if (!campaignIds || campaignIds.length === 0) return []

  const supabase = getSupabaseServerClient()
  const since = new Date()
  since.setDate(since.getDate() - lookbackDays)
  const sinceIso = since.toISOString()

  // Fetch posts for hashtag extraction
  const keywordMap = new Map<string, Map<string, number>>()
  const postChunks = chunkArray(campaignIds, 50)

  for (const chunk of postChunks) {
    let postsQuery = supabase
      .from('post_events')
      .select('campaign_id, content, user_id')
      .in('campaign_id', chunk)
      .gte('posted_at', sinceIso)

    if (connectedUserIds && connectedUserIds.length > 0) {
      postsQuery = postsQuery.in('user_id', connectedUserIds)
    }

    const { data: postsData, error: postsError } = await postsQuery.returns<
      Pick<PostEvent, 'campaign_id' | 'content' | 'user_id'>[]
    >()

    if (postsError) {
      throw postsError
    }

    for (const post of postsData ?? []) {
      const tags = extractHashtags(post.content)
      if (!tags.length) continue
      const perCampaign = keywordMap.get(post.campaign_id) ?? new Map<string, number>()
      tags.forEach((tag) => {
        perCampaign.set(tag, (perCampaign.get(tag) ?? 0) + 1)
      })
      keywordMap.set(post.campaign_id, perCampaign)
    }
  }

  // Fetch top accounts for campaigns
  const { data: participantsData, error: participantsError } = await supabase
    .from('participants')
    .select('campaign_id, user_id, username, display_name, profile_image_url, followers_count, msp')
    .in('campaign_id', campaignIds)
    .returns<
      Pick<
        Participant,
        'campaign_id' | 'user_id' | 'username' | 'display_name' | 'profile_image_url' | 'followers_count' | 'msp'
      >[]
    >()

  if (participantsError) {
    throw participantsError
  }

  const topAccountsMap = new Map<string, NarrativeTopAccountEntry[]>()
  for (const participant of participantsData ?? []) {
    const arr = topAccountsMap.get(participant.campaign_id) ?? []
    const existingIndex = arr.findIndex((entry) => entry.userId === participant.user_id)
    const entry: NarrativeTopAccountEntry = {
      userId: participant.user_id,
      username: participant.username,
      displayName: participant.display_name,
      msp: participant.msp ?? 0,
      followers: participant.followers_count ?? 0,
      profileImageUrl: participant.profile_image_url ?? null,
    }

    if (existingIndex >= 0) {
      if (entry.msp > arr[existingIndex].msp) {
        arr[existingIndex] = entry
      }
    } else {
      arr.push(entry)
    }

    topAccountsMap.set(participant.campaign_id, arr)
  }

  topAccountsMap.forEach((arr, campaignId) => {
    const sorted = arr.sort((a, b) => b.msp - a.msp)
    topAccountsMap.set(campaignId, sorted.slice(0, maxAccounts))
  })

  // Fetch sponsors
  const { data: sponsorsData, error: sponsorsError } = await supabase
    .from('narrative_sponsors')
    .select('campaign_id, sponsor_name, amount, logo_url, metadata')
    .in('campaign_id', campaignIds)
    .returns<Pick<NarrativeSponsor, 'campaign_id' | 'sponsor_name' | 'amount' | 'logo_url' | 'metadata'>[]>()

  if (sponsorsError) {
    throw sponsorsError
  }

  const sponsorMap = new Map<string, NarrativeSponsorEntry[]>()
  for (const sponsor of sponsorsData ?? []) {
    const arr = sponsorMap.get(sponsor.campaign_id) ?? []
    arr.push({
      sponsorName: sponsor.sponsor_name,
      amount: sponsor.amount ?? 0,
      logoUrl: sponsor.logo_url ?? null,
      metadata: sponsor.metadata as Record<string, unknown> | null,
    })
    sponsorMap.set(sponsor.campaign_id, arr)
  }

  const nowIso = new Date().toISOString()
  const payloads: NarrativeAnalyticsPayload[] = campaignIds.map((campaignId) => {
    const keywordEntries = Array.from(keywordMap.get(campaignId)?.entries() ?? [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([tag, count]) => ({ tag, count }))

    const topAccounts = topAccountsMap.get(campaignId) ?? []
    const sponsorPool = sponsorMap.get(campaignId) ?? []

    return {
      campaignId,
      keywords: keywordEntries,
      topAccounts,
      sponsorPool,
      lastSynced: nowIso,
    }
  })

  if (persist) {
    const upsertPayload: NarrativeAnalyticsInsert[] = payloads.map((payload) => ({
      campaign_id: payload.campaignId,
      keywords: toJson(payload.keywords),
      top_accounts: toJson(payload.topAccounts),
      sponsor_pool: toJson(payload.sponsorPool),
      last_synced: payload.lastSynced,
    }))

    const { error: upsertError } = await supabase
      .from('narrative_analytics')
      .upsert(upsertPayload as never, { onConflict: 'campaign_id' })

    if (upsertError) {
      throw upsertError
    }
  }

  return payloads
}
