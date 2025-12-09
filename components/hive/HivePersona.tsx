'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Eye, MessageSquare, Lightbulb } from 'lucide-react'
import { useHiveMotion } from '@/lib/stores/useHiveMotion'

// ============================================
// HIVE PERSONA - The Voice of the Hive
// AI-like personality that observes and comments
// ============================================

interface Insight {
  id: string
  type: 'observation' | 'alert' | 'insight' | 'question' | 'prediction'
  message: string
  confidence?: number
  timestamp: Date
}

const insightIcons = {
  observation: Eye,
  alert: Sparkles,
  insight: Lightbulb,
  question: MessageSquare,
  prediction: Brain,
}

const insightColors = {
  observation: 'text-hive-cyan',
  alert: 'text-hive-amber',
  insight: 'text-hive-purple',
  question: 'text-gray-400',
  prediction: 'text-emerald-400',
}

// Mock insights based on market state
const mockInsights: Record<string, Insight[]> = {
  growth: [
    { id: '1', type: 'observation', message: 'Detecting strong accumulation patterns across DeFi tokens', timestamp: new Date() },
    { id: '2', type: 'insight', message: 'Smart money is rotating from memecoins to infrastructure plays', confidence: 0.78, timestamp: new Date() },
    { id: '3', type: 'prediction', message: 'Narrative momentum suggests continued growth for 48-72 hours', confidence: 0.65, timestamp: new Date() },
  ],
  volatility: [
    { id: '1', type: 'alert', message: 'Unusual divergence between sentiment and price action detected', timestamp: new Date() },
    { id: '2', type: 'observation', message: 'Influencer activity spiking - possible coordinated campaign', timestamp: new Date() },
    { id: '3', type: 'question', message: 'Are whales accumulating or distributing? Signal unclear...', timestamp: new Date() },
  ],
  hype: [
    { id: '1', type: 'alert', message: '🔥 Viral cascade in progress - engagement up 340%', timestamp: new Date() },
    { id: '2', type: 'insight', message: 'This pattern resembles early $BONK momentum', confidence: 0.72, timestamp: new Date() },
    { id: '3', type: 'observation', message: 'New accounts flooding the conversation - bot activity likely', timestamp: new Date() },
  ],
  fear: [
    { id: '1', type: 'alert', message: '⚠️ Sentiment deteriorating rapidly across all clusters', timestamp: new Date() },
    { id: '2', type: 'observation', message: 'Influencers going silent - historically a bearish signal', timestamp: new Date() },
    { id: '3', type: 'insight', message: 'Fear spikes often precede buying opportunities', confidence: 0.58, timestamp: new Date() },
  ],
  neutral: [
    { id: '1', type: 'observation', message: 'The hive is calm. Monitoring for emerging signals...', timestamp: new Date() },
    { id: '2', type: 'question', message: 'Which narrative will capture attention next?', timestamp: new Date() },
    { id: '3', type: 'insight', message: 'Low volatility periods often precede major moves', confidence: 0.62, timestamp: new Date() },
  ],
}

interface HivePersonaProps {
  className?: string
  autoRotate?: boolean
  rotateInterval?: number
}

export function HivePersona({ 
  className = '',
  autoRotate = true,
  rotateInterval = 10000
}: HivePersonaProps) {
  const { marketState, mood } = useHiveMotion()
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null)
  const [isThinking, setIsThinking] = useState(false)

  const getRandomInsight = useCallback(() => {
    const insights = mockInsights[marketState] || mockInsights.neutral
    return insights[Math.floor(Math.random() * insights.length)]
  }, [marketState])

  const generateNewInsight = useCallback(() => {
    setIsThinking(true)
    setTimeout(() => {
      setCurrentInsight({
        ...getRandomInsight(),
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      })
      setIsThinking(false)
    }, 1500)
  }, [getRandomInsight])

  // Auto-rotate insights
  useEffect(() => {
    if (!autoRotate) return
    
    generateNewInsight()
    const interval = setInterval(generateNewInsight, rotateInterval)
    return () => clearInterval(interval)
  }, [autoRotate, rotateInterval, generateNewInsight])

  // Regenerate on market state change
  useEffect(() => {
    generateNewInsight()
  }, [marketState, generateNewInsight])

  const Icon = currentInsight ? insightIcons[currentInsight.type] : Brain
  const colorClass = currentInsight ? insightColors[currentInsight.type] : 'text-hive-amber'

  return (
    <motion.div
      className={`relative p-4 rounded-xl border border-hive-amber/20 bg-gradient-to-br from-hive-amber/5 to-transparent backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="relative"
          animate={isThinking ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: isThinking ? Infinity : 0, ease: 'linear' }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hive-amber to-hive-cyan flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-hive-amber"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <div>
          <h3 className="font-semibold text-white">Hive Mind</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              mood === 'calm' ? 'text-hive-cyan' :
              mood === 'alert' ? 'text-hive-amber' :
              mood === 'excited' ? 'text-pink-400' : 'text-rose-400'
            }`}>
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{marketState}</span>
          </div>
        </div>
      </div>

      {/* Insight Display */}
      <AnimatePresence mode="wait">
        {isThinking ? (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-4"
          >
            <motion.div
              className="flex gap-1"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-hive-amber"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
            <span className="text-sm text-gray-400">Analyzing patterns...</span>
          </motion.div>
        ) : currentInsight ? (
          <motion.div
            key={currentInsight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 ${colorClass}`} />
              <p className="text-sm text-gray-200 leading-relaxed">
                {currentInsight.message}
              </p>
            </div>
            
            {currentInsight.confidence && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-xs text-gray-500">Confidence:</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-hive-amber to-hive-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentInsight.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {Math.round(currentInsight.confidence * 100)}%
                </span>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Bottom glow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  )
}
