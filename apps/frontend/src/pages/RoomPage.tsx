import { useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Layer, Group, Circle, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { FaUsers, FaDiceD20, FaFont, FaEyeSlash, FaMap, FaCube, FaClipboard, FaDice } from 'react-icons/fa6'
import { FaMousePointer, FaPencilAlt, FaRuler, FaUserNinja } from 'react-icons/fa'
import { MdGridOn, MdLogout, MdPanTool, MdSearch } from 'react-icons/md'
import { useRoom } from '../hooks/useRoom'
import TokensLibrary from '../components/TokensLibrary'
import PlayersPanel from '../components/panels/PlayersPanel'
import InitiativePanel from '../components/panels/InitiativePanel'
import DicePanel from '../components/panels/DicePanel'
import ScenesPanel from '../components/panels/ScenesPanel'
import ObjectsPanel from '../components/panels/ObjectsPanel'
import SearchPanel from '../components/panels/SearchPanel'
import GridPanel from '../components/panels/GridPanel'
import { getSocket } from '../hooks/useSocket'

interface ContextMenu {
  x: number
  y: number
  tokenId: string
  tokenName: string
  tokenColor: string
}

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
  onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>, tokenId: string, tokenName: string, tokenColor: string) => void
}

function TokenShape({ token, onDragEnd, onContextMenu }: TokenShapeProps) {
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

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const stageRef = useRef<Konva.Stage>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const username = localStorage.getItem('username') || 'Игрок'
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  const {
    tokens, connected, activeTool, activePanel, activeSection,
    setActiveTool, setActivePanel, setActiveSection,
    handleDragEnd, copyLink, createToken,
    addToInitiative, removeFromInitiative,
  } = useRoom(roomId)

  useEffect(() => {
    console.log('RoomPage mounted, roomId:', roomId)
    const s = getSocket()
    console.log('socket connected:', s.connected, 'id:', s.id)
  }, [])

  useEffect(() => {
    console.log('RoomPage mounted, roomId:', roomId)
    console.trace('mount trace')
    const s = getSocket()
    console.log('socket connected:', s.connected, 'id:', s.id)
  }, [])

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

  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

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

  const handleTokenRightClick = (e: Konva.KonvaEventObject<MouseEvent>, tokenId: string, tokenName: string, tokenColor: string) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, tokenId, tokenName, tokenColor })
  }

  const handleAddToInitiative = () => {
    if (!contextMenu) return
    addToInitiative({
      id: contextMenu.tokenId,
      name: contextMenu.tokenName,
      color: contextMenu.tokenColor,
      initiative: null,
      tokenId: contextMenu.tokenId,
    })
    setContextMenu(null)
    setActivePanel('initiative')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
      x: worldX,
      y: worldY,
      color: colors[Math.floor(Math.random() * colors.length)],
      name: tokenData.name,
      imageUrl: tokenData.imageUrl,
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // Тулбары — теперь хранят ссылку на компонент панели
  const tools = [
    { id: 'select',  Icon: FaMousePointer, label: 'Выделение' },
    { id: 'move',    Icon: MdPanTool,      label: 'Перетаскивание' },
    { id: 'fog',     Icon: FaEyeSlash,     label: 'Туман войны' },
    { id: 'marker',  Icon: FaPencilAlt,    label: 'Маркер' },
    { id: 'pointer', Icon: FaMousePointer, label: 'Указка' },
    { id: 'text',    Icon: FaFont,         label: 'Текст' },
    { id: 'ruler',   Icon: FaRuler,        label: 'Линейка' },
  ]

  const listItems = [
    { id: 'players',    Icon: FaUsers,   label: 'Игроки',     title: 'Игроки',          Panel: PlayersPanel },
    { id: 'initiative', Icon: FaDice,    label: 'Инициатива', title: 'Инициатива',      Panel: InitiativePanel },
    { id: 'dice',       Icon: FaDiceD20, label: 'Броски',     title: 'Броски кубиков',  Panel: DicePanel },
  ]

  const assetItems = [
    { id: 'search',  Icon: MdSearch,    label: 'Поиск',    title: 'Поиск',    Panel: SearchPanel },
    { id: 'tokens',  Icon: FaUserNinja, label: 'Токены',   title: 'Токены',   Panel: TokensLibrary },
    { id: 'scenes',  Icon: FaMap,       label: 'Сцены',    title: 'Сцены',    Panel: ScenesPanel },
    { id: 'objects', Icon: FaCube,      label: 'Объекты',  title: 'Объекты',  Panel: ObjectsPanel },
    { id: 'grid',    Icon: MdGridOn,    label: 'Сетка',    title: 'Сетка',    Panel: GridPanel },
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
  const activeAssetItem = assetItems.find(i => i.id === activeSection)

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

        {/* Canvas */}
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }} onDrop={handleDrop} onDragOver={handleDragOver}>
          {canvasSize.width > 0 && (
            <Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height} draggable onWheel={handleWheel}>
              <Layer><MapImage /></Layer>
              <Layer>
                {tokens.map(token => (
                  <TokenShape
                    key={token.id}
                    token={token}
                    onDragEnd={handleDragEnd}
                    onContextMenu={handleTokenRightClick}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>

        {/* Контекстное меню токена */}
        {contextMenu && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#16213e', border: '1px solid #1e293b', borderRadius: 10, padding: '6px', zIndex: 999, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #1e293b', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: contextMenu.tokenColor }} />
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' }}>{contextMenu.tokenName}</span>
              </div>
            </div>
            <button
              onClick={handleAddToInitiative}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0f3460')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ⚔️ Добавить в инициативу
            </button>
            <button
              onClick={() => { removeFromInitiative(contextMenu.tokenId); setContextMenu(null) }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0f3460')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ✕ Убрать из инициативы
            </button>
          </div>
        )}

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
                  <button style={{ background: '#0f3460', border: '1px dashed #334155', borderRadius: 8, padding: '6px 14px', color: '#64748b', fontSize: 12 }}>
                    + Загрузить
                  </button>
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



      </div>
    </div>
  )
}