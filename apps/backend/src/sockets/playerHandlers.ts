import { Server, Socket } from 'socket.io'
import { prisma } from '../config/prisma'
import { COLORS, DEFAULT_PLAYER_PERMISSIONS, GM_PERMISSIONS } from '../config/constants'
import { getOrCreateRoom, RoomPlayer } from './roomState'

export function registerPlayerHandlers(io: Server, socket: Socket) {
  socket.on('join-room', async (data: string | { roomId: string; userId?: string; username?: string }) => {
    const roomId = typeof data === 'string' ? data : data.roomId
    const userId = typeof data === 'object' ? data.userId : undefined
    const username = typeof data === 'object' ? data.username : undefined

    socket.join(roomId)
    const room = getOrCreateRoom(roomId)

    const isGM = Object.keys(room.players).length === 0
    const usedColors = Object.values(room.players).map(p => p.color)
    const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[0]

    const player: RoomPlayer = {
      id: userId || socket.id,
      username: username || 'Игрок',
      color,
      isGM,
      connected: true,
      socketId: socket.id,
      permissions: isGM ? { ...GM_PERMISSIONS } : { ...DEFAULT_PLAYER_PERMISSIONS },
    }
    room.players[player.id] = player

    socket.data.roomId = roomId
    socket.data.playerId = player.id

    socket.emit('room-state', { tokens: room.tokens })
    socket.emit('room-players', Object.values(room.players))
    socket.emit('initiative-state', Object.values(room.initiative))
    socket.to(roomId).emit('player-joined', player)

    if (userId) {
      try {
        await prisma.roomMember.upsert({
          where: { roomCode_userId: { roomCode: roomId, userId } },
          update: { joinedAt: new Date() },
          create: { roomCode: roomId, userId },
        })
      } catch {}
    }
  })

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    const playerId = socket.data.playerId
    if (roomId && playerId) {
      const room = getOrCreateRoom(roomId)
      if (room.players[playerId]) {
        room.players[playerId].connected = false
        socket.to(roomId).emit('player-left', playerId)
      }
    }
  })
}