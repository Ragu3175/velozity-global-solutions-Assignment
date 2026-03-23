import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controller/notificationController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', getNotifications)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)

export default router