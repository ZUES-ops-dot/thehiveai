/**
 * Supabase helpers for mission tracking
 */

import { getSupabaseServerClient } from './client'
import { recalculateRanks } from './participants'
import type { UserMission, UserStreak } from './types'
import { 
  ALL_MISSIONS, 
  getMissionById, 
  getResetTimeForType,
  type MissionDefinition 
} from '@/lib/missions/definitions'

// Get period start for a mission type
function getPeriodStart(type: 'daily' | 'weekly' | 'monthly' | 'special'): string {
  const now = new Date()
  switch (type) {
    case 'daily':
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
    case 'weekly': {
      const dayOfWeek = now.getUTCDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday is start
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToSubtract)).toISOString()
    }
    case 'monthly':
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    case 'special':
      return new Date(0).toISOString() // Epoch for special missions (never reset)
  }
}

// Get user's missions with current progress
export async function getUserMissions(userId: string): Promise<{
  missions: Array<MissionDefinition & { 
    progress: number
    status: 'active' | 'completed' | 'claimed'
    userMissionId?: string
  }>
  error?: string
}> {
  const supabase = getSupabaseServerClient()
  
  // Get user's mission records
  const { data: userMissions, error } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .returns<UserMission[]>()

  if (error) {
    console.error('Failed to fetch user missions:', error)
    return { missions: [], error: error.message }
  }

  // Map mission definitions with user progress
  const now = new Date()
  const missions = ALL_MISSIONS.map(def => {
    const periodStart = getPeriodStart(def.type)
    const periodStartDate = new Date(periodStart).getTime()
    
    // Find matching user mission for current period
    // Compare dates by timestamp to handle timezone format differences
    const userMission = userMissions?.find(um => {
      if (um.mission_id !== def.id) return false
      if (def.type === 'special') return true
      // Compare timestamps to handle different ISO format variations
      const umPeriodDate = new Date(um.period_start).getTime()
      return umPeriodDate === periodStartDate
    })

    return {
      ...def,
      progress: userMission?.progress ?? 0,
      status: (userMission?.status ?? 'active') as 'active' | 'completed' | 'claimed',
      userMissionId: userMission?.id,
    }
  })

  return { missions }
}

// Calculate mission progress from tracked data
export async function calculateMissionProgress(
  userId: string,
  trackingType: MissionDefinition['trackingType']
): Promise<number> {
  const supabase = getSupabaseServerClient()
  const now = new Date()
  
  // Calculate date ranges
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  const dayOfWeek = now.getUTCDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToSubtract)).toISOString()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  switch (trackingType) {
    case 'invites_today': {
      const { count } = await supabase
        .from('invite_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_user_id', userId)
        .gte('created_at', todayStart)
      return count ?? 0
    }
    case 'invites_week': {
      const { count } = await supabase
        .from('invite_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_user_id', userId)
        .gte('created_at', weekStart)
      return count ?? 0
    }
    case 'invites_month': {
      const { count } = await supabase
        .from('invite_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_user_id', userId)
        .gte('created_at', monthStart)
      return count ?? 0
    }
    case 'posts_today': {
      const { count } = await supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('posted_at', todayStart)
      return count ?? 0
    }
    case 'posts_week': {
      const { count } = await supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('posted_at', weekStart)
      return count ?? 0
    }
    case 'posts_month': {
      const { count } = await supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('posted_at', monthStart)
      return count ?? 0
    }
    case 'msp_today': {
      const { data } = await supabase
        .from('post_events')
        .select('msp')
        .eq('user_id', userId)
        .gte('posted_at', todayStart)
        .returns<{ msp: number }[]>()
      return data?.reduce((sum, p) => sum + (p.msp ?? 0), 0) ?? 0
    }
    case 'msp_week': {
      const { data } = await supabase
        .from('post_events')
        .select('msp')
        .eq('user_id', userId)
        .gte('posted_at', weekStart)
        .returns<{ msp: number }[]>()
      return data?.reduce((sum, p) => sum + (p.msp ?? 0), 0) ?? 0
    }
    case 'msp_month': {
      const { data } = await supabase
        .from('post_events')
        .select('msp')
        .eq('user_id', userId)
        .gte('posted_at', monthStart)
        .returns<{ msp: number }[]>()
      return data?.reduce((sum, p) => sum + (p.msp ?? 0), 0) ?? 0
    }
    case 'msp_total': {
      const { data } = await supabase
        .from('participants')
        .select('msp')
        .eq('user_id', userId)
        .returns<{ msp: number }[]>()
      return data?.reduce((sum, p) => sum + (p.msp ?? 0), 0) ?? 0
    }
    case 'campaigns_joined': {
      const { count } = await supabase
        .from('user_campaign_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('first_joined_at', weekStart)
      return count ?? 0
    }
    case 'connected_accounts': {
      // Count accounts connected this week only (for weekly mission)
      const { count } = await supabase
        .from('connected_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', userId)
        .eq('active', true)
        .gte('connected_at', weekStart)
      return count ?? 0
    }
    case 'daily_login': {
      // Check if user has logged in today (via user_streaks)
      const { data } = await supabase
        .from('user_streaks')
        .select('last_login_date')
        .eq('user_id', userId)
        .returns<{ last_login_date: string }[]>()
        .single()
      if (data?.last_login_date) {
        const lastLogin = new Date(data.last_login_date)
        const today = new Date(todayStart)
        return lastLogin >= today ? 1 : 0
      }
      return 0
    }
    case 'engagement_today': {
      const { data } = await supabase
        .from('post_events')
        .select('likes, retweets, replies')
        .eq('user_id', userId)
        .gte('posted_at', todayStart)
        .returns<{ likes: number; retweets: number; replies: number }[]>()
      return data?.reduce((sum, p) => sum + (p.likes ?? 0) + (p.retweets ?? 0) + (p.replies ?? 0), 0) ?? 0
    }
    case 'engagement_week': {
      const { data } = await supabase
        .from('post_events')
        .select('likes, retweets, replies')
        .eq('user_id', userId)
        .gte('posted_at', weekStart)
        .returns<{ likes: number; retweets: number; replies: number }[]>()
      return data?.reduce((sum, p) => sum + (p.likes ?? 0) + (p.retweets ?? 0) + (p.replies ?? 0), 0) ?? 0
    }
    case 'engagement_month': {
      const { data } = await supabase
        .from('post_events')
        .select('likes, retweets, replies')
        .eq('user_id', userId)
        .gte('posted_at', monthStart)
        .returns<{ likes: number; retweets: number; replies: number }[]>()
      return data?.reduce((sum, p) => sum + (p.likes ?? 0) + (p.retweets ?? 0) + (p.replies ?? 0), 0) ?? 0
    }
    case 'streak_days': {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .returns<{ current_streak: number }[]>()
        .single()
      return data?.current_streak ?? 0
    }
    case 'bookmarks_added': {
      const { count } = await supabase
        .from('workspace_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count ?? 0
    }
    case 'invites_total': {
      const { count } = await supabase
        .from('invite_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_user_id', userId)
      return count ?? 0
    }
    case 'posts_total': {
      const { count } = await supabase
        .from('post_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count ?? 0
    }
    case 'campaigns_posted_today': {
      // Count unique campaigns the user posted to today
      const { data } = await supabase
        .from('post_events')
        .select('campaign_id')
        .eq('user_id', userId)
        .gte('posted_at', todayStart)
        .returns<{ campaign_id: string }[]>()
      
      if (!data) return 0
      // Count unique campaign IDs
      const uniqueCampaigns = new Set(data.map(p => p.campaign_id))
      return uniqueCampaigns.size
    }
    case 'projects_interacted_today': {
      // Count unique Project Lens platforms the user interacted with today
      // Cast to any to bypass TypeScript since table isn't in generated types yet
      const supabaseAny = supabase as any
      const result = await supabaseAny
        .from('project_interactions')
        .select('platform')
        .eq('user_id', userId)
        .gte('created_at', todayStart)
      
      const data = result.data as { platform: string }[] | null
      const error = result.error
      
      if (error) {
        console.error('Error fetching project interactions:', error)
        return 0
      }
      if (!data || data.length === 0) {
        console.log(`projects_interacted_today for ${userId}: 0 platforms (no data)`)
        return 0
      }
      
      // Count unique platforms
      const seen: Record<string, boolean> = {}
      let count = 0
      for (const row of data) {
        if (!seen[row.platform]) {
          seen[row.platform] = true
          count++
        }
      }
      console.log(`projects_interacted_today for ${userId}: ${count} platforms`)
      return count
    }
    default:
      return 0
  }
}

// Update or create user mission progress
export async function updateMissionProgress(
  userId: string,
  missionId: string,
  progress: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient()
  const mission = getMissionById(missionId)
  
  if (!mission) {
    return { success: false, error: 'Mission not found' }
  }

  const periodStart = getPeriodStart(mission.type)
  const periodStartTime = new Date(periodStart).getTime()
  const isCompleted = progress >= mission.target

  // Check if mission record exists for this period
  // Fetch all records for this mission and filter by period to handle date format differences
  const { data: allRecords } = await supabase
    .from('user_missions')
    .select('id, status, period_start')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .returns<{ id: string; status: string; period_start: string }[]>()
  
  const existing = allRecords?.find(r => {
    if (mission.type === 'special') return true
    return new Date(r.period_start).getTime() === periodStartTime
  })

  if (existing) {
    // Don't update if already claimed
    if (existing.status === 'claimed') {
      return { success: true }
    }

    const { error } = await supabase
      .from('user_missions')
      .update({
        progress,
        status: isCompleted ? 'completed' : 'active',
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Create new mission record
    const { error } = await supabase
      .from('user_missions')
      .insert({
        user_id: userId,
        mission_id: missionId,
        progress,
        status: isCompleted ? 'completed' : 'active',
        period_start: periodStart,
        completed_at: isCompleted ? new Date().toISOString() : null,
        msp_awarded: 0,
      })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}

// Claim a completed mission and award MSP
export async function claimMission(
  userId: string,
  missionId: string
): Promise<{ success: boolean; mspAwarded?: number; error?: string }> {
  const supabase = getSupabaseServerClient()
  const mission = getMissionById(missionId)
  
  if (!mission) {
    return { success: false, error: 'Mission not found' }
  }

  const periodStart = getPeriodStart(mission.type)
  const periodStartTime = new Date(periodStart).getTime()

  // Get the user mission record
  // Fetch all records for this mission and filter by period to handle date format differences
  const { data: allRecords, error: fetchError } = await supabase
    .from('user_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .returns<UserMission[]>()
  
  const userMission = allRecords?.find(r => {
    if (mission.type === 'special') return true
    return new Date(r.period_start).getTime() === periodStartTime
  })

  if (fetchError || !userMission) {
    return { success: false, error: 'Mission not found or not started' }
  }

  if (userMission.status === 'claimed') {
    return { success: false, error: 'Mission already claimed' }
  }

  if (userMission.status !== 'completed') {
    return { success: false, error: 'Mission not completed yet' }
  }

  // Update mission to claimed
  const { error: updateError } = await supabase
    .from('user_missions')
    .update({
      status: 'claimed',
      claimed_at: new Date().toISOString(),
      msp_awarded: mission.mspReward,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userMission.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Award MSP to ALL campaigns the user is participating in
  // This ensures MSP from missions reflects in their total across all campaigns
  const { data: userParticipations } = await supabase
    .from('participants')
    .select('campaign_id, msp')
    .eq('user_id', userId)
    .returns<{ campaign_id: string; msp: number }[]>()

  if (userParticipations && userParticipations.length > 0) {
    // Award MSP to ALL campaigns the user is in
    const campaignsUpdated: string[] = []
    
    for (const participation of userParticipations) {
      // Try RPC first
      const { error: rpcError } = await supabase.rpc('increment_participant_stats', {
        p_campaign_id: participation.campaign_id,
        p_user_id: userId,
        p_msp_delta: mission.mspReward,
        p_post_count_delta: 0,
      })

      if (rpcError) {
        console.error(`Failed to award MSP via RPC for campaign ${participation.campaign_id}:`, rpcError)
        // Fallback: direct update
        await supabase
          .from('participants')
          .update({ msp: (participation.msp ?? 0) + mission.mspReward })
          .eq('campaign_id', participation.campaign_id)
          .eq('user_id', userId)
      }
      
      campaignsUpdated.push(participation.campaign_id)
      
      // Recalculate ranks for this campaign
      try {
        await recalculateRanks(participation.campaign_id)
      } catch (rankError) {
        console.warn(`Failed to recalculate ranks for campaign ${participation.campaign_id}:`, rankError)
      }
    }
    
    console.log(`Awarded ${mission.mspReward} MSP to user ${userId} in ${campaignsUpdated.length} campaigns`)
  } else {
    console.warn(`User ${userId} has no campaign participations - MSP not awarded`)
  }

  return { success: true, mspAwarded: mission.mspReward }
}

// Update user login streak
export async function updateLoginStreak(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
}> {
  const supabase = getSupabaseServerClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Get current streak data
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .returns<UserStreak[]>()
    .single()

  if (!streak) {
    // Create new streak record
    await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_login_date: todayStr,
      })

    return { currentStreak: 1, longestStreak: 1 }
  }

  const lastLoginDate = new Date(streak.last_login_date)
  const lastLoginStr = lastLoginDate.toISOString().split('T')[0]

  // Already logged in today
  if (lastLoginStr === todayStr) {
    return { 
      currentStreak: streak.current_streak, 
      longestStreak: streak.longest_streak 
    }
  }

  // Check if consecutive day
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak: number
  if (lastLoginStr === yesterdayStr) {
    // Consecutive day - increment streak
    newStreak = streak.current_streak + 1
  } else {
    // Streak broken - reset to 1
    newStreak = 1
  }

  const newLongest = Math.max(newStreak, streak.longest_streak)

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_login_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return { currentStreak: newStreak, longestStreak: newLongest }
}

// Refresh all mission progress for a user
export async function refreshAllMissionProgress(userId: string): Promise<void> {
  for (const mission of ALL_MISSIONS) {
    const progress = await calculateMissionProgress(userId, mission.trackingType)
    await updateMissionProgress(userId, mission.id, progress)
  }
}
