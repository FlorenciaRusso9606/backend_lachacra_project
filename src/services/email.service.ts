import nodemailer from 'nodemailer'
import { OrderEmailPayload } from '../types/OrderEmailPayload'
import 'dotenv/config'

const MAIL_HOST = process.env.MAIL_HOST
const MAIL_PORT = Number(process.env.MAIL_PORT)
const MAIL_USER = process.env.MAIL_USER
const MAIL_PASS = process.env.MAIL_PASS
const MAIL_FROM = process.env.MAIL_FROM
const MAIL_ADMIN = process.env.MAIL_ADMIN

if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS || !MAIL_FROM || !MAIL_ADMIN) {
  throw new Error('❌ Missing mail environment variables')
}

export const mailer = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_PORT === 465,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
  connectionTimeout: 10_000,
})

// Verificación de conexión (una sola vez al iniciar el server)
export async function verifyMailer() {
  try {
    await mailer.verify()
    if (process.env.NODE_ENV !== 'production') {
      console.log('📨 Mailer ready')
    }
  } catch (error) {
    console.error('❌ Mailer verification failed', error)
  }
}

export async function sendNewOrderEmail(order: OrderEmailPayload) {
  try {
    await mailer.sendMail({
      from: MAIL_FROM,
      to: MAIL_ADMIN,
      subject: `🛒 Nueva compra #${order.id} – La Chacra`,
      html: `
        <h2>Nueva compra recibida</h2>
        <p><strong>Cliente:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.email}</p>

        <h3>Productos</h3>
        <ul>
          ${order.items
            .map((i) => `<li>${i.product.name} x ${i.quantity}</li>`)
            .join('')}
        </ul>

        <p><strong>Total:</strong> $${order.total}</p>
      `,
    })
  } catch (error) {
    console.error(`❌ Error sending admin order email (order #${order.id})`, error)
  }
}

export async function sendCustomerOrderEmail(order: OrderEmailPayload) {
  try {
    await mailer.sendMail({
      from: MAIL_FROM,
      to: order.email,
      replyTo: MAIL_ADMIN,
      subject: '✅ Recibimos tu pedido – La Chacra',
      html: `
        <h2>¡Gracias por tu compra!</h2>
        <p>Hola <strong>${order.customerName}</strong>,</p>

        <p>
          Recibimos correctamente tu pedido.
          En breve nos vamos a contactar para coordinar la entrega.
        </p>

        <h3>Resumen</h3>
        <ul>
          ${order.items
            .map((i) => `<li>${i.product.name} x ${i.quantity}</li>`)
            .join('')}
        </ul>

        <p><strong>Total:</strong> $${order.total}</p>

        <p>Gracias por elegir productos artesanales 💚</p>
      `,
    })
  } catch (error) {
    console.error(`❌ Error sending customer order email (order #${order.id})`, error)
  }
}
