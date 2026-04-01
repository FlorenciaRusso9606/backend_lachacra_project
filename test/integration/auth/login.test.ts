import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@test/setup/test-db";
import { seedTestData } from "@test/setup/setup";

beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});

describe("Auth - POST /auth/login", () => {
  it("should return 200 and token when credentials are valid", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("should return 401 when credentials are invalid", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@test.com",
      password: "wrongpass",
    });

    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});