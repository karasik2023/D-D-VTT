import { Server, Socket } from 'socket.io'
import { randomInt } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { getOrCreateRoom } from './roomState'

// === Типы ===
export interface DiceRollRequest {
  roomId: string
  formula: string
  playerId: string
  playerName: string
  playerColor: string
}

export interface DiceGroup {
  die: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
  count: number
  values: number[]
  groupSum: number
}

export interface DiceRollResult {
  id: string
  playerId: string
  playerName: string
  playerColor: string
  formula: string
  rolls: DiceGroup[]
  modifier: number
  total: number
  timestamp: number
}

interface ParsedFormula {
  groups: Array<{ count: number; sides: number }>
  modifier: number
  isValid: boolean
  error?: string
}

// === Парсинг формулы ===
function parseFormula(input: string): ParsedFormula {
  const cleaned = input.replace(/\s+/g, '').toLowerCase()

  if (!cleaned) {
    return { groups: [], modifier: 0, isValid: false, error: 'Empty formula' }
  }

  const groups: Array<{ count: number; sides: number }> = []
  const diceRegex = /(\d+)?d(\d+)/gi
  let match

  while ((match = diceRegex.exec(cleaned)) !== null) {
    const count = parseInt(match[1] || '1', 10)
    const sides = parseInt(match[2], 10)

    const validSides = [4, 6, 8, 10, 12, 20, 100]
    if (!validSides.includes(sides)) {
      return { groups: [], modifier: 0, isValid: false, error: `Invalid die: d${sides}` }
    }
    if (count < 1 || count > 100) {
      return { groups: [], modifier: 0, isValid: false, error: 'Count must be 1-100' }
    }

    groups.push({ count, sides })
  }

  if (groups.length === 0) {
    return { groups: [], modifier: 0, isValid: false, error: 'No valid dice found' }
  }

  let modifier = 0
  const modifierMatch = cleaned.match(/[+-]\d+$/)
  if (modifierMatch) {
    modifier = parseInt(modifierMatch[0], 10)
  }

  return { groups, modifier, isValid: true }
}

// === Генерация броска ===
function rollDie(sides: number): number {
  return randomInt(1, sides + 1)
}

function executeRoll(
  groups: Array<{ count: number; sides: number }>
): DiceGroup[] {
  return groups.map(({ count, sides }) => {
    const values = Array.from({ length: count }, () => rollDie(sides))
    return {
      die: `d${sides}` as DiceGroup['die'],
      count,
      values,
      groupSum: values.reduce((a, b) => a + b, 0),
    }
  })
}

// === Регистрация хендлеров ===
export function registerDiceHandlers(io: Server, socket: Socket) {
  socket.on('dice-roll', (data: DiceRollRequest) => {
    try {
      if (!data.roomId || !data.formula) {
        return socket.emit('dice-error', { message: 'Invalid dice roll request' })
      }

      // Проверка что игрок в комнате
      const room = getOrCreateRoom(data.roomId)
      const playerInRoom = room.players[data.playerId]
      if (!playerInRoom) {
        return socket.emit('dice-error', { message: 'Not in room' })
      }

      // Парсинг
      const parsed = parseFormula(data.formula)
      if (!parsed.isValid) {
        return socket.emit('dice-error', {
          formula: data.formula,
          error: parsed.error || 'Invalid formula',
        })
      }

      // Бросок
      const rolls = executeRoll(parsed.groups)
      const total = rolls.reduce((sum, r) => sum + r.groupSum, 0) + parsed.modifier

      const result: DiceRollResult = {
        id: uuidv4(),
        playerId: data.playerId,
        playerName: data.playerName,
        playerColor: data.playerColor,
        formula: data.formula,
        rolls,
        modifier: parsed.modifier,
        total,
        timestamp: Date.now(),
      }

      console.log(`[dice] ${data.playerName} rolled ${data.formula} = ${total}`)

      // Рассылка всем в комнате включая отправителя
      io.to(data.roomId).emit('dice-result', result)
    } catch (err) {
      console.error('[dice-roll] Error:', err)
      socket.emit('dice-error', { message: 'Failed to process dice roll' })
    }
  })
}