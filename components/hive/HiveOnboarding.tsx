'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSoundEffects } from '@/lib/audio/useSoundEffects'

// ============================================
// ONBOARDING ANIMATION
// Spectacular landing sequence that sets the mood
// ============================================

interface HiveOnboardingProps {
  onComplete?: () => void
  skipEnabled?: boolean
}

export function HiveOnboarding({ onComplete, skipEnabled = true }: HiveOnboardingProps) {
  const [phase, setPhase] = useState<'dark' | 'particles' | 'hexagon' | 'crack' | 'emerge' | 'complete'>('dark')
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const { playTransition, playWave, playSuccess } = useSoundEffects()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const timeline = [
      { phase: 'particles' as const, delay: 500 },
      { phase: 'hexagon' as const, delay: 2000 },
      { phase: 'crack' as const, delay: 3500 },
      { phase: 'emerge' as const, delay: 4500 },
      { phase: 'complete' as const, delay: 6000 },
    ]

    timeoutsRef.current = timeline.map(({ phase, delay }) =>
      setTimeout(() => {
        setPhase(phase)
        if (phase === 'hexagon') playTransition()
        if (phase === 'emerge') playWave()
        if (phase === 'complete') {
          playSuccess()
          onComplete?.()
        }
      }, delay)
    )

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [onComplete, playTransition, playWave, playSuccess])

  const handleSkip = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setPhase('complete')
    onComplete?.()
  }

  if (phase === 'complete') return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Skip button */}
        {skipEnabled && (
          <motion.button
            className="absolute top-6 right-6 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={handleSkip}
          >
            Skip
          </motion.button>
        )}

        {/* Phase 1: Gathering particles */}
        <AnimatePresence>
          {(phase === 'particles' || phase === 'hexagon' || phase === 'crack') && (
            <motion.div className="absolute inset-0">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-hive-amber"
                  initial={{
                    x: Math.random() * (viewport.width || 0),
                    y: Math.random() * (viewport.height || 0),
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: (viewport.width || 0) / 2,
                    y: (viewport.height || 0) / 2,
                    opacity: [0, 1, 1, 0.5],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.03,
                    ease: 'easeInOut',
                  }}
                  style={{
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Hexagon appears */}
        <AnimatePresence>
          {(phase === 'hexagon' || phase === 'crack' || phase === 'emerge') && (
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ 
                scale: phase === 'emerge' ? 30 : 1, 
                rotate: 0, 
                opacity: phase === 'emerge' ? 0 : 1 
              }}
              transition={{ duration: phase === 'emerge' ? 1.5 : 0.8, ease: 'easeOut' }}
            >
              {/* Main hexagon */}
              <svg width="200" height="230" viewBox="0 0 200 230">
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Outer glow hexagon */}
                <motion.polygon
                  points="100,10 180,60 180,170 100,220 20,170 20,60"
                  fill="none"
                  stroke="url(#hexGradient)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />

                {/* Crack lines */}
                {phase === 'crack' && (
                  <>
                    <motion.line
                      x1="100" y1="115" x2="100" y2="10"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.line
                      x1="100" y1="115" x2="180" y2="170"
                      stroke="#06B6D4"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                    <motion.line
                      x1="100" y1="115" x2="20" y2="170"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    />
                  </>
                )}
              </svg>

              {/* Pulsing inner glow */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hive-amber to-hive-cyan blur-xl" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3: Swarm emerges */}
        <AnimatePresence>
          {phase === 'emerge' && (
            <motion.div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => {
                const angle = (i / 30) * Math.PI * 2
                const distance = 300 + Math.random() * 200
                return (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      background: i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#06B6D4' : '#8B5CF6',
                      boxShadow: `0 0 15px ${i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#06B6D4' : '#8B5CF6'}`,
                    }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      scale: [0, 1, 0.5],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.02,
                      ease: 'easeOut',
                    }}
                  />
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo text */}
        <AnimatePresence>
          {(phase === 'hexagon' || phase === 'crack') && (
            <motion.div
              className="absolute bottom-1/4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-4xl font-bold">
                <span className="text-hive-amber">HIVE</span>
                <span className="text-white"> AI</span>
              </h1>
              <motion.p
                className="text-gray-400 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Solana Social Intelligence
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
