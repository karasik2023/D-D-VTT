import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { JWT_SECRET } from '../config/constants'

export const roomsRouter = Router()

roomsRouter.post('/create', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const name = req.body.name || 'Новая комната'
    const room = await prisma.room.create({ data: { code, ownerId: payload.id, name } })
    res.json({ roomId: room.code, name: room.name })
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})

roomsRouter.get('/my', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const rooms = await prisma.room.findMany({ where: { ownerId: payload.id }, orderBy: { createdAt: 'desc' } })
    res.json(rooms)
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})

roomsRouter.get('/joined', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const memberships = await prisma.roomMember.findMany({
      where: { userId: payload.id },
      include: { room: true },
      orderBy: { joinedAt: 'desc' }
    })
    const rooms = memberships.map(m => m.room).filter(r => r.ownerId !== payload.id)
    res.json(rooms)
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})

roomsRouter.patch('/:code/rename', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const room = await prisma.room.findUnique({ where: { code: req.params.code } })
    if (!room || room.ownerId !== payload.id) { res.status(403).json({ message: 'Нет доступа' }); return }
    const updated = await prisma.room.update({ where: { code: req.params.code }, data: { name: req.body.name } })
    res.json(updated)
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})