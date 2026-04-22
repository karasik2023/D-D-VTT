import { useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Layer, Circle, Text, Group, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { FaUsers, FaDiceD20, FaFont, FaEyeSlash, FaMap, FaCube, FaClipboard, FaDice } from 'react-icons/fa6'
import { FaMousePointer, FaPencilAlt, FaRuler, FaUserNinja } from 'react-icons/fa'
import { MdGridOn, MdLogout, MdPanTool, MdSearch, MdClear } from 'react-icons/md'
import { useRoom } from '../hooks/useRoom'

// Контекстное меню
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

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const stageRef = useRef<Konva.Stage>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const username = localStorage.getItem('username') || 'Игрок'
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  const {
    tokens, players, connected, activeTool, activePanel, activeSection,
    setActiveTool, setActivePanel, setActiveSection,
    handleDragEnd, copyLink,
    initiativeEntries, addToInitiative, removeFromInitiative, updateInitiative, clearInitiative,
  } = useRoom(roomId)

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

  // Закрываем контекстное меню по клику вне
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
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      tokenId,
      tokenName,
      tokenColor,
    })
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
    { id: 'players',    Icon: FaUsers,   label: 'Игроки' },
    { id: 'initiative', Icon: FaDice,    label: 'Инициатива' },
    { id: 'dice',       Icon: FaDiceD20, label: 'Броски' },
  ]

  const assetItems = [
    { id: 'search',  Icon: MdSearch,    label: 'Поиск' },
    { id: 'tokens',  Icon: FaUserNinja, label: 'Токены' },
    { id: 'scenes',  Icon: FaMap,       label: 'Сцены' },
    { id: 'objects', Icon: FaCube,      label: 'Объекты' },
    { id: 'grid',    Icon: MdGridOn,    label: 'Сетка' },
  ]

  const panelTitles: Record<string, string> = {
    players: 'Игроки', initiative: 'Инициатива', dice: 'Броски кубиков',
    tokens: 'Токены', scenes: 'Сцены', objects: 'Объекты', search: 'Поиск', grid: 'Сетка',
  }

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
        <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>
          {canvasSize.width > 0 && (
            <Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height} draggable onWheel={handleWheel}>
              <Layer><MapImage /></Layer>
              <Layer>
                {tokens.map(token => (
                  <Group
                    key={token.id}
                    x={token.x}
                    y={token.y}
                    draggable
                    onDragEnd={e => handleDragEnd(token.id, e.target.x(), e.target.y())}
                    onContextMenu={e => handleTokenRightClick(e, token.id, token.name, token.color)}
                  >
                    <Circle radius={30} fill={token.color} shadowBlur={10} shadowColor={token.color} />
                    <Text x={-20} y={35} text={token.name} fill="white" fontSize={12} fontFamily="monospace" />
                  </Group>
                ))}
              </Layer>
            </Stage>
          )}
        </div>

        {/* Контекстное меню токена */}
        {contextMenu && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#16213e', border: '1px solid #1e293b', borderRadius: 10, padding: '6px', zIndex: 999, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          >
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

          {activePanel && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#16213e', border: '1px solid #1e293b', borderRadius: 12, padding: 14, minWidth: 240, maxWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: 13 }}>{panelTitles[activePanel]}</span>
                <button onClick={() => setActivePanel(null)} style={{ color: '#64748b', fontSize: 14 }}>✕</button>
              </div>

              {/* Список игроков */}
              {activePanel === 'players' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {players.length === 0 ? (
                    <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— нет игроков —</p>
                  ) : (
                    players.map(player => (
                      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: '#0f3460', borderRadius: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: player.connected ? player.color : '#475569', flexShrink: 0 }} />
                        <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{player.username}</span>
                        {player.isGM && <span style={{ color: '#a78bfa', fontSize: 10, background: '#1e1b4b', borderRadius: 4, padding: '2px 6px' }}>GM</span>}
                        {!player.connected && <span style={{ color: '#475569', fontSize: 10 }}>офлайн</span>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Инициатива */}
              {activePanel === 'initiative' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#64748b', fontSize: 11 }}>ПКМ по токену чтобы добавить</span>
                    {initiativeEntries.length > 0 && (
                      <button
                        onClick={clearInitiative}
                        title="Очистить"
                        style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <MdClear size={14} color="#64748b" /> Сбросить
                      </button>
                    )}
                  </div>

                  {initiativeEntries.length === 0 ? (
                    <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— список пуст —</p>
                  ) : (
                    initiativeEntries.map((entry, index) => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: index === 0 ? '#1e1b4b' : '#0f3460', borderRadius: 8, border: index === 0 ? '1px solid #a78bfa' : '1px solid transparent' }}>
                        <span style={{ color: '#475569', fontSize: 11, minWidth: 16, textAlign: 'center' }}>{index + 1}</span>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                        <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{entry.name}</span>
                        <input
                          type="number"
                          value={entry.initiative ?? ''}
                          onChange={e => updateInitiative(entry.id, e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="—"
                          style={{ width: 44, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '3px 6px', color: '#e2e8f0', fontSize: 12, textAlign: 'center', outline: 'none' }}
                        />
                        <button
                          onClick={() => removeFromInitiative(entry.id)}
                          style={{ color: '#475569', fontSize: 12, flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Броски кубиков */}
              {activePanel === 'dice' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'].map(d => (
                    <button key={d} style={{ background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: 13 }}>{panelTitles[activeSection]}</span>
                <button onClick={() => setActiveSection(null)} style={{ color: '#64748b', fontSize: 14 }}>✕</button>
              </div>
              {(activeSection === 'tokens' || activeSection === 'scenes' || activeSection === 'objects') && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button style={{ background: '#0f3460', border: '1px dashed #334155', borderRadius: 8, padding: '6px 14px', color: '#64748b', fontSize: 12 }}>
                    + Загрузить
                  </button>
                  <span style={{ color: '#475569', fontSize: 11 }}>нет файлов</span>
                </div>
              )}
              {(activeSection === 'search' || activeSection === 'grid') && (
                <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>— скоро —</p>
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