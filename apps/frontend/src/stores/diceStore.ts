import { create } from 'zustand'
import type { DiceRollResult } from '../types/dice'

// Максимум записей в истории (чтобы не раздувать память)
const MAX_HISTORY = 50

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface SelectedDie {
  type: DieType
  count: number
}

interface DiceStore {
  // Выбранные кубики (тип → количество)
  selected: Partial<Record<DieType, number>>
  // Модификатор (+N / -N)
  modifier: number
  // Режим броска
  rollMode: RollMode
  // История всех бросков в комнате
  history: DiceRollResult[]
  // Идёт ли бросок (для анимации/блокировки)
  isRolling: boolean
  // Последняя ошибка
  lastError: string | null

  // Действия
  addDie: (type: DieType) => void
  removeDie: (type: DieType) => void
  clearDice: () => void
  setModifier: (modifier: number) => void
  setRollMode: (mode: RollMode) => void
  setIsRolling: (v: boolean) => void
  addResult: (result: DiceRollResult) => void
  setError: (error: string | null) => void
  clearHistory: () => void

  // Утилита: собрать формулу из selected + modifier
  buildFormula: () => string
  // Есть ли хоть один кубик выбран
  hasSelection: () => boolean
}

export const useDiceStore = create<DiceStore>((set, get) => ({
  selected: {},
  modifier: 0,
  rollMode: 'normal',
  history: [],
  isRolling: false,
  lastError: null,

  addDie: (type) =>
    set((state) => ({
      selected: {
        ...state.selected,
        [type]: (state.selected[type] ?? 0) + 1,
      },
    })),

  removeDie: (type) =>
    set((state) => {
      const current = state.selected[type] ?? 0
      if (current <= 1) {
        const next = { ...state.selected }
        delete next[type]
        return { selected: next }
      }
      return { selected: { ...state.selected, [type]: current - 1 } }
    }),

  clearDice: () => set({ selected: {}, modifier: 0, rollMode: 'normal' }),

  setModifier: (modifier) => set({ modifier }),

  setRollMode: (rollMode) => set({ rollMode }),

  setIsRolling: (isRolling) => set({ isRolling }),

  addResult: (result) =>
    set((state) => ({
      history: [result, ...state.history].slice(0, MAX_HISTORY),
      lastError: null,
    })),

  setError: (lastError) => set({ lastError }),

  clearHistory: () => set({ history: [] }),

  buildFormula: () => {
    const { selected, modifier } = get()
    const parts = (Object.entries(selected) as [DieType, number][])
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${count}${type}`)
    if (parts.length === 0) return ''
    let formula = parts.join('+')
    if (modifier > 0) formula += `+${modifier}`
    else if (modifier < 0) formula += `${modifier}`
    return formula
  },

  hasSelection: () => {
    const { selected } = get()
    return Object.values(selected).some((c) => (c ?? 0) > 0)
  },
}))