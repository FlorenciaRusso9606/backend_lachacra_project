import { Router } from "express";
import {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/products.controller";
import { authenticateJWT } from "../../middlewares/auth";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllProductsAdmin);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
