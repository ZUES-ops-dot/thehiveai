'use client'

import { motion } from 'framer-motion'
import { LogOut, Users, MessageSquare, CheckCircle2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'

interface XProfileCardProps {
  className?: string
}

export function XProfileCard({ className = '' }: XProfileCardProps) {
  const { user, isAuthenticated, logout, loading, hydrated, connectedAccounts } = useAuthStore()

  const primaryAccount =
    connectedAccounts.find((account) => account.active) ?? connectedAccounts[0]
  const followerCount = primaryAccount?.followersCount ?? user?.followersCount ?? 0

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!hydrated || loading) {
    return (
      <HiveGlowCard glowColor="cyan" className={className}>
        <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
          Checking session…
        </div>
      </HiveGlowCard>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <HiveGlowCard glowColor="cyan" className={className}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
            <svg width={32} height={32} viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your X Account</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Link your X account to join campaigns, track your posts, and earn MSP rewards.
          </p>
          <motion.a
            href="/api/auth/x"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Connect with X</span>
          </motion.a>
        </div>
      </HiveGlowCard>
    )
  }

  return (
    <HiveGlowCard glowColor="cyan" hover={false} className={className}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Profile Image from X */}
        <div className="relative">
          {user.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt={user.name}
              width={96}
              height={96}
              className="rounded-full border-3 border-hive-cyan shadow-glow-cyan-sm"
              unoptimized // X images may need this
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-hive-cyan/20 border-3 border-hive-cyan flex items-center justify-center">
              <span className="text-3xl font-bold text-hive-cyan">{user.name[0]}</span>
            </div>
          )}
          {user.verified && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-hive-cyan/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{user.name}</h2>
            {user.verified && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                Verified
              </span>
            )}
          </div>
          <a 
            href={`https://x.com/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-hive-cyan transition-colors inline-flex items-center gap-1"
          >
            @{user.username}
            <ExternalLink className="w-3 h-3" />
          </a>
          
          {user.description && (
            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{user.description}</p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-hive-cyan" />
              <span className="text-white font-medium">{user.followersCount.toLocaleString()}</span>
              <span className="text-gray-500">followers</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-hive-purple" />
              <span className="text-white font-medium">{user.tweetCount.toLocaleString()}</span>
              <span className="text-gray-500">posts</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </motion.button>
      </div>
    </HiveGlowCard>
  )
}
