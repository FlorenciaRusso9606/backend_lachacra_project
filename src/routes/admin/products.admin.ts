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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/products");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); 
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllProductsAdmin);
router.post("/", createProduct);
router.put("/:id", authenticateJWT, upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
