import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@test/setup/test-db";
import { seedTestData } from "@test/setup/setup";
import { paymentClient } from "@/services/mercadoPago.client";
import {
  sendNewOrderEmail,
  sendCustomerOrderEmail,
} from "@/services/email.service";
import { vi, beforeEach, describe, it, expect, afterAll } from "vitest";

vi.mock("@/services/mercadoPago.client", () => ({
  paymentClient: {
    get: vi.fn(),
  },
}));

vi.mock("@/services/email.service", () => ({
  sendNewOrderEmail: vi.fn(),
  sendCustomerOrderEmail: vi.fn(),
}));


beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
  vi.clearAllMocks();
});


describe("Webhook - POST /webhooks", () => {
  it("should process payment approved, update order and send emails", async () => {
    const order = await prisma.order.create({
      data: {
        total: 100,
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60),
        customerName: "Test",
        email: "test@test.com",
        province: "RN",
        city: "Roca",
        postalCode: "8332",
        addressLine1: "123",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "mercado_pago",
        status: "pending",
        amount: 100,
      },
    });

    (paymentClient.get as any).mockResolvedValue({
      id: "mp_123",
      status: "approved",
      external_reference: payment.id.toString(),
      transaction_amount: 100,
    });

    const payload = {
      type: "payment",
      data: { id: payment.id },
    };

    const res = await request(app).post("/webhooks").send(payload);

    expect(res.status).toBe(200);

    const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedPayment?.status).toBe("approved");
    expect(updatedPayment?.emailSent).toBe(true);
    expect(updatedPayment?.providerRef).toBe("mp_123");
    expect(updatedOrder?.status).toBe("paid");

    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    expect(sendCustomerOrderEmail).toHaveBeenCalledTimes(1);
  });

  it("should be idempotent and not send emails twice", async () => {
    const order = await prisma.order.create({
      data: {
        total: 100,
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60),
        customerName: "Test",
        email: "test@test.com",
        province: "RN",
        city: "Roca",
        postalCode: "8332",
        addressLine1: "123",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "mercado_pago",
        status: "pending",
        amount: 100,
      },
    });

    (paymentClient.get as any).mockResolvedValue({
      id: "mp_123",
      status: "approved",
      external_reference: payment.id.toString(),
      transaction_amount: 100,
    });

    const payload = {
      type: "payment",
      data: { id: payment.id },
    };

    await request(app).post("/webhooks").send(payload);
    await request(app).post("/webhooks").send(payload);

    const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

    expect(updatedPayment?.status).toBe("approved");
    expect(updatedPayment?.emailSent).toBe(true);

    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    expect(sendCustomerOrderEmail).toHaveBeenCalledTimes(1);
  });

  it("should ignore non-payment events", async () => {
    const res = await request(app)
      .post("/webhooks")
      .send({ type: "other_event" });

    expect(res.status).toBe(200);
  });

  it("should restore stock when payment is rejected", async () => {
  const product = await prisma.product.create({
    data: {
      name: "Producto test",
      price: 100,
      stock: 10,
    },
  });

  const order = await prisma.order.create({
    data: {
      total: 200,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60),
      customerName: "Test",
      email: "test@test.com",
      province: "RN",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "123",
      items: {
        create: [
          {
            productId: product.id,
            quantity: 2,
            price: 100,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { stock: 8 },
  });


  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "mercado_pago",
      status: "pending",
      amount: 200,
    },
  });


  (paymentClient.get as any).mockResolvedValue({
    id: "mp_123",
    status: "rejected",
    external_reference: payment.id.toString(),
    transaction_amount: 200,
  });

  const payload = {
    type: "payment",
    data: { id: payment.id },
  };


  const res = await request(app).post("/webhooks").send(payload);

  expect(res.status).toBe(200);

 
  const updatedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });

  expect(updatedPayment?.status).toBe("rejected");


  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
  });

  expect(updatedOrder?.status).toBe("cancelled");

 
  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id },
  });

  expect(updatedProduct?.stock).toBe(10); // volvió al original
});
});


afterAll(async () => {
  await prisma.$disconnect();
});