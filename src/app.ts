import express from 'express'
import productsRoutes from './routes/products.routes'
import orderRoutes from './routes/orders.routes'
import paymentRoutes from './routes/payments.routes'
import { errorMiddleware } from './middlewares/error.middleware'

export const app = express()
app.use(express.json())

app.use('/products', productsRoutes)
app.use('/orders', orderRoutes)
app.use('/payments', orderRoutes)
app.use(errorMiddleware)
