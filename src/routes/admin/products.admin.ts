import { Router } from "express";
import {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../controllers/products.controller";
import { authenticateJWT } from "../../middlewares/auth";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllProductsAdmin);
router.post("/", createProduct);
router.put("/:id", authenticateJWT, upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
