import { useState } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:3001'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      window.location.href = '/'
    } catch {
      setError('Ошибка соединения с сервером')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚔️ DND-VTT</h1>
        <h2 style={styles.subtitle}>Вход для Мастера</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} placeholder="Пароль" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <button style={styles.button} onClick={handleSubmit}>Войти</button>
        <p style={styles.link}>Нет аккаунта? <Link to="/register" style={{ color: '#a78bfa' }}>Зарегистрироваться</Link></p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#1a1a2e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#16213e', padding: 40, borderRadius: 12, width: 360, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { color: '#a78bfa', textAlign: 'center', margin: 0, fontSize: 28 },
  subtitle: { color: '#e2e8f0', textAlign: 'center', margin: 0, fontSize: 16, fontWeight: 'normal' },
  input: { background: '#0f3460', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  button: { background: '#7c3aed', border: 'none', borderRadius: 8, padding: '12px', color: 'white', fontSize: 15, cursor: 'pointer', fontWeight: 'bold' },
  error: { color: '#f87171', textAlign: 'center', margin: 0, fontSize: 13 },
  link: { color: '#94a3b8', textAlign: 'center', margin: 0, fontSize: 13 },
}