export const JWT_SECRET = 'dnd-vtt-secret-key'

export const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

export const DEFAULT_PLAYER_PERMISSIONS: Record<string, boolean> = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: false,
  canDrawFog: false,
  canSeeThroghFog: false,
  canUploadAssets: true,
  canManageInitiative: false,
}

export const GM_PERMISSIONS: Record<string, boolean> = {
  canMoveTokens: true,
  canAddTokens: true,
  canDeleteTokens: true,
  canDrawFog: true,
  canSeeThroghFog: true,
  canUploadAssets: true,
  canManageInitiative: true,
}