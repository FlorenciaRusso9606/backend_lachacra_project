import { Router } from 'express'
import { createMercadoPagoPayment, getAllPayments , getFailedPayments, getPendingPayments  } from '../controllers/payment.controller'
import { authenticateJWT } from '../middlewares/auth'
const router = Router()

router.post('/mercadopago', createMercadoPagoPayment)
router.get('/', authenticateJWT, getAllPayments )
router.get('/failed', authenticateJWT, getFailedPayments )
router.get('/pending', authenticateJWT, getPendingPayments )

export default router
