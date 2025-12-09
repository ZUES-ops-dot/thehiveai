'use client'

import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function ModdioLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Moddio logo"
      className={cn('text-white', className)}
      {...props}
    >
      <title>Moddio</title>
      <path
        fill="#ff1d1d"
        d="M50 6a6 6 0 0 1 6 6l-.1 3.4a3 3 0 0 0 1.4 2.6l3 1.9a6 6 0 0 1 0 10.2l-3 1.8a3 3 0 0 0-1.4 2.6L56 38a6 6 0 0 1-6 6l-2.8-.1a3 3 0 0 0-2.5 1.5l-1.7 3a6 6 0 0 1-10.2 0l-1.8-3a3 3 0 0 0-2.5-1.4H26a6 6 0 0 1-6-6l.1-2.8a3 3 0 0 0-1.5-2.5l-3-1.7a6 6 0 0 1 0-10.2l3-1.8a3 3 0 0 0 1.4-2.5L20 12a6 6 0 0 1 6-6l2.8.1a3 3 0 0 0 2.5-1.4l1.8-3a6 6 0 0 1 10.2 0l1.7 3a3 3 0 0 0 2.5 1.3Z"
      />
      <circle cx="32" cy="32" r="16" fill="#000" />
      <circle cx="32" cy="32" r="10" fill="#fff" />
      <circle cx="32" cy="32" r="6" fill="#000" />
      <path
        fill="#fff"
        d="M15 44a4 4 0 0 1 3.9 4.7l-.5 2.8a4 4 0 0 0 3.2 4.6l2.8.5a4 4 0 0 1 2.3 6.3L25 62.4a4 4 0 0 1-6.3 0l-3.7-4.7a4 4 0 0 1-.8-3l.6-3.6A4 4 0 0 0 10 48h-2a4 4 0 0 1 0-8h7Z"
      />
    </svg>
  )
}
