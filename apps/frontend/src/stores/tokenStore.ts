import { create } from 'zustand'

export interface Token {
  id: string
  x: number
  y: number
  color: string
  name: string
}

interface TokenStore {
  tokens: Token[]
  setTokens: (tokens: Token[]) => void
  moveToken: (id: string, x: number, y: number) => void
  applyServerState: (state: Record<string, { id: string; x: number; y: number }>) => void
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: [
    { id: 'token-1', x: 100, y: 100, color: '#e74c3c', name: 'Воин' },
    { id: 'token-2', x: 250, y: 150, color: '#3498db', name: 'Маг' },
  ],

  setTokens: (tokens) => set({ tokens }),

  moveToken: (id, x, y) => set((state) => ({
    tokens: state.tokens.map(t => t.id === id ? { ...t, x, y } : t)
  })),

  applyServerState: (serverState) => set((state) => ({
    tokens: state.tokens.map(t => {
      const saved = serverState[t.id]
      return saved ? { ...t, x: saved.x, y: saved.y } : t
    })
  })),
}))