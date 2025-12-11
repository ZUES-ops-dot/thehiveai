/**
 * X Tweet Stats Scraper
 * 
 * Scrapes engagement metrics from individual tweet pages.
 */

import type { Page } from 'puppeteer'
import type { ScrapedTweet } from './types'
import { randomDelay, waitForNetworkIdle, checkForRateLimit } from './browser'

/**
 * Parse number from X's formatted strings (e.g., "1.2K", "5M")
 */
function parseEngagementNumber(text: string | null | undefined): number {
  if (!text) return 0
  
  const clean = text.trim().replace(/,/g, '')
  
  if (clean.endsWith('K') || clean.endsWith('k')) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000)
  }
  if (clean.endsWith('M') || clean.endsWith('m')) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000000)
  }
  if (clean.endsWith('B') || clean.endsWith('b')) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000000000)
  }
  
  const num = parseInt(clean, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Extract hashtags from tweet text
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g)
  return matches ? matches.map(tag => tag.toLowerCase()) : []
}

/**
 * Scrape all stats from a single tweet page
 */
export async function scrapeTweetStats(
  page: Page,
  tweetUrl: string
): Promise<ScrapedTweet | null> {
  console.log(`[Stats] Scraping: ${tweetUrl}`)
  
  try {
    // Navigate to tweet
    await page.goto(tweetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    
    // Wait for content
    await waitForNetworkIdle(page, 5000)
    await randomDelay(1500, 2500)
    
    // Check for rate limiting
    if (await checkForRateLimit(page)) {
      console.warn('[Stats] Rate limited')
      return null
    }
    
    // Extract all data from the page
    const tweetData = await page.evaluate(() => {
      // Helper to get text content safely
      const getText = (selector: string): string => {
        const el = document.querySelector(selector)
        return el?.textContent?.trim() || ''
      }
      
      // Helper to get number from engagement button
      const getEngagement = (testId: string): string => {
        // Try multiple selector patterns
        const selectors = [
          `button[data-testid="${testId}"] span span`,
          `button[data-testid="${testId}"] span`,
          `div[data-testid="${testId}"] span span`,
          `div[data-testid="${testId}"] span`,
          `[data-testid="${testId}"] span`,
        ]
        
        for (const selector of selectors) {
          const el = document.querySelector(selector)
          if (el?.textContent?.trim()) {
            return el.textContent.trim()
          }
        }
        return '0'
      }
      
      // Get tweet text
      const tweetTextEl = document.querySelector('div[data-testid="tweetText"]')
      const text = tweetTextEl?.textContent || ''
      
      // Get author info
      const userNameEl = document.querySelector('div[data-testid="User-Name"]')
      let author = ''
      let authorName = ''
      
      if (userNameEl) {
        // Username is in the link with @
        const usernameLink = userNameEl.querySelector('a[href^="/"]')
        if (usernameLink) {
          const href = usernameLink.getAttribute('href')
          author = href ? href.replace('/', '') : ''
        }
        
        // Display name is the first span
        const nameSpan = userNameEl.querySelector('span')
        authorName = nameSpan?.textContent || author
      }
      
      // Get profile image
      const avatarImg = document.querySelector('img[src*="profile_images"]')
      const authorProfileImage = avatarImg?.getAttribute('src') || ''
      
      // Get timestamp
      const timeEl = document.querySelector('time[datetime]')
      const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString()
      
      // Get views (analytics link or view count)
      let views = '0'
      const analyticsLink = document.querySelector('a[href*="/analytics"]')
      if (analyticsLink) {
        views = analyticsLink.textContent?.trim() || '0'
      } else {
        // Try alternative view count selector
        const viewEl = document.querySelector('[data-testid="app-text-transition-container"]')
        if (viewEl) {
          views = viewEl.textContent?.trim() || '0'
        }
      }
      
      // Get engagement metrics
      const likes = getEngagement('like')
      const retweets = getEngagement('retweet')
      const replies = getEngagement('reply')
      const bookmarks = getEngagement('bookmark')
      
      // Quotes are trickier - they're in the retweet menu
      // For now, we'll estimate or set to 0
      const quotes = '0'
      
      return {
        text,
        author,
        authorName,
        authorProfileImage,
        timestamp,
        views,
        likes,
        retweets,
        replies,
        quotes,
        bookmarks,
      }
    })
    
    // Extract tweet ID from URL
    const idMatch = tweetUrl.match(/\/status\/(\d+)/)
    const id = idMatch ? idMatch[1] : ''
    
    if (!id) {
      console.warn('[Stats] Could not extract tweet ID')
      return null
    }
    
    // Parse numbers
    const tweet: ScrapedTweet = {
      id,
      url: tweetUrl,
      author: tweetData.author,
      authorName: tweetData.authorName,
      authorProfileImage: tweetData.authorProfileImage,
      text: tweetData.text,
      timestamp: tweetData.timestamp,
      views: parseEngagementNumber(tweetData.views),
      likes: parseEngagementNumber(tweetData.likes),
      replies: parseEngagementNumber(tweetData.replies),
      retweets: parseEngagementNumber(tweetData.retweets),
      quotes: parseEngagementNumber(tweetData.quotes),
      bookmarks: parseEngagementNumber(tweetData.bookmarks),
      hashtags: extractHashtags(tweetData.text),
    }
    
    console.log(`[Stats] Scraped: @${tweet.author} - ${tweet.likes} likes, ${tweet.retweets} RTs, ${tweet.views} views`)
    
    return tweet
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Stats] Error scraping ${tweetUrl}:`, errorMessage)
    return null
  }
}

/**
 * Validate that a tweet has the required hashtags
 */
export function validateTweetHashtags(
  tweet: ScrapedTweet,
  requiredHashtags: string[]
): boolean {
  const tweetTags = tweet.hashtags.map(t => t.toLowerCase())
  
  return requiredHashtags.every(required => {
    const clean = required.toLowerCase().replace('#', '')
    return tweetTags.some(tag => tag.replace('#', '') === clean)
  })
}
