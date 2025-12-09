'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Node {
  id: string
  label: string
  value: number
  group: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface Link {
  source: string
  target: string
  value: number
}

interface HiveClusterGraphProps {
  nodes: Node[]
  links: Link[]
  width?: number
  height?: number
  className?: string
  onNodeClick?: (node: Node) => void
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const px = x + radius * Math.cos(angle)
    const py = y + radius * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

const groupColors: Record<string, string> = {
  influencer: '#F59E0B',
  project: '#06B6D4',
  narrative: '#8B5CF6',
  wallet: '#10B981',
  default: '#6B7280',
}

export function HiveClusterGraph({
  nodes: initialNodes,
  links,
  width: propWidth,
  height: propHeight,
  className,
  onNodeClick,
}: HiveClusterGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: propWidth || 600, height: propHeight || 400 })
  const animationRef = useRef<number>()

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width || propWidth || 600,
          height: rect.height || propHeight || 400,
        })
      }
    }

    if (typeof window === 'undefined') {
      setDimensions({ width: propWidth || 600, height: propHeight || 400 })
      return
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [propWidth, propHeight])

  const width = dimensions.width
  const height = dimensions.height

  // Initialize node positions
  useEffect(() => {
    const initializedNodes = initialNodes.map((node, i) => ({
      ...node,
      x: width / 2 + Math.cos(i * 2 * Math.PI / initialNodes.length) * 150 + Math.random() * 50,
      y: height / 2 + Math.sin(i * 2 * Math.PI / initialNodes.length) * 150 + Math.random() * 50,
      vx: 0,
      vy: 0,
    }))
    setNodes(initializedNodes)
  }, [initialNodes, width, height])

  // sync selection if selected id disappears
  useEffect(() => {
    if (selectedNodeId && !nodes.find((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [nodes, selectedNodeId])

  // Force simulation
  const simulate = useCallback(() => {
    setNodes(prevNodes => {
      const newNodes = prevNodes.map(node => ({ ...node }))
      
      // Center force
      newNodes.forEach(node => {
        const dx = width / 2 - (node.x || 0)
        const dy = height / 2 - (node.y || 0)
        node.vx = (node.vx || 0) + dx * 0.001
        node.vy = (node.vy || 0) + dy * 0.001
      })

      // Repulsion between nodes
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const dx = (newNodes[j].x || 0) - (newNodes[i].x || 0)
          const dy = (newNodes[j].y || 0) - (newNodes[i].y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 500 / (dist * dist)
          
          newNodes[i].vx = (newNodes[i].vx || 0) - (dx / dist) * force
          newNodes[i].vy = (newNodes[i].vy || 0) - (dy / dist) * force
          newNodes[j].vx = (newNodes[j].vx || 0) + (dx / dist) * force
          newNodes[j].vy = (newNodes[j].vy || 0) + (dy / dist) * force
        }
      }

      // Link forces
      links.forEach(link => {
        const source = newNodes.find(n => n.id === link.source)
        const target = newNodes.find(n => n.id === link.target)
        if (source && target) {
          const dx = (target.x || 0) - (source.x || 0)
          const dy = (target.y || 0) - (source.y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (dist - 100) * 0.01
          
          source.vx = (source.vx || 0) + (dx / dist) * force
          source.vy = (source.vy || 0) + (dy / dist) * force
          target.vx = (target.vx || 0) - (dx / dist) * force
          target.vy = (target.vy || 0) - (dy / dist) * force
        }
      })

      // Apply velocity and damping
      newNodes.forEach(node => {
        node.x = (node.x || 0) + (node.vx || 0)
        node.y = (node.y || 0) + (node.vy || 0)
        node.vx = (node.vx || 0) * 0.9
        node.vy = (node.vy || 0) * 0.9
        
        // Boundary constraints
        node.x = Math.max(30, Math.min(width - 30, node.x || 0))
        node.y = Math.max(30, Math.min(height - 30, node.y || 0))
      })

      return newNodes
    })
  }, [links, width, height])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulate()
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [simulate])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Draw links
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source)
      const target = nodes.find(n => n.id === link.target)
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)'
        ctx.lineWidth = Math.min(link.value * 0.5, 3)
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return
      
      const color = groupColors[node.group] || groupColors.default
      const baseRadius = Math.max(8, Math.min(node.value * 2, 25))
      const isHovered = hoveredNode?.id === node.id
      const isSelected = selectedNodeId === node.id
      const hexRadius = baseRadius * (isSelected ? 1.5 : isHovered ? 1.2 : 1)

      // Glow layer
      ctx.save()
      ctx.fillStyle = hexToRgba(color, isSelected ? 0.35 : 0.25)
      ctx.shadowColor = hexToRgba(color, isSelected ? 0.65 : 0.45)
      ctx.shadowBlur = isSelected ? 40 : 25
      drawHexagon(ctx, node.x, node.y, hexRadius * 1.5)
      ctx.fill()
      ctx.restore()

      // Core hexagon
      ctx.save()
      ctx.fillStyle = color
      ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = isSelected ? 3 : 2
      drawHexagon(ctx, node.x, node.y, hexRadius)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Inner pulse
      ctx.save()
      ctx.fillStyle = hexToRgba('#ffffff', 0.1)
      drawHexagon(ctx, node.x, node.y, hexRadius * 0.65)
      ctx.fill()
      ctx.restore()
    })
  }, [nodes, links, hoveredNode, selectedNodeId, width, height])

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hovered = nodes.find(node => {
      if (!node.x || !node.y) return false
      const dx = x - node.x
      const dy = y - node.y
      const radius = Math.max(8, Math.min(node.value * 2, 25))
      return dx * dx + dy * dy < radius * radius
    })

    setHoveredNode(hovered || null)
  }, [nodes])

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      setSelectedNodeId(hoveredNode.id)
      if (onNodeClick) {
        onNodeClick(hoveredNode)
      }
    } else {
      setSelectedNodeId(null)
    }
  }, [hoveredNode, onNodeClick])

  const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null

  const overlayDimensions = { width: 220, height: 120 }
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  const selectedOverlayPosition =
    selectedNode && selectedNode.x && selectedNode.y
      ? {
          left: clamp(
            selectedNode.x - overlayDimensions.width / 2,
            12,
            width - overlayDimensions.width - 12
          ),
          top: clamp(
            selectedNode.y - overlayDimensions.height - 24,
            12,
            height - overlayDimensions.height - 12
          ),
        }
      : null

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('relative rounded-xl overflow-hidden w-full h-full', className)}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-pointer w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={handleClick}
      />
      
      {/* Tooltip */}
      {hoveredNode && hoveredNode.x && hoveredNode.y && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-none px-3 py-2 rounded-lg bg-background-card border border-hive-amber/20 shadow-lg"
          style={{
            left: hoveredNode.x + 15,
            top: hoveredNode.y - 10,
          }}
        >
          <div className="text-sm font-medium text-white">{hoveredNode.label}</div>
          <div className="text-xs text-gray-400">Value: {hoveredNode.value}</div>
        </motion.div>
      )}

      {/* Selected node detail */}
      {selectedNode && selectedOverlayPosition && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="absolute z-20 rounded-xl border border-hive-purple/30 bg-black/70 p-4 backdrop-blur-lg shadow-2xl w-[220px]"
          style={selectedOverlayPosition}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm uppercase tracking-wide text-gray-400">
                {selectedNode.group}
              </div>
              <div className="text-lg font-semibold text-white leading-tight">
                {selectedNode.label}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close node detail"
              onClick={() => setSelectedNodeId(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-300">
            Signal strength: <span className="text-white font-semibold">{selectedNode.value}</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-hive-purple"
              style={{ width: `${Math.min(100, selectedNode.value * 10)}%` }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
