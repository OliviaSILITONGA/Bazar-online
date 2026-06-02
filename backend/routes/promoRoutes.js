const express = require("express");
const router = express.Router();

const promoController = require("../controllers/promoController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

/**
 * POST /promo/validate
 * Cek & hitung diskon kode promo
 */
router.post("/validate", promoController.validatePromo);

/**
 * POST /promo/add
 * Tambah kode promo baru
 */
router.post("/add", promoController.addPromo);

module.exports = router;