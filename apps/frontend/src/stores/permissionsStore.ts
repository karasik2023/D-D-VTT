import { create } from 'zustand'

export type Role = 'gm' | 'player'

export interface RoomPermissions {
  canMoveTokens: boolean
  canAddTokens: boolean
  canDeleteTokens: boolean
  canDrawFog: boolean
  canSeeThroghFog: boolean
  canUploadAssets: boolean
  canManageInitiative: boolean
}

const GM_PERMISSIONS: RoomPermissions = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: true,
  canDrawFog: true,
  canSeeThroghFog: true,
  canUploadAssets: true,
  canManageInitiative: true,
}

const PLAYER_PERMISSIONS: RoomPermissions = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: false,
  canDrawFog: false,
  canSeeThroghFog: false,
  canUploadAssets: true,
  canManageInitiative: false,
}

export const DEFAULT_PERMISSIONS: Record<Role, RoomPermissions> = {
  gm: GM_PERMISSIONS,
  player: PLAYER_PERMISSIONS,
}

interface PermissionsStore {
  myRole: Role | null
  myId: string | null
  permissions: RoomPermissions

  setMyRole: (role: Role) => void
  setMyId: (id: string) => void
  setPermission: (key: keyof RoomPermissions, value: boolean) => void
  setAllPermissions: (perms: RoomPermissions) => void
  resetPermissions: () => void
  can: (action: keyof RoomPermissions) => boolean
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  myRole: null,
  myId: null,
  permissions: PLAYER_PERMISSIONS,

  setMyRole: (role) => set({
    myRole: role,
    permissions: { ...DEFAULT_PERMISSIONS[role] },
  }),

  setMyId: (myId) => set({ myId }),

  setPermission: (key, value) => set((state) => ({
    permissions: { ...state.permissions, [key]: value }
  })),

  setAllPermissions: (permissions) => set({ permissions }),

  resetPermissions: () => set((state) => ({
    permissions: state.myRole ? { ...DEFAULT_PERMISSIONS[state.myRole] } : PLAYER_PERMISSIONS
  })),

  can: (action) => get().permissions[action],
}))