import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Stage, Layer, Circle, Text, Group, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

const socket = io('http://localhost:3001')

interface Token {
  id: string; x: number; y: number; color: string; name: string
}

function MapImage() {
  const [image] = useImage('/map.jpg')
  return <KonvaImage image={image} x={0} y={0} />
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [connected, setConnected] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([
    { id: 'token-1', x: 100, y: 100, color: '#e74c3c', name: 'Воин' },
    { id: 'token-2', x: 250, y: 150, color: '#3498db', name: 'Маг' },
  ])
  const stageRef = useRef<Konva.Stage>(null)
  const username = localStorage.getItem('username') || 'Игрок'

  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 50,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight - 50,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true)
      const userId = localStorage.getItem('userId')
      socket.emit('join-room', { roomId, userId })
    })
    socket.on('token-move', (data: { id: string; x: number; y: number }) => {
      setTokens(prev => prev.map(t => t.id === data.id ? { ...t, x: data.x, y: data.y } : t))
    })
    socket.on('room-state', (state: { tokens: Record<string, { id: string; x: number; y: number }> }) => {
      setTokens(prev => prev.map(t => {
        const saved = state.tokens[t.id]
        return saved ? { ...t, x: saved.x, y: saved.y } : t
      }))
    })
    return () => {
      socket.off('connect')
      socket.off('token-move')
      socket.off('room-state')
    }
  }, [roomId])

  const handleDragEnd = (id: string, x: number, y: number) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
    socket.emit('token-move', { roomId, id, x, y })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const scaleBy = 1.05
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
    const newScale = Math.max(0.3, Math.min(5, e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy))
    stage.scale({ x: newScale, y: newScale })
    stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    alert('Ссылка скопирована!')
  }

  return (
    <div style={{ background: '#1a1a2e', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #1e293b', height: 50, boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: 'bold' }}>⚔️ {roomId}</span>
          <span style={{ color: connected ? '#2ecc71' : '#e74c3c', fontFamily: 'monospace', fontSize: 12 }}>
            {connected ? '🟢 Подключён' : '🔴 Отключён'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 }}>🧙 {username}</span>
          <button onClick={copyLink} style={{ background: '#7c3aed', border: 'none', borderRadius: 6, padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 13 }}>
            📋 Пригласить
          </button>
          <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ← Лобби
          </button>
        </div>
      </div>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        draggable
        onWheel={handleWheel}
      >
        <Layer><MapImage /></Layer>
        <Layer>
          {tokens.map(token => (
            <Group key={token.id} x={token.x} y={token.y} draggable
              onDragEnd={e => handleDragEnd(token.id, e.target.x(), e.target.y())}>
              <Circle radius={30} fill={token.color} shadowBlur={10} shadowColor={token.color} />
              <Text x={-20} y={35} text={token.name} fill="white" fontSize={12} fontFamily="monospace" />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}