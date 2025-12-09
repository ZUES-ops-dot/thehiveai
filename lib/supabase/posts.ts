import { getSupabaseServerClient } from './client'
import type { PostEvent, Participant } from './types'
import { getCampaignByTag } from './campaigns'

export interface RecentPostWithAuthor {
  post: PostEvent
  author: Pick<
    Participant,
    'user_id' | 'campaign_id' | 'username' | 'display_name' | 'profile_image_url'
  > | null
}

interface RecentPostsOptions {
  campaignId?: string
  projectTag?: string
  limit?: number
  /** Filter posts to only these user IDs (for connected accounts filtering) */
  userIds?: string[]
}

export async function fetchRecentPostsWithAuthors(
  options: RecentPostsOptions
): Promise<{ posts: RecentPostWithAuthor[]; campaignId: string | null }> {
  const { campaignId: campaignIdInput, projectTag, limit = 10, userIds: filterUserIds } = options
  const supabase = getSupabaseServerClient()

  let resolvedCampaignId = campaignIdInput ?? null
  if (!resolvedCampaignId && projectTag) {
    const campaign = await getCampaignByTag(
      projectTag.startsWith('#') ? projectTag.slice(1) : projectTag
    )
    if (!campaign) {
      throw new Error(`Campaign not found for project tag ${projectTag}`)
    }
    resolvedCampaignId = campaign.id
  }

  // Filter to posts from the LAST 24 HOURS only
  // This ensures the feed shows fresh viral content from the latest tracking run
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  // Order by MSP (viral/engagement score) first, then by recency
  // This shows the most viral posts from today's fetch
  let postsQuery = supabase
    .from('post_events')
    .select('*')
    .gte('tracked_at', twentyFourHoursAgo)
    .order('msp', { ascending: false })
    .order('posted_at', { ascending: false })
    .limit(limit)

  if (resolvedCampaignId) {
    postsQuery = postsQuery.eq('campaign_id', resolvedCampaignId)
  }

  // Filter by specific user IDs (for connected accounts filtering)
  if (filterUserIds && filterUserIds.length > 0) {
    postsQuery = postsQuery.in('user_id', filterUserIds)
  }

  const { data: rawPosts, error } = await postsQuery
  if (error) {
    throw error
  }

  const posts = (rawPosts ?? []) as PostEvent[]
  if (!posts.length) {
    return { posts: [], campaignId: resolvedCampaignId }
  }

  const userIds = Array.from(new Set(posts.map((post) => post.user_id)))

  type ParticipantAuthor = Pick<
    Participant,
    'user_id' | 'campaign_id' | 'username' | 'display_name' | 'profile_image_url'
  >

  let participantMap = new Map<string, ParticipantAuthor>()

  if (userIds.length > 0) {
    let participantsQuery = supabase
      .from('participants')
      .select('user_id, campaign_id, username, display_name, profile_image_url')
      .in('user_id', userIds)

    if (resolvedCampaignId) {
      participantsQuery = participantsQuery.eq('campaign_id', resolvedCampaignId)
    }

    const { data: rawParticipants, error: participantsError } = await participantsQuery
    if (participantsError) {
      throw participantsError
    }

    const participants = (rawParticipants ?? []) as ParticipantAuthor[]
    participantMap = new Map(
      participants.map((participant) => [
        `${participant.campaign_id}:${participant.user_id}`,
        participant,
      ])
    )
  }

  const postsWithAuthors: RecentPostWithAuthor[] = posts.map((post) => ({
    post,
    author: participantMap.get(`${post.campaign_id}:${post.user_id}`) ?? null,
  }))

  return { posts: postsWithAuthors, campaignId: resolvedCampaignId }
}
