// Social Graph v2 Types

import { type GlowTier } from './economy'

export type NodeType = 'creator' | 'narrative' | 'project'
export type EdgeType = 'amplifies' | 'mentions' | 'collab' | 'follows' | 'funds'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  tier?: GlowTier
  avatar?: string
  cluster?: string
  metrics?: {
    msp?: number
    followers?: number
    activity?: number
    funding?: number
  }
  lastActive?: string
  // Computed by layout
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface GraphEdge {
  source: string
  target: string
  type: EdgeType
  weight: number
  timeseries?: Array<{ t: string; value: number }>
}

export interface ClusterInfo {
  label: string
  color: string
}

export interface ConstellationData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Record<string, ClusterInfo>
}

export interface GraphFilters {
  nodeTypes: NodeType[]
  clusters: string[]
  minWeight: number
  tiers: GlowTier[]
  timeRange: '7d' | '30d' | '90d' | 'all'
  searchQuery: string
}

export const DEFAULT_GRAPH_FILTERS: GraphFilters = {
  nodeTypes: ['creator', 'narrative', 'project'],
  clusters: [],
  minWeight: 0,
  tiers: [],
  timeRange: '30d',
  searchQuery: '',
}

// Node size based on metrics
export function getNodeSize(node: GraphNode): number {
  if (node.type === 'creator') {
    const msp = node.metrics?.msp || 0
    return Math.max(8, Math.min(30, Math.log10(msp + 1) * 5))
  }
  if (node.type === 'narrative') {
    const funding = node.metrics?.funding || 0
    return Math.max(12, Math.min(35, Math.log10(funding + 1) * 6))
  }
  if (node.type === 'project') {
    return 20
  }
  return 12
}

// Node color based on type and tier
export function getNodeColor(node: GraphNode, clusters: Record<string, ClusterInfo>): string {
  if (node.cluster && clusters[node.cluster]) {
    return clusters[node.cluster].color
  }
  
  switch (node.type) {
    case 'creator':
      return '#F59E0B' // amber
    case 'narrative':
      return '#06B6D4' // cyan
    case 'project':
      return '#8B5CF6' // purple
    default:
      return '#6B7280' // gray
  }
}

// Edge color based on type
export function getEdgeColor(edge: GraphEdge): string {
  switch (edge.type) {
    case 'amplifies':
      return 'rgba(6, 182, 212, 0.6)' // cyan
    case 'collab':
      return 'rgba(245, 158, 11, 0.6)' // amber
    case 'funds':
      return 'rgba(139, 92, 246, 0.6)' // purple
    case 'mentions':
      return 'rgba(107, 114, 128, 0.4)' // gray
    case 'follows':
      return 'rgba(107, 114, 128, 0.3)' // gray light
    default:
      return 'rgba(107, 114, 128, 0.4)'
  }
}
