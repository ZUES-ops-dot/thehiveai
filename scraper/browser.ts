/**
 * Puppeteer Browser Setup
 * 
 * Configures browser for X scraping with anti-detection measures.
 * Based on proven patterns from X(GARTH) bot.
 */

import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import type { BrowserConfig } from './types'

// Desktop user agent (Chrome on Windows)
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Profile directory for cookie persistence
const PROFILE_DIR = './scraper/.puppeteer_profile'

/**
 * Find Chrome executable path
 */
function findChromePath(): string | undefined {
  const username = process.env.USERNAME || process.env.USER || ''
  const candidatePaths = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    `C:/Users/${username}/AppData/Local/Google/Chrome/Application/chrome.exe`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[]

  return candidatePaths.find(p => fs.existsSync(p))
}

/**
 * Create a new browser instance with anti-detection
 */
export async function createBrowser(config: BrowserConfig = { headless: false }): Promise<Browser> {
  const args = [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--allow-running-insecure-content',
  ]

  // Add proxy if configured
  if (config.proxy) {
    args.push(`--proxy-server=${config.proxy.host}:${config.proxy.port}`)
  }

  const chromePath = findChromePath()
  if (!chromePath) {
    console.error('[Browser] Chrome not found. Set CHROME_PATH in .env')
    throw new Error('Chrome executable not found')
  }
  console.log(`[Browser] Using Chrome: ${chromePath}`)

  const browser = await puppeteer.launch({
    headless: config.headless,
    defaultViewport: null,
    userDataDir: PROFILE_DIR,
    executablePath: chromePath,
    args,
  })
  return browser
}

/**
 * Create a new page with desktop configuration and anti-detection
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  // Set desktop user agent
  await page.setUserAgent(DESKTOP_USER_AGENT)

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  })

  // Anti-detection: remove webdriver flag and add Chrome properties
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    // Set languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
    // Fake plugins
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
    // Add chrome object
    if (!(window as any).chrome) {
      (window as any).chrome = { runtime: {} }
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
