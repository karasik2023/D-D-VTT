import { create } from 'zustand'

export interface Token {
  id: string
  x: number
  y: number
  color: string
  name: string
  imageUrl?: string  // URL картинки из библиотеки (опционально)
}

interface TokenStore {
  tokens: Token[]
  setTokens: (tokens: Token[]) => void
  addToken: (token: Token) => void
  moveToken: (id: string, x: number, y: number) => void
  removeToken: (id: string) => void
  applyServerState: (state: Record<string, Token>) => void
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: [], // ← убрали дефолтные токены, теперь загружаем с сервера

  setTokens: (tokens) => set({ tokens }),

  addToken: (token) => set((state) => ({
    tokens: state.tokens.find(t => t.id === token.id) ? state.tokens : [...state.tokens, token]
  })),

  moveToken: (id, x, y) => set((state) => ({
    tokens: state.tokens.map(t => t.id === id ? { ...t, x, y } : t)
  })),

  removeToken: (id) => set((state) => ({
    tokens: state.tokens.filter(t => t.id !== id)
  })),

  applyServerState: (serverState) => set(() => {
    const serverTokens = Object.values(serverState)
    return { tokens: serverTokens }
  }),
}))