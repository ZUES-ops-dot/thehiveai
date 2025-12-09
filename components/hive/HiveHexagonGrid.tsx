'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useAnimationFrame } from 'framer-motion'
import { useHiveMotion } from '@/lib/stores/useHiveMotion'

// ============================================
// GLOBAL HEXAGON PATTERN OVERLAY
// Transparent honeycomb that glows and breathes
// ============================================

interface HexagonGridProps {
  className?: string
}

export function HiveHexagonGrid({ className = '' }: HexagonGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const timeRef = useRef(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isClient, setIsClient] = useState(false)
  
  const { 
    mood, 
    glowIntensity, 
    breatheActive, 
    globalPulseActive,
    reducedMotion,
    marketState,
  } = useHiveMotion()

  // Hexagon settings
  const hexSize = 40
  const hexHeight = hexSize * Math.sqrt(3)
  const hexWidth = hexSize * 2

  // Update dimensions
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsClient(true)

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Track mouse
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Get mood-based color
  const getMoodColor = useCallback(() => {
    const colors = {
      calm: { r: 6, g: 182, b: 212 },      // Cyan
      alert: { r: 245, g: 158, b: 11 },    // Amber
      excited: { r: 236, g: 72, b: 153 },  // Pink
      critical: { r: 239, g: 68, b: 68 },  // Red
    }
    return colors[mood] || colors.alert
  }, [mood])

  // Draw hexagon
  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
    glowAmount: number
  ) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const hx = x + size * Math.cos(angle)
      const hy = y + size * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(hx, hy)
      } else {
        ctx.lineTo(hx, hy)
      }
    }
    ctx.closePath()

    const color = getMoodColor()
    
    // Glow effect
    if (glowAmount > 0.1) {
      ctx.shadowBlur = 15 * glowAmount
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAmount})`
    } else {
      ctx.shadowBlur = 0
    }
    
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }, [getMoodColor])

  // Animation loop
  useAnimationFrame((time) => {
    if (reducedMotion) return
    if (!isClient) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    timeRef.current = time / 1000

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const cols = Math.ceil((canvas.width || 0) / (hexWidth * 0.75)) + 2
    const rows = Math.ceil((canvas.height || 0) / hexHeight) + 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexWidth * 0.75
        const y = row * hexHeight + (col % 2 ? hexHeight / 2 : 0)

        // Distance from mouse
        const dx = x - mouseRef.current.x
        const dy = y - mouseRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 200

        // Base alpha
        let alpha = 0.03 + glowIntensity * 0.02

        // Mouse proximity glow
        const mouseGlow = Math.max(0, 1 - distance / maxDist)
        alpha += mouseGlow * 0.15

        // Breathing effect
        if (breatheActive) {
          const breathe = Math.sin(timeRef.current * 0.5 + (row + col) * 0.1) * 0.5 + 0.5
          alpha += breathe * 0.03
        }

        // Global pulse wave
        if (globalPulseActive) {
          const waveDistance = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + 
            Math.pow(y - canvas.height / 2, 2)
          )
          const wave = Math.sin(timeRef.current * 2 - waveDistance * 0.01) * 0.5 + 0.5
          alpha += wave * 0.02
        }

        drawHexagon(ctx, x, y, hexSize * 0.9, alpha, mouseGlow * glowIntensity)
      }
    }
  })

  if (reducedMotion) return null

  return (
    <motion.canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
