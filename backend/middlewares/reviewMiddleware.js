const supabase = require("../config/supabase");

// =====================================================
// VALIDASI INPUT REVIEW
// =====================================================
const validateReviewInput = (req, res, next) => {
  const { order_item_id, product_id, rating, body, media } = req.body;

  // -----------------------------------------
  // Field wajib
  // -----------------------------------------
  if (!order_item_id || !product_id || rating === undefined) {
    return res.status(400).json({
      success: false,
      message: "order_item_id, product_id, dan rating wajib diisi",
    });
  }

  // -----------------------------------------
  // Validasi rating
  // -----------------------------------------
  const numericRating = Number(rating);

  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      success: false,
      message: "rating harus berupa angka antara 1 sampai 5",
    });
  }

  // normalize rating
  req.body.rating = numericRating;

  // -----------------------------------------
  // Validasi media (jika ada)
  // -----------------------------------------
  if (media && !Array.isArray(media)) {
    return res.status(400).json({
      success: false,
      message: "media harus berupa array",
    });
  }

  // optional: limit media
  if (media && media.length > 5) {
    return res.status(400).json({
      success: false,
      message: "maksimal 5 media per review",
    });
  }

  next();
};

// =====================================================
// VALIDASI OWNERSHIP ORDER ITEM (LIGHT CHECK)
// =====================================================
const validateReviewOwnership = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { order_item_id } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
          id,
          orders:order_id (
            buyer_id
          )
        `,
      )
      .eq("id", order_item_id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Order item tidak ditemukan",
      });
    }

    if (data.orders?.buyer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke order ini",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  validateReviewInput,
  validateReviewOwnership,
}