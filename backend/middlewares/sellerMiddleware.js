const sellerMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.user.is_seller) {
      return res.status(403).json({
        success: false,
        message: "Seller access required",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Seller verification failed",
      error: err.message,
    });
  }
};

module.exports = sellerMiddleware;
