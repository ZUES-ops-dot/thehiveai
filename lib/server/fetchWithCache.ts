import { getSupabaseServerClient } from '@/lib/supabase/client'

type CacheEntry = {
  key: string
  value: unknown
  expiresAt: number
}

// In-memory fallback cache (NOT for production; replace with Redis/KV)
const inMemoryCache = new Map<string, CacheEntry>()

/**
 * Fetch data with caching support.
 * Tries Supabase integration_cache table first, falls back to in-memory.
 */
export async function fetchWithCache<T>({
  key,
  loader,
  ttlSec = 300,
}: {
  key: string
  loader: () => Promise<T>
  ttlSec?: number
}): Promise<{ data: T; cached: boolean }> {
  const supabase = getSupabaseServerClient()

  // Try Supabase cache table first
  try {
    type CacheRow = { payload: unknown; expires_at: string }
    const { data: cachedRow } = await supabase
      .from('integration_cache')
      .select('payload, expires_at')
      .eq('key', key)
      .returns<CacheRow[]>()
      .single()

    if (cachedRow) {
      const expiresAt = new Date(cachedRow.expires_at).getTime()
      if (expiresAt > Date.now()) {
        return { data: cachedRow.payload as T, cached: true }
      }
    }
  } catch {
    // Ignore and fallback to in-memory
  }

  // Fallback in-memory
  const mem = inMemoryCache.get(key)
  if (mem && mem.expiresAt > Date.now()) {
    return { data: mem.value as T, cached: true }
  }

  // Load fresh data
  const data = await loader()

  // Save to Supabase cache (best-effort)
  try {
    await supabase
      .from('integration_cache')
      .upsert({
        key,
        payload: data,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
      } as never)
  } catch {
    // Ignore cache write failures
  }

  // Save to memory fallback
  inMemoryCache.set(key, {
    key,
    value: data,
    expiresAt: Date.now() + ttlSec * 1000,
  })

  return { data, cached: false }
}

/**
 * Invalidate a cache entry by key
 */
export async function invalidateCache(key: string): Promise<void> {
  inMemoryCache.delete(key)
  
  try {
    const supabase = getSupabaseServerClient()
    await supabase.from('integration_cache').delete().eq('key', key)
  } catch {
    // Ignore
  }
}
