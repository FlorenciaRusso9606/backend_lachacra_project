import { Router } from 'express'
import { syncStock } from '../controllers/products.controller'
import { stockAuth } from "../middlewares/stockAuth"
const router = Router()

router.post('/sync-stock',stockAuth , syncStock)

export default router