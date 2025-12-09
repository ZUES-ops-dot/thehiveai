import { getSupabaseServerClient } from './client'
import type { Database, Participant } from './types'

type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
type ParticipantUpdate = Database['public']['Tables']['participants']['Update']

interface JoinCampaignInput {
  campaignId: string
  userId: string
  username: string
  displayName: string
  profileImageUrl?: string
  followersCount?: number
  engagementRate?: number
  viralityScore?: number
}

/**
 * Join a campaign (upsert participant)
 */
export async function joinCampaign(input: JoinCampaignInput): Promise<Participant | null> {
  const supabase = getSupabaseServerClient()

  const insertData: ParticipantInsert = {
    campaign_id: input.campaignId,
    user_id: input.userId,
    username: input.username,
    display_name: input.displayName,
    profile_image_url: input.profileImageUrl ?? null,
    followers_count: input.followersCount ?? 0,
    engagement_rate: input.engagementRate ?? 0,
    virality_score: input.viralityScore ?? 0,
    msp: 0,
    post_count: 0,
  }

  const { data, error } = await supabase
    .from('participants')
    .upsert(insertData as never, { onConflict: 'campaign_id,user_id' })
    .select()
    .single()

  if (error) {
    console.error('Failed to join campaign:', error)
    return null
  }

  // Record the first time this user has ever joined this campaign
  const historyInsert = {
    user_id: input.userId,
    campaign_id: input.campaignId,
    first_joined_at: new Date().toISOString(),
  }

  const { error: historyError } = await supabase
    .from('user_campaign_history')
    .upsert(historyInsert, {
      onConflict: 'user_id,campaign_id',
      ignoreDuplicates: true,
    })

  if (historyError) {
    console.warn('Failed to record campaign join history:', historyError)
  }

  return data as Participant
}

/**
 * Leave a campaign
 */
export async function leaveCampaign(campaignId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to leave campaign:', error)
    return false
  }
  return true
}

/**
 * Get participant by campaign and user
 */
export async function getParticipant(
  campaignId: string,
  userId: string
): Promise<Participant | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to get participant:', error)
  }
  return data ?? null
}

/**
 * Get participant by campaign + username (case insensitive)
 */
export async function getParticipantByUsername(
  campaignId: string,
  username: string
): Promise<Participant | null> {
  const supabase = getSupabaseServerClient()
  const normalized = username.replace(/^@/, '')

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('campaign_id', campaignId)
    .ilike('username', normalized)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to get participant by username:', error)
  }

  return data ?? null
}

/**
 * Get all campaigns a user has joined
 */
export async function getUserCampaigns(userId: string): Promise<Participant[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to get user campaigns:', error)
    return []
  }
  return data ?? []
}

/**
 * Increment participant MSP and post count (used by tracking engine)
 * Note: For high-concurrency scenarios, consider adding an RPC function
 * `increment_participant_stats` in Supabase for atomic updates.
 */
export async function incrementParticipantStats(
  campaignId: string,
  userId: string,
  mspDelta: number,
  postCountDelta = 1
): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  // Fetch current values
  const { data: current, error: fetchError } = await supabase
    .from('participants')
    .select('msp, post_count')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Failed to fetch participant for increment:', fetchError)
    return false
  }

  if (!current) {
    const { error: joinError } = await (supabase.from('participants') as any).insert({
      campaign_id: campaignId,
      user_id: userId,
      msp: mspDelta,
      post_count: postCountDelta > 0 ? postCountDelta : 0,
    } as ParticipantInsert)

    if (joinError) {
      console.error('Failed to create participant for increment:', joinError)
      return false
    }
    return true
  }

  const currentData = current as { msp: number; post_count: number } | null
  const newMsp = (currentData?.msp ?? 0) + mspDelta
  const newPostCount = (currentData?.post_count ?? 0) + postCountDelta

  const updateData: ParticipantUpdate = { msp: newMsp, post_count: newPostCount }
  const { error: updateError } = await supabase
    .from('participants')
    .update(updateData as never)
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (updateError) {
    console.error('Failed to increment participant stats:', updateError)
    return false
  }
  return true
}

/**
 * Recalculate ranks for all participants in a campaign
 */
/**
 * Update wallet address for a participant
 */
export async function updateParticipantWallet(
  campaignId: string,
  userId: string,
  walletAddress: string | null
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const updateData: ParticipantUpdate = { wallet_address: walletAddress }

  const { error } = await supabase
    .from('participants')
    .update(updateData as never)
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update participant wallet:', error)
    return false
  }
  return true
}

/**
 * Get all wallets for a campaign (for export)
 */
export async function getCampaignWallets(campaignId: string): Promise<
  Array<{
    rank: number
    username: string
    displayName: string
    walletAddress: string
    msp: number
  }>
> {
  const supabase = getSupabaseServerClient()
  type WalletRow = Pick<Participant, 'username' | 'display_name' | 'wallet_address' | 'msp' | 'rank'>

  const { data, error } = await supabase
    .from('participants')
    .select('username, display_name, wallet_address, msp, rank')
    .eq('campaign_id', campaignId)
    .not('wallet_address', 'is', null)
    .order('msp', { ascending: false })
    .returns<WalletRow[]>()

  if (error) {
    console.error('Failed to get campaign wallets:', error)
    return []
  }

  return (data ?? []).map((row, index) => ({
    rank: row.rank ?? index + 1,
    username: row.username,
    displayName: row.display_name,
    walletAddress: row.wallet_address!,
    msp: row.msp ?? 0,
  }))
}

export async function recalculateRanks(campaignId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  // Fetch all participants ordered by MSP
  const { data: participants, error: fetchError } = await supabase
    .from('participants')
    .select('id, msp')
    .eq('campaign_id', campaignId)
    .order('msp', { ascending: false })

  if (fetchError || !participants) {
    console.error('Failed to fetch participants for ranking:', fetchError)
    return false
  }

  const participantList = participants as Array<{ id: string; msp: number }>

  // Update ranks
  for (let i = 0; i < participantList.length; i++) {
    const updateData: ParticipantUpdate = { rank: i + 1 }
    const { error } = await supabase
      .from('participants')
      .update(updateData as never)
      .eq('id', participantList[i].id)

    if (error) {
      console.error('Failed to update rank:', error)
    }
  }

  return true
}
