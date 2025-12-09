import { NextRequest, NextResponse } from 'next/server'
import {
  runIncrementalTracking,
  runAllCampaignsTracking,
} from '@/lib/engine/incremental-tracker'
import { recalculateRanks } from '@/lib/supabase/participants'
import { getCampaignByTag } from '@/lib/supabase/campaigns'

/**
 * POST /api/tracking/run
 * 
 * Trigger incremental tracking for one or all campaigns.
 * Can be called by Vercel Cron or manually.
 * 
 * Query params:
 * - projectTag: Run for specific campaign (optional)
 * - all: Run for all active campaigns (default if no projectTag)
 * - recalculateRanks: Also recalculate leaderboard ranks (optional)
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectTag = searchParams.get('projectTag')
  const runAll = searchParams.get('all') === 'true' || !projectTag
  const shouldRecalculateRanks = searchParams.get('recalculateRanks') === 'true'

  // Optional: Verify cron secret for production
  const cronSecret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && cronSecret !== expectedSecret) {
    // Allow requests without secret in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    let results

    if (runAll) {
      results = await runAllCampaignsTracking()
    } else {
      const result = await runIncrementalTracking(projectTag!)
      results = [result]
    }

    // Optionally recalculate ranks for affected campaigns
    if (shouldRecalculateRanks) {
      for (const result of results) {
        if (result.campaignId && result.newPostsTracked > 0) {
          await recalculateRanks(result.campaignId)
        }
      }
    }

    // Summary stats
    const summary = {
      campaignsProcessed: results.length,
      totalNewPosts: results.reduce((sum, r) => sum + r.newPostsTracked, 0),
      totalDuplicatesSkipped: results.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
      totalMspAwarded: results.reduce((sum, r) => sum + r.totalMspAwarded, 0),
      totalParticipantsUpdated: new Set(results.flatMap(r => r.participantsUpdated)).size,
      errors: results.flatMap(r => r.errors),
      ranksRecalculated: shouldRecalculateRanks,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
    })
  } catch (error) {
    console.error('Tracking run failed:', error)
    return NextResponse.json(
      { error: 'Tracking run failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tracking/run
 * 
 * Run tracking (for Vercel Cron) or get status.
 * - With ?all=true: Runs tracking for all campaigns (used by Vercel Cron)
 * - With ?projectTag=X: Returns tracking summary for that campaign
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectTag = searchParams.get('projectTag')
  const runAll = searchParams.get('all') === 'true'
  const shouldRecalculateRanks = searchParams.get('recalculateRanks') === 'true'

  // If all=true, run tracking for all campaigns (Vercel Cron path)
  if (runAll) {
    try {
      const results = await runAllCampaignsTracking()

      // Optionally recalculate ranks for affected campaigns
      if (shouldRecalculateRanks) {
        for (const result of results) {
          if (result.campaignId && result.newPostsTracked > 0) {
            await recalculateRanks(result.campaignId)
          }
        }
      }

      // Summary stats
      const summary = {
        campaignsProcessed: results.length,
        totalNewPosts: results.reduce((sum, r) => sum + r.newPostsTracked, 0),
        totalDuplicatesSkipped: results.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
        totalMspAwarded: results.reduce((sum, r) => sum + r.totalMspAwarded, 0),
        totalParticipantsUpdated: new Set(results.flatMap(r => r.participantsUpdated)).size,
        errors: results.flatMap(r => r.errors),
        ranksRecalculated: shouldRecalculateRanks,
      }

      return NextResponse.json({
        success: true,
        summary,
        results,
      })
    } catch (error) {
      console.error('Tracking run failed:', error)
      return NextResponse.json(
        { error: 'Tracking run failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }

  // Otherwise, return tracking summary for a specific campaign
  if (!projectTag) {
    return NextResponse.json(
      { error: 'projectTag query parameter required (or use all=true)' },
      { status: 400 }
    )
  }

  try {
    const campaign = await getCampaignByTag(projectTag)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const { getTrackingSummary } = await import('@/lib/engine/incremental-tracker')
    const summary = await getTrackingSummary(campaign.id)

    return NextResponse.json({
      campaignId: campaign.id,
      projectTag,
      ...summary,
    })
  } catch (error) {
    console.error('Failed to get tracking summary:', error)
    return NextResponse.json(
      { error: 'Failed to get tracking summary' },
      { status: 500 }
    )
  }
}
