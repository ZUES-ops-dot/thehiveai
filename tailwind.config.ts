import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hive Core Colors
        hive: {
          amber: '#F59E0B',
          'amber-bright': '#FBBF24',
          'amber-glow': '#FCD34D',
          cyan: '#06B6D4',
          'cyan-bright': '#22D3EE',
          'cyan-glow': '#67E8F9',
          purple: '#8B5CF6',
          'purple-glow': '#A78BFA',
        },
        // Dark Background
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Glow effects
        glow: {
          amber: 'rgba(245, 158, 11, 0.5)',
          cyan: 'rgba(6, 182, 212, 0.5)',
          purple: 'rgba(139, 92, 246, 0.5)',
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(to right, rgba(245, 158, 11, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(245, 158, 11, 0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hive-gradient': 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.5)',
        'glow-amber-lg': '0 0 40px rgba(245, 158, 11, 0.6)',
        'glow-amber-sm': '0 0 10px rgba(245, 158, 11, 0.4)',
        'glow-amber-soft': '0 6px 30px rgba(245, 158, 11, 0.14), inset 0 0 10px rgba(245, 158, 11, 0.06)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
        'glow-cyan-lg': '0 0 40px rgba(6, 182, 212, 0.6)',
        'glow-cyan-sm': '0 0 10px rgba(6, 182, 212, 0.4)',
        'glow-cyan-soft': '0 6px 30px rgba(6, 182, 212, 0.14), inset 0 0 10px rgba(6, 182, 212, 0.06)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-purple-sm': '0 0 10px rgba(139, 92, 246, 0.4)',
        'glow-purple-soft': '0 6px 30px rgba(139, 92, 246, 0.14), inset 0 0 10px rgba(139, 92, 246, 0.06)',
        'inner-glow': 'inset 0 0 20px rgba(245, 158, 11, 0.2)',
        'inner-glow-cyan': 'inset 0 0 20px rgba(6, 182, 212, 0.2)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
      },
      // Transitions
      transitionTimingFunction: {
        'hive': 'cubic-bezier(0.22, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      dropShadow: {
        'amber-glow': '0 0 10px rgba(245, 158, 11, 0.5)',
        'amber-glow-lg': '0 0 20px rgba(245, 158, 11, 0.6)',
        'cyan-glow': '0 0 10px rgba(6, 182, 212, 0.5)',
        'cyan-glow-lg': '0 0 20px rgba(6, 182, 212, 0.6)',
        'purple-glow': '0 0 10px rgba(139, 92, 246, 0.5)',
        'green-glow': '0 0 10px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'orbit': 'orbit 15s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'glow-line': 'glowLine 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowLine: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
