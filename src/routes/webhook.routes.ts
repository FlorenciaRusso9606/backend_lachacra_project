import { Router } from 'express'
import { mercadoPagoWebhook } from '../controllers/webhook.controller.js'

const router = Router()

router.post('/webhooks/mercadopago', mercadoPagoWebhook)

export default router
