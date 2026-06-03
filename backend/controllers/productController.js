const productService = require("../services/productService");

/*
========================================
GET ALL PRODUCTS
GET /products
========================================
*/
const getProducts = async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      category: req.query.category,
      seller_id: req.query.seller_id,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      sort: req.query.sort,
      page: req.query.page,
      per_page: req.query.per_page,
    };

    const result = await productService.getProducts(filters);

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      error: err.message,
    });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await productService.getMyProducts(userId);

    if (!products) {
      return res.status(404).json({
        success: false,
        message: "Products not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      error: err.message,
    });
  }
};

/*
========================================
GET PRODUCT DETAIL
GET /products/:id
========================================
*/
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      error: err.message,
    });
  }
};

/*
========================================
CREATE PRODUCT
POST /products
========================================
*/
const createProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const payload = {
      seller_id: sellerId,
      ...req.body,
    };
    const product = await productService.createProduct(payload);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message,
    });
  }
};

/*
========================================
UPDATE PRODUCT
PUT /products/:id
========================================
*/
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const sellerId = req.user.id;
    const payload = {
      ...req.body,
    };
    const product = await productService.updateProduct(
      productId,
      sellerId,
      payload,
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/*
========================================
DELETE PRODUCT
DELETE /products/:id
========================================
*/
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const sellerId = req.user.id;
    const result = await productService.deleteProduct(productId, sellerId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

/*
========================================
UPLOAD PRODUCT IMAGES
POST /products/:id/images
========================================
*/
const uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const sellerId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const result = await productService.uploadImages(
      productId,
      sellerId,
      files,
    );

    return res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload images",
      error: err.message,
    });
  }
};

/*
========================================
DELETE PRODUCT IMAGE
DELETE /products/:id/images/:imgId
========================================
*/
const deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const imageId = req.params.imgId;
    const sellerId = req.user.id;
    const result = await productService.deleteImage(
      productId,
      imageId,
      sellerId,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: err.message,
    });
  }
};

/*
========================================
TOGGLE LIKE PRODUCT
POST /products/:id/like
========================================
*/
const toggleLikeProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const result = await productService.toggleLike(productId, userId);

    return res.status(200).json({
      success: true,
      message: "Like updated successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update like",
      error: err.message,
    });
  }
};

/*
========================================
GET LIKED PRODUCTS
GET /products/liked
========================================
*/
const getLikedProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const products = await productService.getLikedProducts(userId);

    return res.status(200).json({
      success: true,
      message: "Liked products retrieved successfully",
      data: products,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve liked products",
      error: err.message,
    });
  }
};

const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await productService.getSimilarProducts(id);
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  toggleLikeProduct,
  getLikedProducts,
  getSimilarProducts,
};
