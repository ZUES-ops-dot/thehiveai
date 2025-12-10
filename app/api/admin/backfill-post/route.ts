import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getCampaignByTag } from '@/lib/supabase/campaigns'
import { getParticipantByUsername } from '@/lib/supabase/participants'
import { recordPostEvent, isTweetTracked } from '@/lib/supabase/tracking'
import { incrementParticipantStats, recalculateRanks } from '@/lib/supabase/participants'
import { calculatePostMspFull } from '@/lib/engine/mindshare-engine'
import { isValidPost } from '@/lib/engine/hashtag-tracker'

/**
 * POST /api/admin/backfill-post
 * 
 * Manually backfill a single post when Nitter is down.
 * This allows tracking posts that couldn't be scraped automatically.
 * 
 * Protected by CRON_SECRET bearer token.
 * 
 * Request body:
 * {
 *   tweetId: string,           // Tweet ID (from URL: twitter.com/user/status/TWEET_ID)
 *   username: string,          // X username (without @)
 *   content: string,           // Full tweet text including hashtags
 *   projectTag: string,        // Campaign project tag (e.g., "SOLANA")
 *   likes?: number,            // Optional engagement metrics
 *   retweets?: number,
 *   replies?: number,
 *   quotes?: number,
 *   postedAt?: string,         // ISO timestamp, defaults to now
 * }
 */
export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      tweetId,
      username,
      content,
      projectTag,
      likes = 0,
      retweets = 0,
      replies = 0,
      quotes = 0,
      postedAt = new Date().toISOString(),
    } = body

    // Validate required fields
    if (!tweetId || !username || !content || !projectTag) {
      return NextResponse.json(
        { error: 'Missing required fields: tweetId, username, content, projectTag' },
        { status: 400 }
      )
    }

    // Validate hashtags
    if (!isValidPost(content, projectTag)) {
      return NextResponse.json(
        { 
          error: 'Invalid post: must contain both #HiveAI and the campaign hashtag',
          required: ['#HiveAI', `#${projectTag.replace(/^#/, '')}`],
          found: content,
        },
        { status: 400 }
      )
    }

    // Get campaign
    const cleanTag = projectTag.replace(/^#/, '')
    const campaign = await getCampaignByTag(cleanTag)
    if (!campaign) {
      return NextResponse.json(
        { error: `Campaign not found for tag: ${cleanTag}` },
        { status: 404 }
      )
    }

    // Check if already tracked
    const alreadyTracked = await isTweetTracked(tweetId)
    if (alreadyTracked) {
      return NextResponse.json(
        { error: 'Tweet already tracked', tweetId },
        { status: 409 }
      )
    }

    // Get participant
    const cleanUsername = username.replace(/^@/, '')
    const participant = await getParticipantByUsername(campaign.id, cleanUsername)
    if (!participant) {
      return NextResponse.json(
        { 
          error: 'User not found in campaign. They must join the campaign first.',
          username: cleanUsername,
          campaignId: campaign.id,
          campaignName: campaign.name,
        },
        { status: 404 }
      )
    }

    // Calculate MSP
    const msp = calculatePostMspFull({
      likes,
      retweets,
      replies,
      quotes,
      followersCount: participant.followers_count ?? undefined,
      projectTag: cleanTag,
      postText: content,
      postedAt,
      campaignStartDate: campaign.start_date,
    })

    // Record post event
    const postEvent = await recordPostEvent({
      campaignId: campaign.id,
      userId: participant.user_id,
      tweetId,
      content,
      likes,
      retweets,
      replies,
      quotes,
      msp,
      postedAt,
    })

    if (!postEvent) {
      return NextResponse.json(
        { error: 'Failed to record post event' },
        { status: 500 }
      )
    }

    // Update participant stats
    await incrementParticipantStats(campaign.id, participant.user_id, msp, 1)

    // Recalculate ranks
    await recalculateRanks(campaign.id)

    return NextResponse.json({
      success: true,
      message: 'Post backfilled successfully',
      data: {
        tweetId,
        username: cleanUsername,
        campaignId: campaign.id,
        campaignName: campaign.name,
        mspAwarded: msp,
        postEventId: postEvent.id,
        participant: {
          userId: participant.user_id,
          previousMsp: participant.msp,
          newMsp: (participant.msp ?? 0) + msp,
          previousPostCount: participant.post_count,
          newPostCount: (participant.post_count ?? 0) + 1,
        },
      },
    })
  } catch (error) {
    console.error('Backfill post error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/backfill-post
 * 
 * Get instructions for using this endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/backfill-post',
    method: 'POST',
    description: 'Manually backfill a single post when Nitter is down',
    authentication: 'Bearer token (CRON_SECRET)',
    body: {
      tweetId: { type: 'string', required: true, description: 'Tweet ID from URL' },
      username: { type: 'string', required: true, description: 'X username (without @)' },
      content: { type: 'string', required: true, description: 'Full tweet text with hashtags' },
      projectTag: { type: 'string', required: true, description: 'Campaign tag (e.g., SOLANA)' },
      likes: { type: 'number', required: false, default: 0 },
      retweets: { type: 'number', required: false, default: 0 },
      replies: { type: 'number', required: false, default: 0 },
      quotes: { type: 'number', required: false, default: 0 },
      postedAt: { type: 'string', required: false, default: 'now', description: 'ISO timestamp' },
    },
    example: {
      tweetId: '1234567890123456789',
      username: 'yourhandle',
      content: 'Check out this project! #HiveAI #SOLANA',
      projectTag: 'SOLANA',
      likes: 10,
      retweets: 5,
    },
    extractTweetId: 'From URL https://x.com/user/status/1234567890123456789 → tweetId is 1234567890123456789',
  })
}
