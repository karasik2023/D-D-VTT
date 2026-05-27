import { Server, Socket } from 'socket.io'
import { getOrCreateRoom } from './roomState'
import { prisma } from '../config/prisma'

// Prisma 7 + adapter-pg может не видеть модель после generate
const p = prisma as any

export function registerFogHandlers(io: Server, socket: Socket) {
  // Создание фигуры тумана
  socket.on('fog-shape-create', async (data: {
    roomId: string
    shape: { id: string; type: string; points: any; isRevealed?: boolean; isVisible?: boolean }
    createdBy: string
  }) => {
    try {
      const { roomId: roomCode, shape, createdBy } = data

      const room = await prisma.room.findUnique({
        where: { code: roomCode },
      })

      if (!room) {
        socket.emit('fog-error', { message: 'Room not found' })
        return
      }

      const dbShape = await p.fogShape.create({
        data: {
          id: shape.id,
          roomId: room.id,
          type: shape.type,
          points: shape.points,
          isRevealed: shape.isRevealed ?? false,
          isVisible: shape.isVisible ?? true,
          createdBy,
        },
      })

      const roomState = getOrCreateRoom(roomCode)
      roomState.fogShapes[dbShape.id] = {
        id: dbShape.id,
        type: dbShape.type,
        points: dbShape.points,
        isRevealed: dbShape.isRevealed,
        isVisible: dbShape.isVisible,
        createdBy: dbShape.createdBy,
      }

      io.to(roomCode).emit('fog-shape-create', roomState.fogShapes[dbShape.id])
    } catch (err) {
      console.error('fog-shape-create error:', err)
      socket.emit('fog-error', { message: 'Failed to create fog shape' })
    }
  })

  // Обновление фигуры тумана
  socket.on('fog-shape-update', async (data: {
    roomId: string
    shapeId: string
    updates: Partial<{ isRevealed: boolean; isVisible: boolean; points: any }>
  }) => {
    try {
      const { roomId: roomCode, shapeId, updates } = data

      await p.fogShape.update({
        where: { id: shapeId },
        data: updates,
      })

      const roomState = getOrCreateRoom(roomCode)
      if (roomState.fogShapes[shapeId]) {
        roomState.fogShapes[shapeId] = {
          ...roomState.fogShapes[shapeId],
          ...updates,
        }
      }

      io.to(roomCode).emit('fog-shape-update', { shapeId, updates })
    } catch (err) {
      console.error('fog-shape-update error:', err)
      socket.emit('fog-error', { message: 'Failed to update fog shape' })
    }
  })

  // Удаление фигуры тумана
  socket.on('fog-shape-delete', async (data: { roomId: string; shapeId: string }) => {
    try {
      const { roomId: roomCode, shapeId } = data

      await p.fogShape.delete({
        where: { id: shapeId },
      })

      const roomState = getOrCreateRoom(roomCode)
      delete roomState.fogShapes[shapeId]

      io.to(roomCode).emit('fog-shape-delete', { shapeId })
    } catch (err) {
      console.error('fog-shape-delete error:', err)
      socket.emit('fog-error', { message: 'Failed to delete fog shape' })
    }
  })

  // Очистка всего тумана в комнате
  socket.on('fog-clear-all', async (data: { roomId: string }) => {
    try {
      const { roomId: roomCode } = data

      const room = await prisma.room.findUnique({
        where: { code: roomCode },
      })

      if (!room) return

      await p.fogShape.deleteMany({
        where: { roomId: room.id },
      })

      const roomState = getOrCreateRoom(roomCode)
      roomState.fogShapes = {}

      io.to(roomCode).emit('fog-clear-all')
    } catch (err) {
      console.error('fog-clear-all error:', err)
      socket.emit('fog-error', { message: 'Failed to clear fog' })
    }
  })
}
