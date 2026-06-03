const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const sellerMiddleware = require("../middlewares/sellerMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { checkProductOwnership } = require("../middlewares/productOwnership");

// GET /products (public)
// Query:
// q, category, seller_id,
// min_price, max_price,
// sort, page, per_page
router.get("/", productController.getProducts);

// GET /products/liked (auth)
router.get("/liked", authMiddleware, productController.getLikedProducts);

// GET /products/me (auth)
router.get("/me", authMiddleware, sellerMiddleware, productController.getMyProducts);

// GET /products/:id/similar
router.get("/:id/similar", productController.getSimilarProducts);

// POST /products/:id/like (auth)
router.post("/:id/like", authMiddleware, productController.toggleLikeProduct);

// GET /products/:id (public)
router.get("/:id", productController.getProductById);

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
  checkProductOwnership,
  productController.updateProduct,
);

// DELETE /products/:id
router.delete(
  "/:id",
  authMiddleware,
  sellerMiddleware,
  checkProductOwnership,
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
  upload.array("images", 4),
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
