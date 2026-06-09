import { Request, Response } from 'express'
import { paymentClient } from '../services/mercadoPago.client.js'
import { prisma } from '../lib/prisma.js'
import { OrderItem } from '@prisma/client'
import { logger } from '../lib/logger.js'

import {
  sendNewOrderEmail,
  sendCustomerOrderEmail,
} from '../services/email.service.js'

const log = logger.child({ module: 'mp-webhook' })

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  log.info('incoming webhook')


  const dataId =
    req.body?.data?.id ??
    req.query?.['data.id'] ??
    req.query?.id

  if (!dataId) {
    log.info('no dataId, ignoring')
    return res.sendStatus(200)
  }

  if (req.body?.type && req.body.type !== 'payment') {
    log.info({ type: req.body.type }, 'not a payment event, ignoring')
    return res.sendStatus(200)
  }


  let mpPayment

  try {
    mpPayment = await paymentClient.get({
      id: dataId,
      requestOptions: { timeout: 5000 },
    })
  } catch {
    log.error({ dataId }, 'error fetching payment from MP')
    return res.sendStatus(200)
  }

  if (
    !mpPayment?.id ||
    !mpPayment?.status ||
    typeof mpPayment.transaction_amount !== 'number'
  ) {
    log.error({ mpPaymentId: mpPayment?.id }, 'invalid MP payment payload')
    return res.sendStatus(200)
  }


  const externalRef = mpPayment.external_reference
  const numericExternalRef =
    typeof externalRef === 'string' ? Number(externalRef) : NaN

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        Number.isNaN(numericExternalRef)
          ? undefined
          : { id: numericExternalRef },
        { providerRef: mpPayment.id.toString() },
      ].filter(Boolean) as any,
    },
  })

  if (!payment) {
    log.error({ dataId }, 'payment not found in DB')
    return res.sendStatus(200)
  }


  if (payment.amount !== mpPayment.transaction_amount) {
    log.error({ paymentId: payment.id, expected: payment.amount, received: mpPayment.transaction_amount }, 'amount mismatch')
    return res.sendStatus(200)
  }


  if (mpPayment.status === 'approved') {
    log.info({ paymentId: payment.id }, 'payment approved')

    const updated = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        NOT: {
          status: 'approved',
          emailSent: true,
        },
      },
      data: {
        status: 'approved',
        providerRef: mpPayment.id.toString(),
        emailSent: true,
      },
    })

    if (updated.count === 0) {
      log.info({ paymentId: payment.id }, 'already processed, skipping')
      return res.sendStatus(200)
    }

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'paid' },
    })

    try {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: { include: { product: true } },
        },
      })

      if (order) {
        await sendNewOrderEmail(order)
        await sendCustomerOrderEmail(order)
      }
    } catch (err) {
      log.error({ err, orderId: payment.orderId }, 'error sending emails')
    }

    return res.sendStatus(200)
  }


  if (mpPayment.status === 'pending' || mpPayment.status === 'in_process') {
    log.info({ paymentId: payment.id, status: mpPayment.status }, 'payment pending/in_process')
    return res.sendStatus(200)
  }


  log.info({ paymentId: payment.id, status: mpPayment.status }, 'payment rejected/cancelled')

  const items: OrderItem[] = await prisma.orderItem.findMany({
    where: { orderId: payment.orderId },
  })

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'rejected',
        providerRef: mpPayment.id.toString(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'cancelled' },
    }),
    ...items.map(item =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      })
    ),
  ])

  return res.sendStatus(200)
}