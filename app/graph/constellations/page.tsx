'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Network, 
  Users, 
  Flame, 
  Briefcase,
  ArrowLeft,
  Zap,
  Trophy,
  ExternalLink
} from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { ConstellationGraph } from '@/components/graph/ConstellationGraph'
import { GraphControls } from '@/components/graph/GraphControls'
import { useConstellationData } from '@/lib/hooks/useConstellationData'
import { type GlowTier } from '@/lib/types/economy'

const tierColors: Record<GlowTier, string> = {
  prime: 'text-hive-cyan',
  lumina: 'text-yellow-400',
  echelon: 'text-hive-purple',
  apex: 'text-pink-400',
  overmind: 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent',
}

export default function ConstellationsPage() {
  const {
    nodes,
    edges,
    clusters,
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
  } = useConstellationData()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Get highlighted nodes (connected to hovered node)
  const highlightedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const connected = getConnectedNodes(hoveredNode.id)
    return new Set([hoveredNode.id, ...connected])
  }, [hoveredNode, getConnectedNodes])

  // Get node details for sidebar
  const nodeDetails = useMemo(() => {
    const node = selectedNode || hoveredNode
    if (!node) return null

    const nodeEdges = getNodeEdges(node.id)
    const connections = getConnectedNodes(node.id)
    
    return {
      node,
      edges: nodeEdges,
      connections: nodes.filter(n => connections.includes(n.id)),
    }
  }, [selectedNode, hoveredNode, getNodeEdges, getConnectedNodes, nodes])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <Link 
            href="/graph" 
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Graph
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Social <span className="gradient-text">Constellations</span>
          </h1>
          <p className="text-xs text-gray-400">
            Explore creator relationships, narrative clusters, and collaboration networks
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar - Controls */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
          <HiveGlowCard glowColor="cyan" hover={false}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-hive-cyan" />
              Graph Controls
            </h2>
            <GraphControls
              filters={filters}
              onFilterChange={setFilters}
              onReset={resetFilters}
              clusters={clusters}
              stats={stats}
            />
          </HiveGlowCard>

          {/* Legend */}
          <HiveGlowCard glowColor="amber" hover={false}>
            <h2 className="text-sm font-semibold text-white mb-3">Legend</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-hive-amber/50" />
                <span className="text-gray-400">Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-hive-cyan/50" />
                <span className="text-gray-400">Narratives</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-hive-purple/50" />
                <span className="text-gray-400">Projects</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-hive-cyan/60" />
                <span className="text-gray-400">Amplifies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-hive-amber/60" />
                <span className="text-gray-400">Collaborates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-hive-purple/60" />
                <span className="text-gray-400">Funds</span>
              </div>
            </div>
          </HiveGlowCard>
        </motion.div>

        {/* Center - Graph */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <HiveGlowCard glowColor="cyan" hover={false} className="h-[600px]">
            <ConstellationGraph
              nodes={nodes}
              edges={edges}
              clusters={clusters}
              selectedNode={selectedNode}
              hoveredNode={hoveredNode}
              onNodeClick={setSelectedNode}
              onNodeHover={setHoveredNode}
              highlightedNodes={highlightedNodes}
            />
          </HiveGlowCard>
        </motion.div>

        {/* Right Sidebar - Node Details */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
          {nodeDetails ? (
            <>
              {/* Node Info */}
              <HiveGlowCard glowColor="purple" hover={false}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-medium uppercase ${
                      nodeDetails.node.type === 'creator' ? 'text-hive-amber' :
                      nodeDetails.node.type === 'narrative' ? 'text-hive-cyan' :
                      'text-hive-purple'
                    }`}>
                      {nodeDetails.node.type}
                    </span>
                    <h3 className="text-base font-bold text-white truncate">
                      {nodeDetails.node.label}
                    </h3>
                    {nodeDetails.node.tier && (
                      <span className={`text-xs ${tierColors[nodeDetails.node.tier]}`}>
                        {nodeDetails.node.tier}
                      </span>
                    )}
                  </div>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Metrics */}
                {nodeDetails.node.metrics && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {nodeDetails.node.metrics.msp !== undefined && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-gray-500">MSP</p>
                        <p className="text-sm font-bold text-hive-cyan">
                          {nodeDetails.node.metrics.msp.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {nodeDetails.node.metrics.followers !== undefined && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-gray-500">Followers</p>
                        <p className="text-sm font-bold text-white">
                          {(nodeDetails.node.metrics.followers / 1000).toFixed(1)}k
                        </p>
                      </div>
                    )}
                    {nodeDetails.node.metrics.funding !== undefined && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-gray-500">Funding</p>
                        <p className="text-sm font-bold text-hive-amber">
                          {nodeDetails.node.metrics.funding.toLocaleString()} HC
                        </p>
                      </div>
                    )}
                    {nodeDetails.node.metrics.activity !== undefined && (
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-gray-500">Activity</p>
                        <p className="text-sm font-bold text-emerald-400">
                          {nodeDetails.node.metrics.activity}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* View Profile/Narrative */}
                {nodeDetails.node.type === 'creator' && (
                  <Link href="/profile">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-hive-amber/10 border border-hive-amber/30 text-hive-amber text-xs font-medium"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </motion.button>
                  </Link>
                )}
                {nodeDetails.node.type === 'narrative' && (
                  <Link href={`/narrative/${nodeDetails.node.id.replace('narrative:', '')}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-hive-cyan/10 border border-hive-cyan/30 text-hive-cyan text-xs font-medium"
                    >
                      View Narrative
                      <ExternalLink className="w-3 h-3" />
                    </motion.button>
                  </Link>
                )}
              </HiveGlowCard>

              {/* Connections */}
              <HiveGlowCard glowColor="cyan" hover={false}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-hive-cyan" />
                  Connections ({nodeDetails.connections.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeDetails.connections.slice(0, 10).map(conn => (
                    <motion.div
                      key={conn.id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer"
                      onClick={() => setSelectedNode(conn)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${
                          conn.type === 'creator' ? 'bg-hive-amber' :
                          conn.type === 'narrative' ? 'bg-hive-cyan' :
                          'bg-hive-purple'
                        }`} />
                        <span className="text-xs text-white truncate">{conn.label}</span>
                      </div>
                      {conn.tier && (
                        <span className={`text-[10px] ${tierColors[conn.tier]}`}>
                          {conn.tier}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </HiveGlowCard>
            </>
          ) : (
            <HiveGlowCard glowColor="purple" hover={false}>
              <div className="text-center py-8">
                <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Hover or click a node to see details
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Drag to pan • Scroll to zoom
                </p>
              </div>
            </HiveGlowCard>
          )}

          {/* Top Creators Quick View */}
          <HiveGlowCard glowColor="amber" hover={false}>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Top Creators
            </h3>
            <div className="space-y-2">
              {nodes
                .filter(n => n.type === 'creator')
                .sort((a, b) => (b.metrics?.msp || 0) - (a.metrics?.msp || 0))
                .slice(0, 5)
                .map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer"
                    onClick={() => setSelectedNode(creator)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-400/20 text-gray-300' :
                        i === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-white/10 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs text-white">{creator.label}</span>
                    </div>
                    <span className="text-[10px] text-hive-cyan">
                      {((creator.metrics?.msp || 0) / 1000).toFixed(0)}k
                    </span>
                  </motion.div>
                ))}
            </div>
          </HiveGlowCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
