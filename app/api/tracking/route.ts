import { NextRequest, NextResponse } from 'next/server'
import { 
  buildTrackingQuery, 
  fetchCampaignPosts, 
  getCampaignTrackingStatus,
  calculatePostMSP,
  isValidPost,
  getNitterHealthStatus,
} from '@/lib/engine/hashtag-tracker'
import { getCampaignByTag } from '@/lib/supabase/campaigns'
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

/**
 * GET /api/tracking?tag=ProjectXYZ
 * 
 * Fetches and validates posts for a campaign using dual-hashtag tracking.
 * Posts must contain both #HiveAI and #<ProjectTag> to be counted.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tag = searchParams.get('tag')
    const statusOnly = searchParams.get('status') === 'true'

    if (!tag) {
      return NextResponse.json(
        { error: 'Missing required parameter: tag' },
        { status: 400 }
      )
    }

    // Clean the tag
    const projectTag = tag.startsWith('#') ? tag.slice(1) : tag

    if (statusOnly) {
      // Return tracking status summary
      const status = await getCampaignTrackingStatus(projectTag)
      return NextResponse.json(status)
    }

    // Find campaign
    const campaign = await getCampaignByTag(projectTag)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found for tag', projectTag },
        { status: 404 }
      )
    }

    // Fetch full post data
    const { posts, error, instanceUsed } = await fetchCampaignPosts(projectTag)

    if (error) {
      const nitterHealth = await getNitterHealthStatus()
      return NextResponse.json(
        { 
          error,
          query: buildTrackingQuery(projectTag),
          fallbackUrl: buildTrackingQuery(projectTag).xSearchUrl,
          nitterHealth: {
            healthyInstances: nitterHealth.healthyCount,
            totalInstances: nitterHealth.totalCount,
          },
        },
        { status: 503 }
      )
    }

    // Enrichment options for full MSP calculation
    const mspOptions = {
      projectTag,
      campaignStartDate: campaign.start_date,
    }

    // Calculate MSP for each post using full engine
    const postsWithMSP = posts.map(post => ({
      ...post,
      mspAwarded: calculatePostMSP(post, mspOptions),
    }))

    // Persist posts to Supabase
    let recordedPosts = 0
    for (const post of postsWithMSP) {
      const tweetId = post.id
      const username = post.authorUsername
      if (!tweetId || !username) continue

      try {
        const alreadyTracked = await isTweetTracked(tweetId)
        if (alreadyTracked) continue

        const participant = await getParticipantByUsername(campaign.id, username)
        if (!participant) continue

        const metrics = post.metrics || { likes: 0, retweets: 0, replies: 0, quotes: 0 }

        // Recalculate MSP with participant's follower count for better accuracy
        const enrichedMsp = calculatePostMSP(post, {
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
          msp: enrichedMsp,
          postedAt: post.createdAt || new Date().toISOString(),
        })

        await incrementParticipantStats(
          campaign.id,
          participant.user_id,
          enrichedMsp,
          1
        )

        recordedPosts += 1
      } catch (persistError) {
        console.warn('Failed to record post event:', persistError)
      }
    }

    // Update tracking state summary
    try {
      const totalTracked = await getCampaignPostCount(campaign.id)
      const newestPostId = postsWithMSP[0]?.id ?? null
      await upsertTrackingState(campaign.id, newestPostId, totalTracked)
    } catch (stateError) {
      console.warn('Failed to update tracking state:', stateError)
    }

    // Recalculate ranks if any posts were recorded
    if (recordedPosts > 0) {
      try {
        await recalculateRanks(campaign.id)
      } catch (rankError) {
        console.warn('Failed to recalculate ranks:', rankError)
      }
    }

    // Sort by MSP descending
    postsWithMSP.sort((a, b) => (b.mspAwarded || 0) - (a.mspAwarded || 0))

    return NextResponse.json({
      success: true,
      query: buildTrackingQuery(projectTag),
      totalPosts: postsWithMSP.length,
      totalMSP: postsWithMSP.reduce((sum, p) => sum + (p.mspAwarded || 0), 0),
      posts: postsWithMSP,
      velocity: await getCampaignTrackingStatus(projectTag),
      recordedPosts,
      instanceUsed,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tracking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tracking/validate
 * 
 * Validate if a specific post text contains both required hashtags
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, projectTag } = body

    if (!text || !projectTag) {
      return NextResponse.json(
        { error: 'Missing required fields: text, projectTag' },
        { status: 400 }
      )
    }

    const isValid = isValidPost(text, projectTag)
    const query = buildTrackingQuery(projectTag)

    return NextResponse.json({
      isValid,
      hasHiveAI: text.toLowerCase().includes('#hiveai'),
      hasProjectTag: text.toLowerCase().includes(query.projectTag.toLowerCase()),
      requiredFormat: query.combined,
      suggestion: isValid 
        ? 'Post is valid for tracking!' 
        : `Post must include both ${query.primaryTag} and ${query.projectTag}`,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
