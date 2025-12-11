/**
 * X Search Fetcher
 * 
 * Fetches tweet URLs from X hashtag search pages.
 */

import type { Page } from 'puppeteer'
import { randomDelay, scrollPage, waitForNetworkIdle, checkForRateLimit } from './browser'

/**
 * Build X search URL for hashtags
 * Combines hashtags with AND logic (posts must have ALL hashtags)
 */
export function buildSearchUrl(hashtags: string[]): string {
  // Clean hashtags and join with space (X treats as AND)
  const cleanTags = hashtags.map(tag => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`
    return encodeURIComponent(clean)
  })
  
  const query = cleanTags.join('%20') // Space-separated = AND
  return `https://x.com/search?q=${query}&src=typed_query&f=live`
}

/**
 * Extract tweet URLs from search results page
 */
export async function extractTweetUrls(page: Page): Promise<string[]> {
  const urls = await page.evaluate(() => {
    const tweetLinks: string[] = []
    
    // Find all tweet links in the timeline
    // X uses article elements for tweets
    const articles = document.querySelectorAll('article[data-testid="tweet"]')
    
    articles.forEach(article => {
      // Find the timestamp link which contains the tweet URL
      const timeLink = article.querySelector('a[href*="/status/"]')
      if (timeLink) {
        const href = timeLink.getAttribute('href')
        if (href && href.includes('/status/')) {
          // Convert relative URL to absolute
          const fullUrl = href.startsWith('http') ? href : `https://x.com${href}`
          // Extract just the tweet URL (remove any query params)
          const cleanUrl = fullUrl.split('?')[0]
          if (!tweetLinks.includes(cleanUrl)) {
            tweetLinks.push(cleanUrl)
          }
        }
      }
    })
    
    return tweetLinks
  })
  
  return urls
}

/**
 * Extract tweet ID from URL
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Search X for hashtags and return tweet URLs
 */
export async function searchHashtags(
  page: Page,
  hashtags: string[],
  options: {
    maxTweets?: number
    scrollCount?: number
  } = {}
): Promise<{ urls: string[]; error?: string }> {
  const { maxTweets = 50, scrollCount = 5 } = options
  
  const searchUrl = buildSearchUrl(hashtags)
  console.log(`[Search] Navigating to: ${searchUrl}`)
  
  try {
    // Navigate to search page
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })
    
    // Wait for content to load
    await waitForNetworkIdle(page, 5000)
    await randomDelay(2000, 3000)
    
    // Check for rate limiting
    if (await checkForRateLimit(page)) {
      return { urls: [], error: 'Rate limited by X. Try again later.' }
    }
    
    // Check if we need to log in
    const needsLogin = await page.evaluate(() => {
      return document.body.innerText.includes('Sign in') && 
             document.body.innerText.includes('to see what')
    })
    
    if (needsLogin) {
      return { urls: [], error: 'X requires login to view search results. Please configure X credentials.' }
    }
    
    // Collect tweets with scrolling
    let allUrls: string[] = []
    
    for (let i = 0; i < scrollCount && allUrls.length < maxTweets; i++) {
      const newUrls = await extractTweetUrls(page)
      
      // Add unique URLs
      for (const url of newUrls) {
        if (!allUrls.includes(url)) {
          allUrls.push(url)
        }
      }
      
      console.log(`[Search] Scroll ${i + 1}/${scrollCount}: Found ${allUrls.length} tweets`)
      
      if (allUrls.length >= maxTweets) break
      
      // Scroll to load more
      await scrollPage(page, 1)
      await randomDelay(1500, 2500)
    }
    
    // Limit to maxTweets
    allUrls = allUrls.slice(0, maxTweets)
    
    console.log(`[Search] Total unique tweets found: ${allUrls.length}`)
    return { urls: allUrls }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Search] Error:', errorMessage)
    return { urls: [], error: errorMessage }
  }
}

/**
 * Search for posts with both #HiveAI and a project tag
 */
export async function searchCampaignPosts(
  page: Page,
  projectTag: string,
  options: {
    maxTweets?: number
    scrollCount?: number
  } = {}
): Promise<{ urls: string[]; error?: string }> {
  // Always require #HiveAI plus the project tag
  const hashtags = ['#HiveAI', projectTag.startsWith('#') ? projectTag : `#${projectTag}`]
  return searchHashtags(page, hashtags, options)
}
