import { Router } from 'express'
import { createOrder, getAllOrders, getOrdersByStatus , getOrdersByDate, getOrderDetail, getPaymentsByOrder    } from '../controllers/orders.controller'
import { authenticateJWT } from '../middlewares/auth'
const router = Router()

router.post('/', authenticateJWT, createOrder)
router.get('/', authenticateJWT, (req, res) => {
  if (req.query.status) {
    return getOrdersByStatus(req, res)
  }

  if (req.query.from && req.query.to) {
    return getOrdersByDate(req, res)
  }

  return getAllOrders(req, res)
})

router.get('/:id', authenticateJWT, getOrderDetail)

router.get('/:id/payments', authenticateJWT, getPaymentsByOrder)
export default router

