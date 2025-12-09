import { NextRequest, NextResponse } from 'next/server'
import { getParticipant, updateParticipantWallet } from '@/lib/supabase/participants'
import type { XUser } from '@/lib/types/auth'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/campaigns/[id]/wallet
 * Returns the current wallet address for the authenticated user in this campaign
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const campaignId = params.id

  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json({ error: 'Invalid user header' }, { status: 400 })
  }

  const participant = await getParticipant(campaignId, user.id)
  if (!participant) {
    return NextResponse.json({ error: 'Not a participant in this campaign' }, { status: 404 })
  }

  return NextResponse.json({
    campaignId,
    userId: user.id,
    walletAddress: participant.wallet_address ?? null,
  })
}

/**
 * POST /api/campaigns/[id]/wallet
 * Updates the wallet address for the authenticated user in this campaign
 * Body: { walletAddress: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const campaignId = params.id

  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json({ error: 'Invalid user header' }, { status: 400 })
  }

  let body: { walletAddress?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const walletAddress = body.walletAddress?.trim() || null

  // Validate wallet address format (basic check for Solana-style addresses)
  if (walletAddress && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
  }

  const participant = await getParticipant(campaignId, user.id)
  if (!participant) {
    return NextResponse.json({ error: 'Not a participant in this campaign' }, { status: 404 })
  }

  const success = await updateParticipantWallet(campaignId, user.id, walletAddress)
  if (!success) {
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    campaignId,
    userId: user.id,
    walletAddress,
  })
}
