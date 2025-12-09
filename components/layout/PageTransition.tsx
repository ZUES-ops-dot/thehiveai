'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { fadeIn, globalTransition } from '@/lib/motion/presets'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

// Page transition variants
const pageVariants = {
  hidden: { 
    opacity: 0, 
    y: 8,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: globalTransition,
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2 },
  },
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const prefersReduced = usePrefersReducedMotion()
  
  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Wrapper with AnimatePresence for route changes
// Note: Removed key={pathname} to prevent full remounts which cause infinite fetch loops
export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const prefersReduced = usePrefersReducedMotion()

  if (prefersReduced) {
    return <>{children}</>
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

// Alternative fade transition
export function PageFade({ children, className = '' }: PageTransitionProps) {
  const prefersReduced = usePrefersReducedMotion()
  
  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={globalTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale in transition
export function PageScale({ children, className = '' }: PageTransitionProps) {
  const prefersReduced = usePrefersReducedMotion()
  
  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={globalTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}
