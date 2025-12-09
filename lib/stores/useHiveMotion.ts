import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// GLOBAL MOTION CONTROLLER
// Controls the entire hive's animation state
// ============================================

export type HiveMood = 'calm' | 'alert' | 'excited' | 'critical'
export type PulseSpeed = 'slow' | 'normal' | 'fast'
export type MarketState = 'growth' | 'volatility' | 'hype' | 'fear' | 'neutral'

export type HiveThemeName = 'prime' | 'shadow' | 'lumina' | 'matrix'

interface HiveMotionState {
  // Core animation controls
  mood: HiveMood
  pulseSpeed: PulseSpeed
  marketState: MarketState
  
  // Intensity levels (0-1)
  glowIntensity: number
  rippleIntensity: number
  particleDensity: number
  connectionActivity: number
  
  // Global effects
  globalPulseActive: boolean
  waveActive: boolean
  breatheActive: boolean
  
  // Sound settings
  soundEnabled: boolean
  soundVolume: number
  
  // Theme
  activeTheme: HiveThemeName
  
  // Performance
  reducedMotion: boolean
  gpuAcceleration: boolean
  
  // Actions
  setMood: (mood: HiveMood) => void
  setPulseSpeed: (speed: PulseSpeed) => void
  setMarketState: (state: MarketState) => void
  setGlowIntensity: (intensity: number) => void
  setRippleIntensity: (intensity: number) => void
  setParticleDensity: (density: number) => void
  setConnectionActivity: (activity: number) => void
  toggleGlobalPulse: () => void
  toggleWave: () => void
  toggleBreathe: () => void
  toggleSound: () => void
  setSoundVolume: (volume: number) => void
  setTheme: (theme: HiveThemeName) => void
  setReducedMotion: (reduced: boolean) => void
  
  // Computed values
  getAnimationDuration: () => number
  getGlowOpacity: () => number
  getPulseScale: () => number
}

// Mood-based animation multipliers
const moodMultipliers: Record<HiveMood, { speed: number; intensity: number; glow: number }> = {
  calm: { speed: 0.5, intensity: 0.6, glow: 0.4 },
  alert: { speed: 1.0, intensity: 0.8, glow: 0.7 },
  excited: { speed: 1.5, intensity: 1.0, glow: 1.0 },
  critical: { speed: 2.0, intensity: 1.2, glow: 1.2 },
}

// Market state colors
export const marketStateColors: Record<MarketState, { primary: string; glow: string }> = {
  growth: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
  volatility: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)' },
  hype: { primary: '#EC4899', glow: 'rgba(236, 72, 153, 0.5)' },
  fear: { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)' },
  neutral: { primary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.5)' },
}

export const useHiveMotion = create<HiveMotionState>()(
  persist(
    (set, get) => ({
      // Initial state
      mood: 'alert',
      pulseSpeed: 'normal',
      marketState: 'neutral',
      glowIntensity: 0.7,
      rippleIntensity: 0.5,
      particleDensity: 0.6,
      connectionActivity: 0.5,
      globalPulseActive: true,
      waveActive: true,
      breatheActive: true,
      soundEnabled: false,
      soundVolume: 0.3,
      activeTheme: 'prime',
      reducedMotion: false,
      gpuAcceleration: true,

      // Setters
      setMood: (mood) => set({ mood }),
      setPulseSpeed: (pulseSpeed) => set({ pulseSpeed }),
      setMarketState: (marketState) => set({ marketState }),
      setGlowIntensity: (glowIntensity) => set({ glowIntensity: Math.max(0, Math.min(1, glowIntensity)) }),
      setRippleIntensity: (rippleIntensity) => set({ rippleIntensity: Math.max(0, Math.min(1, rippleIntensity)) }),
      setParticleDensity: (particleDensity) => set({ particleDensity: Math.max(0, Math.min(1, particleDensity)) }),
      setConnectionActivity: (connectionActivity) => set({ connectionActivity: Math.max(0, Math.min(1, connectionActivity)) }),
      toggleGlobalPulse: () => set((s) => ({ globalPulseActive: !s.globalPulseActive })),
      toggleWave: () => set((s) => ({ waveActive: !s.waveActive })),
      toggleBreathe: () => set((s) => ({ breatheActive: !s.breatheActive })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setSoundVolume: (soundVolume) => set({ soundVolume: Math.max(0, Math.min(1, soundVolume)) }),
      setTheme: (activeTheme) => set({ activeTheme }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),

      // Computed values based on mood
      getAnimationDuration: () => {
        const { mood, pulseSpeed, reducedMotion } = get()
        if (reducedMotion) return 0
        const moodMult = moodMultipliers[mood].speed
        const speedMult = pulseSpeed === 'slow' ? 0.5 : pulseSpeed === 'fast' ? 2 : 1
        return 2 / (moodMult * speedMult)
      },
      
      getGlowOpacity: () => {
        const { mood, glowIntensity, reducedMotion } = get()
        if (reducedMotion) return 0.3
        return glowIntensity * moodMultipliers[mood].glow
      },
      
      getPulseScale: () => {
        const { mood, reducedMotion } = get()
        if (reducedMotion) return 1
        return 1 + (moodMultipliers[mood].intensity * 0.1)
      },
    }),
    {
      name: 'hive-motion-storage',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        activeTheme: state.activeTheme,
        reducedMotion: state.reducedMotion,
      }),
    }
  )
)

// Selectors
export const useHiveMood = () => useHiveMotion((s) => s.mood)
export const useMarketState = () => useHiveMotion((s) => s.marketState)
export const useGlowIntensity = () => useHiveMotion((s) => s.glowIntensity)
export const useSoundEnabled = () => useHiveMotion((s) => s.soundEnabled)
export const useActiveTheme = () => useHiveMotion((s) => s.activeTheme)
