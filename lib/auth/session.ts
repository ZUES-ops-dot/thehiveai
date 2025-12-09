import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'
import type { XUser } from '@/lib/types/auth'

export const SESSION_COOKIE_NAME = 'hive_session'
const ISSUER = 'hive-ai'
const AUDIENCE = 'hive-ai-users'
const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 7 // 7 days

interface SessionPayload extends JWTPayload {
  user: XUser
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is not set. Please define it in your environment variables.')
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(user: XUser, ttlSeconds = DEFAULT_SESSION_TTL) {
  const expiresAt = Date.now() + ttlSeconds * 1000

  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(getSecretKey())

  return { token, expiresAt }
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    return payload
  } catch (error) {
    console.error('Invalid session token:', error)
    return null
  }
}

export async function getSessionUserFromRequest(request: Request) {
  const token = request.headers.get('cookie')
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split('=')[1]

  if (!token) return null

  const payload = await verifySession(token)
  return payload?.user ?? null
}
