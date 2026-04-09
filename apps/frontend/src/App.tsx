import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { Stage, Layer, Circle, Text, Group, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

const socket = io('http://localhost:3001')
const ROOM_ID = 'test-room'

interface Token {
  id: string
  x: number
  y: number
  color: string
  name: string
}

function MapImage() {
  const [image] = useImage('/map.jpg')
  return <KonvaImage image={image} x={0} y={0} />
}

function App() {
  const [connected, setConnected] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([
    { id: 'token-1', x: 100, y: 100, color: '#e74c3c', name: 'Воин' },
    { id: 'token-2', x: 250, y: 150, color: '#3498db', name: 'Маг' },
  ])
  const stageRef = useRef<Konva.Stage>(null)

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-room', ROOM_ID)
    })

    socket.on('token-move', (data: { id: string; x: number; y: number }) => {
      setTokens(prev =>
        prev.map(t => t.id === data.id ? { ...t, x: data.x, y: data.y } : t)
      )
    })

    return () => {
      socket.off('connect')
      socket.off('token-move')
    }
  }, [])

  const handleDragEnd = (id: string, x: number, y: number) => {
    setTokens(prev =>
      prev.map(t => t.id === id ? { ...t, x, y } : t)
    )
    socket.emit('token-move', { roomId: ROOM_ID, id, x, y })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const scaleBy = 1.05
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(0.3, Math.min(5, newScale))

    stage.scale({ x: clampedScale, y: clampedScale })
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }

  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', padding: 20 }}>
      <p style={{ color: connected ? '#2ecc71' : '#e74c3c', fontFamily: 'monospace', margin: '0 0 10px' }}>
        {connected ? '🟢 Подключён' : '🔴 Отключён'}
      </p>
      <Stage
        ref={stageRef}
        width={window.innerWidth - 40}
        height={window.innerHeight - 60}
        draggable
        onWheel={handleWheel}
        style={{ border: '1px solid #333', borderRadius: 8 }}
      >
        <Layer>
          <MapImage />
        </Layer>
        <Layer>
          {tokens.map(token => (
            <Group
              key={token.id}
              x={token.x}
              y={token.y}
              draggable
              onDragEnd={e => handleDragEnd(token.id, e.target.x(), e.target.y())}
            >
              <Circle
                radius={30}
                fill={token.color}
                shadowBlur={10}
                shadowColor={token.color}
              />
              <Text
                x={-20}
                y={35}
                text={token.name}
                fill="white"
                fontSize={12}
                fontFamily="monospace"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export default App