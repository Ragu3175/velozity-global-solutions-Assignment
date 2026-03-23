import { Router } from 'express'
import { createProject, getProjects, getProjectById, deleteProject } from '../controller/projectController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', getProjects)
router.get('/:id', getProjectById)
router.post('/', authorize('ADMIN', 'PM'), createProject)
router.delete('/:id', authorize('ADMIN', 'PM'), deleteProject)

export default router