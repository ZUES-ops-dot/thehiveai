// lib/types/persona.ts
// Types for Hive Persona v2 AI system

export type PersonaMode = 'calm' | 'oracle' | 'overmind'

export interface PersonaResponse {
  text: string
  confidence: number
  safe: boolean
  meta?: {
    model?: string
    tokenUsage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    } | null
  }
  timestamp: string
}

export interface PersonaAuditEntry {
  id: string
  query: string
  responseText: string
  confidence: number
  safe: boolean
  context: Record<string, any>
  timestamp: string
  userId?: string
  sessionId?: string
}

export interface PersonaRequest {
  query: string
  context?: {
    narrativeId?: string
    creatorId?: string
    topCreators?: string[]
    recentActivity?: string[]
    marketState?: 'bullish' | 'bearish' | 'neutral'
    pageContext?: string
  }
  mode?: PersonaMode
  maxTokens?: number
  temperature?: number
}

export interface PersonaInsight {
  summary: string
  whyItMatters: string
  signals: string[]
  recommendations: string[]
  confidence: number
  disclaimer?: string
}

// Structured response parsing
export function parsePersonaInsight(text: string): PersonaInsight {
  // Default structure
  const insight: PersonaInsight = {
    summary: text,
    whyItMatters: '',
    signals: [],
    recommendations: [],
    confidence: 50,
  }

  // Try to extract confidence from text
  const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i)
  if (confidenceMatch) {
    insight.confidence = parseInt(confidenceMatch[1], 10)
  }

  // Extract bullet points as signals
  const bullets = text.match(/[-•]\s+([^\n]+)/g)
  if (bullets) {
    insight.signals = bullets.map(b => b.replace(/^[-•]\s+/, '').trim())
  }

  return insight
}
