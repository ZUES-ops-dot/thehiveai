'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Coins, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Plus,
  Zap,
  Target,
  ArrowUpRight,
  Clock,
  Activity,
  DollarSign,
  Sparkles
} from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveSparkline } from '@/components/hive/HiveSparkline'

import fundingData from '@/lib/mock/projects-funding.json'

export default function ProjectDashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const { projectAccount, fundedNarratives, topCreators, recentActivity, analytics } = fundingData

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
            Project <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Fund narratives, track performance, maximize ROI
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-hive-amber to-hive-cyan text-black font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Narrative
        </motion.button>
      </motion.div>

      {/* Account Overview */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="amber" hover={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-hive-amber/30 to-hive-cyan/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-hive-amber" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{projectAccount.name}</h2>
                <p className="text-xs text-gray-400">Project ID: {projectAccount.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Total Funded</p>
                <p className="text-lg font-bold text-hive-amber">{projectAccount.totalFunded.toLocaleString()} HC</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Active Narratives</p>
                <p className="text-lg font-bold text-white">{projectAccount.activeNarratives}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">Avg. Cost/MSP</p>
                <p className="text-lg font-bold text-hive-cyan">${projectAccount.avgCostPerMsp}</p>
              </div>
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-hive-amber" />
            <span className="text-[10px] text-gray-400">Total Funded</span>
          </div>
          <HivePulseNumber value={projectAccount.totalFunded} className="text-xl" color="amber" />
          <p className="text-[10px] text-gray-500">HiveCredits</p>
        </HiveGlowCard>

        <HiveGlowCard glowColor="cyan" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-hive-cyan" />
            <span className="text-[10px] text-gray-400">MSP Generated</span>
          </div>
          <HivePulseNumber value={projectAccount.totalMspGenerated} className="text-xl" color="cyan" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-hive-purple" />
            <span className="text-[10px] text-gray-400">Creators Reached</span>
          </div>
          <HivePulseNumber value={488} className="text-xl" color="purple" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-gray-400">Avg. ROI</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">2.8x</p>
        </HiveGlowCard>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Funded Narratives */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Analytics Chart */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="cyan" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Weekly Performance</h2>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-hive-cyan" />
                    <span className="text-gray-400">MSP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-hive-amber" />
                    <span className="text-gray-400">Creators</span>
                  </div>
                </div>
              </div>
              <div className="h-32">
                <HiveSparkline data={analytics.weeklyMsp} color="cyan" height={128} />
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">+23% vs last week</span>
                </div>
                <span className="text-xs text-gray-500">Last 7 days</span>
              </div>
            </HiveGlowCard>
          </motion.div>

          {/* Funded Narratives */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="amber" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Your Funded Narratives</h2>
                <span className="text-xs text-gray-500">{fundedNarratives.length} active</span>
              </div>
              <div className="space-y-3">
                {fundedNarratives.map((narrative, index) => (
                  <Link key={narrative.narrativeId} href={`/narrative/${narrative.narrativeId}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white group-hover:text-hive-amber transition-colors truncate">
                            {narrative.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-gray-500">
                              Your funding: <span className="text-hive-amber">{narrative.funded.toLocaleString()} HC</span>
                            </span>
                            <span className="text-[10px] text-gray-500">
                              Pool: {narrative.totalPool.toLocaleString()} HC
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-hive-amber transition-colors flex-shrink-0" />
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(narrative.funded / narrative.totalPool) * 100}%` }}
                            className="h-full bg-hive-amber rounded-full"
                          />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-hive-cyan" />
                            <span className="text-gray-400">{narrative.mspGenerated.toLocaleString()} MSP</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-hive-purple" />
                            <span className="text-gray-400">{narrative.creatorsReached} creators</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            narrative.roi >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-hive-amber/20 text-hive-amber'
                          }`}>
                            {narrative.roi}x ROI
                          </span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            {narrative.daysRemaining}d
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </HiveGlowCard>
          </motion.div>
        </div>

        {/* Right Column - Top Creators & Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Top Creators */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="purple" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Top Amplifiers</h2>
                <Target className="w-4 h-4 text-hive-purple" />
              </div>
              <div className="space-y-2">
                {topCreators.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                        index === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-white/10 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-white">{creator.handle}</p>
                        <p className="text-[10px] text-gray-500">{creator.narratives} narratives</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-hive-cyan">{creator.mspForProject.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">MSP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </HiveGlowCard>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="cyan" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                <Activity className="w-4 h-4 text-hive-cyan" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white/5"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'funding' ? 'bg-hive-amber/20' :
                      activity.type === 'creator' ? 'bg-hive-cyan/20' :
                      'bg-emerald-500/20'
                    }`}>
                      {activity.type === 'funding' && <Coins className="w-3 h-3 text-hive-amber" />}
                      {activity.type === 'creator' && <Zap className="w-3 h-3 text-hive-cyan" />}
                      {activity.type === 'milestone' && <Target className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {activity.type === 'funding' && (
                        <p className="text-xs text-white">
                          Added <span className="text-hive-amber">{activity.amount} HC</span> to {activity.narrative}
                        </p>
                      )}
                      {activity.type === 'creator' && (
                        <p className="text-xs text-white">
                          <span className="text-hive-cyan">{activity.creator}</span> earned {activity.msp} MSP
                        </p>
                      )}
                      {activity.type === 'milestone' && (
                        <p className="text-xs text-white">
                          <span className="text-emerald-400">🎉</span> {activity.message}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </HiveGlowCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="amber" hover={false}>
              <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-hive-amber/10 hover:bg-hive-amber/20 transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-hive-amber" />
                  <div>
                    <p className="text-xs font-medium text-white">Create Narrative</p>
                    <p className="text-[10px] text-gray-500">Start a new funding pool</p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <DollarSign className="w-4 h-4 text-hive-cyan" />
                  <div>
                    <p className="text-xs font-medium text-white">Add Funding</p>
                    <p className="text-[10px] text-gray-500">Boost existing narratives</p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <BarChart3 className="w-4 h-4 text-hive-purple" />
                  <div>
                    <p className="text-xs font-medium text-white">View Analytics</p>
                    <p className="text-[10px] text-gray-500">Deep dive into performance</p>
                  </div>
                </motion.button>
              </div>
            </HiveGlowCard>
          </motion.div>
        </div>
      </div>

      {/* Cost Per MSP Breakdown */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="cyan" hover={false}>
          <h2 className="text-base font-semibold text-white mb-4">Cost-Per-Mindshare Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {fundedNarratives.map((narrative) => (
              <div key={narrative.narrativeId} className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400 truncate mb-1">{narrative.title}</p>
                <p className="text-lg font-bold text-hive-cyan">${narrative.costPerMsp.toFixed(3)}</p>
                <p className="text-[10px] text-gray-500">per MSP</p>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-hive-amber/10 border border-hive-amber/20">
              <p className="text-xs text-gray-400 mb-1">Average</p>
              <p className="text-lg font-bold text-hive-amber">${projectAccount.avgCostPerMsp}</p>
              <p className="text-[10px] text-gray-500">per MSP</p>
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>
    </motion.div>
  )
}
