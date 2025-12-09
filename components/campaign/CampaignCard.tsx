'use client'

import { motion } from 'framer-motion'
import { Users, Hash, Trophy, Clock, Zap } from 'lucide-react'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { PRIMARY_HASHTAG } from '@/lib/engine/hashtag-tracker'
import {
  CampaignSummary,
  useCampaignLeaderboard,
  useJoinCampaignMutation,
  useLeaveCampaignMutation,
} from '@/lib/hooks/useCampaigns'

interface CampaignCardProps {
  campaign: CampaignSummary
  participation?: {
    msp: number
    postCount: number
    rank: number | null
  }
  onJoin?: () => void
  onLeave?: () => void
  showLeaderboard?: boolean
}

export function CampaignCard({
  campaign,
  participation,
  onJoin,
  onLeave,
  showLeaderboard = false,
}: CampaignCardProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { data: leaderboardData, isLoading: leaderboardLoading } = useCampaignLeaderboard(campaign.id, 5)
  const leaderboard = leaderboardData?.leaderboard ?? []
  const joinMutation = useJoinCampaignMutation()
  const leaveMutation = useLeaveCampaignMutation()

  const isJoined = Boolean(participation)

  const handleJoin = () => {
    if (!user || !isAuthenticated) {
      window.location.href = '/api/auth/x'
      return
    }

    joinMutation.mutate(
      { campaignId: campaign.id },
      {
        onSuccess: () => onJoin?.(),
      }
    )
  }

  const handleLeave = () => {
    if (!user) return
    leaveMutation.mutate(
      { campaignId: campaign.id },
      {
        onSuccess: () => onLeave?.(),
      }
    )
  }

  const daysRemaining = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <HiveGlowCard glowColor="purple" hover className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{campaign.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hive-cyan/20 text-hive-cyan text-xs font-mono">
                <Hash className="w-3 h-3" />
                {campaign.projectTag}
              </span>
              {campaign.isActive && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                  Active
                </span>
              )}
            </div>
          </div>
          {daysRemaining !== null && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {daysRemaining}d left
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{campaign.description}</p>

        {/* Tracking Info */}
        <div className="p-3 rounded-lg bg-background/50 border border-white/5 mb-4">
          <p className="text-xs text-gray-500 mb-1">Post with both hashtags:</p>
          <p className="text-sm font-mono text-hive-cyan">
            {PRIMARY_HASHTAG} #{campaign.projectTag}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold text-white">{campaign.totalParticipants}</p>
            <p className="text-[10px] text-gray-500">Joined</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Zap className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold text-white">{campaign.totalMSP.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Total MSP</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Trophy className="w-3 h-3" />
            </div>
            <p className="text-sm font-bold text-hive-amber">{campaign.rewardPool.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Rewards</p>
          </div>
        </div>

        {/* My Stats (if joined) */}
        {isJoined && participation && (
          <div className="p-3 rounded-lg bg-hive-cyan/10 border border-hive-cyan/30 mb-4">
            <p className="text-xs text-hive-cyan mb-2">Your Progress</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">{participation.msp.toLocaleString()} MSP</p>
                <p className="text-xs text-gray-400">{participation.postCount} valid posts</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Rank</p>
                <p className="text-xl font-bold text-hive-amber">
                  {participation.rank && participation.rank > 0 ? `#${participation.rank}` : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mini Leaderboard */}
        {showLeaderboard && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Top Participants</p>
            <div className="space-y-1">
              {leaderboardLoading && leaderboard.length === 0 ? (
                <p className="text-xs text-gray-500">Loading leaderboard…</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-gray-500">No participants yet. Be the first to join!</p>
              ) : (
                leaderboard.map((participant, index) => (
                  <div
                    key={`${participant.userId}-${index}`}
                    className="flex items-center justify-between p-2 rounded bg-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/10 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-white truncate max-w-[100px]">
                        @{participant.username}
                      </span>
                    </div>
                    <span className="text-hive-cyan font-medium">
                      {participant.msp.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto">
          {!isAuthenticated ? (
            <motion.a
              href="/api/auth/x"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Connect X to Join
            </motion.a>
          ) : isJoined ? (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLeave}
                disabled={leaveMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {leaveMutation.isPending ? 'Leaving…' : 'Leave Campaign'}
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="w-full px-4 py-3 bg-gradient-to-r from-hive-cyan to-hive-purple text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join Campaign'}
            </motion.button>
          )}
        </div>
      </div>
    </HiveGlowCard>
  )
}
