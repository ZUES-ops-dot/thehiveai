import { NextRequest, NextResponse } from 'next/server'
import { joinCampaign, leaveCampaign, getParticipant } from '@/lib/supabase/participants'
import { getCampaignById } from '@/lib/supabase/campaigns'
import type { XUser } from '@/lib/types/auth'

interface RouteParams {
  params: { id: string }
}

/**
 * Join a campaign
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: campaignId } = params

  // Get user from middleware-injected header
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  try {
    // Verify campaign exists
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if already joined
    const existing = await getParticipant(campaignId, user.id)
    if (existing) {
      return NextResponse.json({ participant: existing, alreadyJoined: true })
    }

    // Join campaign
    const participant = await joinCampaign({
      campaignId,
      userId: user.id,
      username: user.username,
      displayName: user.name,
      profileImageUrl: user.profileImageUrl,
      followersCount: user.followersCount,
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Failed to join campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    console.error('Failed to join campaign:', error)
    return NextResponse.json(
      { error: 'Failed to join campaign' },
      { status: 500 }
    )
  }
}

/**
 * Leave a campaign
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: campaignId } = params

  // Get user from middleware-injected header
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  try {
    const success = await leaveCampaign(campaignId, user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to leave campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to leave campaign:', error)
    return NextResponse.json(
      { error: 'Failed to leave campaign' },
      { status: 500 }
    )
  }
}
