import { Variants, Transition } from 'framer-motion'

// ============================================
// TRANSITION PRESETS
// ============================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const smoothTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.4,
}

export const slowTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.8,
}

// ============================================
// FADE VARIANTS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: smoothTransition,
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 },
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition,
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: smoothTransition,
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: smoothTransition,
  },
}

// ============================================
// SCALE VARIANTS
// ============================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
}

// ============================================
// GLOW & PULSE VARIANTS (HIVE SPECIFIC)
// ============================================

export const pulseGlow: Variants = {
  idle: {
    scale: 1,
    opacity: 0.6,
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const breathe: Variants = {
  idle: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const glowPulse: Variants = {
  idle: {
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
  },
  glow: {
    boxShadow: [
      '0 0 10px rgba(245, 158, 11, 0.3)',
      '0 0 25px rgba(245, 158, 11, 0.5)',
      '0 0 10px rgba(245, 158, 11, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const nodeHover: Variants = {
  idle: { 
    scale: 1,
    filter: 'brightness(1)',
  },
  hover: { 
    scale: 1.15,
    filter: 'brightness(1.2)',
    transition: springTransition,
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 },
  },
}

// ============================================
// ORBIT & ROTATION VARIANTS
// ============================================

export const orbit: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const orbitReverse: Variants = {
  animate: {
    rotate: -360,
    transition: {
      duration: 25,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const spinSlow: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 30,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const wobble: Variants = {
  animate: {
    rotate: [-2, 2, -2],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================
// FLOAT VARIANTS
// ============================================

export const float: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const floatSlight: Variants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const floatRotate: Variants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [-5, 5, -5],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================
// STAGGER CONTAINERS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageSlideIn: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: smoothTransition,
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 },
  },
}

export const pageScaleIn: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: smoothTransition,
  },
  exit: { 
    opacity: 0, 
    scale: 1.02,
    transition: { duration: 0.2 },
  },
}

// ============================================
// CARD VARIANTS
// ============================================

export const cardHover: Variants = {
  idle: { 
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  hover: { 
    y: -4,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
    transition: springTransition,
  },
}

export const cardGlowHover: Variants = {
  idle: { 
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 rgba(245, 158, 11, 0)',
  },
  hover: { 
    y: -4,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.3)',
    transition: springTransition,
  },
}

// ============================================
// SHIMMER & LOADING
// ============================================

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================
// RIPPLE EFFECT
// ============================================

export const ripple: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

// ============================================
// LINE DRAW (FOR SVG PATHS)
// ============================================

export const drawLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1, ease: 'easeInOut' },
      opacity: { duration: 0.2 },
    },
  },
}

// ============================================
// UTILITY FUNCTION
// ============================================

export const createStaggerDelay = (index: number, baseDelay = 0.1) => ({
  transition: { delay: index * baseDelay },
})
