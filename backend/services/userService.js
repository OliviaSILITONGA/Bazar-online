const path = require("path");
const supabase = require("../config/supabase");

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
    "bio",
    "location",
    "phone",
  ];

  for (const field of fields) {
    if (updateData[field] !== undefined) payload[field] = updateData[field];
  }

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

  const extension = path.extname(avatarFile.originalname);
  const filename = `user-${userId}-${Date.now()}${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filename, avatarFile.buffer, {
      contentType: avatarFile.mimetype,
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
  const avatarUrl = publicData.publicUrl;
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
        created_at
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

/*
========================================
REVIEW USER
========================================
*/
const getUserReviews = async (userId) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
              id,
              rating,
              body,
              created_at,
              products(id, name),
              users(id, username, avatar_url)
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

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getUserById,
  getUserProducts,
  getUserReviews,
};
