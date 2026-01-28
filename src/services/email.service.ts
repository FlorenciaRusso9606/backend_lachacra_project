import { Resend } from "resend";
import { OrderEmailPayload } from "../types/OrderEmailPayload";

const FROM = process.env.MAIL_FROM ?? "La Chacra <no-reply@resend.dev>";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function assertAdminEmail() {
  if (!process.env.MAIL_ADMIN_EMAIL) {
    throw new Error("Missing MAIL_ADMIN_EMAIL");
  }
}

export async function sendNewOrderEmail(order: OrderEmailPayload) {
  assertAdminEmail();
  const resend = getResendClient();

  const result =  await resend.emails.send({
    from: FROM,
    to: process.env.MAIL_ADMIN_EMAIL!,
    subject: `🛒 Nueva compra #${order.id} – La Chacra`,
    html: `
      <h2>Nueva compra recibida</h2>
      <p><strong>Cliente:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.email}</p>

      <h3>Productos</h3>
      <ul>
        ${order.items
          .map(i => `<li>${i.product.name} x ${i.quantity}</li>`)
          .join("")}
      </ul>

      <p><strong>Total:</strong> $${order.total}</p>
    `,
  });
  console.log('[EMAIL] Resend response', result)
}

export async function sendCustomerOrderEmail(order: OrderEmailPayload) {
  const resend = getResendClient();

 const result =  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: "✅ Recibimos tu pedido – La Chacra",
    html: `
      <h2>¡Gracias por tu compra!</h2>
      <p>Hola <strong>${order.customerName}</strong>,</p>

      <p>
        Recibimos correctamente tu pedido.
        En breve nos vamos a contactar para coordinar la entrega.
      </p>

      <p><strong>Total:</strong> $${order.total}</p>
    `,
  });
  console.log('[EMAIL] Resend response', result)
}
