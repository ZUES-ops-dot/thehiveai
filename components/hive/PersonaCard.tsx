'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { popIn, globalTransition } from '@/lib/motion/presets'
import { getConfidenceLevel } from '@/lib/persona/utils'
import type { PersonaResponse } from '@/lib/types/persona'

interface PersonaCardProps {
  query: string
  context?: Record<string, any>
  className?: string
  autoFetch?: boolean
}

export function PersonaCard({ 
  query, 
  context, 
  className,
  autoFetch = true 
}: PersonaCardProps) {
  const [response, setResponse] = useState<PersonaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const prefersReduced = usePrefersReducedMotion()

  const fetchInsight = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch insight')
      }

      const data: PersonaResponse = await res.json()
      setResponse(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [query, context])

  // Auto-fetch on mount if enabled
  useState(() => {
    if (autoFetch && query) {
      fetchInsight()
    }
  })

  const confidenceInfo = response ? getConfidenceLevel(response.confidence) : null

  const motionProps = prefersReduced ? {} : {
    initial: 'hidden',
    animate: 'visible',
    variants: popIn,
  }

  return (
    <motion.div
      {...motionProps}
      className={cn(
        'hive-card hive-card-cyan p-4 relative overflow-hidden',
        className
      )}
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-hive-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start gap-3 relative z-10">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hive-cyan to-hive-amber flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Hive Insight</h4>
              {response && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded',
                  confidenceInfo?.color,
                  'bg-white/5'
                )}>
                  {response.confidence}% {confidenceInfo?.label}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchInsight}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Refresh insight"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={globalTransition}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {/* Loading state */}
                  {loading && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-hive-cyan/30 border-t-hive-cyan rounded-full animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-400">{error}</p>
                        <button 
                          onClick={fetchInsight}
                          className="text-xs text-red-400/70 hover:text-red-400 mt-1"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  {response && !loading && (
                    <>
                      {/* Safety indicator */}
                      {!response.safe && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                          <span className="text-[10px] text-yellow-400">
                            Low confidence — treat as directional only
                          </span>
                        </div>
                      )}

                      {/* Response text */}
                      <div 
                        className="text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: response.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>') 
                        }} 
                      />

                      {/* Meta info */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          {response.safe ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Info className="w-3 h-3 text-yellow-400" />
                          )}
                          <span>{confidenceInfo?.description}</span>
                        </div>
                        <span>
                          {new Date(response.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Initial state */}
                  {!response && !loading && !error && (
                    <button
                      onClick={fetchInsight}
                      className="w-full py-3 rounded-lg bg-hive-cyan/10 border border-hive-cyan/20 text-hive-cyan text-sm font-medium hover:bg-hive-cyan/20 transition-colors"
                    >
                      Get Hive Insight
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default PersonaCard
