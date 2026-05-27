import { Server, Socket } from 'socket.io'
import { prisma } from '../config/prisma'
import { COLORS, DEFAULT_PLAYER_PERMISSIONS, GM_PERMISSIONS } from '../config/constants'
import { getOrCreateRoom, loadRoomFromDB, RoomPlayer } from './roomState'

export function registerPlayerHandlers(io: Server, socket: Socket) {
  socket.on('join-room', async (data: string | { roomId: string; userId?: string; username?: string }) => {
    console.log('=== join-room received ===')
    console.log('data:', data)
    const roomId = typeof data === 'string' ? data : data.roomId
    const userId = typeof data === 'object' ? data.userId : undefined
    const username = typeof data === 'object' ? data.username : undefined

    socket.join(roomId)

    // Загружаем состояние из БД
    await loadRoomFromDB(roomId)

    const room = getOrCreateRoom(roomId)

    console.log('[join-room] loaded tokens:', Object.keys(room.tokens).length)
    console.log('[join-room] loaded fog shapes:', Object.keys(room.fogShapes).length)

    const existingPlayer = userId ? room.players[userId] : null

    if (existingPlayer) {
      existingPlayer.connected = true
      existingPlayer.socketId = socket.id
      if (username) existingPlayer.username = username

      // Отправляем состояние подключившемуся
      socket.emit('room-state', {
        tokens: room.tokens,
        fogShapes: room.fogShapes,
      })
      socket.emit('room-players', Object.values(room.players))
      socket.emit('initiative-state', Object.values(room.initiative))

      // Обновляем список у всех остальных
      socket.to(roomId).emit('room-players', Object.values(room.players))
    } else {
      const usedColors = Object.values(room.players).map((p: RoomPlayer) => p.color)
      const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[0]
      const isGM = Object.keys(room.players).length === 0

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

      // Отправляем состояние новому игроку
      socket.emit('room-state', {
        tokens: room.tokens,
        fogShapes: room.fogShapes,
      })
      socket.emit('room-players', Object.values(room.players))
      socket.emit('initiative-state', Object.values(room.initiative))

      // Обновляем список у всех остальных
      socket.to(roomId).emit('room-players', Object.values(room.players))
    }

    socket.data.roomId = roomId
    socket.data.playerId = userId || socket.id

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
        io.to(roomId).emit('room-players', Object.values(room.players))
      }
    }
    console.log('Player disconnected:', socket.id)
  })
}