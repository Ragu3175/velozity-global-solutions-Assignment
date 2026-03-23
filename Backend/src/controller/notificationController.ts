import { Response } from 'express'
import prisma from '../prisma'
import { AuthRequest } from '../middleware/auth'

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(notifications)
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = String(req.params.id)

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })
    return res.json({ message: 'Marked as read' })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id },
      data: { read: true }
    })
    return res.json({ message: 'All marked as read' })
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}