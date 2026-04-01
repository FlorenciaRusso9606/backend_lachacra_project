import { prisma } from "@/lib/prisma";

export async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.admin.deleteMany();
}