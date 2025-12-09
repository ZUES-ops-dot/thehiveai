'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Network, Maximize2, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HiveClusterGraph } from '@/components/hive/HiveClusterGraph'

import networkData from '@/lib/mock/network.json'

export default function GraphPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 h-[calc(100vh-12rem)]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Hive <span className="gradient-text">Graph</span>
          </h1>
          <p className="text-sm text-gray-400">
            Full-screen network visualization of the Solana social ecosystem
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Link href="/graph/constellations">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-hive-amber to-hive-cyan text-black font-bold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Constellations
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg border border-white/10 bg-background-card hover:border-hive-amber/30 transition-all"
          >
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg border border-white/10 bg-background-card hover:border-hive-amber/30 transition-all"
          >
            <ZoomOut className="w-5 h-5 text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg border border-white/10 bg-background-card hover:border-hive-amber/30 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg border border-hive-amber/30 bg-hive-amber/10 hover:bg-hive-amber/20 transition-all"
          >
            <Maximize2 className="w-5 h-5 text-hive-amber" />
          </motion.button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-hive-amber shadow-glow-amber-sm" />
          <span className="text-gray-400">Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-hive-cyan shadow-glow-cyan-sm" />
          <span className="text-gray-400">Influencers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-hive-purple shadow-glow-purple" />
          <span className="text-gray-400">Narratives</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500" />
          <span className="text-gray-400">Wallets</span>
        </div>
      </div>

      {/* Full-screen Graph */}
      <HiveGlowCard glowColor="amber" hover={false} className="flex-1 h-full min-h-[500px]">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Background gradient pulse */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-hive-amber/5 via-transparent to-transparent"
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <HiveClusterGraph
            nodes={networkData.nodes}
            links={networkData.links}
            width={1100}
            height={600}
            className="relative z-10"
          />

          {/* Animated corner decorations */}
          <motion.div
            className="absolute top-4 left-4 w-20 h-20 border-t-2 border-l-2 border-hive-amber/30 rounded-tl-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-hive-cyan/30 rounded-tr-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-20 h-20 border-b-2 border-l-2 border-hive-purple/30 rounded-bl-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-4 right-4 w-20 h-20 border-b-2 border-r-2 border-hive-amber/30 rounded-br-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />
        </div>
      </HiveGlowCard>
    </motion.div>
  )
}
