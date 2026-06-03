const supabase = require("../config/supabase");

const privateProfileMiddleware = async (req, res, next) => {
  try {
    // viewer bisa saja belum login
    const currentUserId = req.user?.id || null;

    const targetUserId =
      req.params.id ||
      req.params.userId ||
      req.body.userId ||
      req.body.seller_id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user tidak ditemukan",
      });
    }

    // pemilik profil tetap boleh akses
    if (currentUserId && Number(currentUserId) === Number(targetUserId)) {
      return next();
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, is_public")
      .eq("id", targetUserId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    if (!user.is_public) {
      return res.status(403).json({
        success: false,
        message: "Profil ini bersifat privat",
      });
    }

    next();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = privateProfileMiddleware;
