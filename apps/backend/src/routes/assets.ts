import { Router } from 'express'
import jwt from 'jsonwebtoken'
import path from 'path'
import fs from 'fs'
import { prisma } from '../config/prisma'
import { JWT_SECRET } from '../config/constants'
import { upload, UPLOADS_DIR } from '../config/upload'

export const assetsRouter = Router()

assetsRouter.post('/tokens/upload', upload.single('file'), async (req: any, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  if (!req.file) { res.status(400).json({ message: 'Файл не загружен' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const asset = await (prisma as any).asset.create({
      data: {
        userId: payload.id,
        type: 'TOKEN',
        name: req.body.name || req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/tokens/${req.file.filename}`,
        size: req.file.size,
      }
    })
    res.json(asset)
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})

assetsRouter.get('/tokens', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const tokens = await (prisma as any).asset.findMany({
      where: { userId: payload.id, type: 'TOKEN' },
      orderBy: { createdAt: 'desc' }
    })
    res.json(tokens)
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})

assetsRouter.delete('/:id', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) { res.status(401).json({ message: 'Не авторизован' }); return }
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { id: string }
    const asset = await (prisma as any).asset.findUnique({ where: { id: req.params.id } })
    if (!asset || asset.userId !== payload.id) { res.status(403).json({ message: 'Нет доступа' }); return }
    const filePath = path.join(UPLOADS_DIR, 'tokens', asset.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await (prisma as any).asset.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch { res.status(401).json({ message: 'Неверный токен' }) }
})