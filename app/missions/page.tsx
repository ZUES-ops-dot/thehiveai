'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Zap, 
  Flame, 
  Trophy, 
  Star,
  CheckCircle2,
  Clock,
  Gift,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Loader2
} from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { type MissionType, type MissionCategory, MISSION_CATEGORY_COLORS } from '@/lib/types/missions'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useMissionsQuery, useClaimMission } from '@/lib/hooks/useMissions'

const typeFilters: { type: MissionType | 'all'; label: string; icon: typeof Target }[] = [
  { type: 'all', label: 'All', icon: Target },
  { type: 'daily', label: 'Daily', icon: Zap },
  { type: 'weekly', label: 'Weekly', icon: Flame },
  { type: 'monthly', label: 'Monthly', icon: Trophy },
  { type: 'special', label: 'Special', icon: Star },
]

const categoryIcons: Record<MissionCategory, typeof Target> = {
  amplification: Zap,
  engagement: Flame,
  streak: Clock,
  tier: Trophy,
  discovery: Sparkles,
}

export default function MissionsPage() {
  const [activeFilter, setActiveFilter] = useState<MissionType | 'all'>('all')
  const [timeUntilReset, setTimeUntilReset] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<{ id: string; msp: number } | null>(null)

  const { user, isAuthenticated } = useAuthStore()
  const { data: missionsData, isLoading } = useMissionsQuery()
  const claimMutation = useClaimMission()

  const inviteBoostValue = 250
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteLink = user?.username ? `${baseUrl}/invite/${user.username}` : ''

  const handleCopyInvite = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const handleClaimMission = async (missionId: string) => {
    setClaimingId(missionId)
    try {
      const result = await claimMutation.mutateAsync(missionId)
      if (result.success && result.mspAwarded) {
        setClaimSuccess({ id: missionId, msp: result.mspAwarded })
        setTimeout(() => setClaimSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Failed to claim mission:', error)
    } finally {
      setClaimingId(null)
    }
  }

  useEffect(() => {
    setIsMounted(true)

    const calculateTimeUntilReset = () => {
      if (missionsData?.resets?.daily) {
        const resetTime = new Date(missionsData.resets.daily).getTime()
        return Math.max(0, resetTime - Date.now())
      }
      // Fallback to midnight UTC
      const now = new Date()
      const nextReset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ))
      return Math.max(0, nextReset.getTime() - now.getTime())
    }

    setTimeUntilReset(calculateTimeUntilReset())
    const interval = setInterval(() => {
      setTimeUntilReset(calculateTimeUntilReset())
    }, 1000)

    return () => clearInterval(interval)
  }, [missionsData?.resets?.daily])

  const formatSegment = (value: number) => value.toString().padStart(2, '0')
  const hours = Math.floor(timeUntilReset / (1000 * 60 * 60))
  const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const missions = missionsData?.missions ?? []
  const filteredMissions = activeFilter === 'all' 
    ? missions 
    : missions.filter(m => m.type === activeFilter)

  const completedCount = missions.filter(m => m.status === 'completed').length
  const claimableCount = missionsData?.stats?.claimable ?? 0
  const totalClaimableMsp = missionsData?.stats?.totalClaimableMsp ?? 0
  const currentStreak = missionsData?.streak?.currentStreak ?? 0

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
          Creator <span className="gradient-text">Missions</span>
        </h1>
        <p className="page-subtitle">
          Complete missions to earn MSP, badges, and exclusive rewards
        </p>
      </motion.div>

      {/* Claim Success Toast */}
      <AnimatePresence>
        {claimSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">+{claimSuccess.msp} MSP claimed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="stats-grid">
        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-hive-amber" />
            <span className="text-[10px] text-gray-400">Streak</span>
          </div>
          <HivePulseNumber value={currentStreak} className="text-xl" color="amber" suffix=" days" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="cyan" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-gray-400">Completed</span>
          </div>
          <HivePulseNumber value={completedCount} className="text-xl" color="cyan" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="purple" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-hive-purple" />
            <span className="text-[10px] text-gray-400">Claimable</span>
          </div>
          <HivePulseNumber value={claimableCount} className="text-xl" color="purple" />
        </HiveGlowCard>

        <HiveGlowCard glowColor="amber" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-hive-amber" />
            <span className="text-[10px] text-gray-400">MSP to Claim</span>
          </div>
          <HivePulseNumber value={totalClaimableMsp} className="text-xl" color="amber" />
        </HiveGlowCard>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map(filter => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.type
            const count = filter.type === 'all' 
              ? missions.length 
              : missions.filter(m => m.type === filter.type).length

            return (
              <motion.button
                key={filter.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilter(filter.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-hive-amber/20 border-hive-amber text-white'
                    : 'bg-background/50 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-hive-amber' : ''}`} />
                <span className="text-sm font-medium">{filter.label}</span>
                <span className="text-[10px] text-gray-500">({count})</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Missions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading && (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-hive-amber animate-spin" />
          </div>
        )}
        {!isLoading && filteredMissions.length === 0 && (
          <div className="col-span-full">
            <HiveGlowCard glowColor="amber" hover={false}>
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-hive-amber mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Missions Available</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  {isAuthenticated 
                    ? 'Check back soon for new missions to complete!'
                    : 'Log in with X to start earning MSP through missions.'}
                </p>
              </div>
            </HiveGlowCard>
          </div>
        )}
        {filteredMissions.map((mission, index) => {
          const CategoryIcon = categoryIcons[mission.category as MissionCategory]
          const categoryColor = MISSION_CATEGORY_COLORS[mission.category as MissionCategory]
          const progress = Math.min(100, (mission.progress / mission.target) * 100)
          const isCompleted = mission.status === 'completed'
          const isClaimed = mission.status === 'claimed'
          const isClaiming = claimingId === mission.id

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <HiveGlowCard 
                glowColor={isCompleted ? 'cyan' : isClaimed ? 'purple' : 'amber'} 
                hover={!isClaimed}
                className={isClaimed ? 'opacity-70' : ''}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    {isClaimed ? (
                      <CheckCircle2 className="w-5 h-5 text-hive-purple" />
                    ) : isCompleted ? (
                      <Gift className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <CategoryIcon className="w-5 h-5" style={{ color: categoryColor }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{mission.title}</h3>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${
                        mission.type === 'daily' ? 'bg-hive-cyan/20 text-hive-cyan' :
                        mission.type === 'weekly' ? 'bg-hive-amber/20 text-hive-amber' :
                        mission.type === 'monthly' ? 'bg-hive-purple/20 text-hive-purple' :
                        'bg-pink-500/20 text-pink-400'
                      }`}>
                        {mission.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{mission.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Progress</span>
                        <span className="text-[10px] text-gray-400">
                          {mission.progress.toLocaleString()} / {mission.target.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`h-full rounded-full ${
                            isClaimed
                              ? 'bg-hive-purple'
                              : isCompleted 
                                ? 'bg-emerald-400' 
                                : 'bg-gradient-to-r from-hive-amber to-hive-cyan'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-hive-amber/10">
                        <Zap className="w-3 h-3 text-hive-amber" />
                        <span className="text-[10px] font-medium text-hive-amber">+{mission.mspReward} MSP</span>
                      </div>
                      {mission.creditsReward && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-hive-cyan/10">
                          <Star className="w-3 h-3 text-hive-cyan" />
                          <span className="text-[10px] font-medium text-hive-cyan">{mission.creditsReward} HC</span>
                        </div>
                      )}
                      {mission.badgeReward && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-hive-purple/10">
                          <Trophy className="w-3 h-3 text-hive-purple" />
                          <span className="text-[10px] font-medium text-hive-purple">Badge</span>
                        </div>
                      )}
                      {mission.cosmeticReward && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/10">
                          <Sparkles className="w-3 h-3 text-pink-400" />
                          <span className="text-[10px] font-medium text-pink-400">Cosmetic</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {isCompleted && !isClaimed && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimMission(mission.id)}
                      disabled={isClaiming}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      {isClaiming ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Claiming...</>
                      ) : (
                        <>Claim +{mission.mspReward} MSP</>
                      )}
                    </motion.button>
                  )}
                  {isClaimed && (
                    <span className="px-3 py-1.5 rounded-lg bg-hive-purple/20 border border-hive-purple/30 text-hive-purple text-xs font-medium">
                      Claimed ✓
                    </span>
                  )}
                </div>
              </HiveGlowCard>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Daily Reset Timer */}
      <motion.div variants={itemVariants}>
        <HiveGlowCard glowColor="cyan" hover={false}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-hive-cyan" />
              <div>
                <p className="text-sm font-medium text-white">Daily Reset</p>
                <p className="text-xs text-gray-400">New daily missions in</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-white font-mono">
              {isMounted ? (
                <>
                  <span>{formatSegment(hours)}</span>
                  <span className="text-gray-500">:</span>
                  <span>{formatSegment(minutes)}</span>
                  <span className="text-gray-500">:</span>
                  <span>{formatSegment(seconds)}</span>
                </>
              ) : (
                <>
                  <span>--</span>
                  <span className="text-gray-500">:</span>
                  <span>--</span>
                  <span className="text-gray-500">:</span>
                  <span>--</span>
                </>
              )}
            </div>
          </div>
        </HiveGlowCard>
      </motion.div>

      {/* Invite Link Boost Section */}
      {isAuthenticated && user?.username && (
        <motion.div variants={itemVariants}>
          <HiveGlowCard glowColor="purple" hover={false}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Invite Mission</p>
                  <h3 className="text-xl font-semibold text-white">Grow the hive with one link.</h3>
                  <p className="text-sm text-gray-400 max-w-md">
                    Share your invite—every verified onboarding through your link instantly adds <span className="text-white">+{inviteBoostValue} MSP</span> to your total and stacks with streak multipliers.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-white/80">
                    <Zap className="w-3 h-3 text-hive-amber" />
                    Boost per invite: +{inviteBoostValue} MSP
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-white/80">
                    <Sparkles className="w-3 h-3 text-hive-purple" />
                    Bonus when creator completes onboarding
                  </span>
                </div>
              </div>
              <div className="w-full sm:max-w-md">
                <p className="text-xs text-gray-500 mb-1">Your unique invite link</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white break-all">
                    {inviteLink}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
                  >
                    <Copy className="w-4 h-4" />
                    {inviteCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </HiveGlowCard>
        </motion.div>
      )}
    </motion.div>
  )
}
