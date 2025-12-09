import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getCampaignByTag } from '@/lib/supabase/campaigns'
import { getConnectedAccounts } from '@/lib/supabase/connected-accounts'
import type { Participant, ConnectedAccount } from '@/lib/supabase/types'
import type { XUser } from '@/lib/types/auth'

const DEFAULT_LIMIT = 3
const MAX_LIMIT = 15

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const limitParam = params.get('limit')
    const campaignIdParam = params.get('campaignId') ?? undefined
    const projectTagParam = params.get('projectTag') ?? undefined
    // If filterByConnected=true, only show influencers from user's connected accounts
    const filterByConnected = params.get('filterByConnected') === 'true'

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )

    // Get connected account IDs if filtering is requested
    let connectedUserIds: string[] | undefined
    let viewerConnectedAccountsById: Map<string, ConnectedAccount> | undefined
    let viewerConnectedAccountsByHandle: Map<string, ConnectedAccount> | undefined
    if (filterByConnected) {
      const encodedUser = request.headers.get('x-hive-user')
      if (encodedUser) {
        try {
          const user: XUser = JSON.parse(decodeURIComponent(encodedUser))
          const connectedAccounts = await getConnectedAccounts(user.id)
          connectedUserIds = connectedAccounts.map((account) => account.x_user_id)
          viewerConnectedAccountsById = new Map(
            connectedAccounts.map((account) => [account.x_user_id, account])
          )
          viewerConnectedAccountsByHandle = new Map(
            connectedAccounts
              .map((account) => {
                const normalized = normalizeHandle(account.handle)
                return normalized ? [normalized, account] : null
              })
              .filter((entry): entry is [string, ConnectedAccount] => entry !== null)
          )
        } catch {
          // Ignore parse errors, proceed without filter
        }
      }

      if (!connectedUserIds || connectedUserIds.length === 0) {
        // Fallback: show global influencers if no connected accounts yet
        connectedUserIds = undefined
      }
    }

    let campaignId: string | null = campaignIdParam ?? null

    if (!campaignId && projectTagParam) {
      const campaign = await getCampaignByTag(
        projectTagParam.startsWith('#') ? projectTagParam.slice(1) : projectTagParam
      )
      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found for project tag', projectTag: projectTagParam },
          { status: 404 }
        )
      }
      campaignId = campaign.id
    }

    const supabase = getSupabaseServerClient()
    let query = supabase
      .from('participants')
      .select('*')
      .order('followers_count', { ascending: false })
      .order('virality_score', { ascending: false })
      .order('engagement_rate', { ascending: false })
      .limit(limit)

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    // Filter by connected accounts if requested
    if (connectedUserIds && connectedUserIds.length > 0) {
      query = query.in('user_id', connectedUserIds)
    }

    const { data, error } = await query.returns<Participant[]>()

    if (error) {
      console.error('Failed to fetch top influencers:', error)
      return NextResponse.json({ error: 'Failed to fetch influencers' }, { status: 500 })
    }

    // Fetch richer metadata for participants (display names, avatars, follower counts)
    let participantAccountsById:
      | Map<string, Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>>
      | undefined
    let participantAccountsByHandle:
      | Map<string, Pick<ConnectedAccount, 'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'>>
      | undefined
    const participantUserIds = Array.from(new Set((data ?? []).map((participant) => participant.user_id))).filter(Boolean)
    const participantHandles = Array.from(
      new Set(
        (data ?? [])
          .map((participant) => normalizeHandle(participant.username))
          .filter((handle): handle is string => Boolean(handle))
      )
    )

    const participantAccounts: Pick<
      ConnectedAccount,
      'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'
    >[] = []

    if (participantUserIds.length > 0) {
      const { data: byId, error: participantAccountsError } = await supabase
        .from('connected_accounts')
        .select('x_user_id, handle, display_name, profile_image_url, followers_count')
        .in('x_user_id', participantUserIds)
        .returns<
          Pick<
            ConnectedAccount,
            'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'
          >[]
        >()

      if (participantAccountsError) {
        console.warn('Failed to fetch participant connected accounts metadata by ID:', participantAccountsError)
      } else if (byId) {
        participantAccounts.push(...byId)
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

      const { data: byHandle, error: participantAccountsByHandleError } = await supabase
        .from('connected_accounts')
        .select('x_user_id, handle, display_name, profile_image_url, followers_count')
        .in('handle', handleVariants)
        .returns<
          Pick<
            ConnectedAccount,
            'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'
          >[]
        >()

      if (participantAccountsByHandleError) {
        console.warn('Failed to fetch participant connected accounts metadata by handle:', participantAccountsByHandleError)
      } else if (byHandle) {
        participantAccounts.push(...byHandle)
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
              Pick<
                ConnectedAccount,
                'x_user_id' | 'handle' | 'display_name' | 'profile_image_url' | 'followers_count'
              >
            ] => entry !== null
          )
      )
    }

    const influencers = (data ?? []).map((participant) => {
      const normalizedUsername = normalizeHandle(participant.username)
      const viewerConnectedAccount =
        viewerConnectedAccountsById?.get(participant.user_id) ??
        (normalizedUsername ? viewerConnectedAccountsByHandle?.get(normalizedUsername) : undefined)
      const metadataAccount =
        participantAccountsById?.get(participant.user_id) ??
        (normalizedUsername ? participantAccountsByHandle?.get(normalizedUsername) : undefined)
      return {
        id: participant.id,
        userId: participant.user_id,
        campaignId: participant.campaign_id,
        name:
          participant.display_name ||
          viewerConnectedAccount?.display_name ||
          metadataAccount?.display_name ||
          participant.username,
        username: participant.username,
        followers:
          participant.followers_count ??
          viewerConnectedAccount?.followers_count ??
          metadataAccount?.followers_count ??
          0,
        engagementRate: participant.engagement_rate ?? 0,
        viralityScore: participant.virality_score ?? 0,
        profileImageUrl:
          participant.profile_image_url ??
          viewerConnectedAccount?.profile_image_url ??
          metadataAccount?.profile_image_url ??
          null,
        rank: participant.rank,
        msp: participant.msp,
        postCount: participant.post_count,
      }
    })

    return NextResponse.json({
      influencers,
      count: influencers.length,
      campaignId,
      limit,
    })
  } catch (error) {
    console.error('Top influencers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function normalizeHandle(handle: string | null | undefined): string | null {
  if (!handle) return null
  const trimmed = handle.trim()
  if (!trimmed) return null
  return trimmed.replace(/^@/, '').toLowerCase()
}
