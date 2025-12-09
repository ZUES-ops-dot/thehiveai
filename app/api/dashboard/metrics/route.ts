import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getConnectedAccountIds } from '@/lib/supabase/connected-accounts'
import type { XUser } from '@/lib/types/auth'
import type { Campaign, Participant, NarrativeAnalytics, ConnectedAccount } from '@/lib/supabase/types'

/**
 * GET /api/dashboard/metrics
 * 
 * Returns aggregated dashboard metrics from Supabase:
 * - Active campaigns (narratives) count
 * - Total tracked accounts (participants)
 * - Total posts analyzed
 * - Trending campaigns by post count
 * - Top participants by MSP
 * 
 * Supports ?filterByConnected=true to scope to user's connected accounts
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const filterByConnected = params.get('filterByConnected') === 'true'

    const supabase = getSupabaseServerClient()

    // Get connected account IDs if filtering
    let connectedUserIds: string[] | undefined
    if (filterByConnected) {
      const encodedUser = request.headers.get('x-hive-user')
      if (encodedUser) {
        try {
          const user: XUser = JSON.parse(decodeURIComponent(encodedUser))
          connectedUserIds = await getConnectedAccountIds(user.id)
        } catch {
          // Proceed without filter
        }
      }
    }

    // Filter out the synthetic Invite Rewards campaign
    const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID

    // 1. Count active campaigns (narratives) - excluding invite rewards
    const { data: activeCampaignsData } = await supabase
      .from('campaigns')
      .select('id, project_tag')
      .eq('status', 'active')
      .returns<Array<{ id: string; project_tag: string }>>()

    const activeCampaignsCount = (activeCampaignsData ?? []).filter(
      (c) => c.id !== INVITE_REWARDS_CAMPAIGN_ID && c.project_tag !== 'invite_rewards'
    ).length

    // 2. Count total participants (tracked accounts)
    let participantsQuery = supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })

    if (connectedUserIds && connectedUserIds.length > 0) {
      participantsQuery = participantsQuery.in('user_id', connectedUserIds)
    }

    const { count: trackedAccountsCount } = await participantsQuery

    // 3. Count total posts analyzed
    let postsQuery = supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })

    if (connectedUserIds && connectedUserIds.length > 0) {
      postsQuery = postsQuery.in('user_id', connectedUserIds)
    }

    const { count: totalPostsCount } = await postsQuery

    // 4. Get trending campaigns (by post count in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: campaignsRaw } = await supabase
      .from('campaigns')
      .select('id, name, project_tag, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<Pick<Campaign, 'id' | 'name' | 'project_tag' | 'status'>[]>()

    // Filter out the synthetic Invite Rewards campaign from trending
    const activeCampaigns = (campaignsRaw ?? []).filter(
      (c) => c.id !== INVITE_REWARDS_CAMPAIGN_ID && c.project_tag !== 'invite_rewards'
    )

    // Get post counts per campaign
    const trendingCampaigns: Array<{
      id: string
      name: string
      projectTag: string
      postCount: number
      growth: number
    }> = []

    for (const campaign of activeCampaigns) {
      let campaignPostsQuery = supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .gte('posted_at', sevenDaysAgo.toISOString())

      if (connectedUserIds && connectedUserIds.length > 0) {
        campaignPostsQuery = campaignPostsQuery.in('user_id', connectedUserIds)
      }

      const { count: recentCount } = await campaignPostsQuery

      // Get total count for growth calculation
      let totalQuery = supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)

      if (connectedUserIds && connectedUserIds.length > 0) {
        totalQuery = totalQuery.in('user_id', connectedUserIds)
      }

      const { count: totalCount } = await totalQuery

      // Simple growth calculation (recent vs older)
      const olderCount = (totalCount ?? 0) - (recentCount ?? 0)
      const growth = olderCount > 0 
        ? Math.round(((recentCount ?? 0) / olderCount - 1) * 100)
        : (recentCount ?? 0) > 0 ? 100 : 0

      trendingCampaigns.push({
        id: campaign.id,
        name: campaign.name,
        projectTag: campaign.project_tag,
        postCount: totalCount ?? 0,
        growth,
      })
    }

    // Sort by post count descending
    trendingCampaigns.sort((a, b) => b.postCount - a.postCount)

    // 5. Get top participants by MSP
    let topParticipantsQuery = supabase
      .from('participants')
      .select('user_id, username, display_name, profile_image_url, msp, post_count, rank, campaign_id')
      .order('msp', { ascending: false })
      .limit(10)

    if (connectedUserIds && connectedUserIds.length > 0) {
      topParticipantsQuery = topParticipantsQuery.in('user_id', connectedUserIds)
    }

    const { data: topParticipantsRaw } = await topParticipantsQuery.returns<Pick<Participant, 'user_id' | 'username' | 'display_name' | 'profile_image_url' | 'msp' | 'post_count' | 'rank' | 'campaign_id'>[]>()

    // Enrich top participants with connected account metadata (followers, display name, avatar)
    const participantUserIds = Array.from(new Set((topParticipantsRaw ?? []).map(p => p.user_id))).filter(Boolean)
    const participantHandles = Array.from(
      new Set(
        (topParticipantsRaw ?? [])
          .map((p) => normalizeHandle(p.username))
          .filter((handle): handle is string => Boolean(handle))
      )
    )
    let participantAccountsById: Map<string, Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>> | undefined
    let participantAccountsByHandle: Map<string, Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>> | undefined

    const participantAccounts: Array<Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>> = []

    if (participantUserIds.length > 0) {
      const { data: participantAccountsByIdQuery, error: participantAccountsError } = await supabase
        .from('connected_accounts')
        .select('x_user_id, handle, display_name, profile_image_url, followers_count')
        .in('x_user_id', participantUserIds)
        .returns<Array<Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>>>()

      if (participantAccountsError) {
        console.warn('Failed to fetch participant connected accounts metadata for dashboard:', participantAccountsError)
      } else if (participantAccountsByIdQuery) {
        participantAccounts.push(...participantAccountsByIdQuery)
      }
    }

    if (participantHandles.length > 0) {
      const handleVariants = Array.from(
        new Set(
          participantHandles.flatMap((handle) => {
            const trimmed = handle.replace(/^@/, '')
            return [trimmed, trimmed.toLowerCase(), `@${trimmed}`, `@${trimmed.toLowerCase()}`]
          })
        )
      )

      const { data: participantAccountsByHandleQuery, error: participantAccountsHandleError } = await supabase
        .from('connected_accounts')
        .select('x_user_id, handle, display_name, profile_image_url, followers_count')
        .in('handle', handleVariants)
        .returns<Array<Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>>>()

      if (participantAccountsHandleError) {
        console.warn('Failed to fetch participant connected accounts metadata by handle for dashboard:', participantAccountsHandleError)
      } else if (participantAccountsByHandleQuery) {
        participantAccounts.push(...participantAccountsByHandleQuery)
      }
    }

    if (participantAccounts.length > 0) {
      participantAccountsById = new Map(
        participantAccounts
          .filter((account) => Boolean(account.x_user_id))
          .map((account) => [account.x_user_id, account])
      )
      participantAccountsByHandle = new Map(
        participantAccounts
          .map((account) => {
            const normalized = normalizeHandle(account.handle)
            return normalized ? [normalized, account] : null
          })
          .filter(
            (
              entry
            ): entry is [
              string,
              Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>
            ] => entry !== null
          )
      )
    }

    const topParticipants = (topParticipantsRaw ?? []).map((p, index) => {
      const normalizedHandle = normalizeHandle(p.username)
      const metadataAccount =
        participantAccountsById?.get(p.user_id) ??
        (normalizedHandle ? participantAccountsByHandle?.get(normalizedHandle) : undefined)
      return {
        userId: p.user_id,
        username: p.username,
        displayName: p.display_name || metadataAccount?.display_name || p.username,
        profileImageUrl: p.profile_image_url ?? metadataAccount?.profile_image_url ?? null,
        followers: metadataAccount?.followers_count ?? 0,
        msp: p.msp ?? 0,
        postCount: p.post_count ?? 0,
        rank: p.rank ?? index + 1,
        campaignId: p.campaign_id,
      }
    })

    // 6. Calculate total MSP
    let totalMspQuery = supabase
      .from('participants')
      .select('msp')

    if (connectedUserIds && connectedUserIds.length > 0) {
      totalMspQuery = totalMspQuery.in('user_id', connectedUserIds)
    }

    const { data: mspData } = await totalMspQuery.returns<Pick<Participant, 'msp'>[]>()
    const totalMsp = (mspData ?? []).reduce((sum, p) => sum + (p.msp ?? 0), 0)

    // 7. Count "viral" posts (high engagement)
    let viralQuery = supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })
      .gte('likes', 50) // Posts with 50+ likes considered "viral"

    if (connectedUserIds && connectedUserIds.length > 0) {
      viralQuery = viralQuery.in('user_id', connectedUserIds)
    }

    const { count: viralCount } = await viralQuery

    // 8. Narrative analytics joins
    const { data: analyticsRaw } = await supabase
      .from('narrative_analytics')
      .select('campaign_id, keywords, top_accounts, sponsor_pool, last_synced')
      .returns<Pick<NarrativeAnalytics, 'campaign_id' | 'keywords' | 'top_accounts' | 'sponsor_pool' | 'last_synced'>[]>()

    const analyticsByCampaign = new Map<string, NarrativeAnalytics>()
    for (const row of analyticsRaw ?? []) {
      analyticsByCampaign.set(row.campaign_id, row as NarrativeAnalytics)
    }

    const enrichedTrending = trendingCampaigns.slice(0, 6).map((campaign) => {
      const analytics = analyticsByCampaign.get(campaign.id)
      return {
        ...campaign,
        analytics: analytics ? {
          keywords: analytics.keywords ?? [],
          topAccounts: analytics.top_accounts ?? [],
          sponsorPool: analytics.sponsor_pool ?? [],
          lastSynced: analytics.last_synced,
        } : null,
      }
    })

    return NextResponse.json({
      stats: {
        activeCampaigns: activeCampaignsCount ?? 0,
        trackedAccounts: trackedAccountsCount ?? 0,
        totalPosts: totalPostsCount ?? 0,
        viralPosts: viralCount ?? 0,
        totalMsp,
      },
      trendingCampaigns: enrichedTrending,
      topParticipants,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Dashboard metrics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}

function normalizeHandle(handle: string | null | undefined): string | null {
  if (!handle) return null
  const trimmed = handle.trim()
  if (!trimmed) return null
  return trimmed.replace(/^@/, '').toLowerCase()
}
