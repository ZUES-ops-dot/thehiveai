/**
 * Mission Definitions
 * 
 * Missions that can be tracked based on existing data:
 * - invite_redemptions: invites sent/completed
 * - post_events: posts made with MSP
 * - participants: user stats (MSP, post_count)
 * - connected_accounts: connected X accounts
 * - workspace_bookmarks: bookmarked items
 */

import type { MissionType, MissionCategory } from '@/lib/types/missions'

export interface MissionDefinition {
  id: string
  title: string
  description: string
  type: MissionType
  category: MissionCategory
  target: number
  mspReward: number // MSP instead of XP
  creditsReward?: number
  badgeReward?: string
  cosmeticReward?: string
  // How to track this mission
  trackingType: 
    | 'invites_today'
    | 'invites_week'
    | 'invites_month'
    | 'invites_total'
    | 'posts_today'
    | 'posts_week'
    | 'posts_month'
    | 'posts_total'
    | 'msp_today'
    | 'msp_week'
    | 'msp_month'
    | 'msp_total'
    | 'campaigns_joined'
    | 'campaigns_posted_today' // unique campaigns posted to today
    | 'projects_interacted_today' // unique Project Lens platforms interacted with today (30+ sec)
    | 'connected_accounts'
    | 'daily_login'
    | 'bookmarks_added'
    | 'engagement_today' // likes + retweets + replies
    | 'engagement_week'
    | 'engagement_month'
    | 'streak_days'
}

// ⭐ DAILY MISSIONS
export const DAILY_MISSIONS: MissionDefinition[] = [
  {
    id: 'daily_invite_2',
    title: 'Invite 2 Users',
    description: 'Invite 2 new users to join HiveAI today',
    type: 'daily',
    category: 'amplification',
    target: 2,
    mspReward: 50,
    trackingType: 'invites_today',
  },
  {
    id: 'daily_post_1',
    title: 'Make a Post',
    description: 'Create 1 tracked post with #HiveAI today',
    type: 'daily',
    category: 'engagement',
    target: 1,
    mspReward: 30,
    trackingType: 'posts_today',
  },
  {
    id: 'daily_earn_msp',
    title: 'Earn 10 MSP',
    description: 'Earn at least 10 MSP from your posts today',
    type: 'daily',
    category: 'engagement',
    target: 10,
    mspReward: 25,
    trackingType: 'msp_today',
  },
  {
    id: 'daily_login',
    title: 'Daily Check-in',
    description: 'Log in to HiveAI today',
    type: 'daily',
    category: 'streak',
    target: 1,
    mspReward: 10,
    trackingType: 'daily_login',
  },
  {
    id: 'daily_engagement',
    title: 'Get Engagement',
    description: 'Receive 40 total engagements (likes, retweets, replies) today',
    type: 'daily',
    category: 'engagement',
    target: 40,
    mspReward: 20,
    trackingType: 'engagement_today',
  },
  {
    id: 'daily_multi_project',
    title: 'Project Explorer',
    description: 'Visit 3 different projects in Project Lens',
    type: 'daily',
    category: 'discovery',
    target: 3,
    mspReward: 75,
    trackingType: 'projects_interacted_today',
  },
]

// 🟦 WEEKLY MISSIONS
export const WEEKLY_MISSIONS: MissionDefinition[] = [
  {
    id: 'weekly_invite_10',
    title: 'Invite 10 Users',
    description: 'Invite 10 new users to join HiveAI this week',
    type: 'weekly',
    category: 'amplification',
    target: 10,
    mspReward: 200,
    trackingType: 'invites_week',
  },
  {
    id: 'weekly_posts_5',
    title: 'Create 5 Posts',
    description: 'Make 5 tracked posts with #HiveAI this week',
    type: 'weekly',
    category: 'engagement',
    target: 5,
    mspReward: 150,
    trackingType: 'posts_week',
  },
  {
    id: 'weekly_earn_100_msp',
    title: 'Earn 100 MSP',
    description: 'Earn 100 MSP from your posts this week',
    type: 'weekly',
    category: 'engagement',
    target: 100,
    mspReward: 250,
    trackingType: 'msp_week',
  },
  {
    id: 'weekly_engagement_50',
    title: 'Get 50 Engagements',
    description: 'Receive 50 total engagements this week',
    type: 'weekly',
    category: 'engagement',
    target: 50,
    mspReward: 200,
    trackingType: 'engagement_week',
  },
  {
    id: 'weekly_connect_account',
    title: 'Connect an Account',
    description: 'Connect a new X account to your profile',
    type: 'weekly',
    category: 'discovery',
    target: 1,
    mspReward: 100,
    trackingType: 'connected_accounts',
  },
  {
    id: 'weekly_join_campaign',
    title: 'Join a Campaign',
    description: 'Join a new campaign this week',
    type: 'weekly',
    category: 'discovery',
    target: 1,
    mspReward: 80,
    trackingType: 'campaigns_joined',
  },
]

// 🟪 MONTHLY MISSIONS
export const MONTHLY_MISSIONS: MissionDefinition[] = [
  {
    id: 'monthly_invite_50',
    title: 'Invite 50 Users',
    description: 'Invite 50 new users to join HiveAI this month',
    type: 'monthly',
    category: 'amplification',
    target: 50,
    mspReward: 800,
    badgeReward: 'Hive Recruiter',
    trackingType: 'invites_month',
  },
  {
    id: 'monthly_posts_20',
    title: 'Create 20 Posts',
    description: 'Make 20 tracked posts with #HiveAI this month',
    type: 'monthly',
    category: 'engagement',
    target: 20,
    mspReward: 500,
    trackingType: 'posts_month',
  },
  {
    id: 'monthly_earn_1000_msp',
    title: 'Earn 1,000 MSP',
    description: 'Earn 1,000 MSP from your posts this month',
    type: 'monthly',
    category: 'engagement',
    target: 1000,
    mspReward: 1000,
    badgeReward: 'MSP Master',
    trackingType: 'msp_month',
  },
  {
    id: 'monthly_engagement_500',
    title: 'Get 500 Engagements',
    description: 'Receive 500 total engagements this month',
    type: 'monthly',
    category: 'engagement',
    target: 500,
    mspReward: 700,
    trackingType: 'engagement_month',
  },
  {
    id: 'monthly_streak_7',
    title: '7-Day Streak',
    description: 'Log in for 7 consecutive days this month',
    type: 'monthly',
    category: 'streak',
    target: 7,
    mspReward: 600,
    badgeReward: 'Streak Master',
    trackingType: 'streak_days',
  },
]

// 🟧 SPECIAL MISSIONS (always available, one-time completion)
export const SPECIAL_MISSIONS: MissionDefinition[] = [
  {
    id: 'special_first_post',
    title: 'First Post',
    description: 'Make your first tracked post with #HiveAI',
    type: 'special',
    category: 'discovery',
    target: 1,
    mspReward: 100,
    badgeReward: 'First Steps',
    trackingType: 'posts_total',
  },
  {
    id: 'special_first_invite',
    title: 'First Invite',
    description: 'Successfully invite your first user',
    type: 'special',
    category: 'amplification',
    target: 1,
    mspReward: 100,
    badgeReward: 'Recruiter',
    trackingType: 'invites_total',
  },
  {
    id: 'special_reach_100_msp',
    title: 'Century Club',
    description: 'Reach 100 total MSP',
    type: 'special',
    category: 'tier',
    target: 100,
    mspReward: 200,
    badgeReward: 'Century Club',
    trackingType: 'msp_total',
  },
  {
    id: 'special_reach_1000_msp',
    title: 'Thousand Strong',
    description: 'Reach 1,000 total MSP',
    type: 'special',
    category: 'tier',
    target: 1000,
    mspReward: 500,
    badgeReward: 'Thousand Strong',
    trackingType: 'msp_total',
  },
  {
    id: 'special_reach_10000_msp',
    title: 'MSP Legend',
    description: 'Reach 10,000 total MSP',
    type: 'special',
    category: 'tier',
    target: 10000,
    mspReward: 2000,
    badgeReward: 'MSP Legend',
    cosmeticReward: 'Golden Profile Frame',
    trackingType: 'msp_total',
  },
]

// All missions combined
export const ALL_MISSIONS: MissionDefinition[] = [
  ...DAILY_MISSIONS,
  ...WEEKLY_MISSIONS,
  ...MONTHLY_MISSIONS,
  ...SPECIAL_MISSIONS,
]

// Get mission by ID
export function getMissionById(id: string): MissionDefinition | undefined {
  return ALL_MISSIONS.find(m => m.id === id)
}

// Get missions by type
export function getMissionsByType(type: MissionType): MissionDefinition[] {
  return ALL_MISSIONS.filter(m => m.type === type)
}

// Calculate reset times
export function getDailyResetTime(): Date {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ))
}

export function getWeeklyResetTime(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilMonday,
    0, 0, 0, 0
  ))
}

export function getMonthlyResetTime(): Date {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1,
    0, 0, 0, 0
  ))
}

export function getResetTimeForType(type: MissionType): Date | null {
  switch (type) {
    case 'daily':
      return getDailyResetTime()
    case 'weekly':
      return getWeeklyResetTime()
    case 'monthly':
      return getMonthlyResetTime()
    case 'special':
      return null // Special missions don't reset
  }
}
