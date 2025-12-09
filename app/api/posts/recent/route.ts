import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentPostsWithAuthors } from '@/lib/supabase/posts'
import { getConnectedAccountIds } from '@/lib/supabase/connected-accounts'
import type { XUser } from '@/lib/types/auth'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const limitParam = params.get('limit')
    const campaignIdParam = params.get('campaignId') ?? undefined
    const projectTagParam = params.get('projectTag') ?? undefined
    // If filterByConnected=true, only show posts from user's connected accounts
    const filterByConnected = params.get('filterByConnected') === 'true'

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )

    // Get connected account IDs if filtering is requested
    let connectedUserIds: string[] | undefined
    if (filterByConnected) {
      const encodedUser = request.headers.get('x-hive-user')
      if (encodedUser) {
        try {
          const user: XUser = JSON.parse(decodeURIComponent(encodedUser))
          connectedUserIds = await getConnectedAccountIds(user.id)
        } catch {
          // Ignore parse errors, proceed without filter
        }
      }
    }

    const { posts, campaignId } = await fetchRecentPostsWithAuthors({
      campaignId: campaignIdParam,
      projectTag: projectTagParam,
      limit,
      userIds: connectedUserIds,
    })

    const formattedPosts = posts.map(({ post, author }) => ({
      id: post.id,
      tweetId: post.tweet_id,
      campaignId: post.campaign_id,
      userId: post.user_id,
      content: post.content,
      metrics: {
        likes: post.likes,
        retweets: post.retweets,
        replies: post.replies,
        quotes: post.quotes,
      },
      msp: post.msp,
      postedAt: post.posted_at,
      trackedAt: post.tracked_at,
      author: author
        ? {
            username: author.username,
            displayName: author.display_name,
            profileImageUrl: author.profile_image_url,
          }
        : null,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      count: formattedPosts.length,
      campaignId: campaignId ?? null,
      limit,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Campaign not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('Recent posts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
