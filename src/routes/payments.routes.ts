import { Router } from 'express'
import { createMercadoPagoPayment } from '../controllers/payment.controller'

const router = Router()

router.post('/mercadopago', createMercadoPagoPayment)

export default router
