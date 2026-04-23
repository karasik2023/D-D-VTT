import { Server, Socket } from 'socket.io'
import { getOrCreateRoom } from './roomState'

export function registerTokenHandlers(io: Server, socket: Socket) {
  socket.on('token-move', (data: { roomId: string; id: string; x: number; y: number }) => {
    const room = getOrCreateRoom(data.roomId)
    const existing = room.tokens[data.id] || {}
    room.tokens[data.id] = { ...existing, id: data.id, x: data.x, y: data.y }
    socket.to(data.roomId).emit('token-move', data)
  })

  socket.on('token-create', (data: { roomId: string; token: any }) => {
    const room = getOrCreateRoom(data.roomId)
    room.tokens[data.token.id] = data.token
    io.to(data.roomId).emit('token-create', data.token)
  })
}