import { useEffect } from 'react'
import { getTransport } from '../services/roomService'
import { usePlayersStore } from '../stores/playersStore'
import type { Player } from '../stores/playersStore'

export function usePlayers(roomId: string | undefined) {
  const { players, setPlayers, addPlayer, removePlayer, updatePlayer } = usePlayersStore()

  useEffect(() => {
    if (!roomId) return
    const transport = getTransport()

    transport.onRoomPlayers((players: Player[]) => {
      setPlayers(players)
    })

    return () => {
      // cleanup
    }
  }, [roomId])

  return { players }
}