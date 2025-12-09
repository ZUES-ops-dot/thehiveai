'use client'

import { useEffect, useState, Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, Zap, Hash, Megaphone, Flame, Target, Coins, TrendingUp, Calendar, Award, LinkIcon, Copy } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveNode } from '@/components/hive/HiveNode'
import { XProfileCard } from '@/components/auth/XProfileCard'
import { CampaignCard } from '@/components/campaign/CampaignCard'
import { CampaignLeaderboard } from '@/components/campaign/CampaignLeaderboard'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useCampaigns, useUserCampaignData } from '@/lib/hooks/useCampaigns'
import { type GlowTier } from '@/lib/types/economy'

// v3 Tier colors
const tierColors: Record<GlowTier, { bg: string; border: string; text: string; glow: string }> = {
  prime: { bg: 'bg-hive-cyan/20', border: 'border-hive-cyan', text: 'text-hive-cyan', glow: 'shadow-glow-cyan-sm' },
  lumina: { bg: 'bg-yellow-500/20', border: 'border-yellow-400', text: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]' },
  echelon: { bg: 'bg-hive-purple/20', border: 'border-hive-purple', text: 'text-hive-purple', glow: 'shadow-glow-purple' },
  apex: { bg: 'bg-pink-500/20', border: 'border-pink-400', text: 'text-pink-400', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]' },
  overmind: { bg: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20', border: 'border-pink-400', text: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]' },
}
function ProfileContent() {
  const { user, isAuthenticated, loading, hydrated } = useAuthStore()
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns('active')
  const { data: userData, isLoading: userDataLoading } = useUserCampaignData()
  const searchParams = useSearchParams()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [inviteOrigin, setInviteOrigin] = useState<string>(process.env.NEXT_PUBLIC_APP_URL ?? 'https://hive.ai')
  const [inviteCopied, setInviteCopied] = useState(false)
  const [inviteBanner, setInviteBanner] = useState<string | null>(null)
  const inviteBoostValue = 250

  // Get current tier from API or default to prime
  const creatorProfile = userData?.creatorProfile
  const currentTier: GlowTier = creatorProfile?.glowTier ?? 'prime'

  const showLoading = !hydrated || loading || campaignsLoading

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteOrigin(window.location.origin)
    }
  }, [])

  const inviteStatusParam = searchParams?.get('invite')

  useEffect(() => {
    if (!inviteStatusParam) return
    setInviteBanner(inviteStatusParam)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.delete('invite')
      const query = params.toString()
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [inviteStatusParam])

  useEffect(() => {
    if (!inviteBanner) return
    const timer = setTimeout(() => setInviteBanner(null), 5000)
    return () => clearTimeout(timer)
  }, [inviteBanner])

  const sanitizedOrigin = inviteOrigin.replace(/\/$/, '')
  const inviteLink = `${sanitizedOrigin}/invite/${user?.username ?? 'you'}`

  const handleCopyInvite = async () => {
    if (typeof navigator === 'undefined') return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch {
      setInviteCopied(false)
    }
  }

  if (showLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <HiveGlowCard glowColor="cyan" hover={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Warming up the Hive…</p>
              <p className="text-xs text-gray-400">Checking your X session and campaigns</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-hive-cyan animate-ping" />
              Syncing
            </div>
          </div>
        </HiveGlowCard>
      </div>
    )
  }

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

  const hasCreatorProfile = Boolean(isAuthenticated && user && creatorProfile)

  // User stats from API
  const userStats = {
    totalMSP: userData?.stats.totalMsp ?? 0,
    campaignsJoined: userData?.stats.campaignCount ?? 0,
    validPosts: userData?.stats.totalPosts ?? 0,
    bestRank: userData?.stats.bestRank ?? 0,
    inviteBonusMsp: userData?.stats.inviteBonusMsp ?? 0,
  }

  // Build participation map for CampaignCard
  const participationMap = new Map<string, { msp: number; postCount: number; rank: number | null }>()
  userData?.participations.forEach(p => {
    participationMap.set(p.campaignId, {
      msp: p.msp,
      postCount: p.postCount,
      rank: p.rank,
    })
  })

  const inviteBannerContent =
    inviteBanner === 'bonus'
      ? {
          title: 'Invite bonus unlocked',
          description: `+${inviteBoostValue} MSP added to your total. Keep sending your link for more boosts.`,
          border: 'border-emerald-400/40 bg-emerald-500/10',
          iconBg: 'bg-emerald-400/20 text-emerald-200',
        }
      : inviteBanner === 'tracked'
        ? {
            title: 'Invite tracked',
            description: 'Your referral is saved. Once they finish onboarding, the MSP bonus will drop automatically.',
            border: 'border-hive-cyan/40 bg-hive-cyan/10',
            iconBg: 'bg-hive-cyan/20 text-hive-cyan',
          }
        : null

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
          Creator <span className="gradient-text">Profile</span>
        </h1>
        <p className="page-subtitle">
          Connect your X account, join campaigns, and earn MSP rewards
        </p>
      </motion.div>

      {inviteBannerContent && (
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="cyan" hover={false} className={`p-4 flex items-start gap-3 ${inviteBannerContent.border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inviteBannerContent.iconBg}`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{inviteBannerContent.title}</p>
              <p className="text-xs text-gray-300">{inviteBannerContent.description}</p>
            </div>
          </HiveGlowCard>
        </motion.div>
      )}

      {/* X Profile Card - Primary Connection */}
      <motion.div variants={itemVariants}>
        <XProfileCard />
      </motion.div>

      {/* Stats Row (only show if authenticated) */}
      {isAuthenticated && user && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <HiveGlowCard glowColor="cyan" className="p-3 sm:p-6">
            <MetricTile label="Total MSP" value={<HivePulseNumber value={userStats.totalMSP} />} icon={<Zap />} />
          </HiveGlowCard>

          <HiveGlowCard glowColor="purple" className="p-3 sm:p-6">
            <MetricTile label="Campaigns" value={userStats.campaignsJoined} icon={<Megaphone />} />
          </HiveGlowCard>

          <HiveGlowCard glowColor="amber" className="p-3 sm:p-6">
            <MetricTile label="Valid Posts" value={userStats.validPosts} icon={<Hash />} />
          </HiveGlowCard>

          <HiveGlowCard glowColor="amber" className="p-3 sm:p-6">
            <MetricTile label="Best Rank" value={userStats.bestRank > 0 ? `#${userStats.bestRank}` : '-'} icon={<Trophy />} />
          </HiveGlowCard>

          <HiveGlowCard glowColor="purple" className="p-3 sm:p-6">
            <MetricTile label="Invite Bonus MSP" value={<HivePulseNumber value={userStats.inviteBonusMsp} />} icon={<Megaphone />} />
          </HiveGlowCard>
        </motion.div>
      )}

      {/* Extended Creator Stats (only show if authenticated) */}
      {hasCreatorProfile && userData?.creatorProfile && (
        <>
          {/* Career Overview */}
          <motion.div variants={itemVariants}>
            <HiveGlowCard glowColor="purple" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-hive-purple" />
                  Career Overview
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${tierColors[currentTier].bg} ${tierColors[currentTier].text}`}
                >
                  {currentTier}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[10px] text-gray-500 mb-1">Weekly MSP</p>
                  <HivePulseNumber value={userData.creatorProfile.mspWeekly} className="text-base" color="cyan" />
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[10px] text-gray-500 mb-1">Monthly MSP</p>
                  <HivePulseNumber value={userData.creatorProfile.mspMonthly} className="text-base" color="purple" />
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[10px] text-gray-500 mb-1">Yearly MSP</p>
                  <HivePulseNumber value={userData.creatorProfile.mspYearly} className="text-base" color="amber" />
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[10px] text-gray-500 mb-1">Lifetime MSP</p>
                  <HivePulseNumber value={userData.creatorProfile.mspLifetime} className="text-base" color="white" />
                </div>
              </div>
            </HiveGlowCard>
          </motion.div>

          {/* Performance & Rewards Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Performance Card */}
            <HiveGlowCard glowColor="cyan" hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-hive-cyan" />
                <h3 className="text-sm font-semibold text-white">Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Conversion Score</span>
                  <span className="text-sm font-bold text-hive-cyan">
                    {(userData.creatorProfile.conversionScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userData.creatorProfile.conversionScore * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-hive-cyan to-hive-purple rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">Narratives Amplified</span>
                  <span className="text-sm font-bold text-white">{userData.creatorProfile.narrativesAmplified}</span>
                </div>
              </div>
            </HiveGlowCard>

            {/* Streak Card */}
            <HiveGlowCard glowColor="amber" hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-hive-amber" />
                <h3 className="text-sm font-semibold text-white">Activity Streak</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-hive-amber">{userData.creatorProfile.currentStreak}</p>
                  <p className="text-[10px] text-gray-500">days active</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-hive-amber/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-hive-amber" />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-3">
                Keep posting to maintain your streak and earn bonus MSP!
              </p>
            </HiveGlowCard>

            {/* Rewards Card */}
            <HiveGlowCard glowColor="purple" hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-hive-purple" />
                <h3 className="text-sm font-semibold text-white">Rewards</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Credits Earned</span>
                  <span className="text-sm font-bold text-hive-purple">
                    {userData.creatorProfile.creditsEarned.toLocaleString()} HC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Best Rank Achieved</span>
                  <span className="text-sm font-bold text-white">
                    {userData.creatorProfile.bestRankAchieved ? `#${userData.creatorProfile.bestRankAchieved}` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Current Tier</span>
                  <span className={`text-sm font-bold uppercase ${tierColors[currentTier].text}`}>
                    {currentTier}
                  </span>
                </div>
              </div>
            </HiveGlowCard>
          </motion.div>
        </>
      )}

      {/* Narratives + Missions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HiveGlowCard glowColor="cyan" hover className="p-6 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Narratives Explorer</p>
            <h3 className="text-lg font-semibold text-white">Track live campaigns from the Narratives hub</h3>
            <p className="text-sm text-gray-400">
              Browse active projects, keywords, and sponsor pools on the Narratives page, then amplify the ones you care about.
            </p>
          </div>
          <Link
            href="/narratives"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-hive-cyan text-black font-semibold shadow-glow-cyan"
          >
            Open Narratives
          </Link>
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" hover className="p-6 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Creator Missions</p>
            <h3 className="text-lg font-semibold text-white">Complete missions, earn rewards</h3>
            <p className="text-sm text-gray-400">
              Invite friends, complete daily tasks, and unlock exclusive badges and MSP bonuses.
            </p>
          </div>
          <Link
            href="/missions"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-hive-purple text-white font-semibold shadow-glow-purple"
          >
            View Missions
          </Link>
        </HiveGlowCard>
      </motion.div>

      {/* Glow Tier Showcase - Compact grid that fits on mobile */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="amber" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Glow Tiers</h2>
            <p className="text-[10px] text-gray-500 hidden sm:block">Earn MSP to level up</p>
          </div>
          <div className="grid grid-cols-5 gap-1 sm:gap-3">
            {[
              { tier: 'prime', color: 'cyan', label: 'Prime', msp: '0', nodeColor: 'cyan' as const },
              { tier: 'lumina', color: 'yellow-400', label: 'Lumina', msp: '1K', nodeColor: 'amber' as const },
              { tier: 'echelon', color: 'hive-purple', label: 'Echelon', msp: '10K', nodeColor: 'purple' as const },
              { tier: 'apex', color: 'pink-400', label: 'Apex', msp: '50K', nodeColor: 'purple' as const },
              { tier: 'overmind', color: 'gradient', label: 'Overmind', msp: '100K', nodeColor: 'purple' as const, pulse: true },
            ].map((t) => (
              <div 
                key={t.tier}
                className={`flex flex-col items-center p-1 sm:p-3 rounded-lg sm:rounded-xl ${
                  currentTier === t.tier ? `ring-2 ring-${t.color === 'gradient' ? 'pink-400' : t.color}` : ''
                }`}
              >
                <HiveNode size="sm" color={t.nodeColor} pulse={t.pulse} />
                <p className={`mt-1 text-[8px] sm:text-xs font-medium ${
                  t.color === 'gradient' 
                    ? 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent' 
                    : `text-${t.color}`
                }`}>{t.label}</p>
                <p className="text-[7px] sm:text-[10px] text-gray-500">{t.msp}</p>
              </div>
            ))}
          </div>
        </HiveGlowCard>
      </motion.div>
    </motion.div>
  )
}

interface MetricTileProps {
  label: string
  value: ReactNode
  icon: ReactNode
}

function MetricTile({ label, value, icon }: MetricTileProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-hive-purple">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
        <div className="text-base font-semibold text-white">{value}</div>
      </div>
    </div>
  )
}

// Wrap in Suspense to prevent useSearchParams from causing infinite re-renders
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="h-96 bg-white/5 animate-pulse rounded-xl" /></div>}>
      <ProfileContent />
    </Suspense>
  )
}
