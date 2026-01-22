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


export const syncStock = async (req: Request, res: Response) => {
  try {
    const { insumo, stockActual } = req.body

    if (!insumo || typeof stockActual !== "number") {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos"
      })
    }

    const product = await prisma.product.findUnique({
     where: { name: insumo.trim() }

    })

    if (!product) {
    return res.status(404).json({
      ok: false,
      message: `Producto no encontrado: ${insumo}`
    })
  }

    const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: { stock: stockActual }
  })


    return res.json({
      ok: true,
      action: "updated",
      product: updatedProduct
    })

  } catch (error) {
    console.error("sync-stock error:", error)

    return res.status(500).json({
      ok: false,
      message: "Error sincronizando stock"
    })
  }
}
export const getAllProductsAdmin = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  res.json(products);
};
