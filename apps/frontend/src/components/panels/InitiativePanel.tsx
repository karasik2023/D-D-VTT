import { MdClear } from 'react-icons/md'
import { useInitiativeStore } from '../../stores/initiativeStore'
import { useRoom } from '../../hooks/useRoom'

interface Props {
  roomId: string | undefined
}

export default function InitiativePanel({ roomId }: Props) {
  const { entries } = useInitiativeStore()
  const { removeFromInitiative, updateInitiative, clearInitiative } = useRoom(roomId)

  const sorted = [...entries].sort((a, b) => {
    if (a.initiative === null) return 1
    if (b.initiative === null) return -1
    return b.initiative - a.initiative
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#64748b', fontSize: 11 }}>ПКМ по токену чтобы добавить</span>
        {sorted.length > 0 && (
          <button onClick={clearInitiative} title="Очистить" style={{ color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MdClear size={14} color="#64748b" /> Сбросить
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— список пуст —</p>
      ) : (
        sorted.map((entry, index) => (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
            background: index === 0 ? '#1e1b4b' : '#0f3460', borderRadius: 8,
            border: index === 0 ? '1px solid #a78bfa' : '1px solid transparent'
          }}>
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
            <button onClick={() => removeFromInitiative(entry.id)} style={{ color: '#475569', fontSize: 12, flexShrink: 0 }}>✕</button>
          </div>
        ))
      )}
    </div>
  )
}