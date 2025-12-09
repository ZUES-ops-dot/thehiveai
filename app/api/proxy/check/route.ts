import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/server/rateLimit'

export const runtime = 'nodejs'

// Whitelist of allowed domains to check (prevents SSRF abuse)
const ALLOWED_DOMAINS = [
  'playsolana.com',
  'www.playsolana.com',
  'indie.fun',
  'www.indie.fun',
  'modd.io',
  'www.modd.io',
  // Add more trusted domains as needed
]

/**
 * GET /api/proxy/check?url=<url>
 * Checks if a URL can be embedded in an iframe by inspecting response headers
 * for X-Frame-Options and Content-Security-Policy frame-ancestors
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anon'
    if (!rateLimit(`proxy-check-${ip}`)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    const url = req.nextUrl.searchParams.get('url')
    if (!url) {
      return NextResponse.json({ error: 'missing_url' }, { status: 400 })
    }

    // Validate URL format
    if (!/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
    }

    // Parse and validate domain against whitelist
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'domain_not_whitelisted', hostname },
        { status: 403 }
      )
    }

    // Try HEAD first for speed, fall back to GET
    let res: Response | null = null
    try {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'HiveAI-Proxy-Check/1.0',
        },
      })
    } catch {
      // HEAD might not be allowed, try GET
    }

    if (!res || !res.ok) {
      try {
        res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'HiveAI-Proxy-Check/1.0',
          },
        })
      } catch (err) {
        return NextResponse.json({ error: 'fetch_failed', blocked: true }, { status: 502 })
      }
    }

    if (!res) {
      return NextResponse.json({ error: 'fetch_failed', blocked: true }, { status: 502 })
    }

    // Extract relevant headers
    const headers: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    // Detect blocking headers
    const xFrameOptions = headers['x-frame-options'] || ''
    const csp = headers['content-security-policy'] || ''

    // X-Frame-Options: DENY or SAMEORIGIN blocks embedding
    const blockedByXFO = !!xFrameOptions && /deny|sameorigin/i.test(xFrameOptions)

    // CSP frame-ancestors: check if it restricts embedding
    // If frame-ancestors is present and doesn't include 'self' or '*', it's likely blocked
    let blockedByCSP = false
    if (csp) {
      const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i)
      if (frameAncestorsMatch) {
        const ancestors = frameAncestorsMatch[1].toLowerCase()
        // Blocked if it only allows 'none' or specific domains that don't include our domain
        blockedByCSP = ancestors.includes("'none'") || 
          (!ancestors.includes('*') && !ancestors.includes('localhost'))
      }
    }

    const blocked = blockedByXFO || blockedByCSP

    return NextResponse.json({
      ok: true,
      blocked,
      reason: blocked
        ? blockedByXFO
          ? `X-Frame-Options: ${xFrameOptions}`
          : `CSP frame-ancestors restriction`
        : null,
      headers: {
        'x-frame-options': xFrameOptions || null,
        'content-security-policy': csp ? csp.substring(0, 200) + '...' : null,
      },
    })
  } catch (err) {
    console.error('Proxy check failed:', err)
    return NextResponse.json({ error: 'internal', blocked: true }, { status: 500 })
  }
}
