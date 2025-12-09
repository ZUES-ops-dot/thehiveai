import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getConnectedAccountIds } from '@/lib/supabase/connected-accounts'
import { calculateCombinedMsp } from '@/lib/engine/mindshare-engine'
import type { XUser } from '@/lib/types/auth'
import type { Participant } from '@/lib/supabase/types'

/**
 * GET /api/leaderboard
 * 
 * Returns global leaderboard of participants ranked by MSP.
 * Supports filtering by campaign, time period, and connected accounts.
 * 
 * Query params:
 * - limit: Max results (default 50, max 100)
 * - campaignId: Filter to specific campaign (optional)
 * - period: Time period filter - weekly, monthly, yearly, alltime, combined (optional, only for global)
 *   - combined: Uses weighted MSP from all periods (weekly 45%, monthly 30%, yearly 20%, alltime 5%)
 * - filterByConnected: Only show connected accounts (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const limitParam = params.get('limit')
    const campaignId = params.get('campaignId') ?? undefined
    const period = params.get('period') as 'weekly' | 'monthly' | 'yearly' | 'alltime' | 'combined' | null
    const filterByConnected = params.get('filterByConnected') === 'true'

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? '50', 10) || 50, 1),
      100
    )
    const fetchLimit = limit * 3

    const supabase = getSupabaseServerClient()

    // Get connected account IDs if filtering
    let connectedUserIds: string[] | undefined
    if (filterByConnected) {
      const encodedUser = request.headers.get('x-hive-user')
      if (encodedUser) {
        try {
          const user: XUser = JSON.parse(decodeURIComponent(encodedUser))
          connectedUserIds = await getConnectedAccountIds(user.id)
        } catch {
          // Proceed without filter
        }
      }
    }

    // Filter out the synthetic Invite Rewards campaign
    const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID

    // Handle "combined" period - weighted MSP from all time windows
    if (!campaignId && period === 'combined') {
      return handleCombinedPeriod(supabase, limit, connectedUserIds, INVITE_REWARDS_CAMPAIGN_ID)
    }

    // Calculate date filter based on period (only for global leaderboard)
    let dateFilter: string | null = null
    if (!campaignId && period && period !== 'alltime') {
      const now = new Date()
      switch (period) {
        case 'weekly':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'monthly':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'yearly':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
          break
      }
    }

    // If we have a date filter, we need to aggregate from post_events instead
    if (dateFilter) {
      // Query post_events for the time period and aggregate MSP
      let postsQuery = supabase
        .from('post_events')
        .select('user_id, msp, campaign_id')
        .gte('posted_at', dateFilter)

      if (INVITE_REWARDS_CAMPAIGN_ID) {
        postsQuery = postsQuery.neq('campaign_id', INVITE_REWARDS_CAMPAIGN_ID)
      }

      if (connectedUserIds && connectedUserIds.length > 0) {
        postsQuery = postsQuery.in('user_id', connectedUserIds)
      }

      const { data: postsData, error: postsError } = await postsQuery.returns<{ user_id: string; msp: number; campaign_id: string }[]>()

      if (postsError) {
        console.error('Leaderboard posts query error:', postsError)
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
      }

      // Aggregate MSP and post count by user for the time period
      const userMspMap = new Map<string, number>()
      const userPostCountMap = new Map<string, number>()
      for (const post of postsData ?? []) {
        if (!post.user_id) continue
        userMspMap.set(post.user_id, (userMspMap.get(post.user_id) ?? 0) + (post.msp ?? 0))
        userPostCountMap.set(post.user_id, (userPostCountMap.get(post.user_id) ?? 0) + 1)
      }

      // Get user details for the top users
      const topUserIds = Array.from(userMspMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([userId]) => userId)

      if (topUserIds.length === 0) {
        return NextResponse.json({
          participants: [],
          totalCount: 0,
          totalMsp: 0,
          limit,
          campaignId: null,
          period,
        })
      }

      // Fetch participant details
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('user_id, username, display_name, profile_image_url, post_count, campaign_id')
        .in('user_id', topUserIds)
        .returns<{ user_id: string; username: string | null; display_name: string | null; profile_image_url: string | null; post_count: number | null; campaign_id: string }[]>()

      if (participantsError) {
        console.error('Leaderboard participants query error:', participantsError)
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
      }

      // Build participant map for details
      const participantDetails = new Map<string, {
        username: string | null
        displayName: string | null
        profileImageUrl: string | null
        postCount: number
      }>()

      for (const p of participantsData ?? []) {
        if (!p.user_id) continue
        const existing = participantDetails.get(p.user_id)
        if (!existing) {
          participantDetails.set(p.user_id, {
            username: p.username,
            displayName: p.display_name,
            profileImageUrl: p.profile_image_url,
            postCount: p.post_count ?? 0,
          })
        } else {
          existing.postCount += p.post_count ?? 0
          if (!existing.username && p.username) existing.username = p.username
          if (!existing.displayName && p.display_name) existing.displayName = p.display_name
          if (!existing.profileImageUrl && p.profile_image_url) existing.profileImageUrl = p.profile_image_url
        }
      }

      // Build final participants list with period-specific stats
      const participants = topUserIds.map((userId, index) => {
        const details = participantDetails.get(userId)
        return {
          userId,
          username: details?.username ?? userId,
          displayName: details?.displayName ?? details?.username ?? userId,
          profileImageUrl: details?.profileImageUrl ?? null,
          msp: userMspMap.get(userId) ?? 0,
          postCount: userPostCountMap.get(userId) ?? 0, // Use period-specific post count
          campaignId: null,
          followers: 0,
          engagementRate: 0,
          viralityScore: 0,
          rank: index + 1,
        }
      })

      const totalMsp = participants.reduce((sum, p) => sum + p.msp, 0)

      return NextResponse.json({
        participants,
        totalCount: participants.length,
        totalMsp,
        limit,
        campaignId: null,
        period,
      })
    }

    // For GLOBAL leaderboard (no campaignId), calculate MSP from source tables
    // to avoid double-counting mission/invite MSP (which is propagated to ALL campaigns)
    if (!campaignId) {
      return handleGlobalLeaderboard(supabase, limit, connectedUserIds)
    }

    // For CAMPAIGN-SPECIFIC leaderboard, use participants table directly
    let query = supabase
      .from('participants')
      .select('user_id, username, display_name, profile_image_url, msp, post_count, rank, campaign_id, followers_count, engagement_rate, virality_score')
      .eq('campaign_id', campaignId)
      .order('msp', { ascending: false })
      .limit(limit)

    if (connectedUserIds && connectedUserIds.length > 0) {
      query = query.in('user_id', connectedUserIds)
    }

    const { data, error } = await query.returns<Participant[]>()

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    const participants = (data ?? []).map((row, index) => ({
      userId: row.user_id,
      username: row.username ?? row.user_id,
      displayName: row.display_name ?? row.username ?? row.user_id,
      profileImageUrl: row.profile_image_url ?? null,
      msp: row.msp ?? 0,
      postCount: row.post_count ?? 0,
      campaignId: row.campaign_id ?? null,
      followers: row.followers_count ?? 0,
      engagementRate: row.engagement_rate ?? 0,
      viralityScore: row.virality_score ?? 0,
      rank: row.rank ?? index + 1,
    }))

    const totalMsp = participants.reduce((sum, p) => sum + p.msp, 0)

    return NextResponse.json({
      participants,
      totalCount: participants.length,
      totalMsp,
      limit,
      campaignId,
      period: 'alltime',
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Handle GLOBAL leaderboard - calculates MSP from source tables to avoid double-counting
 * MSP = Post MSP (from post_events) + Mission MSP (once) + Invite MSP (once)
 */
async function handleGlobalLeaderboard(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  limit: number,
  connectedUserIds: string[] | undefined
) {
  // Step 1: Get ALL post MSP per user (from post_events)
  let postQuery = supabase
    .from('post_events')
    .select('user_id, msp')
  
  if (connectedUserIds && connectedUserIds.length > 0) {
    postQuery = postQuery.in('user_id', connectedUserIds)
  }
  
  const { data: postData } = await postQuery.returns<{ user_id: string; msp: number }[]>()
  
  const userPostMsp = new Map<string, number>()
  const userPostCount = new Map<string, number>()
  for (const row of postData ?? []) {
    userPostMsp.set(row.user_id, (userPostMsp.get(row.user_id) ?? 0) + (row.msp ?? 0))
    userPostCount.set(row.user_id, (userPostCount.get(row.user_id) ?? 0) + 1)
  }

  // Step 2: Get ALL mission MSP per user (from claimed user_missions)
  let missionQuery = supabase
    .from('user_missions')
    .select('user_id, msp_awarded')
    .eq('status', 'claimed')
  
  if (connectedUserIds && connectedUserIds.length > 0) {
    missionQuery = missionQuery.in('user_id', connectedUserIds)
  }
  
  const { data: missionData } = await missionQuery.returns<{ user_id: string; msp_awarded: number }[]>()
  
  const userMissionMsp = new Map<string, number>()
  for (const row of missionData ?? []) {
    userMissionMsp.set(row.user_id, (userMissionMsp.get(row.user_id) ?? 0) + (row.msp_awarded ?? 0))
  }

  // Step 3: Get ALL invite MSP per user (from invite_redemptions)
  let inviteQuery = supabase
    .from('invite_redemptions')
    .select('inviter_user_id, msp_awarded')
  
  if (connectedUserIds && connectedUserIds.length > 0) {
    inviteQuery = inviteQuery.in('inviter_user_id', connectedUserIds)
  }
  
  const { data: inviteData } = await inviteQuery.returns<{ inviter_user_id: string; msp_awarded: number }[]>()
  
  const userInviteMsp = new Map<string, number>()
  for (const row of inviteData ?? []) {
    userInviteMsp.set(row.inviter_user_id, (userInviteMsp.get(row.inviter_user_id) ?? 0) + (row.msp_awarded ?? 0))
  }

  // Step 4: Get user profile info from participants (for display)
  let profileQuery = supabase
    .from('participants')
    .select('user_id, username, display_name, profile_image_url, followers_count')
  
  if (connectedUserIds && connectedUserIds.length > 0) {
    profileQuery = profileQuery.in('user_id', connectedUserIds)
  }
  
  const { data: profileData } = await profileQuery.returns<{
    user_id: string
    username: string | null
    display_name: string | null
    profile_image_url: string | null
    followers_count: number | null
  }[]>()

  // Build user profile map (dedupe by user_id)
  const userProfiles = new Map<string, {
    username: string | null
    displayName: string | null
    profileImageUrl: string | null
    followers: number
  }>()
  
  for (const row of profileData ?? []) {
    if (!userProfiles.has(row.user_id)) {
      userProfiles.set(row.user_id, {
        username: row.username,
        displayName: row.display_name,
        profileImageUrl: row.profile_image_url,
        followers: row.followers_count ?? 0,
      })
    }
  }

  // Step 5: Calculate total MSP per user and build leaderboard
  // Collect all user IDs (ES5 compatible - avoid spread on Map iterators)
  const allUserIdsObj: Record<string, boolean> = {}
  userPostMsp.forEach((_, oderId) => { allUserIdsObj[oderId] = true })
  userMissionMsp.forEach((_, oderId) => { allUserIdsObj[oderId] = true })
  userInviteMsp.forEach((_, oderId) => { allUserIdsObj[oderId] = true })
  const allUserIds = Object.keys(allUserIdsObj)

  const leaderboardEntries: Array<{
    userId: string
    username: string
    displayName: string
    profileImageUrl: string | null
    msp: number
    postCount: number
    campaignId: null
    followers: number
    engagementRate: number
    viralityScore: number
  }> = []

  allUserIds.forEach(userId => {
    const postMsp = userPostMsp.get(userId) ?? 0
    const missionMsp = userMissionMsp.get(userId) ?? 0
    const inviteMsp = userInviteMsp.get(userId) ?? 0
    const totalMsp = postMsp + missionMsp + inviteMsp
    
    const profile = userProfiles.get(userId)
    
    leaderboardEntries.push({
      userId,
      username: profile?.username ?? userId,
      displayName: profile?.displayName ?? profile?.username ?? userId,
      profileImageUrl: profile?.profileImageUrl ?? null,
      msp: totalMsp,
      postCount: userPostCount.get(userId) ?? 0,
      campaignId: null,
      followers: profile?.followers ?? 0,
      engagementRate: 0,
      viralityScore: 0,
    })
  })

  // Sort by MSP and take top N
  leaderboardEntries.sort((a, b) => b.msp - a.msp)
  const participants = leaderboardEntries.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))

  const totalMsp = participants.reduce((sum, p) => sum + p.msp, 0)

  return NextResponse.json({
    participants,
    totalCount: participants.length,
    totalMsp,
    limit,
    campaignId: null,
    period: 'alltime',
  })
}

/**
 * Handle "combined" period - weighted MSP from all time windows
 * Uses calculateCombinedMsp: weekly 45%, monthly 30%, yearly 20%, alltime 5%
 */
async function handleCombinedPeriod(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  limit: number,
  connectedUserIds: string[] | undefined,
  inviteRewardsCampaignId: string | undefined
) {
  const now = new Date()
  const weeklyDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthlyDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const yearlyDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

  // Helper to sum MSP from post_events for a date range
  async function sumMspSince(sinceDate: string | null): Promise<Map<string, number>> {
    let query = supabase
      .from('post_events')
      .select('user_id, msp')

    if (sinceDate) {
      query = query.gte('posted_at', sinceDate)
    }

    if (inviteRewardsCampaignId) {
      query = query.neq('campaign_id', inviteRewardsCampaignId)
    }

    if (connectedUserIds && connectedUserIds.length > 0) {
      query = query.in('user_id', connectedUserIds)
    }

    const { data, error } = await query.returns<{ user_id: string; msp: number }[]>()

    if (error) {
      console.error('Failed to fetch MSP for period:', error)
      return new Map()
    }

    const mspMap = new Map<string, number>()
    for (const row of data ?? []) {
      if (!row.user_id) continue
      mspMap.set(row.user_id, (mspMap.get(row.user_id) ?? 0) + (row.msp ?? 0))
    }
    return mspMap
  }

  // Fetch MSP for each period
  const [weeklyMsp, monthlyMsp, yearlyMsp, alltimeMsp] = await Promise.all([
    sumMspSince(weeklyDate),
    sumMspSince(monthlyDate),
    sumMspSince(yearlyDate),
    sumMspSince(null), // all-time
  ])

  // Get all unique user IDs (ES5 compatible)
  const allUserIdsObj: Record<string, boolean> = {}
  const maps = [weeklyMsp, monthlyMsp, yearlyMsp, alltimeMsp]
  for (let i = 0; i < maps.length; i++) {
    maps[i].forEach((_, oderId) => {
      allUserIdsObj[oderId] = true
    })
  }
  const allUserIds = Object.keys(allUserIdsObj)

  // Calculate combined MSP for each user
  const combinedScores: Array<{ oderId: string; combinedMsp: number }> = []
  for (let i = 0; i < allUserIds.length; i++) {
    const oderId = allUserIds[i]
    const combined = calculateCombinedMsp({
      weekly: weeklyMsp.get(oderId) ?? 0,
      monthly: monthlyMsp.get(oderId) ?? 0,
      yearly: yearlyMsp.get(oderId) ?? 0,
      alltime: alltimeMsp.get(oderId) ?? 0,
    })
    combinedScores.push({ oderId, combinedMsp: Math.round(combined) })
  }

  // Sort by combined MSP and take top N
  combinedScores.sort((a, b) => b.combinedMsp - a.combinedMsp)
  const topUserIds = combinedScores.slice(0, limit).map(s => s.oderId)

  if (topUserIds.length === 0) {
    return NextResponse.json({
      participants: [],
      totalCount: 0,
      totalMsp: 0,
      limit,
      campaignId: null,
      period: 'combined',
    })
  }

  // Fetch participant details
  const { data: participantsData, error: participantsError } = await supabase
    .from('participants')
    .select('user_id, username, display_name, profile_image_url, post_count, campaign_id')
    .in('user_id', topUserIds)
    .returns<{ user_id: string; username: string | null; display_name: string | null; profile_image_url: string | null; post_count: number | null; campaign_id: string }[]>()

  if (participantsError) {
    console.error('Failed to fetch participant details:', participantsError)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  // Build participant details map
  const participantDetails = new Map<string, {
    username: string | null
    displayName: string | null
    profileImageUrl: string | null
    postCount: number
  }>()

  for (const p of participantsData ?? []) {
    if (!p.user_id) continue
    const existing = participantDetails.get(p.user_id)
    if (!existing) {
      participantDetails.set(p.user_id, {
        username: p.username,
        displayName: p.display_name,
        profileImageUrl: p.profile_image_url,
        postCount: p.post_count ?? 0,
      })
    } else {
      existing.postCount += p.post_count ?? 0
      if (!existing.username && p.username) existing.username = p.username
      if (!existing.displayName && p.display_name) existing.displayName = p.display_name
      if (!existing.profileImageUrl && p.profile_image_url) existing.profileImageUrl = p.profile_image_url
    }
  }

  // Build final participants list
  const combinedMap = new Map(combinedScores.map(s => [s.oderId, s.combinedMsp]))
  const participants = topUserIds.map((userId, index) => {
    const details = participantDetails.get(userId)
    return {
      userId,
      username: details?.username ?? userId,
      displayName: details?.displayName ?? details?.username ?? userId,
      profileImageUrl: details?.profileImageUrl ?? null,
      msp: combinedMap.get(userId) ?? 0,
      postCount: details?.postCount ?? 0,
      campaignId: null,
      followers: 0,
      engagementRate: 0,
      viralityScore: 0,
      rank: index + 1,
    }
  })

  const totalMsp = participants.reduce((sum, p) => sum + p.msp, 0)

  return NextResponse.json({
    participants,
    totalCount: participants.length,
    totalMsp,
    limit,
    campaignId: null,
    period: 'combined',
  })
}
