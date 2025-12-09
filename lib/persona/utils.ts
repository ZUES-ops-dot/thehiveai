// lib/persona/utils.ts
// Confidence scoring and anti-hallucination utilities

/**
 * Evaluate confidence based on response characteristics
 * Uses heuristics to estimate how confident the AI is
 */
export function evaluateConfidence(text: string): number {
  // Hedging phrases that indicate uncertainty
  const hedgingPatterns = [
    /may|might|possibly|could be|perhaps/gi,
    /I am not sure|I don't know|uncertain|unclear/gi,
    /unable to (find|determine|verify)/gi,
    /no (data|information) available/gi,
    /speculation|speculative/gi,
  ]

  // Strong confidence indicators
  const confidencePatterns = [
    /clearly|definitely|certainly|obviously/gi,
    /data shows|evidence indicates|metrics confirm/gi,
    /based on \d+ (signals|data points|observations)/gi,
  ]

  // Base score from length (longer, more detailed responses tend to be more confident)
  const lengthScore = Math.min(40, Math.floor(text.length / 25))
  
  // Penalty for hedging language
  let hedgePenalty = 0
  hedgingPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      hedgePenalty += matches.length * 8
    }
  })

  // Bonus for confidence indicators
  let confidenceBonus = 0
  confidencePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      confidenceBonus += matches.length * 5
    }
  })

  // Check for explicit confidence statement in response
  const explicitConfidence = text.match(/confidence[:\s]+(\d+)/i)
  if (explicitConfidence) {
    const stated = parseInt(explicitConfidence[1], 10)
    // Weight explicit confidence heavily but cap it
    return Math.min(98, Math.max(10, stated))
  }

  // Calculate final score
  const baseScore = 50 + lengthScore + confidenceBonus - hedgePenalty
  return Math.max(15, Math.min(95, baseScore))
}

/**
 * Check if response contains potential hallucinations
 */
export function detectPotentialHallucination(text: string, context: Record<string, any>): boolean {
  // Check for specific numbers that weren't in context
  const numberPattern = /\b\d{4,}\b/g // Numbers with 4+ digits
  const numbers = text.match(numberPattern) || []
  
  const contextStr = JSON.stringify(context)
  const suspiciousNumbers = numbers.filter(num => !contextStr.includes(num))
  
  // If response includes many specific numbers not from context, flag it
  if (suspiciousNumbers.length > 3) {
    return true
  }

  // Check for specific dates/times not in context
  const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
  const dates = text.match(datePattern) || []
  const suspiciousDates = dates.filter(date => !contextStr.includes(date))
  
  if (suspiciousDates.length > 1) {
    return true
  }

  return false
}

/**
 * Sanitize response for display
 */
export function sanitizeResponse(text: string): string {
  // Remove any potential script injection
  let cleaned = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  // Convert markdown-style formatting to simple text
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`(.*?)`/g, '$1') // Code
  
  return cleaned.trim()
}

/**
 * Extract key insights from response
 */
export function extractInsights(text: string): {
  summary: string
  signals: string[]
  recommendations: string[]
} {
  const lines = text.split('\n').filter(line => line.trim())
  
  // Find summary (usually first paragraph or after "Summary:")
  let summary = ''
  const summaryMatch = text.match(/summary[:\s]*(.+?)(?:\n|$)/i)
  if (summaryMatch) {
    summary = summaryMatch[1].trim()
  } else if (lines.length > 0) {
    summary = lines[0].replace(/^\d+\.\s*\*?\*?summary\*?\*?[:\s]*/i, '').trim()
  }

  // Find bullet points for signals
  const signals: string[] = []
  const bulletPattern = /^[-•*]\s+(.+)$/gm
  let match
  while ((match = bulletPattern.exec(text)) !== null) {
    signals.push(match[1].trim())
  }

  // Find recommendations (look for action words)
  const recommendations: string[] = []
  const actionPattern = /(?:recommend|suggest|consider|should|action)[:\s]+(.+?)(?:\n|$)/gi
  while ((match = actionPattern.exec(text)) !== null) {
    recommendations.push(match[1].trim())
  }

  return { summary, signals, recommendations }
}

/**
 * Format confidence as visual indicator
 */
export function getConfidenceLevel(confidence: number): {
  label: string
  color: string
  description: string
} {
  if (confidence >= 85) {
    return {
      label: 'High',
      color: 'text-emerald-400',
      description: 'Based on strong signals and clear data patterns',
    }
  }
  if (confidence >= 65) {
    return {
      label: 'Medium',
      color: 'text-yellow-400',
      description: 'Based on available data with some uncertainty',
    }
  }
  if (confidence >= 40) {
    return {
      label: 'Low',
      color: 'text-orange-400',
      description: 'Limited data available, treat as directional only',
    }
  }
  return {
    label: 'Very Low',
    color: 'text-red-400',
    description: 'Insufficient data for reliable analysis',
  }
}
