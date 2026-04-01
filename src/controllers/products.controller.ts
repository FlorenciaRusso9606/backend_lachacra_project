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
  const { name, price, stock, weight, category, color } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new AppError("Nombre inválido", 400);
  }

  if (price == null || stock == null) {
    throw new AppError("Datos incompletos", 400);
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    throw new AppError("Precio inválido", 400);
  }

  if (isNaN(parsedStock) || parsedStock < 0) {
    throw new AppError("Stock inválido", 400);
  }

  const normalizedName = name.trim();
  const normalizedWeight =
    typeof weight === "string" && weight.trim() !== ""
      ? weight.trim().toLowerCase()
      : null;

  const existingProduct = await prisma.product.findFirst({
    where: {
      name: normalizedName,
      weight: normalizedWeight,
    },
  });
const displayName = name.trim()
  if (existingProduct) {
    throw new AppError("Producto duplicado", 409);
  }

  const data: {
    name: string;
    price: number;
    stock: number;
    weight?: string | null;
    category?: CategoryStatus;
    color?: string;
    imageUrl?: string;
  } = {
    name: displayName,
    price: parsedPrice,
    stock: parsedStock,
    ...(normalizedWeight !== null && { weight: normalizedWeight }),
  };

  if (normalizedWeight !== null) {
    data.weight = normalizedWeight;
  }

  if (category) {
    if (!Object.values(CategoryStatus).includes(category)) {
      throw new AppError("Categoría inválida", 400);
    }
    data.category = category;
  }

  if (color) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      throw new AppError("Color inválido", 400);
    }
    data.color = color;
  }

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
      }),
    );

    data.imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  const product = await prisma.product.create({ data });

  return res.status(201).json({
    ok: true,
    message: "Producto creado exitosamente",
    product,
  });
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
  const normalizedName =
    name !== undefined ? name.trim().toLowerCase() : product.name;

const normalizedWeight =
  weight === null || weight === undefined || (typeof weight === "string" && weight.trim() === "")
    ? null
    : weight.trim().toLowerCase();

  const existingProduct = await prisma.product.findFirst({
    where: {
      name: { equals: normalizedName, mode: "insensitive" },
        weight: normalizedWeight ?? null,
      NOT: { id },
    },
  });

  if (existingProduct) {
    throw new AppError("Producto duplicado", 409);
  }
  const data: {
    name?: string;
    price?: number;
    stock?: number;
    weight?: string | null;
    category?: CategoryStatus;
    color?: string;
    imageUrl?: string | null;
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new AppError("Nombre inválido", 400);
    }
    data.name = name.trim();
  }

  if (price !== undefined) data.price = Number(price);
  if (stock !== undefined) data.stock = Number(stock);
  if (weight !== undefined) {
    const normalized =
      typeof weight === "string" && weight.trim() !== ""
        ? weight.trim().toLowerCase()
        : null;

    data.weight = normalized;
  }

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

  if (req.file) {
    const file = req.file;

    const safeName = file.originalname.replace(/\s+/g, "-");
    const key = `products/${crypto.randomUUID()}-${safeName}`;

    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
      throw new AppError("Configuración S3 inválida", 500);
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new AppError("Archivo inválido", 400);
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
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
    const { insumo, stockActual } = req.body;

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
    return res.status(500).json({
      ok: false,
      message: "Error sincronizando stock",
    });
  }
};

export const getAllProductsAdmin = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  res.json(products);
};
