import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { getAllCampaigns } from '@/lib/supabase/campaigns'
import type { Participant } from '@/lib/supabase/types'

/**
 * GET /api/wallets/export
 * Returns all wallets across all campaigns for Google Sheets sync
 * Protected by x-cron-secret header
 * 
 * Query params:
 * - format: 'json' (default) or 'csv'
 * - campaignId: optional filter for specific campaign
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for admin access
  const cronSecret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServerClient()
  const format = request.nextUrl.searchParams.get('format') ?? 'json'
  const campaignIdFilter = request.nextUrl.searchParams.get('campaignId')

  // Fetch all campaigns for reference
  const campaigns = await getAllCampaigns()
  const campaignMap = new Map(campaigns.map(c => [c.id, c]))

  // Build query for participants with wallets
  type WalletExportRow = Pick<
    Participant,
    'campaign_id' | 'user_id' | 'username' | 'display_name' | 'wallet_address' | 'msp' | 'rank'
  >

  let query = supabase
    .from('participants')
    .select('campaign_id, user_id, username, display_name, wallet_address, msp, rank')
    .not('wallet_address', 'is', null)
    .order('campaign_id')
    .order('msp', { ascending: false })

  if (campaignIdFilter) {
    query = query.eq('campaign_id', campaignIdFilter)
  }

  const { data, error } = await query.returns<WalletExportRow[]>()

  if (error) {
    console.error('Failed to export wallets:', error)
    return NextResponse.json({ error: 'Failed to export wallets' }, { status: 500 })
  }

  const rows = (data ?? []).map((row, index) => {
    const campaign = campaignMap.get(row.campaign_id)
    return {
      rowNumber: index + 1,
      campaignId: row.campaign_id,
      campaignName: campaign?.name ?? 'Unknown',
      projectTag: campaign?.project_tag ?? 'unknown',
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      walletAddress: row.wallet_address!,
      msp: row.msp ?? 0,
      rank: row.rank ?? 0,
    }
  })

  if (format === 'csv') {
    const csvHeader = 'Row,Campaign ID,Campaign Name,Project Tag,User ID,Username,Display Name,Wallet Address,MSP,Rank'
    const csvRows = rows.map(r =>
      `${r.rowNumber},"${r.campaignId}","${r.campaignName}","${r.projectTag}","${r.userId}","${r.username}","${r.displayName}","${r.walletAddress}",${r.msp},${r.rank}`
    )
    const csvContent = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="hive_wallets_export.csv"',
      },
    })
  }

  // Group by campaign for JSON format
  const byCampaign = new Map<string, typeof rows>()
  for (const row of rows) {
    const existing = byCampaign.get(row.campaignId) ?? []
    existing.push(row)
    byCampaign.set(row.campaignId, existing)
  }

  const campaignExports = Array.from(byCampaign.entries()).map(([campaignId, wallets]) => {
    const campaign = campaignMap.get(campaignId)
    return {
      campaignId,
      campaignName: campaign?.name ?? 'Unknown',
      projectTag: campaign?.project_tag ?? 'unknown',
      totalWallets: wallets.length,
      wallets: wallets.map(w => ({
        rowNumber: w.rowNumber,
        username: w.username,
        displayName: w.displayName,
        walletAddress: w.walletAddress,
        msp: w.msp,
        rank: w.rank,
      })),
    }
  })

  return NextResponse.json({
    totalWallets: rows.length,
    totalCampaigns: campaignExports.length,
    campaigns: campaignExports,
    exportedAt: new Date().toISOString(),
  })
}
