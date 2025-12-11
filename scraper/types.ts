/**
 * Puppeteer X Scraper Types
 */

export interface ScrapedTweet {
  id: string
  url: string
  author: string
  authorName: string
  authorProfileImage?: string
  text: string
  timestamp: string
  views: number
  likes: number
  replies: number
  retweets: number
  quotes: number
  bookmarks: number
  hashtags: string[]
}

export interface ScrapingOptions {
  projectTags: string[]
  maxTweets?: number
  headless?: boolean
  delayMs?: number
}

export interface CampaignScrapingResult {
  campaignId: string
  projectTag: string
  tweetsFound: number
  tweetsRecorded: number
  totalMspAwarded: number
  errors: string[]
  tweets: ScrapedTweet[]
}

export interface ScrapingResult {
  success: boolean
  startedAt: string
  completedAt: string
  results: CampaignScrapingResult[]
  totalTweetsFound: number
  totalTweetsRecorded: number
  totalMspAwarded: number
}

export interface BrowserConfig {
  headless: boolean
  proxy?: {
    host: string
    port: number
    username?: string
    password?: string
  }
  userAgent?: string
  cookiesPath?: string
}
