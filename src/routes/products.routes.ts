import { Router } from 'express'
import { getProducts, createProduct } from '../controllers/products.controller.js'
import { authenticateJWT } from '../middlewares/auth'
const router = Router()

router.get('/', getProducts)
router.post('/', authenticateJWT, createProduct)


export default router
