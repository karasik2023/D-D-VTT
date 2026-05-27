import { Router } from 'express'
import { randomInt } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../config/prisma'
import { io } from '../index' 

const router = Router()

interface DiceGroup {
  die: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
  count: number
  values: number[]
  groupSum: number
}

interface DiceRollResult {
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

function parseFormula(input: string) {
  const cleaned = input.replace(/\s+/g, '').toLowerCase()
  if (!cleaned) return { groups: [], modifier: 0, isValid: false, error: 'Empty formula' }

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

function rollDie(sides: number): number {
  return randomInt(1, sides + 1)
}

function executeRoll(groups: Array<{ count: number; sides: number }>): DiceGroup[] {
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

router.post('/:roomId/roll', async (req, res) => {
  try {
    const { roomId } = req.params
    const { formula, playerId, playerName, playerColor } = req.body

    if (!formula || !playerId) {
      return res.status(400).json({ error: 'Missing formula or playerId' })
    }

    const parsed = parseFormula(formula)
    if (!parsed.isValid) {
      return res.status(400).json({ error: parsed.error })
    }

    const rolls = executeRoll(parsed.groups)
    const total = rolls.reduce((sum, r) => sum + r.groupSum, 0) + parsed.modifier

    const result: DiceRollResult = {
      id: uuidv4(),
      playerId,
      playerName,
      playerColor,
      formula,
      rolls,
      modifier: parsed.modifier,
      total,
      timestamp: Date.now(),
    }

    // Broadcast всем в комнате через socket.io
    io.to(roomId).emit('dice-result', result)

    res.json(result)
  } catch (err) {
    console.error('[dice-roll] Error:', err)
    res.status(500).json({ error: 'Failed to process dice roll' })
  }
})

export const diceRouter = router