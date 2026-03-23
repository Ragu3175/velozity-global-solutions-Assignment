import { Response } from 'express'
import prisma from '../prisma'
import { AuthRequest } from '../middleware/auth'

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assigneeId, priority, dueDate, projectId } = req.body
    if (!title || !assigneeId || !priority || !dueDate || !projectId)
      return res.status(400).json({ error: 'All fields required' })

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return res.status(404).json({ error: 'Project not found' })

    if (req.user!.role === 'PM' && project.managerId !== req.user!.id)
      return res.status(403).json({ error: 'Access denied' })

    const task = await prisma.task.create({
      data: { title, description, assigneeId, priority, dueDate: new Date(dueDate), projectId, status: 'TODO' }
    })

    const notif = await prisma.notification.create({
      data: {
        user: { connect: { id: assigneeId } },
        task: { connect: { id: task.id } },
        message: `You have been assigned to task: ${title}`
      } as any
    })

    const io = req.app.get('io')

    if (io) {
      io.to(`user-${assigneeId}`).emit('notification', notif)
      io.to(`user-${assigneeId}`).emit('joinRoom', `task-${task.id}`)
      io.to(`user-${assigneeId}`).emit('joinRoom', `project-${task.projectId}`)
    }

    // Notify PM as well if Admin created the task
    if (req.user!.role === 'ADMIN' && project.managerId !== req.user!.id) {
      const pmNotif = await prisma.notification.create({
        data: {
          user: { connect: { id: project.managerId } },
          task: { connect: { id: task.id } },
          message: `New task "${title}" created in project "${project.name}"`
        } as any
      })
      if (io) {
        io.to(`user-${project.managerId}`).emit('notification', pmNotif)
        io.to(`user-${project.managerId}`).emit('joinRoom', `task-${task.id}`)
        io.to(`user-${project.managerId}`).emit('joinRoom', `project-${task.projectId}`)
      }
    }

    return res.status(201).json(task)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id } = req.user!
    const { status, priority, from, to } = req.query

    const where: any = {}
    if (role === 'DEVELOPER') where.assigneeId = id
    if (status) where.status = status
    if (priority) where.priority = priority
    if (from || to) {
      where.dueDate = {}
      if (from) where.dueDate.gte = new Date(from as string)
      if (to) where.dueDate.lte = new Date(to as string)
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: true, project: true },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
    })
    return res.json(tasks)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body
    const { id: userId, role } = req.user!

    const task = await prisma.task.findUnique({ where: { id: String(req.params.id) } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    if (role === 'DEVELOPER' && task.assigneeId !== userId)
      return res.status(403).json({ error: 'Access denied' })

    const oldStatus = task.status

    const updated = await prisma.task.update({
      where: { id: String(req.params.id) },
      data: { status },
      include: { assignee: true, project: true }
    })

    const log = await prisma.activityLog.create({
      data: {
        userId,
        projectId: task.projectId,
        taskId: task.id,
        fromStatus: oldStatus,
        toStatus: status,
        message: `Task "${task.title}" moved from ${oldStatus} → ${status}`
      }
    })

    const io = req.app.get('io')

    if (status === 'IN_REVIEW') {
      const project = await prisma.project.findUnique({ where: { id: task.projectId } })
      if (project) {
        const notif = await prisma.notification.create({
          data: {
            user: { connect: { id: project.managerId } },
            task: { connect: { id: task.id } },
            message: `Task "${task.title}" is ready for review`
          } as any
        })
        if (io) io.to(`user-${project.managerId}`).emit('notification', notif)
      }
    }

    // Notify PM if task is DONE
    if (status === 'DONE') {
      const project = await prisma.project.findUnique({ where: { id: task.projectId } })
      if (project && project.managerId !== userId) {
        const doneNotif = await prisma.notification.create({
          data: {
            user: { connect: { id: project.managerId } },
            task: { connect: { id: task.id } },
            message: `Task "${task.title}" has been completed`
          } as any
        })
        if (io) io.to(`user-${project.managerId}`).emit('notification', doneNotif)
      }
    }

    if (io) {
      io.to(`project-${task.projectId}`).emit('activityUpdate', {
        ...log,
        user: { id: userId, name: req.user!.name }
      })
    }

    return res.json(updated)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const getActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id: userId } = req.user!
    const projectId = req.params.projectId as string

    const where: any = {}
    
    if (projectId && projectId !== 'undefined') {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) return res.status(404).json({ error: 'Project not found' })
      if (role === 'PM' && project.managerId !== userId)
        return res.status(403).json({ error: 'Access denied' })
      where.projectId = projectId
    } else {
      // Global feed - filter based on role
      if (role === 'PM') {
        where.project = { managerId: userId }
      } else if (role === 'DEVELOPER') {
        where.task = { assigneeId: userId }
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true } } }
    })
    return res.json(logs)
  } catch (e) {
    console.error('Error fetching activity log:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}