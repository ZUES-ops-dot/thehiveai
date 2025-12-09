'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HiveNodeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'amber' | 'cyan' | 'purple' | 'green'
  pulse?: boolean
  className?: string
  label?: string
  value?: string | number
  onClick?: () => void
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

const colorMap = {
  amber: {
    bg: 'bg-hive-amber/20',
    border: 'border-hive-amber',
    glow: 'shadow-glow-amber-sm',
    text: 'text-hive-amber',
  },
  cyan: {
    bg: 'bg-hive-cyan/20',
    border: 'border-hive-cyan',
    glow: 'shadow-glow-cyan-sm',
    text: 'text-hive-cyan',
  },
  purple: {
    bg: 'bg-hive-purple/20',
    border: 'border-hive-purple',
    glow: 'shadow-glow-purple',
    text: 'text-hive-purple',
  },
  green: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    text: 'text-emerald-500',
  },
}

export function HiveNode({
  size = 'md',
  color = 'amber',
  pulse = true,
  className,
  label,
  value,
  onClick,
}: HiveNodeProps) {
  const colors = colorMap[color]
  const sizeClass = sizeMap[size]

  return (
    <motion.div
      className={cn('relative flex flex-col items-center gap-2', className)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Node */}
      <div className="relative">
        {/* Outer glow ring */}
        {pulse && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              colors.bg,
              colors.glow
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main node */}
        <motion.div
          className={cn(
            'relative flex items-center justify-center rounded-full border-2 backdrop-blur-sm cursor-pointer',
            sizeClass,
            colors.bg,
            colors.border,
            colors.glow
          )}
          animate={pulse ? {
            boxShadow: [
              `0 0 10px ${color === 'amber' ? 'rgba(245, 158, 11, 0.4)' : color === 'cyan' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
              `0 0 20px ${color === 'amber' ? 'rgba(245, 158, 11, 0.6)' : color === 'cyan' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(139, 92, 246, 0.6)'}`,
              `0 0 10px ${color === 'amber' ? 'rgba(245, 158, 11, 0.4)' : color === 'cyan' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
            ],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {value && (
            <span className={cn('text-xs font-bold', colors.text)}>
              {value}
            </span>
          )}
        </motion.div>

        {/* Inner pulse */}
        <motion.div
          className={cn(
            'absolute inset-2 rounded-full',
            colors.bg
          )}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Label */}
      {label && (
        <motion.span
          className={cn('text-xs font-medium text-gray-400')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  )
}
