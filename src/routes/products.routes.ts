import { Router } from "express"
import { getProducts, createProduct, updateProduct, MAX_PRODUCT_IMAGE_SIZE } from "../controllers/products.controller"
import { authenticateJWT } from "../middlewares/auth"
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_SIZE },
});


const router = Router()

router.get('/', getProducts)
router.post('/', authenticateJWT, createProduct)
router.put("/:id", authenticateJWT, upload.single("image"), updateProduct);

export default router
