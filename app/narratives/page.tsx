'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TrendingUp, Flame, Hash, Clock, ArrowUpRight, Coins, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveSparkline } from '@/components/hive/HiveSparkline'

import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { useDashboardMetricsQuery, useNarrativeAnalyticsQuery } from '@/lib/hooks/useLiveData'

export default function NarrativesPage() {
  const [showAllPools, setShowAllPools] = useState(false)
  
  // Live data hooks
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns('active')
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetricsQuery({ filterByConnected: true })
  const trendingCampaigns = metricsData?.trendingCampaigns ?? []
  const trendingCampaignIds = useMemo(() => trendingCampaigns.slice(0, 6).map((campaign) => campaign.id), [trendingCampaigns])
  const { data: analyticsData, isLoading: analyticsLoading } = useNarrativeAnalyticsQuery({
    campaignIds: trendingCampaignIds,
    limit: trendingCampaignIds.length || undefined,
  })
  const analyticsMap = useMemo(() => {
    const records = analyticsData?.records ?? []
    return new Map(records.map((record) => [record.analytics.campaignId, record]))
  }, [analyticsData])
  
  const activeCampaigns = campaigns ?? []

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
  
  const displayedCampaigns = showAllPools 
    ? activeCampaigns 
    : activeCampaigns.slice(0, 4)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="page-container"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="page-title mb-1">
          Narratives <span className="gradient-text">Explorer</span>
        </h1>
        <p className="page-subtitle">
          Discover emerging storylines and trending topics in the Solana ecosystem
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="stats-grid">
        <HiveGlowCard glowColor="amber" delay={0}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-amber/10">
              <Flame className="w-5 h-5 text-hive-amber" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Campaigns</p>
              {metricsLoading ? (
                <div className="h-6 w-12 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber value={metricsData?.stats.activeCampaigns ?? 0} className="text-xl" color="amber" />
              )}
            </div>
          </div>
        </HiveGlowCard>
        <HiveGlowCard glowColor="cyan" delay={0.1}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-cyan/10">
              <TrendingUp className="w-5 h-5 text-hive-cyan" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Tracked Accounts</p>
              {metricsLoading ? (
                <div className="h-6 w-12 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber value={metricsData?.stats.trackedAccounts ?? 0} className="text-xl" color="cyan" />
              )}
            </div>
          </div>
        </HiveGlowCard>
        <HiveGlowCard glowColor="purple" delay={0.2}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hive-purple/10">
              <Hash className="w-5 h-5 text-hive-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Posts</p>
              {metricsLoading ? (
                <div className="h-6 w-12 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber value={metricsData?.stats.totalPosts ?? 0} className="text-xl" color="purple" />
              )}
            </div>
          </div>
        </HiveGlowCard>
        <HiveGlowCard glowColor="amber" delay={0.3}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-xl font-bold text-white">
                {metricsData?.lastUpdated 
                  ? new Date(metricsData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Now'}
              </p>
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Active Campaigns */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Active Campaigns</h2>
          <span className="text-xs text-gray-500">{activeCampaigns.length} active campaigns</span>
        </div>
        
        {campaignsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!campaignsLoading && activeCampaigns.length === 0 && (
          <div className="p-8 rounded-xl border border-white/5 bg-background-card/50 text-center">
            <p className="text-gray-400">No active campaigns yet. Create one to start tracking narratives.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCampaigns.map((campaign, index) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl border border-white/5 bg-background-card/50 backdrop-blur-sm hover:border-hive-amber/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-hive-amber/20 text-hive-amber">
                        #{campaign.projectTag}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                        campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-hive-amber transition-colors truncate">
                      {campaign.name}
                    </h3>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-hive-amber transition-colors flex-shrink-0" />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400">Campaign</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        {activeCampaigns.length > 4 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAllPools(!showAllPools)}
            className="w-full mt-4 py-2 rounded-lg border border-hive-amber/20 bg-hive-amber/5 text-hive-amber text-sm font-medium hover:bg-hive-amber/10 transition-colors flex items-center justify-center gap-2"
          >
            {showAllPools ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View All {activeCampaigns.length} Campaigns
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Trending Campaigns */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-white mb-4">Trending Campaigns</h2>
        
        {metricsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`trend-skeleton-${i}`} className="h-48 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!metricsLoading && trendingCampaigns.length === 0 && (
          <div className="p-8 rounded-xl border border-white/5 bg-background-card/50 text-center">
            <p className="text-gray-400">No trending campaigns yet. Start tracking to see trends.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingCampaigns.map((campaign, index) => {
            const analytics = analyticsMap.get(campaign.id)
            const keywords = analytics?.analytics.keywords ?? []
            const topAccounts = analytics?.analytics.topAccounts ?? []
            const sponsorPool = analytics?.analytics.sponsorPool ?? []
            const lastSynced = analytics?.analytics.lastSynced ?? null
            return (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative p-6 rounded-xl border border-white/5 bg-background-card/50 backdrop-blur-sm hover:border-hive-amber/30 transition-all cursor-pointer group overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-hive-amber/5 to-hive-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Pulse animation */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-hive-amber/10 blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-10 h-10 rounded-lg bg-hive-amber/20 flex items-center justify-center"
                        whileHover={{ rotate: 10 }}
                      >
                        <span className="text-lg font-bold text-hive-amber">#{index + 1}</span>
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-hive-amber transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-xs text-gray-500">{campaign.postCount.toLocaleString()} posts</p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-hive-amber/10 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-hive-amber" />
                    </motion.div>
                  </div>

                  {/* Tag Badge */}
                  <div className="mb-3 px-2 py-1.5 rounded-lg bg-hive-cyan/10 border border-hive-cyan/20">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-hive-cyan" />
                      <span className="text-xs text-hive-cyan font-medium">#{campaign.projectTag}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Growth</p>
                        <div className={`flex items-center gap-1 ${campaign.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <TrendingUp className={`w-3 h-3 ${campaign.growth < 0 ? 'rotate-180' : ''}`} />
                          <span className="text-sm font-medium">
                            {campaign.growth >= 0 ? '+' : ''}{campaign.growth}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Posts</p>
                        <span className="text-sm font-medium text-hive-amber">{campaign.postCount}</span>
                      </div>
                      <HiveSparkline
                        data={[10, 25, 15, 35, 28, 45, 52, 48, 60, 75].map(v => v * (campaign.growth / 50 + 1))}
                        color={campaign.growth >= 50 ? 'amber' : 'cyan'}
                        width={60}
                        height={25}
                      />
                    </div>

                    {/* Narrative analytics */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {analyticsLoading && keywords.length === 0 && (
                            <div className="h-6 w-20 rounded bg-white/10 animate-pulse" />
                          )}
                          {keywords.length === 0 && !analyticsLoading && (
                            <span className="text-xs text-gray-500">No keywords extracted yet</span>
                          )}
                          {keywords.slice(0, 4).map((keyword) => (
                            <span
                              key={keyword.tag}
                              className="text-xs px-2 py-1 rounded-full bg-hive-amber/10 border border-hive-amber/30 text-hive-amber"
                            >
                              #{keyword.tag} · {keyword.count}
                            </span>
                          ))}
                        </div>
                      </div>

                      {sponsorPool.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Sponsor Pool</p>
                          <div className="flex flex-wrap gap-2">
                            {sponsorPool.slice(0, 2).map((sponsor) => (
                              <span
                                key={`${campaign.id}-${sponsor.sponsorName}`}
                                className="text-xs px-2 py-1 rounded-lg bg-hive-cyan/10 border border-hive-cyan/20 text-hive-cyan"
                              >
                                {sponsor.sponsorName}
                                {sponsor.amount ? ` · ${Intl.NumberFormat('en', { notation: 'compact' }).format(sponsor.amount)}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {lastSynced && (
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">
                        Last synced {new Date(lastSynced).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          )})}
        </div>
      </motion.div>
    </motion.div>
  )
}
