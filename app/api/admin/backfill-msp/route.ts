import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { calculatePostMspFull } from '@/lib/engine/mindshare-engine'
import { recalculateRanks } from '@/lib/supabase/participants'

const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID

/**
 * POST /api/admin/backfill-msp
 * 
 * Comprehensive MSP backfill that recalculates ALL MSP sources:
 * 1. Post MSP (from post_events)
 * 2. Mission MSP (from claimed user_missions)
 * 3. Invite MSP (from invite_redemptions)
 * 
 * Protected by CRON_SECRET bearer token.
 * 
 * Query params:
 * - dryRun: If "true", only show what would be updated
 * - batchSize: Number of posts per batch (default 100)
 * - campaignId: Optional, only process specific campaign
 */
export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const dryRun = params.get('dryRun') === 'true'
  const batchSize = parseInt(params.get('batchSize') ?? '100', 10)
  const campaignIdFilter = params.get('campaignId') ?? undefined

  const startTime = Date.now()
  const supabase = getSupabaseServerClient()

  try {
    // Fetch all campaigns for enrichment data
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, start_date, project_tag')

    if (campaignsError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    const campaignMap = new Map((campaigns ?? []).map(c => [c.id, c]))

    // Fetch all participants for follower counts
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('user_id, campaign_id, followers_count')

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    // Build participant lookup
    const participantMap = new Map<string, number>()
    for (const p of participants ?? []) {
      const key = `${p.campaign_id}:${p.user_id}`
      participantMap.set(key, p.followers_count ?? 100)
    }

    // Count total posts
    let countQuery = supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })
    
    if (campaignIdFilter) {
      countQuery = countQuery.eq('campaign_id', campaignIdFilter)
    }

    const { count: totalPosts, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: 'Failed to count posts' }, { status: 500 })
    }

    // Process posts in batches
    let processed = 0
    let updated = 0
    let totalOldMsp = 0
    let totalNewMsp = 0
    let offset = 0

    while (offset < (totalPosts ?? 0)) {
      let postsQuery = supabase
        .from('post_events')
        .select('id, campaign_id, user_id, content, likes, retweets, replies, quotes, msp, posted_at')
        .order('posted_at', { ascending: true })
        .range(offset, offset + batchSize - 1)

      if (campaignIdFilter) {
        postsQuery = postsQuery.eq('campaign_id', campaignIdFilter)
      }

      const { data: posts, error: postsError } = await postsQuery

      if (postsError) {
        return NextResponse.json({ error: 'Failed to fetch posts', offset }, { status: 500 })
      }

      if (!posts || posts.length === 0) break

      for (const post of posts) {
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
          
          if (!dryRun) {
            await supabase
              .from('post_events')
              .update({ msp: newMsp })
              .eq('id', post.id)
          }
        }

        processed++
      }

      offset += batchSize
    }

    // =========================================================================
    // COMPREHENSIVE MSP RECALCULATION
    // =========================================================================
    // This recalculates ALL MSP for each participant from scratch:
    // 1. Post MSP (from post_events for that campaign)
    // 2. Mission MSP (from claimed user_missions - added to ALL campaigns user is in)
    // 3. Invite MSP (from invite_redemptions - added to ALL campaigns user is in)
    
    if (!dryRun) {
      const campaignIds = campaignIdFilter 
        ? [campaignIdFilter] 
        : Array.from(campaignMap.keys())

      // Step 1: Get ALL claimed mission MSP per user
      const { data: claimedMissions } = await supabase
        .from('user_missions')
        .select('user_id, msp_awarded')
        .eq('status', 'claimed')
        .returns<{ user_id: string; msp_awarded: number }[]>()

      const userMissionMsp = new Map<string, number>()
      for (const m of claimedMissions ?? []) {
        userMissionMsp.set(m.user_id, (userMissionMsp.get(m.user_id) ?? 0) + (m.msp_awarded ?? 0))
      }

      // Step 2: Get ALL invite MSP per user (inviter)
      const { data: inviteRedemptions } = await supabase
        .from('invite_redemptions')
        .select('inviter_user_id, msp_awarded')
        .returns<{ inviter_user_id: string; msp_awarded: number }[]>()

      const userInviteMsp = new Map<string, number>()
      for (const inv of inviteRedemptions ?? []) {
        userInviteMsp.set(inv.inviter_user_id, (userInviteMsp.get(inv.inviter_user_id) ?? 0) + (inv.msp_awarded ?? 0))
      }

      // Step 3: Process each campaign
      for (const campaignId of campaignIds) {
        // Skip invite rewards campaign - it only tracks invite MSP
        if (campaignId === INVITE_REWARDS_CAMPAIGN_ID) continue

        // Get all participants in this campaign
        const { data: campaignParticipants } = await supabase
          .from('participants')
          .select('user_id')
          .eq('campaign_id', campaignId)
          .returns<{ user_id: string }[]>()

        if (!campaignParticipants) continue

        // Aggregate post MSP from post_events for this campaign
        const { data: postData } = await supabase
          .from('post_events')
          .select('user_id, msp')
          .eq('campaign_id', campaignId)
          .returns<{ user_id: string; msp: number }[]>()

        const userPostMsp = new Map<string, { msp: number; postCount: number }>()
        for (const row of postData ?? []) {
          const existing = userPostMsp.get(row.user_id) ?? { msp: 0, postCount: 0 }
          existing.msp += row.msp ?? 0
          existing.postCount += 1
          userPostMsp.set(row.user_id, existing)
        }

        // Update each participant with total MSP from all sources
        for (const participant of campaignParticipants) {
          const userId = participant.user_id
          const postStats = userPostMsp.get(userId) ?? { msp: 0, postCount: 0 }
          const missionMsp = userMissionMsp.get(userId) ?? 0
          const inviteMsp = userInviteMsp.get(userId) ?? 0
          
          const totalMsp = postStats.msp + missionMsp + inviteMsp

          await supabase
            .from('participants')
            .update({ msp: totalMsp, post_count: postStats.postCount })
            .eq('campaign_id', campaignId)
            .eq('user_id', userId)
        }

        // Recalculate ranks
        await recalculateRanks(campaignId)
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      dryRun,
      postsProcessed: processed,
      postsUpdated: updated,
      totalOldMsp,
      totalNewMsp,
      mspDifference: totalNewMsp - totalOldMsp,
      mspDifferencePercent: totalOldMsp > 0 
        ? ((totalNewMsp - totalOldMsp) / totalOldMsp * 100).toFixed(2) + '%'
        : 'N/A',
      duration,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { error: 'Internal server error', duration: Date.now() - startTime },
      { status: 500 }
    )
  }
}
