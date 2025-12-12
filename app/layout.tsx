import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { HiveParticleField } from '@/components/hive/HiveParticleField'
import { Providers } from '@/components/providers/Providers'
import { PageTransitionWrapper } from '@/components/layout/PageTransition'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const appUrl = 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Hive AI | Solana Social Intelligence',
  description: 'An animated, living Solana social intelligence hive. Track narratives, influencers, and project sentiment in real-time.',
  keywords: ['Solana', 'Social Intelligence', 'Crypto Analytics', 'Twitter Analysis', 'Influencer Tracking'],
  openGraph: {
    title: 'Hive AI | Solana Social Intelligence',
    description: 'Track narratives, influencers, and project sentiment in real-time.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background min-h-screen w-full overflow-x-hidden`}>
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        {/* Background layers */}
        <div className="fixed inset-0 bg-background -z-50" />
        <div className="fixed inset-0 bg-hive-grid opacity-50 -z-40" />
        <div className="fixed inset-0 bg-gradient-radial from-hive-amber/5 via-transparent to-transparent -z-30" />
        
        {/* Particle field background */}
        <HiveParticleField />
        
        {/* Noise overlay */}
        <div className="fixed inset-0 noise-overlay -z-10" />
        
        {/* Main content */}
        <div className="relative z-10 flex min-h-screen flex-col w-full">
          <Navbar />
          <main 
            id="main-content"
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
          >
            <Providers>
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
            </Providers>
          </main>
        </div>
      </body>
    </html>
  )
}
