import { getSupabaseServerClient } from './client'
import type { Campaign, Participant } from './types'

/**
 * Fetch all campaigns
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch campaigns:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch active campaigns (status = 'active')
 */
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch active campaigns:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch a single campaign by ID
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch campaign:', error)
    return null
  }
  return data
}

/**
 * Fetch a campaign by its project tag (e.g., "SolXToken")
 */
export async function getCampaignByTag(projectTag: string): Promise<Campaign | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('project_tag', projectTag)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch campaign by tag:', error)
  }
  return data ?? null
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
): Promise<Campaign | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) {
    console.error('Failed to create campaign:', error)
    return null
  }
  return data
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  id: string,
  status: 'active' | 'upcoming' | 'ended'
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Failed to update campaign status:', error)
    return false
  }
  return true
}

/**
 * Get leaderboard for a campaign (top N participants by MSP)
 */
export async function getCampaignLeaderboard(
  campaignId: string,
  limit = 100
): Promise<Participant[]> {
  const supabase = getSupabaseServerClient()
  const fetchLimit = limit * 3
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('msp', { ascending: false })
    .limit(fetchLimit)

  if (error) {
    console.error('Failed to fetch leaderboard:', error)
    return []
  }

  const rows = (data ?? []) as Participant[]
  const unique: Participant[] = []
  const seen = new Set<string>()
  for (const participant of rows) {
    if (!participant.user_id) continue
    if (seen.has(participant.user_id)) {
      continue
    }
    seen.add(participant.user_id)
    unique.push(participant)
    if (unique.length >= limit) break
  }

  return unique
}

/**
 * Get participant count for a campaign
 */
export async function getCampaignParticipantCount(campaignId: string): Promise<number> {
  const supabase = getSupabaseServerClient()
  const { count, error } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('Failed to count participants:', error)
    return 0
  }
  return count ?? 0
}

/**
 * Get total MSP for a campaign
 */
export async function getCampaignTotalMSP(campaignId: string): Promise<number> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participants')
    .select('msp')
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('Failed to sum MSP:', error)
    return 0
  }
  return data?.reduce((sum, p) => sum + (p.msp || 0), 0) ?? 0
}
