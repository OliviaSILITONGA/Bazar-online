const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

// Semua endpoint cart membutuhkan login
router.use(authMiddleware);

/**
 * GET /cart
 * Ambil isi keranjang user yang sedang login
 */
router.get("/", cartController.getCart);

/**
 * POST /cart
 * Tambah item ke keranjang
 */
router.post("/", cartController.addToCart);

/**
 * PUT /cart/:itemId
 * Update quantity atau catatan item
 */
router.put("/:itemId", cartController.updateCartItem);

/**
 * DELETE /cart/:itemId
 * Hapus satu item dari keranjang
 */
router.delete("/:itemId", cartController.removeCartItem);

/**
 * DELETE /cart
 * Kosongkan seluruh isi keranjang
 */
router.delete("/", cartController.clearCart);

module.exports = router;
