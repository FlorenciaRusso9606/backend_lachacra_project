import { Request, Response } from 'express'
import { paymentClient } from '../services/mercadoPago.client.js'
import { prisma } from '../lib/prisma.js'
import { validateMercadoPagoSignature } from '../utils/validateMercadoPagoSignature.js'

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  const isDev = process.env.NODE_ENV !== 'production'

  console.log('[MP WEBHOOK] Incoming webhook')

  /* 
     FIRMA (solo producción)
     
if (!isDev) {
    const signature = req.headers['x-signature']
    const requestId = req.headers['x-request-id']

    if (typeof signature !== 'string' || typeof requestId !== 'string') {
      console.error('[MP WEBHOOK] Missing signature headers')
      return res.sendStatus(200) // siempre 200 a MP
    }

    const rawBody = (req as any).rawBody

    const isValidSignature = validateMercadoPagoSignature({
      signature,
      requestId,
      rawBody: rawBody?.toString() ?? '',
      secret: process.env.MP_WEBHOOK_SECRET!,
    })

    if (!isValidSignature) {
      console.error('[MP WEBHOOK] Invalid signature')
      return res.sendStatus(200)
    }
  }*/

  /* 
     FILTRO DEL EVENTO
     */
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

  /* 
     CONSULTA A MP
      */
  let mpPayment

  try {
    mpPayment = await paymentClient.get({
      id: dataId,
      requestOptions: { timeout: 5000 },
    })
  } catch (err) {
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

  /*
     BUSCAR PAYMENT LOCAL
     */
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
    console.error('[MP WEBHOOK] Payment not found in DB', {
      externalRef,
      mpPaymentId: mpPayment.id,
    })
    return res.sendStatus(200)
  }

  /*     CHEQUEO DE MONTO */
  if (payment.amount !== mpPayment.transaction_amount) {
    console.error('[MP WEBHOOK] Amount mismatch', {
      local: payment.amount,
      mp: mpPayment.transaction_amount,
    })
    return res.sendStatus(200)
  }

  /*
     IDEMPOTENCIA
     */
  if (payment.status === 'approved') {
    console.log('[MP WEBHOOK] Payment already approved, skipping')
    return res.sendStatus(200)
  }

  /* 
     TRANSICIÓN DE ESTADO
      */
  const status = mpPayment.status

  if (status === 'approved') {
    console.log('[MP WEBHOOK] Approving payment', payment.id)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
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
  } else if (status === 'pending' || status === 'in_process') {
    console.log('[MP WEBHOOK] Payment pending/in_process, waiting')
    return res.sendStatus(200)
  } else {
    console.log('[MP WEBHOOK] Payment rejected/cancelled', status)

    const items = await prisma.orderItem.findMany({
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
  }

  console.log('[MP WEBHOOK] Webhook processed successfully')
  res.sendStatus(200)
}
