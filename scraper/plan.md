# HiveAI X (Twitter) Puppeteer Scraper Plan

## Overview

Replace broken Nitter scraping with a Puppeteer-based solution that directly scrapes X.com to track posts with `#HiveAI` and campaign hashtags (e.g., `#SOLANA`).

## Architecture

```
/scraper
├── browser.ts      → Puppeteer setup (stealth, cookies, mobile UA)
├── search.ts       → Gets tweet links from hashtag search pages
├── stats.ts        → Scrapes engagement metrics from individual tweets
├── index.ts        → Main orchestrator / entry point
└── types.ts        → TypeScript interfaces
```

## Data Model

Each scraped tweet:

```typescript
interface ScrapedTweet {
  id: string                    // Tweet ID
  url: string                   // Full tweet URL
  author: string                // @username
  authorName: string            // Display name
  authorProfileImage?: string   // Avatar URL
  text: string                  // Tweet content
  timestamp: string             // ISO date
  views: number                 // View count (NEW - not available via Nitter)
  likes: number
  replies: number
  retweets: number
  quotes: number
  bookmarks: number             // (NEW - not available via Nitter)
  hashtags: string[]            // Detected hashtags
}
```

## Module Details

### Module A: Browser Setup (`browser.ts`)

- Use `puppeteer-extra` with `puppeteer-extra-plugin-stealth`
- Mobile user agent (lighter DOM, less detection)
- Cookie persistence for logged-in session (optional but recommended)
- Proxy rotation support (optional)
- Configurable headless mode

```typescript
export async function createBrowser(): Promise<Browser>
export async function createPage(browser: Browser): Promise<Page>
export async function loadCookies(page: Page, cookiesPath: string): Promise<void>
export async function saveCookies(page: Page, cookiesPath: string): Promise<void>
```

### Module B: Search Fetcher (`search.ts`)

Search URL patterns:
- `https://x.com/search?q=%23HiveAI%20%23SOLANA&src=typed_query&f=live`
- Combined query for both hashtags ensures posts have BOTH

Responsibilities:
- Navigate to search page
- Scroll to load more tweets
- Extract tweet URLs and IDs from timeline
- Return list of tweet URLs for stats scraping

```typescript
export async function searchHashtags(
  page: Page, 
  hashtags: string[]
): Promise<string[]>  // Returns tweet URLs
```

### Module C: Stats Scraper (`stats.ts`)

Given a tweet URL, extract all engagement metrics.

**Working Selectors (as of Dec 2024):**

| Metric | Selector |
|--------|----------|
| Views | `div[data-testid="tweetViewCount"]` or `a[href*="/analytics"]` |
| Likes | `div[data-testid="like"] span` or `button[data-testid="like"] span` |
| Replies | `div[data-testid="reply"] span` or `button[data-testid="reply"] span` |
| Retweets | `div[data-testid="retweet"] span` or `button[data-testid="retweet"] span` |
| Bookmarks | `div[data-testid="bookmark"] span` or `button[data-testid="bookmark"] span` |
| Author | `div[data-testid="User-Name"] a` |
| Tweet Text | `div[data-testid="tweetText"]` |
| Timestamp | `time[datetime]` |

```typescript
export async function scrapeTweetStats(
  page: Page, 
  tweetUrl: string
): Promise<ScrapedTweet | null>
```

### Module D: Orchestrator (`index.ts`)

Main scraping loop:

1. Initialize browser with stealth
2. Load saved cookies (if available)
3. For each campaign:
   - Build search query: `#HiveAI #${projectTag}`
   - Fetch tweet URLs from search
   - For each tweet URL:
     - Check if already tracked (by tweet ID)
     - If new, scrape full stats
     - Validate has both hashtags
     - Calculate MSP
     - Save to database
4. Update tracking state
5. Close browser or keep warm for next run

```typescript
export async function runScraper(options: {
  projectTags: string[]
  maxTweets?: number
  headless?: boolean
}): Promise<ScrapingResult>
```

## Integration with HiveAI

### API Endpoint

`POST /api/admin/scrape`

Triggers the Puppeteer scraper from the admin dashboard.

```typescript
// Request
{
  projectTag?: string  // Specific campaign or all
  maxTweets?: number   // Limit per campaign
}

// Response
{
  success: boolean
  results: {
    campaignId: string
    projectTag: string
    tweetsFound: number
    tweetsRecorded: number
    totalMspAwarded: number
    errors: string[]
  }[]
}
```

### Admin Dashboard UI

New "Scrape X" button in the Tracking tab that:
- Shows scraping progress
- Displays found tweets in real-time
- Reports errors and rate limits

## Rate Limiting & Anti-Detection

1. **Request delays**: 2-5 second random delay between page loads
2. **Scroll simulation**: Human-like scrolling behavior
3. **Session persistence**: Reuse cookies to avoid repeated logins
4. **Mobile UA**: Less aggressive rate limiting on mobile
5. **Proxy rotation**: Optional, for high-volume scraping

## Dependencies

```json
{
  "puppeteer": "^21.0.0",
  "puppeteer-extra": "^3.3.6",
  "puppeteer-extra-plugin-stealth": "^2.11.2"
}
```

## Environment Variables

```env
# Optional: X login credentials for authenticated scraping
X_USERNAME=your_username
X_PASSWORD=your_password

# Optional: Proxy configuration
PROXY_HOST=proxy.example.com
PROXY_PORT=8080
PROXY_USERNAME=user
PROXY_PASSWORD=pass

# Scraper settings
SCRAPER_HEADLESS=true
SCRAPER_MAX_TWEETS=50
SCRAPER_DELAY_MS=3000
```

## Execution Modes

1. **Manual**: Triggered from admin dashboard
2. **Scheduled**: Cron job every 5-15 minutes
3. **On-demand**: API call from external service

## Error Handling

- Retry failed requests up to 3 times
- Log all errors with context
- Graceful degradation if X is down
- Alert on repeated failures

## Security Considerations

- Never commit cookies or credentials
- Use environment variables for sensitive data
- Rate limit API endpoint to prevent abuse
- Validate all inputs

## Next Steps

1. Install dependencies: `npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth`
2. Create scraper modules
3. Create API endpoint
4. Update admin dashboard
5. Test locally
6. Deploy (note: Puppeteer requires special hosting considerations)
