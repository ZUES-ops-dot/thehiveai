'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useHiveMotion } from '@/lib/stores/useHiveMotion'

// ============================================
// SOUND DESIGN LAYER
// Subtle audio feedback for the hive experience
// ============================================

type SoundType = 
  | 'nodePulse'      // Light ping when node pulses
  | 'connection'      // Soft electric crack for connections
  | 'hover'           // Airy whoosh on hover
  | 'click'           // Soft tap
  | 'transition'      // Spatial swipe for page changes
  | 'notification'    // Alert sound
  | 'wave'            // Sweep sound
  | 'success'         // Positive feedback
  | 'warning'         // Warning alert

// Web Audio API context and sounds
let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// Generate synthetic sounds using Web Audio API
const createOscillatorSound = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1
) => {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  
  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

// Sound definitions
const sounds: Record<SoundType, (ctx: AudioContext, volume: number) => void> = {
  nodePulse: (ctx, vol) => {
    createOscillatorSound(ctx, 880, 0.1, 'sine', vol * 0.15)
    setTimeout(() => createOscillatorSound(ctx, 1100, 0.08, 'sine', vol * 0.1), 50)
  },
  
  connection: (ctx, vol) => {
    createOscillatorSound(ctx, 200, 0.15, 'sawtooth', vol * 0.08)
    createOscillatorSound(ctx, 400, 0.1, 'sine', vol * 0.1)
  },
  
  hover: (ctx, vol) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(vol * 0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  },
  
  click: (ctx, vol) => {
    createOscillatorSound(ctx, 1000, 0.05, 'square', vol * 0.1)
  },
  
  transition: (ctx, vol) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  },
  
  notification: (ctx, vol) => {
    createOscillatorSound(ctx, 523, 0.1, 'sine', vol * 0.15)
    setTimeout(() => createOscillatorSound(ctx, 659, 0.1, 'sine', vol * 0.15), 100)
    setTimeout(() => createOscillatorSound(ctx, 784, 0.15, 'sine', vol * 0.12), 200)
  },
  
  wave: (ctx, vol) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5)
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1)
    gain.gain.setValueAtTime(vol * 0.05, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol * 0.08, ctx.currentTime + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1)
  },
  
  success: (ctx, vol) => {
    createOscillatorSound(ctx, 523, 0.1, 'sine', vol * 0.12)
    setTimeout(() => createOscillatorSound(ctx, 659, 0.1, 'sine', vol * 0.12), 80)
    setTimeout(() => createOscillatorSound(ctx, 784, 0.2, 'sine', vol * 0.15), 160)
  },
  
  warning: (ctx, vol) => {
    createOscillatorSound(ctx, 440, 0.15, 'square', vol * 0.1)
    setTimeout(() => createOscillatorSound(ctx, 440, 0.15, 'square', vol * 0.1), 200)
  },
}

export function useSoundEffects() {
  const { soundEnabled, soundVolume } = useHiveMotion()
  const lastPlayedRef = useRef<Record<string, number>>({})
  
  const playSound = useCallback((type: SoundType, debounceMs = 50) => {
    if (!soundEnabled) return
    
    // Debounce rapid sounds
    const now = Date.now()
    if (lastPlayedRef.current[type] && now - lastPlayedRef.current[type] < debounceMs) {
      return
    }
    lastPlayedRef.current[type] = now
    
    const ctx = getAudioContext()
    if (!ctx) return
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    try {
      sounds[type](ctx, soundVolume)
    } catch (e) {
      console.warn('Sound playback failed:', e)
    }
  }, [soundEnabled, soundVolume])
  
  return {
    playSound,
    playNodePulse: () => playSound('nodePulse'),
    playConnection: () => playSound('connection'),
    playHover: () => playSound('hover', 100),
    playClick: () => playSound('click'),
    playTransition: () => playSound('transition'),
    playNotification: () => playSound('notification'),
    playWave: () => playSound('wave'),
    playSuccess: () => playSound('success'),
    playWarning: () => playSound('warning'),
  }
}

// Sound toggle component hook
export function useSoundToggle() {
  const { soundEnabled, toggleSound, soundVolume, setSoundVolume } = useHiveMotion()
  
  return {
    soundEnabled,
    toggleSound,
    soundVolume,
    setSoundVolume,
  }
}
