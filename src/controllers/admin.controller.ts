import { Request, Response } from "express";
import { prisma } from '../lib/prisma'
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import { AppError } from "../errors/AppError";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en .env");
}
export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email y password requeridos', 400)
  }

  const admin= await prisma.admin.findUnique({where: {email: email}})

  if(!admin) throw  new AppError("El usuario no existe", 404)
   const match = await bcrypt.compare(password, admin.hashedPassword);
    if (!match) {
      throw new AppError("La contraseña es incorrecta.", 401);
    }
  const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
 const cookieOptions = {
      httpOnly: true,
     secure: process.env.NODE_ENV === "production",
       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as any;
        res.cookie("token", token, cookieOptions);
const { hashedPassword, ...safeAdmin } = admin;
  res.status(200).json(safeAdmin)
}


export const getUser = async (req: Request, res:Response) =>{
  const idUser = req.user?.id
  const user = await prisma.admin.findUnique({where: {
    id: idUser,
  },})
  if(!user) throw new AppError('Usuario no encontrado', 404)
    res.json({
  id: user.id,
  email: user.email,
  name: user.name
  })
}

export const logoutAdmin = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
       secure: process.env.NODE_ENV === "production",
     sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Logout exitoso" });
};


