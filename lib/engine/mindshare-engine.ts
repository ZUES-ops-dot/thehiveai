/**
 * HIVE AI — Mindshare Engine v1.0
 * 
 * Core calculation engine for Mindshare Points (MSP).
 * This is the backend specification for the Narrative Economy v3.
 * 
 * MSP = (reach × engagement × relevance × credibility × velocity) × tierMultiplier × bonuses
 */

import { type GlowTier, TIER_CONFIG, REWARD_CURVE } from '@/lib/types/economy'

// ============================================================================
// TYPES
// ============================================================================

export interface MindshareInput {
  // Reach metrics
  uniqueUsersReached: number
  totalImpressions: number
  newFollowersGained: number
  
  // Engagement metrics
  likes: number
  retweets: number
  quotes: number
  replies: number
  bookmarks: number
  
  // Content metrics
  contentType: 'post' | 'thread' | 'video' | 'meme' | 'analysis'
  narrativeKeywords: string[]
  contentKeywords: string[]
  
  // Creator metrics
  creatorTier: GlowTier
  creatorCredibilityScore: number // 0-1
  isEarlyAmplifier: boolean // within first 24h of narrative
  
  // Time metrics
  contentAgeHours: number
  engagementVelocity: number // engagements per hour
}

export interface MindshareOutput {
  baseMsp: number
  reachScore: number
  engagementScore: number
  relevanceScore: number
  credibilityScore: number
  velocityScore: number
  tierMultiplier: number
  earlyBonus: number
  contentBonus: number
  finalMsp: number
  breakdown: MspBreakdown
}

export interface MspBreakdown {
  reach: { raw: number; weighted: number }
  engagement: { raw: number; weighted: number }
  relevance: { raw: number; weighted: number }
  credibility: { raw: number; weighted: number }
  velocity: { raw: number; weighted: number }
  bonuses: { tier: number; early: number; content: number }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MSP_WEIGHTS = {
  reach: 0.25,
  engagement: 0.25,
  relevance: 0.20,
  credibility: 0.15,
  velocity: 0.15,
} as const

export const TIER_MULTIPLIERS: Record<GlowTier, number> = {
  prime: 1.0,
  lumina: 1.25,
  echelon: 1.5,
  apex: 2.0,
  overmind: 3.0,
}

export const CONTENT_TYPE_BONUSES: Record<string, number> = {
  post: 1.0,
  thread: 1.5,
  video: 2.0,
  meme: 1.2,
  analysis: 1.8,
}

export const EARLY_AMPLIFICATION_BONUS = 1.5 // +50% for first 24h

export const POST_MSP_MULTIPLIER = 5 // Global multiplier for post MSP

export const DECAY_RATE = 0.10 // 10% per day after 7 days
export const DECAY_START_DAYS = 7

// Anti-spam thresholds
export const ANTI_SPAM = {
  minUniqueEngagers: 5,
  maxEngagementRatio: 0.5, // engagement/impressions should be < 50%
  minContentAge: 60, // seconds - prevent instant engagement farming
  duplicateContentPenalty: 0.0, // 100% penalty for duplicate content
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate reach score (0-100)
 * Weighted combination of unique users, impressions, and new followers
 */
export function calculateReachScore(input: MindshareInput): number {
  const { uniqueUsersReached, totalImpressions, newFollowersGained } = input
  
  // Normalize each metric (logarithmic scale to handle large numbers)
  // Cap raised to 1000 for higher post MSP potential
  const userScore = Math.min(1000, Math.log10(uniqueUsersReached + 1) * 250)
  const impressionScore = Math.min(1000, Math.log10(totalImpressions + 1) * 200)
  const followerScore = Math.min(1000, newFollowersGained * 50)
  
  // Weighted average
  return (userScore * 0.5) + (impressionScore * 0.3) + (followerScore * 0.2)
}

/**
 * Calculate engagement score (0-100)
 * Weighted combination of different engagement types
 */
export function calculateEngagementScore(input: MindshareInput): number {
  const { likes, retweets, quotes, replies, bookmarks, totalImpressions } = input
  
  // Weight different engagement types
  const engagementWeights = {
    likes: 1,
    retweets: 3,
    quotes: 5, // Quotes are highest value - original thought
    replies: 2,
    bookmarks: 2,
  }
  
  const weightedEngagement = 
    (likes * engagementWeights.likes) +
    (retweets * engagementWeights.retweets) +
    (quotes * engagementWeights.quotes) +
    (replies * engagementWeights.replies) +
    (bookmarks * engagementWeights.bookmarks)
  
  // Anti-spam check: engagement ratio
  const engagementRatio = totalImpressions > 0 
    ? (likes + retweets + quotes + replies) / totalImpressions 
    : 0
  
  if (engagementRatio > ANTI_SPAM.maxEngagementRatio) {
    return 0 // Suspicious engagement pattern
  }
  
  // Logarithmic scale - cap raised to 1000
  return Math.min(1000, Math.log10(weightedEngagement + 1) * 300)
}

/**
 * Calculate relevance score (0-100)
 * How well content matches the narrative keywords
 */
export function calculateRelevanceScore(input: MindshareInput): number {
  const { narrativeKeywords, contentKeywords } = input
  
  if (narrativeKeywords.length === 0 || contentKeywords.length === 0) {
    return 50 // Default score if no keywords
  }
  
  // Calculate keyword overlap
  const narrativeSet = new Set(narrativeKeywords.map(k => k.toLowerCase()))
  const matchingKeywords = contentKeywords.filter(k => 
    narrativeSet.has(k.toLowerCase())
  )
  
  const overlapRatio = matchingKeywords.length / narrativeKeywords.length
  
  // Score: 0-1000 based on overlap
  return Math.min(1000, overlapRatio * 1000 * 1.2) // Allow up to 20% bonus for extra keywords
}

/**
 * Calculate credibility score (0-100)
 * Based on creator's historical performance and tier
 */
export function calculateCredibilityScore(input: MindshareInput): number {
  const { creatorCredibilityScore, creatorTier } = input
  
  // Base credibility (0-1 input -> 0-700 output)
  const baseCredibility = creatorCredibilityScore * 700
  
  // Tier bonus (0-300)
  const tierBonus = TIER_MULTIPLIERS[creatorTier] * 100
  
  return Math.min(1000, baseCredibility + tierBonus)
}

/**
 * Calculate velocity score (0-100)
 * How fast the content is gaining engagement
 */
export function calculateVelocityScore(input: MindshareInput): number {
  const { engagementVelocity, contentAgeHours } = input
  
  // Velocity is engagements per hour
  // Higher velocity = higher score
  // But account for content age (newer content naturally has higher velocity)
  
  const ageAdjustment = Math.max(0.5, 1 - (contentAgeHours / 168)) // 168 hours = 1 week
  const adjustedVelocity = engagementVelocity * ageAdjustment
  
  return Math.min(1000, Math.log10(adjustedVelocity + 1) * 400)
}

/**
 * Apply decay to MSP based on content age
 */
export function applyDecay(msp: number, contentAgeDays: number): number {
  if (contentAgeDays <= DECAY_START_DAYS) {
    return msp
  }
  
  const daysAfterDecayStart = contentAgeDays - DECAY_START_DAYS
  const decayFactor = Math.pow(1 - DECAY_RATE, daysAfterDecayStart)
  
  return msp * decayFactor
}

/**
 * Main MSP calculation function
 */
export function calculateMsp(input: MindshareInput): MindshareOutput {
  // Anti-spam checks
  const totalEngagement = input.likes + input.retweets + input.quotes + input.replies
  if (totalEngagement > 0 && input.uniqueUsersReached < ANTI_SPAM.minUniqueEngagers) {
    return createZeroOutput('Insufficient unique engagers')
  }
  
  // Calculate individual scores
  const reachScore = calculateReachScore(input)
  const engagementScore = calculateEngagementScore(input)
  const relevanceScore = calculateRelevanceScore(input)
  const credibilityScore = calculateCredibilityScore(input)
  const velocityScore = calculateVelocityScore(input)
  
  // Apply weights
  const weightedReach = reachScore * MSP_WEIGHTS.reach
  const weightedEngagement = engagementScore * MSP_WEIGHTS.engagement
  const weightedRelevance = relevanceScore * MSP_WEIGHTS.relevance
  const weightedCredibility = credibilityScore * MSP_WEIGHTS.credibility
  const weightedVelocity = velocityScore * MSP_WEIGHTS.velocity
  
  // Base MSP (0-100)
  const baseMsp = weightedReach + weightedEngagement + weightedRelevance + 
                  weightedCredibility + weightedVelocity
  
  // Apply multipliers
  const tierMultiplier = TIER_MULTIPLIERS[input.creatorTier]
  const contentBonus = CONTENT_TYPE_BONUSES[input.contentType] || 1.0
  const earlyBonus = input.isEarlyAmplifier ? EARLY_AMPLIFICATION_BONUS : 1.0
  
  // Final MSP
  const finalMsp = Math.round(baseMsp * tierMultiplier * contentBonus * earlyBonus)
  
  return {
    baseMsp,
    reachScore,
    engagementScore,
    relevanceScore,
    credibilityScore,
    velocityScore,
    tierMultiplier,
    earlyBonus,
    contentBonus,
    finalMsp,
    breakdown: {
      reach: { raw: reachScore, weighted: weightedReach },
      engagement: { raw: engagementScore, weighted: weightedEngagement },
      relevance: { raw: relevanceScore, weighted: weightedRelevance },
      credibility: { raw: credibilityScore, weighted: weightedCredibility },
      velocity: { raw: velocityScore, weighted: weightedVelocity },
      bonuses: { tier: tierMultiplier, early: earlyBonus, content: contentBonus },
    },
  }
}

function createZeroOutput(reason: string): MindshareOutput {
  return {
    baseMsp: 0,
    reachScore: 0,
    engagementScore: 0,
    relevanceScore: 0,
    credibilityScore: 0,
    velocityScore: 0,
    tierMultiplier: 1,
    earlyBonus: 1,
    contentBonus: 1,
    finalMsp: 0,
    breakdown: {
      reach: { raw: 0, weighted: 0 },
      engagement: { raw: 0, weighted: 0 },
      relevance: { raw: 0, weighted: 0 },
      credibility: { raw: 0, weighted: 0 },
      velocity: { raw: 0, weighted: 0 },
      bonuses: { tier: 1, early: 1, content: 1 },
    },
  }
}

// ============================================================================
// REWARD DISTRIBUTION
// ============================================================================

// Re-export REWARD_CURVE from economy.ts as the canonical source
export { REWARD_CURVE }

export interface RewardCalculation {
  rank: number
  msp: number
  poolShare: number
  credits: number
}

/**
 * Calculate reward distribution for a narrative pool.
 * Uses REWARD_CURVE from lib/types/economy.ts (top 3 only: 10%, 5%, 3%)
 */
export function calculateRewardDistribution(
  leaderboard: { creatorId: string; msp: number }[],
  totalPool: number
): RewardCalculation[] {
  const sorted = [...leaderboard].sort((a, b) => b.msp - a.msp)
  
  return sorted.map((entry, index) => {
    const rank = index + 1
    // Only top 3 get rewards per REWARD_CURVE
    const poolShare = (REWARD_CURVE as Record<number, number>)[rank] ?? 0
    
    return {
      rank,
      msp: entry.msp,
      poolShare,
      credits: Math.round(totalPool * poolShare),
    }
  })
}

// ============================================================================
// LEADERBOARD PERIOD WEIGHTS
// ============================================================================

export const PERIOD_WEIGHTS = {
  weekly: 0.45,
  monthly: 0.30,
  yearly: 0.20,
  alltime: 0.05,
} as const

/**
 * Calculate combined MSP across all periods
 */
export function calculateCombinedMsp(periodMsp: {
  weekly: number
  monthly: number
  yearly: number
  alltime: number
}): number {
  return (
    periodMsp.weekly * PERIOD_WEIGHTS.weekly +
    periodMsp.monthly * PERIOD_WEIGHTS.monthly +
    periodMsp.yearly * PERIOD_WEIGHTS.yearly +
    periodMsp.alltime * PERIOD_WEIGHTS.alltime
  )
}

// ============================================================================
// SIMPLIFIED POST MSP CALCULATION (for tracker integration)
// ============================================================================

/**
 * Simplified input for calculating MSP from a tracked post.
 * Uses sensible defaults for fields we can't get from Nitter.
 */
export interface TrackedPostInput {
  // Engagement (required)
  likes: number
  retweets: number
  replies: number
  quotes: number
  
  // Optional enrichment
  followersCount?: number        // creator's follower count for reach estimation
  creatorTier?: GlowTier         // defaults to 'prime'
  credibilityScore?: number      // 0-1, defaults to 0.5
  contentType?: 'post' | 'thread' | 'video' | 'meme' | 'analysis'
  projectTag?: string            // for relevance matching
  postText?: string              // for keyword extraction
  postedAt?: string              // ISO date for velocity/early bonus
  campaignStartDate?: string     // ISO date to determine early amplifier status
}

/**
 * Detect content type from post text heuristics
 */
function detectContentType(text: string): 'post' | 'thread' | 'video' | 'meme' | 'analysis' {
  const lower = text.toLowerCase()
  
  // Thread detection (numbered items or "thread" keyword)
  if (/\b(thread|🧵)\b/i.test(text) || /^\d+[.\/)]/.test(text)) {
    return 'thread'
  }
  
  // Video detection
  if (/\b(video|watch|youtube|youtu\.be)\b/i.test(lower)) {
    return 'video'
  }
  
  // Analysis detection
  if (/\b(analysis|breakdown|deep dive|research|data)\b/i.test(lower)) {
    return 'analysis'
  }
  
  // Meme detection (emoji heavy or meme keywords)
  // Use a simpler emoji detection pattern for ES5 compatibility
  const emojiPattern = /[\uD83C-\uDBFF\uDC00-\uDFFF]/g
  const emojiCount = (text.match(emojiPattern) || []).length
  if (emojiCount > 3 || /\b(meme|lmao|lol|based)\b/i.test(lower)) {
    return 'meme'
  }
  
  return 'post'
}

/**
 * Extract keywords from post text for relevance matching
 */
function extractKeywords(text: string): string[] {
  // Extract hashtags and significant words
  const hashtags = (text.match(/#\w+/g) || []).map(h => h.toLowerCase())
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 20)
  
  // Deduplicate using object keys for ES5 compatibility
  const seen: Record<string, boolean> = {}
  const combined = [...hashtags, ...words]
  return combined.filter(k => {
    if (seen[k]) return false
    seen[k] = true
    return true
  })
}

/**
 * Calculate MSP for a tracked post using the full engine.
 * This is the main entry point for the tracking pipeline.
 * 
 * @param input - Tracked post data from Nitter
 * @returns Final MSP value (integer)
 */
export function calculatePostMspFull(input: TrackedPostInput): number {
  const {
    likes,
    retweets,
    replies,
    quotes,
    followersCount = 100,
    creatorTier = 'prime',
    credibilityScore = 0.5,
    contentType,
    projectTag = '',
    postText = '',
    postedAt,
    campaignStartDate,
  } = input
  
  // Estimate reach from followers (rough heuristic: 10-30% see the post)
  const estimatedReach = Math.max(1, Math.round(followersCount * 0.15))
  const totalEngagement = likes + retweets + replies + quotes
  
  // Calculate content age in hours
  let contentAgeHours = 24 // default
  if (postedAt) {
    const postedDate = new Date(postedAt)
    contentAgeHours = Math.max(1, (Date.now() - postedDate.getTime()) / (1000 * 60 * 60))
  }
  
  // Determine if early amplifier (within 24h of campaign start)
  let isEarlyAmplifier = false
  if (postedAt && campaignStartDate) {
    const postedDate = new Date(postedAt)
    const startDate = new Date(campaignStartDate)
    const hoursSinceStart = (postedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    isEarlyAmplifier = hoursSinceStart >= 0 && hoursSinceStart <= 24
  }
  
  // Calculate velocity (engagements per hour)
  const engagementVelocity = contentAgeHours > 0 ? totalEngagement / contentAgeHours : totalEngagement
  
  // Detect content type if not provided
  const detectedContentType = contentType || detectContentType(postText)
  
  // Extract keywords for relevance
  const contentKeywords = extractKeywords(postText)
  const narrativeKeywords = projectTag 
    ? [`#${projectTag.toLowerCase()}`, '#hiveai', projectTag.toLowerCase()]
    : ['#hiveai']
  
  // Build full engine input
  const engineInput: MindshareInput = {
    uniqueUsersReached: estimatedReach,
    totalImpressions: estimatedReach * 2, // rough estimate
    newFollowersGained: 0, // can't determine from Nitter
    likes,
    retweets,
    quotes,
    replies,
    bookmarks: 0, // not available from Nitter
    contentType: detectedContentType,
    narrativeKeywords,
    contentKeywords,
    creatorTier,
    creatorCredibilityScore: credibilityScore,
    isEarlyAmplifier,
    contentAgeHours,
    engagementVelocity,
  }
  
  // Run through full engine
  const result = calculateMsp(engineInput)
  
  // Apply global post multiplier
  return result.finalMsp * POST_MSP_MULTIPLIER
}
