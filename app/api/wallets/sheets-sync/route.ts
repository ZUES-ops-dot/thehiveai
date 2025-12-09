import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getAllCampaigns } from '@/lib/supabase/campaigns'
import type { Participant } from '@/lib/supabase/types'

/**
 * POST /api/wallets/sheets-sync
 * Syncs wallet data to Google Sheets via Apps Script Web App
 * Protected by x-cron-secret header
 * 
 * Requires GOOGLE_SHEETS_WEBHOOK_URL environment variable
 * pointing to a deployed Google Apps Script web app
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for admin access
  const cronSecret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'GOOGLE_SHEETS_WEBHOOK_URL not configured' },
      { status: 500 }
    )
  }

  const supabase = getSupabaseServerClient()

  // Fetch all campaigns
  const campaigns = await getAllCampaigns()
  const campaignMap = new Map(campaigns.map(c => [c.id, c]))

  // Fetch all participants with wallets
  type WalletRow = Pick<
    Participant,
    'campaign_id' | 'user_id' | 'username' | 'display_name' | 'wallet_address' | 'msp' | 'rank'
  >

  const { data, error } = await supabase
    .from('participants')
    .select('campaign_id, user_id, username, display_name, wallet_address, msp, rank')
    .not('wallet_address', 'is', null)
    .order('campaign_id')
    .order('msp', { ascending: false })
    .returns<WalletRow[]>()

  if (error) {
    console.error('Failed to fetch wallets for sync:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }

  // Format data for Google Sheets
  const rows = (data ?? []).map((row, index) => {
    const campaign = campaignMap.get(row.campaign_id)
    return [
      index + 1, // Row number
      campaign?.name ?? 'Unknown',
      campaign?.project_tag ?? 'unknown',
      row.username,
      row.display_name,
      row.wallet_address,
      row.msp ?? 0,
      row.rank ?? 0,
      new Date().toISOString(),
    ]
  })

  // Send to Google Sheets webhook
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_wallets',
        headers: ['#', 'Campaign', 'Tag', 'Username', 'Display Name', 'Wallet Address', 'MSP', 'Rank', 'Synced At'],
        rows,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Google Sheets webhook error:', text)
      return NextResponse.json(
        { error: 'Failed to sync to Google Sheets', details: text },
        { status: 502 }
      )
    }

    const result = await response.json().catch(() => ({}))

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      syncedAt: new Date().toISOString(),
      sheetsResponse: result,
    })
  } catch (err) {
    console.error('Failed to call Google Sheets webhook:', err)
    return NextResponse.json(
      { error: 'Failed to connect to Google Sheets webhook' },
      { status: 502 }
    )
  }
}
