import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@test/setup/test-db";
import { seedTestData } from "@test/setup/setup";
import { paymentClient } from "@/services/mercadoPago.client";


vi.mock("@/services/mercadoPago.client", () => ({
  paymentClient: {
    get: vi.fn(),
  },
}));
beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
  vi.clearAllMocks();
});
describe("Webhook - POST /webhooks", () => {
  it("should process payment approved and update order", async () => {
  
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

    const res = await request(app)
      .post("/webhooks")
      .send(payload);

    expect(res.status).toBe(200);


       const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

expect(updatedPayment?.emailSent).toBe(true);
   expect(updatedPayment?.status).toBe("approved");
    expect(updatedPayment?.providerRef).toBe("mp_123");
    expect(updatedOrder?.status).toBe("paid");
  });
 it("should be idempotent (not process twice)", async () => {
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

    const first = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

    const res = await request(app).post("/webhooks").send(payload);

    expect(res.status).toBe(200);

    const second = await prisma.payment.findUnique({
      where: { id: payment.id },
    });

 
expect(second?.status).toBe("approved");
expect(second?.emailSent).toBe(true);
expect(second?.updatedAt).toEqual(first?.updatedAt);
  });

  it("should ignore non-payment events", async () => {
    const res = await request(app)
      .post("/webhooks")
      .send({ type: "other_event" });

    expect(res.status).toBe(200);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});