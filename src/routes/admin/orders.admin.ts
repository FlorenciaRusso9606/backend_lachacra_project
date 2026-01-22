import { Router } from "express";
import {
  getAllOrders,
  getOrdersByStatus,
  getOrdersByDate,
  getOrderDetail,
  getPaymentsByOrder,
} from "../../controllers/orders.controller";
import { authenticateJWT } from "../../middlewares/auth";

const router = Router();

router.use(authenticateJWT);

router.get("/", (req, res) => {
  if (req.query.status) {
    return getOrdersByStatus(req, res);
  }

  if (req.query.from && req.query.to) {
    return getOrdersByDate(req, res);
  }

  return getAllOrders(req, res);
});

router.get("/:id", getOrderDetail);
router.get("/:id/payments", getPaymentsByOrder);

export default router;
