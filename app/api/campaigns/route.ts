import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCampaigns,
  getActiveCampaigns,
  createCampaign,
  getCampaignParticipantCount,
  getCampaignTotalMSP,
} from '@/lib/supabase/campaigns'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    let campaigns
    if (status === 'active') {
      campaigns = await getActiveCampaigns()
    } else {
      campaigns = await getAllCampaigns()
    }

    // Filter out the synthetic Invite Rewards campaign from public listings
    const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID
    const publicCampaigns = campaigns.filter(
      (c) => c.id !== INVITE_REWARDS_CAMPAIGN_ID && c.project_tag !== 'invite_rewards'
    )

    // Enrich with participant count and total MSP
    const enriched = await Promise.all(
      publicCampaigns.map(async (campaign) => {
        const [participantCount, totalMsp] = await Promise.all([
          getCampaignParticipantCount(campaign.id),
          getCampaignTotalMSP(campaign.id),
        ])
        return {
          ...campaign,
          participantCount,
          totalMsp,
        }
      })
    )

    return NextResponse.json({ campaigns: enriched })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, projectTag, startDate, endDate, description, rewardPool } = body
    if (!name || !projectTag || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, projectTag, startDate, endDate' },
        { status: 400 }
      )
    }

    // Validate projectTag format (alphanumeric, underscores, 3-30 chars)
    const tagRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/
    if (!tagRegex.test(projectTag)) {
      return NextResponse.json(
        { error: 'Invalid projectTag: must be 3-30 alphanumeric characters, starting with a letter' },
        { status: 400 }
      )
    }

    // Validate dates
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate or endDate' },
        { status: 400 }
      )
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'endDate must be after startDate' },
        { status: 400 }
      )
    }

    // Check for duplicate projectTag
    const { getCampaignByTag } = await import('@/lib/supabase/campaigns')
    const existing = await getCampaignByTag(projectTag)
    if (existing) {
      return NextResponse.json(
        { error: 'A campaign with this projectTag already exists' },
        { status: 409 }
      )
    }

    // Determine initial status based on dates
    let status: 'active' | 'upcoming' | 'ended' = 'upcoming'
    if (now >= start && now <= end) {
      status = 'active'
    } else if (now > end) {
      status = 'ended'
    }

    const campaign = await createCampaign({
      name,
      project_tag: projectTag,
      description: description || null,
      reward_pool: rewardPool || 0,
      start_date: startDate,
      end_date: endDate,
      status,
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
