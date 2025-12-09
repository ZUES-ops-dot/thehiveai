'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  ArrowUpRight,
  Zap,
  MessageSquare,
  Star,
  Flame,
  Users,
} from 'lucide-react'
import { IndieFunLogo } from '@/components/icons/IndieFunLogo'
import { PlaySolanaLogo } from '@/components/icons/PlaySolanaLogo'
import { ModdioLogo } from '@/components/icons/ModdioLogo'
import { HiveGlowCard } from '@/components/hive/HiveGlowCard'
import { useProjectInteraction } from '@/lib/hooks/useProjectInteraction'
import dynamic from 'next/dynamic'

// Lazy load the Indie.fun mirror component
const IndieFunMirror = dynamic(() => import('@/components/explorer/IndieFunMirror'), {
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#0A0A0F]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 animate-pulse">
          <div className="w-full h-full rounded-2xl bg-[#0A0A0F] flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
        </div>
        <span className="text-gray-400 text-sm">Loading Indie.fun...</span>
      </div>
    </div>
  ),
})

// Platform configurations
const PLATFORMS = {
  'play-solana': {
    id: 'play-solana',
    name: 'Play Solana',
    shortName: 'Solana',
    url: 'https://www.playsolana.com',
    icon: PlaySolanaLogo,
    color: 'cyan',
    gradient: 'from-cyan-500 to-purple-500',
    description: 'Solana Gaming Ecosystem',
    useMirror: false, // Uses iframe
  },
  'indie-fun': {
    id: 'indie-fun',
    name: 'Indie.fun',
    shortName: 'Indie',
    url: 'https://indie.fun',
    icon: IndieFunLogo,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    description: 'Indie Game Devlogs',
    useMirror: true, // Uses inline mirror (blocks iframe)
  },
  'moddio': {
    id: 'moddio',
    name: 'Moddio',
    shortName: 'Moddio',
    url: 'https://www.modd.io',
    icon: ModdioLogo,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    description: 'UGC Game Platform',
    useMirror: false, // Uses iframe
  },
} as const

type PlatformId = keyof typeof PLATFORMS

export default function ProjectsPage() {
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [checkComplete, setCheckComplete] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [urlHistory, setUrlHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Track project interactions (clicking Launch counts as a visit)
  const { recordInteraction, isRecorded } = useProjectInteraction()

  // Check if URL is embeddable
  const checkEmbeddability = useCallback(async (url: string) => {
    setIsBlocked(false)
    setBlockReason(null)
    setIsLoading(true)
    setCheckComplete(false)

    try {
      const res = await fetch(`/api/proxy/check?url=${encodeURIComponent(url)}`)
      const data = await res.json()

      if (data.blocked) {
        setIsBlocked(true)
        setBlockReason(data.reason || 'This site blocks iframe embedding')
        setIsLoading(false)
      }
      setCheckComplete(true)
    } catch (err) {
      // If check fails, allow iframe to try anyway
      console.warn('Embeddability check failed:', err)
      setCheckComplete(true)
    }
  }, [])

  // Handle platform selection
  const handlePlatformSelect = (platformId: PlatformId) => {
    const platform = PLATFORMS[platformId]
    setActivePlatform(platformId)
    setCurrentUrl(platform.url)
    setUrlHistory([platform.url])
    setHistoryIndex(0)
    setIsLoading(true)
    setIsBlocked(false)
    checkEmbeddability(platform.url)
    
    // Record interaction for mission tracking
    recordInteraction(platformId)
  }

  // Browser controls
  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setCurrentUrl(urlHistory[newIndex])
      setIsLoading(true)
    }
  }

  const handleForward = () => {
    if (historyIndex < urlHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setCurrentUrl(urlHistory[newIndex])
      setIsLoading(true)
    }
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = currentUrl
    }
  }

  const handleHome = () => {
    if (activePlatform) {
      const homeUrl = PLATFORMS[activePlatform].url
      setCurrentUrl(homeUrl)
      setUrlHistory((prev) => [...prev.slice(0, historyIndex + 1), homeUrl])
      setHistoryIndex((prev) => prev + 1)
      setIsLoading(true)
    }
  }

  const handleClose = () => {
    setActivePlatform(null)
    setIsFullscreen(false)
    setCurrentUrl('')
    setUrlHistory([])
    setHistoryIndex(-1)
    setIsBlocked(false)
    setBlockReason(null)
    setCheckComplete(false)
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Get active platform config
  const activePlatformConfig = activePlatform ? PLATFORMS[activePlatform] : null

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#0A0A0F]' : 'h-[calc(100vh-120px)] flex flex-col'}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`${isFullscreen ? 'h-full flex flex-col' : 'flex-1 flex flex-col'}`}
      >
        {/* Header - Compact on mobile */}
        {!isFullscreen && !activePlatform && (
          <motion.div variants={itemVariants} className="mb-4 flex-shrink-0">
            <h1 className="page-title mb-1">
              Project <span className="gradient-text">Lens</span>
            </h1>
            <p className="page-subtitle">
              Explore gaming ecosystems live inside HiveAI
            </p>
          </motion.div>
        )}

        {/* Platform Selector - Responsive grid that fits viewport */}
        <AnimatePresence mode="wait">
          {!activePlatform && (
            <motion.div
              key="platform-selector"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 auto-rows-fr"
            >
              {(Object.keys(PLATFORMS) as PlatformId[]).map((platformId, index) => {
                const platform = PLATFORMS[platformId]
                const Icon = platform.icon
                return (
                  <motion.div
                    key={platformId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="min-h-0"
                  >
                    <HiveGlowCard
                      glowColor={platform.color as 'cyan' | 'purple' | 'amber'}
                      hover
                      className="cursor-pointer group h-full !p-0"
                      onClick={() => handlePlatformSelect(platformId)}
                    >
                      <div className="h-full p-4 md:p-5 flex flex-col items-center justify-center text-center">
                        {/* Animated Icon - Smaller on mobile */}
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${platform.gradient} p-0.5 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <div className="w-full h-full rounded-xl md:rounded-2xl bg-[#0A0A0F] flex items-center justify-center">
                            <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                          </div>
                        </div>

                        <h2 className="text-base md:text-lg font-bold text-white mb-0.5 md:mb-1">{platform.name}</h2>
                        <p className="text-xs md:text-sm text-gray-400 mb-2 hidden md:block">{platform.description}</p>

                        {/* Live indicator + URL - Combined on mobile */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono text-[10px] md:text-xs truncate max-w-[120px] md:max-w-none">
                            {platform.url.replace('https://', '').replace('www.', '')}
                          </span>
                        </div>

                        {/* Launch button - Compact */}
                        <button
                          className={`mt-2 md:mt-3 px-4 md:px-5 py-1.5 md:py-2 rounded-lg bg-gradient-to-r ${platform.gradient} text-white text-xs md:text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5`}
                        >
                          <Globe className="w-3 h-3 md:w-4 md:h-4" />
                          Launch
                        </button>
                      </div>
                    </HiveGlowCard>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Browser View - Show when platform is active */}
        <AnimatePresence mode="wait">
          {activePlatform && activePlatformConfig && (
            <motion.div
              key="browser-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`${isFullscreen ? 'flex-1 flex flex-col' : 'flex-1 flex flex-col'}`}
            >
              {/* Indie.fun uses Mirror component instead of iframe */}
              {activePlatformConfig.useMirror ? (
                <div className="flex-1 rounded-xl border border-white/10 overflow-hidden">
                  <IndieFunMirror
                    onClose={handleClose}
                    onSwitchPlatform={(id) => handlePlatformSelect(id as PlatformId)}
                  />
                </div>
              ) : (
              /* Browser Chrome for iframe-based platforms */
              <div
                className={`flex-1 flex flex-col rounded-xl border border-white/10 bg-[#1a1a24] overflow-hidden`}
              >
                {/* Browser Toolbar - Mobile optimized */}
                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 border-b border-white/10 bg-[#12121a] flex-shrink-0">
                  {/* Traffic lights / Close */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <button
                      onClick={handleClose}
                      className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                      title="Close"
                    />
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors hidden md:block"
                      title="Minimize"
                    />
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
                      title="Fullscreen"
                    />
                  </div>

                  {/* Navigation buttons - Compact on mobile */}
                  <div className="flex items-center gap-0.5 md:gap-1 ml-2 md:ml-4">
                    <button
                      onClick={handleBack}
                      disabled={historyIndex <= 0}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={handleForward}
                      disabled={historyIndex >= urlHistory.length - 1}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleHome}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden md:block"
                    >
                      <Home className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* URL Bar - Simplified on mobile */}
                  <div className="flex-1 mx-1 md:mx-4 min-w-0">
                    <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-white/5 border border-white/10">
                      {isLoading && <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-gray-500 animate-spin flex-shrink-0" />}
                      <span className="text-[10px] md:text-xs text-emerald-400 flex-shrink-0">🔒</span>
                      <span className="text-[10px] md:text-sm text-gray-300 font-mono truncate">{currentUrl.replace('https://', '')}</span>
                    </div>
                  </div>

                  {/* Platform indicator - Icon only on mobile */}
                  <div
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-gradient-to-r ${activePlatformConfig.gradient}`}
                  >
                    {(() => {
                      const Icon = activePlatformConfig.icon
                      return <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    })()}
                    <span className="text-xs md:text-sm font-medium text-white hidden md:inline">{activePlatformConfig.shortName}</span>
                  </div>

                  {/* Visit recorded indicator */}
                  {activePlatform && isRecorded(activePlatform) && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] md:text-xs text-emerald-300 hidden md:inline">Visited</span>
                    </div>
                  )}

                  {/* Actions - Minimal on mobile */}
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <button
                      onClick={handleOpenExternal}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden md:block"
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={handleClose}
                      className="p-1 md:p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Iframe Container - Fill remaining space */}
                <div className="relative flex-1 bg-[#0A0A0F]">
                  {/* Loading overlay */}
                  {isLoading && !isBlocked && (
                    <div className="absolute inset-0 bg-[#0A0A0F] flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-4">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activePlatformConfig.gradient} p-0.5 animate-pulse`}
                        >
                          <div className="w-full h-full rounded-2xl bg-[#0A0A0F] flex items-center justify-center">
                            {(() => {
                              const Icon = activePlatformConfig.icon
                              return <Icon className="w-8 h-8 text-white" />
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading {activePlatformConfig.name}...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blocked overlay */}
                  {isBlocked && (
                    <div className="absolute inset-0 bg-[#0A0A0F] flex items-center justify-center z-20">
                      <div className="flex flex-col items-center gap-6 max-w-md text-center p-8">
                        {/* Warning icon */}
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activePlatformConfig.gradient} p-0.5`}
                        >
                          <div className="w-full h-full rounded-2xl bg-[#0A0A0F] flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-hive-amber" />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            This site blocks embedding
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {activePlatformConfig.name} prevents iframe embedding for security.
                          </p>
                          {blockReason && (
                            <p className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg inline-block">
                              {blockReason}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 w-full">
                          <button
                            onClick={handleOpenExternal}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${activePlatformConfig.gradient} text-white font-medium hover:opacity-90 transition-opacity`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open {activePlatformConfig.name} in New Tab
                          </button>

                          <button
                            onClick={handleCopyUrl}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-gray-300 font-medium hover:border-white/40 hover:text-white transition-all"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy URL
                              </>
                            )}
                          </button>
                        </div>

                        {/* URL display */}
                        <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-xs text-gray-500 font-mono truncate">{currentUrl}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actual iframe - only render if not blocked AND check is complete */}
                  {!isBlocked && checkComplete && (
                    <iframe
                      ref={iframeRef}
                      src={currentUrl}
                      className="w-full h-full border-0"
                      onLoad={handleIframeLoad}
                      onError={() => {
                        setIsBlocked(true)
                        setBlockReason('Failed to load page')
                        setIsLoading(false)
                      }}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={`${activePlatformConfig.name} Explorer`}
                    />
                  )}
                </div>
              </div>
              )}

              {/* Quick switch tabs - Responsive for both mobile and desktop */}
              {!isFullscreen && !activePlatformConfig.useMirror && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 md:gap-2 mt-2 md:mt-3 flex-shrink-0 px-1">
                  <span className="text-[10px] md:text-xs text-gray-500 mr-1 md:mr-2 hidden md:inline">Quick switch:</span>
                  {(Object.keys(PLATFORMS) as PlatformId[]).map((platformId) => {
                    const platform = PLATFORMS[platformId]
                    const Icon = platform.icon
                    const isActive = platformId === activePlatform
                    return (
                      <button
                        key={platformId}
                        onClick={() => handlePlatformSelect(platformId)}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-1 rounded-lg border text-[10px] md:text-xs font-medium transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${platform.gradient} text-white border-transparent`
                            : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{platform.shortName}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
