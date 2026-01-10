import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import bcrypt from 'bcrypt'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({ adapter })

async function main() {
  /*const password = process.env.ADMIN_PASSWORD || ""
  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.admin.upsert({
    where: { email:process.env.ADMIN_EMAIL },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "",
      name: 'Florencia Russo',
      hashedPassword: passwordHash,
    },
  })

  console.log('Admin seed creado / verificado')*/
  await prisma.product.createMany({
  data: [
    {
      name: "Producto Test",
      price: 1000,
      stock: 10
    }
  ]
})
}


main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
