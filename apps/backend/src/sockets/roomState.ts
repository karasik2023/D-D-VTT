// backend/src/sockets/roomState.ts
import { prisma } from '../config/prisma'

export interface RoomPlayer {
  id: string
  username: string
  color: string
  isGM: boolean
  connected: boolean
  socketId: string
  permissions: Record<string, boolean>
}

export interface InitiativeEntry {
  id: string
  name: string
  color: string
  initiative: number | null
  tokenId: string
}

export interface RoomState {
  tokens: Record<string, any>
  players: Record<string, RoomPlayer>
  initiative: Record<string, InitiativeEntry>
  _loadedFromDB?: boolean
}

export const roomStates: Record<string, RoomState> = {}

export function getOrCreateRoom(roomCode: string): RoomState {
  if (!roomStates[roomCode]) {
    roomStates[roomCode] = { tokens: {}, players: {}, initiative: {} }
  }
  return roomStates[roomCode]
}

export async function loadRoomFromDB(roomCode: string): Promise<void> {
  const roomState = getOrCreateRoom(roomCode)
  if (roomState._loadedFromDB) return

  // Находим комнату по code (roomId в сокете — это code)
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { tokens: true, initiatives: true },
  })

  if (!room) {
    console.error('Room not found in DB:', roomCode)
    return
  }

  // Загружаем токены с реальным room.id
  for (const t of room.tokens) {
    roomState.tokens[t.id] = {
      id: t.id,
      x: t.x,
      y: t.y,
      color: t.color,
      name: t.name,
      imageUrl: t.imageUrl,
      layer: t.layer,
      scale: t.scale,
      rotation: t.rotation,
    }
  }

  // Загружаем инициативу
  for (const i of room.initiatives) {
    roomState.initiative[i.id] = {
      id: i.id,
      name: i.name,
      color: i.color,
      initiative: i.initiative,
      tokenId: i.tokenId || '',
    }
  }

  roomState._loadedFromDB = true
  console.log(`[loadRoomFromDB] Loaded ${Object.keys(roomState.tokens).length} tokens for room ${roomCode}`)
}

export function clearRoomState(roomCode: string): void {
  delete roomStates[roomCode]
}