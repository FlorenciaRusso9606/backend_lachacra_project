import nodemailer from 'nodemailer'
import { OrderEmailPayload } from '../types/OrderEmailPayload'
import 'dotenv/config'

console.log('[MAIL ENV CHECK]', {
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
})

export const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, // STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10_000,
})

console.log('[MAIL CONFIG]', {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
})

export async function sendNewOrderEmail(order: OrderEmailPayload) {
  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_ADMIN,
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
}

export async function sendCustomerOrderEmail(order: OrderEmailPayload) {
  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: order.email,
    replyTo: process.env.MAIL_ADMIN,
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
}
