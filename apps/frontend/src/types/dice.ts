// frontend/src/types/dice.ts

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
  rollMode?: 'advantage' | 'disadvantage' | 'normal'
  altTotal?: number
  chosen?: 'main' | 'alt'
}

export interface DiceError {
  error?: string
  message?: string
  formula?: string
}