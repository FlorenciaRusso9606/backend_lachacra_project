import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../errors/AppError.js'
import { preferenceClient } from '../services/mercadoPago.client.js'

export const createMercadoPagoPayment = async (
  req: Request,
  res: Response
) => {
  const { orderId } = req.body

  if (!orderId) {
    throw new AppError('orderId es requerido', 400)
  }

  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
  })

  if (!order) {
    throw new AppError('Orden no encontrada', 404)
  }

  if (order.status !== 'pending') {
    throw new AppError('La orden no está disponible para pagar', 409)
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: 'mercado_pago',
      amount: order.total,
    },
  })

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
              id: `order-${order.id}`,
          title: `Orden #${order.id}`,
          quantity: 1,
          unit_price: order.total,
        },
      ],
      external_reference: payment.id.toString(),
      notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/failure`,
      },
      auto_return: 'approved',
    },
  })

  res.json({
    init_point: preference.init_point,
  })
}
