// app/api/persona/route.ts
// Hive Persona v2 — Serverless API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { buildPersonaPrompt, buildContextPrompt } from '@/lib/persona/prompts'
import { logAudit } from '@/lib/persona/audit'
import { evaluateConfidence, detectPotentialHallucination, sanitizeResponse } from '@/lib/persona/utils'
import type { PersonaRequest, PersonaResponse } from '@/lib/types/persona'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.PERSONA_MODEL || 'gpt-4o-mini'

// Rate limiting (simple in-memory for dev)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // requests per window
const RATE_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimits.get(ip)

  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body: PersonaRequest = await req.json()
    
    if (!body?.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid query' },
        { status: 400 }
      )
    }

    // Limit query length
    const query = body.query.slice(0, 1000)

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      // Return mock response for development without API key
      const mockResponse: PersonaResponse = {
        text: `**Summary**: This is a mock response because no API key is configured.\n\n**Why It Matters**: Configure OPENAI_API_KEY in your environment to enable real AI responses.\n\n**Signals Used**:\n- Mock mode active\n- No LLM connection\n\n**Recommended Actions**:\n- Add OPENAI_API_KEY to .env.local\n- Restart the dev server\n\nConfidence: 100%`,
        confidence: 100,
        safe: true,
        meta: { model: 'mock' },
        timestamp: new Date().toISOString(),
      }
      return NextResponse.json(mockResponse)
    }

    // Build prompts
    const systemPrompt = buildPersonaPrompt(body.mode || 'oracle')
    const contextPrompt = body.context?.pageContext 
      ? buildContextPrompt(body.context.pageContext, body.context)
      : ''

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          `User Query: ${query}`,
          contextPrompt ? `\nContext:\n${contextPrompt}` : '',
          body.context ? `\nAdditional Data:\n${JSON.stringify(body.context, null, 2)}` : '',
        ].filter(Boolean).join('\n')
      },
    ]

    // Call OpenAI
    const llmResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: body.maxTokens || 600,
        temperature: body.temperature || 0.3,
        top_p: 0.95,
      }),
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error('[Persona] LLM error:', errorText)
      return NextResponse.json(
        { error: 'AI service error', details: errorText },
        { status: 502 }
      )
    }

    const payload = await llmResponse.json()
    const rawText = payload.choices?.[0]?.message?.content ?? ''

    // Safety checks
    const confidence = evaluateConfidence(rawText)
    const hasHallucination = detectPotentialHallucination(rawText, body.context || {})
    const hasUncertainty = /I don't know|I am not sure|unable to find|no data/i.test(rawText)
    const safe = !hasHallucination && !hasUncertainty

    // Sanitize response
    const cleanText = sanitizeResponse(rawText)

    // Build response
    const response: PersonaResponse = {
      text: cleanText,
      confidence: hasHallucination ? Math.min(confidence, 40) : confidence,
      safe,
      meta: {
        model: MODEL,
        tokenUsage: payload.usage || null,
      },
      timestamp: new Date().toISOString(),
    }

    // Log to audit (async, don't block response)
    logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      query,
      responseText: response.text,
      confidence: response.confidence,
      safe: response.safe,
      context: body.context || {},
      timestamp: response.timestamp,
    }).catch(err => console.error('[Persona] Audit error:', err))

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Persona] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    model: MODEL,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
  })
}
