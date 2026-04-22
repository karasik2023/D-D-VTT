import { useEffect } from 'react'
import { getSocket } from './useSocket'
import { usePlayersStore } from '../stores/playersStore'
import type { Player } from '../stores/playersStore'

export function usePlayers(roomId: string | undefined) {
  const { players, setPlayers, addPlayer, removePlayer, updatePlayer } = usePlayersStore()

  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    // Получаем текущий список игроков при входе
    socket.on('room-players', (players: Player[]) => {
      setPlayers(players)
    })

    // Новый игрок подключился
    socket.on('player-joined', (player: Player) => {
      addPlayer(player)
    })

    // Игрок отключился
    socket.on('player-left', (id: string) => {
      removePlayer(id)
    })

    // Обновление данных игрока
    socket.on('player-updated', (data: { id: string } & Partial<Player>) => {
      const { id, ...rest } = data
      updatePlayer(id, rest)
    })

    return () => {
      socket.off('room-players')
      socket.off('player-joined')
      socket.off('player-left')
      socket.off('player-updated')
    }
  }, [roomId])

  return { players }
}