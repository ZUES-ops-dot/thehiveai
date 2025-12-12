'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  Brain,
  Coins,
  Globe,
  MessageSquare,
  Radar,
  Repeat,
  Rocket,
  Search,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

type AccentColor = 'amber' | 'cyan' | 'purple' | 'green'

interface StackModule {
  id: string
  title: string
  description: string
  icon: LucideIcon
  accent: AccentColor
}

const accentStyles: Record<AccentColor, { border: string; bg: string; text: string; glow: string }> = {
  amber: {
    border: 'border-hive-amber/30 hover:border-hive-amber/60',
    bg: 'bg-hive-amber/5',
    text: 'text-hive-amber',
    glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
  cyan: {
    border: 'border-hive-cyan/30 hover:border-hive-cyan/60',
    bg: 'bg-hive-cyan/5',
    text: 'text-hive-cyan',
    glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
  purple: {
    border: 'border-hive-purple/30 hover:border-hive-purple/60',
    bg: 'bg-hive-purple/5',
    text: 'text-hive-purple',
    glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  },
  green: {
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
}

const stackModules: StackModule[] = [
  { id: 'source', title: 'Source', description: 'AI trend radar across X, TikTok, Reddit', icon: Search, accent: 'cyan' },
  { id: 'brain', title: 'Brain', description: 'Topic summaries, playbooks, sentiment', icon: Brain, accent: 'purple' },
  { id: 'factory', title: 'Factory', description: 'Tweets, threads, video, memes, newsletters', icon: Zap, accent: 'amber' },
  { id: 'swarm', title: 'Swarm', description: 'Multi-platform distribution engine', icon: Globe, accent: 'cyan' },
  { id: 'collective', title: 'Collective', description: 'Profiles, XP, badges, missions, chat', icon: Users, accent: 'purple' },
  { id: 'economy', title: 'Economy', description: 'Pro tools, marketplace, credits', icon: Coins, accent: 'amber' },
  { id: 'growth', title: 'Growth', description: 'Reply sniper, amplify, schedulers', icon: Rocket, accent: 'green' },
  { id: 'loop', title: 'Loop', description: 'Self-improving feedback engine', icon: Repeat, accent: 'purple' },
]

const flywheelSteps = [
  'Create content',
  'Get engagement',
  'Capture patterns',
  'Build playbooks',
  'Improve suggestions',
  'Grow faster',
  'Attract users',
  'Compound intelligence',
]

function ModuleTile({ module, index }: { module: StackModule; index: number }) {
  const prefersReduced = usePrefersReducedMotion()
  const Icon = module.icon
  const style = accentStyles[module.accent]

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg border bg-white/[0.02] backdrop-blur-sm transition-all duration-200 cursor-default',
        style.border,
        style.glow
      )}
    >
      <div className={cn('flex-shrink-0 p-2 rounded-md', style.bg)}>
        <Icon className={cn('w-4 h-4', style.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{module.title}</div>
        <div className="text-[11px] text-gray-500 leading-tight truncate">{module.description}</div>
      </div>
      <div className={cn('text-[10px] font-mono', style.text)}>{String(index + 1).padStart(2, '0')}</div>
    </motion.div>
  )
}

function FlywheelRing() {
  const prefersReduced = usePrefersReducedMotion()

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full border border-white/10"
        animate={prefersReduced ? {} : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-hive-amber/20"
        animate={prefersReduced ? {} : { rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Radar className="w-8 h-8 text-hive-amber mx-auto mb-2" />
          <div className="text-xs font-semibold text-white">Flywheel</div>
          <div className="text-[10px] text-gray-500">8 steps</div>
        </div>
      </div>
      {flywheelSteps.map((step, i) => {
        const angle = (i / flywheelSteps.length) * 2 * Math.PI - Math.PI / 2
        const radius = 42
        const x = 50 + radius * Math.cos(angle)
        const y = 50 + radius * Math.sin(angle)
        const colors = ['text-hive-amber', 'text-hive-cyan', 'text-hive-purple', 'text-emerald-400']
        const color = colors[i % colors.length]

        return (
          <motion.div
            key={step}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.8 }}
            animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <div className="flex flex-col items-center">
              <div className={cn('w-2 h-2 rounded-full mb-1', color.replace('text-', 'bg-'))} />
              <span className="text-[9px] text-gray-400 whitespace-nowrap max-w-[60px] text-center leading-tight">{step}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function DeliveryLane({ icon: Icon, title, subtitle, accent }: { icon: LucideIcon; title: string; subtitle: string; accent: AccentColor }) {
  const style = accentStyles[accent]
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border bg-white/[0.02] transition-all duration-200', style.border, style.glow, 'group')}>
      <div className={cn('p-2 rounded-md', style.bg)}>
        <Icon className={cn('w-4 h-4', style.text)} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-[11px] text-gray-500">{subtitle}</div>
      </div>
    </div>
  )
}

export default function SwarmRadarPage() {
  const prefersReduced = usePrefersReducedMotion()

  return (
    <div className="page-container">
      <section className="space-y-6">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hive-amber/30 bg-hive-amber/5 mb-4">
            <Sparkles className="w-3 h-3 text-hive-amber" />
            <span className="text-[10px] font-medium text-hive-amber uppercase tracking-widest">AI Info-Fi Stack</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Swarm <span className="gradient-text">Radar</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            The modular intelligence engine that turns global signal into content, distribution, community, and compounding growth.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <a href="#stack" className="btn btn-md btn-primary">
              Explore Stack
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link href="/profile" className="btn btn-md btn-secondary">
              Join Hive
            </Link>
          </div>
        </motion.div>
      </section>

      <section id="stack" className="scroll-mt-20 space-y-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            The <span className="gradient-text">Stack</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">8 modular layers powering the hive</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {stackModules.map((module, i) => (
            <ModuleTile key={module.id} module={module} index={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Feedback <span className="gradient-text">Engine</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Self-improving loop that compounds over time</p>
        </div>

        <FlywheelRing />
      </section>

      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Delivery <span className="gradient-text">Lanes</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">X + Web + Mobile feeding the same loop</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <DeliveryLane icon={MessageSquare} title="X Swarm" subtitle="Safe automation + engagement" accent="amber" />
          <DeliveryLane icon={Activity} title="Web Center" subtitle="Dashboards + content factory" accent="cyan" />
          <DeliveryLane icon={Smartphone} title="Mobile Hive" subtitle="Missions + alerts + chat" accent="purple" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Roadmap <span className="gradient-text">Shape</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">From blueprint to full Info-Fi empire</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="p-4 rounded-lg border border-hive-cyan/20 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-hive-cyan/10 flex items-center justify-center text-[10px] font-bold text-hive-cyan">01</div>
              <span className="text-sm font-semibold text-white">MVP</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">Landing page + stack visualization + design language</p>
          </div>
          <div className="p-4 rounded-lg border border-hive-amber/20 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-hive-amber/10 flex items-center justify-center text-[10px] font-bold text-hive-amber">02</div>
              <span className="text-sm font-semibold text-white">V1</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">Trend snapshots + narrative clustering + daily playbooks</p>
          </div>
          <div className="p-4 rounded-lg border border-hive-purple/20 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-hive-purple/10 flex items-center justify-center text-[10px] font-bold text-hive-purple">03</div>
              <span className="text-sm font-semibold text-white">V2</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">Multi-platform publishing + marketplace + credits economy</p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] text-center">
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">Note:</span> This is a vision-aligned blueprint. Collectors, LLM pipelines, and automation ship incrementally.
          </p>
        </div>
      </section>
    </div>
  )
}
