import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear all auth cookies
    response.cookies.delete('x_user')
    response.cookies.delete('x_access_token')
    response.cookies.delete('hive_session')
    response.cookies.delete('x_code_verifier')
    response.cookies.delete('x_oauth_state')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Also support GET for simple logout links
  const response = NextResponse.redirect(new URL('/profile', request.url))

  response.cookies.delete('x_user')
  response.cookies.delete('x_access_token')
  response.cookies.delete('hive_session')
  response.cookies.delete('x_code_verifier')
  response.cookies.delete('x_oauth_state')

  return response
}
