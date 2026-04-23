import { create } from 'zustand'
import type { Asset } from '../services/assetsApi'

interface AssetsStore {
  tokens: Asset[]
  loading: boolean
  error: string | null

  setTokens: (tokens: Asset[]) => void
  addToken: (token: Asset) => void
  removeToken: (id: string) => void
  setLoading: (v: boolean) => void
  setError: (err: string | null) => void
}

export const useAssetsStore = create<AssetsStore>((set) => ({
  tokens: [],
  loading: false,
  error: null,

  setTokens: (tokens) => set({ tokens }),

  addToken: (token) => set((state) => ({
    tokens: [token, ...state.tokens],
  })),

  removeToken: (id) => set((state) => ({
    tokens: state.tokens.filter(t => t.id !== id),
  })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))