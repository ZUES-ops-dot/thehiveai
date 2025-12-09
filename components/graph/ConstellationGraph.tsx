'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  type GraphNode, 
  type GraphEdge, 
  getNodeSize, 
  getNodeColor, 
  getEdgeColor 
} from '@/lib/types/graph'

interface ConstellationGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Record<string, { label: string; color: string }>
  selectedNode: GraphNode | null
  hoveredNode: GraphNode | null
  onNodeClick: (node: GraphNode) => void
  onNodeHover: (node: GraphNode | null) => void
  highlightedNodes?: Set<string>
}

interface SimulationNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
}

// Simple force-directed layout simulation
function runSimulation(
  nodes: GraphNode[], 
  edges: GraphEdge[], 
  width: number, 
  height: number,
  iterations: number = 100
): SimulationNode[] {
  // Initialize positions
  const simNodes: SimulationNode[] = nodes.map((node, i) => ({
    ...node,
    x: width / 2 + (Math.random() - 0.5) * width * 0.8,
    y: height / 2 + (Math.random() - 0.5) * height * 0.8,
    vx: 0,
    vy: 0,
  }))

  const nodeMap = new Map(simNodes.map(n => [n.id, n]))

  // Simulation parameters
  const repulsion = 5000
  const attraction = 0.05
  const damping = 0.85
  const centerPull = 0.01

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations

    // Repulsion between all nodes
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const nodeA = simNodes[i]
        const nodeB = simNodes[j]
        
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = (repulsion * alpha) / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        nodeA.vx -= fx
        nodeA.vy -= fy
        nodeB.vx += fx
        nodeB.vy += fy
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      
      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = dist * attraction * edge.weight * alpha
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      }
    }

    // Center pull
    for (const node of simNodes) {
      node.vx += (width / 2 - node.x) * centerPull * alpha
      node.vy += (height / 2 - node.y) * centerPull * alpha
    }

    // Update positions
    for (const node of simNodes) {
      node.vx *= damping
      node.vy *= damping
      node.x += node.vx
      node.y += node.vy
      
      // Boundary constraints
      node.x = Math.max(50, Math.min(width - 50, node.x))
      node.y = Math.max(50, Math.min(height - 50, node.y))
    }
  }

  return simNodes
}

// Draw hexagon shape
function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

export function ConstellationGraph({
  nodes,
  edges,
  clusters,
  selectedNode,
  hoveredNode,
  onNodeClick,
  onNodeHover,
  highlightedNodes,
}: ConstellationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [simulatedNodes, setSimulatedNodes] = useState<SimulationNode[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })

  // Update dimensions on resize
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Run simulation when nodes/edges change
  useEffect(() => {
    if (nodes.length === 0) return
    const simulated = runSimulation(nodes, edges, dimensions.width, dimensions.height, 150)
    setSimulatedNodes(simulated)
  }, [nodes, edges, dimensions])

  // Find node at position
  const findNodeAtPosition = useCallback((x: number, y: number): SimulationNode | null => {
    const transformedX = (x - pan.x) / zoom
    const transformedY = (y - pan.y) / zoom

    for (const node of simulatedNodes) {
      const size = getNodeSize(node)
      const dist = Math.sqrt((node.x - transformedX) ** 2 + (node.y - transformedY) ** 2)
      if (dist < size + 5) {
        return node
      }
    }
    return null
  }, [simulatedNodes, zoom, pan])

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      setPan(prev => ({
        x: prev.x + (e.clientX - lastMouse.x),
        y: prev.y + (e.clientY - lastMouse.y),
      }))
      setLastMouse({ x: e.clientX, y: e.clientY })
    } else {
      const node = findNodeAtPosition(x, y)
      onNodeHover(node)
    }
  }, [isDragging, lastMouse, findNodeAtPosition, onNodeHover])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setLastMouse({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const node = findNodeAtPosition(x, y)
      if (node) {
        onNodeClick(node)
      }
    }
    setIsDragging(false)
  }, [isDragging, findNodeAtPosition, onNodeClick])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)))
  }, [])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || simulatedNodes.length === 0) return

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Apply transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const nodeMap = new Map(simulatedNodes.map(n => [n.id, n]))

    // Draw edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      
      if (source && target) {
        const isHighlighted = 
          hoveredNode?.id === source.id || 
          hoveredNode?.id === target.id ||
          selectedNode?.id === source.id ||
          selectedNode?.id === target.id

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = isHighlighted 
          ? getEdgeColor(edge).replace('0.6', '1').replace('0.4', '0.8').replace('0.3', '0.6')
          : getEdgeColor(edge)
        ctx.lineWidth = isHighlighted ? edge.weight * 4 : edge.weight * 2
        ctx.stroke()

        // Draw animated particles on highlighted edges
        if (isHighlighted && edge.weight > 0.7) {
          const t = (Date.now() % 2000) / 2000
          const px = source.x + (target.x - source.x) * t
          const py = source.y + (target.y - source.y) * t
          
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#06B6D4'
          ctx.fill()
        }
      }
    }

    // Draw nodes
    for (const node of simulatedNodes) {
      const size = getNodeSize(node)
      const color = getNodeColor(node, clusters)
      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNode?.id === node.id
      const isHighlightedNode = highlightedNodes?.has(node.id)
      const isConnected = hoveredNode && (
        edges.some(e => 
          (e.source === hoveredNode.id && e.target === node.id) ||
          (e.target === hoveredNode.id && e.source === node.id)
        )
      )

      // Outer glow for highlighted nodes
      if (isSelected || isHovered || isHighlightedNode) {
        ctx.shadowColor = color
        ctx.shadowBlur = 20
      }

      // Draw hexagon
      drawHexagon(ctx, node.x, node.y, size)
      
      // Fill
      const opacity = (isSelected || isHovered || isConnected || !hoveredNode) ? 1 : 0.3
      ctx.fillStyle = color + (opacity < 1 ? '4D' : '') // 4D = 30% opacity in hex
      ctx.fill()
      
      // Stroke
      ctx.strokeStyle = isSelected ? '#FFFFFF' : isHovered ? '#06B6D4' : color
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1
      ctx.stroke()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      // Draw type indicator
      if (node.type === 'narrative') {
        ctx.beginPath()
        ctx.arc(node.x, node.y, size * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = '#06B6D4'
        ctx.fill()
      } else if (node.type === 'project') {
        ctx.fillStyle = '#8B5CF6'
        ctx.fillRect(node.x - size * 0.2, node.y - size * 0.2, size * 0.4, size * 0.4)
      }

      // Draw label for hovered/selected nodes
      if (isSelected || isHovered) {
        ctx.font = '12px Inter, sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y + size + 16)
      }
    }

    ctx.restore()

    // Request next frame for animations
    if (hoveredNode || selectedNode) {
      requestAnimationFrame(() => {
        // Trigger re-render for particle animation
      })
    }
  }, [simulatedNodes, edges, clusters, dimensions, zoom, pan, hoveredNode, selectedNode, highlightedNodes])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false)
          onNodeHover(null)
        }}
        onWheel={handleWheel}
      />
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
          className="w-8 h-8 rounded-lg bg-background/80 border border-white/10 text-white flex items-center justify-center hover:border-hive-cyan/50"
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom(prev => Math.max(0.3, prev / 1.2))}
          className="w-8 h-8 rounded-lg bg-background/80 border border-white/10 text-white flex items-center justify-center hover:border-hive-cyan/50"
        >
          −
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="w-8 h-8 rounded-lg bg-background/80 border border-white/10 text-white flex items-center justify-center hover:border-hive-cyan/50 text-xs"
        >
          ⟲
        </motion.button>
      </div>
    </div>
  )
}
