import { Response } from 'express'
import prisma from '../prisma'
import { AuthRequest } from '../middleware/auth'

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, clientId, managerId } = req.body
    if (!name || !clientId)
      return res.status(400).json({ error: 'Name and clientId required' })

    const assignedManager = req.user!.role === 'ADMIN' && managerId
      ? managerId
      : req.user!.id

    const project = await prisma.project.create({
      data: { name, description, clientId, managerId: assignedManager }
    })

    const io = req.app.get('io')

    // Notify assigned manager if it's someone else (Admin -> PM case)
    if (req.user!.role === 'ADMIN' && managerId && managerId !== req.user!.id) {
      try {
        const notif = await prisma.notification.create({
          data: {
            user: { connect: { id: assignedManager } },
            message: `You have been assigned as manager for project: ${name}`
          } as any
        })
        if (io) {
          io.to(`user-${assignedManager}`).emit('notification', notif)
          io.to(`user-${assignedManager}`).emit('joinRoom', `project-${project.id}`)
        }
      } catch (notifErr) {
        console.error('Failed to send project assignment notification:', notifErr)
      }
    }

    return res.status(201).json(project)
  } catch (e) {
    console.error('Error creating project:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id } = req.user!
    const projects = await prisma.project.findMany({
      where: role === 'ADMIN' ? {} : { managerId: id },
      include: {
        client: true,
        manager: { select: { name: true } },
        tasks: { include: { assignee: { select: { name: true } } } }
      }
    })
    return res.json(projects)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId, role } = req.user!
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: {
        client: true,
        manager: { select: { name: true } },
        tasks: { include: { assignee: { select: { name: true } } } }
      }
    })

    if (!project) return res.status(404).json({ error: 'Project not found' })
    if (role === 'PM' && project.managerId !== userId)
      return res.status(403).json({ error: 'Access denied' })

    return res.json(project)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId, role } = req.user!
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: { tasks: { select: { id: true } } }
    })

    if (!project) return res.status(404).json({ error: 'Project not found' })
    if (role === 'PM' && project.managerId !== userId)
      return res.status(403).json({ error: 'Access denied' })

    const taskIds = project.tasks.map(t => t.id)

    await prisma.$transaction([
      // 1. Delete notifications related to the project's tasks
      prisma.notification.deleteMany({ where: { taskId: { in: taskIds } } }),
      // 2. Delete activity logs of the project and its tasks
      prisma.activityLog.deleteMany({ where: { projectId: project.id } }),
      // 3. Delete tasks of the project
      prisma.task.deleteMany({ where: { projectId: project.id } }),
      // 4. Finally delete the project
      prisma.project.delete({ where: { id: project.id } })
    ])

    return res.json({ message: 'Project deleted' })
  } catch (e) {
    console.error('Project deletion failed:', e)
    return res.status(500).json({ error: 'Server error' })
  }
}