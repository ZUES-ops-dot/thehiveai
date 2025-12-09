'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import Image from 'next/image'

interface XLoginButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function XLoginButton({ className = '', size = 'md' }: XLoginButtonProps) {
  const { isAuthenticated, user } = useAuthStore()

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3',
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative">
          {user.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt={user.name}
              width={40}
              height={40}
              className="rounded-full border-2 border-hive-cyan"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-hive-cyan/20 border-2 border-hive-cyan flex items-center justify-center">
              <span className="text-hive-cyan font-bold">{user.name[0]}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">@{user.username}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.a
      href="/api/auth/x"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center justify-center
        bg-white text-black font-semibold rounded-full
        hover:bg-gray-100 transition-colors
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* X Logo */}
      <svg 
        width={iconSizes[size]} 
        height={iconSizes[size]} 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Connect with X</span>
    </motion.a>
  )
}
