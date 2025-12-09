import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/integrations/play-solana
 * Returns Solana gaming ecosystem data (mock for now, ready for real API integration)
 */

interface SolanaGame {
  id: string
  name: string
  players: number
  tvl: number
  quests: string[]
  tags: string[]
}

interface OnChainEvent {
  id: string
  type: string
  description: string
  occurredAt: string
}

interface AgentRecommendation {
  id: string
  title: string
  description: string
  action: string
}

interface PlaySolanaResponse {
  games: SolanaGame[]
  onChainEvents: OnChainEvent[]
  agentRecommendations: AgentRecommendation[]
  lastUpdated: string
}

// Mock data - replace with real RPC/API calls
const mockGames: SolanaGame[] = [
  {
    id: 'star-atlas',
    name: 'Star Atlas',
    players: 12450,
    tvl: 2500000,
    quests: ['Daily Mining', 'Fleet Battle', 'Resource Trade'],
    tags: ['Space', 'Strategy', 'NFT'],
  },
  {
    id: 'aurory',
    name: 'Aurory',
    players: 8200,
    tvl: 1200000,
    quests: ['Arena Battle', 'Pet Training', 'Quest Chain'],
    tags: ['RPG', 'Adventure', 'Play-to-Earn'],
  },
  {
    id: 'genopets',
    name: 'Genopets',
    players: 15800,
    tvl: 800000,
    quests: ['Daily Steps', 'Habitat Upgrade', 'Battle Arena'],
    tags: ['Move-to-Earn', 'NFT', 'Fitness'],
  },
  {
    id: 'photo-finish',
    name: 'Photo Finish Live',
    players: 5600,
    tvl: 450000,
    quests: ['Daily Race', 'Horse Breeding', 'Tournament'],
    tags: ['Racing', 'Breeding', 'Betting'],
  },
]

const mockEvents: OnChainEvent[] = [
  {
    id: 'evt-1',
    type: 'tournament',
    description: 'Star Atlas Fleet Week Tournament started',
    occurredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'evt-2',
    type: 'launch',
    description: 'New Aurory expansion "Nefties Uprising" deployed',
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'evt-3',
    type: 'reward',
    description: 'Genopets Season 4 rewards distributed',
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

const mockRecommendations: AgentRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Auto-Test Star Atlas Mining',
    description: 'Run automated mining efficiency tests across different ship configurations',
    action: 'auto-test',
  },
  {
    id: 'rec-2',
    title: 'Monitor Aurory Arena Meta',
    description: 'Track win rates and popular team compositions in real-time',
    action: 'monitor',
  },
  {
    id: 'rec-3',
    title: 'Genopets Step Optimization',
    description: 'Analyze optimal step patterns for maximum XP gain',
    action: 'analyze',
  },
]

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real API calls to Solana RPC, game APIs, etc.
    // For now, return mock data

    const response: PlaySolanaResponse = {
      games: mockGames,
      onChainEvents: mockEvents,
      agentRecommendations: mockRecommendations,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Play Solana API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Solana gaming data' }, { status: 500 })
  }
}
