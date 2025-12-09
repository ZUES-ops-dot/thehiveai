'use client'

import { create } from 'zustand'

interface MissionStore {
  claimableMissions: number
  setClaimableMissions: (count: number) => void
}

export const useMissionStore = create<MissionStore>((set) => ({
  claimableMissions: 0,
  setClaimableMissions: (count) => set({ claimableMissions: count }),
}))
