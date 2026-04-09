import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = 'dnd-vtt-secret-key'

// Auth
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    res.status(400).json({ message: 'Заполни все поля' }); return
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) { res.status(400).json({ message: 'Email уже занят' }); return }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { username, email, passwordHash } })
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET)
  res.json({ token, username })
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { res.status(400).json({ message: 'Пользователь не найден' }); return }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) { res.status(400).json({ message: 'Неверный пароль' }); return }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET)
  res.json({ token, username: user.username })
})

// Rooms
app.post('/rooms/create', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const room = await prisma.room.create({ data: { code, ownerId: payload.id } })
    res.json({ roomId: room.code })
  } catch {
    res.status(401).json({ message: 'Неверный токен' })
  }
})

// Socket.io
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

// Хранилище состояния комнат
const roomStates: Record<string, { tokens: Record<string, { id: string; x: number; y: number }> }> = {}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId)

    // Отправляем новому игроку текущее состояние токенов
    if (roomStates[roomId]) {
      socket.emit('room-state', roomStates[roomId])
    }

    socket.to(roomId).emit('player-joined', socket.id)
  })

  socket.on('token-move', (data: { roomId: string; id: string; x: number; y: number }) => {
    // Сохраняем позицию на сервере
    if (!roomStates[data.roomId]) {
      roomStates[data.roomId] = { tokens: {} }
    }
    roomStates[data.roomId].tokens[data.id] = { id: data.id, x: data.x, y: data.y }

    socket.to(data.roomId).emit('token-move', data)
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)
  })
})

httpServer.listen(3001, () => console.log('Backend running on http://localhost:3001'))