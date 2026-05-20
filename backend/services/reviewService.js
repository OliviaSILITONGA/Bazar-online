const supabase = require("../config/supabase");
const path = require("path");

// =====================================================
// GET REVIEWS BY PRODUCT
// =====================================================
const getProductReviews = async (productId) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        rating,
        body,
        created_at,
        reviewer_id,
        users:reviewer_id (id, name, username, avatar_url),
        review_media (
          id,
          media_url,
          media_type
        )
      `,
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

// =====================================================
// CREATE REVIEW + MEDIA
// =====================================================
const createReview = async ({
  reviewer_id,
  order_item_id,
  product_id,
  rating,
  body,
  files,
}) => {
  if (files && files.length > 0) {
    const mediaPayload = [];

    for (const file of files) {
      const extension = path.extname(file.originalname);
      const fileName =
        `review_${review.id}_` +
        `${Date.now()}_${Math.random().toString(36).substring(2)}${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("reviews")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("reviews")
        .getPublicUrl(fileName);

      mediaPayload.push({
        review_id: review.id,
        media_url: publicUrlData.publicUrl,
        media_type: file.mimetype.startsWith("image/") ? "image" : "video",
      });
    }

    if (mediaPayload.length > 0) {
      const { error: mediaError } = await supabase
        .from("review_media")
        .insert(mediaPayload);

      if (mediaError) {
        throw new Error(mediaError.message);
      }
    }
  }
};

// =====================================================
// GET PENDING REVIEWS (ORDER ITEMS YET TO BE REVIEWED)
// =====================================================
const getPendingReviews = async (userId) => {
  // Ambil semua order_items milik user yang:
  // - order sudah selesai
  // - belum memiliki review

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
        id,
        product_id,
        product_name,
        orders:order_id (
          id,
          status,
          buyer_id,
          order_code
        ),
        reviews (id)
      `,
    )
    .eq("orders.buyer_id", userId);

  if (error) throw new Error(error.message);

  // Filter manual:
  const filtered = data.filter(
    (item) =>
      item.orders?.status === "selesai" &&
      (!item.reviews || item.reviews.length === 0),
  );

  return filtered;
};

module.exports = {
  getProductReviews,
  createReview,
  getPendingReviews,
};
