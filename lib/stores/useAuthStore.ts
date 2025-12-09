'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { XUser, AuthSession, ConnectedXAccount } from '@/lib/types/auth'

interface AuthState extends AuthSession {
  // Auth actions
  setUser: (user: XUser) => void
  clearUser: () => void
  setTokens: (accessToken: string, refreshToken: string, expiresAt: number) => void
  hydrateSession: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  hydrated: boolean
  
  // Connected X accounts for filtering
  connectedAccounts: ConnectedXAccount[]
  setConnectedAccounts: (accounts: ConnectedXAccount[]) => void
  getConnectedHandles: () => string[]
  getConnectedUserIds: () => string[]
  
  // Campaign participation
  joinedCampaigns: string[]
  joinCampaign: (campaignId: string) => void
  leaveCampaign: (campaignId: string) => void
  isInCampaign: (campaignId: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
      joinedCampaigns: [],
      connectedAccounts: [],
      loading: false,
      hydrated: false,

      // Auth actions
      setUser: (user: XUser) => set({ 
        user, 
        isAuthenticated: true,
        hydrated: true,
      }),

      clearUser: () => set({ 
        user: null, 
        isAuthenticated: false,
        accessToken: undefined,
        refreshToken: undefined,
        expiresAt: undefined,
        joinedCampaigns: [],
        connectedAccounts: [],
        hydrated: true,
      }),

      setTokens: (accessToken: string, refreshToken: string, expiresAt: number) => set({
        accessToken,
        refreshToken,
        expiresAt
      }),

      hydrateSession: async () => {
        const { hydrated, loading } = get()
        if (hydrated || loading) return

        set({ loading: true })
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            // Also fetch connected accounts from /api/user if authenticated
            try {
              const userResponse = await fetch('/api/user', { credentials: 'include' })
              if (userResponse.ok) {
                const userData = await userResponse.json()
                set({
                  user: data.user,
                  isAuthenticated: true,
                  hydrated: true,
                  loading: false,
                  connectedAccounts: userData.connectedAccounts ?? [],
                })
              } else {
                set({
                  user: data.user,
                  isAuthenticated: true,
                  hydrated: true,
                  loading: false,
                })
              }
            } catch {
              set({
                user: data.user,
                isAuthenticated: true,
                hydrated: true,
                loading: false,
              })
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              hydrated: true,
              loading: false,
              joinedCampaigns: [],
              connectedAccounts: [],
            })
          }
        } catch (error) {
          console.error('Failed to hydrate auth session', error)
          set({
            user: null,
            isAuthenticated: false,
            hydrated: true,
            loading: false,
            joinedCampaigns: [],
            connectedAccounts: [],
          })
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/x/logout', { method: 'POST' })
        } catch (error) {
          console.error('Logout failed', error)
        }
        get().clearUser()
      },

      // Campaign participation
      joinCampaign: (campaignId: string) => {
        const { joinedCampaigns } = get()
        if (!joinedCampaigns.includes(campaignId)) {
          set({ joinedCampaigns: [...joinedCampaigns, campaignId] })
        }
      },

      leaveCampaign: (campaignId: string) => {
        const { joinedCampaigns } = get()
        set({ joinedCampaigns: joinedCampaigns.filter(id => id !== campaignId) })
      },

      isInCampaign: (campaignId: string) => {
        return get().joinedCampaigns.includes(campaignId)
      },

      // Connected accounts
      setConnectedAccounts: (accounts: ConnectedXAccount[]) => set({ connectedAccounts: accounts }),
      
      getConnectedHandles: () => {
        return get().connectedAccounts.map(a => a.handle.toLowerCase())
      },
      
      getConnectedUserIds: () => {
        return get().connectedAccounts.map(a => a.xUserId)
      },
    }),
    {
      name: 'hive-auth-storage',
      partialize: (state) => ({
        joinedCampaigns: state.joinedCampaigns,
        // Don't persist tokens or user data in localStorage for security
      })
    }
  )
)
