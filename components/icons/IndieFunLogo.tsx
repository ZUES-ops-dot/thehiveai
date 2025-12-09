'use client'

import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function IndieFunLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Indie.fun logo"
      className={cn('text-white', className)}
      {...props}
    >
      <title>Indie.fun</title>
      <path
        fill="#2d5bff"
        d="M8 6c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6v21c0 5.523 4.477 10 10 10s10-4.477 10-10V6c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6v21c0 17.673-14.327 32-32 32S8 44.673 8 27V6z"
      />
      <path
        fill="#8fe4ff"
        d="M16 9c0-2.209 1.791-4 4-4h6c2.209 0 4 1.791 4 4v18c0 5.523 4.477 10 10 10s10-4.477 10-10V9c0-2.209 1.791-4 4-4h6c2.209 0 4 1.791 4 4v18c0 12.703-10.297 23-23 23S16 39.703 16 27V9z"
      />
      <rect x="10" y="6" width="14" height="14" rx="4" fill="#9fe8ff" />
      <rect x="40" y="6" width="14" height="14" rx="4" fill="#9fe8ff" />
    </svg>
  )
}
