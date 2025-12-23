import { Request, Response } from "express";
import { prisma } from '../lib/prisma'
import { AppError } from "../errors/AppError";

export const getProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { active: true },
  })

  res.json(products)
}
export const createProduct = async (req: Request, res: Response) => {
  const { name, price, stock } = req.body

  if (!name || price == null || stock == null) {
    throw new AppError('Datos incompletos', 400)
  }

  const product = await prisma.product.create({
    data: { name, price, stock },
  })

  res.status(201).json(product)
}

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    throw new AppError('ID inválido', 400)
  }

  const product = await prisma.product.update({
    where: { id },
    data: req.body,
  })

  res.json(product)
}

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    throw new AppError('ID inválido', 400)
  }

  await prisma.product.update({
    where: { id },
    data: { active: false },
  })

  res.json({ message: 'Product disabled' })
}

