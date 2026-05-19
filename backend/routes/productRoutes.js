const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

const authMiddleware = require("../middlewares/authMiddleware");
const sellerMiddleware = require("../middlewares/sellerMiddleware");
const upload = require("../middlewares/uploadMiddleware");

/*
========================================
PUBLIC ROUTES
========================================
*/

// GET /products
// Query:
// q, category, seller_id,
// min_price, max_price,
// sort, page, per_page
router.get("/", productController.getProducts);

// GET /products/:id
router.get("/:id", productController.getProductById);

/*
========================================
AUTH USER ROUTES
========================================
*/

// GET /products/liked
router.get("/liked", authMiddleware, productController.getLikedProducts);

// POST /products/:id/like
router.post("/:id/like", authMiddleware, productController.toggleLikeProduct);

/*
========================================
SELLER ROUTES
========================================
*/

// POST /products
router.post(
  "/",
  authMiddleware,
  sellerMiddleware,
  productController.createProduct,
);

// PUT /products/:id
router.put(
  "/:id",
  authMiddleware,
  sellerMiddleware,
  productController.updateProduct,
);

// DELETE /products/:id
router.delete(
  "/:id",
  authMiddleware,
  sellerMiddleware,
  productController.deleteProduct,
);

/*
========================================
PRODUCT IMAGE ROUTES
========================================
*/

// POST /products/:id/images
// multipart/form-data
// field name: images
router.post(
  "/:id/images",
  authMiddleware,
  sellerMiddleware,
  upload.array("images", 10),
  productController.uploadProductImages,
);

// DELETE /products/:id/images/:imgId
router.delete(
  "/:id/images/:imgId",
  authMiddleware,
  sellerMiddleware,
  productController.deleteProductImage,
);

module.exports = router;
