import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({ adapter })

async function main() {
  const password = process.env.ADMIN_PASSWORD || ""
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

  console.log('Admin seed creado / verificado')
  await prisma.product.createMany({
    data: [
      { name: "Dulce de pera", price: 8000, stock: 0, weight:"460g"},
      { name: "Dulce de manzana", price: 8000, stock: 0, weight:"460g"},
      { name: "Dulce de durazno", price: 9000, stock: 0, weight:"460g"},
      { name: "Dulce de frutilla", price: 13000, stock: 0 , weight:"460g"},
      { name: "Dulce de higo", price: 9000, stock: 0 , weight:"460g"},
  { name: "Puré de manzana", price: 16000, stock: 0 , weight:"460g"},
  { name: "Puré de ciruela", price: 16000, stock: 0 , weight:"460g"},
    ],
    skipDuplicates: true
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
