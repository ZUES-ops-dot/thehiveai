// Creator Missions System Types

export type MissionType = 'daily' | 'weekly' | 'monthly' | 'special'
export type MissionCategory = 'amplification' | 'engagement' | 'streak' | 'tier' | 'discovery'
export type MissionStatus = 'locked' | 'active' | 'completed' | 'claimed'

export interface Mission {
  id: string
  title: string
  description: string
  type: MissionType
  category: MissionCategory
  status: MissionStatus
  progress: number
  target: number
  xpReward: number
  creditsReward?: number
  badgeReward?: string
  cosmeticReward?: string
  expiresAt?: string // ISO date
  completedAt?: string
}

export interface MissionProgress {
  missionId: string
  current: number
  target: number
  percentage: number
}

// Daily missions reset at midnight UTC
// Weekly missions reset Monday 00:00 UTC
// Monthly missions reset 1st of month 00:00 UTC

export const MISSION_XP_REWARDS: Record<MissionType, { min: number; max: number }> = {
  daily: { min: 20, max: 100 },
  weekly: { min: 200, max: 1000 },
  monthly: { min: 1000, max: 5000 },
  special: { min: 500, max: 10000 },
}

export const MISSION_CATEGORY_COLORS: Record<MissionCategory, string> = {
  amplification: '#F59E0B', // amber
  engagement: '#06B6D4',    // cyan
  streak: '#EF4444',        // red
  tier: '#8B5CF6',          // purple
  discovery: '#10B981',     // emerald
}
