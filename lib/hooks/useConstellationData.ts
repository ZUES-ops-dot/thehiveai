'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  type GraphNode, 
  type GraphEdge, 
  type GraphFilters,
  type ConstellationData,
  DEFAULT_GRAPH_FILTERS
} from '@/lib/types/graph'

import constellationData from '@/lib/mock/network-constellations.json'

interface UseConstellationDataReturn {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Record<string, { label: string; color: string }>
  filters: GraphFilters
  setFilters: (filters: Partial<GraphFilters>) => void
  resetFilters: () => void
  selectedNode: GraphNode | null
  setSelectedNode: (node: GraphNode | null) => void
  hoveredNode: GraphNode | null
  setHoveredNode: (node: GraphNode | null) => void
  getConnectedNodes: (nodeId: string) => string[]
  getNodeEdges: (nodeId: string) => GraphEdge[]
  stats: {
    totalNodes: number
    totalEdges: number
    totalCreators: number
    totalNarratives: number
    totalProjects: number
    avgWeight: number
  }
}

export function useConstellationData(): UseConstellationDataReturn {
  const [filters, setFiltersState] = useState<GraphFilters>(DEFAULT_GRAPH_FILTERS)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  const rawData = constellationData as ConstellationData

  // Apply filters to nodes
  const filteredNodes = useMemo(() => {
    return rawData.nodes.filter(node => {
      // Filter by node type
      if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type)) {
        return false
      }

      // Filter by cluster
      if (filters.clusters.length > 0 && node.cluster && !filters.clusters.includes(node.cluster)) {
        return false
      }

      // Filter by tier (for creators)
      if (filters.tiers.length > 0 && node.tier && !filters.tiers.includes(node.tier)) {
        return false
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!node.label.toLowerCase().includes(query) && !node.id.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })
  }, [rawData.nodes, filters])

  // Get set of visible node IDs for edge filtering
  const visibleNodeIds = useMemo(() => {
    return new Set(filteredNodes.map(n => n.id))
  }, [filteredNodes])

  // Apply filters to edges
  const filteredEdges = useMemo(() => {
    return rawData.edges.filter(edge => {
      // Only show edges where both nodes are visible
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) {
        return false
      }

      // Filter by minimum weight
      if (edge.weight < filters.minWeight) {
        return false
      }

      return true
    })
  }, [rawData.edges, visibleNodeIds, filters.minWeight])

  // Set filters (partial update)
  const setFilters = useCallback((newFilters: Partial<GraphFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_GRAPH_FILTERS)
  }, [])

  // Get connected node IDs for a given node
  const getConnectedNodes = useCallback((nodeId: string): string[] => {
    const connected = new Set<string>()
    
    rawData.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target)
      }
      if (edge.target === nodeId) {
        connected.add(edge.source)
      }
    })

    return Array.from(connected)
  }, [rawData.edges])

  // Get edges for a specific node
  const getNodeEdges = useCallback((nodeId: string): GraphEdge[] => {
    return rawData.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    )
  }, [rawData.edges])

  // Compute stats
  const stats = useMemo(() => {
    const totalNodes = filteredNodes.length
    const totalEdges = filteredEdges.length
    const totalCreators = filteredNodes.filter(n => n.type === 'creator').length
    const totalNarratives = filteredNodes.filter(n => n.type === 'narrative').length
    const totalProjects = filteredNodes.filter(n => n.type === 'project').length
    const avgWeight = totalEdges > 0 
      ? filteredEdges.reduce((sum, e) => sum + e.weight, 0) / totalEdges 
      : 0

    return {
      totalNodes,
      totalEdges,
      totalCreators,
      totalNarratives,
      totalProjects,
      avgWeight,
    }
  }, [filteredNodes, filteredEdges])

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    clusters: rawData.clusters,
    filters,
    setFilters,
    resetFilters,
    selectedNode,
    setSelectedNode,
    hoveredNode,
    setHoveredNode,
    getConnectedNodes,
    getNodeEdges,
    stats,
  }
}
