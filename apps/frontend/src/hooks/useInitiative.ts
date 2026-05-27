import { useEffect } from 'react'
import { getTransport } from '../services/roomService'
import { useInitiativeStore } from '../stores/initiativeStore'
import type { InitiativeEntry } from '../stores/initiativeStore'

export function useInitiative(roomId: string | undefined) {
  const { entries, addEntry, removeEntry, setInitiative, clearAll } = useInitiativeStore()

  useEffect(() => {
    if (!roomId) return
    const transport = getTransport()

    transport.onInitiativeState((entries: InitiativeEntry[]) => {
      clearAll()
      entries.forEach(addEntry)
    })

    // Остальные события инициативы — добавим в RoomTransport если нужны
    // Пока что initiative-state загружает начальное состояние
    // Реалтайм обновления инициативы будут через тот же транспорт

    return () => {
      // cleanup
    }
  }, [roomId])

  const addToInitiative = (entry: InitiativeEntry) => {
    addEntry(entry)
    getTransport().addToInitiative(roomId!, entry)
  }

  const removeFromInitiative = (id: string) => {
    removeEntry(id)
    getTransport().removeFromInitiative(roomId!, id)
  }

  const updateInitiative = (id: string, value: number | null) => {
    setInitiative(id, value)
    getTransport().updateInitiative(roomId!, id, value ?? 0)
  }

  const clearInitiative = () => {
    clearAll()
    getTransport().resetInitiative(roomId!)
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.initiative === null) return 1
    if (b.initiative === null) return -1
    return b.initiative - a.initiative
  })

  return { entries: sorted, addToInitiative, removeFromInitiative, updateInitiative, clearInitiative }
}