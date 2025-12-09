// ============================================
// THEME VARIANTS
// Hive Prime, Shadow, and Lumina themes
// ============================================

export interface HiveTheme {
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    glow: {
      primary: string
      secondary: string
    }
    background: {
      base: string
      card: string
      elevated: string
    }
    text: {
      primary: string
      secondary: string
      muted: string
    }
  }
  effects: {
    glowIntensity: number
    particleColor: string
    gridColor: string
  }
}

export const hiveThemes: Record<string, HiveTheme> = {
  prime: {
    name: 'Hive Prime',
    description: 'The original amber & cyan hive aesthetic',
    colors: {
      primary: '#F59E0B',        // Solar Amber
      secondary: '#06B6D4',      // Cyan
      accent: '#8B5CF6',         // Purple
      glow: {
        primary: 'rgba(245, 158, 11, 0.5)',
        secondary: 'rgba(6, 182, 212, 0.5)',
      },
      background: {
        base: '#0A0A0F',
        card: '#15151F',
        elevated: '#1A1A24',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#9CA3AF',
        muted: '#6B7280',
      },
    },
    effects: {
      glowIntensity: 1.0,
      particleColor: '#F59E0B',
      gridColor: 'rgba(245, 158, 11, 0.03)',
    },
  },

  shadow: {
    name: 'Hive Shadow',
    description: 'Dark purple & magenta for night mode',
    colors: {
      primary: '#A855F7',        // Purple
      secondary: '#EC4899',      // Pink/Magenta
      accent: '#06B6D4',         // Cyan
      glow: {
        primary: 'rgba(168, 85, 247, 0.5)',
        secondary: 'rgba(236, 72, 153, 0.5)',
      },
      background: {
        base: '#0D0A14',
        card: '#1A1425',
        elevated: '#231C30',
      },
      text: {
        primary: '#F5F3FF',
        secondary: '#A78BFA',
        muted: '#7C3AED',
      },
    },
    effects: {
      glowIntensity: 0.8,
      particleColor: '#A855F7',
      gridColor: 'rgba(168, 85, 247, 0.03)',
    },
  },

  lumina: {
    name: 'Hive Lumina',
    description: 'Bright white & gold for clarity mode',
    colors: {
      primary: '#EAB308',        // Gold
      secondary: '#FFFFFF',      // White
      accent: '#3B82F6',         // Blue
      glow: {
        primary: 'rgba(234, 179, 8, 0.5)',
        secondary: 'rgba(255, 255, 255, 0.3)',
      },
      background: {
        base: '#0F0F12',
        card: '#18181B',
        elevated: '#27272A',
      },
      text: {
        primary: '#FAFAFA',
        secondary: '#D4D4D8',
        muted: '#71717A',
      },
    },
    effects: {
      glowIntensity: 1.2,
      particleColor: '#EAB308',
      gridColor: 'rgba(234, 179, 8, 0.04)',
    },
  },

  matrix: {
    name: 'Hive Matrix',
    description: 'Classic green terminal aesthetic',
    colors: {
      primary: '#22C55E',        // Green
      secondary: '#10B981',      // Emerald
      accent: '#06B6D4',         // Cyan
      glow: {
        primary: 'rgba(34, 197, 94, 0.5)',
        secondary: 'rgba(16, 185, 129, 0.5)',
      },
      background: {
        base: '#050A05',
        card: '#0A150A',
        elevated: '#0F1F0F',
      },
      text: {
        primary: '#22C55E',
        secondary: '#16A34A',
        muted: '#15803D',
      },
    },
    effects: {
      glowIntensity: 0.9,
      particleColor: '#22C55E',
      gridColor: 'rgba(34, 197, 94, 0.04)',
    },
  },
}

// CSS variable generator for themes
export function generateThemeCSSVariables(theme: HiveTheme): Record<string, string> {
  return {
    '--hive-primary': theme.colors.primary,
    '--hive-secondary': theme.colors.secondary,
    '--hive-accent': theme.colors.accent,
    '--hive-glow-primary': theme.colors.glow.primary,
    '--hive-glow-secondary': theme.colors.glow.secondary,
    '--hive-bg-base': theme.colors.background.base,
    '--hive-bg-card': theme.colors.background.card,
    '--hive-bg-elevated': theme.colors.background.elevated,
    '--hive-text-primary': theme.colors.text.primary,
    '--hive-text-secondary': theme.colors.text.secondary,
    '--hive-text-muted': theme.colors.text.muted,
    '--hive-glow-intensity': theme.effects.glowIntensity.toString(),
    '--hive-particle-color': theme.effects.particleColor,
    '--hive-grid-color': theme.effects.gridColor,
  }
}

// Apply theme to document
export function applyTheme(themeName: keyof typeof hiveThemes): void {
  const theme = hiveThemes[themeName]
  if (!theme) return

  const variables = generateThemeCSSVariables(theme)
  const root = document.documentElement

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
