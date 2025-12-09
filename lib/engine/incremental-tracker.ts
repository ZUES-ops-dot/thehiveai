/**
 * Incremental Hashtag Tracking Engine
 * 
 * Builds on hashtag-tracker.ts but adds:
 * - Supabase persistence for tracking state
 * - Deduplication by tweet ID
 * - Incremental MSP updates to participants
 * - Checkpoint-based resumption
 */

import {
  fetchCampaignPosts,
  calculatePostMSP,
  isValidPost,
  buildTrackingQuery,
} from './hashtag-tracker'
import {
  getTrackingState,
  upsertTrackingState,
  isTweetTracked,
  recordPostEvent,
} from '@/lib/supabase/tracking'
import {
  incrementParticipantStats,
  getParticipant,
  joinCampaign,
} from '@/lib/supabase/participants'
import { getCampaignByTag } from '@/lib/supabase/campaigns'
import type { TrackedPost } from '@/lib/types/auth'

export interface IncrementalTrackingResult {
  campaignId: string
  projectTag: string
  newPostsTracked: number
  duplicatesSkipped: number
  totalMspAwarded: number
  participantsUpdated: string[]
  errors: string[]
  lastTweetId: string | null
  runAt: string
}

/**
 * Run incremental tracking for a single campaign
 */
export async function runIncrementalTracking(
  projectTag: string
): Promise<IncrementalTrackingResult> {
  const result: IncrementalTrackingResult = {
    campaignId: '',
    projectTag,
    newPostsTracked: 0,
    duplicatesSkipped: 0,
    totalMspAwarded: 0,
    participantsUpdated: [],
    errors: [],
    lastTweetId: null,
    runAt: new Date().toISOString(),
  }

  try {
    // Get campaign from DB
    const campaign = await getCampaignByTag(projectTag)
    if (!campaign) {
      result.errors.push(`Campaign not found for tag: ${projectTag}`)
      return result
    }
    result.campaignId = campaign.id

    // Get current tracking state
    const trackingState = await getTrackingState(campaign.id)
    const lastKnownTweetId = trackingState?.last_tweet_id

    // Fetch new posts from Nitter
    const { posts, error } = await fetchCampaignPosts(projectTag)
    if (error) {
      result.errors.push(`Fetch error: ${error}`)
    }

    // Process each post
    for (const post of posts) {
      // Generate a pseudo tweet ID from content hash if not available
      const tweetId = generateTweetId(post)
      
      // Skip if already tracked
      const alreadyTracked = await isTweetTracked(tweetId)
      if (alreadyTracked) {
        result.duplicatesSkipped++
        continue
      }

      // Validate post has both hashtags
      if (!isValidPost(post.text || '', projectTag)) {
        continue
      }

      // Calculate MSP
      const msp = calculatePostMSP(post)

      // Record post event
      const postEvent = await recordPostEvent({
        campaignId: campaign.id,
        userId: post.authorUsername || 'unknown',
        tweetId,
        content: post.text || '',
        likes: post.metrics?.likes || 0,
        retweets: post.metrics?.retweets || 0,
        replies: post.metrics?.replies || 0,
        quotes: post.metrics?.quotes || 0,
        msp,
        postedAt: post.createdAt || new Date().toISOString(),
      })

      if (postEvent) {
        result.newPostsTracked++
        result.totalMspAwarded += msp
        result.lastTweetId = tweetId

        // Update participant stats (auto-join if not already in campaign)
        const userId = post.authorUsername || 'unknown'
        let participant = await getParticipant(campaign.id, userId)
        
        if (!participant) {
          // Auto-join the campaign for this user
          participant = await joinCampaign({
            campaignId: campaign.id,
            userId,
            username: post.authorUsername || 'unknown',
            displayName: post.authorName || post.authorUsername || 'Unknown',
            profileImageUrl: post.authorProfileImage,
          })
        }

        if (participant) {
          await incrementParticipantStats(campaign.id, userId, msp, 1)
          if (!result.participantsUpdated.includes(userId)) {
            result.participantsUpdated.push(userId)
          }
        }
      }
    }

    // Update tracking state checkpoint
    const totalTracked = (trackingState?.total_posts_tracked || 0) + result.newPostsTracked
    await upsertTrackingState(
      campaign.id,
      result.lastTweetId || lastKnownTweetId || null,
      totalTracked
    )

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

/**
 * Run incremental tracking for all active campaigns
 */
export async function runAllCampaignsTracking(): Promise<IncrementalTrackingResult[]> {
  // Import here to avoid circular dependency
  const { getActiveCampaigns } = await import('@/lib/supabase/campaigns')
  
  const campaigns = await getActiveCampaigns()
  const results: IncrementalTrackingResult[] = []

  for (const campaign of campaigns) {
    const result = await runIncrementalTracking(campaign.project_tag)
    results.push(result)
  }

  return results
}

/**
 * Generate a deterministic tweet ID from post content
 * Used when actual tweet ID is not available from Nitter
 */
function generateTweetId(post: Partial<TrackedPost>): string {
  const content = `${post.authorUsername}:${post.text}:${post.createdAt}`
  // Simple hash function
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `nitter_${Math.abs(hash).toString(16)}`
}

/**
 * Get tracking summary for a campaign
 */
export async function getTrackingSummary(campaignId: string) {
  const trackingState = await getTrackingState(campaignId)
  
  return {
    lastRunAt: trackingState?.last_run_at || null,
    totalPostsTracked: trackingState?.total_posts_tracked || 0,
    lastTweetId: trackingState?.last_tweet_id || null,
  }
}
