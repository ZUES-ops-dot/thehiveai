'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Plus,
  ArrowUpRight,
  X,
  RefreshCw,
} from 'lucide-react'
import { IndieFunLogo } from '@/components/icons/IndieFunLogo'

interface IndieFunMirrorProps {
  onClose: () => void
  onSwitchPlatform: (platform: string) => void
}

export default function IndieFunMirror({ onClose, onSwitchPlatform }: IndieFunMirrorProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  // Listen for postMessage from Indie.fun popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'indie:project-created') {
        console.log('Project created on Indie.fun:', e.data.projectId)
        setPendingAction(null)
      }
      if (e.data?.type === 'indie:action-complete') {
        setPendingAction(null)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Open Indie.fun in new tab
  const openIndieFun = (path: string = '', action?: string) => {
    const returnUrl = encodeURIComponent(`${window.location.origin}/projects?indie_return=true`)
    const url = `https://indie.fun${path}${path.includes('?') ? '&' : '?'}ref=hiveai&return=${returnUrl}`
    
    if (action) {
      setPendingAction(action)
    }
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCreateProject = () => {
    openIndieFun('/create', 'creating')
  }

  const handleOpenIndieFun = () => {
    openIndieFun('/', 'browsing')
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-white/10 bg-[#12121a] flex-shrink-0">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2 md:gap-3">
          <IndieFunLogo className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-glow" />
          <div>
            <h2 className="text-sm md:text-base font-bold text-white">Indie.fun</h2>
            <p className="text-[10px] md:text-xs text-gray-500">Indie Game Devlogs</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => openIndieFun()}
            className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Open Indie.fun"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="text-center px-4 md:px-6 max-w-lg">
          {/* Logo */}
          <IndieFunLogo className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 text-white drop-shadow-glow" />

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Indie.fun</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
            Browse devlogs, fund projects, and connect with indie game creators on Solana.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCreateProject}
              className="flex items-center justify-center gap-2 px-5 md:px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
            <button
              onClick={handleOpenIndieFun}
              className="flex items-center justify-center gap-2 px-5 md:px-6 py-3 rounded-xl border border-purple-500/50 text-purple-400 text-sm font-medium hover:bg-purple-500/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Indie.fun</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* Pending Action Indicator */}
          <AnimatePresence>
            {pendingAction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30"
              >
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-purple-300">
                  {pendingAction === 'creating' && 'Creating project on Indie.fun...'}
                  {pendingAction === 'browsing' && 'Opening Indie.fun...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Quick Switch */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 px-2 border-t border-white/10 bg-[#12121a] flex-shrink-0">
        <span className="text-[10px] md:text-xs text-gray-500 mr-1 md:mr-2 hidden md:inline">Switch:</span>
        {[
          { id: 'play-solana', name: 'Solana', gradient: 'from-cyan-500 to-purple-500' },
          { id: 'indie-fun', name: 'Indie', gradient: 'from-purple-500 to-pink-500', active: true },
          { id: 'moddio', name: 'Moddio', gradient: 'from-amber-500 to-orange-500' },
        ].map((platform) => (
          <button
            key={platform.id}
            onClick={() => platform.active ? null : onSwitchPlatform(platform.id)}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border text-[10px] md:text-xs font-medium transition-all ${
              platform.active
                ? `bg-gradient-to-r ${platform.gradient} text-white border-transparent`
                : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}
          >
            {platform.name}
          </button>
        ))}
      </div>
    </div>
  )
}
