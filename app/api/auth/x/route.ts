import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// X OAuth 2.0 with PKCE
// Docs: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code

const X_CLIENT_ID = process.env.X_CLIENT_ID || ''
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || 'http://localhost:3000/api/auth/x/callback'

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

// Generate state for CSRF protection
function generateState() {
  return crypto.randomBytes(16).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    // Ensure we're on the canonical domain before starting OAuth
    // This prevents cookie domain mismatch between init and callback
    const canonicalOrigin = new URL(X_REDIRECT_URI).origin
    const currentOrigin = request.nextUrl.origin
    if (currentOrigin !== canonicalOrigin) {
      return NextResponse.redirect(new URL('/api/auth/x', canonicalOrigin))
    }

    const { codeVerifier, codeChallenge } = generatePKCE()
    const state = generateState()

    // Store code verifier and state in cookies for callback verification
    const response = NextResponse.redirect(
      `https://twitter.com/i/oauth2/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        client_id: X_CLIENT_ID,
        redirect_uri: X_REDIRECT_URI,
        scope: 'tweet.read users.read follows.read offline.access',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }).toString()
    )

    // Set secure cookies
    response.cookies.set('x_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    response.cookies.set('x_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    })

    return response
  } catch (error) {
    console.error('X OAuth init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize X authentication' },
      { status: 500 }
    )
  }
}
