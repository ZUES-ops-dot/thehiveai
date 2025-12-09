import { NextRequest, NextResponse } from 'next/server'
import type { XUser } from '@/lib/types/auth'
import { 
  getUserMissions, 
  refreshAllMissionProgress,
  updateLoginStreak,
} from '@/lib/supabase/missions'
import { 
  ALL_MISSIONS,
  getResetTimeForType,
  getDailyResetTime,
  getWeeklyResetTime,
  getMonthlyResetTime,
} from '@/lib/missions/definitions'

/**
 * GET /api/missions
 * 
 * Returns all missions with user's current progress.
 * Requires authenticated user via x-hive-user header.
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from header
    const encodedUser = request.headers.get('x-hive-user')
    if (!encodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user: XUser
    try {
      user = JSON.parse(decodeURIComponent(encodedUser))
    } catch {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
    }

    // Update login streak on each request
    const streakData = await updateLoginStreak(user.id)

    // Refresh mission progress from tracked data
    await refreshAllMissionProgress(user.id)

    // Get missions with updated progress
    const { missions, error } = await getUserMissions(user.id)

    if (error) {
      console.error('Failed to get missions:', error)
      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })
    }

    // Calculate stats
    const dailyMissions = missions.filter(m => m.type === 'daily')
    const weeklyMissions = missions.filter(m => m.type === 'weekly')
    const monthlyMissions = missions.filter(m => m.type === 'monthly')
    const specialMissions = missions.filter(m => m.type === 'special')

    const completedDaily = dailyMissions.filter(m => m.status === 'completed' || m.status === 'claimed').length
    const completedWeekly = weeklyMissions.filter(m => m.status === 'completed' || m.status === 'claimed').length
    const completedMonthly = monthlyMissions.filter(m => m.status === 'completed' || m.status === 'claimed').length

    const claimableMissions = missions.filter(m => m.status === 'completed')
    const totalClaimableMsp = claimableMissions.reduce((sum, m) => sum + m.mspReward, 0)

    return NextResponse.json({
      missions,
      stats: {
        daily: { total: dailyMissions.length, completed: completedDaily },
        weekly: { total: weeklyMissions.length, completed: completedWeekly },
        monthly: { total: monthlyMissions.length, completed: completedMonthly },
        special: { total: specialMissions.length, completed: specialMissions.filter(m => m.status === 'claimed').length },
        claimable: claimableMissions.length,
        totalClaimableMsp,
      },
      streak: streakData,
      resets: {
        daily: getDailyResetTime().toISOString(),
        weekly: getWeeklyResetTime().toISOString(),
        monthly: getMonthlyResetTime().toISOString(),
      },
    })
  } catch (error) {
    console.error('Missions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
