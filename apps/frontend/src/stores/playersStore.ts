import { create } from 'zustand'

export interface Player {
  id: string
  username: string
  color: string
  isGM: boolean
  connected: boolean
}

interface PlayersStore {
  players: Player[]
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, data: Partial<Player>) => void
}

export const usePlayersStore = create<PlayersStore>((set) => ({
  players: [],

  setPlayers: (players) => set({ players }),

  addPlayer: (player) => set((state) => ({
    players: state.players.find(p => p.id === player.id)
      ? state.players
      : [...state.players, player]
  })),

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id)
  })),

  updatePlayer: (id, data) => set((state) => ({
    players: state.players.map(p => p.id === id ? { ...p, ...data } : p)
  })),
}))