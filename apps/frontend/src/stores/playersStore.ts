import { create } from 'zustand'
import type { RoomPermissions } from './permissionsStore'

export interface Player {
  id: string
  username: string
  color: string
  isGM: boolean
  connected: boolean
  permissions?: RoomPermissions
}

interface PlayersStore {
  players: Player[]
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  updatePlayerPermission: (id: string, key: keyof RoomPermissions, value: boolean) => void
}

export const usePlayersStore = create<PlayersStore>((set) => ({
  players: [],

  setPlayers: (players) => set({
    players: players.filter((p, index, self) =>
      index === self.findIndex(t => t.id === p.id)
    )
  }),

  addPlayer: (player) => set((state) => ({
    players: state.players.find(p => p.id === player.id)
      ? state.players.map(p => p.id === player.id ? { ...p, ...player } : p)
      : [...state.players, player]
  })),

  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id)
  })),

  updatePlayer: (id, updates) => set(state => ({
    players: state.players.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
  })),

  updatePlayerPermission: (id, key, value) => set((state) => ({
    players: state.players.map(p => p.id === id ? {
      ...p,
      permissions: { ...(p.permissions || {} as RoomPermissions), [key]: value }
    } : p)
  })),
}))