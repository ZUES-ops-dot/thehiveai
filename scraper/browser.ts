/**
 * Puppeteer Browser Setup with Stealth
 * 
 * Configures browser for X scraping with anti-detection measures.
 */

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import type { BrowserConfig } from './types'

// Add stealth plugin
puppeteer.use(StealthPlugin())

// Mobile user agent (less aggressive rate limiting)
const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

// Desktop user agent fallback
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Create a new browser instance with stealth configuration
 */
export async function createBrowser(config: BrowserConfig = { headless: true }): Promise<Browser> {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=414,896', // iPhone viewport
  ]

  // Add proxy if configured
  if (config.proxy) {
    args.push(`--proxy-server=${config.proxy.host}:${config.proxy.port}`)
  }

  const browser = await puppeteer.launch({
    headless: config.headless,
    args,
  })
  return browser
}

/**
 * Create a new page with mobile configuration
 */
export async function createPage(browser: Browser, useMobile = true): Promise<Page> {
  const page = await browser.newPage()

  // Set user agent
  await page.setUserAgent(useMobile ? MOBILE_USER_AGENT : DESKTOP_USER_AGENT)

  // Set viewport (iPhone dimensions)
  await page.setViewport({
    width: 414,
    height: 896,
    deviceScaleFactor: 2,
    isMobile: useMobile,
    hasTouch: useMobile,
  })

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  })

  // Block unnecessary resources to speed up scraping
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const resourceType = req.resourceType()
    // Block images, fonts, and media to speed up loading
    if (['image', 'font', 'media'].includes(resourceType)) {
      req.abort()
    } else {
      req.continue()
    }
  })

  return page
}

/**
 * Load cookies from file for session persistence
 */
export async function loadCookies(page: Page, cookiesPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(cookiesPath)) {
      console.log('[Browser] No cookies file found')
      return false
    }

    const cookiesString = fs.readFileSync(cookiesPath, 'utf-8')
    const cookies = JSON.parse(cookiesString)
    await page.setCookie(...cookies)
    console.log(`[Browser] Loaded ${cookies.length} cookies`)
    return true
  } catch (error) {
    console.error('[Browser] Failed to load cookies:', error)
    return false
  }
}

/**
 * Save cookies to file for session persistence
 */
export async function saveCookies(page: Page, cookiesPath: string): Promise<boolean> {
  try {
    const cookies = await page.cookies()
    const dir = path.dirname(cookiesPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2))
    console.log(`[Browser] Saved ${cookies.length} cookies`)
    return true
  } catch (error) {
    console.error('[Browser] Failed to save cookies:', error)
    return false
  }
}

/**
 * Random delay to simulate human behavior
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Scroll page to load dynamic content
 */
export async function scrollPage(page: Page, scrolls = 3): Promise<void> {
  for (let i = 0; i < scrolls; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 0.8)
    })
    await randomDelay(1000, 2000)
  }
}

/**
 * Wait for network to be idle (useful after navigation)
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  try {
    await page.waitForNetworkIdle({ timeout, idleTime: 500 })
  } catch {
    // Timeout is acceptable, page may have continuous activity
  }
}

/**
 * Check if page has rate limit or error message
 */
export async function checkForRateLimit(page: Page): Promise<boolean> {
  const content = await page.content()
  const rateLimitIndicators = [
    'Rate limit exceeded',
    'Something went wrong',
    'Try again later',
    'temporarily limited',
  ]
  
  return rateLimitIndicators.some(indicator => 
    content.toLowerCase().includes(indicator.toLowerCase())
  )
}
