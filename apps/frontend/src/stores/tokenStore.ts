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
  tokens: [
    { id: 'token-1', x: 100, y: 100, color: '#e74c3c', name: 'Воин' },
    { id: 'token-2', x: 250, y: 150, color: '#3498db', name: 'Маг' },
  ],

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

  applyServerState: (serverState) => set((state) => {
    // Полностью заменяем список токенов на то что пришло с сервера
    const serverTokens = Object.values(serverState)
    // Сохраняем дефолтные если их ещё нет на сервере
    const defaults = state.tokens.filter(t => !serverState[t.id] && t.id.startsWith('token-'))
    return { tokens: [...defaults, ...serverTokens] }
  }),
}))