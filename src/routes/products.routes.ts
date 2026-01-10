import { Router } from 'express'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller.js'
import { authenticateJWT } from '../middlewares/auth'
const router = Router()

router.get('/', getProducts)
router.post('/', authenticateJWT, createProduct)
router.put('/:id', authenticateJWT, updateProduct)
router.delete('/:id', authenticateJWT, deleteProduct)


export default router
