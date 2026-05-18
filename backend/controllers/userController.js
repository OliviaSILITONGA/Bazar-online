const userService = require("../services/userService");

/*
========================================
GET /users/me
Profil user login
========================================
*/
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await userService.getMyProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diambil",
      data: profile,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

/*
========================================
PUT /users/me
Update profil
========================================
*/
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      bio: req.body.bio,
      location: req.body.location,
      phone: req.body.phone,
    };

    const updatedUser = await userService.updateMyProfile(userId, updateData);

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

/*
========================================
PUT /users/me/avatar
Upload avatar
========================================
*/
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const avatarFile = req.file;
    const result = await userService.uploadAvatar(userId, avatarFile);

    return res.status(200).json({
      success: true,
      message: "Avatar berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

/*
========================================
GET /users/:id
Profil publik user
========================================
*/
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "Profil user berhasil diambil",
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

/*
========================================
GET /users/:id/products
Produk milik user
========================================
*/
const getUserProducts = async (req, res) => {
  try {
    const userId = req.params.id;
    const products = await userService.getUserProducts(userId);

    return res.status(200).json({
      success: true,
      message: "Produk user berhasil diambil",
      data: products,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

/*
========================================
GET /users/:id/reviews
Review user
========================================
*/
const getUserReviews = async (req, res) => {
  try {
    const userId = req.params.id;
    const reviews = await userService.getUserReviews(userId);

    return res.status(200).json({
      success: true,
      message: "Review user berhasil diambil",
      data: reviews,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getUserById,
  getUserProducts,
  getUserReviews,
};
