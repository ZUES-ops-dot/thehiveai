'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { 
  Hexagon, 
  LayoutDashboard, 
  Brain, 
  Flame, 
  Diamond,
  User,
  Menu,
  X,
  Trophy,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { useMissionStore } from '@/lib/stores/useMissionStore'
import { 
  fadeInDown, 
  globalTransition, 
  hoverScale, 
  tapScale,
  staggerContainer,
  fadeIn
} from '@/lib/motion/presets'

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  comingSoon?: boolean
  tagline?: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Swarm Radar', icon: Brain, comingSoon: true, tagline: 'Coming to the Hive' },
  { href: '/narratives', label: 'Narratives', icon: Flame },
  { href: '/missions', label: 'Missions', icon: Target },
  { href: '/leaderboards', label: 'Leaderboards', icon: Trophy },
  { href: '/projects', label: 'Projects', icon: Diamond },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [comingSoonPulse, setComingSoonPulse] = useState<string | null>(null)
  const [headerRippleKey, setHeaderRippleKey] = useState<number | null>(null)
  const prefersReduced = usePrefersReducedMotion()
  const claimableMissions = useMissionStore((state) => state.claimableMissions)

  const triggerComingSoonPulse = (label: string) => {
    setComingSoonPulse(label)
    setHeaderRippleKey(Date.now())
    setTimeout(() => {
      setComingSoonPulse((current) => (current === label ? null : current))
    }, 600)
    setTimeout(() => {
      setHeaderRippleKey((current) => (current === null ? null : null))
    }, 800)
  }

  // Motion props respecting user preferences
  const headerMotion = prefersReduced ? {} : {
    initial: 'hidden',
    animate: 'visible',
    variants: fadeInDown,
  }

  return (
    <motion.header
      {...headerMotion}
      className="sticky top-0 z-50 w-full border-b border-hive-amber/10 bg-background/80 backdrop-blur-xl relative overflow-hidden"
    >
      <AnimatePresence>
        {headerRippleKey !== null && (
          <motion.div
            key={headerRippleKey}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-2/3 bg-gradient-to-r from-hive-amber/40 via-hive-cyan/30 to-transparent blur-3xl"
              initial={{ x: '-120%' }}
              animate={{ x: '160%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 30 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Hexagon className="h-6 w-6 sm:h-8 sm:w-8 text-hive-amber fill-hive-amber/20" />
              <motion.div
                className="absolute inset-0 blur-md bg-hive-amber/30 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-white group-hover:text-hive-amber transition-colors">
                HIVE AI
              </span>
              <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block">
                Solana Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href ? pathname === item.href : false

              if (item.comingSoon) {
                return (
                  <div key={item.label} className="relative px-4 py-2">
                    <motion.button
                      type="button"
                      onClick={() => triggerComingSoonPulse(item.label)}
                      className={cn(
                        'flex items-center gap-2 text-sm font-medium text-gray-400 focus:outline-none',
                        comingSoonPulse === item.label && 'text-white'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon className="h-4 w-4 text-hive-cyan" />
                      <span>{item.label}</span>
                      <span className="relative inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-hive-cyan">
                        <motion.span
                          className="block w-2 h-2 rounded-full bg-hive-cyan shadow-glow-cyan"
                          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="relative">
                          {item.tagline || 'Coming Soon'}
                          {comingSoonPulse === item.label && (
                            <span className="absolute inset-0 rounded-full animate-pulse text-transparent">
                              {item.tagline || 'Coming Soon'}
                            </span>
                          )}
                        </span>
                      </span>
                    </motion.button>
                  </div>
                )
              }

              const hasMissionNotification = item.label === 'Missions' && claimableMissions > 0
              
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="relative px-4 py-2"
                >
                  <motion.div
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors',
                      isActive 
                        ? 'text-hive-amber' 
                        : hasMissionNotification
                          ? 'text-emerald-400'
                          : 'text-gray-400 hover:text-white'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <Icon className={cn('h-4 w-4', hasMissionNotification && 'text-emerald-400')} />
                      {hasMissionNotification && (
                        <>
                          {/* Pulsing glow behind icon */}
                          <motion.div
                            className="absolute inset-0 blur-md bg-emerald-400/60 rounded-full"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.6, 0.3, 0.6]
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          />
                          {/* Badge with count */}
                          <motion.span
                            className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            {claimableMissions}
                          </motion.span>
                        </>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hive-amber to-hive-cyan"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side: Profile + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Creator Profile Button */}
            <Link href="/profile">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-hive-amber/20 bg-hive-amber/5 text-gray-400 hover:text-white hover:border-hive-amber/40 transition-all cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span className="text-sm hidden lg:inline">My Profile</span>
              </motion.div>
            </Link>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-hive-amber/20 bg-hive-amber/5 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={globalTransition}
              className="md:hidden border-t border-hive-amber/10 py-2 overflow-hidden"
            >
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-1"
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = item.href ? pathname === item.href : false

                  return (
                    <motion.div key={item.label} variants={fadeIn}>
                      {item.comingSoon ? (
                        <motion.button
                          type="button"
                          onClick={() => triggerComingSoonPulse(item.label)}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded-lg text-center text-gray-400 focus:outline-none',
                            comingSoonPulse === item.label && 'text-white'
                          )}
                          whileTap={{ scale: 0.92 }}
                        >
                          <Icon className="h-5 w-5 text-hive-cyan" />
                          <span className="text-[10px] font-medium">{item.label}</span>
                          <span className="text-[8px] uppercase text-hive-cyan/80 relative">
                            {item.tagline || 'Coming Soon'}
                            {comingSoonPulse === item.label && (
                              <span className="absolute inset-0 rounded-full animate-pulse text-transparent">
                                {item.tagline || 'Coming Soon'}
                              </span>
                            )}
                          </span>
                        </motion.button>
                      ) : (
                        <Link
                          href={item.href!}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all duration-fast ease-hive relative',
                            isActive 
                              ? 'bg-hive-amber/10 text-hive-amber' 
                              : item.label === 'Missions' && claimableMissions > 0
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <div className="relative">
                            <Icon className="h-5 w-5" />
                            {item.label === 'Missions' && claimableMissions > 0 && (
                              <>
                                <motion.div
                                  className="absolute inset-0 blur-md bg-emerald-400/60 rounded-full"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <motion.span
                                  className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white"
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  {claimableMissions}
                                </motion.span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Animated bottom border glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), rgba(6, 182, 212, 0.5), transparent)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.header>
  )
}
