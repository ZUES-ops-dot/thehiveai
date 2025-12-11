/**
 * HiveAI X Scraper - Main Orchestrator
 * 
 * Coordinates browser, search, and stats modules to scrape
 * campaign posts from X.
 * Based on proven patterns from X(GARTH) bot.
 */

import { createBrowser, createPage, loadCookies, saveCookies, randomDelay } from './browser'
import { searchCampaignPosts, extractTweetId } from './search'
import { scrapeTweetStats, validateTweetHashtags } from './stats'
import type { ScrapingOptions, ScrapingResult, CampaignScrapingResult, ScrapedTweet } from './types'
import type { Page } from 'puppeteer'

// Default options - headless FALSE by default so user can login
const DEFAULT_OPTIONS: Required<ScrapingOptions> = {
  projectTags: [],
  maxTweets: 50,
  headless: false,  // Changed to false - need visible browser for login
  delayMs: 3000,
}

// Cookies path for session persistence
const COOKIES_PATH = './scraper/.cookies.json'

/**
 * Check if user is logged into X
 */
async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for login page indicators (if present, NOT logged in)
    const loginIndicators = [
      'input[name="text"]',
      'input[name="password"]',
      'div[data-testid="LoginForm_Login_Button"]',
      'input[autocomplete="username"]',
    ]
    for (const sel of loginIndicators) {
      const el = await page.$(sel)
      if (el) {
        console.log(`[Scraper] Login page detected (found ${sel})`)
        return false
      }
    }

    // Check for logged-in UI elements
    const loggedInSelectors = [
      'a[data-testid="AppTabBar_Notifications_Link"]',
      'div[data-testid="SideNav_AccountSwitcher_Button"]',
      'a[data-testid="AppTabBar_Home_Link"]',
      'div[data-testid="tweetButtonInline"]',
    ]
    for (const sel of loggedInSelectors) {
      const el = await page.$(sel)
      if (el) {
        console.log(`[Scraper] ✅ Logged in (found ${sel})`)
        return true
      }
    }
  } catch {}
  console.log('[Scraper] ❓ Could not determine login status')
  return false
}

/**
 * Wait for user to login manually
 */
async function waitForLogin(page: Page, timeoutMs = 120000): Promise<boolean> {
  console.log('[Scraper] ⚠️ NOT LOGGED IN - Please login in the browser window')
  console.log('[Scraper] Waiting up to 2 minutes for login...')
  
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000))
    if (await isLoggedIn(page)) {
      console.log('[Scraper] ✅ Login detected!')
      return true
    }
  }
  
  console.log('[Scraper] ❌ Login timeout - please try again')
  return false
}

/**
 * Run the scraper for specified campaigns
 */
export async function runScraper(options: ScrapingOptions): Promise<ScrapingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startedAt = new Date().toISOString()
  
  const result: ScrapingResult = {
    success: false,
    startedAt,
    completedAt: '',
    results: [],
    totalTweetsFound: 0,
    totalTweetsRecorded: 0,
    totalMspAwarded: 0,
  }
  
  if (opts.projectTags.length === 0) {
    result.completedAt = new Date().toISOString()
    return result
  }
  
  console.log(`[Scraper] Starting scrape for ${opts.projectTags.length} campaigns`)
  console.log(`[Scraper] Options: headless=${opts.headless}, maxTweets=${opts.maxTweets}`)
  
  let browser
  
  try {
    // Create browser (visible by default)
    browser = await createBrowser({ headless: opts.headless })
    const page = await createPage(browser)
    
    // Navigate to X home first
    console.log('[Scraper] Loading x.com...')
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))
    
    // Check login status
    if (!await isLoggedIn(page)) {
      // Wait for manual login
      const loggedIn = await waitForLogin(page)
      if (!loggedIn) {
        result.results.push({
          campaignId: '',
          projectTag: 'login',
          tweetsFound: 0,
          tweetsRecorded: 0,
          totalMspAwarded: 0,
          errors: ['Login required - please login in the browser window and try again'],
          tweets: [],
        })
        result.completedAt = new Date().toISOString()
        await browser.close()
        return result
      }
    }
    
    console.log('[Scraper] ✅ Session authenticated, starting scrape...')
    
    // Process each campaign
    for (const projectTag of opts.projectTags) {
      console.log(`\n[Scraper] Processing campaign: #${projectTag}`)
      
      const campaignResult: CampaignScrapingResult = {
        campaignId: '', // Will be set by API
        projectTag,
        tweetsFound: 0,
        tweetsRecorded: 0,
        totalMspAwarded: 0,
        errors: [],
        tweets: [],
      }
      
      try {
        // Search for tweets with both hashtags
        const { urls, error: searchError } = await searchCampaignPosts(page, projectTag, {
          maxTweets: opts.maxTweets,
          scrollCount: 5,
        })
        
        if (searchError) {
          campaignResult.errors.push(searchError)
          result.results.push(campaignResult)
          continue
        }
        
        campaignResult.tweetsFound = urls.length
        console.log(`[Scraper] Found ${urls.length} tweets for #${projectTag}`)
        
        // Scrape stats for each tweet
        for (const url of urls) {
          await randomDelay(opts.delayMs, opts.delayMs + 2000)
          
          const tweet = await scrapeTweetStats(page, url)
          
          if (tweet) {
            // Validate hashtags
            if (validateTweetHashtags(tweet, ['#HiveAI', `#${projectTag}`])) {
              campaignResult.tweets.push(tweet)
              campaignResult.tweetsRecorded++
            } else {
              console.log(`[Scraper] Tweet ${tweet.id} missing required hashtags, skipping`)
            }
          }
        }
        
        console.log(`[Scraper] Recorded ${campaignResult.tweetsRecorded} valid tweets for #${projectTag}`)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        campaignResult.errors.push(errorMessage)
        console.error(`[Scraper] Campaign error:`, errorMessage)
      }
      
      result.results.push(campaignResult)
      result.totalTweetsFound += campaignResult.tweetsFound
      result.totalTweetsRecorded += campaignResult.tweetsRecorded
    }
    
    // Save cookies for next run
    await saveCookies(page, COOKIES_PATH)
    
    result.success = true
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Scraper] Fatal error:', errorMessage)
    result.results.push({
      campaignId: '',
      projectTag: 'global',
      tweetsFound: 0,
      tweetsRecorded: 0,
      totalMspAwarded: 0,
      errors: [errorMessage],
      tweets: [],
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
  
  result.completedAt = new Date().toISOString()
  
  console.log(`\n[Scraper] Complete!`)
  console.log(`[Scraper] Total tweets found: ${result.totalTweetsFound}`)
  console.log(`[Scraper] Total tweets recorded: ${result.totalTweetsRecorded}`)
  
  return result
}

/**
 * Scrape a single tweet by URL
 */
export async function scrapeSingleTweet(
  tweetUrl: string,
  headless = true
): Promise<ScrapedTweet | null> {
  let browser
  
  try {
    browser = await createBrowser({ headless })
    const page = await createPage(browser)
    
    await loadCookies(page, COOKIES_PATH)
    
    const tweet = await scrapeTweetStats(page, tweetUrl)
    
    await saveCookies(page, COOKIES_PATH)
    
    return tweet
  } catch (error) {
    console.error('[Scraper] Single tweet error:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Re-export types
export type { ScrapingOptions, ScrapingResult, CampaignScrapingResult, ScrapedTweet } from './types'
