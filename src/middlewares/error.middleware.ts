import { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"
import { logger } from "../lib/logger"

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    })
  }

  logger.error({ err }, 'unhandled error')

  return res.status(500).json({
    error: 'Internal server error',
  })
}
