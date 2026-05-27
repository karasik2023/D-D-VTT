import { useRoomTransport } from './useRoomTransport'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import { useInitiative } from './useInitiative'
import { getTransport } from '../services/roomService'
import type { Token } from '../stores/tokenStore'
import type { RoomPermissions } from '../stores/permissionsStore'

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

  const handleDragEnd = (id: string, x: number, y: number) => {
    if (!can('canMoveTokens')) return
    moveToken(id, x, y)
    getTransport().moveToken(roomId!, id, x, y)
  }

  const createToken = (token: Token) => {
    console.log('=== FRONT createToken ===', { id: token.id, name: token.name })
    if (!can('canAddTokens')) return
    addToken(token)
    console.log('=== FRONT added optimistically, tokens now:', useTokenStore.getState().tokens.length)
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
  }
}