import { NextRequest, NextResponse } from 'next/server'
import {
  getCampaignById,
  getCampaignParticipantCount,
  getCampaignTotalMSP,
  updateCampaignStatus,
} from '@/lib/supabase/campaigns'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params

  try {
    const campaign = await getCampaignById(id)

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Block access to the synthetic Invite Rewards campaign
    const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID
    if (campaign.id === INVITE_REWARDS_CAMPAIGN_ID || campaign.project_tag === 'invite_rewards') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const [participantCount, totalMsp] = await Promise.all([
      getCampaignParticipantCount(id),
      getCampaignTotalMSP(id),
    ])

    return NextResponse.json({
      campaign: {
        ...campaign,
        participantCount,
        totalMsp,
      },
    })
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params

  try {
    const body = await request.json()
    const { status } = body

    if (status && !['active', 'upcoming', 'ended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, upcoming, or ended' },
        { status: 400 }
      )
    }

    if (status) {
      const success = await updateCampaignStatus(id, status)
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update campaign' },
          { status: 500 }
        )
      }
    }

    const campaign = await getCampaignById(id)
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
