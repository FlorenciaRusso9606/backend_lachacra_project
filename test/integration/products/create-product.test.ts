import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@test/setup/test-db";
import { seedTestData } from "@test/setup/setup";
import { vi } from "vitest";


vi.mock("@/lib/s3", () => ({
  s3: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

let token: string;

beforeEach(async () => {
  await resetDatabase();
  await seedTestData();

  const res = await request(app).post("/auth/login").send({
    email: "test@test.com",
    password: "123456",
  });

  token = res.body.token;
});


describe("Products - POST /admin/products", () => {
  it("should create a product with valid data", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Dulce de leche",
        price: 100,
        stock: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.product.name).toBe("Dulce de leche");
  });

  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 if price is negative", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test",
        price: -10,
        stock: 5,
      });

    expect(res.status).toBe(400);
  });
  it("should fail when creating duplicate product with same name and weight", async () => {
  await prisma.product.create({
    data: {
      name: "Dulce",
      price: 100,
      stock: 10,
      weight: "500g",
    },
  });

  const res = await request(app)
    .post("/admin/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Dulce",
      price: 150,
      stock: 5,
      weight: "500g",
    });

  expect(res.status).toBe(409);
});
it("should allow same name with different weight", async () => {
  await prisma.product.create({
    data: {
      name: "Dulce",
      price: 100,
      stock: 10,
      weight: "500g",
    },
  });

  const res = await request(app)
    .post("/admin/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Dulce",
      price: 150,
      stock: 5,
      weight: "1kg",
    });

  expect(res.status).toBe(201);
});
it("should fail when creating duplicate product with same name and null weight", async () => {
  await prisma.product.create({
    data: {
      name: "Dulce",
      price: 100,
      stock: 10,
      weight: null,
    },
  });

  const res = await request(app)
    .post("/admin/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Dulce",
      price: 150,
      stock: 5,
      weight: null,
    });

  expect(res.status).toBe(409);
});
it("should allow same name when one has weight and the other does not", async () => {
  await prisma.product.create({
    data: {
      name: "Dulce",
      price: 100,
      stock: 10,
      weight: null,
    },
  });

  const res = await request(app)
    .post("/admin/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Dulce",
      price: 150,
      stock: 5,
      weight: "500g",
    });

  expect(res.status).toBe(201);
});
});


describe("Products - image upload", () => {
  it("should upload image and create product", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("fake-image"), "test.png")
      .field("name", "Producto con imagen")
      .field("price", "100")
      .field("stock", "5");

    expect(res.status).toBe(201);
    expect(res.body.product.imageUrl).toBeDefined();
  });
});


afterAll(async () => {
  await prisma.$disconnect();
});