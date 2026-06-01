const reviewService = require("../services/reviewService");

// =====================================================
// GET /products/:id/reviews
// =====================================================
const getProductReviews = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID tidak valid",
      });
    }

    const reviews = await reviewService.getProductReviews(productId);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil ulasan produk",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// POST /reviews
// =====================================================
const createReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { order_item_id, product_id, rating, body } = req.body;
    const result = await reviewService.createReview({
      reviewer_id: userId,
      order_item_id,
      product_id,
      rating,
      body,
      files: req.files || [],
    });

    return res.status(201).json({
      success: true,
      message: "Ulasan berhasil dibuat",
      data: result,
    });
  } catch (error) {
    const expectedErrors = [
      "Order item tidak ditemukan",
      "Anda tidak memiliki akses ke order ini",
      "Review hanya bisa dibuat setelah order selesai",
      "Order item ini sudah direview",
      "Produk tidak ditemukan",
      "Tidak bisa mereview produk sendiri",
      "order_item_id, product_id, dan rating wajib diisi",
      "rating harus berupa angka antara 1 sampai 5",
    ];
    const statusCode = expectedErrors.some((msg) => error.message.includes(msg))
      ? 400
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET /reviews/pending
// =====================================================
const getPendingReviews = async (req, res) => {
  try {
    const userId = req.user?.id;

    const data = await reviewService.getPendingReviews(userId);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data review yang belum dibuat",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getPendingReviews,
};
