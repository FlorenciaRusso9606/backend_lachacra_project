import { Request, Response, NextFunction } from "express"

export function stockAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization

  if (!token || token !== `Bearer ${process.env.STOCK_SYNC_TOKEN}`) {
    return res.status(401).json({
      ok: false,
      message: "Stock sync sin autorización"
    })
  }

  next()
}
