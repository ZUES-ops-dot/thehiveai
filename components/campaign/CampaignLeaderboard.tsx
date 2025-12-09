'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Zap, Hash, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useCampaign, useCampaignLeaderboard } from '@/lib/hooks/useCampaigns'

interface CampaignLeaderboardProps {
  campaignId: string
  className?: string
}

export function CampaignLeaderboard({ campaignId, className = '' }: CampaignLeaderboardProps) {
  const { user } = useAuthStore()
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useCampaignLeaderboard(campaignId, 100)
  const leaderboard = leaderboardData?.leaderboard ?? []

  if (campaignLoading || !campaign) {
    return (
      <HiveGlowCard glowColor="amber" hover={false} className={className}>
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          {campaignLoading ? 'Loading campaign…' : 'Campaign not found'}
        </div>
      </HiveGlowCard>
    )
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-400/20' }
    if (rank === 3) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/20' }
    return { icon: null, color: 'text-gray-400', bg: 'bg-white/10' }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <HiveGlowCard glowColor="amber" hover={false} className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-hive-amber" />
            Campaign Leaderboard
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">{campaign.name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hive-cyan/20 text-hive-cyan text-xs font-mono">
              <Hash className="w-3 h-3" />
              {campaign.projectTag}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Reward Pool</p>
          <p className="text-lg font-bold text-hive-amber">{campaign.rewardPool.toLocaleString()}</p>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboardLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading leaderboard…</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 mb-2">No participants yet</p>
          <p className="text-sm text-gray-500">
            Be the first to join and start earning MSP!
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {leaderboard.map((participant, index) => {
            const rank = participant.rank > 0 ? participant.rank : index + 1
            const badge = getRankBadge(rank)
            const isCurrentUser = user?.id === participant.userId

            return (
              <motion.div
                key={participant.id}
                variants={itemVariants}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${isCurrentUser 
                    ? 'bg-hive-cyan/10 border border-hive-cyan/30' 
                    : 'bg-background/50 border border-white/5 hover:border-white/10'
                  }
                `}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full ${badge.bg} flex items-center justify-center flex-shrink-0`}>
                  {badge.icon ? (
                    <badge.icon className={`w-4 h-4 ${badge.color}`} />
                  ) : (
                    <span className={`text-sm font-bold ${badge.color}`}>
                      {rank > 0 ? rank : '-'}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {participant.profileImageUrl ? (
                    <Image
                      src={participant.profileImageUrl}
                      alt={participant.displayName}
                      width={40}
                      height={40}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-hive-purple/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-hive-purple">
                        {participant.displayName[0]}
                      </span>
                    </div>
                  )}
                  {isCurrentUser && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-hive-cyan rounded-full border-2 border-background" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {participant.displayName}
                    </p>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-hive-cyan/20 text-hive-cyan">
                        You
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://x.com/${participant.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-hive-cyan transition-colors inline-flex items-center gap-1"
                  >
                    @{participant.username}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-hive-cyan">
                    {participant.msp.toLocaleString()} MSP
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {participant.postCount} posts
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/5">
        <p className="text-xs text-gray-400 text-center">
          Everyone starts at rank 0. Earn MSP by posting with{' '}
          <span className="text-hive-cyan font-mono">#HiveAI #{campaign.projectTag}</span>
        </p>
      </div>
    </HiveGlowCard>
  )
}
