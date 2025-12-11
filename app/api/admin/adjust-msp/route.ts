/**
 * POST /api/admin/adjust-msp
 * 
 * Allows admin to add or subtract MSP from a participant's account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { recalculateRanks } from '@/lib/supabase/participants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participantId, campaignId, adjustment, reason } = body

    if (!participantId || adjustment === undefined) {
      return NextResponse.json(
        { error: 'participantId and adjustment are required' },
        { status: 400 }
      )
    }

    const adjustmentNum = Number(adjustment)
    if (isNaN(adjustmentNum)) {
      return NextResponse.json(
        { error: 'adjustment must be a number' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Get current participant data
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('id, campaign_id, user_id, username, msp')
      .eq('id', participantId)
      .single()

    if (fetchError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    const oldMsp = participant.msp ?? 0
    const newMsp = Math.max(0, oldMsp + adjustmentNum) // Don't allow negative MSP

    // Update MSP
    const { error: updateError } = await supabase
      .from('participants')
      .update({ msp: newMsp })
      .eq('id', participantId)

    if (updateError) {
      console.error('Failed to update MSP:', updateError)
      return NextResponse.json(
        { error: 'Failed to update MSP' },
        { status: 500 }
      )
    }

    // Log the adjustment
    console.log(`[Admin] MSP adjusted for @${participant.username}: ${oldMsp} -> ${newMsp} (${adjustmentNum > 0 ? '+' : ''}${adjustmentNum}) - Reason: ${reason || 'No reason provided'}`)

    // Recalculate ranks for the campaign
    const targetCampaignId = campaignId || participant.campaign_id
    if (targetCampaignId) {
      await recalculateRanks(targetCampaignId)
    }

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        username: participant.username,
        oldMsp,
        newMsp,
        adjustment: adjustmentNum,
      },
    })
  } catch (error) {
    console.error('Adjust MSP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
