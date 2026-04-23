import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { JWT_SECRET } from '../config/constants'

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
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

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { res.status(400).json({ message: 'Пользователь не найден' }); return }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) { res.status(400).json({ message: 'Неверный пароль' }); return }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET)
  res.json({ token, username: user.username, userId: user.id })
})