import { Request, Response } from 'express'
import { paymentClient } from '../services/mercadoPago.client.js'
import { prisma } from '../lib/prisma.js'
import { OrderItem } from '@prisma/client'

import {
  sendNewOrderEmail,
  sendCustomerOrderEmail,
} from '../services/email.service.js'

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  console.log('[MP WEBHOOK] Incoming webhook')

  /* ======================================================
     FILTRO DEL EVENTO
  ====================================================== */
  const dataId =
    req.body?.data?.id ??
    req.query?.['data.id'] ??
    req.query?.id

  if (!dataId) {
    console.log('[MP WEBHOOK] No dataId, ignoring')
    return res.sendStatus(200)
  }

  if (req.body?.type && req.body.type !== 'payment') {
    console.log('[MP WEBHOOK] Not a payment event, ignoring')
    return res.sendStatus(200)
  }

  /* ======================================================
     CONSULTA A MERCADO PAGO
  ====================================================== */
  let mpPayment

  try {
    mpPayment = await paymentClient.get({
      id: dataId,
      requestOptions: { timeout: 5000 },
    })
  } catch {
    console.error('[MP WEBHOOK] Error fetching payment from MP', dataId)
    return res.sendStatus(200)
  }

  console.log('[MP WEBHOOK] MP payment fetched', {
    id: mpPayment.id,
    status: mpPayment.status,
    external_reference: mpPayment.external_reference,
    amount: mpPayment.transaction_amount,
  })

  if (
    !mpPayment.id ||
    !mpPayment.status ||
    typeof mpPayment.transaction_amount !== 'number'
  ) {
    console.error('[MP WEBHOOK] Invalid MP payment payload')
    return res.sendStatus(200)
  }

  /* ======================================================
     BUSCAR PAYMENT LOCAL
  ====================================================== */
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
    console.error('[MP WEBHOOK] Payment not found in DB')
    return res.sendStatus(200)
  }

  /* ======================================================
     CHEQUEO DE MONTO
  ====================================================== */
  if (payment.amount !== mpPayment.transaction_amount) {
    console.error('[MP WEBHOOK] Amount mismatch')
    return res.sendStatus(200)
  }

  /* ======================================================
     ESTADO: APPROVED (IDEMPOTENTE)
  ====================================================== */
  if (mpPayment.status === 'approved') {
    console.log('[MP WEBHOOK] Payment approved event', payment.id)

    if (payment.status === 'approved' && payment.emailSent) {
      console.log('[MP WEBHOOK] Payment already processed, skipping')
      return res.sendStatus(200)
    }

    /* ======================================================
       ACTUALIZACIÓN ATÓMICA (CRÍTICA)
    ====================================================== */
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'approved',
          providerRef: mpPayment.id.toString(),
          emailSent: true, 
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' },
      }),
    ])

    /* ======================================================
       ENVÍO DE EMAILS (FUERA DE LA TRANSACCIÓN)
    ====================================================== */
    try {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: { include: { product: true } },
        },
      })

      if (!order) {
        console.error('[MP WEBHOOK] Order not found')
        return res.sendStatus(200)
      }

      await sendNewOrderEmail(order)
      await sendCustomerOrderEmail(order)

      console.log('[EMAIL] Emails sent successfully')
    } catch (err) {
      console.error('[EMAIL] Error sending emails', err)
    }

    return res.sendStatus(200)
  }

  /* ======================================================
     PENDING
  ====================================================== */
  if (mpPayment.status === 'pending' || mpPayment.status === 'in_process') {
    console.log('[MP WEBHOOK] Payment pending/in_process')
    return res.sendStatus(200)
  }

  /* ======================================================
     RECHAZADO / CANCELADO
  ====================================================== */
  console.log('[MP WEBHOOK] Payment rejected/cancelled', mpPayment.status)

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

  console.log('[MP WEBHOOK] Webhook processed successfully')
  return res.sendStatus(200)
}
