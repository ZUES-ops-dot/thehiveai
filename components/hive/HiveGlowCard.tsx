'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { fadeIn, globalTransition, hoverScaleSmall, hoverLift } from '@/lib/motion/presets'

interface HiveGlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'amber' | 'cyan' | 'purple'
  hover?: boolean
  delay?: number
  onClick?: () => void
}

const glowStyles = {
  amber: {
    card: 'hive-card-amber',
    border: 'border-hive-amber/20 hover:border-hive-amber/40',
    glow: 'glow-soft-amber',
    gradient: 'from-hive-amber/10 to-transparent',
    corner: 'border-hive-amber/50',
  },
  cyan: {
    card: 'hive-card-cyan',
    border: 'border-hive-cyan/20 hover:border-hive-cyan/40',
    glow: 'glow-soft-cyan',
    gradient: 'from-hive-cyan/10 to-transparent',
    corner: 'border-hive-cyan/50',
  },
  purple: {
    card: 'hive-card-purple',
    border: 'border-hive-purple/20 hover:border-hive-purple/40',
    glow: 'glow-soft-purple',
    gradient: 'from-hive-purple/10 to-transparent',
    corner: 'border-hive-purple/50',
  },
}

export function HiveGlowCard({ 
  children, 
  className, 
  glowColor = 'amber',
  hover = true,
  delay = 0,
  onClick
}: HiveGlowCardProps) {
  const prefersReduced = usePrefersReducedMotion()
  const styles = glowStyles[glowColor]

  // Animation props respecting reduced motion
  const motionProps = prefersReduced ? {} : {
    initial: 'hidden',
    animate: 'visible',
    variants: fadeIn,
    transition: { ...globalTransition, delay },
  }

  const hoverProps = !prefersReduced && hover ? {
    whileHover: { ...hoverScaleSmall, ...hoverLift },
  } : {}

  return (
    <motion.div
      {...motionProps}
      {...hoverProps}
      onClick={onClick}
      className={cn(
        'hive-card relative p-6',
        styles.card,
        hover && styles.glow,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Gradient overlay */}
      <div 
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br opacity-50 pointer-events-none',
          styles.gradient
        )}
      />
      
      {/* Animated corner accents */}
      {!prefersReduced && (
        <>
          <motion.div
            className={cn(
              'absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl',
              styles.corner
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={cn(
              'absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl',
              styles.corner
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
