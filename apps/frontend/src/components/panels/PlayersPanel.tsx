// apps/frontend/src/components/panels/PlayersPanel.tsx
import { usePlayersStore } from '../../stores/playersStore'

export default function PlayersPanel() {
  const { players } = usePlayersStore()

  if (players.length === 0) {
    return <p style={{ color: '#475569', fontSize: 11, margin: 0, textAlign: 'center' }}>— нет игроков —</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.map(player => (
        <div 
          key={player.id} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '6px 8px', 
            background: player.isGM ? '#1e1b4b' : '#0f3460',  // 🔥 GM выделен фоном
            borderRadius: 8,
            border: player.isGM ? '1px solid #a78bfa' : '1px solid transparent'
          }}
        >
          <div 
            style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: player.connected ? player.color : '#475569', 
              flexShrink: 0,
              border: player.isGM ? '2px solid #fbbf24' : 'none'  // 🔥 GM с золотой рамкой
            }} 
          />
          <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1, fontWeight: player.isGM ? 600 : 400 }}>
            {player.username}
          </span>
          
          {/* 🔥 МЕТКА ДМ */}
          {player.isGM && (
            <span style={{ 
              color: '#fbbf24', 
              fontSize: 10, 
              background: 'rgba(251, 191, 36, 0.1)', 
              borderRadius: 4, 
              padding: '2px 6px',
              fontWeight: 700,
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              ДМ
            </span>
          )}
          
          {!player.connected && (
            <span style={{ color: '#475569', fontSize: 10, fontStyle: 'italic' }}>
              офлайн
            </span>
          )}
        </div>
      ))}
    </div>
  )
}