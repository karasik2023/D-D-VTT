import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import type { Player } from '../stores/playersStore'
import type { Token } from '../stores/tokenStore'
import type { RoomPermissions } from '../stores/permissionsStore'

const SOCKET_URL = 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true })
  }
  return socket
}

export function useSocket(roomId: string | undefined) {
  const { moveToken, applyServerState } = useTokenStore()
  const { setConnected } = useRoomStore()
  const { setPlayers } = usePlayersStore()
  const { setMyRole, setMyId, setAllPermissions, setPermission } = usePermissionsStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!roomId || initialized.current) return
    initialized.current = true

    const s = getSocket()

    const userId = localStorage.getItem('userId')
    const username = localStorage.getItem('username')

    if (userId) setMyId(userId)

    setPlayers([])

    const joinRoom = () => {
      s.emit('join-room', { roomId, userId, username })
    }

    const applyMyPermissions = (players: Player[]) => {
      if (!userId) return
      const me = players.find(p => p.id === userId)
      if (me) {
        setMyRole(me.isGM ? 'gm' : 'player')
        if ((me as any).permissions) {
          setAllPermissions((me as any).permissions as RoomPermissions)
        }
      }
    }

    s.on('connect', () => {
      setConnected(true)
      joinRoom()
    })

    s.on('disconnect', () => {
      setConnected(false)
    })

    s.on('connect_error', (err) => {
      console.log('❌ Socket connect error:', err.message)
    })

    s.on('token-move', (data: { id: string; x: number; y: number }) => {
      moveToken(data.id, data.x, data.y)
    })

    s.on('token-create', (token: Token) => {
      const { tokens } = useTokenStore.getState()
      if (!tokens.find(t => t.id === token.id)) {
        useTokenStore.setState({ tokens: [...tokens, token] })
      }
    })

    s.on('room-state', (state: { tokens: Record<string, Token> }) => {
      applyServerState(state.tokens)
    })

    // Единственный обработчик списка игроков — room-players
    // Сервер теперь всегда шлёт полный список при любом изменении
    s.on('room-players', (players: Player[]) => {
      setPlayers(players)
      applyMyPermissions(players)
    })

    s.on('permission-updated', (data: { playerId: string; key: string; value: boolean }) => {
      if (data.playerId === userId) {
        setPermission(data.key as keyof RoomPermissions, data.value)
      }
      const { updatePlayerPermission } = usePlayersStore.getState()
      updatePlayerPermission(data.playerId, data.key as keyof RoomPermissions, data.value)
    })

    if (s.connected) {
      setConnected(true)
      joinRoom()
    } else {
      s.connect()
    }

    return () => {
      s.off('connect')
      s.off('disconnect')
      s.off('connect_error')
      s.off('token-move')
      s.off('token-create')
      s.off('room-state')
      s.off('room-players')
      s.off('permission-updated')
      initialized.current = false
    }
  }, [roomId])
}