import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth/session'

const canonicalUrl = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : null

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')

  if (
    canonicalUrl &&
    process.env.NODE_ENV === 'production' &&
    host &&
    host !== canonicalUrl.host
  ) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, canonicalUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (sessionToken) {
    const payload = await verifySession(sessionToken)
    if (payload?.user) {
      const encodedUser = encodeURIComponent(JSON.stringify(payload.user))
      requestHeaders.set('x-hive-user', encodedUser)
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/:path*'],
}
