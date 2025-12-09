import { NextRequest, NextResponse } from 'next/server'
import { INVITE_COOKIE_MAX_AGE, INVITE_COOKIE_NAME } from '@/lib/constants/invites'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import type { Participant, ConnectedAccount } from '@/lib/supabase/types'

interface RouteParams {
  params: { username: string }
}

function normalizeHandle(handle: string | null | undefined) {
  if (!handle) return null
  return handle.trim().replace(/^@/, '')
}

function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host
  return `${proto}://${host}`
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const normalized = normalizeHandle(params.username)

  if (!normalized) {
    const origin = getRequestOrigin(request)
    return NextResponse.redirect(`${origin}/profile?invite=invalid`)
  }

  const supabase = getSupabaseServerClient()

  const { data: participant } = await supabase
    .from('participants')
    .select('user_id, username')
    .ilike('username', normalized)
    .limit(1)
    .maybeSingle<Pick<Participant, 'user_id' | 'username'>>()

  let inviterUserId = participant?.user_id ?? null
  let inviterUsername = participant?.username ?? null

  if (!inviterUserId) {
    const { data: connectedAccount } = await supabase
      .from('connected_accounts')
      .select('owner_user_id, handle')
      .ilike('handle', normalized)
      .limit(1)
      .maybeSingle<Pick<ConnectedAccount, 'owner_user_id' | 'handle'>>()

    if (connectedAccount) {
      inviterUserId = connectedAccount.owner_user_id
      inviterUsername = normalizeHandle(connectedAccount.handle)
    }
  }

  if (!inviterUserId) {
    const origin = getRequestOrigin(request)
    return NextResponse.redirect(`${origin}/profile?invite=missing`)
  }

  const origin = getRequestOrigin(request)
  const response = NextResponse.redirect(`${origin}/profile?invite=tracked`)
  response.cookies.set({
    name: INVITE_COOKIE_NAME,
    value: JSON.stringify({ inviterUserId, inviterUsername }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: INVITE_COOKIE_MAX_AGE,
  })

  return response
}
