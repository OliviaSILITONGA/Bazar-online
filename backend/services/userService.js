const sharp = require("sharp");
const supabase = require("../config/supabase");
const Auth = require("../classes/Auth");

/*
========================================
GET PROFILE SENDIRI
========================================
*/
const getMyProfile = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
        id,
        name,
        username,
        email,
        avatar_url,
        bio,
        location,
        phone,
        is_seller,
        created_at,
        updated_at
      `,
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw {
      statusCode: 404,
      message: "User tidak ditemukan",
    };
  }

  return data;
};

/*
========================================
REVIEW USER
========================================
*/
const getMyReviews = async (userId) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        rating,
        body,
        created_at,
        products(
          id,
          name,
          seller:users!fk_product_seller(name)
        )
      `,
    )
    .eq("reviewer_id", userId);

  if (error) {
    throw {
      statusCode: 500,
      message: error.message,
    };
  }

  return data;
};

const toggleVisibility = async (userId) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("is_public")
    .eq("id", userId)
    .single();

  if (userError) throw new Error(userError.message);

  const { data, error } = await supabase
    .from("users")
    .update({
      is_public: !user.is_public,
    })
    .eq("id", userId)
    .select("id, is_public")
    .single();

  if (error) throw new Error(error.message);

  return data;
};

/*
========================================
UPDATE PROFIL
========================================
*/
const updateMyProfile = async (userId, updateData) => {
  const payload = {};
  const fields = [
    "name",
    "username",
    "email",
    "password",
    "currentPassword",
    "bio",
    "location",
    "phone",
    "is_seller",
  ];

  for (const field of fields) {
    if (updateData[field] !== undefined) payload[field] = updateData[field];
  }

  const { data: currentPassword, error: passError } = await supabase
    .from("users")
    .select("password")
    .eq("id", userId)
    .single();

  if (updateData.email) {
    const auth = new Auth(updateData.email, updateData.currentPassword);
    payload.currentPassword = await auth.hashPassword();
    const isMatch = await auth.verifyPassword(currentPassword.password);
    if (!isMatch) throw new Error("Password salah");
  } else if (updateData.password) {
    const auth = new Auth("", updateData.password);
    const confirmAuth = new Auth("", updateData.currentPassword);
    payload.password = await auth.hashPassword();
    payload.currentPassword = await auth.hashPassword();
    const isMatch = await confirmAuth.verifyPassword(currentPassword.password);
    if (!isMatch) throw new Error("Password salah");
  }

  delete payload.currentPassword;

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw {
      statusCode: 400,
      message: error.message,
    };
  }

  return data;
};

/*
========================================
UPLOAD AVATAR
========================================
*/
const uploadAvatar = async (userId, avatarFile) => {
  if (!avatarFile) {
    throw {
      statusCode: 400,
      message: "File avatar wajib diupload",
    };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(avatarFile.mimetype)) {
    throw {
      statusCode: 400,
      message: "Format gambar harus JPG, PNG, atau WebP",
    };
  }

  const optimizedBuffer = await sharp(avatarFile.buffer)
    .resize(300, 300, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();
  const filename = `user-${userId}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filename, optimizedBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    throw {
      statusCode: 500,
      message: uploadError.message,
    };
  }

  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filename);
  const avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;
  const { data, error } = await supabase
    .from("users")
    .update({
      avatar_url: avatarUrl,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw {
      statusCode: 500,
      message: error.message,
    };
  }

  return data;
};

const deleteMyProfile = async (userId) => {
  // Ambil data user terlebih dahulu
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (userError) {
    throw {
      statusCode: 404,
      message: "User tidak ditemukan",
    };
  }

  // Hapus avatar dari Storage
  const avatarPath = `user-${userId}.webp`;
  await supabase.storage.from("avatars").remove([avatarPath]);

  // Hapus user dari database
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    throw {
      statusCode: 500,
      message: error.message,
    };
  }

  return true;
};

/*
========================================
PROFIL PUBLIK USER
========================================
*/
const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
        id,
        name,
        username,
        avatar_url,
        bio,
        location,
        is_seller,
        created_at
      `,
    )
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw {
      statusCode: 404,
      message: "User tidak ditemukan",
    };
  }

  return data;
};

/*
========================================
PRODUK USER
========================================
*/
const getUserProducts = async (userId) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        description,
        price,
        stock,
        category,
        like_count,
        location,
        created_at,
        product_images(id, image_url)
      `,
    )
    .eq("seller_id", userId)
    .eq("is_active", true);

  if (error) {
    throw {
      statusCode: 500,
      message: error.message,
    };
  }

  return data;
};

// =====================================================
// GET USER REVIEWS
// =====================================================
const getUserReviews = async (userId) => {
  // ambil semua produk milik seller
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", userId);

  if (productError) {
    throw new Error(productError.message);
  }

  if (!products.length) {
    return [];
  }

  const productIds = products.map((p) => p.id);

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      body,
      created_at,

      reviewer:users!fk_review_user (
        id,
        name,
        username,
        avatar_url
      ),

      product:products!fk_review_product (
        id,
        name
      )
    `,
    )
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

module.exports = {
  getMyProfile,
  getMyReviews,
  toggleVisibility,
  updateMyProfile,
  uploadAvatar,
  deleteMyProfile,
  getUserById,
  getUserProducts,
  getUserReviews,
};
