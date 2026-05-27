import { useRoomTransport } from './useRoomTransport'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import { useInitiative } from './useInitiative'
import { useFogStore } from '../stores/fogStore'
import { getTransport } from '../services/roomService'
import type { Token } from '../stores/tokenStore'
import type { RoomPermissions } from '../stores/permissionsStore'
import type { FogShape } from '../stores/fogStore'

export function useRoom(roomId: string | undefined) {
  useRoomTransport(roomId)

  const { tokens, moveToken, addToken } = useTokenStore()
  const { players } = usePlayersStore()
  const { myRole, myId, permissions, can } = usePermissionsStore()
  const {
    connected, activeTool, activePanel, activeSection, showPlayers,
    setActiveTool, setActivePanel, setActiveSection, setShowPlayers,
  } = useRoomStore()

  const {
    entries: initiativeEntries,
    addToInitiative,
    removeFromInitiative,
    updateInitiative,
    clearInitiative,
  } = useInitiative(roomId)

  const {
    shapes: fogShapes,
    activeTool: fogActiveTool,
    previewMode,
    selectedShapeId,
    tempPoints,
    setActiveTool: setFogActiveTool,
    setPreviewMode,
    setSelectedShapeId,
    addShape,
    updateShape,
    removeShape,
    clearShapes,
    addTempPoint,
    clearTempPoints,
    setIsDrawing,
  } = useFogStore()

  const handleDragEnd = (id: string, x: number, y: number) => {
    if (!can('canMoveTokens')) return
    moveToken(id, x, y)
    getTransport().moveToken(roomId!, id, x, y)
  }

  const createToken = (token: Token) => {
    if (!can('canAddTokens')) return
    addToken(token)
    getTransport().createToken(roomId!, token)
  }

  const setPlayerPermission = (playerId: string, key: keyof RoomPermissions, value: boolean) => {
    if (myRole !== 'gm') return
    getTransport().setPermission(roomId!, playerId, key, value)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    alert('Ссылка скопирована!')
  }

  // ─── ТУМАН ВОЙНЫ ─── НОВОЕ ───────────────────────────────────────────

  const createFogShape = (shape: FogShape) => {
    if (myRole !== 'gm') return
    addShape(shape)
    getTransport().createFogShape(roomId!, shape, myId || '')
  }

  const updateFogShape = (shapeId: string, updates: Partial<FogShape>) => {
    if (myRole !== 'gm') return
    updateShape(shapeId, updates)
    getTransport().updateFogShape(roomId!, shapeId, updates)
  }

  const deleteFogShape = (shapeId: string) => {
    if (myRole !== 'gm') return
    removeShape(shapeId)
    getTransport().deleteFogShape(roomId!, shapeId)
  }

  const clearAllFog = () => {
    if (myRole !== 'gm') return
    clearShapes()
    getTransport().clearAllFog(roomId!)
  }

  return {
    tokens,
    players,
    connected,
    activeTool,
    activePanel,
    activeSection,
    showPlayers,
    setActiveTool,
    setActivePanel,
    setActiveSection,
    setShowPlayers,
    handleDragEnd,
    createToken,
    copyLink,
    initiativeEntries,
    addToInitiative,
    removeFromInitiative,
    updateInitiative,
    clearInitiative,
    myRole,
    myId,
    permissions,
    can,
    setPlayerPermission,

    // Туман войны
    fogShapes,
    fogActiveTool,
    previewMode,
    selectedShapeId,
    tempPoints,
    setFogActiveTool,
    setPreviewMode,
    setSelectedShapeId,
    createFogShape,
    updateFogShape,
    deleteFogShape,
    clearAllFog,
    addTempPoint,
    clearTempPoints,
    setIsDrawing,
  }
}