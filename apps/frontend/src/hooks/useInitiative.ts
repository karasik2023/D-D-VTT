import { useEffect } from 'react'
import { getSocket } from './useSocket'
import { useInitiativeStore } from '../stores/initiativeStore'
import type { InitiativeEntry } from '../stores/initiativeStore'

export function useInitiative(roomId: string | undefined) {
  const { entries, addEntry, removeEntry, setInitiative, clearAll } = useInitiativeStore()

  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    socket.on('initiative-add', (entry: InitiativeEntry) => {
      addEntry(entry)
    })

    socket.on('initiative-remove', (id: string) => {
      removeEntry(id)
    })

    socket.on('initiative-update', (data: { id: string; value: number | null }) => {
      setInitiative(data.id, data.value)
    })

    socket.on('initiative-clear', () => {
      clearAll()
    })

    socket.on('initiative-state', (entries: InitiativeEntry[]) => {
      clearAll()
      entries.forEach(addEntry)
    })

    return () => {
      socket.off('initiative-add')
      socket.off('initiative-remove')
      socket.off('initiative-update')
      socket.off('initiative-clear')
      socket.off('initiative-state')
    }
  }, [roomId])

  const addToInitiative = (entry: InitiativeEntry) => {
    addEntry(entry)
    getSocket().emit('initiative-add', { roomId, entry })
  }

  const removeFromInitiative = (id: string) => {
    removeEntry(id)
    getSocket().emit('initiative-remove', { roomId, id })
  }

  const updateInitiative = (id: string, value: number | null) => {
    setInitiative(id, value)
    getSocket().emit('initiative-update', { roomId, id, value })
  }

  const clearInitiative = () => {
    clearAll()
    getSocket().emit('initiative-clear', { roomId })
  }

  // Сортировка по убыванию (выше = первый в списке)
  const sorted = [...entries].sort((a, b) => {
    if (a.initiative === null) return 1
    if (b.initiative === null) return -1
    return b.initiative - a.initiative
  })

  return { entries: sorted, addToInitiative, removeFromInitiative, updateInitiative, clearInitiative }
}