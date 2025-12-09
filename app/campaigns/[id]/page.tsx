'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Hash, Users, Calendar, Coins, TrendingUp, Award, Sparkles, Megaphone, Wallet, Check, Loader2 } from 'lucide-react'

import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { HivePulseNumber } from '@/components/hive/HivePulseNumber'
import { HiveSparkline } from '@/components/hive/HiveSparkline'
import { CampaignLeaderboard } from '@/components/campaign/CampaignLeaderboard'
import {
  useCampaign,
  useJoinCampaignMutation,
  useLeaveCampaignMutation,
  useUserCampaignData,
} from '@/lib/hooks/useCampaigns'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useNarrativeAnalyticsQuery } from '@/lib/hooks/useLiveData'

interface CampaignPageProps {
  params: { id: string }
}

export default function CampaignDetailPage({ params }: CampaignPageProps) {
  const { id } = params
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id)
  const { isAuthenticated } = useAuthStore()
  const { data: userCampaignData } = useUserCampaignData()
  const joinCampaign = useJoinCampaignMutation()
  const leaveCampaign = useLeaveCampaignMutation()

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useNarrativeAnalyticsQuery({ campaignIds: id ? [id] : [], limit: 1 })

  const analytics = useMemo(() => analyticsData?.records?.[0]?.analytics, [analyticsData])
  const keywords = analytics?.keywords ?? []
  const topAccounts = analytics?.topAccounts ?? []
  const sponsors = analytics?.sponsorPool ?? []
  const participation = userCampaignData?.participations.find((p) => p.campaignId === campaign?.id)
  const isJoined = Boolean(participation)

  // Wallet state
  const [walletAddress, setWalletAddress] = useState('')
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletSaved, setWalletSaved] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  // Fetch existing wallet address when joined
  useEffect(() => {
    if (!isJoined || !campaign) return

    const fetchWallet = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaign.id}/wallet`, {
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
  }, [isJoined, campaign?.id])

  const handleSaveWallet = async () => {
    if (!campaign || !walletAddress.trim()) return

    setWalletSaving(true)
    setWalletError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/wallet`, {
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

  const shareText = encodeURIComponent(
    `Amplifying ${campaign?.name ?? 'this narrative'} on #HiveAI #${campaign?.projectTag ?? ''}`
  )
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`

  const handleJoin = () => {
    if (!campaign) return
    if (!isAuthenticated) {
      window.location.href = '/api/auth/x'
      return
    }
    joinCampaign.mutate({ campaignId: campaign.id })
  }

  const handleLeave = () => {
    if (!campaign || !isJoined) return
    leaveCampaign.mutate({ campaignId: campaign.id })
  }

  if (campaignLoading || !campaign) {
    return (
      <div className="space-y-6">
        <HiveGlowCard glowColor="cyan">
          <div className="py-12 text-center text-gray-400">
            {campaignLoading ? 'Loading narrative…' : 'Campaign not found'}
          </div>
        </HiveGlowCard>
      </div>
    )
  }

  const startDate = new Date(campaign.startDate)
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/narratives" className="inline-flex items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Narratives
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HiveGlowCard glowColor="cyan" className="lg:col-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Narrative</p>
                <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hive-cyan/20 text-hive-cyan text-xs font-mono">
                    <Hash className="w-3 h-3" />
                    {campaign.projectTag}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      campaign.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <div>
                  <p className="text-xs uppercase tracking-wide">Reward Pool</p>
                  <p className="text-lg font-semibold text-hive-amber">
                    {campaign.rewardPool.toLocaleString()} MSP
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">Ends</p>
                  <p className="text-lg font-semibold text-white">
                    {endDate ? endDate.toLocaleDateString() : 'Open'}
                  </p>
                </div>
                {daysRemaining !== null && (
                  <div>
                    <p className="text-xs uppercase tracking-wide">Days Left</p>
                    <p className="text-lg font-semibold text-white">{daysRemaining}</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{campaign.description}</p>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <button
                type="button"
                onClick={isJoined ? handleLeave : handleJoin}
                disabled={joinCampaign.isPending || leaveCampaign.isPending}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isJoined
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    : 'bg-hive-cyan text-black hover:bg-hive-cyan/80'
                }`}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                {isJoined ? (leaveCampaign.isPending ? 'Leaving…' : 'Joined Narrative') : joinCampaign.isPending ? 'Joining…' : 'Join Narrative'}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/15 text-sm text-white hover:border-hive-amber/40 hover:text-hive-amber transition-colors"
              >
                Share Narrative
              </a>
            </div>

            {/* Wallet Input - Only shown after joining */}
            {isJoined && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-hive-purple" />
                  <span className="text-sm font-medium text-white">Reward Wallet</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
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
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-hive-purple"
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
              </div>
            )}
          </div>
        </HiveGlowCard>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-3">
          <HiveGlowCard glowColor="purple">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <Users className="w-3 h-3" />
              Participants
            </div>
            <HivePulseNumber value={campaign.totalParticipants} className="text-2xl" />
          </HiveGlowCard>
          <HiveGlowCard glowColor="amber">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <Coins className="w-3 h-3" />
              Total MSP
            </div>
            <HivePulseNumber value={campaign.totalMSP} className="text-2xl" color="amber" />
          </HiveGlowCard>
          <HiveGlowCard glowColor="cyan">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <Calendar className="w-3 h-3" />
              Started
            </div>
            <p className="text-lg font-semibold text-white">{startDate.toLocaleDateString()}</p>
          </HiveGlowCard>
          <HiveGlowCard glowColor="purple">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase mb-1">
              <TrendingUp className="w-3 h-3" />
              Momentum
            </div>
            <div className="flex items-center gap-2">
              <HiveSparkline
                data={[5, 12, 8, 20, 15, 28, 22, 30]}
                color="cyan"
                width={80}
                height={24}
              />
            </div>
          </HiveGlowCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HiveGlowCard glowColor="amber" className="space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Narrative Keywords</p>
              <h2 className="text-lg font-semibold text-white">Signal Pulse</h2>
            </div>
            {!analyticsLoading && analytics?.lastSynced && (
              <span className="text-xs text-gray-500">
                Last synced {new Date(analytics.lastSynced).toLocaleTimeString()}
              </span>
            )}
          </header>
          <div className="flex flex-wrap gap-2">
            {analyticsLoading && keywords.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`keyword-skeleton-${idx}`} className="h-6 w-20 rounded bg-white/10 animate-pulse" />
              ))
            ) : keywords.length === 0 ? (
              <p className="text-sm text-gray-500">No keywords extracted yet.</p>
            ) : (
              keywords.map((keyword) => (
                <span
                  key={keyword.tag}
                  className="px-3 py-1 rounded-full border border-hive-amber/30 bg-hive-amber/10 text-xs text-hive-amber"
                >
                  #{keyword.tag} · {keyword.count}
                </span>
              ))
            )}
          </div>
        </HiveGlowCard>

      </div>


      <CampaignLeaderboard campaignId={campaign.id} />
    </motion.div>
  )
}
