const userService = require("../services/userService");
const { Buyer, Seller } = require("../classes/User"); // ← Inheritance

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

    // Inheritance: pilih class berdasarkan role user
    // Buyer dan Seller keduanya extends class User (mewarisi method getInfo, canBuy, dll)
    const userObj = profile.is_seller
      ? new Seller(profile) // ← Seller extends User
      : new Buyer(profile); // ← Buyer extends User

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diambil",
      data: {
        ...profile,
        role_info: userObj.getInfo(), // method diwarisi dari base class User
        can_sell: userObj.canSell(), // Seller → true, Buyer → false
        can_buy: userObj.canBuy(), // keduanya → true
      },
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
      currentPassword: req.body.currentPassword,
      bio: req.body.bio,
      location: req.body.location,
      phone: req.body.phone,
      is_seller: req.body.is_seller,
    };

    const updatedUser = await userService.updateMyProfile(userId, updateData);

    // Inheritance: wrap hasil update dengan class yang sesuai
    const userObj = updatedUser.is_seller
      ? new Seller(updatedUser)
      : new Buyer(updatedUser);

    return res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: {
        ...updatedUser,
        role_info: userObj.getInfo(),
        can_sell: userObj.canSell(),
        can_buy: userObj.canBuy(),
      },
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

const deleteMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    await userService.deleteMyProfile(userId);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
    });
    return res.status(200).json({
      success: true,
      message: "Akun berhasil dihapus",
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

    // Inheritance: tampilkan info role dari class
    const userObj = user.is_seller ? new Seller(user) : new Buyer(user);

    return res.status(200).json({
      success: true,
      message: "Profil user berhasil diambil",
      data: {
        ...user,
        role_info: userObj.getInfo(),
        can_sell: userObj.canSell(),
      },
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
  deleteMyProfile,
  getUserById,
  getUserProducts,
  getUserReviews,
};
