import { getSupabaseServerClient } from './client'
import type { Database, Participant } from './types'
import { incrementParticipantStats, joinCampaign, recalculateRanks } from './participants'
import type { InviteMspBreakdown } from '@/lib/types/invite'

type InviteRedemptionRow = Database['public']['Tables']['invite_redemptions']['Row']
type InviteRedemptionInsert = Database['public']['Tables']['invite_redemptions']['Insert']
type ParticipantInsert = Database['public']['Tables']['participants']['Insert']

const INVITE_REWARDS_CAMPAIGN_ID = process.env.INVITE_REWARDS_CAMPAIGN_ID ?? ''

export interface InviteRedemptionPayload {
  inviterUserId: string
  inviterUsername?: string | null
  inviteeUserId: string
  inviteeUsername?: string | null
  mspAwarded: number
}

export interface InviteCookieData {
  inviterUserId: string
  inviterUsername?: string | null
}

export async function hasInviteBeenRedeemed(inviteeUserId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('invite_redemptions')
    .select('id')
    .eq('invitee_user_id', inviteeUserId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to check invite redemption:', error)
  }

  return !!data
}

export async function recordInviteRedemption(payload: InviteRedemptionPayload): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const baseInsert: InviteRedemptionInsert = {
    inviter_user_id: payload.inviterUserId,
    inviter_username: payload.inviterUsername ?? null,
    invitee_user_id: payload.inviteeUserId,
    invitee_username: payload.inviteeUsername ?? null,
    msp_awarded: payload.mspAwarded,
  }

  const insertWithFlag = { ...baseInsert, awarded_to_msp: true } satisfies InviteRedemptionInsert

  const { error } = await (supabase.from('invite_redemptions') as any).insert(insertWithFlag)

  if (!error) {
    return true
  }

  // 23505 = unique violation (already redeemed)
  if (error.code === '23505') {
    return false
  }

  // 42703 = undefined_column (migration not applied yet)
  if (error.code === '42703') {
    console.warn(
      'invite_redemptions.awarded_to_msp column missing. Please run the 0013_add_invite_awarded_flag migration.'
    )
    const retry = await (supabase.from('invite_redemptions') as any).insert(baseInsert)
    if (!retry.error) {
      return true
    }
    if (retry.error.code === '23505') {
      return false
    }
    console.error('Failed to record invite redemption after retry:', retry.error)
    return false
  }

  console.error('Failed to record invite redemption:', error)
  return false
}

export async function getInviteMspBreakdown(inviterUserId: string): Promise<InviteMspBreakdown> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('invite_redemptions')
    .select('msp_awarded, created_at')
    .eq('inviter_user_id', inviterUserId)

  if (error) {
    console.error('Failed to fetch invite redemptions:', error)
    return { total: 0, weekly: 0, monthly: 0, yearly: 0 }
  }

  const rows = (data ?? []) as Pick<InviteRedemptionRow, 'msp_awarded' | 'created_at'>[]
  if (rows.length === 0) {
    return { total: 0, weekly: 0, monthly: 0, yearly: 0 }
  }

  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  const yearAgo = now - 365 * 24 * 60 * 60 * 1000

  return rows.reduce<InviteMspBreakdown>(
    (acc, row) => {
      const createdAt = new Date(row.created_at).getTime()
      acc.total += row.msp_awarded
      if (createdAt >= weekAgo) acc.weekly += row.msp_awarded
      if (createdAt >= monthAgo) acc.monthly += row.msp_awarded
      if (createdAt >= yearAgo) acc.yearly += row.msp_awarded
      return acc
    },
    { total: 0, weekly: 0, monthly: 0, yearly: 0 }
  )
}

export async function redeemInviteBonus(payload: InviteRedemptionPayload): Promise<boolean> {
  if (!payload.inviterUserId || !payload.inviteeUserId) {
    return false
  }

  if (payload.inviterUserId === payload.inviteeUserId) {
    return false
  }

  const alreadyRedeemed = await hasInviteBeenRedeemed(payload.inviteeUserId)
  if (alreadyRedeemed) {
    return false
  }

  const recorded = await recordInviteRedemption(payload)
  if (!recorded) return false

  await awardInviteCampaignBonus(payload.inviterUserId, payload.inviterUsername, payload.mspAwarded)
  return true
}

export async function ensureInviteCampaignParticipant(userId: string, fallbackUsername?: string | null) {
  if (!INVITE_REWARDS_CAMPAIGN_ID) {
    console.warn('INVITE_REWARDS_CAMPAIGN_ID is not set; invite bonuses will not reflect in campaign stats.')
    return null
  }

  const supabase = getSupabaseServerClient()
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('campaign_id', INVITE_REWARDS_CAMPAIGN_ID)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return INVITE_REWARDS_CAMPAIGN_ID
  }

  const { data: profileSource } = await supabase
    .from('participants')
    .select('username, display_name, profile_image_url')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Participant, 'username' | 'display_name' | 'profile_image_url'>>()

  const username = profileSource?.username ?? fallbackUsername ?? 'inviter'
  const displayName = profileSource?.display_name ?? username
  const profileImageUrl = profileSource?.profile_image_url ?? null

  const insertData: ParticipantInsert = {
    campaign_id: INVITE_REWARDS_CAMPAIGN_ID,
    user_id: userId,
    username,
    display_name: displayName,
    profile_image_url: profileImageUrl,
    followers_count: 0,
    engagement_rate: 0,
    virality_score: 0,
    msp: 0,
    post_count: 0,
  }

  const { error } = await (supabase.from('participants') as any).insert(insertData)
  if (error) {
    console.error('Failed to seed invite rewards participant:', error)
    return null
  }

  return INVITE_REWARDS_CAMPAIGN_ID
}

async function awardInviteCampaignBonus(userId: string, fallbackUsername: string | null | undefined, msp: number) {
  const campaignId = await ensureInviteCampaignParticipant(userId, fallbackUsername)
  if (!campaignId) return

  const success = await incrementParticipantStats(campaignId, userId, msp, 0)
  if (!success) {
    console.warn('Failed to increment invite rewards participant stats for', userId)
    return
  }

  // Recalculate ranks for invite rewards campaign
  try {
    await recalculateRanks(campaignId)
  } catch (err) {
    console.warn('Failed to recalculate ranks for invite campaign:', err)
  }

  await propagateInviteBonusToCampaigns(userId, msp)
}

async function propagateInviteBonusToCampaigns(userId: string, msp: number) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('participants')
    .select('campaign_id')
    .eq('user_id', userId)
    .returns<Array<Pick<Participant, 'campaign_id'>>>()

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch user campaigns for invite propagation:', error)
    }
    return
  }

  const campaignIds = Array.from(
    new Set(
      data
        .map((row) => row.campaign_id)
        .filter((id): id is string => Boolean(id) && id !== INVITE_REWARDS_CAMPAIGN_ID)
    )
  )

  for (const campaignId of campaignIds) {
    const success = await incrementParticipantStats(campaignId, userId, msp, 0)
    if (!success) {
      console.warn('Failed to propagate invite MSP to campaign', campaignId, 'for user', userId)
    } else {
      // Recalculate ranks for this campaign
      try {
        await recalculateRanks(campaignId)
      } catch (err) {
        console.warn('Failed to recalculate ranks for campaign', campaignId, ':', err)
      }
    }
  }
}
