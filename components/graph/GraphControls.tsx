'use client'

import { motion } from 'framer-motion'
import { 
  Filter, 
  Users, 
  Flame, 
  Briefcase, 
  X,
  RotateCcw,
  Search
} from 'lucide-react'
import { type GraphFilters, type NodeType } from '@/lib/types/graph'
import { type GlowTier } from '@/lib/types/economy'

interface GraphControlsProps {
  filters: GraphFilters
  onFilterChange: (filters: Partial<GraphFilters>) => void
  onReset: () => void
  clusters: Record<string, { label: string; color: string }>
  stats: {
    totalNodes: number
    totalEdges: number
    totalCreators: number
    totalNarratives: number
    totalProjects: number
  }
}

const nodeTypeConfig: { type: NodeType; label: string; icon: typeof Users }[] = [
  { type: 'creator', label: 'Creators', icon: Users },
  { type: 'narrative', label: 'Narratives', icon: Flame },
  { type: 'project', label: 'Projects', icon: Briefcase },
]

const tierConfig: { tier: GlowTier; label: string; color: string }[] = [
  { tier: 'prime', label: 'Prime', color: '#06B6D4' },
  { tier: 'lumina', label: 'Lumina', color: '#EAB308' },
  { tier: 'echelon', label: 'Echelon', color: '#8B5CF6' },
  { tier: 'apex', label: 'Apex', color: '#EC4899' },
  { tier: 'overmind', label: 'Overmind', color: '#A855F7' },
]

export function GraphControls({
  filters,
  onFilterChange,
  onReset,
  clusters,
  stats,
}: GraphControlsProps) {
  const toggleNodeType = (type: NodeType) => {
    const current = filters.nodeTypes
    if (current.includes(type)) {
      onFilterChange({ nodeTypes: current.filter(t => t !== type) })
    } else {
      onFilterChange({ nodeTypes: [...current, type] })
    }
  }

  const toggleCluster = (clusterId: string) => {
    const current = filters.clusters
    if (current.includes(clusterId)) {
      onFilterChange({ clusters: current.filter(c => c !== clusterId) })
    } else {
      onFilterChange({ clusters: [...current, clusterId] })
    }
  }

  const toggleTier = (tier: GlowTier) => {
    const current = filters.tiers
    if (current.includes(tier)) {
      onFilterChange({ tiers: current.filter(t => t !== tier) })
    } else {
      onFilterChange({ tiers: [...current, tier] })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-hive-cyan/50"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-lg font-bold text-white">{stats.totalNodes}</p>
          <p className="text-[10px] text-gray-500">Nodes</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-lg font-bold text-hive-cyan">{stats.totalEdges}</p>
          <p className="text-[10px] text-gray-500">Edges</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-lg font-bold text-hive-amber">{stats.totalCreators}</p>
          <p className="text-[10px] text-gray-500">Creators</p>
        </div>
      </div>

      {/* Node Types */}
      <div>
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Node Types
        </p>
        <div className="flex flex-wrap gap-2">
          {nodeTypeConfig.map(({ type, label, icon: Icon }) => {
            const isActive = filters.nodeTypes.length === 0 || filters.nodeTypes.includes(type)
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleNodeType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-hive-cyan/20 border border-hive-cyan/50 text-hive-cyan'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Clusters */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Clusters</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(clusters).map(([id, cluster]) => {
            const isActive = filters.clusters.length === 0 || filters.clusters.includes(id)
            return (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleCluster(id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'border text-white'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                }`}
                style={isActive ? { 
                  backgroundColor: cluster.color + '20',
                  borderColor: cluster.color + '50',
                } : {}}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: cluster.color }}
                />
                {cluster.label.replace(' Cluster', '')}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tiers */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Creator Tiers</p>
        <div className="flex flex-wrap gap-1.5">
          {tierConfig.map(({ tier, label, color }) => {
            const isActive = filters.tiers.length === 0 || filters.tiers.includes(tier)
            return (
              <motion.button
                key={tier}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTier(tier)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'border'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                }`}
                style={isActive ? { 
                  backgroundColor: color + '20',
                  borderColor: color + '50',
                  color: color,
                } : {}}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Min Weight Slider */}
      <div>
        <p className="text-xs text-gray-400 mb-2">
          Min Connection Strength: {(filters.minWeight * 100).toFixed(0)}%
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minWeight}
          onChange={(e) => onFilterChange({ minWeight: parseFloat(e.target.value) })}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-hive-cyan"
        />
      </div>

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-xs"
      >
        <RotateCcw className="w-3 h-3" />
        Reset Filters
      </motion.button>
    </div>
  )
}
