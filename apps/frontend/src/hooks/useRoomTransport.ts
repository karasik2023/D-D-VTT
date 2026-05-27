// frontend/src/hooks/useRoomTransport.ts
import { useEffect } from 'react'
import { getTransport } from '../services/roomService'
import { useTokenStore } from '../stores/tokenStore'
import { useRoomStore } from '../stores/roomStore'
import { usePlayersStore } from '../stores/playersStore'
import { usePermissionsStore } from '../stores/permissionsStore'
import { useDiceStore } from '../stores/diceStore'
import type { Player } from '../stores/playersStore'
import type { Token } from '../stores/tokenStore'
import type { RoomPermissions } from '../stores/permissionsStore'
import type { DiceRollResult, DiceError } from '../types/dice'

// ─── Буфер для advantage/disadvantage ─────────────────────────────────────

interface PendingAdvRoll {
  mode: 'advantage' | 'disadvantage'
  results: DiceRollResult[]
  formula: string
  playerId: string
}

let pendingAdvBuffer: PendingAdvRoll | null = null

function handleDiceResult(result: DiceRollResult) {
  const { addResult, setIsRolling, rollMode } = useDiceStore.getState()

  if (rollMode !== 'normal') {
    if (
      pendingAdvBuffer &&
      pendingAdvBuffer.formula === result.formula &&
      pendingAdvBuffer.playerId === result.playerId
    ) {
      pendingAdvBuffer.results.push(result)
      const [r1, r2] = pendingAdvBuffer.results
      const isAdvantage = pendingAdvBuffer.mode === 'advantage'
      const chooseMain = isAdvantage ? r1.total >= r2.total : r1.total <= r2.total

      const finalResult: DiceRollResult = {
        ...(chooseMain ? r1 : r2),
        rollMode: pendingAdvBuffer.mode,
        altTotal: chooseMain ? r2.total : r1.total,
        chosen: chooseMain ? 'main' : 'alt',
      }

      addResult(finalResult)
      setIsRolling(false)
      pendingAdvBuffer = null
    } else {
      pendingAdvBuffer = {
        mode: rollMode as 'advantage' | 'disadvantage',
        results: [result],
        formula: result.formula,
        playerId: result.playerId,
      }
    }
    return
  }

  addResult(result)
  setIsRolling(false)
}

function handleDiceError(err: DiceError) {
  const { setError, setIsRolling } = useDiceStore.getState()
  setError(err.error || err.message || 'Ошибка броска')
  setIsRolling(false)
  pendingAdvBuffer = null
}

// ─────────────────────────────────────────────────────────────────────────────

export function useRoomTransport(roomId: string | undefined) {
  const { moveToken, addToken, removeToken, applyServerState } = useTokenStore()
  const { setConnected } = useRoomStore()
  const { setPlayers } = usePlayersStore()
  const { setMyRole, setMyId, setAllPermissions, setPermission } = usePermissionsStore()

  useEffect(() => {
    if (!roomId) return

    const transport = getTransport()
    const userId = localStorage.getItem('userId')
    const username = localStorage.getItem('username')

    if (userId) setMyId(userId)
    setPlayers([])

    const joinRoom = () => {
      transport.joinRoom(roomId, userId, username)
    }

    const applyMyPermissions = (players: Player[]) => {
      if (!userId) return
      const me = players.find((p) => p.id === userId)
      if (me) {
        setMyRole(me.isGM ? 'gm' : 'player')
        if ((me as any).permissions) {
          setAllPermissions((me as any).permissions as RoomPermissions)
        }
      }
    }

    // Если уже подключен — сразу join
    if (transport.isConnected()) {
      setConnected(true)
      joinRoom()
    }

    // Подписки на события
    transport.onConnect(() => {
      console.log('✅ Transport connected')
      setConnected(true)
      joinRoom()
    })

    transport.onDisconnect(() => {
      console.log('❌ Transport disconnected')
      setConnected(false)
    })

    transport.onConnectError((err) => {
      console.log('❌ Transport connect error:', err.message)
    })

    transport.onTokenMove((data: { id: string; x: number; y: number }) => {
      moveToken(data.id, data.x, data.y)
    })

    transport.onTokenCreate((token: Token) => {
      console.log('=== FRONT received token-create from server ===', { id: token.id, name: token.name })
      const { tokens } = useTokenStore.getState()
      console.log('=== FRONT current tokens:', tokens.map(t => ({ id: t.id, name: t.name })))
      const exists = tokens.find((t) => t.id === token.id)
      console.log('=== FRONT token exists?', !!exists)
      if (!exists) {
        console.log('=== FRONT adding token from server ===')
        addToken(token)
      } else {
        console.log('=== FRONT token already exists, skipping ===')
      }
    })

    transport.onTokenDelete((data: { tokenId: string }) => {
      removeToken(data.tokenId)
    })

    transport.onRoomState((state: { tokens: Record<string, Token> }) => {
      console.log('room-state received:', state)
      console.log('token count:', Object.keys(state.tokens).length)
      applyServerState(state.tokens)
    })

    transport.onRoomPlayers((players: Player[]) => {
      setPlayers(players)
      applyMyPermissions(players)
    })

    transport.onPermissionUpdated((data: { playerId: string; key: string; value: boolean }) => {
      if (data.playerId === userId) {
        setPermission(data.key as keyof RoomPermissions, data.value)
      }
      const { updatePlayerPermission } = usePlayersStore.getState()
      updatePlayerPermission(data.playerId, data.key as keyof RoomPermissions, data.value)
    })

    transport.onDiceResult((result: DiceRollResult) => {
      handleDiceResult(result)
    })

    transport.onDiceError((err: DiceError) => {
      handleDiceError(err)
    })

    return () => {
      // cleanup при размонтировании — сокет не отключаем
    }
  }, [roomId])
}