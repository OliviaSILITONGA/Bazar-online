const express = require("express");
const router = express.Router();

const promoController = require("../controllers/promoController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * POST /promo/validate
 * Cek & hitung diskon kode promo
 */
router.post("/validate", authMiddleware, promoController.validatePromo);

module.exports = router;