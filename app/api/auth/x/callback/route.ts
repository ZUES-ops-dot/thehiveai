import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { INVITE_COOKIE_NAME, INVITE_MSP_BONUS } from '@/lib/constants/invites'
import { ensureInviteCampaignParticipant, redeemInviteBonus, type InviteCookieData } from '@/lib/supabase/invites'

const X_CLIENT_ID = process.env.X_CLIENT_ID || ''
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || ''
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || 'http://localhost:3000/api/auth/x/callback'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('X OAuth error:', error)
      return NextResponse.redirect(new URL('/profile?error=oauth_denied', request.url))
    }

    // Verify state
    const storedState = request.cookies.get('x_oauth_state')?.value
    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL('/profile?error=invalid_state', request.url))
    }

    // Get code verifier
    const codeVerifier = request.cookies.get('x_code_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(new URL('/profile?error=missing_verifier', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/profile?error=no_code', request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/profile?error=token_exchange', request.url))
    }

    const tokens = await tokenResponse.json()

    // Fetch user info
    const userResponse = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,public_metrics,verified,created_at',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    if (!userResponse.ok) {
      console.error('User fetch failed:', await userResponse.text())
      return NextResponse.redirect(new URL('/profile?error=user_fetch', request.url))
    }

    const userData = await userResponse.json()
    const user = userData.data

    // Create user object matching our XUser type
    const xUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      profileImageUrl: user.profile_image_url?.replace('_normal', '_400x400') || '',
      description: user.description || '',
      followersCount: user.public_metrics?.followers_count || 0,
      followingCount: user.public_metrics?.following_count || 0,
      tweetCount: user.public_metrics?.tweet_count || 0,
      verified: user.verified || false,
      createdAt: user.created_at || new Date().toISOString(),
    }

    // Issue session token
    const { token: sessionToken, expiresAt } = await createSession(xUser)

    // Attempt invite redemption if referral cookie present
    const inviteCookie = request.cookies.get(INVITE_COOKIE_NAME)?.value
    let inviteBonusApplied = false
    if (inviteCookie) {
      try {
        const cookieData = JSON.parse(inviteCookie) as InviteCookieData

        // Ensure inviter has an Invite Rewards participant record so downstream lookups succeed
        await ensureInviteCampaignParticipant(cookieData.inviterUserId, cookieData.inviterUsername)

        inviteBonusApplied = await redeemInviteBonus({
          inviterUserId: cookieData.inviterUserId,
          inviterUsername: cookieData.inviterUsername,
          inviteeUserId: xUser.id,
          inviteeUsername: xUser.username,
          mspAwarded: INVITE_MSP_BONUS,
        })
      } catch (error) {
        console.error('Failed to redeem invite bonus:', error)
      }
    }

    // Redirect to profile (client will hydrate via /api/auth/me)
    // Use the configured redirect URI origin to ensure we stay on the correct domain
    const baseUrl = new URL(X_REDIRECT_URI).origin
    const redirectUrl = new URL('/profile', baseUrl)
    redirectUrl.searchParams.set('auth', 'success')
    if (inviteBonusApplied) {
      redirectUrl.searchParams.set('invite', 'bonus')
    } else if (inviteCookie) {
      redirectUrl.searchParams.set('invite', 'tracked')
    }
    const response = NextResponse.redirect(redirectUrl)

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor((expiresAt - Date.now()) / 1000),
    })

    // Store access token securely
    response.cookies.set('x_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 7200,
    })

    // Clear OAuth + invite cookies
    response.cookies.delete('x_code_verifier')
    response.cookies.delete('x_oauth_state')
    response.cookies.delete(INVITE_COOKIE_NAME)

    return response
  } catch (error) {
    console.error('X OAuth callback error:', error)
    return NextResponse.redirect(new URL('/profile?error=callback_failed', request.url))
  }
}
