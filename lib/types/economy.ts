// Narrative Economy v3 Types

export type GlowTier = 'prime' | 'lumina' | 'echelon' | 'apex' | 'overmind'

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'alltime'

export type EngagementType = 'post' | 'thread' | 'video' | 'meme' | 'discussion'

// Creator Profile
export interface CreatorProfile {
  id: string
  handle: string
  name: string
  avatar?: string
  glowTier: GlowTier
  mspLifetime: number
  mspWeekly: number
  mspMonthly: number
  mspYearly: number
  narrativesAmplified: number
  avgTierPerWeek: number
  bestRankAchieved: number
  currentStreak: number
  conversionScore: number
  creditsEarned: number
  weeklyRank?: number
  monthlyRank?: number
  yearlyRank?: number
  allTimeRank?: number
}

// Narrative Pool
export interface NarrativePool {
  id: string
  title: string
  description: string
  fundingTotal: number
  sponsors: NarrativeSponsor[]
  distributionDate: string // ISO date
  momentumScore: number
  sentimentScore: number
  leaderboard: LeaderboardEntry[]
  tags: string[]
  campaignId?: string
}

export interface NarrativeSponsor {
  projectId: string
  name: string
  amount: number
  logo?: string
}

// Mindshare Event
export interface MindshareEvent {
  id: string
  creatorId: string
  narrativeId: string
  mspEarned: number
  engagementType: EngagementType
  uniqueReach: number
  viralityScore: number
  timestamp: string // ISO date
  content?: string
}

// Leaderboard Entry
export interface LeaderboardEntry {
  creatorId: string
  handle: string
  avatar?: string
  glowTier: GlowTier
  rank: number
  msp: number
  creditsEarned: number
  period: LeaderboardPeriod
  change?: number // rank change from previous period
}

// Tier Configuration
export const TIER_CONFIG: Record<GlowTier, {
  name: string
  description: string
  colors: { primary: string; secondary: string }
  mspMultiplier: number
  minRank?: number
}> = {
  prime: {
    name: 'Prime',
    description: 'New creators',
    colors: { primary: '#06B6D4', secondary: '#F59E0B' },
    mspMultiplier: 1.0,
  },
  lumina: {
    name: 'Lumina',
    description: 'Verified contributors',
    colors: { primary: '#EAB308', secondary: '#FFFFFF' },
    mspMultiplier: 1.25,
  },
  echelon: {
    name: 'Echelon',
    description: 'Rising influencers',
    colors: { primary: '#8B5CF6', secondary: '#3B82F6' },
    mspMultiplier: 1.5,
  },
  apex: {
    name: 'Apex',
    description: 'Top 100 creators',
    colors: { primary: '#EC4899', secondary: '#22D3EE' },
    mspMultiplier: 2.0,
    minRank: 100,
  },
  overmind: {
    name: 'Overmind',
    description: 'Legendary',
    colors: { primary: '#F472B6', secondary: '#A78BFA' },
    mspMultiplier: 3.0,
    minRank: 10,
  },
}

// Reward Distribution Curve
export const REWARD_CURVE = {
  1: 0.10, // 10%
  2: 0.05, // 5%
  3: 0.03, // 3%
}

// Leaderboard Period Weights
export const PERIOD_WEIGHTS: Record<LeaderboardPeriod, number> = {
  weekly: 0.45,
  monthly: 0.30,
  yearly: 0.20,
  alltime: 0.05,
}
