/**
 * POST /api/admin/scrape
 * 
 * Triggers the Puppeteer X scraper from the admin dashboard.
 * Scrapes posts with #HiveAI and campaign hashtags, calculates MSP,
 * and records them to the database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runScraper, scrapeSingleTweet } from '@/scraper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getActiveCampaigns, getCampaignById } from '@/lib/supabase/campaigns'
import { getParticipantByUsername, incrementParticipantStats, recalculateRanks } from '@/lib/supabase/participants'
import { isTweetTracked, recordPostEvent, updatePostMetrics, getPostByTweetId } from '@/lib/supabase/tracking'
import { calculatePostMspFull } from '@/lib/engine/mindshare-engine'

/**
 * POST - Run full scraper for campaigns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { 
      projectTag,
      maxTweets = 30,
      headless = false,  // Default to visible browser for login
    } = body

    // Get campaigns to scrape
    let projectTags: string[] = []
    const campaignMap = new Map<string, string>() // projectTag -> campaignId

    if (projectTag) {
      // Single campaign
      projectTags = [projectTag]
    } else {
      // All active campaigns
      const campaigns = await getActiveCampaigns()
      for (const campaign of campaigns) {
        projectTags.push(campaign.project_tag)
        campaignMap.set(campaign.project_tag.toLowerCase(), campaign.id)
      }
    }

    if (projectTags.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No campaigns to scrape',
      })
    }

    // Run the scraper
    console.log(`[Scrape API] Starting scrape for: ${projectTags.join(', ')}`)
    
    const scraperResult = await runScraper({
      projectTags,
      maxTweets,
      headless,
      delayMs: 3000,
    })

    // Process scraped tweets and save to database
    const dbResults = []

    for (const campaignResult of scraperResult.results) {
      const tag = campaignResult.projectTag.toLowerCase()
      let campaignId = campaignMap.get(tag)

      // If not in map, try to find by tag
      if (!campaignId && projectTag) {
        const campaigns = await getActiveCampaigns()
        const found = campaigns.find(c => c.project_tag.toLowerCase() === tag)
        if (found) campaignId = found.id
      }

      if (!campaignId) {
        console.warn(`[Scrape API] No campaign found for tag: ${tag}`)
        continue
      }

      const campaign = await getCampaignById(campaignId)
      if (!campaign) continue

      let recordedCount = 0
      let updatedCount = 0
      let totalMsp = 0
      const errors: string[] = [...campaignResult.errors]

      for (const tweet of campaignResult.tweets) {
        try {
          // Skip posts with 0 engagement on all metrics
          const totalEngagement = tweet.likes + tweet.retweets + tweet.replies + tweet.quotes
          if (totalEngagement === 0) {
            console.log(`[Scrape API] Skipping tweet ${tweet.id} - zero engagement`)
            continue
          }

          // Check if already tracked
          const existingPost = await getPostByTweetId(tweet.id)
          
          if (existingPost) {
            // Calculate engagement delta
            const oldEngagement = (existingPost.likes ?? 0) + (existingPost.retweets ?? 0) + (existingPost.replies ?? 0) + (existingPost.quotes ?? 0)
            const newEngagement = tweet.likes + tweet.retweets + tweet.replies + tweet.quotes
            const engagementDelta = newEngagement - oldEngagement
            
            // Update metrics
            await updatePostMetrics(tweet.id, {
              likes: tweet.likes,
              retweets: tweet.retweets,
              replies: tweet.replies,
              quotes: tweet.quotes,
            })
            updatedCount++
            
            // Award fractional MSP for engagement increase (25% of what new engagement would earn)
            // This prevents farming old posts while still rewarding continued engagement
            if (engagementDelta > 0) {
              const ENGAGEMENT_BONUS_RATE = 0.25 // 25% of normal MSP rate
              
              // Get participant for this post
              const participant = await getParticipantByUsername(campaignId, tweet.author)
              if (participant) {
                // Calculate what the delta engagement would be worth
                const deltaMsp = calculatePostMspFull({
                  likes: Math.max(0, tweet.likes - (existingPost.likes ?? 0)),
                  retweets: Math.max(0, tweet.retweets - (existingPost.retweets ?? 0)),
                  replies: Math.max(0, tweet.replies - (existingPost.replies ?? 0)),
                  quotes: Math.max(0, tweet.quotes - (existingPost.quotes ?? 0)),
                  followersCount: participant.followers_count ?? 100,
                  projectTag: campaign.project_tag,
                  postText: tweet.text,
                  postedAt: tweet.timestamp,
                  campaignStartDate: campaign.start_date,
                })
                
                // Award fractional bonus
                const bonusMsp = Math.round(deltaMsp * ENGAGEMENT_BONUS_RATE)
                if (bonusMsp > 0) {
                  await incrementParticipantStats(campaignId, participant.user_id, bonusMsp, 0)
                  totalMsp += bonusMsp
                  console.log(`[Scrape API] Engagement bonus for tweet ${tweet.id}: +${engagementDelta} engagement = +${bonusMsp} MSP (25% rate)`)
                }
              }
            }
            
            console.log(`[Scrape API] Updated metrics for tweet ${tweet.id} (delta: ${engagementDelta > 0 ? '+' : ''}${engagementDelta})`)
            continue
          }

          // Find participant by username
          const participant = await getParticipantByUsername(campaignId, tweet.author)
          if (!participant) {
            console.log(`[Scrape API] User @${tweet.author} not a participant, skipping`)
            continue
          }

          // Calculate MSP with full engine (includes views now!)
          const msp = calculatePostMspFull({
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            quotes: tweet.quotes,
            followersCount: participant.followers_count ?? 100,
            projectTag: campaign.project_tag,
            postText: tweet.text,
            postedAt: tweet.timestamp,
            campaignStartDate: campaign.start_date,
          })

          // Record post event
          const postEvent = await recordPostEvent({
            campaignId,
            userId: participant.user_id,
            tweetId: tweet.id,
            content: tweet.text,
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            quotes: tweet.quotes,
            msp,
            postedAt: tweet.timestamp,
          })

          if (postEvent) {
            // Update participant stats
            await incrementParticipantStats(campaignId, participant.user_id, msp, 1)
            recordedCount++
            totalMsp += msp
            console.log(`[Scrape API] Recorded tweet ${tweet.id} for @${tweet.author}: ${msp} MSP`)
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Tweet ${tweet.id}: ${msg}`)
        }
      }

      // Recalculate ranks and engagement/virality if any posts were recorded or updated
      if (recordedCount > 0 || updatedCount > 0) {
        await recalculateRanks(campaignId)
        console.log(`[Scrape API] Recalculated ranks for campaign ${campaignId}`)  
      }

      dbResults.push({
        campaignId,
        projectTag: campaign.project_tag,
        tweetsFound: campaignResult.tweetsFound,
        tweetsRecorded: recordedCount,
        totalMspAwarded: totalMsp,
        errors,
      })
    }

    return NextResponse.json({
      success: true,
      scraper: {
        startedAt: scraperResult.startedAt,
        completedAt: scraperResult.completedAt,
        totalTweetsFound: scraperResult.totalTweetsFound,
      },
      results: dbResults,
      summary: {
        campaignsProcessed: dbResults.length,
        totalTweetsFound: scraperResult.totalTweetsFound,
        totalTweetsRecorded: dbResults.reduce((sum, r) => sum + r.tweetsRecorded, 0),
        totalMspAwarded: dbResults.reduce((sum, r) => sum + r.totalMspAwarded, 0),
      },
    })

  } catch (error) {
    console.error('[Scrape API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET - Scrape a single tweet by URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tweetUrl = searchParams.get('url')

  if (!tweetUrl) {
    return NextResponse.json({
      success: false,
      error: 'Missing url parameter',
    }, { status: 400 })
  }

  try {
    const tweet = await scrapeSingleTweet(tweetUrl, true)

    if (!tweet) {
      return NextResponse.json({
        success: false,
        error: 'Failed to scrape tweet',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      tweet,
    })

  } catch (error) {
    console.error('[Scrape API] Single tweet error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
