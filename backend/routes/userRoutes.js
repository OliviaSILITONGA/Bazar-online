const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/*
========================================
PRIVATE ROUTES (login diperlukan)
========================================
*/

// GET /users/me
// Ambil profil user yang sedang login
router.get("/me", authMiddleware, userController.getMyProfile);

// PUT /users/me
// Update profil sendiri
router.put("/me", authMiddleware, userController.updateMyProfile);

// PUT /users/me/avatar
// Upload avatar
router.put(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.uploadAvatar,
);

/*
========================================
PUBLIC ROUTES
========================================
*/

// GET /users/:id
// Profil publik user lain
router.get("/:id", userController.getUserById);

// GET /users/:id/products
// Produk milik user
router.get("/:id/products", userController.getUserProducts);

// GET /users/:id/reviews
// Review yang diterima user
router.get("/:id/reviews", userController.getUserReviews);

module.exports = router;
