import { NextRequest, NextResponse } from 'next/server'
import type { XUser } from '@/lib/types/auth'
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const encodedUser = request.headers.get('x-hive-user')

  try {
    if (encodedUser) {
      const user = JSON.parse(decodeURIComponent(encodedUser)) as XUser
      return NextResponse.json({ isAuthenticated: true, user })
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (sessionToken) {
      const payload = await verifySession(sessionToken)
      if (payload?.user) {
        return NextResponse.json({ isAuthenticated: true, user: payload.user })
      }
    }
  } catch (error) {
    console.error('Failed to parse user from session header', error)
  }

  return NextResponse.json(
    { isAuthenticated: false, user: null },
    { status: 401 }
  )
}
