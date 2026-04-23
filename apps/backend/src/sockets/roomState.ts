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
}

export const roomStates: Record<string, RoomState> = {}

export function getOrCreateRoom(roomId: string): RoomState {
  if (!roomStates[roomId]) {
    roomStates[roomId] = { tokens: {}, players: {}, initiative: {} }
  }
  return roomStates[roomId]
}