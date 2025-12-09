import { NextRequest, NextResponse } from 'next/server'
import { 
  connectAccount, 
  disconnectAccount, 
  getConnectedAccounts,
  getConnectedAccountCount,
} from '@/lib/supabase/connected-accounts'
import type { XUser } from '@/lib/types/auth'

/**
 * GET /api/accounts/connect
 * Returns the user's connected accounts
 */
export async function GET(request: NextRequest) {
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  try {
    const accounts = await getConnectedAccounts(user.id)
    return NextResponse.json({
      accounts: accounts.map(a => ({
        id: a.id,
        xUserId: a.x_user_id,
        handle: a.handle,
        displayName: a.display_name,
        profileImageUrl: a.profile_image_url,
        followersCount: a.followers_count,
        connectedAt: a.connected_at,
        active: a.active,
      })),
      count: accounts.length,
      maxAllowed: 3,
    })
  } catch (error) {
    console.error('Failed to fetch connected accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

/**
 * POST /api/accounts/connect
 * Connect a new X account
 * Body: { xUserId, handle, displayName, profileImageUrl?, followersCount? }
 */
export async function POST(request: NextRequest) {
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  let body: {
    xUserId: string
    handle: string
    displayName: string
    profileImageUrl?: string
    followersCount?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { xUserId, handle, displayName, profileImageUrl, followersCount } = body

  if (!xUserId || !handle || !displayName) {
    return NextResponse.json(
      { error: 'Missing required fields: xUserId, handle, displayName' },
      { status: 400 }
    )
  }

  try {
    // Check current count
    const currentCount = await getConnectedAccountCount(user.id)
    if (currentCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 connected accounts allowed. Disconnect one first.' },
        { status: 400 }
      )
    }

    const account = await connectAccount({
      ownerUserId: user.id,
      xUserId,
      handle,
      displayName,
      profileImageUrl,
      followersCount,
    })

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        xUserId: account.x_user_id,
        handle: account.handle,
        displayName: account.display_name,
        profileImageUrl: account.profile_image_url,
        followersCount: account.followers_count,
        connectedAt: account.connected_at,
        active: account.active,
      },
    })
  } catch (error) {
    console.error('Failed to connect account:', error)
    const message = error instanceof Error ? error.message : 'Failed to connect account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/accounts/connect
 * Disconnect an X account
 * Body: { xUserId }
 */
export async function DELETE(request: NextRequest) {
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  let body: { xUserId: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { xUserId } = body

  if (!xUserId) {
    return NextResponse.json({ error: 'Missing required field: xUserId' }, { status: 400 })
  }

  try {
    await disconnectAccount(user.id, xUserId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect account:', error)
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
  }
}
