const supabase = require("../config/supabase");
const path = require("path");
const { reviewNotification } = require("../utils/notificationGenerator");

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
  // =====================================================
  // 1. Ambil order item + order
  // =====================================================
  const { data: orderItem, error: orderItemErr } = await supabase
    .from("order_items")
    .select(
      `
        id,
        order_id,
        product_id,
        seller_id,
        orders:order_id (
          id,
          buyer_id,
          status
        )
      `,
    )
    .eq("id", order_item_id)
    .single();

  if (orderItemErr || !orderItem) {
    throw new Error("Order item tidak ditemukan");
  }

  const order = orderItem.orders;

  // =====================================================
  // 2. Validasi ownership
  // =====================================================
  if (order.buyer_id !== reviewer_id) {
    throw new Error("Anda tidak memiliki akses ke order ini");
  }

  // =====================================================
  // 3. Validasi status order
  // =====================================================
  if (order.status !== "selesai") {
    throw new Error("Review hanya bisa dibuat setelah order selesai");
  }

  // =====================================================
  // 4. Cek review duplikat
  // =====================================================
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_item_id", order_item_id)
    .maybeSingle();

  if (existingReview) {
    throw new Error("Order item ini sudah direview");
  }

  // =====================================================
  // 5. Insert review
  // =====================================================
  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .insert([
      {
        order_item_id,
        reviewer_id,
        product_id,
        rating,
        body: body || null,
      },
    ])
    .select()
    .single();

  if (reviewErr) {
    throw new Error(reviewErr.message);
  }

  // =====================================================
  // 6. Upload media ke Supabase Storage + insert DB
  // =====================================================
  if (files && files.length > 0) {
    const path = require("path");
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

    const { error: mediaError } = await supabase
      .from("review_media")
      .insert(mediaPayload);

    if (mediaError) {
      throw new Error(mediaError.message);
    }
  }

  // =====================================================
  // 7. Ambil data untuk notifikasi
  // =====================================================
  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", reviewer_id)
    .single();

  const { data: productData } = await supabase
    .from("products")
    .select("seller_id, name")
    .eq("id", product_id)
    .single();

  // =====================================================
  // 8. Kirim notifikasi ke penjual
  // =====================================================
  await reviewNotification({
    user_id: productData.seller_id,
    review_id: review.id,
    buyer_name: userData?.name || "Seorang pembeli",
  });

  // =====================================================
  // 9. Return hasil
  // =====================================================
  return review;
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
