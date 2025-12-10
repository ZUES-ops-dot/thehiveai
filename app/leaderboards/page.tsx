'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { TrendingUp, Crown, Medal, Award, Minus } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { type GlowTier } from '@/lib/types/economy'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { 
  staggerContainer, 
  staggerContainerFast,
  fadeIn, 
  fadeInUp,
  globalTransition,
  hoverScale,
  tapScale,
  staggerDelay
} from '@/lib/motion/presets'

import { useLeaderboardQuery, useDashboardMetricsQuery } from '@/lib/hooks/useLiveData'
import { useCampaigns } from '@/lib/hooks/useCampaigns'

const tierColors: Record<GlowTier, string> = {
  prime: 'text-hive-cyan',
  lumina: 'text-yellow-400',
  echelon: 'text-hive-purple',
  apex: 'text-pink-400',
  overmind: 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent',
}

const LEADERBOARD_LIMITS = [10, 30, 50, 100]

// Removed time period filters - leaderboard always shows lifetime totals

function LeaderboardsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentQueryString = searchParams.toString()

  const sizeParam = Number(searchParams.get('size'))
  const narrativeParam = searchParams.get('narrative')

  const initialSize = LEADERBOARD_LIMITS.includes(sizeParam) ? sizeParam : LEADERBOARD_LIMITS[0]
  const initialNarrative = narrativeParam ?? 'global'

  const [leaderboardSize, setLeaderboardSize] = useState<number>(initialSize)
  const [selectedNarrative, setSelectedNarrative] = useState<string>(initialNarrative)

  const prefersReduced = usePrefersReducedMotion()

  // Live data hooks - only show ACTIVE campaigns in filter (ended ones removed)
  // But "All Campaigns" still includes cumulative MSP from all campaigns (including ended)
  const { data: campaignsData } = useCampaigns('active')
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboardQuery({
    limit: leaderboardSize,
    campaignId: selectedNarrative !== 'global' ? selectedNarrative : undefined,
    // Always use alltime - MSP only ever increases, never resets
    period: 'alltime',
    filterByConnected: true,
  })
  const { data: metricsData } = useDashboardMetricsQuery({ filterByConnected: true })

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedNarrative && selectedNarrative !== 'global') {
      params.set('narrative', selectedNarrative)
    }
    if (leaderboardSize !== LEADERBOARD_LIMITS[0]) {
      params.set('size', leaderboardSize.toString())
    }

    const query = params.toString()
    if (query === currentQueryString) return
    router.replace(query ? `?${query}` : '?', { scroll: false })
  }, [leaderboardSize, selectedNarrative, currentQueryString, router])

  // Use centralized presets
  const containerMotion = prefersReduced ? {} : {
    variants: staggerContainer,
    initial: 'hidden',
    animate: 'visible',
  }

  const itemMotion = prefersReduced ? {} : {
    variants: fadeIn,
  }

  const narrativeOptions = useMemo(() => [
    { id: 'global', title: 'All Campaigns' },
    ...(campaignsData ?? []).map(campaign => ({ id: campaign.id, title: campaign.name })),
  ], [campaignsData])

  const selectedNarrativeLabel = narrativeOptions.find(option => option.id === selectedNarrative)?.title ?? 'All Narratives'

  const participants = leaderboardData?.participants ?? []
  const totalMsp = leaderboardData?.totalMsp ?? 0
  const topCreator = participants[0]?.username ?? '—'

  return (
    <motion.div
      {...containerMotion}
      className="page-container"
    >
      {/* Header */}
      <motion.div {...itemMotion}>
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <h1 className="page-title">
            Hive <span className="gradient-text">Leaderboards</span>
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-hive-purple/20 text-hive-purple text-[10px] font-medium">
            {selectedNarrative === 'global' ? 'GLOBAL' : 'NARRATIVE' }
          </span>
        </div>
        <p className="page-subtitle">
          {selectedNarrative === 'global'
            ? 'Top creators ranked by Mindshare Points (MSP) across all narratives'
            : `Top creators amplifying ${selectedNarrativeLabel}`}
        </p>
      </motion.div>

      {/* Narrative Filter */}
      <motion.div {...itemMotion}>
        <div className="flex flex-wrap gap-2">
          {narrativeOptions.map(option => {
            const isActive = option.id === selectedNarrative
            return (
              <button
                key={option.id}
                onClick={() => setSelectedNarrative(option.id)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? 'border-hive-cyan text-white bg-hive-cyan/10'
                    : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {option.title}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Period tabs removed - leaderboard always shows lifetime totals */}

      {/* Stats Row */}
      <motion.div {...itemMotion} className="stats-grid">
        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-hive-amber" />
            <span className="text-xs text-gray-400">Total Creators</span>
          </div>
          <HivePulseNumber value={participants.length} className="text-lg sm:text-xl" color="amber" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="cyan" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-hive-cyan" />
            <span className="text-xs text-gray-400">Total MSP</span>
          </div>
          <HivePulseNumber 
            value={totalMsp} 
            className="text-lg sm:text-xl" 
            color="cyan" 
          />
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-hive-purple" />
            <span className="text-xs text-gray-400">Top Creator</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white truncate">@{topCreator}</p>
        </HiveGlowCard>

        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-hive-amber" />
            <span className="text-xs text-gray-400">Total MSP</span>
          </div>
          <HivePulseNumber value={totalMsp} className="text-lg sm:text-xl" color="amber" />
        </HiveGlowCard>
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div {...itemMotion}>
        <HiveGlowCard glowColor="cyan" hover={false}>
          {/* Size Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Rankings</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">View:</span>
              {LEADERBOARD_LIMITS.map(limit => (
                <button
                  key={limit}
                  onClick={() => setLeaderboardSize(limit)}
                  className={`px-2 py-1 rounded-full border text-[11px] transition-colors ${
                    leaderboardSize === limit
                      ? 'border-hive-cyan text-hive-cyan bg-hive-cyan/10'
                      : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  Top {limit}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium">Rank</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium">Creator</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium hidden sm:table-cell">Tier</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium">MSP</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium hidden md:table-cell">Credits</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs text-gray-500 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardLoading && (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={`skeleton-${i}`} className="h-12 bg-white/5 animate-pulse rounded" />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!leaderboardLoading && participants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-gray-500">
                      No creators found yet. Connect accounts and start posting to appear on the leaderboard.
                    </td>
                  </tr>
                )}
                {participants.map((participant, index) => {
                  const rank = participant.rank ?? index + 1
                  const msp = participant.msp

                  // Derive tier from MSP
                  const tier: GlowTier = msp >= 100000 ? 'overmind' 
                    : msp >= 50000 ? 'apex' 
                    : msp >= 10000 ? 'echelon' 
                    : msp >= 1000 ? 'lumina' 
                    : 'prime'

                  return (
                    <motion.tr
                      key={participant.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2">
                          {rank === 1 && <Crown className="w-4 h-4 text-yellow-400" />}
                          {rank === 2 && <Medal className="w-4 h-4 text-gray-300" />}
                          {rank === 3 && <Medal className="w-4 h-4 text-amber-600" />}
                          <span className={`text-sm font-bold ${rank <= 3 ? 'text-white' : 'text-gray-400'}`}>
                            #{rank}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {participant.profileImageUrl ? (
                            <img 
                              src={participant.profileImageUrl} 
                              alt={participant.displayName} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-hive-amber/20 to-hive-cyan/20 flex items-center justify-center text-xs font-bold ${tierColors[tier]}`}>
                              {participant.displayName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{participant.displayName}</p>
                            <p className="text-[10px] text-gray-500 truncate">@{participant.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <span className={`text-xs font-medium uppercase ${tierColors[tier]}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <span className="text-sm font-bold text-hive-cyan">{msp.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right hidden md:table-cell">
                        <span className="text-sm text-hive-amber">{Math.floor(msp * 0.1).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Minus className="w-3 h-3 text-gray-500" />
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Reward Distribution Info */}
      <motion.div {...itemMotion}>
        <HiveGlowCard glowColor="amber" hover={false} className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-semibold text-white">Rewards</h2>
            <span className="text-[10px] uppercase tracking-wide text-gray-500">Top 3</span>
          </div>
          <div className="flex gap-2">
            {[
              { rank: '#1', percent: '10%', border: 'border-yellow-400/50', text: 'text-yellow-300' },
              { rank: '#2', percent: '5%', border: 'border-white/20', text: 'text-gray-200' },
              { rank: '#3', percent: '3%', border: 'border-amber-500/40', text: 'text-amber-300' },
            ].map(({ rank, percent, border, text }) => (
              <div
                key={rank}
                className={`flex-1 rounded-lg border ${border} bg-white/5 px-2 py-1.5 text-center`}
              >
                <p className="text-[10px] text-gray-400">{rank}</p>
                <p className={`text-sm font-bold ${text}`}>{percent}</p>
              </div>
            ))}
          </div>
        </HiveGlowCard>
      </motion.div>
    </motion.div>
  )
}

// Wrap in Suspense to prevent useSearchParams from causing infinite re-renders
export default function LeaderboardsPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="h-96 bg-white/5 animate-pulse rounded-xl" /></div>}>
      <LeaderboardsContent />
    </Suspense>
  )
}
