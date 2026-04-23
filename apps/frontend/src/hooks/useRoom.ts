import { useSocket } from './useSocket'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import { useInitiative } from './useInitiative'
import { getSocket } from './useSocket'
import type { Token } from '../stores/tokenStore'

export function useRoom(roomId: string | undefined) {
  useSocket(roomId)

  const { tokens, moveToken, addToken } = useTokenStore()
  const { players } = usePlayersStore()
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
    moveToken(id, x, y)
    getSocket().emit('token-move', { roomId, id, x, y })
  }

  const createToken = (token: Token) => {
    addToken(token)
    getSocket().emit('token-create', { roomId, token })
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
  }
}