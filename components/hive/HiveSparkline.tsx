'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HiveSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: 'amber' | 'cyan' | 'purple' | 'green'
  className?: string
  showGlow?: boolean
}

const colorMap = {
  amber: {
    stroke: '#F59E0B',
    fill: 'rgba(245, 158, 11, 0.2)',
    glow: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))',
  },
  cyan: {
    stroke: '#06B6D4',
    fill: 'rgba(6, 182, 212, 0.2)',
    glow: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.5))',
  },
  purple: {
    stroke: '#8B5CF6',
    fill: 'rgba(139, 92, 246, 0.2)',
    glow: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))',
  },
  green: {
    stroke: '#10B981',
    fill: 'rgba(16, 185, 129, 0.2)',
    glow: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))',
  },
}

export function HiveSparkline({
  data,
  width = 120,
  height = 40,
  color = 'amber',
  className,
  showGlow = true,
}: HiveSparklineProps) {
  if (data.length < 2) return null

  const colors = colorMap[color]
  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y }
  })

  const pathD = points
    .map((point, i) => (i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      style={{ filter: showGlow ? colors.glow : undefined }}
    >
      {/* Area fill */}
      <motion.path
        d={areaD}
        fill={colors.fill}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={colors.stroke}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      />

      {/* Pulsing ring on end dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={1}
        animate={{
          r: [3, 8, 3],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </svg>
  )
}
