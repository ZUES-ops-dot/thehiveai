// X (Twitter) Authentication Types

export interface XUser {
  id: string
  username: string
  name: string
  profileImageUrl: string
  description?: string
  followersCount: number
  followingCount: number
  tweetCount: number
  verified: boolean
  createdAt: string
}

export interface AuthSession {
  user: XUser | null
  isAuthenticated: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

// Connected X account for multi-account tracking
export interface ConnectedXAccount {
  id: string
  xUserId: string
  handle: string
  displayName: string
  profileImageUrl: string | null
  followersCount: number
  connectedAt: string
  active: boolean
}

export interface CampaignParticipant {
  id: string
  xUser: XUser
  campaignId: string
  joinedAt: string
  mspEarned: number
  postsCount: number
  validPostsCount: number
  rank: number
  lastPostAt?: string
}

export interface Campaign {
  id: string
  name: string
  projectTag: string // e.g., "SolXToken" (without #)
  description: string
  imageUrl?: string
  createdAt: string
  endsAt?: string
  isActive: boolean
  totalParticipants: number
  totalPosts: number
  totalMSP: number
  rewardPool: number
  participants: CampaignParticipant[]
}

export interface TrackedPost {
  id: string
  authorId: string
  authorUsername: string
  authorName: string
  authorProfileImage: string
  text: string
  createdAt: string
  campaignId: string
  hasHiveAITag: boolean
  hasProjectTag: boolean
  isValid: boolean
  metrics: {
    likes: number
    retweets: number
    replies: number
    quotes: number
    impressions?: number
  }
  mspAwarded: number
}

// Tracking query format
export interface TrackingQuery {
  primaryTag: '#HiveAI'
  projectTag: string // e.g., "#SolXToken"
  combined: string // "#HiveAI #SolXToken"
  nitterUrl: string
  xSearchUrl: string
}
