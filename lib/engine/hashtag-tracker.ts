/**
 * HiveAI Hashtag Tracking Engine
 * 
 * Uses dual-hashtag system for tracking posts on X:
 * - Primary: #HiveAI (required in ALL campaigns)
 * - Secondary: #<ProjectTag> (unique per campaign)
 * 
 * A post is only valid if it contains BOTH hashtags.
 * 
 * Data sources (free, no API required):
 * 1. Nitter instances (primary)
 * 2. X Advanced Search URLs (fallback/manual)
 */

import type { TrackedPost, TrackingQuery } from '@/lib/types/auth'
import { calculatePostMspFull, type TrackedPostInput } from './mindshare-engine'

// Available Nitter instances (rotate if one is down)
const NITTER_INSTANCES = [
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.1d4.us',
  'nitter.lucabased.xyz',
  'nitter.woodland.cafe',
]

// Cache for instance health status
interface InstanceHealth {
  instance: string
  healthy: boolean
  lastChecked: number
  responseTime: number | null
  consecutiveFailures: number
}

const instanceHealthCache = new Map<string, InstanceHealth>()
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_CONSECUTIVE_FAILURES = 3

export const PRIMARY_HASHTAG = '#HiveAI'

/**
 * Check health of a single Nitter instance
 */
async function checkInstanceHealth(instance: string): Promise<InstanceHealth> {
  const cached = instanceHealthCache.get(instance)
  const now = Date.now()

  // Return cached result if still valid
  if (cached && now - cached.lastChecked < HEALTH_CHECK_INTERVAL) {
    return cached
  }

  const health: InstanceHealth = {
    instance,
    healthy: false,
    lastChecked: now,
    responseTime: null,
    consecutiveFailures: cached?.consecutiveFailures ?? 0,
  }

  try {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`https://${instance}/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    clearTimeout(timeoutId)
    health.responseTime = Date.now() - startTime
    health.healthy = response.ok || response.status === 302 // Some instances redirect
    health.consecutiveFailures = health.healthy ? 0 : health.consecutiveFailures + 1
  } catch (error) {
    health.healthy = false
    health.consecutiveFailures += 1
    console.warn(`Nitter instance ${instance} health check failed:`, error instanceof Error ? error.message : 'Unknown error')
  }

  instanceHealthCache.set(instance, health)
  return health
}

/**
 * Get all healthy Nitter instances, sorted by response time
 */
export async function getHealthyInstances(): Promise<string[]> {
  const healthChecks = await Promise.all(
    NITTER_INSTANCES.map(instance => checkInstanceHealth(instance))
  )

  return healthChecks
    .filter(h => h.healthy && h.consecutiveFailures < MAX_CONSECUTIVE_FAILURES)
    .sort((a, b) => (a.responseTime ?? Infinity) - (b.responseTime ?? Infinity))
    .map(h => h.instance)
}

/**
 * Get health status of all Nitter instances
 */
export async function getNitterHealthStatus(): Promise<{
  instances: InstanceHealth[]
  healthyCount: number
  totalCount: number
  lastChecked: string
}> {
  const healthChecks = await Promise.all(
    NITTER_INSTANCES.map(instance => checkInstanceHealth(instance))
  )

  return {
    instances: healthChecks,
    healthyCount: healthChecks.filter(h => h.healthy).length,
    totalCount: NITTER_INSTANCES.length,
    lastChecked: new Date().toISOString(),
  }
}

/**
 * Force refresh health status for all instances
 */
export async function refreshNitterHealth(): Promise<void> {
  // Clear cache to force fresh checks
  instanceHealthCache.clear()
  await getHealthyInstances()
}

/**
 * Build tracking query URLs for a campaign
 */
export function buildTrackingQuery(projectTag: string): TrackingQuery {
  const cleanTag = projectTag.startsWith('#') ? projectTag : `#${projectTag}`
  const combined = `${PRIMARY_HASHTAG} ${cleanTag}`
  const encodedQuery = encodeURIComponent(combined)

  return {
    primaryTag: PRIMARY_HASHTAG,
    projectTag: cleanTag,
    combined,
    nitterUrl: `https://${NITTER_INSTANCES[0]}/search?f=tweets&q=${encodedQuery}`,
    xSearchUrl: `https://twitter.com/search?q=${encodedQuery}&src=typed_query&f=live`,
  }
}

/**
 * Validate if a post contains both required hashtags
 */
export function isValidPost(text: string, projectTag: string): boolean {
  const lowerText = text.toLowerCase()
  const cleanProjectTag = projectTag.startsWith('#') 
    ? projectTag.toLowerCase() 
    : `#${projectTag.toLowerCase()}`
  
  const hasHiveAI = lowerText.includes('#hiveai')
  const hasProjectTag = lowerText.includes(cleanProjectTag)
  
  return hasHiveAI && hasProjectTag
}

/**
 * Parse tweet HTML from Nitter response
 * Returns structured post data
 */
export function parseNitterTweet(html: string): Partial<TrackedPost> | null {
  try {
    // Extract username
    const usernameMatch = html.match(/class="username"[^>]*>@([^<]+)</i)
    const username = usernameMatch?.[1] || ''

    // Extract display name
    const nameMatch = html.match(/class="fullname"[^>]*>([^<]+)</i)
    const name = nameMatch?.[1] || username

    // Extract tweet ID
    const idMatch = html.match(/\/status\/(\d+)/i)
    const tweetId = idMatch?.[1]

    // Extract tweet text
    const textMatch = html.match(/class="tweet-content[^"]*"[^>]*>([^<]+)</i)
    const text = textMatch?.[1] || ''

    // Extract timestamp
    const timeMatch = html.match(/data-time="(\d+)"/i)
    const timestamp = timeMatch?.[1] ? new Date(parseInt(timeMatch[1]) * 1000).toISOString() : new Date().toISOString()

    // Extract stats
    const likesMatch = html.match(/icon-heart[^>]*><\/span>\s*(\d+)/i)
    const retweetsMatch = html.match(/icon-retweet[^>]*><\/span>\s*(\d+)/i)
    const repliesMatch = html.match(/icon-comment[^>]*><\/span>\s*(\d+)/i)

    // Extract avatar
    const avatarMatch = html.match(/class="avatar"[^>]*src="([^"]+)"/i)
    const avatar = avatarMatch?.[1] || ''

    if (!username || !text || !tweetId) return null

    return {
      id: tweetId,
      authorUsername: username,
      authorName: name,
      authorProfileImage: avatar,
      text: text.trim(),
      createdAt: timestamp,
      metrics: {
        likes: parseInt(likesMatch?.[1] || '0'),
        retweets: parseInt(retweetsMatch?.[1] || '0'),
        replies: parseInt(repliesMatch?.[1] || '0'),
        quotes: 0,
      },
    }
  } catch (error) {
    console.error('Failed to parse Nitter tweet:', error)
    return null
  }
}

/**
 * Fetch posts from Nitter for a campaign
 * Uses health-checked instances for better reliability
 */
export async function fetchCampaignPosts(
  projectTag: string,
  preferredInstances?: string[]
): Promise<{ posts: Partial<TrackedPost>[]; error?: string; instanceUsed?: string }> {
  const query = buildTrackingQuery(projectTag)
  
  // Get healthy instances or use provided list
  const instances = preferredInstances ?? await getHealthyInstances()
  
  if (instances.length === 0) {
    // Fallback to all instances if none are healthy
    instances.push(...NITTER_INSTANCES)
  }

  let lastError: string | undefined

  for (const instance of instances) {
    const url = `https://${instance}/search?f=tweets&q=${encodeURIComponent(query.combined)}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
        next: { revalidate: 60 }, // Cache for 1 minute
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        lastError = `Instance ${instance} returned ${response.status}`
        continue // Try next instance
      }

      const html = await response.text()
      
      // Split by tweet containers and parse each
      const tweetBlocks = html.split(/class="timeline-item"/i).slice(1)
      const posts: Partial<TrackedPost>[] = []

      for (const block of tweetBlocks.slice(0, 50)) { // Limit to 50 posts
        const parsed = parseNitterTweet(block)
        if (parsed && isValidPost(parsed.text || '', projectTag)) {
          posts.push({
            ...parsed,
            hasHiveAITag: true,
            hasProjectTag: true,
            isValid: true,
          })
        }
      }

      return { posts, instanceUsed: instance }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Nitter fetch from ${instance} failed:`, lastError)
      // Continue to next instance
    }
  }

  return { 
    posts: [], 
    error: lastError ?? 'All Nitter instances unavailable' 
  }
}

/**
 * Calculate MSP for a tracked post using the full mindshare engine.
 * 
 * @param post - Tracked post data from Nitter
 * @param options - Optional enrichment data (follower count, campaign start date, etc.)
 * @returns Final MSP value (integer)
 */
export function calculatePostMSP(
  post: Partial<TrackedPost>,
  options: {
    followersCount?: number
    projectTag?: string
    campaignStartDate?: string
  } = {}
): number {
  const metrics = post.metrics || { likes: 0, retweets: 0, replies: 0, quotes: 0 }
  
  const input: TrackedPostInput = {
    likes: metrics.likes ?? 0,
    retweets: metrics.retweets ?? 0,
    replies: metrics.replies ?? 0,
    quotes: metrics.quotes ?? 0,
    followersCount: options.followersCount,
    projectTag: options.projectTag,
    postText: post.text || '',
    postedAt: post.createdAt,
    campaignStartDate: options.campaignStartDate,
  }
  
  return calculatePostMspFull(input)
}

/**
 * Get tracking status for a campaign
 */
export interface VelocitySnapshot {
  timestamp: string
  validPosts: number
  totalMSP: number
}

export interface TrackingStatus {
  isActive: boolean
  lastChecked: string
  postsFound: number
  validPosts: number
  totalMSP: number
  velocityPerHour: number
  velocityPerDay: number
  snapshots: VelocitySnapshot[]
  topPosts: Partial<TrackedPost>[]
  query: TrackingQuery
}

/**
 * Helper to bucket posts by hour/day and compute velocity
 */
function computeVelocity(posts: Partial<TrackedPost>[]) {
  const byHour = new Map<string, { posts: number; msp: number }>()
  const byDay = new Map<string, { posts: number; msp: number }>()

  for (const post of posts) {
    if (!post.createdAt) continue
    const createdAt = new Date(post.createdAt)
    const hourKey = createdAt.toISOString().slice(0, 13) // YYYY-MM-DDTHH
    const dayKey = createdAt.toISOString().slice(0, 10) // YYYY-MM-DD
    const msp = calculatePostMSP(post)

    const hourBucket = byHour.get(hourKey) || { posts: 0, msp: 0 }
    hourBucket.posts += 1
    hourBucket.msp += msp
    byHour.set(hourKey, hourBucket)

    const dayBucket = byDay.get(dayKey) || { posts: 0, msp: 0 }
    dayBucket.posts += 1
    dayBucket.msp += msp
    byDay.set(dayKey, dayBucket)
  }

  const latestHour = Array.from(byHour.keys()).sort().pop()
  const latestDay = Array.from(byDay.keys()).sort().pop()
  const hourVelocity = latestHour ? byHour.get(latestHour)?.posts || 0 : 0
  const dayVelocity = latestDay ? byDay.get(latestDay)?.posts || 0 : 0

  const snapshots: VelocitySnapshot[] = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([day, data]) => ({
      timestamp: `${day}T00:00:00Z`,
      validPosts: data.posts,
      totalMSP: data.msp,
    }))

  return {
    velocityPerHour: hourVelocity,
    velocityPerDay: dayVelocity,
    snapshots,
  }
}

export async function getCampaignTrackingStatus(projectTag: string): Promise<TrackingStatus> {
  const query = buildTrackingQuery(projectTag)
  const { posts, error } = await fetchCampaignPosts(projectTag)

  const validPosts = posts.filter(p => p.isValid)
  const totalMSP = validPosts.reduce((sum, p) => sum + calculatePostMSP(p), 0)

  const { velocityPerHour, velocityPerDay, snapshots } = computeVelocity(validPosts)

  // Sort by engagement and get top 10
  const topPosts = [...validPosts]
    .sort((a, b) => {
      const aScore = (a.metrics?.likes || 0) + (a.metrics?.retweets || 0) * 3
      const bScore = (b.metrics?.likes || 0) + (b.metrics?.retweets || 0) * 3
      return bScore - aScore
    })
    .slice(0, 10)

  return {
    isActive: !error,
    lastChecked: new Date().toISOString(),
    postsFound: posts.length,
    validPosts: validPosts.length,
    totalMSP,
    velocityPerHour,
    velocityPerDay,
    snapshots,
    topPosts,
    query,
  }
}
