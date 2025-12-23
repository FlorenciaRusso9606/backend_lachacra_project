import { Request, Response } from "express";
import { prisma } from '../lib/prisma'
import { AppError } from '../errors/AppError.js'

export const createOrder = async (req: Request, res: Response) => {
  const { items } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items inválidos', 400)
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: { in: items.map((i: any) => i.productId) },
        active: true,
      },
    })

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)

      if (!product) {
        throw new AppError(`Producto ${item.productId} no existe`, 404)
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Stock insuficiente para ${product.name}`,
          409
        )
      }
    }

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      })
    }

    const total = products.reduce((sum, product) => {
      const item = items.find((i: any) => i.productId === product.id)!
      return sum + product.price * item.quantity
    }, 0)

    return tx.order.create({
      data: {
        total,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products.find(p => p.id === item.productId)!.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })
  })

  res.status(201).json(order)
}

