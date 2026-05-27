import { useCallback } from 'react'
import { rollDice } from '../services/diceApi'
import { useDiceStore } from '../stores/diceStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import { usePlayersStore } from '../stores/playersStore'

export function useDice(roomId: string) {
  const store = useDiceStore()
  const { myId } = usePermissionsStore()
  const { players } = usePlayersStore()

  const roll = useCallback(async () => {
    if (!store.hasSelection() || store.isRolling) return

    const formula = store.buildFormula()
    if (!formula) return

    const me = players.find((p) => p.id === myId)
    if (!me) return

    store.setIsRolling(true)

    try {
      if (store.rollMode === 'normal') {
        await rollDice(roomId, {
          formula,
          playerId: me.id,
          playerName: me.username,
          playerColor: me.color,
        })
      } else {
        // advantage / disadvantage: два броска
        // Сервер шлёт два dice-result, useRoomTransport обрабатывает буфер
        await Promise.all([
          rollDice(roomId, {
            formula,
            playerId: me.id,
            playerName: me.username,
            playerColor: me.color,
          }),
          rollDice(roomId, {
            formula,
            playerId: me.id,
            playerName: me.username,
            playerColor: me.color,
          }),
        ])
      }
    } catch (err) {
      console.error('Roll failed:', err)
      useDiceStore.getState().setError(err instanceof Error ? err.message : 'Ошибка броска')
    } finally {
      store.setIsRolling(false)
    }
  }, [store, myId, players, roomId])

  return {
    selected: store.selected,
    modifier: store.modifier,
    rollMode: store.rollMode,
    history: store.history,
    isRolling: store.isRolling,
    lastError: store.lastError,
    formula: store.buildFormula(),
    hasSelection: store.hasSelection(),

    addDie: store.addDie,
    removeDie: store.removeDie,
    clearDice: store.clearDice,
    setModifier: store.setModifier,
    setRollMode: store.setRollMode,

    roll,
  }
}