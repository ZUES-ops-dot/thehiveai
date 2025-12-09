'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Zap, MessageSquare, Flame, AlertCircle, Activity } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HiveNode } from '@/components/hive/HiveNode'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveSparkline } from '@/components/hive/HiveSparkline'
import { HiveClusterGraph } from '@/components/hive/HiveClusterGraph'
import { TweetPreview } from '@/components/data/TweetPreview'
import { InfluencerCard } from '@/components/data/InfluencerCard'
import { useRecentPostsQuery, useTopInfluencersQuery, useDashboardMetricsQuery } from '@/lib/hooks/useLiveData'
import { useAuthStore } from '@/lib/stores/useAuthStore'

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

  const { connectedAccounts, hydrated } = useAuthStore((state) => ({
    connectedAccounts: state.connectedAccounts,
    hydrated: state.hydrated,
  }))

  const {
    data: recentPostsData,
    isLoading: recentPostsLoading,
    isError: recentPostsError,
  } = useRecentPostsQuery({ limit: 4, filterByConnected: true })

  const {
    data: topInfluencersData,
    isLoading: topInfluencersLoading,
    isError: topInfluencersError,
  } = useTopInfluencersQuery({ limit: 3, filterByConnected: true })

  const {
    data: metricsData,
    isLoading: metricsLoading,
  } = useDashboardMetricsQuery({ filterByConnected: true })

  const prioritizedActivityFeed = recentPostsData?.posts ?? []
  const topInfluencers = topInfluencersData?.influencers ?? []
  const trendingCampaigns = metricsData?.trendingCampaigns ?? []

  const clusterGraphData = useMemo(() => {
    const nodes: Array<{ id: string; label: string; value: number; group: string }> = []
    const links: Array<{ source: string; target: string; value: number }> = []

    trendingCampaigns.forEach((campaign) => {
      nodes.push({
        id: `campaign-${campaign.id}`,
        label: campaign.name,
        value: Math.max(10, Math.min(campaign.postCount / 10, 30)),
        group: 'project',
      })
    })

    topInfluencers.forEach((influencer, index) => {
      const value = influencer.followers ? Math.min(Math.max(influencer.followers / 1000, 12), 28) : 15
      nodes.push({
        id: `influencer-${influencer.id ?? influencer.username ?? index}`,
        label: influencer.name ?? influencer.username ?? 'Influencer',
        value,
        group: 'influencer',
      })
    })

    connectedAccounts.forEach((account, index) => {
      nodes.push({
        id: `wallet-${account.xUserId ?? index}`,
        label: account.handle,
        value: 14,
        group: 'wallet',
      })
    })

    if (nodes.length === 0 && metricsData?.stats) {
      if (metricsData.stats.activeCampaigns > 0) {
        nodes.push({
          id: 'aggregate-campaigns',
          label: 'Campaigns',
          value: Math.min(Math.max(metricsData.stats.activeCampaigns, 10), 30),
          group: 'project',
        })
      }
      if (metricsData.stats.trackedAccounts > 0) {
        nodes.push({
          id: 'aggregate-accounts',
          label: 'Accounts',
          value: Math.min(Math.max(metricsData.stats.trackedAccounts / 5, 10), 30),
          group: 'wallet',
        })
      }
    }

    if (trendingCampaigns.length > 0) {
      topInfluencers.forEach((influencer, index) => {
        const targetCampaign = trendingCampaigns[index % trendingCampaigns.length]
        links.push({
          source: `influencer-${influencer.id ?? influencer.username ?? index}`,
          target: `campaign-${targetCampaign.id}`,
          value: 2 + (influencer.engagementRate ?? 0),
        })
      })
    }

    if (topInfluencers.length > 0) {
      connectedAccounts.forEach((account, index) => {
        const targetInfluencer = topInfluencers[index % topInfluencers.length]
        links.push({
          source: `wallet-${account.xUserId ?? index}`,
          target: `influencer-${targetInfluencer.id ?? targetInfluencer.username ?? index}`,
          value: 1.5,
        })
      })
    } else if (trendingCampaigns.length > 0) {
      connectedAccounts.forEach((account, index) => {
        const targetCampaign = trendingCampaigns[index % trendingCampaigns.length]
        links.push({
          source: `wallet-${account.xUserId ?? index}`,
          target: `campaign-${targetCampaign.id}`,
          value: 1,
        })
      })
    }

    return { nodes, links }
  }, [trendingCampaigns, topInfluencers, connectedAccounts, metricsData?.stats])

  const noConnectedAccounts =
    hydrated && connectedAccounts.length === 0 && !recentPostsLoading && !topInfluencersLoading

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
            Real-time Solana social intelligence
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
          <span className="text-xs text-emerald-400">Live</span>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="stats-grid">
        <HiveGlowCard glowColor="amber" delay={0} className="card-padding-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="card-label mb-1 truncate">Active Campaigns</p>
              {metricsLoading ? (
                <div className="h-7 w-16 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber
                  value={metricsData?.stats.activeCampaigns ?? 0}
                  className="text-lg sm:text-2xl"
                  color="amber"
                />
              )}
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
              {metricsLoading ? (
                <div className="h-7 w-16 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber
                  value={metricsData?.stats.trackedAccounts ?? 0}
                  className="text-lg sm:text-2xl"
                  color="cyan"
                />
              )}
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
              {metricsLoading ? (
                <div className="h-7 w-16 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber
                  value={metricsData?.stats.totalPosts ?? 0}
                  className="text-lg sm:text-2xl"
                  color="purple"
                />
              )}
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
              {metricsLoading ? (
                <div className="h-7 w-16 bg-white/10 animate-pulse rounded" />
              ) : (
                <HivePulseNumber
                  value={metricsData?.stats.viralPosts ?? 0}
                  className="text-lg sm:text-2xl"
                  color="amber"
                />
              )}
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 bg-hive-amber/10">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-hive-amber" />
            </motion.div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 section-gap">
        {/* Hive Cluster Map */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <HiveGlowCard glowColor="amber" hover={false} className="h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="section-title">Hive Network</h2>
                  <p className="text-xs text-gray-500">
                    Live graph derived from tracked campaigns, influencers, and your connected accounts
                  </p>
                </div>
                <span className="text-[11px] text-gray-500">
                  {clusterGraphData.nodes.length > 0 ? 'Updated in real time' : 'Connect accounts to populate'}
                </span>
              </div>

              <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl border border-white/5 overflow-hidden">
                {clusterGraphData.nodes.length > 0 ? (
                  <HiveClusterGraph
                    nodes={clusterGraphData.nodes}
                    links={clusterGraphData.links}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500 text-center px-6">
                    Connect X accounts or join campaigns to generate a live Hive network.
                  </div>
                )}
              </div>

              {/* Compact stats - 4-column grid that fits on mobile */}
              <div className="grid grid-cols-4 gap-1 sm:gap-3">
                <div className="text-center p-1.5 sm:p-2 rounded-lg bg-white/5">
                  <HiveNode size="sm" color="amber" />
                  <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.activeCampaigns ?? 0}</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500">Campaigns</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 rounded-lg bg-white/5">
                  <HiveNode size="sm" color="cyan" />
                  <p className="text-white font-bold text-xs sm:text-sm mt-1">{(metricsData?.stats.totalMsp ?? 0).toLocaleString()}</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500">MSP</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 rounded-lg bg-white/5">
                  <HiveNode size="sm" color="purple" />
                  <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.viralPosts ?? 0}</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500">Viral</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 rounded-lg bg-white/5">
                  <HiveNode size="sm" color="green" />
                  <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.trackedAccounts ?? 0}</p>
                  <p className="text-[8px] sm:text-[9px] text-gray-500">Accounts</p>
                </div>
              </div>
            </div>
          </HiveGlowCard>
        </motion.div>

        {/* Trending Campaigns */}
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="cyan" hover={false} className="h-full">
            <h2 className="section-title mb-3">Trending Campaigns</h2>
            <div className="space-y-2 sm:space-y-3">
              {metricsLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={`trend-skeleton-${index}`} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!metricsLoading && (metricsData?.trendingCampaigns ?? []).length === 0 && (
                <div className="text-sm text-gray-400">
                  No active campaigns yet. Create one to start tracking.
                </div>
              )}

              {(metricsData?.trendingCampaigns ?? []).slice(0, 5).map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-background/50 border border-white/5 hover:border-hive-cyan/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <motion.span
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-hive-cyan/20 flex items-center justify-center text-hive-cyan text-xs sm:text-sm font-bold flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                    >
                      {index + 1}
                    </motion.span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white group-hover:text-hive-cyan transition-colors truncate">
                        {campaign.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{campaign.postCount.toLocaleString()} posts</p>
                    </div>
                  </div>
                  <div className={`text-[10px] sm:text-xs font-medium flex-shrink-0 ml-2 ${campaign.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {campaign.growth >= 0 ? '+' : ''}{campaign.growth}%
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveGlowCard>
        </motion.div>
      </div>

      {/* Activity Feed & Top Influencers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 section-gap">
        {/* Activity Feed */}
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="amber" hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Activity Feed</h2>
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-hive-amber" />
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-hive pr-2">
              {recentPostsLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`activity-skeleton-${index}`}
                      className="h-20 rounded-xl border border-white/5 bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {recentPostsError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Unable to load recent activity. Please try again.
                </div>
              )}

              {!recentPostsLoading && !recentPostsError && prioritizedActivityFeed.length === 0 && (
                <div className="text-sm text-gray-400">
                  {noConnectedAccounts
                    ? 'Connect up to three X accounts to start tracking real-time activity.'
                    : 'No recent activity yet for your tracked accounts.'}
                </div>
              )}

              {prioritizedActivityFeed.map((tweet, index) => {
                const author = {
                  name: tweet.author?.displayName ?? tweet.author?.username ?? 'Unknown Creator',
                  handle: tweet.author?.username ?? 'unknown',
                  avatar: tweet.author?.profileImageUrl ?? undefined,
                  verified: false,
                }

                return (
                  <TweetPreview
                    key={tweet.id}
                    author={author}
                    content={tweet.content}
                    likes={tweet.metrics.likes}
                    retweets={tweet.metrics.retweets}
                    replies={tweet.metrics.replies}
                    timestamp={new Date(tweet.postedAt)}
                    delay={index * 0.1}
                  />
                )
              })}
            </div>
          </HiveGlowCard>
        </motion.div>

        {/* Top Influencers */}
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="purple" hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Top Influencers</h2>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-hive-purple" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {topInfluencersLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`influencer-skeleton-${index}`}
                      className="h-28 rounded-xl border border-white/5 bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {topInfluencersError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Unable to load influencer rankings. Please try again.
                </div>
              )}

              {!topInfluencersLoading && !topInfluencersError && topInfluencers.length === 0 && (
                <div className="text-sm text-gray-400">
                  {noConnectedAccounts
                    ? 'Connect X accounts to see top performers from your cohort.'
                    : 'No influencer data yet. Keep posting to climb the leaderboard.'}
                </div>
              )}

              {topInfluencers.map((account, index) => (
                <InfluencerCard
                  key={account.id}
                  name={account.name}
                  handle={account.username}
                  avatar={account.profileImageUrl ?? undefined}
                  followers={account.followers}
                  engagement={account.engagementRate * 100}
                  viralityScore={account.viralityScore}
                  category={`Rank ${account.rank ?? index + 1}`}
                  delay={index * 0.05}
                />
              ))}
            </div>
          </HiveGlowCard>
        </motion.div>
      </div>

      {/* Network Pulse - 4-column grid that fits on mobile */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="amber" hover={false}>
          <h2 className="section-title mb-3">Network Pulse</h2>
          <div className="grid grid-cols-4 gap-1 sm:gap-4 py-2 sm:py-4">
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="amber" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.activeCampaigns ?? 0}</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Campaigns</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="cyan" />
              <p className="text-white font-bold text-xs sm:text-base mt-1">{(metricsData?.stats.totalMsp ?? 0).toLocaleString()}</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Mindshare</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="purple" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.viralPosts ?? 0}</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Viral</p>
            </div>
            <div className="flex flex-col items-center">
              <HiveNode size="sm" color="green" />
              <p className="text-white font-bold text-xs sm:text-sm mt-1">{metricsData?.stats.trackedAccounts ?? 0}</p>
              <p className="text-[8px] sm:text-[9px] text-gray-500">Accounts</p>
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>
    </motion.div>
  )
}
