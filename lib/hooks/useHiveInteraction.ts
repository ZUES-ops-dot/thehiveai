'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useHiveStore } from '@/lib/stores/useHiveStore'

interface Node {
  id: string
  label: string
  value: number
  group: string
}

interface Link {
  source: string
  target: string
  value: number
}

interface UseHiveInteractionProps {
  nodes?: Node[]
  links?: Link[]
}

/**
 * Hook for managing Hive ecosystem interactions
 * Provides cross-component communication for the living ecosystem
 */
export function useHiveInteraction({ nodes = [], links = [] }: UseHiveInteractionProps = {}) {
  const {
    selectedNode,
    hoveredNode,
    hoveredNarrative,
    hoveredInfluencer,
    hoveredProject,
    connectedNodes,
    highlightedCards,
    animationIntensity,
    reducedMotion,
    setSelectedNode,
    setHoveredNode,
    setHoveredNarrative,
    setHoveredInfluencer,
    setHoveredProject,
    setConnectedNodes,
    setHighlightedCards,
    selectNodeAndHighlight,
    clearSelection,
  } = useHiveStore()

  // Find all nodes connected to a given node
  const findConnectedNodes = useCallback((nodeId: string): string[] => {
    const connected = new Set<string>()
    
    links.forEach(link => {
      if (link.source === nodeId) {
        connected.add(link.target)
      }
      if (link.target === nodeId) {
        connected.add(link.source)
      }
    })
    
    return Array.from(connected)
  }, [links])

  // Handle node click - select and highlight connected
  const handleNodeClick = useCallback((node: Node) => {
    const connectedIds = findConnectedNodes(node.id)
    selectNodeAndHighlight(node, connectedIds)
  }, [findConnectedNodes, selectNodeAndHighlight])

  // Handle node hover - temporary highlight
  const handleNodeHover = useCallback((node: Node | null) => {
    setHoveredNode(node)
    if (node) {
      const connectedIds = findConnectedNodes(node.id)
      setHighlightedCards(connectedIds)
    } else {
      // Only clear highlights if nothing is selected
      if (!selectedNode) {
        setHighlightedCards([])
      } else {
        // Restore selection highlights
        setHighlightedCards(connectedNodes)
      }
    }
  }, [findConnectedNodes, setHoveredNode, setHighlightedCards, selectedNode, connectedNodes])

  // Handle narrative hover - highlight related nodes
  const handleNarrativeHover = useCallback((narrativeId: string | null) => {
    setHoveredNarrative(narrativeId)
    if (narrativeId) {
      // Find nodes related to this narrative
      const relatedNodes = nodes
        .filter(n => n.group === 'narrative' || n.label.toLowerCase().includes(narrativeId.toLowerCase()))
        .map(n => n.id)
      setHighlightedCards(relatedNodes)
    } else if (!selectedNode) {
      setHighlightedCards([])
    }
  }, [nodes, setHoveredNarrative, setHighlightedCards, selectedNode])

  // Handle influencer hover
  const handleInfluencerHover = useCallback((influencerId: string | null) => {
    setHoveredInfluencer(influencerId)
    if (influencerId) {
      const connectedIds = findConnectedNodes(influencerId)
      setHighlightedCards([influencerId, ...connectedIds])
    } else if (!selectedNode) {
      setHighlightedCards([])
    }
  }, [findConnectedNodes, setHoveredInfluencer, setHighlightedCards, selectedNode])

  // Handle project hover
  const handleProjectHover = useCallback((projectId: string | null) => {
    setHoveredProject(projectId)
    if (projectId) {
      const connectedIds = findConnectedNodes(projectId)
      setHighlightedCards([projectId, ...connectedIds])
    } else if (!selectedNode) {
      setHighlightedCards([])
    }
  }, [findConnectedNodes, setHoveredProject, setHighlightedCards, selectedNode])

  // Check if a node should be highlighted
  const isNodeHighlighted = useCallback((nodeId: string): boolean => {
    if (hoveredNode?.id === nodeId) return true
    if (selectedNode?.id === nodeId) return true
    return highlightedCards.includes(nodeId)
  }, [hoveredNode, selectedNode, highlightedCards])

  // Check if a card should be highlighted
  const isCardHighlighted = useCallback((cardId: string): boolean => {
    return highlightedCards.includes(cardId)
  }, [highlightedCards])

  // Get animation multiplier based on intensity setting
  const animationMultiplier = useMemo(() => {
    if (reducedMotion) return 0
    switch (animationIntensity) {
      case 'low': return 0.5
      case 'medium': return 0.75
      case 'high': return 1
      default: return 1
    }
  }, [animationIntensity, reducedMotion])

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      useHiveStore.getState().setReducedMotion(e.matches)
    }
    
    // Set initial value
    useHiveStore.getState().setReducedMotion(mediaQuery.matches)
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Get link opacity based on connection to highlighted nodes
  const getLinkOpacity = useCallback((link: Link): number => {
    const isHighlighted = 
      highlightedCards.includes(link.source) || 
      highlightedCards.includes(link.target) ||
      hoveredNode?.id === link.source ||
      hoveredNode?.id === link.target ||
      selectedNode?.id === link.source ||
      selectedNode?.id === link.target

    return isHighlighted ? 0.8 : 0.15
  }, [highlightedCards, hoveredNode, selectedNode])

  // Get node scale based on highlight state
  const getNodeScale = useCallback((nodeId: string): number => {
    if (selectedNode?.id === nodeId) return 1.3
    if (hoveredNode?.id === nodeId) return 1.2
    if (highlightedCards.includes(nodeId)) return 1.1
    return 1
  }, [selectedNode, hoveredNode, highlightedCards])

  return {
    // State
    selectedNode,
    hoveredNode,
    hoveredNarrative,
    hoveredInfluencer,
    hoveredProject,
    connectedNodes,
    highlightedCards,
    animationMultiplier,
    
    // Handlers
    handleNodeClick,
    handleNodeHover,
    handleNarrativeHover,
    handleInfluencerHover,
    handleProjectHover,
    clearSelection,
    
    // Utilities
    isNodeHighlighted,
    isCardHighlighted,
    getLinkOpacity,
    getNodeScale,
    findConnectedNodes,
  }
}

/**
 * Hook for debounced hover interactions
 */
export function useDebouncedHover(delay = 100) {
  const timeoutRef = useCallback(() => {
    let timeout: NodeJS.Timeout | null = null
    
    return {
      set: (callback: () => void) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(callback, delay)
      },
      clear: () => {
        if (timeout) clearTimeout(timeout)
      },
    }
  }, [delay])

  return timeoutRef()
}
