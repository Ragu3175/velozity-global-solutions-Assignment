import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

export const initSocket = (io: Server) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('No token'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
      socket.data.user = decoded
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket: Socket) => {
    const { id, role } = socket.data.user

    // Join personal room for notifications
    socket.join(`user-${id}`)

    if (role === 'ADMIN') {
      // Admin joins all project rooms
      const projects = await prisma.project.findMany()
      projects.forEach(p => socket.join(`project-${p.id}`))
      socket.join('global-feed')
    }

    if (role === 'PM') {
      // PM joins only their projects
      const projects = await prisma.project.findMany({ where: { managerId: id } })
      projects.forEach(p => socket.join(`project-${p.id}`))
    }

    if (role === 'DEVELOPER') {
      // Developer joins rooms for assigned tasks and their projects
      const tasks = await prisma.task.findMany({ where: { assigneeId: id } })
      tasks.forEach(t => {
        socket.join(`task-${t.id}`)
        socket.join(`project-${t.projectId}`) // receive activityUpdate events
      })
    }

    // Send missed activity logs (last 20)
    const logs = await prisma.activityLog.findMany({
      where: role === 'ADMIN' ? {} :
        role === 'PM' ? { project: { managerId: id } } :
        { task: { assigneeId: id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    })
    socket.emit('missedEvents', logs.reverse())

    // Allow clients to join rooms dynamically (e.g. after new assignment)
    socket.on('joinRoom', (room: string) => {
      socket.join(room)
    })

    // Live online user count for admin
    if (role === 'ADMIN') {
      const onlineCount = io.sockets.sockets.size
      io.emit('onlineCount', onlineCount)
    }

    socket.on('disconnect', () => {
      if (role === 'ADMIN') {
        const onlineCount = io.sockets.sockets.size
        io.emit('onlineCount', onlineCount)
      }
    })
  })
}