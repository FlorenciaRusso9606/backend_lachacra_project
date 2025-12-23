import { Request, Response } from "express";
import { prisma } from '../lib/prisma'
import { AppError } from "../errors/AppError";
export const createAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email y password requeridos', 400)
  }

  const admin = await prisma.admin.create({
    data: { name, email, password },
  })

  res.status(201).json(admin)
}
