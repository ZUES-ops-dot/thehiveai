'use client'

import { motion } from 'framer-motion'
import { 
  Settings, Volume2, VolumeX, Zap, Sparkles, 
  Sun, Moon, Palette, Activity, Eye, EyeOff
} from 'lucide-react'
import { useState } from 'react'
import { useHiveMotion, HiveMood, MarketState } from '@/lib/stores/useHiveMotion'
import { hiveThemes, applyTheme } from '@/lib/themes/hiveThemes'
import { useSoundToggle } from '@/lib/audio/useSoundEffects'

// ============================================
// HIVE SETTINGS PANEL
// Control center for all hive effects
// ============================================

interface HiveSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function HiveSettingsPanel({ isOpen, onClose }: HiveSettingsPanelProps) {
  const {
    mood,
    setMood,
    marketState,
    setMarketState,
    glowIntensity,
    setGlowIntensity,
    particleDensity,
    setParticleDensity,
    globalPulseActive,
    toggleGlobalPulse,
    breatheActive,
    toggleBreathe,
    activeTheme,
    setTheme,
    reducedMotion,
    setReducedMotion,
  } = useHiveMotion()

  const { soundEnabled, toggleSound, soundVolume, setSoundVolume } = useSoundToggle()

  const moods: HiveMood[] = ['calm', 'alert', 'excited', 'critical']
  const marketStates: MarketState[] = ['neutral', 'growth', 'volatility', 'hype', 'fear']

  const handleThemeChange = (themeName: keyof typeof hiveThemes) => {
    setTheme(themeName as 'prime' | 'shadow' | 'lumina')
    applyTheme(themeName)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-background-card border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-hive-amber" />
            <h2 className="text-lg font-semibold text-white">Hive Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        {/* Sound Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Sound</h3>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-sm">Sound Effects</span>
            </div>
            <button
              onClick={toggleSound}
              className={`w-10 h-6 rounded-full transition-colors ${
                soundEnabled ? 'bg-hive-amber' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="w-4 h-4 bg-white rounded-full shadow"
                animate={{ x: soundEnabled ? 20 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          {soundEnabled && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-full accent-hive-amber"
              />
            </div>
          )}
        </section>

        {/* Theme Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(hiveThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as keyof typeof hiveThemes)}
                className={`p-3 rounded-lg border transition-all ${
                  activeTheme === key
                    ? 'border-hive-amber bg-hive-amber/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <span className="text-xs font-medium">{theme.name}</span>
                </div>
                <p className="text-[10px] text-gray-500 text-left">{theme.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Mood Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Hive Mood</h3>
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mood === m
                    ? 'bg-hive-amber text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Market State */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Market State</h3>
          <div className="flex flex-wrap gap-2">
            {marketStates.map((state) => (
              <button
                key={state}
                onClick={() => setMarketState(state)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  marketState === state
                    ? 'bg-hive-cyan text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {state === 'growth' && '🟢 '}
                {state === 'volatility' && '🟡 '}
                {state === 'hype' && '🔥 '}
                {state === 'fear' && '🔴 '}
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Effects Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Effects</h3>
          
          {/* Glow Intensity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Glow Intensity</span>
              <span className="text-xs text-hive-amber">{Math.round(glowIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
              className="w-full accent-hive-amber"
            />
          </div>

          {/* Particle Density */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Particle Density</span>
              <span className="text-xs text-hive-cyan">{Math.round(particleDensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={particleDensity}
              onChange={(e) => setParticleDensity(parseFloat(e.target.value))}
              className="w-full accent-hive-cyan"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <EffectToggle
              icon={<Activity className="w-4 h-4" />}
              label="Global Pulse"
              enabled={globalPulseActive}
              onToggle={toggleGlobalPulse}
            />
            <EffectToggle
              icon={<Sparkles className="w-4 h-4" />}
              label="Breathing Effect"
              enabled={breatheActive}
              onToggle={toggleBreathe}
            />
            <EffectToggle
              icon={reducedMotion ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              label="Reduced Motion"
              enabled={reducedMotion}
              onToggle={() => setReducedMotion(!reducedMotion)}
            />
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function EffectToggle({ 
  icon, 
  label, 
  enabled, 
  onToggle 
}: { 
  icon: React.ReactNode
  label: string
  enabled: boolean
  onToggle: () => void 
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-8 h-5 rounded-full transition-colors ${
          enabled ? 'bg-hive-amber' : 'bg-gray-600'
        }`}
      >
        <motion.div
          className="w-3 h-3 bg-white rounded-full shadow"
          animate={{ x: enabled ? 16 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}
