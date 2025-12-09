'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, TrendingUp, Users, Flame, AlertTriangle, 
  Sparkles, Brain, Activity, Bell
} from 'lucide-react'
import { useSoundEffects } from '@/lib/audio/useSoundEffects'

// ============================================
// LIVE ACTIVITY LAYER
// Real-time notifications that make the hive feel alive
// ============================================

type ActivityType = 
  | 'wave_detected'
  | 'cluster_expanding'
  | 'influencer_surge'
  | 'sentiment_spike'
  | 'new_narrative'
  | 'viral_alert'
  | 'whale_activity'
  | 'trend_shift'

interface Activity {
  id: string
  type: ActivityType
  message: string
  detail?: string
  timestamp: Date
  importance: 'low' | 'medium' | 'high'
}

const activityIcons: Record<ActivityType, typeof Zap> = {
  wave_detected: Activity,
  cluster_expanding: Sparkles,
  influencer_surge: Users,
  sentiment_spike: TrendingUp,
  new_narrative: Brain,
  viral_alert: Flame,
  whale_activity: Zap,
  trend_shift: AlertTriangle,
}

const activityColors: Record<ActivityType, string> = {
  wave_detected: 'text-hive-cyan',
  cluster_expanding: 'text-hive-purple',
  influencer_surge: 'text-hive-amber',
  sentiment_spike: 'text-emerald-400',
  new_narrative: 'text-hive-cyan',
  viral_alert: 'text-rose-400',
  whale_activity: 'text-hive-amber',
  trend_shift: 'text-yellow-400',
}

// Mock activity generator
const mockActivities: Omit<Activity, 'id' | 'timestamp'>[] = [
  { type: 'wave_detected', message: 'New wave detected', detail: 'DeFi sector showing unusual activity', importance: 'medium' },
  { type: 'cluster_expanding', message: 'Narrative cluster expanding', detail: '"Firedancer" cluster grew 23%', importance: 'high' },
  { type: 'influencer_surge', message: 'Influencer gained +12.3%', detail: '@aeyakovenko influence rank up', importance: 'medium' },
  { type: 'sentiment_spike', message: 'Sentiment spike detected', detail: '$JUP showing 89% bullish sentiment', importance: 'high' },
  { type: 'new_narrative', message: 'New narrative emerging', detail: '"State Compression" trending', importance: 'medium' },
  { type: 'viral_alert', message: 'Viral content detected', detail: 'Thread reaching 50K impressions', importance: 'high' },
  { type: 'whale_activity', message: 'Smart money movement', detail: 'Large wallet accumulating $BONK', importance: 'high' },
  { type: 'trend_shift', message: 'Trend direction changing', detail: 'Memecoin sentiment reversing', importance: 'medium' },
]

interface HiveActivityFeedProps {
  maxItems?: number
  autoGenerate?: boolean
  className?: string
}

export function HiveActivityFeed({ 
  maxItems = 5, 
  autoGenerate = true,
  className = ''
}: HiveActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const { playNotification } = useSoundEffects()

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }
    
    setActivities(prev => [newActivity, ...prev].slice(0, maxItems))
    
    if (activity.importance === 'high') {
      playNotification()
    }
  }, [maxItems, playNotification])

  // Auto-generate mock activities
  useEffect(() => {
    if (!autoGenerate) return

    // Initial activities
    const initialCount = 3
    for (let i = 0; i < initialCount; i++) {
      setTimeout(() => {
        const random = mockActivities[Math.floor(Math.random() * mockActivities.length)]
        addActivity(random)
      }, i * 500)
    }

    // Periodic new activities
    const interval = setInterval(() => {
      const random = mockActivities[Math.floor(Math.random() * mockActivities.length)]
      addActivity(random)
    }, 8000 + Math.random() * 7000) // 8-15 seconds

    return () => clearInterval(interval)
  }, [autoGenerate, addActivity])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-hive-amber animate-pulse" />
        <span className="text-sm font-medium text-gray-400">Live Activity</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type]
          const colorClass = activityColors[activity.type]
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`
                relative p-3 rounded-lg border backdrop-blur-sm cursor-pointer
                transition-all duration-200 hover:scale-[1.02]
                ${activity.importance === 'high' 
                  ? 'bg-hive-amber/5 border-hive-amber/30 hover:border-hive-amber/50' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
                }
              `}
            >
              {/* Glow effect for high importance */}
              {activity.importance === 'high' && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-hive-amber/10"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <div className="relative flex items-start gap-3">
                <motion.div
                  className={`p-1.5 rounded-md bg-white/5 ${colorClass}`}
                  animate={activity.importance === 'high' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    🐝 {activity.message}
                  </p>
                  {activity.detail && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {activity.detail}
                    </p>
                  )}
                </div>
                
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {activities.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Monitoring hive activity...
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}
