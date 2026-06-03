const supabase = require("../config/supabase");
const path = require("path");

const PRODUCT_CATEGORIES = ["makanan", "minuman", "jajanan", "kue", "lainnya"];
const PRODUCT_AVAILABILITY = ["setiap-hari", "pre-order"];
const PAYMENT_METHODS = ["COD", "BRI", "BCA", "DANA", "GoPay"];

/*
====================================
GET PRODUCTS
====================================
*/
const getProducts = async (filters) => {
  const {
    q,
    category,
    seller_id,
    min_price,
    max_price,
    sort = "newest",
    page = 1,
    per_page = 20,
  } = filters;
  const from = (page - 1) * per_page;
  const to = from + Number(per_page) - 1;

  let query = supabase.from("products").select(
    `
      *,
      seller:users!fk_product_seller(
        id,
        name,
        username,
        location
      ),
      product_images(
        id,
        image_url,
        position
      )
    `,
    { count: "exact" },
  );

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (seller_id) {
    query = query.eq("seller_id", seller_id);
  }

  if (min_price) {
    query = query.gte("price", min_price);
  }

  if (max_price) {
    query = query.lte("price", max_price);
  }

  switch (sort) {
    case "popular":
      query = query.order("like_count", {
        ascending: false,
      });
      break;

    case "price_asc":
      query = query.order("price", {
        ascending: true,
      });
      break;

    case "price_desc":
      query = query.order("price", {
        ascending: false,
      });
      break;

    default:
      query = query.order("created_at", {
        ascending: false,
      });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    items: data,
    pagination: {
      page: Number(page),
      per_page: Number(per_page),
      total: count,
    },
  };
};

/*
====================================
GET PRODUCT DETAIL
====================================
*/
const getProductById = async (productId) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        *,
        seller:users!fk_product_seller(
          id,
          name,
          username,
          location,
          avatar_url
        ),
        product_images(*),
        product_payment_methods(
          method
        )
      `,
    )
    .eq("id", productId)
    .single();

  if (error) return null;

  return data;
};

/*
====================================
CREATE PRODUCT
====================================
*/
const createProduct = async (payload) => {
  const { payment_methods, ...productData } = payload;

  if (
    productData.category &&
    !PRODUCT_CATEGORIES.includes(productData.category)
  ) {
    throw new Error("Invalid category");
  }

  if (
    productData.availability &&
    !PRODUCT_AVAILABILITY.includes(productData.availability)
  ) {
    throw new Error("Invalid availability");
  }

  if (payment_methods) {
    const invalid = payment_methods.some(
      (method) => !PAYMENT_METHODS.includes(method),
    );

    if (invalid) {
      throw new Error("Invalid payment method");
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) throw error;

  if (payment_methods && payment_methods.length) {
    const methods = payment_methods.map((method) => ({
      product_id: data.id,
      method,
    }));

    await supabase.from("product_payment_methods").insert(methods);
  }

  return data;
};

/*
====================================
UPDATE PRODUCT
====================================
*/
const updateProduct = async (productId, sellerId, payload) => {
  const existing = await getProductById(productId);

  if (!existing) return null;

  if (existing.seller_id !== sellerId) {
    throw new Error("Forbidden");
  }

  const { payment_methods, ...updateData } = payload;

  if (
    updateData.category &&
    !PRODUCT_CATEGORIES.includes(updateData.category)
  ) {
    throw new Error("Invalid category");
  }

  if (
    updateData.availability &&
    !PRODUCT_AVAILABILITY.includes(updateData.availability)
  ) {
    throw new Error("Invalid availability");
  }

  if (payment_methods) {
    const invalid = payment_methods.some(
      (method) => !PAYMENT_METHODS.includes(method),
    );

    if (invalid) {
      throw new Error("Invalid payment method");
    }
  }

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;

  if (payment_methods) {
    await supabase
      .from("product_payment_methods")
      .delete()
      .eq("product_id", productId);

    const methods = payment_methods.map((method) => ({
      product_id: productId,
      method,
    }));

    await supabase.from("product_payment_methods").insert(methods);
  }

  return data;
};

/*
====================================
DELETE PRODUCT
====================================
*/
const deleteProduct = async (productId, sellerId) => {
  const product = await getProductById(productId);

  if (!product) return null;

  if (product.seller_id !== sellerId) {
    throw new Error("Forbidden");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw error;

  return true;
};

/*
====================================
UPLOAD PRODUCT IMAGES
====================================
*/
const uploadImages = async (productId, sellerId, files) => {
  const product = await getProductById(productId);

  if (!product || product.seller_id !== sellerId) {
    throw new Error("Forbidden");
  }

  const results = [];

  for (const file of files) {
    const fileName = `products/${productId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${path.extname(file.originalname)}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    const { data: image, error: imageError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (imageError) throw imageError;

    results.push(image);
  }

  return results;
};

/*
====================================
DELETE IMAGE
====================================
*/
const deleteImage = async (productId, imageId, sellerId) => {
  const product = await getProductById(productId);

  if (!product || product.seller_id !== sellerId) {
    throw new Error("Forbidden");
  }

  const { data: image } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .single();

  if (!image) return null;

  await supabase.from("product_images").delete().eq("id", imageId);

  return true;
};

/*
====================================
LIKE TOGGLE
====================================
*/
const toggleLike = async (productId, userId) => {
  const { data: existing } = await supabase
    .from("product_likes")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase.from("product_likes").delete().eq("id", existing.id);
    await supabase.rpc("decrement_like_count", {
      p_product_id: productId,
    });

    return {
      liked: false,
    };
  }

  await supabase.from("product_likes").insert({
    user_id: userId,
    product_id: productId,
  });
  await supabase.rpc("increment_like_count", {
    p_product_id: productId,
  });

  return {
    liked: true,
  };
};

/*
====================================
GET LIKED PRODUCTS
====================================
*/
const getLikedProducts = async (userId) => {
  const { data, error } = await supabase
    .from("product_likes")
    .select(
      `
        products(
          *,
          seller:users!fk_product_seller(name),
          product_images(*)
        )
      `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  return data.map((item) => item.products);
};

const getSimilarProducts = async (productId) => {
  const product = await getProductById(productId);

  if (!product) {
    throw new Error("Produk tidak ditemukan");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        *,
        product_images(
          id,
          image_url
        )
      `,
    )
    .eq("category", product.category)
    .neq("id", productId)
    .eq("is_active", true)
    .limit(5);

  if (error) throw error;
  return data;
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
  toggleLike,
  getLikedProducts,
  getSimilarProducts,
};
