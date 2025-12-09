/**
 * Connected Accounts Supabase helpers
 * Manages X accounts linked to a user for tracking/filtering
 */

import { getSupabaseServerClient } from './client'
import type { ConnectedAccount, Database } from './types'

type ConnectedAccountInsert = Database['public']['Tables']['connected_accounts']['Insert']
type ConnectedAccountUpdate = Database['public']['Tables']['connected_accounts']['Update']

export interface ConnectAccountInput {
  ownerUserId: string
  xUserId: string
  handle: string
  displayName: string
  profileImageUrl?: string
  followersCount?: number
}

/**
 * Get all active connected accounts for a user
 */
export async function getConnectedAccounts(ownerUserId: string): Promise<ConnectedAccount[]> {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .eq('active', true)
    .order('connected_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch connected accounts:', error)
    throw error
  }

  return (data ?? []) as ConnectedAccount[]
}

/**
 * Get just the X user IDs for filtering queries
 */
export async function getConnectedAccountIds(ownerUserId: string): Promise<string[]> {
  const accounts = await getConnectedAccounts(ownerUserId)
  return accounts.map(a => a.x_user_id)
}

/**
 * Get connected account handles for display/filtering
 */
export async function getConnectedAccountHandles(ownerUserId: string): Promise<string[]> {
  const accounts = await getConnectedAccounts(ownerUserId)
  return accounts.map(a => a.handle.toLowerCase())
}

/**
 * Connect a new X account to the user
 * Will fail if user already has 3 active accounts (enforced by DB trigger)
 */
export async function connectAccount(input: ConnectAccountInput): Promise<ConnectedAccount> {
  const supabase = getSupabaseServerClient()

  const insertData: ConnectedAccountInsert = {
    owner_user_id: input.ownerUserId,
    x_user_id: input.xUserId,
    handle: input.handle,
    display_name: input.displayName,
    profile_image_url: input.profileImageUrl,
    followers_count: input.followersCount ?? 0,
    active: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('connected_accounts') as any)
    .upsert(insertData, {
      onConflict: 'owner_user_id,x_user_id',
    })
    .select()
    .single()

  if (error) {
    // Check for max accounts error
    if (error.message?.includes('Maximum of 3')) {
      throw new Error('You can only connect up to 3 X accounts')
    }
    console.error('Failed to connect account:', error)
    throw error
  }

  return data as ConnectedAccount
}

/**
 * Disconnect (deactivate) an account
 */
export async function disconnectAccount(ownerUserId: string, xUserId: string): Promise<void> {
  const supabase = getSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('connected_accounts') as any)
    .update({ active: false } as ConnectedAccountUpdate)
    .eq('owner_user_id', ownerUserId)
    .eq('x_user_id', xUserId)

  if (error) {
    console.error('Failed to disconnect account:', error)
    throw error
  }
}

/**
 * Reactivate a previously disconnected account
 */
export async function reactivateAccount(ownerUserId: string, xUserId: string): Promise<void> {
  const supabase = getSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('connected_accounts') as any)
    .update({ active: true } as ConnectedAccountUpdate)
    .eq('owner_user_id', ownerUserId)
    .eq('x_user_id', xUserId)

  if (error) {
    // Check for max accounts error
    if (error.message?.includes('Maximum of 3')) {
      throw new Error('You can only have 3 active accounts. Disconnect one first.')
    }
    console.error('Failed to reactivate account:', error)
    throw error
  }
}

/**
 * Update account metadata (e.g., followers count refresh)
 */
export async function updateAccountMetadata(
  ownerUserId: string,
  xUserId: string,
  updates: {
    displayName?: string
    profileImageUrl?: string
    followersCount?: number
  }
): Promise<void> {
  const supabase = getSupabaseServerClient()

  const updateData: ConnectedAccountUpdate = {}
  if (updates.displayName !== undefined) updateData.display_name = updates.displayName
  if (updates.profileImageUrl !== undefined) updateData.profile_image_url = updates.profileImageUrl
  if (updates.followersCount !== undefined) updateData.followers_count = updates.followersCount

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('connected_accounts') as any)
    .update(updateData)
    .eq('owner_user_id', ownerUserId)
    .eq('x_user_id', xUserId)

  if (error) {
    console.error('Failed to update account metadata:', error)
    throw error
  }
}

/**
 * Check if a specific X user ID is connected to the owner
 */
export async function isAccountConnected(ownerUserId: string, xUserId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id')
    .eq('owner_user_id', ownerUserId)
    .eq('x_user_id', xUserId)
    .eq('active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Failed to check account connection:', error)
  }

  return !!data
}

/**
 * Get count of active connected accounts
 */
export async function getConnectedAccountCount(ownerUserId: string): Promise<number> {
  const supabase = getSupabaseServerClient()

  const { count, error } = await supabase
    .from('connected_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('owner_user_id', ownerUserId)
    .eq('active', true)

  if (error) {
    console.error('Failed to count connected accounts:', error)
    return 0
  }

  return count ?? 0
}
