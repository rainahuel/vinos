'use client'
import { create } from 'zustand'

interface UIState {
  fullscreen: boolean
  setFullscreen: (v: boolean) => void
  toggleFullscreen: () => void
}

export const useUI = create<UIState>((set, get) => ({
  fullscreen: false,
  setFullscreen: (v) => set({ fullscreen: v }),
  toggleFullscreen: () => set({ fullscreen: !get().fullscreen }),
}))
