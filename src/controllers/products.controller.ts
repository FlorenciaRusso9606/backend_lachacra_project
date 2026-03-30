import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { CategoryStatus } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import crypto from "node:crypto";

export const getProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { active: true },
  });

  res.json(products);
};
export const createProduct = async (req: Request, res: Response) => {
  const { name, price, stock } = req.body;

  if (!name || price == null || stock == null) {
    throw new AppError("Datos incompletos", 400);
  }

  const product = await prisma.product.create({
    data: { name, price, stock },
  });

  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    throw new AppError("ID inválido", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const { name, price, stock, weight, category, color, removeImage } = req.body;

  const data: {
    name?: string;
    price?: number;
    stock?: number;
    weight?: string;
    category?: CategoryStatus;
    color?: string;
    imageUrl?: string | null;
  } = {};

  if (name) data.name = name;
  if (price !== undefined) data.price = Number(price);
  if (stock !== undefined) data.stock = Number(stock);
  if (weight !== undefined) data.weight = String(weight);

  if (category !== undefined) {
    if (!Object.values(CategoryStatus).includes(category)) {
      throw new AppError("Categoría inválida", 400);
    }
    data.category = category;
  }

  if (color !== undefined) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      throw new AppError("Color inválido", 400);
    }
    data.color = color;
  }

  const shouldRemoveImage =
    removeImage === "true" || removeImage === true || removeImage === "1";

  // Manejo de imagen
  if (req.file) {
    const file = req.file;

    const safeName = file.originalname.replace(/\s+/g, "-");
    const key = `products/${crypto.randomUUID()}-${safeName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    data.imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } else if (shouldRemoveImage) {
    data.imageUrl = null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  res.json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    throw new AppError("ID inválido", 400);
  }

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  res.json({ message: "Product disabled" });
};

export const syncStock = async (req: Request, res: Response) => {
  try {
    const { insumo, stockActual, secret } = req.body;

    if (!insumo || typeof stockActual !== "number") {
      return res.status(400).json({ ok: false, message: "Datos inválidos" });
    }

    const parts = insumo.trim().split(" ");
    const weight = parts[parts.length - 1];
    const name = parts.slice(0, -1).join(" ");

    const product = await prisma.product.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        weight: { equals: weight, mode: "insensitive" },
        active: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: `Producto no encontrado: "${name}" con peso "${weight}"`,
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { stock: stockActual },
    });

    return res.json({
      ok: true,
      action: "updated",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("sync-stock error:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error sincronizando stock" });
  }
};
export const getAllProductsAdmin = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  res.json(products);
}
