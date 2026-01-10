import { Request, Response } from 'express'
import { paymentClient } from '../services/mercadoPago.client.js'
import { prisma } from '../lib/prisma.js'
import { validateMercadoPagoSignature } from '../utils/validateMercadoPagoSignature.js'
import { AppError } from '../errors/AppError'

export const mercadoPagoWebhook = async (
  req: Request,
  res: Response
) => {

 //Autenticidad
 
  const signature = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (
    typeof signature !== 'string' ||
    typeof requestId !== 'string'
  ) {
    return res.sendStatus(401)
  }

      const rawBody = (req as any).rawBody 
const isValidSignature = validateMercadoPagoSignature({
  signature,
  requestId,
  rawBody: rawBody.toString(),
  secret: process.env.MP_WEBHOOK_SECRET!,
})

  if (!isValidSignature) {
    return res.sendStatus(403)
  }

  

//Filtro del evento   
const dataId =
  req.body?.data?.id ??
  req.query?.['data.id'] ??
  req.query?.id

if (!dataId) {
  return res.sendStatus(200)
}
if (req.body?.type && req.body.type !== 'payment') {
  return res.sendStatus(200)
}
 // MP
let mpPayment

  try {
    mpPayment = await paymentClient.get({ id: dataId , requestOptions: { timeout: 5000 }})
  } catch {
     throw new AppError('[MP] Error al obtener payment', 200)
  
  }
  const externalRef = mpPayment.external_reference
  const status = mpPayment.status

  if (
    !mpPayment.id ||
    !mpPayment.external_reference ||
    !mpPayment.status ||
    typeof mpPayment.transaction_amount !== 'number'
  ) {
    return res.sendStatus(400)
  }

//Coherencia interna
  const paymentId = Number(externalRef)
 if (Number.isNaN(paymentId)) {
    return res.sendStatus(400)
  }
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })

if (!payment) {
  console.log('Payment no existe en DB', paymentId)
  return res.sendStatus(200)
}

  //Chequeo del monto
  if (payment.amount !== mpPayment.transaction_amount) {
     console.log('Monto distinto', {
    local: payment.amount,
    mp: mpPayment.transaction_amount,
  });
    return res.sendStatus(409)
  }

  
  // Idempotencia
  if (payment.status === 'approved') {
    return res.sendStatus(200)
  }
 
  //Transición del estado
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
