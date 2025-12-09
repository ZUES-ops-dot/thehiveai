import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/client'

/**
 * GET /api/integrations/moddio
 * Returns trending Moddio UGC projects and automation logs
 */

interface ModdioProject {
  id: string
  name: string
  genre: string
  players: number
  automationIdeas: string[]
}

interface AutomationLog {
  id: string
  platform: string
  entityId: string
  action: string
  status: string
  result: unknown
  runAt: string
}

interface ModdioResponse {
  projects: ModdioProject[]
  automationLogs: AutomationLog[]
  lastUpdated: string
}

// Mock data - replace with real Moddio scraping
const mockProjects: ModdioProject[] = [
  {
    id: 'mod-1',
    name: 'Zombie Survival Arena',
    genre: 'Survival',
    players: 2340,
    automationIdeas: ['Auto-test wave difficulty', 'Monitor player retention', 'Analyze weapon balance'],
  },
  {
    id: 'mod-2',
    name: 'Racing Mayhem',
    genre: 'Racing',
    players: 1850,
    automationIdeas: ['Auto-test track layouts', 'Benchmark vehicle physics', 'Record lap times'],
  },
  {
    id: 'mod-3',
    name: 'Tower Defense Pro',
    genre: 'Strategy',
    players: 3200,
    automationIdeas: ['Auto-test tower combinations', 'Analyze enemy pathing', 'Optimize difficulty curve'],
  },
  {
    id: 'mod-4',
    name: 'Pixel Platformer',
    genre: 'Platformer',
    players: 980,
    automationIdeas: ['Auto-test level completion', 'Check collision detection', 'Measure speedrun routes'],
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()

    // Fetch recent automation logs for Moddio
    type LogRow = {
      id: string
      platform: string
      entity_id: string
      action: string
      status: string
      result: unknown
      run_at: string
    }

    const { data: logs } = await supabase
      .from('automation_logs')
      .select('id, platform, entity_id, action, status, result, run_at')
      .eq('platform', 'moddio')
      .order('run_at', { ascending: false })
      .limit(20)
      .returns<LogRow[]>()

    const automationLogs: AutomationLog[] = (logs ?? []).map((log) => ({
      id: log.id,
      platform: log.platform,
      entityId: log.entity_id,
      action: log.action,
      status: log.status,
      result: log.result,
      runAt: log.run_at,
    }))

    const response: ModdioResponse = {
      projects: mockProjects,
      automationLogs,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    })
  } catch (error) {
    console.error('Moddio API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Moddio data' }, { status: 500 })
  }
}

/**
 * POST /api/integrations/moddio
 * Trigger an automation run for a Moddio project
 */
export async function POST(request: NextRequest) {
  try {
    const encodedUser = request.headers.get('x-hive-user')
    let runBy: string | null = null
    if (encodedUser) {
      try {
        const user = JSON.parse(decodeURIComponent(encodedUser))
        runBy = user.id
      } catch {
        // Continue without user
      }
    }

    const body = await request.json()
    const { projectId, projectName, action } = body

    if (!projectId || !action) {
      return NextResponse.json({ error: 'Missing projectId or action' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Insert a new automation log entry with status 'queued'
    const { data, error } = await supabase
      .from('automation_logs')
      .insert({
        platform: 'moddio',
        entity_id: projectId,
        action,
        status: 'queued',
        run_by: runBy,
        metadata: { projectName },
      } as never)
      .select('id')
      .returns<Array<{ id: string }>>()
      .single()

    if (error) {
      console.error('Failed to create automation log:', error)
      return NextResponse.json({ error: 'Failed to queue automation' }, { status: 500 })
    }

    // TODO: Trigger actual Playwright worker here
    // For now, simulate by updating status to 'running' after a delay

    return NextResponse.json({
      success: true,
      logId: data?.id,
      status: 'queued',
      message: `Automation "${action}" queued for ${projectName || projectId}`,
    })
  } catch (error) {
    console.error('Moddio automation error:', error)
    return NextResponse.json({ error: 'Failed to trigger automation' }, { status: 500 })
  }
}
