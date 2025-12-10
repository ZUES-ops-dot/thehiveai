import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'

/**
 * GET /api/admin/search
 * 
 * Search for posts, participants, or campaigns.
 * 
 * Query params:
 * - q: Search query (required)
 * - type: 'posts' | 'participants' | 'campaigns' | 'all' (default: 'all')
 * - campaignId: Filter by campaign (optional)
 * - limit: Max results per type (default: 20)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'
  const campaignId = searchParams.get('campaignId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseServerClient()
    const results: {
      posts?: unknown[]
      participants?: unknown[]
      campaigns?: unknown[]
    } = {}

    // Search posts
    if (type === 'all' || type === 'posts') {
      let postsQuery = supabase
        .from('post_events')
        .select('id, campaign_id, user_id, content, likes, retweets, replies, quotes, msp, posted_at, tracked_at, tweet_id')
        .ilike('content', `%${query}%`)
        .order('msp', { ascending: false })
        .limit(limit)

      if (campaignId) {
        postsQuery = postsQuery.eq('campaign_id', campaignId)
      }

      const { data: posts } = await postsQuery
      results.posts = posts ?? []
    }

    // Search participants
    if (type === 'all' || type === 'participants') {
      let participantsQuery = supabase
        .from('participants')
        .select('id, campaign_id, user_id, username, display_name, msp, post_count, rank, followers_count, profile_image_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('msp', { ascending: false })
        .limit(limit)

      if (campaignId) {
        participantsQuery = participantsQuery.eq('campaign_id', campaignId)
      }

      const { data: participants } = await participantsQuery
      results.participants = participants ?? []
    }

    // Search campaigns
    if (type === 'all' || type === 'campaigns') {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, project_tag, status, start_date, end_date, reward_pool')
        .or(`name.ilike.%${query}%,project_tag.ilike.%${query}%`)
        .order('start_date', { ascending: false })
        .limit(limit)

      results.campaigns = campaigns ?? []
    }

    // Get total counts
    const totalResults = 
      (results.posts?.length ?? 0) + 
      (results.participants?.length ?? 0) + 
      (results.campaigns?.length ?? 0)

    return NextResponse.json({
      success: true,
      query,
      totalResults,
      results,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
