import { Request, Response } from 'express'
import { paymentClient } from '../services/mercadoPago.client.js'
import { prisma } from '../lib/prisma.js'

export const mercadoPagoWebhook = async (
  req: Request,
  res: Response
) => {
  const { type, data } = req.body

  if (type !== 'payment') {
    return res.sendStatus(204)
  }

  const mpPayment = await paymentClient.get({
    id: data.id,
  })

  const externalRef = mpPayment.external_reference
  const status = mpPayment.status

  if (!externalRef) {
    return res.sendStatus(400)
  }

  const paymentId = Number(externalRef)

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })

  if (!payment) {
    return res.sendStatus(404)
  }

  // Idempotencia
  if (payment.status === 'approved') {
    return res.sendStatus(200)
  }
if (!mpPayment.id) {
  return res.sendStatus(400)
}
  if (status === 'approved') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'approved',
          providerRef: mpPayment.id.toString(),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' },
      }),
    ])
  } else {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        providerRef: mpPayment.id.toString(),
      },
    })
  }

  res.sendStatus(200)
}
