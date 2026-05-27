import { useRef, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Layer, Group, Circle, Image as KonvaImage, Rect, Line } from 'react-konva'
import useImage from 'use-image'
import { FaUsers, FaDiceD20, FaFont, FaEyeSlash, FaMap, FaCube, FaClipboard, FaDice } from 'react-icons/fa6'
import { FaMousePointer, FaPencilAlt, FaRuler, FaUserNinja } from 'react-icons/fa'
import { MdGridOn, MdLogout, MdPanTool, MdSearch } from 'react-icons/md'
import { useRoom } from '../hooks/useRoom'
import { getTransport } from '../services/roomService'
import TokensLibrary from '../components/TokensLibrary'
import PlayersPanel from '../components/panels/PlayersPanel'
import InitiativePanel from '../components/panels/InitiativePanel'
import DicePanel from '../components/panels/DicePanel'
import FogPanel from '../components/panels/FogPanel'
import ScenesPanel from '../components/panels/ScenesPanel'
import ObjectsPanel from '../components/panels/ObjectsPanel'
import SearchPanel from '../components/panels/SearchPanel'
import GridPanel from '../components/panels/GridPanel'
import ContextMenu from '../components/ContextMenu'
import { useContextMenu } from '../hooks/useContextMenu'
import { useFogStore, type FogShape } from '../stores/fogStore'

function MapImage() {
  const [image] = useImage('/map.jpg')
  return <KonvaImage image={image} x={0} y={0} />
}

function TokenImage({ url }: { url: string }) {
  const [image] = useImage(url, 'anonymous')
  if (!image) return null
  return <KonvaImage image={image} x={-30} y={-30} width={60} height={60} cornerRadius={30} />
}

interface TokenShapeProps {
  token: { id: string; x: number; y: number; color: string; name: string; imageUrl?: string }
  onDragEnd: (id: string, x: number, y: number) => void
  onContextMenu: (e: any, tokenId: string, tokenName: string, tokenColor: string) => void
  isHidden?: boolean
}

function TokenShape({ token, onDragEnd, onContextMenu, isHidden }: TokenShapeProps) {
  if (isHidden) return null
  return (
    <Group
      x={token.x}
      y={token.y}
      draggable
      onDragEnd={e => onDragEnd(token.id, e.target.x(), e.target.y())}
      onContextMenu={e => onContextMenu(e, token.id, token.name, token.color)}
    >
      {token.imageUrl ? (
        <TokenImage url={token.imageUrl} />
      ) : (
        <Circle radius={30} fill={token.color} shadowBlur={10} shadowColor={token.color} />
      )}
    </Group>
  )
}

function FogShapeRenderer({ shape, isGM, previewMode, onClick, onContextMenu }: {
  shape: FogShape
  isGM: boolean
  previewMode: boolean
  onClick?: () => void
  onContextMenu?: (e: any) => void
}) {
  if (!shape.isVisible) return null
  const opacity = previewMode ? 1 : (isGM ? 0.4 : 1)
  const fill = '#0a0a1a'
  const props = { fill, opacity, listening: isGM && !previewMode, onClick, onContextMenu }

  switch (shape.type) {
    case 'rect': {
      const { x, y, w, h } = shape.points
      return <Rect x={x} y={y} width={w} height={h} {...props} />
    }
    case 'circle': {
      const { x, y, r } = shape.points
      return <Circle x={x} y={y} radius={r} {...props} />
    }
    case 'polygon':
    case 'triangle': {
      const pts = shape.points as { x: number; y: number }[]
      return <Line points={pts.flatMap(p => [p.x, p.y])} closed fill={fill} opacity={opacity} listening={isGM && !previewMode} onClick={onClick} onContextMenu={onContextMenu} />
    }
    case 'full':
      return <Rect x={-5000} y={-5000} width={10000} height={10000} {...props} />
    default:
      return null
  }
}

function FogLayer({ shapes, isGM, previewMode, onShapeClick, onShapeContextMenu }: {
  shapes: FogShape[]
  isGM: boolean
  previewMode: boolean
  onShapeClick?: (id: string) => void
  onShapeContextMenu?: (e: any, id: string) => void
}) {
  return (
    <Layer listening={isGM && !previewMode}>
      {shapes.map(s => (
        <FogShapeRenderer
          key={s.id}
          shape={s}
          isGM={isGM}
          previewMode={previewMode}
          onClick={() => onShapeClick?.(s.id)}
          onContextMenu={(e) => onShapeContextMenu?.(e, s.id)}
        />
      ))}
    </Layer>
  )
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const stageRef = useRef<any>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const username = localStorage.getItem('username') || 'Игрок'
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [diceOpen, setDiceOpen] = useState(false)
  const { show: showContextMenu } = useContextMenu()

  const {
    tokens, connected, activeTool, activePanel, activeSection,
    setActiveTool, setActivePanel, setActiveSection,
    handleDragEnd, copyLink, createToken,
    addToInitiative, removeFromInitiative,
    myRole,
    fogShapes,
    previewMode,
    tempPoints,
    setFogActiveTool,
    setPreviewMode,
    setSelectedShapeId,
    createFogShape,
    updateFogShape,
    deleteFogShape,
    clearAllFog,
    addTempPoint,
    clearTempPoints,
    setIsDrawing,
  } = useRoom(roomId)

  const isGM = myRole === 'gm'
  const fogOpen = activeTool === 'fog' && isGM

  useEffect(() => {
    if (!fogOpen) {
      setFogActiveTool('select')
      clearTempPoints()
      setIsDrawing(false)
    }
  }, [fogOpen, setFogActiveTool, clearTempPoints, setIsDrawing])

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleWheel = (e: any) => {
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

  const handleTokenRightClick = (e: any, tokenId: string, tokenName: string, tokenColor: string) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    showContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      title: tokenName,
      color: tokenColor,
      items: [
        {
          id: 'initiative-add',
          label: '⚔️ Добавить в инициативу',
          onClick: () => {
            addToInitiative({ id: tokenId, name: tokenName, color: tokenColor, initiative: null, tokenId })
            setActivePanel('initiative')
          },
        },
        {
          id: 'initiative-remove',
          label: '✕ Убрать из инициативы',
          onClick: () => removeFromInitiative(tokenId),
        },
        {
          id: 'duplicate',
          label: '📋 Дублировать',
          onClick: () => {
            const token = tokens.find(t => t.id === tokenId)
            if (token) {
              createToken({ ...token, id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, x: token.x + 20, y: token.y + 20 })
            }
          },
        },
        {
          id: 'delete',
          label: '🗑️ Удалить токен',
          danger: true,
          onClick: () => getTransport().deleteToken(roomId!, tokenId),
        },
      ],
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('application/vtt-token')
    if (!data) return
    const tokenData = JSON.parse(data)
    const stage = stageRef.current
    if (!stage) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const scale = stage.scaleX()
    const worldX = (screenX - stage.x()) / scale
    const worldY = (screenY - stage.y()) / scale
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
    createToken({
      id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: worldX, y: worldY,
      color: colors[Math.floor(Math.random() * colors.length)],
      name: tokenData.name,
      imageUrl: tokenData.imageUrl,
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // ─── ТУМАН ВОЙНЫ ────────────────────────────────────────────────────

  const getWorldPoint = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (!stage) return null
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    const scale = stage.scaleX()
    return {
      x: (clientX - rect.left - stage.x()) / scale,
      y: (clientY - rect.top - stage.y()) / scale,
    }
  }, [])

  const handleFogMouseDown = useCallback((e: any) => {
    if (!isGM || activeTool !== 'fog') return
    const targetName = e.target.constructor.name
    if (targetName === 'Group') return // токен
    e.evt.preventDefault()

    const point = getWorldPoint(e.evt.clientX, e.evt.clientY)
    if (!point) return

    const fogTool = useFogStore.getState().activeTool
    console.log('[Fog] MouseDown tool:', fogTool, 'point:', point)

    if (fogTool === 'polygon' || fogTool === 'triangle') {
      addTempPoint(point)
      setIsDrawing(true)
    } else if (fogTool === 'rect' || fogTool === 'circle') {
      stageRef.current._fogStart = { ...point }
      setIsDrawing(true)
    } else if (fogTool === 'full') {
      const isRevealed = useFogStore.getState().isScissorsMode
      createFogShape({
        id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'full', points: {},
        isRevealed, isVisible: true,
        createdBy: localStorage.getItem('userId') || '',
      })
      console.log('[Fog] Created full, revealed:', isRevealed)
    }
  }, [isGM, activeTool, getWorldPoint, addTempPoint, setIsDrawing, createFogShape])

  const handleFogMouseUp = (e: any) => {
    if (!isGM || activeTool !== 'fog' || !stageRef.current) return
    const stage = stageRef.current
    const start = stage._fogStart
    if (!start) return

    const point = getWorldPoint(e.evt.clientX, e.evt.clientY)
    if (!point) return

    const fogTool = useFogStore.getState().activeTool
    const isRevealed = useFogStore.getState().isScissorsMode
    const dx = point.x - start.x
    const dy = point.y - start.y

    if (fogTool === 'rect') {
      createFogShape({
        id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'rect',
        points: { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), w: Math.abs(dx), h: Math.abs(dy) },
        isRevealed, isVisible: true,
        createdBy: localStorage.getItem('userId') || '',
      })
      console.log('[Fog] Created rect, revealed:', isRevealed)
    } else if (fogTool === 'circle') {
      const r = Math.sqrt(dx * dx + dy * dy)
      createFogShape({
        id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'circle',
        points: { x: start.x, y: start.y, r },
        isRevealed, isVisible: true,
        createdBy: localStorage.getItem('userId') || '',
      })
      console.log('[Fog] Created circle, revealed:', isRevealed)
    }

    delete stage._fogStart
    setIsDrawing(false)
  }

  const handleFogDblClick = (e: any) => {
    if (!isGM || activeTool !== 'fog') return
    const targetName = e.target.constructor.name
    if (targetName === 'Group') return
    e.evt.preventDefault()

    const fogTool = useFogStore.getState().activeTool
    const tempPts = useFogStore.getState().tempPoints
    const isRevealed = useFogStore.getState().isScissorsMode
    console.log('[Fog] DblClick tool:', fogTool, 'points:', tempPts.length)

    if (fogTool === 'polygon' && tempPts.length >= 3) {
      createFogShape({
        id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'polygon', points: [...tempPts],
        isRevealed, isVisible: true,
        createdBy: localStorage.getItem('userId') || '',
      })
      clearTempPoints()
      setIsDrawing(false)
      console.log('[Fog] Created polygon, revealed:', isRevealed)
    } else if (fogTool === 'triangle' && tempPts.length === 3) {
      createFogShape({
        id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'triangle', points: [...tempPts],
        isRevealed, isVisible: true,
        createdBy: localStorage.getItem('userId') || '',
      })
      clearTempPoints()
      setIsDrawing(false)
      console.log('[Fog] Created triangle, revealed:', isRevealed)
    }
  }

  const handleFogKeyDown = (e: KeyboardEvent) => {
    if (!isGM || activeTool !== 'fog') return
    const fogTool = useFogStore.getState().activeTool
    const tempPts = useFogStore.getState().tempPoints
    const isRevealed = useFogStore.getState().isScissorsMode

    if (e.key === 'Enter') {
      if (fogTool === 'polygon' && tempPts.length >= 3) {
        createFogShape({
          id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'polygon', points: [...tempPts],
          isRevealed, isVisible: true,
          createdBy: localStorage.getItem('userId') || '',
        })
        clearTempPoints()
        setIsDrawing(false)
      } else if (fogTool === 'triangle' && tempPts.length === 3) {
        createFogShape({
          id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'triangle', points: [...tempPts],
          isRevealed, isVisible: true,
          createdBy: localStorage.getItem('userId') || '',
        })
        clearTempPoints()
        setIsDrawing(false)
      }
    } else if (e.key === 'Escape') {
      clearTempPoints()
      setIsDrawing(false)
      if (stageRef.current) delete stageRef.current._fogStart
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleFogKeyDown)
    return () => window.removeEventListener('keydown', handleFogKeyDown)
  }, [handleFogKeyDown])

  const handleFogShapeContextMenu = (e: any, shapeId: string) => {
    if (!isGM || activeTool !== 'fog') return
    e.evt.preventDefault()
    e.cancelBubble = true
    const shape = fogShapes.find(s => s.id === shapeId)
    if (!shape) return

    showContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      title: `Туман ${shape.type}`,
      color: '#0a0a1a',
      items: [
        {
          id: 'toggle-visible',
          label: shape.isVisible ? '👁️ Скрыть' : '👁️ Показать',
          onClick: () => updateFogShape(shapeId, { isVisible: !shape.isVisible }),
        },
        {
          id: 'toggle-revealed',
          label: shape.isRevealed ? '🌫️ Сделать туманом' : '✂️ Сделать вырезом',
          onClick: () => updateFogShape(shapeId, { isRevealed: !shape.isRevealed }),
        },
        {
          id: 'duplicate',
          label: '📋 Дублировать',
          onClick: () => {
            const newShape: FogShape = {
              ...shape,
              id: `fog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              points: JSON.parse(JSON.stringify(shape.points)),
            }
            if (shape.type === 'rect' || shape.type === 'circle') {
              newShape.points = { ...shape.points, x: shape.points.x + 20, y: shape.points.y + 20 }
            } else if (shape.type === 'polygon' || shape.type === 'triangle') {
              newShape.points = shape.points.map((p: any) => ({ x: p.x + 20, y: p.y + 20 }))
            }
            createFogShape(newShape)
          },
        },
        {
          id: 'delete',
          label: '🗑️ Удалить',
          danger: true,
          onClick: () => deleteFogShape(shapeId),
        },
      ],
    })
  }

  const isTokenHidden = useCallback((token: { x: number; y: number }) => {
    if (isGM) return false
    return useFogStore.getState().isPointInFog(token.x, token.y)
  }, [isGM])

  const tools = [
    { id: 'select', Icon: FaMousePointer, label: 'Выделение' },
    { id: 'move', Icon: MdPanTool, label: 'Перетаскивание' },
    { id: 'fog', Icon: FaEyeSlash, label: 'Туман войны' },
    { id: 'marker', Icon: FaPencilAlt, label: 'Маркер' },
    { id: 'pointer', Icon: FaMousePointer, label: 'Указка' },
    { id: 'text', Icon: FaFont, label: 'Текст' },
    { id: 'ruler', Icon: FaRuler, label: 'Линейка' },
  ]

  const listItems = [
    { id: 'players', Icon: FaUsers, label: 'Игроки', title: 'Игроки', Panel: PlayersPanel },
    { id: 'initiative', Icon: FaDice, label: 'Инициатива', title: 'Инициатива', Panel: InitiativePanel },
  ]

  const assetItems = [
    { id: 'search', Icon: MdSearch, label: 'Поиск', title: 'Поиск', Panel: SearchPanel },
    { id: 'tokens', Icon: FaUserNinja, label: 'Токены', title: 'Токены', Panel: TokensLibrary },
    { id: 'scenes', Icon: FaMap, label: 'Сцены', title: 'Сцены', Panel: ScenesPanel },
    { id: 'objects', Icon: FaCube, label: 'Объекты', title: 'Объекты', Panel: ObjectsPanel },
    { id: 'grid', Icon: MdGridOn, label: 'Сетка', title: 'Сетка', Panel: GridPanel },
  ]

  const barStyle: React.CSSProperties = {
    background: '#16213e', border: '1px solid #1e293b',
    borderRadius: 12, padding: '6px', display: 'flex', gap: 2,
  }

  const iconBtn = (active: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#7c3aed' : 'transparent',
    border: active ? '1px solid #a78bfa' : '1px solid transparent',
  })

  const activeListItem = listItems.find(i => i.id === activePanel)

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e', overflow: 'hidden' }}>
      {/* Шапка */}
      <div style={{ height: 50, flexShrink: 0, background: '#16213e', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: connected ? '#2ecc71' : '#e74c3c', fontSize: 11 }}>{connected ? '🟢' : '🔴'}</span>
          <button onClick={copyLink} style={{ height: 32, borderRadius: 8, border: '1px solid #334155', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', color: '#a78bfa', fontSize: 13 }}>
            <FaClipboard size={13} color="#a78bfa" /> {roomId}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' }}>🧙 {username}</span>
          <button onClick={() => window.location.href = '/'} style={{ height: 32, borderRadius: 8, border: '1px solid #334155', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', color: '#94a3b8', fontSize: 13 }}>
            <MdLogout size={16} color="#94a3b8" /> Лобби
          </button>
        </div>
      </div>

      {/* Основная область */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }} onDrop={handleDrop} onDragOver={handleDragOver}>
          {canvasSize.width > 0 && (
            <Stage
              ref={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              draggable={activeTool !== 'fog'}
              onWheel={handleWheel}
              onMouseDown={handleFogMouseDown}
              onMouseUp={handleFogMouseUp}
              onDblClick={handleFogDblClick}
            >
              <Layer><MapImage /></Layer>
              <Layer>
                {tokens.map(token => (
                  <TokenShape
                    key={token.id}
                    token={token}
                    onDragEnd={handleDragEnd}
                    onContextMenu={handleTokenRightClick}
                    isHidden={isTokenHidden(token)}
                  />
                ))}
              </Layer>
              <FogLayer
                shapes={fogShapes}
                isGM={isGM}
                previewMode={previewMode}
                onShapeClick={(id) => {
                  if (useFogStore.getState().activeTool === 'select') {
                    setSelectedShapeId(id)
                  }
                }}
                onShapeContextMenu={handleFogShapeContextMenu}
              />
              {isGM && tempPoints.length > 0 && (
                <Layer>
                  <Line
                    points={tempPoints.flatMap(p => [p.x, p.y])}
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                  {tempPoints.map((p, i) => (
                    <Circle key={i} x={p.x} y={p.y} radius={4} fill="#a78bfa" />
                  ))}
                </Layer>
              )}
            </Stage>
          )}
        </div>

        <ContextMenu />

        {/* БАР 1 — списки (верхний левый) */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <div style={{ ...barStyle, flexDirection: 'row', width: 'fit-content' }}>
            {listItems.map(({ id, Icon, label }) => (
              <button key={id} title={label}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
                style={iconBtn(activePanel === id)}>
                <Icon size={16} color={activePanel === id ? '#fff' : '#94a3b8'} />
              </button>
            ))}
            <button title="Броски кубиков" onClick={() => setDiceOpen(v => !v)} style={iconBtn(diceOpen)}>
              <FaDiceD20 size={16} color={diceOpen ? '#fff' : '#94a3b8'} />
            </button>
          </div>

          {activeListItem && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#16213e', border: '1px solid #1e293b', borderRadius: 12, padding: 14, minWidth: 240, maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: 13 }}>{activeListItem.title}</span>
                <button onClick={() => setActivePanel(null)} style={{ color: '#64748b', fontSize: 14 }}>✕</button>
              </div>
              <activeListItem.Panel roomId={roomId} />
            </div>
          )}
        </div>

        {/* БАР 3 — инструменты (правый) */}
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...barStyle, flexDirection: 'column' }}>
          {tools.map(({ id, Icon, label }) => (
            <button key={id} title={label} onClick={() => setActiveTool(id)} style={iconBtn(activeTool === id)}>
              <Icon size={16} color={activeTool === id ? '#fff' : '#94a3b8'} />
            </button>
          ))}
        </div>

        {/* БАР 2 — ассеты (нижний центр) */}
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {activeSection && (
            <div style={{ background: '#16213e', border: '1px solid #1e293b', borderRadius: 12, padding: 14, minWidth: 280 }}>
              {activeSection === 'tokens' && <TokensLibrary />}
              {(activeSection === 'scenes' || activeSection === 'objects') && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button style={{ background: '#0f3460', border: '1px dashed #334155', borderRadius: 8, padding: '6px 14px', color: '#64748b', fontSize: 12 }}>+ Загрузить</button>
                  <span style={{ color: '#475569', fontSize: 11 }}>скоро</span>
                </div>
              )}
              {(activeSection === 'search' || activeSection === 'grid') && (
                <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— скоро —</p>
              )}
            </div>
          )}
          <div style={{ ...barStyle }}>
            {assetItems.map(({ id, Icon, label }) => (
              <button key={id} title={label}
                onClick={() => setActiveSection(activeSection === id ? null : id)}
                style={iconBtn(activeSection === id)}>
                <Icon size={18} color={activeSection === id ? '#fff' : '#94a3b8'} />
              </button>
            ))}
          </div>
        </div>

        {/* DicePanel */}
        {diceOpen && (
          <DicePanel roomId={roomId} onClose={() => setDiceOpen(false)} />
        )}

        {/* FogPanel — оверлей при activeTool === 'fog' */}
        {fogOpen && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 60,
            background: '#16213e',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: 14,
            minWidth: 240,
            maxWidth: 320,
            zIndex: 100,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: 13 }}>Туман войны</span>
              <button onClick={() => setActiveTool('select')} style={{ color: '#64748b', fontSize: 14 }}>✕</button>
            </div>
            <FogPanel roomId={roomId} onClearAll={clearAllFog} />
          </div>
        )}

      </div>
    </div>
  )
}