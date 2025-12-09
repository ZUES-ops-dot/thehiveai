import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import type { XUser } from '@/lib/types/auth'

/**
 * POST /api/projects/interaction
 * 
 * Records a project interaction (user viewed a platform for 30+ seconds)
 * Body: { platform: 'play-solana' | 'indie-fun' | 'moddio', durationSeconds?: number }
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
    const { platform, durationSeconds = 30 } = body

    // Validate platform
    const validPlatforms = ['play-solana', 'indie-fun', 'moddio']
    if (!platform || !validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Minimum 1 second required (click to launch counts)
    if (durationSeconds < 1) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Check if user already interacted with this platform today
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data: existing } = await (supabase
      .from('project_interactions' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .gte('created_at', todayStart.toISOString())
      .limit(1) as any)

    if (existing && existing.length > 0) {
      // Already recorded today
      return NextResponse.json({ 
        success: true, 
        alreadyRecorded: true,
        message: 'Interaction already recorded today' 
      })
    }

    // Record the interaction
    const { error } = await (supabase
      .from('project_interactions' as any)
      .insert({
        user_id: user.id,
        platform,
        duration_seconds: durationSeconds,
      }) as any)

    if (error) {
      console.error('Failed to record project interaction:', error)
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      alreadyRecorded: false,
      message: 'Interaction recorded' 
    })
  } catch (error) {
    console.error('Project interaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/projects/interaction
 * 
 * Get user's project interactions for today
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

    const supabase = getSupabaseServerClient()

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data, error } = await (supabase
      .from('project_interactions' as any)
      .select('platform, created_at')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString()) as any)

    if (error) {
      console.error('Failed to fetch project interactions:', error)
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 })
    }

    const platforms = (data as { platform: string; created_at: string }[] ?? []).map(d => d.platform)
    // ES5 compatible unique array
    const seen: Record<string, boolean> = {}
    const uniquePlatforms = platforms.filter(p => {
      if (seen[p]) return false
      seen[p] = true
      return true
    })

    return NextResponse.json({
      interactions: data ?? [],
      uniquePlatformsToday: uniquePlatforms.length,
      platforms: uniquePlatforms,
    })
  } catch (error) {
    console.error('Project interaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
