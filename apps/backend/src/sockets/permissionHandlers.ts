import { Server, Socket } from 'socket.io'
import { getOrCreateRoom } from './roomState'

export function registerPermissionHandlers(io: Server, socket: Socket) {
  socket.on('set-permission', (data: { roomId: string; playerId: string; key: string; value: boolean }) => {
    const room = getOrCreateRoom(data.roomId)
    if (room.players[data.playerId]) {
      room.players[data.playerId].permissions[data.key] = data.value
    }
    socket.to(data.roomId).emit('permission-updated', {
      playerId: data.playerId,
      key: data.key,
      value: data.value,
    })
  })
}