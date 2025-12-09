import { NextRequest, NextResponse } from 'next/server'
import type { XUser } from '@/lib/types/auth'
import { claimMission, calculateMissionProgress, updateMissionProgress } from '@/lib/supabase/missions'
import { getMissionById } from '@/lib/missions/definitions'

/**
 * POST /api/missions/claim
 * 
 * Claims a completed mission and awards MSP.
 * Body: { missionId: string }
 */
export async function POST(request: NextRequest) {
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

    // Parse body
    const body = await request.json()
    const { missionId } = body

    if (!missionId || typeof missionId !== 'string') {
      return NextResponse.json({ error: 'Mission ID required' }, { status: 400 })
    }

    // Verify mission exists
    const mission = getMissionById(missionId)
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // Recalculate progress to ensure it's up to date
    const currentProgress = await calculateMissionProgress(user.id, mission.trackingType)
    await updateMissionProgress(user.id, missionId, currentProgress)

    // Check if mission is actually completed
    if (currentProgress < mission.target) {
      return NextResponse.json({ 
        error: 'Mission not completed yet',
        progress: currentProgress,
        target: mission.target,
      }, { status: 400 })
    }

    // Claim the mission
    const result = await claimMission(user.id, missionId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mspAwarded: result.mspAwarded,
      mission: {
        id: mission.id,
        title: mission.title,
        mspReward: mission.mspReward,
        badgeReward: mission.badgeReward,
      },
    })
  } catch (error) {
    console.error('Mission claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
