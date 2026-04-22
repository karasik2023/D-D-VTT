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
  res.json({ token, username, userId: user.id })
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { res.status(400).json({ message: 'Пользователь не найден' }); return }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) { res.status(400).json({ message: 'Неверный пароль' }); return }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET)
  res.json({ token, username: user.username, userId: user.id })
})

// Rooms
app.post('/rooms/create', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const name = req.body.name || 'Новая комната'
    const room = await prisma.room.create({ data: { code, ownerId: payload.id, name } })
    res.json({ roomId: room.code, name: room.name })
  } catch {
    res.status(401).json({ message: 'Неверный токен' })
  }
})

app.get('/rooms/my', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const rooms = await prisma.room.findMany({
      where: { ownerId: payload.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(rooms)
  } catch {
    res.status(401).json({ message: 'Неверный токен' })
  }
})

app.get('/rooms/joined', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const memberships = await prisma.roomMember.findMany({
      where: { userId: payload.id },
      include: { room: true },
      orderBy: { joinedAt: 'desc' }
    })
    const rooms = memberships
      .map(m => m.room)
      .filter(r => r.ownerId !== payload.id)
    res.json(rooms)
  } catch {
    res.status(401).json({ message: 'Неверный токен' })
  }
})

app.patch('/rooms/:code/rename', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const room = await prisma.room.findUnique({ where: { code: req.params.code } })
    if (!room || room.ownerId !== payload.id) { res.status(403).json({ message: 'Нет доступа' }); return }
    const updated = await prisma.room.update({
      where: { code: req.params.code },
      data: { name: req.body.name }
    })
    res.json(updated)
  } catch {
    res.status(401).json({ message: 'Неверный токен' })
  }
})

// Socket.io
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

interface RoomPlayer {
  id: string
  username: string
  color: string
  isGM: boolean
  connected: boolean
  socketId: string
}

const roomStates: Record<string, {
  tokens: Record<string, { id: string; x: number; y: number }>
  players: Record<string, RoomPlayer>
}> = {}

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)

  socket.on('join-room', async (data: string | { roomId: string; userId?: string; username?: string }) => {
    const roomId = typeof data === 'string' ? data : data.roomId
    const userId = typeof data === 'object' ? data.userId : undefined
    const username = typeof data === 'object' ? data.username : undefined

    socket.join(roomId)

    if (!roomStates[roomId]) {
      roomStates[roomId] = { tokens: {}, players: {} }
    }

    // Определяем GM — первый кто вошёл
    const isGM = Object.keys(roomStates[roomId].players).length === 0

    // Выбираем цвет
    const usedColors = Object.values(roomStates[roomId].players).map(p => p.color)
    const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[0]

    // Добавляем игрока
    const player: RoomPlayer = {
      id: userId || socket.id,
      username: username || 'Игрок',
      color,
      isGM,
      connected: true,
      socketId: socket.id,
    }
    roomStates[roomId].players[player.id] = player

    // Сохраняем данные на сокете для disconnect
    socket.data.roomId = roomId
    socket.data.playerId = player.id

    // Отправляем новому игроку текущее состояние
    socket.emit('room-state', { tokens: roomStates[roomId].tokens })
    socket.emit('room-players', Object.values(roomStates[roomId].players))

    // Сообщаем остальным о новом игроке
    socket.to(roomId).emit('player-joined', player)

    // Сохраняем в БД
    if (userId) {
      try {
        await prisma.roomMember.upsert({
          where: { roomCode_userId: { roomCode: roomId, userId } },
          update: { joinedAt: new Date() },
          create: { roomCode: roomId, userId },
        })
      } catch {}
    }
  })

  socket.on('token-move', (data: { roomId: string; id: string; x: number; y: number }) => {
    if (!roomStates[data.roomId]) {
      roomStates[data.roomId] = { tokens: {}, players: {} }
    }
    roomStates[data.roomId].tokens[data.id] = { id: data.id, x: data.x, y: data.y }
    socket.to(data.roomId).emit('token-move', data)
  })

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    const playerId = socket.data.playerId

    if (roomId && playerId && roomStates[roomId]?.players[playerId]) {
      roomStates[roomId].players[playerId].connected = false
      socket.to(roomId).emit('player-left', playerId)
    }

    console.log('Player disconnected:', socket.id)
  })
})

httpServer.listen(3001, () => console.log('Backend running on http://localhost:3001'))