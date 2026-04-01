import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function seedTestData() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.admin.upsert({
    where: { email: "test@test.com" },
    update: { hashedPassword },  
    create: {
      name: "Test Admin",
      email: "test@test.com",
      hashedPassword,
    },
  });
}