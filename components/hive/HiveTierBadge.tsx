'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type GlowTier } from '@/lib/types/economy'

interface HiveTierBadgeProps {
  tier: GlowTier
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', text: 'text-[10px]', particles: 3 },
  md: { container: 'w-12 h-12', text: 'text-xs', particles: 5 },
  lg: { container: 'w-16 h-16', text: 'text-sm', particles: 8 },
  xl: { container: 'w-24 h-24', text: 'text-base', particles: 12 },
}

const tierConfig: Record<GlowTier, {
  gradient: string
  glow: string
  animation: 'pulse' | 'spokes' | 'fractal' | 'orbit' | 'swarm'
  particleColor: string
}> = {
  prime: {
    gradient: 'from-hive-cyan/30 to-hive-amber/30',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    animation: 'pulse',
    particleColor: '#06B6D4',
  },
  lumina: {
    gradient: 'from-yellow-400/40 to-amber-300/40',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
    animation: 'spokes',
    particleColor: '#EAB308',
  },
  echelon: {
    gradient: 'from-purple-500/40 to-blue-500/40',
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.4)]',
    animation: 'fractal',
    particleColor: '#8B5CF6',
  },
  apex: {
    gradient: 'from-pink-500/40 to-cyan-400/40',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.5)]',
    animation: 'orbit',
    particleColor: '#EC4899',
  },
  overmind: {
    gradient: 'from-pink-400/50 via-purple-500/50 to-cyan-400/50',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.6)]',
    animation: 'swarm',
    particleColor: '#A855F7',
  },
}

// Orbiting particles for Apex tier
function OrbitingParticles({ count, color, size }: { count: number; color: string; size: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            className="absolute w-1 h-1 rounded-full"
            style={{ 
              backgroundColor: color,
              left: size / 2 + i * 3,
              top: 0,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        </motion.div>
      ))}
    </>
  )
}

// Swarm particles for Overmind tier
function SwarmParticles({ count, color }: { count: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ 
            backgroundColor: color,
            left: `${50 + Math.sin(i * 0.8) * 30}%`,
            top: `${50 + Math.cos(i * 0.8) * 30}%`,
          }}
          animate={{
            x: [0, Math.sin(i) * 15, 0],
            y: [0, Math.cos(i) * 15, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}

export function HiveTierBadge({ tier, size = 'md', showLabel = true, className }: HiveTierBadgeProps) {
  const config = tierConfig[tier]
  const sizeConf = sizeConfig[size]

  return (
    <div className={cn('relative flex flex-col items-center gap-2', className)}>
      {/* Main Badge Container */}
      <div className={cn('relative', sizeConf.container)}>
        {/* Outer Glow Ring - Pulsing for all tiers */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br',
            config.gradient
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: tier === 'overmind' ? 1.5 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Golden Spokes for Lumina */}
        {tier === 'lumina' && (
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.div
                key={angle}
                className="absolute w-0.5 h-3 bg-gradient-to-t from-yellow-400 to-transparent"
                style={{
                  left: '50%',
                  top: '-8px',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scaleY: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        )}

        {/* Fractal edges for Echelon */}
        {tier === 'echelon' && (
          <motion.div
            className="absolute inset-[-4px] rounded-full border-2 border-purple-500/50"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 2, repeat: Infinity },
            }}
          />
        )}

        {/* Orbiting particles for Apex */}
        {tier === 'apex' && (
          <OrbitingParticles 
            count={sizeConf.particles} 
            color={config.particleColor} 
            size={parseInt(sizeConf.container.split(' ')[0].replace('w-', '')) * 4}
          />
        )}

        {/* Swarm particles for Overmind */}
        {tier === 'overmind' && (
          <SwarmParticles count={sizeConf.particles} color={config.particleColor} />
        )}

        {/* Main Badge Circle */}
        <motion.div
          className={cn(
            'relative w-full h-full rounded-full bg-gradient-to-br border-2 flex items-center justify-center',
            config.gradient,
            config.glow,
            tier === 'overmind' ? 'border-pink-400/50' : 
            tier === 'apex' ? 'border-pink-400/40' :
            tier === 'echelon' ? 'border-purple-500/40' :
            tier === 'lumina' ? 'border-yellow-400/40' :
            'border-hive-cyan/30'
          )}
          animate={
            tier === 'prime' ? {
              boxShadow: [
                '0 0 15px rgba(6, 182, 212, 0.3)',
                '0 0 25px rgba(6, 182, 212, 0.5)',
                '0 0 15px rgba(6, 182, 212, 0.3)',
              ],
            } : tier === 'overmind' ? {
              boxShadow: [
                '0 0 30px rgba(236, 72, 153, 0.4)',
                '0 0 50px rgba(168, 85, 247, 0.6)',
                '0 0 30px rgba(6, 182, 212, 0.4)',
                '0 0 50px rgba(236, 72, 153, 0.4)',
              ],
            } : undefined
          }
          transition={{
            duration: tier === 'overmind' ? 3 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner content - Tier initial */}
          <span className={cn(
            'font-bold uppercase',
            sizeConf.text,
            tier === 'overmind' ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent' :
            tier === 'apex' ? 'text-pink-400' :
            tier === 'echelon' ? 'text-purple-400' :
            tier === 'lumina' ? 'text-yellow-400' :
            'text-hive-cyan'
          )}>
            {tier.charAt(0).toUpperCase()}
          </span>
        </motion.div>

        {/* Inner pulse for all */}
        <motion.div
          className={cn(
            'absolute inset-2 rounded-full bg-gradient-to-br',
            config.gradient
          )}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <motion.span
          className={cn(
            'font-medium capitalize',
            sizeConf.text,
            tier === 'overmind' ? 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent' :
            tier === 'apex' ? 'text-pink-400' :
            tier === 'echelon' ? 'text-purple-400' :
            tier === 'lumina' ? 'text-yellow-400' :
            'text-hive-cyan'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tier}
        </motion.span>
      )}
    </div>
  )
}
