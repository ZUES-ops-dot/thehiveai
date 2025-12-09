'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Zap, 
  Trophy,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Activity,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  Wallet,
  Check,
  Loader2
} from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveSparkline } from '@/components/hive/HiveSparkline'
import { type GlowTier } from '@/lib/types/economy'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import {
  useCampaigns,
  useCampaignLeaderboard,
  useJoinCampaignMutation,
  useUserCampaignData,
} from '@/lib/hooks/useCampaigns'
import type { TrackingStatus } from '@/lib/engine/hashtag-tracker'

import narrativesData from '@/lib/mock/narratives.json'

// Mock activity data
const mockActivity = [
  { id: 1, creator: '@defi_degen', action: 'posted thread', msp: 450, time: '2m ago' },
  { id: 2, creator: '@alpha_hunter', action: 'shared insight', msp: 320, time: '5m ago' },
  { id: 3, creator: '@solana_sage', action: 'created video', msp: 890, time: '12m ago' },
  { id: 4, creator: '@nft_ninja', action: 'commented', msp: 120, time: '18m ago' },
  { id: 5, creator: '@whale_watcher', action: 'posted thread', msp: 560, time: '25m ago' },
]

// Mock momentum data
const mockMomentumData = [45, 52, 48, 61, 58, 72, 68, 85, 78, 92, 88, 95]

const tierColors: Record<GlowTier, string> = {
  prime: 'text-hive-cyan',
  lumina: 'text-yellow-400',
  echelon: 'text-hive-purple',
  apex: 'text-pink-400',
  overmind: 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent',
}

const LEADERBOARD_LIMITS = [10, 30, 50, 100]

export default function NarrativePage() {
  const params = useParams()
  const narrativeId = params.id as string
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })
  const [joinStatus, setJoinStatus] = useState<'idle' | 'joining' | 'joined'>('idle')
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [leaderboardSize, setLeaderboardSize] = useState<number>(LEADERBOARD_LIMITS[0])
  const [walletAddress, setWalletAddress] = useState('')
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletSaved, setWalletSaved] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  const { user, isAuthenticated } = useAuthStore()
  const { data: campaigns = [] } = useCampaigns('active')
  const { data: userData } = useUserCampaignData()
  const joinMutation = useJoinCampaignMutation()

  // Find narrative
  const narrative = narrativesData.narratives.find(n => n.id === narrativeId)
  const linkedCampaign = narrative?.campaignId ? campaigns.find(c => c.id === narrative.campaignId) : undefined

  const { data: leaderboardData } = useCampaignLeaderboard(linkedCampaign?.id, leaderboardSize)
  const campaignLeaderboard = leaderboardData?.leaderboard ?? []

  const isJoined = userData?.participations.some(p => p.campaignId === linkedCampaign?.id) ?? false

  useEffect(() => {
    if (isJoined) {
      setJoinStatus('joined')
    } else {
      setJoinStatus('idle')
    }
  }, [isJoined])

  // Calculate time left
  useEffect(() => {
    if (!narrative) return
    
    const updateTime = () => {
      const now = new Date()
      const dist = new Date(narrative.distributionDate)
      const diff = dist.getTime() - now.getTime()
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        })
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [narrative])

  // Fetch live tracking velocity when campaign is available
  useEffect(() => {
    if (!linkedCampaign) {
      setTrackingStatus(null)
      return
    }

    let active = true
    const fetchVelocity = async () => {
      try {
        setTrackingLoading(true)
        setTrackingError(null)
        const response = await fetch(`/api/tracking?tag=${linkedCampaign.projectTag}&status=true`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error(`Failed to load tracking data (${response.status})`)
        }
        const data = await response.json()
        if (active) {
          setTrackingStatus(data)
        }
      } catch (error) {
        if (active) {
          setTrackingError(error instanceof Error ? error.message : 'Failed to load tracking data')
        }
      } finally {
        if (active) {
          setTrackingLoading(false)
        }
      }
    }

    fetchVelocity()
    const interval = setInterval(fetchVelocity, 60_000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [linkedCampaign?.projectTag])

  // Fetch existing wallet address when joined
  useEffect(() => {
    if (!isJoined || !linkedCampaign) return

    const fetchWallet = async () => {
      try {
        const response = await fetch(`/api/campaigns/${linkedCampaign.id}/wallet`, {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          if (data.walletAddress) {
            setWalletAddress(data.walletAddress)
            setWalletSaved(true)
          }
        }
      } catch {
        // Ignore errors on initial fetch
      }
    }

    fetchWallet()
  }, [isJoined, linkedCampaign?.id])

  const handleSaveWallet = async () => {
    if (!linkedCampaign || !walletAddress.trim()) return

    setWalletSaving(true)
    setWalletError(null)

    try {
      const response = await fetch(`/api/campaigns/${linkedCampaign.id}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save wallet')
      }

      setWalletSaved(true)
      setTimeout(() => setWalletSaved(false), 3000)
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Failed to save wallet')
    } finally {
      setWalletSaving(false)
    }
  }

  if (!narrative) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-white mb-4">Narrative Not Found</h1>
        <Link href="/narratives" className="text-hive-amber hover:underline">
          ← Back to Narratives
        </Link>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const fundingPercentage = Math.min((narrative.fundingTotal / 30000) * 100, 100)
  const velocitySeries = trackingStatus?.snapshots?.length
    ? trackingStatus.snapshots.map(snapshot => snapshot.totalMSP)
    : mockMomentumData

  const momentumTopHundred = useMemo(() => {
    return campaignLeaderboard.slice(0, 100).reduce((sum, participant) => sum + participant.msp, 0)
  }, [campaignLeaderboard])

  const handleAmplifyClick = () => {
    if (!linkedCampaign) return

    if (!isAuthenticated || !user) {
      window.location.href = '/api/auth/x'
      return
    }

    if (isJoined) {
      setJoinStatus('joined')
      return
    }

    setJoinStatus('joining')
    joinMutation.mutate(
      { campaignId: linkedCampaign.id },
      {
        onSuccess: () => setJoinStatus('joined'),
        onError: () => setJoinStatus('idle'),
      }
    )
  }

  const amplifyLabel = !linkedCampaign
    ? 'Campaign Coming Soon'
    : isJoined
      ? 'You’re Amplifying'
      : isAuthenticated
        ? 'Amplify Now'
        : 'Connect X to Amplify'

  const amplifyDisabled = !linkedCampaign || joinStatus === 'joining' || isJoined

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Link 
          href="/narratives" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Narratives</span>
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="amber" hover={false}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {narrative.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-hive-amber/20 text-hive-amber"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                {narrative.title}
              </h1>
              <p className="text-sm text-gray-400 mb-4">{narrative.description}</p>
              
              {/* Funding Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Funding Pool</span>
                  <span className="text-sm font-bold text-hive-amber">
                    {narrative.fundingTotal.toLocaleString()} HC
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fundingPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-hive-amber to-hive-cyan rounded-full"
                  />
                </div>
              </div>

              {/* Sponsors */}
              <div className="flex flex-wrap gap-2">
                {narrative.sponsors.map(sponsor => (
                  <div 
                    key={sponsor.projectId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-hive-amber/30 to-hive-cyan/30" />
                    <span className="text-xs text-white">{sponsor.name}</span>
                    <span className="text-[10px] text-hive-amber">{sponsor.amount.toLocaleString()} HC</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time & Actions */}
            <div className="flex flex-col items-end gap-4">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 mb-1">Distribution in</p>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{timeLeft.days}</p>
                    <p className="text-[10px] text-gray-500">days</p>
                  </div>
                  <span className="text-gray-500">:</span>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{timeLeft.hours}</p>
                    <p className="text-[10px] text-gray-500">hrs</p>
                  </div>
                  <span className="text-gray-500">:</span>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{timeLeft.minutes}</p>
                    <p className="text-[10px] text-gray-500">min</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAmplifyClick}
                disabled={amplifyDisabled}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-opacity ${
                  amplifyDisabled
                    ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-hive-amber to-hive-cyan text-black'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {joinStatus === 'joining' ? 'Joining…' : amplifyLabel}
              </motion.button>
              {linkedCampaign && (
                <div className="text-right space-y-1">
                  <p className="text-[11px] text-gray-400">
                    Campaign: <span className="text-white font-medium">{linkedCampaign.name}</span>
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {isJoined
                      ? 'You are now on this leaderboard. Start posting with #HiveAI + #' + linkedCampaign.projectTag + '.'
                      : 'Everyone starts at rank 0. Post with #HiveAI #' + linkedCampaign.projectTag + ' to earn MSP.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Wallet Input Section - Only shown after joining */}
      {(isJoined || joinStatus === 'joined') && linkedCampaign && (
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="purple" hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-hive-purple" />
              <h2 className="text-base font-semibold text-white">Reward Wallet</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Enter your Solana wallet address to receive rewards when this narrative distributes.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value)
                  setWalletSaved(false)
                  setWalletError(null)
                }}
                placeholder="Enter your Solana wallet address"
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-hive-purple"
              />
              <button
                onClick={handleSaveWallet}
                disabled={walletSaving || !walletAddress.trim()}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  walletSaved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : walletSaving || !walletAddress.trim()
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-hive-purple text-white hover:bg-hive-purple/80'
                }`}
              >
                {walletSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : walletSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  'Save Wallet'
                )}
              </button>
            </div>
            {walletError && (
              <p className="text-xs text-red-400 mt-2">{walletError}</p>
            )}
            <p className="text-[10px] text-gray-500 mt-3">
              Your wallet will be included in the reward distribution list for this narrative.
            </p>
          </HiveGlowCard>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <HiveGlowCard glowColor="cyan" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-hive-cyan" />
            <span className="text-[10px] text-gray-400">Velocity / Hour</span>
          </div>
          <HivePulseNumber value={trackingStatus?.velocityPerHour ?? 0} className="text-xl" color="cyan" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-hive-purple" />
            <span className="text-[10px] text-gray-400">Velocity / Day</span>
          </div>
          <HivePulseNumber value={trackingStatus?.velocityPerDay ?? 0} className="text-xl" color="purple" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-hive-amber" />
            <span className="text-[10px] text-gray-400">Momentum (Top 100 MSP)</span>
          </div>
          <HivePulseNumber value={momentumTopHundred} className="text-xl" color="amber" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="cyan" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-hive-cyan" />
            <span className="text-[10px] text-gray-400">Sentiment</span>
          </div>
          <p className="text-xl font-bold text-hive-cyan">{(narrative.sentimentScore * 100).toFixed(0)}%</p>
        </HiveGlowCard>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Momentum & Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Momentum Graph */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="cyan" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Velocity Pulse</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {trackingLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Syncing…
                    </span>
                  ) : (
                    <span>Last check {trackingStatus?.lastChecked ? new Date(trackingStatus.lastChecked).toLocaleTimeString() : '—'}</span>
                  )}
                </div>
              </div>
              <div className="h-32">
                <HiveSparkline data={velocitySeries} color="cyan" height={128} />
              </div>
              {trackingError && (
                <p className="text-xs text-red-400 mt-2">{trackingError}</p>
              )}
            </HiveGlowCard>
          </motion.div>

          {/* Live Activity */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="amber" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Live Activity</h2>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-gray-400">Live</span>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-hive-amber/20 to-hive-cyan/20 flex items-center justify-center text-[10px] font-bold text-hive-amber">
                        {activity.creator.charAt(1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-white">
                          <span className="font-medium">{activity.creator}</span>
                          <span className="text-gray-400"> {activity.action}</span>
                        </p>
                        <p className="text-[10px] text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-hive-cyan">+{activity.msp} MSP</span>
                  </motion.div>
                ))}
              </div>
            </HiveGlowCard>
          </motion.div>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="space-y-4 sm:space-y-6">
          {/* Narrative Leaderboard */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="purple" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Top Amplifiers</h2>
                  <p className="text-[11px] text-gray-500">Real campaign leaderboard data</p>
                </div>
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-gray-500">View:</span>
                {LEADERBOARD_LIMITS.map(limit => (
                  <button
                    key={limit}
                    onClick={() => setLeaderboardSize(limit)}
                    className={`px-2 py-1 rounded-full border text-[11px] transition-colors ${
                      leaderboardSize === limit
                        ? 'border-hive-cyan text-hive-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    Top {limit}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {campaignLeaderboard.length === 0 ? (
                  <p className="text-xs text-gray-500">No participants yet. Be the first to amplify!</p>
                ) : (
                  campaignLeaderboard.map((participant, index) => {
                    const rank = participant.rank > 0 ? participant.rank : index + 1
                    const badgeClass = rank === 1
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : rank === 2
                        ? 'bg-gray-400/20 text-gray-300'
                        : rank === 3
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-white/10 text-gray-400'
                    return (
                      <motion.div
                        key={`${participant.id}-${rank}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${badgeClass}`}>
                            {rank}
                          </span>
                          <div className="flex items-center gap-2 min-w-0">
                            {participant.profileImageUrl ? (
                              <img
                                src={participant.profileImageUrl}
                                alt={participant.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                                {participant.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate">{participant.displayName}</p>
                              <p className="text-[10px] text-gray-500 truncate">@{participant.username}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-hive-cyan">{participant.msp.toLocaleString()} MSP</p>
                          <p className="text-[10px] text-gray-500">{participant.postCount} posts</p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
              <Link 
                href={`/leaderboards?narrative=${narrative.id}`}
                className="flex items-center justify-center gap-1 mt-4 text-xs text-hive-amber hover:underline"
              >
                View Global Leaderboards
                <ExternalLink className="w-3 h-3" />
              </Link>
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
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <MessageCircle className="w-4 h-4 text-hive-cyan" />
                  <div>
                    <p className="text-xs font-medium text-white">Post Thread</p>
                    <p className="text-[10px] text-gray-500">+200-500 MSP</p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <Share2 className="w-4 h-4 text-hive-amber" />
                  <div>
                    <p className="text-xs font-medium text-white">Share Insight</p>
                    <p className="text-[10px] text-gray-500">+100-300 MSP</p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <BarChart3 className="w-4 h-4 text-hive-purple" />
                  <div>
                    <p className="text-xs font-medium text-white">Create Analysis</p>
                    <p className="text-[10px] text-gray-500">+300-800 MSP</p>
                  </div>
                </motion.button>
              </div>
            </HiveGlowCard>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
