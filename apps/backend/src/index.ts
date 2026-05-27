import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { roomsRouter } from './routes/rooms'
import { assetsRouter } from './routes/assets'
import { diceRouter } from './routes/dice'
import { UPLOADS_DIR } from './config/upload'
import { registerPlayerHandlers } from './sockets/playerHandlers'
import { registerTokenHandlers } from './sockets/tokenHandlers'
import { registerInitiativeHandlers } from './sockets/initiativeHandlers'
import { registerPermissionHandlers } from './sockets/permissionHandlers'
import { registerDiceHandlers } from './sockets/diceHandlers'
import { registerFogHandlers } from './sockets/fogHandlers' // ← НОВЫЙ

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

// REST routes
app.use('/auth', authRouter)
app.use('/rooms', roomsRouter)
app.use('/assets', assetsRouter)
app.use('/dice', diceRouter)

// Socket.io
const httpServer = createServer(app)
export const io = new Server(httpServer, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)

  registerPlayerHandlers(io, socket)
  registerTokenHandlers(io, socket)
  registerInitiativeHandlers(io, socket)
  registerPermissionHandlers(io, socket)
  registerDiceHandlers(io, socket)
  registerFogHandlers(io, socket) // ← НОВЫЙ
})

httpServer.listen(3001, () => console.log('Backend running on http://localhost:3001'))