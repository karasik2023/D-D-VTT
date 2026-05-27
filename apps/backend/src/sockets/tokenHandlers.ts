// backend/src/sockets/tokenHandlers.ts
import { Server, Socket } from 'socket.io'
import { getOrCreateRoom } from './roomState'
import { prisma } from '../config/prisma'

export function registerTokenHandlers(io: Server, socket: Socket) {
  socket.on('token-create', async (data: { roomId: string; token: any }) => {
    console.log('=== SERVER received token-create ===', { frontId: data.token.id })
    try {
      const { roomId: roomCode, token } = data

      const room = await prisma.room.findUnique({
        where: { code: roomCode },
      })

      if (!room) {
        socket.emit('token-error', { message: 'Room not found' })
        return
      }

      // Используем id от фронта чтобы не было рассинхронизации
      const dbToken = await prisma.token.create({
        data: {
          id: token.id, // ← фронтовый id
          roomId: room.id,
          x: token.x,
          y: token.y,
          color: token.color,
          name: token.name,
          imageUrl: token.imageUrl || null,
          layer: token.layer || 'tokens',
          scale: token.scale || 1,
          rotation: token.rotation || 0,
        },
      })
      

      const roomState = getOrCreateRoom(roomCode)
      roomState.tokens[dbToken.id] = { ...dbToken, id: dbToken.id }

      // Не шлём отправителю — он уже добавил оптимистично
      console.log('=== SERVER created dbToken ===', { dbId: dbToken.id, frontId: data.token.id, same: dbToken.id === data.token.id })
      console.log('=== SERVER emitting to room ===', roomCode)
      socket.to(roomCode).emit('token-create', roomState.tokens[dbToken.id])
      console.log('=== SERVER emitted (socket.to, not io.to) ===')
    } catch (err) {
      console.error('token-create error:', err)
      socket.emit('token-error', { message: 'Failed to create token' })
    }
  })

  socket.on('token-move', async (data: { roomId: string; id: string; x: number; y: number }) => {
    try {
      const { roomId: roomCode, id, x, y } = data

      await prisma.token.update({
        where: { id },
        data: { x, y },
      })

      const roomState = getOrCreateRoom(roomCode)
      if (roomState.tokens[id]) {
        roomState.tokens[id] = { ...roomState.tokens[id], x, y }
      }

      socket.to(roomCode).emit('token-move', { id, x, y })
    } catch (err) {
      console.error('token-move error:', err)
    }
  })

  socket.on('token-delete', async (data: { roomId: string; tokenId: string }) => {
    try {
      const { roomId: roomCode, tokenId } = data

      await prisma.token.delete({
        where: { id: tokenId },
      })

      const roomState = getOrCreateRoom(roomCode)
      delete roomState.tokens[tokenId]

      io.to(roomCode).emit('token-delete', { tokenId })
    } catch (err) {
      console.error('token-delete error:', err)
      socket.emit('token-error', { message: 'Failed to delete token' })
    }
  })
}