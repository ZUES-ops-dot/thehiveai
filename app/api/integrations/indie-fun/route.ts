import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'

/**
 * GET /api/integrations/indie-fun
 * Returns trending indie devlogs (mock for now, ready for scraping integration)
 */

interface Devlog {
  id: string
  title: string
  author: string
  tags: string[]
  url: string
  summary: string
  publishedAt: string
  source: string
}

interface IndieFunResponse {
  devlogs: Devlog[]
  lastUpdated: string
}

// Mock data - replace with real scraping
const mockDevlogs: Devlog[] = [
  {
    id: 'dev-1',
    title: 'Building a Roguelike in 7 Days',
    author: 'PixelCraft Studios',
    tags: ['roguelike', 'gamedev', 'unity'],
    url: 'https://indie.fun/devlog/roguelike-7-days',
    summary: 'A deep dive into rapid prototyping and procedural generation techniques for our jam entry.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    source: 'indie.fun',
  },
  {
    id: 'dev-2',
    title: 'Pixel Art Animation Workflow',
    author: 'RetroWave Games',
    tags: ['pixel-art', 'animation', 'tutorial'],
    url: 'https://indie.fun/devlog/pixel-animation',
    summary: 'How we create smooth 8-frame animations for our retro platformer using Aseprite.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    source: 'indie.fun',
  },
  {
    id: 'dev-3',
    title: 'Multiplayer Netcode Deep Dive',
    author: 'Quantum Arcade',
    tags: ['multiplayer', 'netcode', 'godot'],
    url: 'https://indie.fun/devlog/netcode-deep-dive',
    summary: 'Solving latency issues and implementing rollback netcode in our fighting game.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    source: 'indie.fun',
  },
  {
    id: 'dev-4',
    title: 'Procedural Music Generation',
    author: 'SynthWave Interactive',
    tags: ['audio', 'procedural', 'music'],
    url: 'https://indie.fun/devlog/procedural-music',
    summary: 'Creating dynamic soundtracks that adapt to gameplay using algorithmic composition.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: 'indie.fun',
  },
  {
    id: 'dev-5',
    title: 'Steam Launch Post-Mortem',
    author: 'Neon Nights Studio',
    tags: ['launch', 'marketing', 'steam'],
    url: 'https://indie.fun/devlog/steam-postmortem',
    summary: 'What we learned from our first week on Steam: the good, the bad, and the wishlist.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    source: 'indie.fun',
  },
]

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real scraping of indie.fun
    // For now, return mock data

    const response: IndieFunResponse = {
      devlogs: mockDevlogs,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    })
  } catch (error) {
    console.error('Indie.fun API error:', error)
    return NextResponse.json({ error: 'Failed to fetch devlogs' }, { status: 500 })
  }
}

/**
 * POST /api/integrations/indie-fun
 * Save a devlog to user's bookmarks
 */
export async function POST(request: NextRequest) {
  try {
    const encodedUser = request.headers.get('x-hive-user')
    if (!encodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    try {
      const user = JSON.parse(decodeURIComponent(encodedUser))
      userId = user.id
    } catch {
      return NextResponse.json({ error: 'Invalid user header' }, { status: 400 })
    }

    const body = await request.json()
    const { devlog } = body

    if (!devlog || !devlog.id) {
      return NextResponse.json({ error: 'Missing devlog data' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase.from('workspace_bookmarks').insert({
      user_id: userId,
      source: 'indie_fun',
      payload: devlog,
    } as never)

    if (error) {
      console.error('Failed to save bookmark:', error)
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Indie.fun save error:', error)
    return NextResponse.json({ error: 'Failed to save devlog' }, { status: 500 })
  }
}
