import { create } from 'zustand'

interface RoomStore {
  roomId: string | null
  connected: boolean
  activeTool: string
  activePanel: string | null
  activeSection: string | null
  showPlayers: boolean

  setRoomId: (id: string) => void
  setConnected: (v: boolean) => void
  setActiveTool: (tool: string) => void
  setActivePanel: (panel: string | null) => void
  setActiveSection: (section: string | null) => void
  setShowPlayers: (v: boolean) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  connected: false,
  activeTool: 'select',
  activePanel: null,
  activeSection: null,
  showPlayers: false,

  setRoomId: (roomId) => set({ roomId }),
  setConnected: (connected) => set({ connected }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setShowPlayers: (showPlayers) => set({ showPlayers }),
}))