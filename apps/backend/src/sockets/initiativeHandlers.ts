import { Server, Socket } from 'socket.io'
import { getOrCreateRoom, InitiativeEntry } from './roomState'

export function registerInitiativeHandlers(io: Server, socket: Socket) {
  socket.on('initiative-add', (data: { roomId: string; entry: InitiativeEntry }) => {
    const room = getOrCreateRoom(data.roomId)
    room.initiative[data.entry.id] = data.entry
    socket.to(data.roomId).emit('initiative-add', data.entry)
  })

  socket.on('initiative-remove', (data: { roomId: string; id: string }) => {
    const room = getOrCreateRoom(data.roomId)
    delete room.initiative[data.id]
    socket.to(data.roomId).emit('initiative-remove', data.id)
  })

  socket.on('initiative-update', (data: { roomId: string; id: string; value: number | null }) => {
    const room = getOrCreateRoom(data.roomId)
    if (room.initiative[data.id]) {
      room.initiative[data.id].initiative = data.value
    }
    socket.to(data.roomId).emit('initiative-update', { id: data.id, value: data.value })
  })

  socket.on('initiative-clear', (data: { roomId: string }) => {
    const room = getOrCreateRoom(data.roomId)
    room.initiative = {}
    socket.to(data.roomId).emit('initiative-clear')
  })
}