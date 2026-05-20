const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");
const reviewMiddleware = require("../middlewares/reviewMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// =========================
// PUBLIC ROUTE
// =========================
// Lihat ulasan produk tertentu (tidak wajib login)
router.get("/products/:id/reviews", reviewController.getProductReviews);

// =========================
// PROTECTED ROUTES
// =========================
// Menulis ulasan (harus sudah login + biasanya setelah order selesai)
router.post(
  "/reviews",
  authMiddleware,
  upload.array("media", 5),
  reviewMiddleware.validateReviewInput,
  reviewMiddleware.validateReviewOwnership,
  reviewController.createReview,
);

// Melihat item order yang belum diulas (khusus user login)
router.get(
  "/reviews/pending",
  authMiddleware,
  reviewController.getPendingReviews,
);

module.exports = router;
