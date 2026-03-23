import { Router } from 'express'
import { register, login, refresh, logout } from '../controller/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', authenticate, logout)

export default router