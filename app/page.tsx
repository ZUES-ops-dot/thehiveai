'use client'

import { motion } from 'framer-motion'
import { Users, Zap, MessageSquare, Flame } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HiveNode } from '@/components/hive/HiveNode'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'

export default function DashboardPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="page-container"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title mb-1">
            Hive <span className="gradient-text">Command Center</span>
          </h1>
          <p className="page-subtitle">
            Solana social intelligence platform
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex-shrink-0"
          animate={{ 
            boxShadow: ['0 0 10px rgba(16, 185, 129, 0.2)', '0 0 20px rgba(16, 185, 129, 0.4)', '0 0 10px rgba(16, 185, 129, 0.2)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">Demo</span>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="stats-grid">
        <HiveGlowCard glowColor="amber" delay={0} className="card-padding-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="card-label mb-1 truncate">Active Campaigns</p>
              <HivePulseNumber
                value={0}
                className="text-lg sm:text-2xl"
                color="amber"
              />
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 bg-hive-amber/10">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-hive-amber" />
            </motion.div>
          </div>
        </HiveGlowCard>

        <HiveGlowCard glowColor="cyan" delay={0.1} className="card-padding-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="card-label mb-1 truncate">Tracked Accounts</p>
              <HivePulseNumber
                value={0}
                className="text-lg sm:text-2xl"
                color="cyan"
              />
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 bg-hive-cyan/10">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-hive-cyan" />
            </motion.div>
          </div>
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" delay={0.2} className="card-padding-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="card-label mb-1 truncate">Posts Tracked</p>
              <HivePulseNumber
                value={0}
                className="text-lg sm:text-2xl"
                color="purple"
              />
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 bg-hive-purple/10">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-hive-purple" />
            </motion.div>
          </div>
        </HiveGlowCard>

        <HiveGlowCard glowColor="amber" delay={0.3} className="card-padding-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="card-label mb-1 truncate">Viral Posts</p>
              <HivePulseNumber
                value={0}
                className="text-lg sm:text-2xl"
                color="amber"
              />
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 bg-hive-amber/10">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-hive-amber" />
            </motion.div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="amber" hover={false}>
          <h2 className="section-title mb-3">Network Pulse</h2>
          <div className="grid grid-cols-4 gap-1 sm:gap-4 py-2 sm:py-4">
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="amber" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">0</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Campaigns</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="cyan" />
              <p className="text-white font-bold text-xs sm:text-base mt-1">0</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Mindshare</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="purple" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">0</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Viral</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="green" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">0</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Accounts</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center mt-4">
            Backend functionality has been removed. This is a frontend-only demo.
          </p>
        </HiveGlowCard>
      </motion.div>
    </motion.div>
  )
}
