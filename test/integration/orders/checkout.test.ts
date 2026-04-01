import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@test/setup/test-db";
import { seedTestData } from "@test/setup/setup";

beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});

describe("Orders - POST /orders (checkout)", () => {

  it("should create an order with correct total and items", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Producto test",
        price: 50,
        stock: 10,
      },
    });

    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [{ productId: product.id, quantity: 2 }],
    });

    expect(res.status).toBe(201);

    const order = await prisma.order.findFirst({
      where: { email: "flor@test.com" },
      include: { items: true },
    });

    expect(order).toBeDefined();
    expect(order?.total).toBe(100);
    expect(order?.items.length).toBe(1);
    expect(order?.items[0].quantity).toBe(2);
  });

  it("should reduce product stock after purchase", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Stock test",
        price: 100,
        stock: 5,
      },
    });

    await request(app).post("/orders").send({
      customerName: "Test",
      email: "test@test.com",
      province: "RN",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "123",
      items: [{ productId: product.id, quantity: 2 }],
    });

    const updated = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(updated?.stock).toBe(3);
  });

  it("should fail if product does not exist", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [{ productId: 9999, quantity: 1 }],
    });

    expect(res.status).toBe(404);
  });

  it("should fail if items array is empty", async () => {
    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [],
    });

    expect(res.status).toBe(400);
  });

  it("should fail if stock is insufficient", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Sin stock",
        price: 100,
        stock: 1,
      },
    });

    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [{ productId: product.id, quantity: 5 }],
    });

    expect(res.status).toBe(409);
  });

  it("should fail if quantity is zero", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Test",
        price: 100,
        stock: 10,
      },
    });

    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [{ productId: product.id, quantity: 0 }],
    });

    expect(res.status).toBe(400);
  });

  it("should fail if quantity is negative", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Test",
        price: 100,
        stock: 10,
      },
    });

    const res = await request(app).post("/orders").send({
      customerName: "Flor",
      email: "flor@test.com",
      province: "Rio Negro",
      city: "Roca",
      postalCode: "8332",
      addressLine1: "Calle 123",
      items: [{ productId: product.id, quantity: -1 }],
    });

    expect(res.status).toBe(400);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});