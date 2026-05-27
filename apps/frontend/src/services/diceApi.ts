const API_URL = 'http://localhost:3001'

export interface RollRequest {
  formula: string
  playerId: string
  playerName: string
  playerColor: string
}

export interface RollResponse {
  id: string
  playerId: string
  playerName: string
  playerColor: string
  formula: string
  rolls: Array<{
    die: string
    count: number
    values: number[]
    groupSum: number
  }>
  modifier: number
  total: number
  timestamp: number
}

export async function rollDice(roomId: string, data: RollRequest): Promise<RollResponse> {
  const res = await fetch(`${API_URL}/dice/${roomId}/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to roll dice')
  }

  return res.json()
}