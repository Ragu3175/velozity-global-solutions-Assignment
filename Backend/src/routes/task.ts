import { Router } from 'express'
import { createTask, getTasks, updateTaskStatus, getActivityLog } from '../controller/taskController'
import { authenticate, authorize } from '../middleware/auth'
import prisma from '../prisma'

const router = Router()

router.use(authenticate)

// ⚠️ Static routes MUST come before /:id routes to avoid pattern conflicts
router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } })
    res.json(users)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/clients', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany()
    res.json(clients)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', getTasks)
router.post('/', authorize('ADMIN', 'PM'), createTask)
router.patch('/:id/status', updateTaskStatus)
router.get('/activity', getActivityLog)
router.get('/project/:projectId/activity', getActivityLog)

export default router