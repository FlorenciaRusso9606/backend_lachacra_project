import { Request, Response } from "express";
import { prisma } from '../lib/prisma'
import { AppError } from '../errors/AppError'
import { OrderStatus } from '@prisma/client'


export const getAllOrders = async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return res.status(200).json(orders)
}
export const getOrdersByStatus = async (req: Request, res: Response) => {
  const { status } = req.query

  if (!status) {
    throw new AppError('status es requerido', 400)
  }
 if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
    throw new AppError('Estado de orden inválido', 400)
  }
  const orders = await prisma.order.findMany({
    where: {
      status: status as OrderStatus,
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.status(200).json(orders)
}
export const getOrdersByDate = async (req: Request, res: Response) => {
  const { from, to } = req.query

  if (!from || !to) {
    throw new AppError('from y to son requeridos', 400)
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(from as string),
        lte: new Date(to as string),
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.status(200).json(orders)
}
export const getOrderDetail = async (req: Request, res: Response) => {
  const { id } = req.params

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
    },
  })

  if (!order) {
    throw new AppError('Orden no encontrada', 404)
  }

  return res.status(200).json(order)
}
export const getPaymentsByOrder = async (req: Request, res: Response) => {
  const { id } = req.params

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      payments: true,
    },
  })

  if (!order) {
    throw new AppError('Orden no encontrada', 404)
  }

  return res.status(200).json(order.payments)
}

export const createOrder = async (req: Request, res: Response) => {
const { items, customerName, email } = req.body

if (!customerName || !email) {
  throw new AppError('Nombre y email son requeridos', 400)
}
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items inválidos', 400)
  }

const order = await prisma.$transaction(async (tx: typeof prisma) => {
    const products = await tx.product.findMany({
      where: {
        id: { in: items.map((i: any) => i.productId) },
        active: true,
      },
    })

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.productId)

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

const total = products.reduce((sum: number, product: any) => {
      const item = items.find((i: any) => i.productId === product.id)!
      return sum + product.price * item.quantity
    }, 0)
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    return tx.order.create({
      data: {
        total,
        status: OrderStatus.pending,
        customerName,
        email,
        expiresAt,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products.find((p:any) => p.id === item.productId)!.price,
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

