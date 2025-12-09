import { NextRequest, NextResponse } from 'next/server'
import { 
  getNitterHealthStatus, 
  refreshNitterHealth,
  getHealthyInstances 
} from '@/lib/engine/hashtag-tracker'

/**
 * GET /api/nitter/health
 * 
 * Returns health status of all Nitter instances.
 * Useful for monitoring and debugging tracking issues.
 */
export async function GET() {
  try {
    const status = await getNitterHealthStatus()
    
    return NextResponse.json({
      ...status,
      recommendation: status.healthyCount === 0 
        ? 'All instances are down. Tracking may be unavailable.'
        : status.healthyCount < 2
        ? 'Limited instances available. Consider monitoring closely.'
        : 'System healthy.',
    })
  } catch (error) {
    console.error('Failed to get Nitter health:', error)
    return NextResponse.json(
      { error: 'Failed to check Nitter health' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/nitter/health
 * 
 * Force refresh health status for all instances.
 */
export async function POST() {
  try {
    await refreshNitterHealth()
    const healthyInstances = await getHealthyInstances()
    
    return NextResponse.json({
      refreshed: true,
      healthyInstances,
      healthyCount: healthyInstances.length,
    })
  } catch (error) {
    console.error('Failed to refresh Nitter health:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Nitter health' },
      { status: 500 }
    )
  }
}
