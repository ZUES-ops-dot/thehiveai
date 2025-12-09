import { NextRequest, NextResponse } from 'next/server'
import { getCampaignLeaderboard, getCampaignById } from '@/lib/supabase/campaigns'

interface RouteParams {
  params: { campaignId: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { campaignId } = params
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 10

  try {
    // Verify campaign exists
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const leaderboard = await getCampaignLeaderboard(campaignId, limit)

    // Add rank numbers
    const rankedLeaderboard = leaderboard.map((participant, index) => ({
      ...participant,
      rank: participant.rank ?? index + 1,
    }))

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      leaderboard: rankedLeaderboard,
      total: leaderboard.length,
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
