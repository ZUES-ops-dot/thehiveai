// lib/persona/audit.ts
// Lightweight audit logger for Persona queries (file-based for dev)
// In production, replace with database (Postgres, Supabase, etc.)

import fs from 'fs'
import path from 'path'
import type { PersonaAuditEntry } from '@/lib/types/persona'

const AUDIT_DIR = path.join(process.cwd(), 'data')
const AUDIT_PATH = path.join(AUDIT_DIR, 'persona-audit.json')
const MAX_ENTRIES = 200 // Keep last 200 entries to avoid unbounded growth

/**
 * Log a persona query and response for auditing
 */
export async function logAudit(entry: PersonaAuditEntry): Promise<void> {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true })
    }

    // Read existing entries
    let entries: PersonaAuditEntry[] = []
    if (fs.existsSync(AUDIT_PATH)) {
      const data = fs.readFileSync(AUDIT_PATH, 'utf-8')
      entries = JSON.parse(data)
    }

    // Add new entry at the beginning
    entries.unshift({
      ...entry,
      // Truncate long responses to save space
      responseText: entry.responseText.slice(0, 2000),
    })

    // Keep only recent entries
    const truncated = entries.slice(0, MAX_ENTRIES)

    // Write back
    fs.writeFileSync(AUDIT_PATH, JSON.stringify(truncated, null, 2))
  } catch (error) {
    console.error('[Audit] Failed to write audit log:', error)
    // Don't throw - audit failure shouldn't break the main flow
  }
}

/**
 * Read recent audit entries (for admin/debugging)
 */
export async function getRecentAudits(limit = 20): Promise<PersonaAuditEntry[]> {
  try {
    if (!fs.existsSync(AUDIT_PATH)) {
      return []
    }

    const data = fs.readFileSync(AUDIT_PATH, 'utf-8')
    const entries: PersonaAuditEntry[] = JSON.parse(data)
    return entries.slice(0, limit)
  } catch (error) {
    console.error('[Audit] Failed to read audit log:', error)
    return []
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(): Promise<{
  totalQueries: number
  avgConfidence: number
  safeResponses: number
  unsafeResponses: number
  queriesLast24h: number
}> {
  try {
    if (!fs.existsSync(AUDIT_PATH)) {
      return {
        totalQueries: 0,
        avgConfidence: 0,
        safeResponses: 0,
        unsafeResponses: 0,
        queriesLast24h: 0,
      }
    }

    const data = fs.readFileSync(AUDIT_PATH, 'utf-8')
    const entries: PersonaAuditEntry[] = JSON.parse(data)

    const now = Date.now()
    const dayAgo = now - 24 * 60 * 60 * 1000

    const totalQueries = entries.length
    const avgConfidence = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length
      : 0
    const safeResponses = entries.filter(e => e.safe).length
    const unsafeResponses = entries.filter(e => !e.safe).length
    const queriesLast24h = entries.filter(e => 
      new Date(e.timestamp).getTime() > dayAgo
    ).length

    return {
      totalQueries,
      avgConfidence: Math.round(avgConfidence),
      safeResponses,
      unsafeResponses,
      queriesLast24h,
    }
  } catch (error) {
    console.error('[Audit] Failed to calculate stats:', error)
    return {
      totalQueries: 0,
      avgConfidence: 0,
      safeResponses: 0,
      unsafeResponses: 0,
      queriesLast24h: 0,
    }
  }
}

/**
 * Clear old audit entries (maintenance)
 */
export async function clearOldAudits(daysToKeep = 30): Promise<number> {
  try {
    if (!fs.existsSync(AUDIT_PATH)) {
      return 0
    }

    const data = fs.readFileSync(AUDIT_PATH, 'utf-8')
    const entries: PersonaAuditEntry[] = JSON.parse(data)

    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    const filtered = entries.filter(e => 
      new Date(e.timestamp).getTime() > cutoff
    )

    const removed = entries.length - filtered.length
    fs.writeFileSync(AUDIT_PATH, JSON.stringify(filtered, null, 2))

    return removed
  } catch (error) {
    console.error('[Audit] Failed to clear old audits:', error)
    return 0
  }
}
