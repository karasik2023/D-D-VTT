import { create } from 'zustand'

// Синхронизировано с backend/src/config/constants.ts
export interface RoomPermissions {
  canMoveTokens: boolean
  canAddTokens: boolean
  canDeleteTokens: boolean
  canDrawFog: boolean
  canSeeThroughFog: boolean
  canUploadAssets: boolean
  canManageInitiative: boolean
}

const DEFAULT_PERMISSIONS: RoomPermissions = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: false,
  canDrawFog: false,
  canSeeThroughFog: false,
  canUploadAssets: true,
  canManageInitiative: false,
}

const GM_PERMISSIONS: RoomPermissions = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: true,
  canDrawFog: true,
  canSeeThroughFog: true,
  canUploadAssets: true,
  canManageInitiative: true,
}

interface PermissionsStore {
  myRole: 'gm' | 'player' | null
  myId: string | null
  permissions: RoomPermissions

  setMyRole: (role: 'gm' | 'player' | null) => void
  setMyId: (id: string | null) => void
  setAllPermissions: (perms: RoomPermissions) => void
  setPermission: (key: keyof RoomPermissions, value: boolean) => void
  can: (key: keyof RoomPermissions) => boolean
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  myRole: null,
  myId: null,
  permissions: DEFAULT_PERMISSIONS,

  setMyRole: (role) => set({
    myRole: role,
    permissions: role === 'gm' ? GM_PERMISSIONS : DEFAULT_PERMISSIONS,
  }),

  setMyId: (id) => set({ myId: id }),

  setAllPermissions: (perms) => set({ permissions: perms }),

  setPermission: (key, value) => set((state) => ({
    permissions: { ...state.permissions, [key]: value },
  })),

  can: (key) => {
    const { myRole, permissions } = get()
    if (myRole === 'gm') return true
    return permissions[key] ?? false
  },
}))