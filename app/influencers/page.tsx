'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp, Zap, Filter, Search, AlertCircle } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { InfluencerCard } from '@/components/data/InfluencerCard'
import { useTopInfluencersQuery } from '@/lib/hooks/useLiveData'
import { useAuthStore } from '@/lib/stores/useAuthStore'

const categories = ['All', 'Founder', 'Developer', 'Trader', 'Protocol', 'Degen', 'Shiller']

export default function InfluencersPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const { connectedAccounts, hydrated } = useAuthStore((state) => ({
    connectedAccounts: state.connectedAccounts,
    hydrated: state.hydrated,
  }))

  const {
    data,
    isLoading,
    isError,
  } = useTopInfluencersQuery({ limit: 50, filterByConnected: true })

  const influencers = data?.influencers ?? []
  const noConnectedAccounts =
    hydrated && connectedAccounts.length === 0 && !isLoading

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Influencer <span className="gradient-text">Analyzer</span>
          </h1>
          <p className="text-gray-400">
            Track and analyze key voices shaping the Solana narrative
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-hive-amber/20 bg-hive-amber/5 text-gray-400 hover:text-white hover:border-hive-amber/40 transition-all cursor-pointer"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filters</span>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HiveGlowCard glowColor="amber" delay={0}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-amber/10">
              <Users className="w-5 h-5 text-hive-amber" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Tracked Accounts</p>
              <HivePulseNumber value={1247} className="text-xl" color="amber" />
            </div>
          </div>
        </HiveGlowCard>
        <HiveGlowCard glowColor="cyan" delay={0.1}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-cyan/10">
              <TrendingUp className="w-5 h-5 text-hive-cyan" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Engagement</p>
              <HivePulseNumber value={4.8} suffix="%" decimals={1} className="text-xl" color="cyan" />
            </div>
          </div>
        </HiveGlowCard>
        <HiveGlowCard glowColor="purple" delay={0.2}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-purple/10">
              <Zap className="w-5 h-5 text-hive-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Viral Posts Today</p>
              <HivePulseNumber value={42} className="text-xl" color="purple" />
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Search & Categories */}
      <motion.div variants={itemVariants} className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search influencers..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-background-card border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-hive-amber/30 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                index === 0
                  ? 'bg-hive-amber text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Influencer Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`influencer-skeleton-${index}`}
                  className="h-36 rounded-2xl border border-white/5 bg-white/5 animate-pulse"
                />
              ))}
            </>
          )}

          {isError && (
            <div className="col-span-full flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              Unable to load influencers. Please try again.
            </div>
          )}

          {!isLoading && !isError && influencers.length === 0 && (
            <div className="col-span-full text-gray-400">
              {noConnectedAccounts
                ? 'Connect your X accounts to see live influencer rankings tailored to your cohort.'
                : 'No influencer data yet. Start posting to generate rankings.'}
            </div>
          )}

          {influencers.map((account, index) => (
            <InfluencerCard
              key={account.id}
              name={account.name}
              handle={account.username}
              followers={account.followers}
              engagement={account.engagementRate}
              viralityScore={account.viralityScore}
              category={`Rank ${account.rank ?? index + 1}`}
              delay={index * 0.05}
            />
          ))}
        </div>
      </motion.div>

      {/* Load More */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-xl border border-hive-amber/30 text-hive-amber hover:bg-hive-amber/10 transition-all"
        >
          Load More Influencers
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
