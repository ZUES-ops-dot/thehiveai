import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getAllCampaigns, getActiveCampaigns } from '@/lib/supabase/campaigns'

/**
 * GET /api/admin/metrics
 * 
 * Returns comprehensive metrics for the admin dashboard.
 * Includes campaign stats, post counts, MSP totals, and tracking state.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()

    // Fetch all campaigns
    const campaigns = await getAllCampaigns()
    const activeCampaigns = await getActiveCampaigns()

    // Get total post count
    const { count: totalPosts } = await supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })

    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })

    // Get total MSP awarded
    const { data: mspData } = await supabase
      .from('participants')
      .select('msp')
    const totalMsp = mspData?.reduce((sum, p) => sum + (p.msp || 0), 0) ?? 0

    // Get tracking states for all campaigns
    const { data: trackingStates } = await supabase
      .from('tracking_state')
      .select('*')

    // Get posts from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentPosts } = await supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })
      .gte('tracked_at', twentyFourHoursAgo)

    // Get posts from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: weeklyPosts } = await supabase
      .from('post_events')
      .select('*', { count: 'exact', head: true })
      .gte('tracked_at', sevenDaysAgo)

    // Get per-campaign metrics
    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const { count: postCount } = await supabase
          .from('post_events')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        const { count: participantCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        const { data: campaignMspData } = await supabase
          .from('participants')
          .select('msp')
          .eq('campaign_id', campaign.id)
        const campaignMsp = campaignMspData?.reduce((sum, p) => sum + (p.msp || 0), 0) ?? 0

        const trackingState = trackingStates?.find(ts => ts.campaign_id === campaign.id)

        return {
          id: campaign.id,
          name: campaign.name,
          projectTag: campaign.project_tag,
          status: campaign.status,
          startDate: campaign.start_date,
          endDate: campaign.end_date,
          postCount: postCount ?? 0,
          participantCount: participantCount ?? 0,
          totalMsp: campaignMsp,
          lastTrackedAt: trackingState?.last_run_at ?? null,
          totalPostsTracked: trackingState?.total_posts_tracked ?? 0,
        }
      })
    )

    // Get recent post events with details
    const { data: recentPostEvents } = await supabase
      .from('post_events')
      .select('id, campaign_id, user_id, content, likes, retweets, replies, quotes, msp, posted_at, tracked_at, tweet_id')
      .order('tracked_at', { ascending: false })
      .limit(20)

    // Get automation logs
    const { data: automationLogs } = await supabase
      .from('automation_logs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      overview: {
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalPosts: totalPosts ?? 0,
        totalParticipants: totalParticipants ?? 0,
        totalMsp,
        recentPosts: recentPosts ?? 0,
        weeklyPosts: weeklyPosts ?? 0,
      },
      campaigns: campaignMetrics,
      recentPostEvents: recentPostEvents ?? [],
      automationLogs: automationLogs ?? [],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Admin metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
