import { useState, useRef, useCallback, useEffect } from 'react'
import { FaDiceD20 } from 'react-icons/fa6'
import { useDice } from '../../hooks/useDice'
import { useDiceStore } from '../../stores/diceStore'
import { usePermissionsStore } from '../../stores/permissionsStore'
import { usePlayersStore } from '../../stores/playersStore'
import { rollDice } from '../../services/diceApi'
import type { DieType, RollMode } from '../../stores/diceStore'
import type { DiceRollResult } from '../../types/dice'

const PANEL_BG = '#16213e'
const BORDER_CLR = '#1e293b'
const ACCENT = '#7c3aed'
const ACCENT_LIGHT = '#a78bfa'
const TEXT_MAIN = '#e2e8f0'
const TEXT_MUTED = '#94a3b8'
const TEXT_DIM = '#475569'
const TEXT_DIMMER = '#334155'

const BORDER = `1px solid ${BORDER_CLR}`

const DIE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']

const ROLL_MODE_LABELS: Record<RollMode, string> = {
  normal: 'Обычный',
  advantage: 'Преимущество',
  disadvantage: 'Помеха',
}

function DieButton({ type, count, onAdd, onRemove }: {
  type: DieType; count: number; onAdd: () => void; onRemove: () => void
}) {
  const active = count > 0
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={onAdd}
        onContextMenu={e => { e.preventDefault(); if (active) onRemove() }}
        title={`ЛКМ +1 ${type.toUpperCase()} · ПКМ −1`}
        style={{
          padding: '4px 10px', borderRadius: 6, minWidth: 40,
          border: active ? `1px solid ${ACCENT}` : BORDER,
          background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
          color: active ? ACCENT_LIGHT : TEXT_MUTED,
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
          transition: 'all 0.12s', userSelect: 'none',
        }}
      >
        {type.toUpperCase()}
      </button>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          background: ACCENT, color: '#fff', borderRadius: '50%',
          width: 16, height: 16, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', boxShadow: `0 0 0 2px ${PANEL_BG}`,
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

function HistoryItem({ result }: { result: DiceRollResult }) {
  const time = new Date(result.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit',
  })
  const modeTag =
    result.rollMode === 'advantage' ? ' ▲' :
    result.rollMode === 'disadvantage' ? ' ▼' : ''
  const altInfo = result.altTotal !== undefined ? ` (альт: ${result.altTotal})` : ''

  return (
    <div style={{
      padding: '5px 8px', borderRadius: 6, background: '#0f172a',
      borderLeft: `3px solid ${result.playerColor || ACCENT}`,
      fontSize: 11, lineHeight: 1.6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: result.playerColor || ACCENT_LIGHT, fontWeight: 600 }}>
          {result.playerName}
          <span style={{ color: TEXT_DIM, fontWeight: 400 }}>{modeTag}</span>
        </span>
        <span style={{ color: TEXT_DIM, fontSize: 10 }}>{time}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
        <span style={{ color: TEXT_MUTED }}>{result.formula}</span>
        <span style={{ color: TEXT_DIM, fontSize: 10 }}>→</span>
        <span style={{ color: TEXT_MAIN, fontWeight: 700, fontSize: 14 }}>{result.total}</span>
        {altInfo && <span style={{ color: TEXT_DIM, fontSize: 10 }}>{altInfo}</span>}
      </div>
      <div style={{ color: TEXT_DIMMER, fontSize: 10, marginTop: 1 }}>
        {result.rolls.map((g, i) => (
          <span key={i}>{i > 0 && ' + '}{g.die}[{g.values.join(',')}]</span>
        ))}
        {result.modifier !== 0 && (
          <span>{result.modifier > 0 ? ` +${result.modifier}` : ` ${result.modifier}`}</span>
        )}
      </div>
    </div>
  )
}

interface DicePanelProps {
  roomId: string | undefined
  onClose: () => void
}

const PANEL_WIDTH = 256
const PANEL_HEIGHT = 520

export default function DicePanel({ roomId, onClose }: DicePanelProps) {
  const {
    selected, modifier, rollMode, history,
    isRolling, lastError, formula, hasSelection,
    addDie, removeDie, clearDice,
    setModifier, setRollMode, roll,
  } = useDice(roomId ?? '')

  const [pos, setPos] = useState(() => ({
    x: 12,
    y: Math.max(0, window.innerHeight - PANEL_HEIGHT - 12),
  }))
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const onHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const pw = panelRef.current?.offsetWidth ?? PANEL_WIDTH
      const ph = panelRef.current?.offsetHeight ?? PANEL_HEIGHT
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, e.clientY - dragOffset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const [showManual, setShowManual] = useState(false)
  const [manualFormula, setManualFormula] = useState('')
  const manualRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (showManual) manualRef.current?.focus() }, [showManual])

  const handleManualRoll = useCallback(async () => {
    const f = manualFormula.trim()
    if (!f || !roomId) return

    const { myId } = usePermissionsStore.getState()
    const { players } = usePlayersStore.getState()
    const me = players.find((p: any) => p.id === myId)
    if (!me) return

    useDiceStore.getState().setIsRolling(true)

    try {
        await rollDice(roomId, {
        formula: f,
        playerId: me.id,
        playerName: me.username,
        playerColor: me.color,
        })
    } catch (err) {
        console.error('Manual roll failed:', err)
        useDiceStore.getState().setError(err instanceof Error ? err.message : 'Ошибка броска')
    } finally {
        useDiceStore.getState().setIsRolling(false)
    }

    setManualFormula('')
    setShowManual(false)
    }, [manualFormula, roomId])

  const label: React.CSSProperties = {
    fontSize: 10, color: TEXT_DIM,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
  }

  const modBtn: React.CSSProperties = {
    width: 22, height: 22, borderRadius: 4,
    border: BORDER, background: 'transparent',
    color: TEXT_MUTED, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: 0, lineHeight: 1,
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        width: PANEL_WIDTH,
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        color: TEXT_MAIN,
        fontFamily: 'inherit',
        zIndex: 200,
      }}
    >
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: BORDER,
          cursor: 'grab',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: ACCENT_LIGHT }}>
          <FaDiceD20 size={14} color={ACCENT_LIGHT} />
          Броски кубиков
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        <div>
          <div style={label}>Кубики · ЛКМ +1 · ПКМ −1</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {DIE_TYPES.map(type => (
              <DieButton key={type} type={type}
                count={selected[type] ?? 0}
                onAdd={() => addDie(type)}
                onRemove={() => removeDie(type)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: TEXT_DIM }}>Модификатор</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <button onClick={() => setModifier(modifier - 1)} style={modBtn}>−</button>
            <span style={{
              minWidth: 30, textAlign: 'center', fontSize: 13, fontWeight: 700,
              color: modifier > 0 ? '#86efac' : modifier < 0 ? '#fca5a5' : TEXT_DIM,
            }}>
              {modifier > 0 ? `+${modifier}` : modifier}
            </span>
            <button onClick={() => setModifier(modifier + 1)} style={modBtn}>+</button>
            {modifier !== 0 && (
              <button onClick={() => setModifier(0)} style={{ ...modBtn, fontSize: 10, color: TEXT_DIM }}>✕</button>
            )}
          </div>
        </div>

        <div>
          <div style={label}>Режим</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['normal', 'advantage', 'disadvantage'] as RollMode[]).map(mode => (
              <button key={mode} onClick={() => setRollMode(mode)}
                title={
                  mode === 'advantage' ? 'Два броска — лучший' :
                  mode === 'disadvantage' ? 'Два броска — худший' : 'Обычный'
                }
                style={{
                  flex: 1, padding: '4px 2px', borderRadius: 6,
                  border: rollMode === mode ? `1px solid ${ACCENT}` : BORDER,
                  background: rollMode === mode ? 'rgba(124,58,237,0.18)' : 'transparent',
                  color: rollMode === mode ? ACCENT_LIGHT : TEXT_DIM,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {mode === 'normal' ? '⚄ ' : mode === 'advantage' ? '▲ ' : '▼ '}
                {ROLL_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {hasSelection && (
          <div style={{
            background: '#0f172a', borderRadius: 6, padding: '4px 8px',
            fontSize: 12, color: ACCENT_LIGHT, fontFamily: 'monospace',
            border: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{formula}</span>
            <button onClick={clearDice}
              style={{ background: 'none', border: 'none', color: TEXT_DIMMER, cursor: 'pointer', fontSize: 12, padding: 0 }}>
              ✕
            </button>
          </div>
        )}

        {lastError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#fca5a5',
          }}>
            ⚠ {lastError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={roll}
            disabled={!hasSelection || isRolling}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8,
              border: hasSelection && !isRolling ? 'none' : BORDER,
              background: hasSelection && !isRolling
                ? `linear-gradient(135deg,${ACCENT},#6d28d9)` : 'transparent',
              color: hasSelection && !isRolling ? '#fff' : TEXT_DIMMER,
              fontWeight: 700, fontSize: 13,
              cursor: hasSelection && !isRolling ? 'pointer' : 'not-allowed',
              transition: 'all 0.12s',
            }}
          >
            {isRolling ? '…' : '🎲 Бросить'}
          </button>
          <button
            onClick={() => setShowManual(v => !v)}
            title="Ввести формулу вручную: 2d6+8d4+5"
            style={{
              padding: '7px 10px', borderRadius: 8,
              border: showManual ? `1px solid ${ACCENT}` : BORDER,
              background: showManual ? 'rgba(124,58,237,0.18)' : 'transparent',
              color: showManual ? ACCENT_LIGHT : TEXT_DIM,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            ƒ
          </button>
        </div>

        {showManual && (
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              ref={manualRef}
              value={manualFormula}
              onChange={e => setManualFormula(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleManualRoll()
                if (e.key === 'Escape') setShowManual(false)
              }}
              placeholder="2d6+8d4+5"
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6,
                border: BORDER, background: '#0f172a',
                color: TEXT_MAIN, fontSize: 12,
                fontFamily: 'monospace', outline: 'none',
              }}
            />
            <button
              onClick={handleManualRoll}
              disabled={!manualFormula.trim() || isRolling}
              style={{
                padding: '5px 10px', borderRadius: 6,
                border: manualFormula.trim() ? 'none' : BORDER,
                background: manualFormula.trim() ? ACCENT : 'transparent',
                color: manualFormula.trim() ? '#fff' : TEXT_DIMMER,
                fontSize: 12, fontWeight: 700,
                cursor: manualFormula.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              →
            </button>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={label}>История бросков</span>
            {history.length > 0 && (
              <button
                onClick={() => useDiceStore.getState().clearHistory()}
                style={{ background: 'none', border: 'none', color: TEXT_DIMMER, fontSize: 10, cursor: 'pointer', padding: 0 }}
              >
                очистить
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {history.length === 0
              ? <div style={{ color: TEXT_DIMMER, fontSize: 11, textAlign: 'center', padding: '8px 0' }}>Бросков ещё не было</div>
              : history.map(r => <HistoryItem key={r.id} result={r} />)
            }
          </div>
        </div>

      </div>
    </div>
  )
}