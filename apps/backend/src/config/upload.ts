import multer from 'multer'
import path from 'path'
import fs from 'fs'

export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')
export const TOKENS_DIR = path.join(UPLOADS_DIR, 'tokens')
if (!fs.existsSync(TOKENS_DIR)) fs.mkdirSync(TOKENS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, TOKENS_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname)
    const name = Math.random().toString(36).slice(2, 14) + ext
    cb(null, name)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Только изображения (png, jpg, webp, gif)'))
    }
  },
})