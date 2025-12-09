import { getSupabaseServerClient } from './client'
import type { PostEvent, TrackingState } from './types'

/**
 * Get tracking state for a campaign
 */
export async function getTrackingState(campaignId: string): Promise<TrackingState | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('tracking_state')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to get tracking state:', error)
  }
  return data ?? null
}

/**
 * Initialize or update tracking state
 */
export async function upsertTrackingState(
  campaignId: string,
  lastTweetId: string | null,
  totalPostsTracked: number
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('tracking_state')
    .upsert(
      {
        campaign_id: campaignId,
        last_tweet_id: lastTweetId,
        last_run_at: new Date().toISOString(),
        total_posts_tracked: totalPostsTracked,
      },
      { onConflict: 'campaign_id' }
    )

  if (error) {
    console.error('Failed to upsert tracking state:', error)
    return false
  }
  return true
}

/**
 * Check if a tweet has already been tracked
 */
export async function isTweetTracked(tweetId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { count, error } = await supabase
    .from('post_events')
    .select('*', { count: 'exact', head: true })
    .eq('tweet_id', tweetId)

  if (error) {
    console.error('Failed to check tweet:', error)
    return false
  }
  return (count ?? 0) > 0
}

/**
 * Record a new post event
 */
export async function recordPostEvent(event: {
  campaignId: string
  userId: string
  tweetId: string
  content: string
  likes: number
  retweets: number
  replies: number
  quotes: number
  msp: number
  postedAt: string
}): Promise<PostEvent | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('post_events')
    .insert({
      campaign_id: event.campaignId,
      user_id: event.userId,
      tweet_id: event.tweetId,
      content: event.content,
      likes: event.likes,
      retweets: event.retweets,
      replies: event.replies,
      quotes: event.quotes,
      msp: event.msp,
      posted_at: event.postedAt,
    })
    .select()
    .single()

  if (error) {
    // Ignore duplicate key errors (tweet already tracked)
    if (error.code === '23505') {
      return null
    }
    console.error('Failed to record post event:', error)
    return null
  }
  return data
}

/**
 * Get recent post events for a campaign
 */
export async function getRecentPostEvents(
  campaignId: string,
  limit = 50
): Promise<PostEvent[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('post_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('posted_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get recent posts:', error)
    return []
  }
  return data ?? []
}

/**
 * Get post events for a specific user in a campaign
 */
export async function getUserPostEvents(
  campaignId: string,
  userId: string,
  limit = 20
): Promise<PostEvent[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('post_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .order('posted_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get user posts:', error)
    return []
  }
  return data ?? []
}

/**
 * Get total post count for a campaign
 */
export async function getCampaignPostCount(campaignId: string): Promise<number> {
  const supabase = getSupabaseServerClient()
  const { count, error } = await supabase
    .from('post_events')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('Failed to count posts:', error)
    return 0
  }
  return count ?? 0
}
