'use client'

import { motion } from 'framer-motion'
import { Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber, getRelativeTime } from '@/lib/utils'

interface TweetPreviewProps {
  author: {
    name: string
    handle: string
    avatar?: string
    verified?: boolean
  }
  content: string
  likes: number
  retweets: number
  replies: number
  timestamp: Date
  delay?: number
}

export function TweetPreview({
  author,
  content,
  likes,
  retweets,
  replies,
  timestamp,
  delay = 0,
}: TweetPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      className="relative p-4 rounded-xl border border-white/5 bg-background-card/30 backdrop-blur-sm hover:border-hive-amber/20 transition-all cursor-pointer group"
    >
      {/* Hologram-style glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-hive-amber/20 to-hive-cyan/20 flex items-center justify-center overflow-hidden"
            whileHover={{ scale: 1.1 }}
          >
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-hive-amber">
                {author.name.charAt(0)}
              </span>
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white truncate">{author.name}</span>
              {author.verified && (
                <svg className="w-4 h-4 text-hive-cyan" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>@{author.handle}</span>
              <span>·</span>
              <span>{getRelativeTime(timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          {content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-gray-500 hover:text-hive-cyan transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">{formatNumber(replies)}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs">{formatNumber(retweets)}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-gray-500 hover:text-rose-400 transition-colors"
          >
            <Heart className="w-4 h-4" />
            <span className="text-xs">{formatNumber(likes)}</span>
          </motion.button>
          
          <div className="flex-1" />
        </div>
      </div>

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['-200% 0', '200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  )
}
