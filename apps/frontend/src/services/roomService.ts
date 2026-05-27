// frontend/src/services/roomService.ts
import type { Token } from '../stores/tokenStore'
import type { Player } from '../stores/playersStore'
import type { RoomPermissions } from '../stores/permissionsStore'
import type { DiceRollResult, DiceError } from '../types/dice'
import type { FogShape } from '../stores/fogStore'

// ─── Интерфейс транспорта ────────────────────────────────────────────────

export interface RoomTransport {
  // Подключение
  joinRoom(roomId: string, userId: string | null, username: string | null): void
  disconnect(): void

  // Токены
  moveToken(roomId: string, tokenId: string, x: number, y: number): void
  createToken(roomId: string, token: Token): void
  deleteToken(roomId: string, tokenId: string): void

  // Инициатива
  addToInitiative(roomId: string, entry: { id: string; name: string; color: string; initiative: number | null; tokenId: string }): void
  removeFromInitiative(roomId: string, tokenId: string): void
  updateInitiative(roomId: string, entryId: string, initiative: number): void
  resetInitiative(roomId: string): void

  // Права
  setPermission(roomId: string, playerId: string, key: keyof RoomPermissions, value: boolean): void

  // Кубики
  rollDice(roomId: string, formula: string, playerId: string, playerName: string, playerColor: string): void

  // Туман войны ─── НОВОЕ ──────────────────────────────────────────────
  createFogShape(roomId: string, shape: FogShape, createdBy: string): void
  updateFogShape(roomId: string, shapeId: string, updates: Partial<FogShape>): void
  deleteFogShape(roomId: string, shapeId: string): void
  clearAllFog(roomId: string): void

  // Слушатели событий
  onConnect(cb: () => void): void
  onDisconnect(cb: () => void): void
  onConnectError(cb: (err: Error) => void): void
  onTokenMove(cb: (data: { id: string; x: number; y: number }) => void): void
  onTokenCreate(cb: (token: Token) => void): void
  onTokenDelete(cb: (data: { tokenId: string }) => void): void
  onRoomState(cb: (state: { tokens: Record<string, Token>; fogShapes: Record<string, FogShape> }) => void): void
  onRoomPlayers(cb: (players: Player[]) => void): void
  onPermissionUpdated(cb: (data: { playerId: string; key: string; value: boolean }) => void): void
  onInitiativeState(cb: (entries: any[]) => void): void
  onDiceResult(cb: (result: DiceRollResult) => void): void
  onDiceError(cb: (err: DiceError) => void): void

  // Туман войны слушатели ─── НОВОЕ ────────────────────────────────────
  onFogShapeCreate(cb: (shape: FogShape) => void): void
  onFogShapeUpdate(cb: (data: { shapeId: string; updates: Partial<FogShape> }) => void): void
  onFogShapeDelete(cb: (data: { shapeId: string }) => void): void
  onFogClearAll(cb: () => void): void

  // Утилиты
  isConnected(): boolean
  getSocketId(): string | undefined
}

// ─── Реализация на Socket.io ───────────────────────────────────────────

import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3001'

export class SocketIOTransport implements RoomTransport {
  private socket: Socket

  constructor() {
    this.socket = io(SOCKET_URL)
  }

  connect(): void {
    this.socket.connect()
  }

  disconnect(): void {
    this.socket.disconnect()
  }

  joinRoom(roomId: string, userId: string | null, username: string | null): void {
    this.socket.emit('join-room', { roomId, userId, username })
  }

  moveToken(roomId: string, tokenId: string, x: number, y: number): void {
    this.socket.emit('token-move', { roomId, id: tokenId, x, y })
  }

  createToken(roomId: string, token: Token): void {
    this.socket.emit('token-create', { roomId, token })
  }

  deleteToken(roomId: string, tokenId: string): void {
    this.socket.emit('token-delete', { roomId, tokenId })
  }

  addToInitiative(roomId: string, entry: any): void {
    this.socket.emit('initiative-add', { roomId, entry })
  }

  removeFromInitiative(roomId: string, tokenId: string): void {
    this.socket.emit('initiative-remove', { roomId, tokenId })
  }

  updateInitiative(roomId: string, entryId: string, initiative: number): void {
    this.socket.emit('initiative-update', { roomId, entryId, initiative })
  }

  resetInitiative(roomId: string): void {
    this.socket.emit('initiative-reset', { roomId })
  }

  setPermission(roomId: string, playerId: string, key: string, value: boolean): void {
    this.socket.emit('set-permission', { roomId, playerId, key, value })
  }

  rollDice(roomId: string, formula: string, playerId: string, playerName: string, playerColor: string): void {
    this.socket.emit('roll-dice', { roomId, formula, playerId, playerName, playerColor })
  }

  // ─── ТУМАН ВОЙНЫ ─── НОВОЕ ──────────────────────────────────────────

  createFogShape(roomId: string, shape: FogShape, createdBy: string): void {
    this.socket.emit('fog-shape-create', { roomId, shape, createdBy })
  }

  updateFogShape(roomId: string, shapeId: string, updates: Partial<FogShape>): void {
    this.socket.emit('fog-shape-update', { roomId, shapeId, updates })
  }

  deleteFogShape(roomId: string, shapeId: string): void {
    this.socket.emit('fog-shape-delete', { roomId, shapeId })
  }

  clearAllFog(roomId: string): void {
    this.socket.emit('fog-clear-all', { roomId })
  }

  // ─── Слушатели ──────────────────────────────────────────────────────

  onConnect(cb: () => void): void {
    this.socket.on('connect', cb)
  }

  onDisconnect(cb: () => void): void {
    this.socket.on('disconnect', cb)
  }

  onConnectError(cb: (err: Error) => void): void {
    this.socket.on('connect_error', cb)
  }

  onTokenMove(cb: (data: { id: string; x: number; y: number }) => void): void {
    this.socket.on('token-move', cb)
  }

  onTokenCreate(cb: (token: Token) => void): void {
    this.socket.on('token-create', cb)
  }

  onTokenDelete(cb: (data: { tokenId: string }) => void): void {
    this.socket.on('token-delete', cb)
  }

  onRoomState(cb: (state: { tokens: Record<string, Token>; fogShapes: Record<string, FogShape> }) => void): void {
    this.socket.on('room-state', cb)
  }

  onRoomPlayers(cb: (players: Player[]) => void): void {
    this.socket.on('room-players', cb)
  }

  onPermissionUpdated(cb: (data: { playerId: string; key: string; value: boolean }) => void): void {
    this.socket.on('permission-updated', cb)
  }

  onInitiativeState(cb: (entries: any[]) => void): void {
    this.socket.on('initiative-state', cb)
  }

  onDiceResult(cb: (result: DiceRollResult) => void): void {
    this.socket.on('dice-result', cb)
  }

  onDiceError(cb: (err: DiceError) => void): void {
    this.socket.on('dice-error', cb)
  }

  // ─── ТУМАН ВОЙНЫ СЛУШАТЕЛИ ─── НОВОЕ ────────────────────────────────

  onFogShapeCreate(cb: (shape: FogShape) => void): void {
    this.socket.on('fog-shape-create', cb)
  }

  onFogShapeUpdate(cb: (data: { shapeId: string; updates: Partial<FogShape> }) => void): void {
    this.socket.on('fog-shape-update', cb)
  }

  onFogShapeDelete(cb: (data: { shapeId: string }) => void): void {
    this.socket.on('fog-shape-delete', cb)
  }

  onFogClearAll(cb: () => void): void {
    this.socket.on('fog-clear-all', cb)
  }

  isConnected(): boolean {
    return this.socket.connected
  }

  getSocketId(): string | undefined {
    return this.socket.id
  }
}

// ─── Синглтон ──────────────────────────────────────────────────────────

let transportInstance: RoomTransport | null = null

export function getTransport(): RoomTransport {
  if (!transportInstance) {
    transportInstance = new SocketIOTransport()
  }
  return transportInstance
}

export function setTransport(transport: RoomTransport): void {
  transportInstance = transport
}