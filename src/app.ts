import express from 'express'
import productsRoutes from './routes/products.routes'
import orderRoutes from './routes/orders.routes'
import paymentRoutes from './routes/payments.routes'
import webhooksRoutes from './routes/webhook.routes'
import AuthRoutes from "./routes/auth.routes"
import StockRoutes from "./routes/stock.routes"
import { errorMiddleware } from './middlewares/error.middleware'
import rateLimit from 'express-rate-limit'
export const app = express()
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf
    },
  })
)
console.log('NOTIFICATION URL:', process.env.API_URL + '/webhooks/mercadopago')

app.use('/products', productsRoutes)
app.use('/orders', orderRoutes)
app.use('/payments', paymentRoutes)
app.use(StockRoutes)

app.use(
  '/webhooks/mercadopago',
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  })
)
app.use('/webhooks', webhooksRoutes)
app.use('/auth', AuthRoutes)
app.use(errorMiddleware)
