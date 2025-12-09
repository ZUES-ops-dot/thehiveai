// lib/motion/presets.ts
// Centralized motion presets for consistent animations across the app

import { type Variants, type Transition } from 'framer-motion'

// Global transition curve (Apple-like smooth easing)
export const globalTransition: Transition = { 
  duration: 0.45, 
  ease: [0.22, 0.8, 0.2, 1] 
}

// Fast transition for micro-interactions
export const fastTransition: Transition = { 
  duration: 0.2, 
  ease: [0.22, 0.8, 0.2, 1] 
}

// Spring transition for bouncy effects
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
}

// ============================================================================
// ENTRANCE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: globalTransition 
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: globalTransition 
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: globalTransition 
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: globalTransition 
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: globalTransition 
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: springTransition 
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: globalTransition 
  },
}

// ============================================================================
// STAGGER CONTAINERS
// ============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

// ============================================================================
// LOOP ANIMATIONS
// ============================================================================

export const floatLoop: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: { 
      duration: 6, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    },
  },
}

export const floatLoopFast: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    },
  },
}

export const subtlePulse: Variants = {
  animate: {
    scale: [1, 1.01, 1],
    opacity: [1, 0.92, 1],
    transition: { 
      duration: 2.6, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    },
  },
}

export const glowPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(245, 158, 11, 0.1)',
      '0 0 40px rgba(245, 158, 11, 0.2)',
      '0 0 20px rgba(245, 158, 11, 0.1)',
    ],
    transition: { 
      duration: 2, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    },
  },
}

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: 'linear' 
    },
  },
}

export const rotate: Variants = {
  animate: {
    rotate: 360,
    transition: { 
      duration: 20, 
      repeat: Infinity, 
      ease: 'linear' 
    },
  },
}

// ============================================================================
// HOVER STATES
// ============================================================================

export const hoverScale = {
  scale: 1.02,
  transition: fastTransition,
}

export const hoverScaleSmall = {
  scale: 1.01,
  transition: fastTransition,
}

export const hoverScaleLarge = {
  scale: 1.05,
  transition: fastTransition,
}

export const hoverLift = {
  y: -4,
  transition: fastTransition,
}

export const hoverGlow = {
  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
  transition: fastTransition,
}

// ============================================================================
// TAP STATES
// ============================================================================

export const tapScale = {
  scale: 0.98,
}

export const tapScaleSmall = {
  scale: 0.99,
}

// ============================================================================
// EXIT ANIMATIONS
// ============================================================================

export const fadeOut: Variants = {
  initial: { opacity: 1 },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2 } 
  },
}

export const scaleOut: Variants = {
  initial: { opacity: 1, scale: 1 },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a staggered delay for list items
 */
export function staggerDelay(index: number, base = 0.05): number {
  return index * base
}

/**
 * Get animation props respecting reduced motion preference
 */
export function getMotionProps(
  prefersReduced: boolean,
  variants: Variants,
  animate = 'visible'
) {
  if (prefersReduced) {
    return {}
  }
  return {
    initial: 'hidden',
    animate,
    variants,
  }
}
