import { Router } from 'express'

const router = Router()

router.post('/sync-stock', async (req, res) => {
  console.log('Stock recibido desde Sheets:', req.body)

  return res.status(200).json({
    ok: true,
    received: req.body,
  })
})

export default router