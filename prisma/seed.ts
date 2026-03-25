import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  
  /*const password = process.env.ADMIN_PASSWORD || ""
  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "",
      name: 'Florencia Russo',
      hashedPassword: passwordHash,
    },
  })
  */

  await prisma.product.createMany({
    data: [
       /*{ name: "Dulce de pera", price: 10000, stock: 0, weight: "500g", category: "DULCE", color: "#9bcb88" },
      { name: "Dulce de manzana", price: 10000, stock: 0, weight: "500g", category: "DULCE", color: "#b01a2f" },
      { name: "Dulce de durazno", price: 10000, stock: 0, weight: "500g", category: "DULCE", color: "#95cad3" },
      { name: "Dulce de frutilla", price: 15000, stock: 0, weight: "500g", category: "DULCE", color: "#b01a2f" },
      { name: "Dulce de ciruela", price: 10000, stock: 0, weight: "500g", category: "DULCE", color: "#3d0f4f" },

      // 250g
      { name: "Dulce de pera", price: 7000, stock: 0, weight: "250g", category: "DULCE", color: "#9bcb88" },
      { name: "Dulce de manzana", price: 7000, stock: 0, weight: "250g", category: "DULCE", color: "#b01a2f" },
      { name: "Dulce de durazno", price: 7000, stock: 0, weight: "250g", category: "DULCE", color: "#95cad3" },
      { name: "Dulce de frutilla", price: 10000, stock: 0, weight: "250g", category: "DULCE", color: "#b01a2f" },
      { name: "Dulce de ciruela", price: 10000, stock: 0, weight: "250g", category: "DULCE", color: "#3d0f4f" },

      // 100g
      { name: "Dulce de pera", price: 5000, stock: 0, weight: "100g", category: "DULCE", color: "#9bcb88" },
      { name: "Dulce de manzana", price: 5000, stock: 0, weight: "100g", category: "DULCE", color: "#9bcb88" },
      { name: "Dulce de durazno", price: 5000, stock: 0, weight: "100g", category: "DULCE", color: "#95cad3" },
      { name: "Dulce de frutilla", price: 7000, stock: 0, weight: "100g", category: "DULCE", color: "#e1ac48" },
      { name: "Dulce de ciruela", price: 5000, stock: 0, weight: "100g", category: "DULCE", color: "#3d0f4f" },*/
       { name: "Confitura de naranja", price: 15000, stock: 0, weight: "300g", category: "CONFITURA", color: "#e1ac48" },
         { name: "Dulce de pelón", price: 15000, stock: 0, weight: "300g", category: "DULCE", color: "#e1ac48" }
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