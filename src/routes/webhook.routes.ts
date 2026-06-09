import { Router } from "express"
import { mercadoPagoWebhook } from "../controllers/webhook.controller"

const router = Router()

router.post('/', mercadoPagoWebhook)

export default router
