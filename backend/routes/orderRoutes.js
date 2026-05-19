// orderRoutes.js

const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const sellerMiddleware = require("../middlewares/sellerMiddleware");

router.use(authMiddleware);

// =========================
// ORDER ROUTES
// =========================

// GET all orders (buyer/seller) dengan query: role, status, page
router.get("/", orderController.getOrders);

// GET detail order by ID
router.get("/:id", orderController.getOrderById);

// CREATE order (checkout)
router.post("/", orderController.createOrder);

// UPLOAD bukti pembayaran
router.put("/:id/pay", orderController.uploadPaymentProof);

// CONFIRM order diterima oleh buyer
router.put("/:id/received", orderController.confirmReceived);

// CANCEL order
router.put("/:id/cancel", orderController.cancelOrder);

// SELLER: update status -> diproses
router.put("/:id/process", sellerMiddleware, orderController.markAsProcessed);

// SELLER: update status -> dikirim
router.put("/:id/ship", sellerMiddleware, orderController.markAsShipped);

module.exports = router;