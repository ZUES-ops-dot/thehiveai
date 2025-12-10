import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { calculatePostMspFull } from '@/lib/engine/mindshare-engine'
import { getAllCampaigns } from '@/lib/supabase/campaigns'

/**
 * POST /api/admin/backfill
 * 
 * Recalculates MSP for all posts using the full mindshare engine.
 * Also recalculates participant totals and ranks.
 * 
 * Query params:
 * - campaignId: Backfill specific campaign (optional, defaults to all)
 * - dryRun: Preview changes without applying (optional)
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const dryRun = searchParams.get('dryRun') === 'true'

  try {
    const supabase = getSupabaseServerClient()

    // Fetch campaigns
    let campaigns = await getAllCampaigns()
    if (campaignId) {
      campaigns = campaigns.filter(c => c.id === campaignId)
      if (campaigns.length === 0) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
    }

    const campaignMap = new Map(campaigns.map(c => [c.id, c]))

    // Fetch all participants for follower counts
    const { data: participants } = await supabase
      .from('participants')
      .select('user_id, campaign_id, followers_count')

    const participantMap = new Map<string, number>()
    for (const p of participants ?? []) {
      const key = `${p.campaign_id}:${p.user_id}`
      participantMap.set(key, p.followers_count ?? 100)
    }

    // Build query for posts
    let postsQuery = supabase
      .from('post_events')
      .select('id, campaign_id, user_id, content, likes, retweets, replies, quotes, msp, posted_at')
      .order('posted_at', { ascending: true })

    if (campaignId) {
      postsQuery = postsQuery.eq('campaign_id', campaignId)
    }

    const { data: posts, error: postsError } = await postsQuery

    if (postsError) {
      return NextResponse.json({ error: 'Failed to fetch posts', details: postsError.message }, { status: 500 })
    }

    let processed = 0
    let updated = 0
    let totalOldMsp = 0
    let totalNewMsp = 0
    const updates: { id: string; oldMsp: number; newMsp: number }[] = []

    for (const post of posts ?? []) {
      const campaign = campaignMap.get(post.campaign_id)
      const participantKey = `${post.campaign_id}:${post.user_id}`
      const followersCount = participantMap.get(participantKey) ?? 100

      const newMsp = calculatePostMspFull({
        likes: post.likes ?? 0,
        retweets: post.retweets ?? 0,
        replies: post.replies ?? 0,
        quotes: post.quotes ?? 0,
        followersCount,
        projectTag: campaign?.project_tag,
        postText: post.content,
        postedAt: post.posted_at,
        campaignStartDate: campaign?.start_date,
      })

      const oldMsp = post.msp ?? 0
      totalOldMsp += oldMsp
      totalNewMsp += newMsp

      if (newMsp !== oldMsp) {
        updated++
        updates.push({ id: post.id, oldMsp, newMsp })

        if (!dryRun) {
          await supabase
            .from('post_events')
            .update({ msp: newMsp })
            .eq('id', post.id)
        }
      }

      processed++
    }

    // Recalculate participant totals if not dry run
    if (!dryRun) {
      for (const campaign of campaigns) {
        // Aggregate MSP by user
        const { data: aggregated } = await supabase
          .from('post_events')
          .select('user_id, msp')
          .eq('campaign_id', campaign.id)

        const userMsp = new Map<string, { msp: number; postCount: number }>()
        for (const row of aggregated ?? []) {
          const existing = userMsp.get(row.user_id) ?? { msp: 0, postCount: 0 }
          existing.msp += row.msp ?? 0
          existing.postCount += 1
          userMsp.set(row.user_id, existing)
        }

        // Update participants
        for (const [userId, stats] of Array.from(userMsp.entries())) {
          await supabase
            .from('participants')
            .update({ msp: stats.msp, post_count: stats.postCount })
            .eq('campaign_id', campaign.id)
            .eq('user_id', userId)
        }

        // Recalculate ranks
        const { data: rankedParticipants } = await supabase
          .from('participants')
          .select('id, msp')
          .eq('campaign_id', campaign.id)
          .order('msp', { ascending: false })

        for (let i = 0; i < (rankedParticipants?.length ?? 0); i++) {
          await supabase
            .from('participants')
            .update({ rank: i + 1 })
            .eq('id', rankedParticipants![i].id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        campaignsProcessed: campaigns.length,
        postsProcessed: processed,
        postsUpdated: updated,
        totalOldMsp,
        totalNewMsp,
        mspDifference: totalNewMsp - totalOldMsp,
        mspChangePercent: totalOldMsp > 0 ? ((totalNewMsp - totalOldMsp) / totalOldMsp * 100).toFixed(2) : '0',
      },
      sampleUpdates: updates.slice(0, 10),
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { error: 'Backfill failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/backfill
 * 
 * Preview what would be changed by a backfill (dry run).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')

  // Redirect to POST with dryRun=true
  const url = new URL(request.url)
  url.searchParams.set('dryRun', 'true')

  return POST(new NextRequest(url, { method: 'POST' }))
}
