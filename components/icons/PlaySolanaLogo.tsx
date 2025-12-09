'use client'

import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function PlaySolanaLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Play Solana logo"
      className={cn('text-white', className)}
      {...props}
    >
      <defs>
        <linearGradient id="solana-top" x1="8%" y1="0%" x2="92%" y2="0%">
          <stop offset="0%" stopColor="#0bc3ff" />
          <stop offset="50%" stopColor="#58d3dd" />
          <stop offset="100%" stopColor="#a66bff" />
        </linearGradient>
        <linearGradient id="solana-mid" x1="8%" y1="0%" x2="92%" y2="0%">
          <stop offset="0%" stopColor="#00ffa3" />
          <stop offset="50%" stopColor="#03e1ff" />
          <stop offset="100%" stopColor="#dc1fff" />
        </linearGradient>
        <linearGradient id="solana-bot" x1="8%" y1="0%" x2="92%" y2="0%">
          <stop offset="0%" stopColor="#00ffa3" />
          <stop offset="40%" stopColor="#29d9ff" />
          <stop offset="100%" stopColor="#9945ff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#solana-top)"
        d="M48.5 10H17.3c-.7 0-1.4.3-1.9.8L8 18.2c-1.1 1.1-.3 3 1.3 3h31.2c.7 0 1.4-.3 1.9-.8l7.4-7.4c1.1-1.1.3-3-1.3-3Z"
      />
      <path
        fill="url(#solana-mid)"
        d="M48.5 28H17.3c-.7 0-1.4.3-1.9.8L8 36.2c-1.1 1.1-.3 3 1.3 3h31.2c.7 0 1.4-.3 1.9-.8l7.4-7.4c1.1-1.1.3-3-1.3-3Z"
      />
      <path
        fill="url(#solana-bot)"
        d="M48.5 46H17.3c-.7 0-1.4.3-1.9.8L8 54.2c-1.1 1.1-.3 3 1.3 3h31.2c.7 0 1.4-.3 1.9-.8l7.4-7.4c1.1-1.1.3-3-1.3-3Z"
      />
    </svg>
  )
}
