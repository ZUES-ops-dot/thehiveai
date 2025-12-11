/**
 * HiveAI X Scraper - Main Orchestrator
 * 
 * Coordinates browser, search, and stats modules to scrape
 * campaign posts from X.
 */

import { createBrowser, createPage, loadCookies, saveCookies, randomDelay } from './browser'
import { searchCampaignPosts, extractTweetId } from './search'
import { scrapeTweetStats, validateTweetHashtags } from './stats'
import type { ScrapingOptions, ScrapingResult, CampaignScrapingResult, ScrapedTweet } from './types'

// Default options
const DEFAULT_OPTIONS: Required<ScrapingOptions> = {
  projectTags: [],
  maxTweets: 50,
  headless: true,
  delayMs: 3000,
}

// Cookies path for session persistence
const COOKIES_PATH = './scraper/.cookies.json'

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
    // Create browser
    browser = await createBrowser({ headless: opts.headless })
    const page = await createPage(browser)
    
    // Try to load existing cookies
    await loadCookies(page, COOKIES_PATH)
    
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
