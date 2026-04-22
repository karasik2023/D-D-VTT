import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import type { Player } from '../stores/playersStore'

const SOCKET_URL = 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL)
  }
  return socket
}

export function useSocket(roomId: string | undefined) {
  const { moveToken, applyServerState } = useTokenStore()
  const { setConnected } = useRoomStore()
  const { setPlayers, addPlayer, removePlayer } = usePlayersStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!roomId || initialized.current) return
    initialized.current = true

    const s = getSocket()

    const userId = localStorage.getItem('userId')
    const username = localStorage.getItem('username')

    s.on('connect', () => {
      setConnected(true)
      s.emit('join-room', { roomId, userId, username })
    })

    s.on('token-move', (data: { id: string; x: number; y: number }) => {
      moveToken(data.id, data.x, data.y)
    })

    s.on('room-state', (state: { tokens: Record<string, { id: string; x: number; y: number }> }) => {
      applyServerState(state.tokens)
    })

    s.on('room-players', (players: Player[]) => {
      setPlayers(players)
    })

    s.on('player-joined', (player: Player) => {
      addPlayer(player)
    })

    s.on('player-left', (id: string) => {
      removePlayer(id)
    })

    if (s.connected) {
      setConnected(true)
      s.emit('join-room', { roomId, userId, username })
    }

    return () => {
      s.off('connect')
      s.off('token-move')
      s.off('room-state')
      s.off('room-players')
      s.off('player-joined')
      s.off('player-left')
      initialized.current = false
    }
  }, [roomId])
}