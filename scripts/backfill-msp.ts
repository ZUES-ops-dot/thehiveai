/**
 * Backfill MSP Script
 * 
 * Recalculates MSP for all existing post_events using the full mindshare engine.
 * Also recalculates participant MSP totals and ranks.
 * 
 * Usage:
 *   npx tsx scripts/backfill-msp.ts [--dry-run] [--batch-size=100]
 * 
 * Options:
 *   --dry-run      Show what would be updated without making changes
 *   --batch-size   Number of posts to process per batch (default: 100)
 */

// Load environment variables from .env.local synchronously before any other code
const fs = require('fs')
const pathMod = require('path')

const envPath = pathMod.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    let value = trimmed.slice(eqIndex + 1)
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

import { createClient } from '@supabase/supabase-js'

// Inline the MSP calculation to avoid module resolution issues with ts-node
// This mirrors the logic in lib/engine/mindshare-engine.ts

type GlowTier = 'prime' | 'lumina' | 'echelon' | 'apex' | 'overmind'

const MSP_WEIGHTS = {
  reach: 0.25,
  engagement: 0.25,
  relevance: 0.20,
  credibility: 0.15,
  velocity: 0.15,
}

const TIER_MULTIPLIERS: Record<GlowTier, number> = {
  prime: 1.0,
  lumina: 1.25,
  echelon: 1.5,
  apex: 2.0,
  overmind: 3.0,
}

const CONTENT_TYPE_BONUSES: Record<string, number> = {
  post: 1.0,
  thread: 1.5,
  video: 2.0,
  meme: 1.2,
  analysis: 1.8,
}

const EARLY_AMPLIFICATION_BONUS = 1.5

function detectContentType(text: string): 'post' | 'thread' | 'video' | 'meme' | 'analysis' {
  const lower = text.toLowerCase()
  if (/\b(thread|🧵)\b/i.test(text) || /^\d+[.\/)]/.test(text)) return 'thread'
  if (/\b(video|watch|youtube|youtu\.be)\b/i.test(lower)) return 'video'
  if (/\b(analysis|breakdown|deep dive|research|data)\b/i.test(lower)) return 'analysis'
  const emojiPattern = /[\uD83C-\uDBFF\uDC00-\uDFFF]/g
  const emojiCount = (text.match(emojiPattern) || []).length
  if (emojiCount > 3 || /\b(meme|lmao|lol|based)\b/i.test(lower)) return 'meme'
  return 'post'
}

function calculatePostMspFull(input: {
  likes: number
  retweets: number
  replies: number
  quotes: number
  followersCount?: number
  projectTag?: string
  postText?: string
  postedAt?: string
  campaignStartDate?: string
}): number {
  const {
    likes, retweets, replies, quotes,
    followersCount = 100,
    projectTag = '',
    postText = '',
    postedAt,
    campaignStartDate,
  } = input

  const estimatedReach = Math.max(1, Math.round(followersCount * 0.15))
  const totalEngagement = likes + retweets + replies + quotes

  let contentAgeHours = 24
  if (postedAt) {
    const postedDate = new Date(postedAt)
    contentAgeHours = Math.max(1, (Date.now() - postedDate.getTime()) / (1000 * 60 * 60))
  }

  let isEarlyAmplifier = false
  if (postedAt && campaignStartDate) {
    const postedDate = new Date(postedAt)
    const startDate = new Date(campaignStartDate)
    const hoursSinceStart = (postedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    isEarlyAmplifier = hoursSinceStart >= 0 && hoursSinceStart <= 24
  }

  const engagementVelocity = contentAgeHours > 0 ? totalEngagement / contentAgeHours : totalEngagement
  const detectedContentType = detectContentType(postText)

  // Calculate scores
  const reachScore = Math.min(100, Math.log10(estimatedReach + 1) * 25 * 0.5 + Math.log10(estimatedReach * 2 + 1) * 20 * 0.3)
  
  const engagementWeights = { likes: 1, retweets: 3, quotes: 5, replies: 2, bookmarks: 2 }
  const weightedEngagement = likes * engagementWeights.likes + retweets * engagementWeights.retweets +
    quotes * engagementWeights.quotes + replies * engagementWeights.replies
  const engagementScore = Math.min(100, Math.log10(weightedEngagement + 1) * 30)

  const relevanceScore = projectTag ? 70 : 50 // simplified
  const credibilityScore = 50 // default
  
  const ageAdjustment = Math.max(0.5, 1 - (contentAgeHours / 168))
  const velocityScore = Math.min(100, Math.log10(engagementVelocity * ageAdjustment + 1) * 40)

  const baseMsp = 
    reachScore * MSP_WEIGHTS.reach +
    engagementScore * MSP_WEIGHTS.engagement +
    relevanceScore * MSP_WEIGHTS.relevance +
    credibilityScore * MSP_WEIGHTS.credibility +
    velocityScore * MSP_WEIGHTS.velocity

  const tierMultiplier = TIER_MULTIPLIERS.prime
  const contentBonus = CONTENT_TYPE_BONUSES[detectedContentType] || 1.0
  const earlyBonus = isEarlyAmplifier ? EARLY_AMPLIFICATION_BONUS : 1.0

  return Math.round(baseMsp * tierMultiplier * contentBonus * earlyBonus)
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const batchSizeArg = args.find(a => a.startsWith('--batch-size='))
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 100

// Validate environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PostEvent {
  id: string
  campaign_id: string
  user_id: string
  content: string
  likes: number | null
  retweets: number | null
  replies: number | null
  quotes: number | null
  msp: number | null
  posted_at: string
}

interface Campaign {
  id: string
  start_date: string
  project_tag: string
}

interface Participant {
  user_id: string
  campaign_id: string
  followers_count: number | null
}

async function main() {
  console.log('='.repeat(60))
  console.log('MSP Backfill Script')
  console.log('='.repeat(60))
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Batch size: ${batchSize}`)
  console.log('')

  // Fetch all campaigns for enrichment data
  console.log('Fetching campaigns...')
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, start_date, project_tag')
    .returns<Campaign[]>()

  if (campaignsError) {
    console.error('Failed to fetch campaigns:', campaignsError)
    process.exit(1)
  }

  const campaignMap = new Map(campaigns?.map(c => [c.id, c]) ?? [])
  console.log(`Found ${campaignMap.size} campaigns`)

  // Fetch all participants for follower counts
  console.log('Fetching participants...')
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('user_id, campaign_id, followers_count')
    .returns<Participant[]>()

  if (participantsError) {
    console.error('Failed to fetch participants:', participantsError)
    process.exit(1)
  }

  // Build participant lookup: campaignId:userId -> followersCount
  const participantMap = new Map<string, number>()
  for (const p of participants ?? []) {
    const key = `${p.campaign_id}:${p.user_id}`
    participantMap.set(key, p.followers_count ?? 100)
  }
  console.log(`Found ${participantMap.size} participant records`)

  // Count total posts
  const { count: totalPosts, error: countError } = await supabase
    .from('post_events')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Failed to count posts:', countError)
    process.exit(1)
  }

  console.log(`Total posts to process: ${totalPosts}`)
  console.log('')

  // Process posts in batches
  let processed = 0
  let updated = 0
  let totalOldMsp = 0
  let totalNewMsp = 0
  let offset = 0

  while (offset < (totalPosts ?? 0)) {
    console.log(`Processing batch ${Math.floor(offset / batchSize) + 1} (${offset}-${offset + batchSize})...`)

    const { data: posts, error: postsError } = await supabase
      .from('post_events')
      .select('id, campaign_id, user_id, content, likes, retweets, replies, quotes, msp, posted_at')
      .order('posted_at', { ascending: true })
      .range(offset, offset + batchSize - 1)
      .returns<PostEvent[]>()

    if (postsError) {
      console.error('Failed to fetch posts:', postsError)
      process.exit(1)
    }

    if (!posts || posts.length === 0) break

    for (const post of posts) {
      const campaign = campaignMap.get(post.campaign_id)
      const participantKey = `${post.campaign_id}:${post.user_id}`
      const followersCount = participantMap.get(participantKey) ?? 100

      const newMsp = calculatePostMspFull({
        likes: post.likes ?? 0,
        retweets: post.retweets ?? 0,
        replies: post.replies ?? 0,
        quotes: post.quotes ?? 0,
        followersCount,
        projectTag: campaign?.project_tag,
        postText: post.content,
        postedAt: post.posted_at,
        campaignStartDate: campaign?.start_date,
      })

      const oldMsp = post.msp ?? 0
      totalOldMsp += oldMsp
      totalNewMsp += newMsp

      if (newMsp !== oldMsp) {
        updated++
        
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('post_events')
            .update({ msp: newMsp })
            .eq('id', post.id)

          if (updateError) {
            console.error(`Failed to update post ${post.id}:`, updateError)
          }
        }
      }

      processed++
    }

    offset += batchSize
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('Post Events Summary')
  console.log('='.repeat(60))
  console.log(`Posts processed: ${processed}`)
  console.log(`Posts updated: ${updated}`)
  console.log(`Total old MSP: ${totalOldMsp}`)
  console.log(`Total new MSP: ${totalNewMsp}`)
  console.log(`MSP difference: ${totalNewMsp - totalOldMsp} (${((totalNewMsp - totalOldMsp) / Math.max(totalOldMsp, 1) * 100).toFixed(2)}%)`)
  console.log('')

  // Recalculate participant MSP totals
  if (!dryRun) {
    console.log('Recalculating participant MSP totals...')

    // Get unique campaign IDs
    const campaignIds = Array.from(campaignMap.keys())

    for (const campaignId of campaignIds) {
      // Aggregate MSP and post count from post_events
      const { data: aggregated, error: aggError } = await supabase
        .from('post_events')
        .select('user_id, msp')
        .eq('campaign_id', campaignId)
        .returns<{ user_id: string; msp: number }[]>()

      if (aggError) {
        console.error(`Failed to aggregate for campaign ${campaignId}:`, aggError)
        continue
      }

      // Sum by user
      const userMsp = new Map<string, { msp: number; postCount: number }>()
      for (const row of aggregated ?? []) {
        const existing = userMsp.get(row.user_id) ?? { msp: 0, postCount: 0 }
        existing.msp += row.msp ?? 0
        existing.postCount += 1
        userMsp.set(row.user_id, existing)
      }

      // Update participants
      for (const [userId, stats] of Array.from(userMsp.entries())) {
        const { error: updateError } = await supabase
          .from('participants')
          .update({ msp: stats.msp, post_count: stats.postCount })
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)

        if (updateError) {
          console.error(`Failed to update participant ${userId} in campaign ${campaignId}:`, updateError)
        }
      }

      // Recalculate ranks
      const { data: rankedParticipants, error: rankError } = await supabase
        .from('participants')
        .select('id, msp')
        .eq('campaign_id', campaignId)
        .order('msp', { ascending: false })
        .returns<{ id: string; msp: number }[]>()

      if (rankError) {
        console.error(`Failed to fetch participants for ranking in campaign ${campaignId}:`, rankError)
        continue
      }

      for (let i = 0; i < (rankedParticipants?.length ?? 0); i++) {
        const { error: rankUpdateError } = await supabase
          .from('participants')
          .update({ rank: i + 1 })
          .eq('id', rankedParticipants![i].id)

        if (rankUpdateError) {
          console.error(`Failed to update rank for participant ${rankedParticipants![i].id}:`, rankUpdateError)
        }
      }

      console.log(`  Campaign ${campaignId}: ${userMsp.size} participants updated`)
    }
  }

  console.log('')
  console.log('='.repeat(60))
  console.log(dryRun ? 'DRY RUN COMPLETE - No changes were made' : 'BACKFILL COMPLETE')
  console.log('='.repeat(60))
}

main().catch(console.error)
