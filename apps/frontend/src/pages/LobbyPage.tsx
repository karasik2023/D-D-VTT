import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:3001'

export default function LobbyPage() {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || 'Мастер'

  const createRoom = async () => {
    setError('')
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    window.location.href = `/room/${data.roomId}`
  }

  const joinRoom = () => {
    if (!roomCode.trim()) { setError('Введи код комнаты'); return }
    window.location.href = `/room/${roomCode.trim()}`
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    window.location.href = '/login'
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚔️ DND-VTT</h1>
        <div style={styles.user}>
          <span style={{ color: '#a78bfa' }}>🧙 {username}</span>
          <button style={styles.logoutBtn} onClick={logout}>Выйти</button>
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Создать комнату</h2>
          <p style={styles.cardDesc}>Ты будешь Мастером подземелий. Игроки присоединятся по ссылке.</p>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.primaryBtn} onClick={createRoom}>⚔️ Создать комнату</button>
        </div>
        <div style={styles.divider}>или</div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Войти в комнату</h2>
          <p style={styles.cardDesc}>Введи код комнаты от Мастера.</p>
          <input style={styles.input} placeholder="Код комнаты" value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && joinRoom()} />
          <button style={styles.secondaryBtn} onClick={joinRoom}>🗺️ Войти</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1e293b' },
  title: { color: '#a78bfa', margin: 0, fontSize: 24 },
  user: { display: 'flex', alignItems: 'center', gap: 16, color: '#e2e8f0', fontFamily: 'monospace' },
  logoutBtn: { background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  content: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flex: 1, padding: 40, flexWrap: 'wrap' },
  card: { background: '#16213e', padding: 32, borderRadius: 12, width: 300, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTitle: { color: '#e2e8f0', margin: 0, fontSize: 18 },
  cardDesc: { color: '#94a3b8', margin: 0, fontSize: 13, lineHeight: 1.5 },
  input: { background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  primaryBtn: { background: '#7c3aed', border: 'none', borderRadius: 8, padding: '12px', color: 'white', fontSize: 15, cursor: 'pointer', fontWeight: 'bold' },
  secondaryBtn: { background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '12px', color: '#e2e8f0', fontSize: 15, cursor: 'pointer' },
  divider: { color: '#475569', fontSize: 14 },
  error: { color: '#f87171', margin: 0, fontSize: 13 },
}