const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const privateProfileMiddleware = require("../middlewares/privateProfileMiddleware");

/*
========================================
PRIVATE ROUTES (login diperlukan)
========================================
*/

// GET /users/me
// Ambil profil user yang sedang login
router.get("/me", authMiddleware, userController.getMyProfile);

// GET /users/me/reviews
// Review yang dibuat user
router.get("/me/reviews", authMiddleware, userController.getMyReviews);

// POST /users/me/visibility
// Update sifat profil (publik/privat)
router.post("/me/visibility", authMiddleware, userController.toggleVisibility);

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

// DELETE /users/me
// Hapus akun
router.delete("/me", authMiddleware, userController.deleteMyProfile);

// POST /users/:id/follow
// Follow akun
router.post("/:id/follow", authMiddleware, userController.toggleFollow);

/*
========================================
PUBLIC ROUTES
========================================
*/

// GET /users/:id
// Profil publik user lain
router.get("/:id", privateProfileMiddleware, userController.getUserById);

// GET /users/:id/products
// Produk milik user
router.get("/:id/products", userController.getUserProducts);

// GET /users/:id/reviews
// Review yang diterima user
router.get("/:id/reviews", userController.getUserReviews);

module.exports = router;
