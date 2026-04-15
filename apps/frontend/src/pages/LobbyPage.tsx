import { useState, useEffect } from 'react'

const API = 'http://localhost:3001'

interface Room {
  id: string
  code: string
  name: string
  createdAt: string
}

export default function LobbyPage() {
  const [tab, setTab] = useState<'gm' | 'player'>('gm')
  const [rooms, setRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const username = localStorage.getItem('username') || 'Мастер'
  const token = localStorage.getItem('token')

  const fetchRooms = async () => {
    const res = await fetch(`${API}/rooms/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (Array.isArray(data)) setRooms(data)
  }

  const fetchJoinedRooms = async () => {
    const res = await fetch(`${API}/rooms/joined`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (Array.isArray(data)) setJoinedRooms(data)
  }

  useEffect(() => { fetchRooms(); fetchJoinedRooms() }, [])

  const createRoom = async () => {
    setError('')
    const res = await fetch(`${API}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Новая комната' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    await fetchRooms()
  }

  const renameRoom = async (code: string) => {
    if (!editingName.trim()) return
    await fetch(`${API}/rooms/${code}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editingName }),
    })
    setEditingRoom(null)
    setEditingName('')
    await fetchRooms()
  }

  const joinRoom = () => {
    if (!joinCode.trim()) { setError('Введи код комнаты'); return }
    window.location.href = `/room/${joinCode.trim().toUpperCase()}`
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    window.location.href = '/login'
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.logo}>⚔️ DND-VTT</span>
        <div style={s.headerRight}>
          <span style={s.username}>🧙 {username}</span>
          <button style={s.logoutBtn} onClick={logout}>Выйти</button>
        </div>
      </div>

      <div style={s.content}>
        <div style={s.panel}>
          <h2 style={s.panelTitle}>Комнаты</h2>

          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab === 'gm' ? s.tabActive : {}) }} onClick={() => setTab('gm')}>GM</button>
            <button style={{ ...s.tab, ...(tab === 'player' ? s.tabActive : {}) }} onClick={() => setTab('player')}>PLAYER</button>
          </div>

          {tab === 'gm' && (
            <div>
              {error && <p style={s.error}>{error}</p>}
              <div style={s.roomGrid}>
                {rooms.map(room => (
                  <div key={room.id} style={s.roomCard}>
                    {editingRoom === room.code ? (
                      <div style={s.editRow}>
                        <input
                          style={s.editInput}
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && renameRoom(room.code)}
                          autoFocus
                        />
                        <button style={s.saveBtn} onClick={() => renameRoom(room.code)}>✓</button>
                        <button style={s.cancelBtn} onClick={() => setEditingRoom(null)}>✕</button>
                      </div>
                    ) : (
                      <div style={s.roomCardInner}>
                        <div style={s.roomInfo}>
                          <span style={s.roomName}>{room.name}</span>
                          <span style={s.roomCode}>{room.code}</span>
                        </div>
                        <div style={s.roomActions}>
                          <button style={s.editBtn} onClick={() => {
                            setEditingRoom(room.code)
                            setEditingName(room.name)
                          }}>✏️</button>
                          <button style={s.enterBtn} onClick={() => window.location.href = `/room/${room.code}`}>
                            Войти →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button style={s.createBtn} onClick={createRoom}>+ Создать комнату</button>
            </div>
          )}

          {tab === 'player' && (
            <div>
              {joinedRooms.length > 0 && (
                <div style={s.roomGrid}>
                  {joinedRooms.map(room => (
                    <div key={room.id} style={s.roomCard}>
                      <div style={s.roomCardInner}>
                        <div style={s.roomInfo}>
                          <span style={s.roomName}>{room.name}</span>
                          <span style={s.roomCode}>{room.code}</span>
                        </div>
                        <button style={s.enterBtn} onClick={() => window.location.href = `/room/${room.code}`}>
                          Войти →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={s.joinDesc}>Войти в новую комнату по коду</p>
              {error && <p style={s.error}>{error}</p>}
              <div style={s.joinRow}>
                <input
                  style={s.joinInput}
                  placeholder="Код комнаты"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()}
                  maxLength={6}
                />
                <button style={s.joinBtn} onClick={joinRoom}>Войти</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { background: '#1a1a2e', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '1px solid #1e293b' },
  logo: { color: '#a78bfa', fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  username: { color: '#a78bfa', fontFamily: 'monospace', fontSize: 14 },
  logoutBtn: { background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  content: { flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 20px' },
  panel: { background: '#16213e', borderRadius: 12, padding: 32, width: '100%', maxWidth: 860 },
  panelTitle: { color: '#e2e8f0', margin: '0 0 20px', fontSize: 20 },
  tabs: { display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: 24 },
  tab: { background: 'transparent', border: 'none', padding: '10px 32px', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, borderBottom: '2px solid transparent' },
  tabActive: { color: '#a78bfa', borderBottom: '2px solid #a78bfa' },
  roomGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  roomCard: { background: '#0f3460', borderRadius: 8, padding: '14px 18px' },
  roomCardInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roomInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  roomName: { color: '#e2e8f0', fontSize: 15, fontWeight: 'bold' },
  roomCode: { color: '#64748b', fontSize: 12, fontFamily: 'monospace' },
  roomActions: { display: 'flex', gap: 8, alignItems: 'center' },
  editBtn: { background: 'transparent', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  enterBtn: { background: '#7c3aed', border: 'none', borderRadius: 6, padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 13 },
  editRow: { display: 'flex', gap: 8, alignItems: 'center' },
  editInput: { flex: 1, background: '#1a1a2e', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  saveBtn: { background: '#22c55e', border: 'none', borderRadius: 6, padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: 14 },
  cancelBtn: { background: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: 14 },
  createBtn: { width: '100%', background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '12px', color: '#a78bfa', cursor: 'pointer', fontSize: 14, letterSpacing: 1 },
  joinDesc: { color: '#94a3b8', marginBottom: 16, fontSize: 14 },
  joinRow: { display: 'flex', gap: 10 },
  joinInput: { flex: 1, background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 16, outline: 'none', letterSpacing: 4, fontFamily: 'monospace' },
  joinBtn: { background: '#7c3aed', border: 'none', borderRadius: 8, padding: '10px 24px', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 'bold' },
  error: { color: '#f87171', fontSize: 13, marginBottom: 12 },
}