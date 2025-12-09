'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/utils/api'

// ─────────────────────────────────────────────────────────────────────────────
// Play Solana Types & Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface SolanaGame {
  id: string
  name: string
  players: number
  tvl: number
  quests: string[]
  tags: string[]
}

export interface OnChainEvent {
  id: string
  type: string
  description: string
  occurredAt: string
}

export interface AgentRecommendation {
  id: string
  title: string
  description: string
  action: string
}

export interface PlaySolanaData {
  games: SolanaGame[]
  onChainEvents: OnChainEvent[]
  agentRecommendations: AgentRecommendation[]
  lastUpdated: string
}

export function usePlaySolanaStats() {
  return useQuery({
    queryKey: ['integrations', 'play-solana'],
    queryFn: () => fetchJson<PlaySolanaData>('/api/integrations/play-solana'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Indie.fun Types & Hooks
// ─────────────────────────────────────────────────────────────────────────────

export interface Devlog {
  id: string
  title: string
  author: string
  tags: string[]
  url: string
  summary: string
  publishedAt: string
  source: string
}

export interface IndieFunData {
  devlogs: Devlog[]
  lastUpdated: string
}

export function useIndieDigest() {
  return useQuery({
    queryKey: ['integrations', 'indie-fun'],
    queryFn: () => fetchJson<IndieFunData>('/api/integrations/indie-fun'),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  })
}

export function useSaveDevlogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['integrations', 'indie-fun', 'save'],
    mutationFn: async (devlog: Devlog) => {
      return fetchJson('/api/integrations/indie-fun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devlog }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'indie-fun'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Moddio Types & Hooks
// ─────────────────────────────────────────────────────────────────────────────

export interface ModdioProject {
  id: string
  name: string
  genre: string
  players: number
  automationIdeas: string[]
}

export interface AutomationLogEntry {
  id: string
  platform: string
  entityId: string
  action: string
  status: string
  result: unknown
  runAt: string
}

export interface ModdioData {
  projects: ModdioProject[]
  automationLogs: AutomationLogEntry[]
  lastUpdated: string
}

export function useModdioAutomation() {
  return useQuery({
    queryKey: ['integrations', 'moddio'],
    queryFn: () => fetchJson<ModdioData>('/api/integrations/moddio'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

export function useTriggerAutomationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['integrations', 'moddio', 'trigger'],
    mutationFn: async ({
      projectId,
      projectName,
      action,
    }: {
      projectId: string
      projectName: string
      action: string
    }) => {
      return fetchJson('/api/integrations/moddio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName, action }),
      })
    },
    onSuccess: () => {
      // Refetch automation logs after triggering
      queryClient.invalidateQueries({ queryKey: ['integrations', 'moddio'] })
    },
  })
}
