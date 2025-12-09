'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HivePulseNumberProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
  decimals?: number
  color?: 'amber' | 'cyan' | 'purple' | 'white'
}

const colorStyles = {
  amber: 'text-hive-amber text-glow-amber',
  cyan: 'text-hive-cyan text-glow-cyan',
  purple: 'text-hive-purple',
  white: 'text-white',
}

export function HivePulseNumber({
  value,
  prefix = '',
  suffix = '',
  className,
  duration = 1.5,
  decimals = 0,
  color = 'amber',
}: HivePulseNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  })

  const display = useTransform(spring, (current) => {
    return current.toFixed(decimals)
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(parseFloat(v))
    })
    return () => unsubscribe()
  }, [display])

  return (
    <motion.span
      className={cn(
        'font-mono font-bold tabular-nums',
        colorStyles[color],
        className
      )}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {prefix}
        {displayValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </motion.span>
    </motion.span>
  )
}
