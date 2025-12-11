import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getCampaignByTag, getCampaignById } from '@/lib/supabase/campaigns'
import { getParticipantByUsername, incrementParticipantStats, recalculateRanks } from '@/lib/supabase/participants'
import { isTweetTracked, recordPostEvent } from '@/lib/supabase/tracking'
import { calculatePostMspFull } from '@/lib/engine/mindshare-engine'

/**
 * POST /api/admin/add-post
 * 
 * Manually add a post to tracking. Bypasses Nitter scraping.
 * 
 * Body:
 * - tweetUrl: Full tweet URL (e.g., https://x.com/user/status/123456)
 * - campaignId: Campaign ID to attribute the post to
 * - content: Tweet text content
 * - username: Author's X username
 * - likes: Number of likes (optional, default 0)
 * - retweets: Number of retweets (optional, default 0)
 * - replies: Number of replies (optional, default 0)
 * - quotes: Number of quotes (optional, default 0)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tweetUrl, 
      campaignId, 
      content, 
      username,
      likes = 0,
      retweets = 0,
      replies = 0,
      quotes = 0,
    } = body

    // Validate required fields
    if (!tweetUrl || !campaignId || !content || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: tweetUrl, campaignId, content, username' },
        { status: 400 }
      )
    }

    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/)
    if (!tweetIdMatch) {
      return NextResponse.json(
        { error: 'Invalid tweet URL. Expected format: https://x.com/user/status/123456' },
        { status: 400 }
      )
    }
    const tweetId = tweetIdMatch[1]

    // Check if already tracked
    const alreadyTracked = await isTweetTracked(tweetId)
    if (alreadyTracked) {
      return NextResponse.json(
        { error: 'This tweet has already been tracked', tweetId },
        { status: 409 }
      )
    }

    // Get campaign
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Validate post has required hashtags
    const lowerContent = content.toLowerCase()
    const hasHiveAI = lowerContent.includes('#hiveai')
    const hasProjectTag = lowerContent.includes(`#${campaign.project_tag.toLowerCase()}`)
    
    if (!hasHiveAI || !hasProjectTag) {
      return NextResponse.json(
        { 
          error: 'Post must contain both #HiveAI and the campaign hashtag',
          required: { hiveai: '#HiveAI', projectTag: `#${campaign.project_tag}` },
          found: { hasHiveAI, hasProjectTag }
        },
        { status: 400 }
      )
    }

    // Get participant (must be joined to campaign)
    const cleanUsername = username.replace(/^@/, '')
    const participant = await getParticipantByUsername(campaignId, cleanUsername)
    
    if (!participant) {
      return NextResponse.json(
        { 
          error: 'User is not a participant in this campaign. They must join the campaign first.',
          username: cleanUsername,
          campaignId 
        },
        { status: 404 }
      )
    }

    // Calculate MSP using full engine
    const msp = calculatePostMspFull({
      likes,
      retweets,
      replies,
      quotes,
      followersCount: participant.followers_count ?? 100,
      projectTag: campaign.project_tag,
      postText: content,
      postedAt: new Date().toISOString(),
      campaignStartDate: campaign.start_date,
    })

    // Record the post
    const postEvent = await recordPostEvent({
      campaignId,
      userId: participant.user_id,
      tweetId,
      content,
      likes,
      retweets,
      replies,
      quotes,
      msp,
      postedAt: new Date().toISOString(),
    })

    if (!postEvent) {
      return NextResponse.json(
        { error: 'Failed to record post event' },
        { status: 500 }
      )
    }

    // Update participant stats
    await incrementParticipantStats(campaignId, participant.user_id, msp, 1)

    // Recalculate ranks
    await recalculateRanks(campaignId)

    return NextResponse.json({
      success: true,
      post: {
        id: postEvent.id,
        tweetId,
        content,
        username: cleanUsername,
        msp,
        likes,
        retweets,
        replies,
        quotes,
      },
      participant: {
        userId: participant.user_id,
        username: participant.username,
        newMsp: (participant.msp ?? 0) + msp,
      },
    })
  } catch (error) {
    console.error('Add post error:', error)
    return NextResponse.json(
      { error: 'Failed to add post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
