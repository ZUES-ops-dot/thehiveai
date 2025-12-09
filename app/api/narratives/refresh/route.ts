import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'
import { generateNarrativeAnalytics } from '@/lib/services/narratives/analytics'
import type { Campaign } from '@/lib/supabase/types'

function normalizeCampaignIds(single: string | null, multi: string | null): string[] {
  const ids = new Set<string>()
  if (single) ids.add(single)
  if (multi) {
    multi
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .forEach((id) => ids.add(id))
  }
  return Array.from(ids)
}

async function getActiveCampaignIds(): Promise<string[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('status', 'active')
    .returns<Pick<Campaign, 'id'>[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map((campaign) => campaign.id)
}

function verifyCronSecret(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) return
  const provided = request.headers.get('x-cron-secret')
  if (provided !== expectedSecret) {
    throw new Error('Unauthorized cron request')
  }
}

export async function POST(request: NextRequest) {
  try {
    verifyCronSecret(request)

    const searchParams = request.nextUrl.searchParams
    const lookbackDays = searchParams.get('lookbackDays')
    const maxKeywords = searchParams.get('maxKeywords')
    const maxAccounts = searchParams.get('maxAccounts')

    let campaignIds = normalizeCampaignIds(searchParams.get('campaignId'), searchParams.get('campaignIds'))

    if (campaignIds.length === 0) {
      campaignIds = await getActiveCampaignIds()
    }

    if (campaignIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No campaign IDs provided or active campaigns found.',
      }, { status: 400 })
    }

    const payloads = await generateNarrativeAnalytics({
      campaignIds,
      persist: true,
      lookbackDays: lookbackDays ? Number(lookbackDays) : undefined,
      maxKeywords: maxKeywords ? Number(maxKeywords) : undefined,
      maxAccounts: maxAccounts ? Number(maxAccounts) : undefined,
    })

    return NextResponse.json({
      success: true,
      campaignsProcessed: payloads.length,
      lastRunAt: new Date().toISOString(),
      sample: payloads.slice(0, 3),
    })
  } catch (error) {
    console.error('Narrative analytics refresh failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized cron request' ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
