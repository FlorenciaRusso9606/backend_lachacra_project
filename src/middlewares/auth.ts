import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from '../lib/prisma'
import { AppError } from "../errors/AppError";
import { Admin } from "../types/Admin";
declare global {
  namespace Express {
    interface Request {
      user?: Admin
    }
  }
}
export const authenticateJWT = async(req:Request, res:Response, next: NextFunction) =>{

    const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1]: null)

    if (!token) throw new AppError("No hay token provisto", 401)
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    const admin = await prisma.admin.findUnique({
        where: {
            id: payload.id
        }
    })
    if(!admin) throw new AppError("Usuario no encontrado", 401)
        req.user = admin

     next()
}

