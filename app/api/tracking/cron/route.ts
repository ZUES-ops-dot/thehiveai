import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { 
  fetchCampaignPosts, 
  calculatePostMSP,
} from '@/lib/engine/hashtag-tracker'
import { 
  getParticipantByUsername, 
  incrementParticipantStats,
  recalculateRanks 
} from '@/lib/supabase/participants'
import { 
  isTweetTracked, 
  recordPostEvent, 
  upsertTrackingState, 
  getCampaignPostCount 
} from '@/lib/supabase/tracking'
import type { Campaign } from '@/lib/supabase/types'

/**
 * GET /api/tracking/cron
 * 
 * Scheduled job endpoint to track all active campaigns.
 * Protected by CRON_SECRET bearer token.
 * 
 * Called by GitHub Actions every 15 minutes.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Array<{
    campaignId: string
    campaignName: string
    projectTag: string
    postsFound: number
    postsRecorded: number
    totalMsp: number
    error?: string
  }> = []

  try {
    const supabase = getSupabaseServerClient()
    
    // Get all active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .returns<Campaign[]>()

    if (campaignsError) {
      console.error('Failed to fetch campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active campaigns to track',
        results: [],
        duration: Date.now() - startTime,
      })
    }

    // Process each campaign
    for (const campaign of campaigns) {
      const projectTag = campaign.project_tag
      const campaignResult = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        projectTag,
        postsFound: 0,
        postsRecorded: 0,
        totalMsp: 0,
        error: undefined as string | undefined,
      }

      try {
        // Fetch posts from Nitter
        const { posts, error: fetchError } = await fetchCampaignPosts(projectTag)
        
        if (fetchError) {
          campaignResult.error = fetchError
          results.push(campaignResult)
          continue
        }

        campaignResult.postsFound = posts.length

        // Enrichment options for MSP calculation
        const mspOptions = {
          projectTag,
          campaignStartDate: campaign.start_date,
        }

        // Process each post
        for (const post of posts) {
          const tweetId = post.id
          const username = post.authorUsername
          if (!tweetId || !username) continue

          try {
            const alreadyTracked = await isTweetTracked(tweetId)
            if (alreadyTracked) continue

            const participant = await getParticipantByUsername(campaign.id, username)
            if (!participant) continue

            const metrics = post.metrics || { likes: 0, retweets: 0, replies: 0, quotes: 0 }

            // Calculate MSP with participant's follower count
            const msp = calculatePostMSP(post, {
              ...mspOptions,
              followersCount: participant.followers_count ?? undefined,
            })

            await recordPostEvent({
              campaignId: campaign.id,
              userId: participant.user_id,
              tweetId,
              content: post.text || '',
              likes: metrics.likes ?? 0,
              retweets: metrics.retweets ?? 0,
              replies: metrics.replies ?? 0,
              quotes: metrics.quotes ?? 0,
              msp,
              postedAt: post.createdAt || new Date().toISOString(),
            })

            await incrementParticipantStats(
              campaign.id,
              participant.user_id,
              msp,
              1
            )

            campaignResult.postsRecorded += 1
            campaignResult.totalMsp += msp
          } catch (postError) {
            console.warn(`Failed to process post ${tweetId}:`, postError)
          }
        }

        // Update tracking state
        try {
          const totalTracked = await getCampaignPostCount(campaign.id)
          const newestPostId = posts[0]?.id ?? null
          await upsertTrackingState(campaign.id, newestPostId, totalTracked)
        } catch (stateError) {
          console.warn('Failed to update tracking state:', stateError)
        }

        // Recalculate ranks if any posts were recorded
        if (campaignResult.postsRecorded > 0) {
          try {
            await recalculateRanks(campaign.id)
          } catch (rankError) {
            console.warn('Failed to recalculate ranks:', rankError)
          }
        }

        results.push(campaignResult)
      } catch (campaignError) {
        campaignResult.error = campaignError instanceof Error ? campaignError.message : 'Unknown error'
        results.push(campaignResult)
      }
    }

    const totalPostsRecorded = results.reduce((sum, r) => sum + r.postsRecorded, 0)
    const totalMspAwarded = results.reduce((sum, r) => sum + r.totalMsp, 0)
    const duration = Date.now() - startTime

    console.log(`[Tracking Cron] Processed ${campaigns.length} campaigns, recorded ${totalPostsRecorded} posts, awarded ${totalMspAwarded} MSP in ${duration}ms`)

    return NextResponse.json({
      success: true,
      campaignsProcessed: campaigns.length,
      totalPostsRecorded,
      totalMspAwarded,
      duration,
      results,
    })
  } catch (error) {
    console.error('Tracking cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error', duration: Date.now() - startTime },
      { status: 500 }
    )
  }
}
