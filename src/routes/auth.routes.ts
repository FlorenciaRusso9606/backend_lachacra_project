import { Router } from 'express'
import { loginAdmin, logoutAdmin, getUser } from '../controllers/admin.controller'
import { authenticateJWT } from '../middlewares/auth'
const router = Router()

router.post('/login', loginAdmin)
router.get('/me',authenticateJWT, getUser )
router.get('/logout',logoutAdmin )


export default router

