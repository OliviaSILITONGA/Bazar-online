const { getProductById } = require("../services/productService");

const checkProductOwnership = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    if (product.seller_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke produk ini",
      });
    }

    req.product = product;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkProductOwnership,
};
