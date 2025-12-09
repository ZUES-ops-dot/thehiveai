import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
interface Node {
  id: string
  label: string
  value: number
  group: string
  x?: number
  y?: number
}

interface HiveState {
  // Selection State
  selectedNode: Node | null
  hoveredNode: Node | null
  hoveredNarrative: string | null
  hoveredInfluencer: string | null
  hoveredProject: string | null
  
  // Connected Elements (for cross-component highlighting)
  connectedNodes: string[]
  highlightedCards: string[]
  
  // View State
  zoomLevel: number
  panPosition: { x: number; y: number }
  activeView: 'graph' | 'list' | 'grid'
  
  // Animation Settings
  animationIntensity: 'low' | 'medium' | 'high'
  particlesEnabled: boolean
  glowEnabled: boolean
  reducedMotion: boolean
  
  // Filters
  activeFilters: {
    categories: string[]
    timeframe: '1h' | '24h' | '7d' | '30d' | 'all'
    minEngagement: number
    sentiment: 'all' | 'bullish' | 'bearish' | 'neutral'
  }
  
  // UI State
  sidebarOpen: boolean
  searchQuery: string
  
  // Actions
  setSelectedNode: (node: Node | null) => void
  setHoveredNode: (node: Node | null) => void
  setHoveredNarrative: (id: string | null) => void
  setHoveredInfluencer: (id: string | null) => void
  setHoveredProject: (id: string | null) => void
  setConnectedNodes: (ids: string[]) => void
  setHighlightedCards: (ids: string[]) => void
  setZoomLevel: (level: number) => void
  setPanPosition: (pos: { x: number; y: number }) => void
  setActiveView: (view: 'graph' | 'list' | 'grid') => void
  setAnimationIntensity: (intensity: 'low' | 'medium' | 'high') => void
  setParticlesEnabled: (enabled: boolean) => void
  setGlowEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  setFilters: (filters: Partial<HiveState['activeFilters']>) => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  
  // Complex Actions
  selectNodeAndHighlight: (node: Node, connectedIds: string[]) => void
  clearSelection: () => void
  resetFilters: () => void
}

const defaultFilters = {
  categories: [],
  timeframe: '24h' as const,
  minEngagement: 0,
  sentiment: 'all' as const,
}

export const useHiveStore = create<HiveState>()(
  persist(
    (set, get) => ({
      // Initial State
      selectedNode: null,
      hoveredNode: null,
      hoveredNarrative: null,
      hoveredInfluencer: null,
      hoveredProject: null,
      connectedNodes: [],
      highlightedCards: [],
      zoomLevel: 1,
      panPosition: { x: 0, y: 0 },
      activeView: 'graph',
      animationIntensity: 'high',
      particlesEnabled: true,
      glowEnabled: true,
      reducedMotion: false,
      activeFilters: defaultFilters,
      sidebarOpen: false,
      searchQuery: '',

      // Simple Setters
      setSelectedNode: (node) => set({ selectedNode: node }),
      setHoveredNode: (node) => set({ hoveredNode: node }),
      setHoveredNarrative: (id) => set({ hoveredNarrative: id }),
      setHoveredInfluencer: (id) => set({ hoveredInfluencer: id }),
      setHoveredProject: (id) => set({ hoveredProject: id }),
      setConnectedNodes: (ids) => set({ connectedNodes: ids }),
      setHighlightedCards: (ids) => set({ highlightedCards: ids }),
      setZoomLevel: (level) => set({ zoomLevel: Math.max(0.1, Math.min(3, level)) }),
      setPanPosition: (pos) => set({ panPosition: pos }),
      setActiveView: (view) => set({ activeView: view }),
      setAnimationIntensity: (intensity) => set({ animationIntensity: intensity }),
      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
      setGlowEnabled: (enabled) => set({ glowEnabled: enabled }),
      setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
      setFilters: (filters) => set((state) => ({ 
        activeFilters: { ...state.activeFilters, ...filters } 
      })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Complex Actions
      selectNodeAndHighlight: (node, connectedIds) => set({
        selectedNode: node,
        connectedNodes: connectedIds,
        highlightedCards: connectedIds,
      }),
      
      clearSelection: () => set({
        selectedNode: null,
        hoveredNode: null,
        connectedNodes: [],
        highlightedCards: [],
      }),
      
      resetFilters: () => set({
        activeFilters: defaultFilters,
        searchQuery: '',
      }),
    }),
    {
      name: 'hive-storage',
      partialize: (state) => ({
        animationIntensity: state.animationIntensity,
        particlesEnabled: state.particlesEnabled,
        glowEnabled: state.glowEnabled,
        reducedMotion: state.reducedMotion,
        activeView: state.activeView,
      }),
    }
  )
)

// Selectors for performance optimization
export const useSelectedNode = () => useHiveStore((s) => s.selectedNode)
export const useHoveredNode = () => useHiveStore((s) => s.hoveredNode)
export const useConnectedNodes = () => useHiveStore((s) => s.connectedNodes)
export const useHighlightedCards = () => useHiveStore((s) => s.highlightedCards)
export const useAnimationSettings = () => useHiveStore((s) => ({
  intensity: s.animationIntensity,
  particles: s.particlesEnabled,
  glow: s.glowEnabled,
  reducedMotion: s.reducedMotion,
}))
