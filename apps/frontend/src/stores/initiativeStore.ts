import { create } from 'zustand'

export interface InitiativeEntry {
  id: string
  name: string
  color: string
  initiative: number | null
  tokenId: string
}

interface InitiativeStore {
  entries: InitiativeEntry[]
  addEntry: (entry: InitiativeEntry) => void
  removeEntry: (id: string) => void
  setInitiative: (id: string, value: number | null) => void
  clearAll: () => void
}

export const useInitiativeStore = create<InitiativeStore>((set) => ({
  entries: [],

  addEntry: (entry) => set((state) => ({
    entries: state.entries.find(e => e.id === entry.id)
      ? state.entries
      : [...state.entries, entry]
  })),

  removeEntry: (id) => set((state) => ({
    entries: state.entries.filter(e => e.id !== id)
  })),

  setInitiative: (id, value) => set((state) => ({
    entries: state.entries.map(e => e.id === id ? { ...e, initiative: value } : e)
  })),

  clearAll: () => set({ entries: [] }),
}))