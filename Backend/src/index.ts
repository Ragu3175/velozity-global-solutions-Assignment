process.on('uncaughtException', (err) => console.error('UNCAUGHT:', err))
process.on('unhandledRejection', (err) => console.error('UNHANDLED:', err))

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'

import authRoutes from './routes/auth'
import projectRoutes from './routes/project'
import taskRoutes from './routes/task'
import notificationRoutes from './routes/notification'
import { initSocket } from './sockets/index'
import { startOverdueJob } from './jobs/overdueTask'

const app = express()
const httpServer = createServer(app)

// Get cleaned frontend URL (strip trailing slashes and paths)
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '').split(/(?<=https?:\/\/[^\/]+)\//)[0]

export const io = new Server(httpServer, {
  cors: { origin: frontendUrl, credentials: true }
})

app.use(cors({ origin: frontendUrl, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.set('io', io)

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)

initSocket(io)
startOverdueJob()

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))