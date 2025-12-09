import { NextRequest, NextResponse } from 'next/server'
import { getUserCampaigns } from '@/lib/supabase/participants'
import { getConnectedAccounts } from '@/lib/supabase/connected-accounts'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getInviteMspBreakdown } from '@/lib/supabase/invites'
import { updateLoginStreak } from '@/lib/supabase/missions'
import type { XUser } from '@/lib/types/auth'
import type { GlowTier } from '@/lib/types/economy'

// Tier thresholds for MSP
const TIER_THRESHOLDS: { tier: GlowTier; minMsp: number }[] = [
  { tier: 'overmind', minMsp: 100000 },
  { tier: 'apex', minMsp: 50000 },
  { tier: 'echelon', minMsp: 10000 },
  { tier: 'lumina', minMsp: 1000 },
  { tier: 'prime', minMsp: 0 },
]

function calculateGlowTier(totalMsp: number): GlowTier {
  for (const { tier, minMsp } of TIER_THRESHOLDS) {
    if (totalMsp >= minMsp) return tier
  }
  return 'prime'
}

function calculateStreakFromPosts(postDates: string[]): number {
  if (postDates.length === 0) return 0

  const daySet = new Set(
    postDates.map((iso) => {
      const date = new Date(iso)
      return date.toISOString().slice(0, 10)
    })
  )

  let streak = 0
  const cursor = new Date()

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!daySet.has(key)) break
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

function calculateConversionScore(totalMsp: number, totalPosts: number): number {
  // Conversion = average MSP per post (normalized to 0-1 scale, max ~500 MSP/post)
  if (totalPosts === 0) return 0
  const avgMspPerPost = totalMsp / totalPosts
  return Math.min(avgMspPerPost / 500, 1)
}

export async function GET(request: NextRequest) {
  // Get user from middleware-injected header
  const encodedUser = request.headers.get('x-hive-user')
  if (!encodedUser) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  let user: XUser
  try {
    user = JSON.parse(decodeURIComponent(encodedUser))
  } catch {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get all campaigns user has joined and connected accounts
    // Update login streak on each authenticated request (ensures daily_login mission works)
    // Fire-and-forget to avoid blocking the response
    updateLoginStreak(user.id).catch((err) =>
      console.warn('Failed to update login streak:', err)
    )

    const [participations, connectedAccounts, userPostsResponse, inviteMspBreakdown] = await Promise.all([
      getUserCampaigns(user.id),
      getConnectedAccounts(user.id),
      supabase
        .from('post_events')
        .select('campaign_id, msp, posted_at')
        .eq('user_id', user.id),
      getInviteMspBreakdown(user.id),
    ])

    if (userPostsResponse.error) {
      console.error('Failed to fetch user posts:', userPostsResponse.error)
    }

    type UserPostRow = {
      campaign_id: string
      msp: number | null
      posted_at: string
    }

    const userPosts = (userPostsResponse.data ?? []) as UserPostRow[]

    // Calculate aggregate stats
    // IMPORTANT: Mission/Invite MSP is propagated to ALL campaigns, so we can't just sum across campaigns
    // Instead, we calculate total MSP as:
    // - Post MSP (from post_events, unique per campaign)
    // - Mission MSP (from user_missions, counted ONCE)
    // - Invite MSP (from invite_redemptions, counted ONCE)
    const inviteMsp = inviteMspBreakdown ?? { total: 0, weekly: 0, monthly: 0, yearly: 0 }
    
    // Get post MSP from post_events (these are unique per campaign)
    const postMsp = userPosts.reduce((sum, post) => sum + (post.msp ?? 0), 0)
    
    // Get mission MSP (claimed missions) - count once, not per campaign
    const { data: claimedMissions } = await supabase
      .from('user_missions')
      .select('msp_awarded')
      .eq('user_id', user.id)
      .eq('status', 'claimed')
      .returns<{ msp_awarded: number }[]>()
    
    const missionMsp = (claimedMissions ?? []).reduce((sum, m) => sum + (m.msp_awarded ?? 0), 0)
    
    // Total MSP = Post MSP + Mission MSP + Invite MSP (each counted once)
    const totalMsp = postMsp + missionMsp + inviteMsp.total
    
    // For backward compatibility, also calculate campaign MSP (sum across participations)
    const campaignMsp = participations.reduce((sum, p) => sum + (p.msp || 0), 0)
    const totalPosts = participations.reduce((sum, p) => sum + (p.post_count || 0), 0)
    const campaignCount = participations.length
    const bestRank = participations.length > 0
      ? Math.min(...participations.map(p => p.rank ?? Infinity))
      : null

    // Calculate extended creator profile stats
    const glowTier = calculateGlowTier(totalMsp)
    const postDateList = userPosts.map((p) => p.posted_at).filter(Boolean) as string[]
    const currentStreak = calculateStreakFromPosts(postDateList)
    const conversionScore = calculateConversionScore(totalMsp, totalPosts)
    
    // Narratives amplified = unique campaigns participated in
    const narrativesAmplified = campaignCount
    
    // Credits earned (placeholder: 10% of MSP converted to credits)
    const creditsEarned = Math.floor(totalMsp * 0.1)
    
    // Period-based MSP derived from actual post history
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000

    const mspWeekly =
      userPosts
        .filter((post) => new Date(post.posted_at).getTime() >= weekAgo)
        .reduce((sum, post) => sum + (post.msp ?? 0), 0) + inviteMsp.weekly

    const mspMonthly =
      userPosts
        .filter((post) => new Date(post.posted_at).getTime() >= monthAgo)
        .reduce((sum, post) => sum + (post.msp ?? 0), 0) + inviteMsp.monthly

    const mspYearly =
      userPosts
        .filter((post) => new Date(post.posted_at).getTime() >= yearAgo)
        .reduce((sum, post) => sum + (post.msp ?? 0), 0) + inviteMsp.yearly

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        verified: user.verified,
      },
      stats: {
        totalMsp,
        totalPosts,
        campaignCount,
        bestRank,
        inviteBonusMsp: inviteMsp.total,
        campaignMsp,
      },
      creatorProfile: {
        glowTier,
        mspLifetime: totalMsp,
        mspWeekly,
        mspMonthly,
        mspYearly,
        narrativesAmplified,
        currentStreak,
        conversionScore,
        creditsEarned,
        bestRankAchieved: bestRank,
      },
      participations: participations.map(p => ({
        campaignId: p.campaign_id,
        msp: p.msp,
        postCount: p.post_count,
        rank: p.rank,
        joinedAt: p.joined_at,
      })),
      // Connected X accounts for filtering
      connectedAccounts: connectedAccounts.map(a => ({
        id: a.id,
        xUserId: a.x_user_id,
        handle: a.handle,
        displayName: a.display_name,
        profileImageUrl: a.profile_image_url,
        followersCount: a.followers_count,
        connectedAt: a.connected_at,
        active: a.active,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
