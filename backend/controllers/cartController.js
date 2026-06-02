const cartService = require("../services/cartService");

/**
 * GET /cart
 * Ambil isi keranjang user login
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await cartService.getCart(userId);

    return res.status(200).json({
      success: true,
      message: "Keranjang berhasil diambil",
      data: cartItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil keranjang",
    });
  }
};

/**
 * POST /cart
 * Tambah item ke keranjang
 * body:
 * {
 *   product_id,
 *   quantity,
 *   note
 * }
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity, note } = req.body;
    const cartItem = await cartService.addToCart({
      userId,
      product_id,
      quantity,
      note,
    });

    return res.status(201).json({
      success: true,
      message: "Item berhasil ditambahkan ke keranjang",
      data: cartItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menambah item",
    });
  }
};

/**
 * PUT /cart/:itemId
 * Update quantity / note item
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId);
    const { quantity, note } = req.body;
    const updatedItem = await cartService.updateCartItem({
      userId,
      itemId,
      quantity,
      note,
    });

    return res.status(200).json({
      success: true,
      message: "Item keranjang berhasil diperbarui",
      data: updatedItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal memperbarui item",
    });
  }
};

/**
 * DELETE /cart/:itemId
 * Hapus satu item
 */
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId);
    await cartService.removeCartItem(userId, itemId);

    return res.status(200).json({
      success: true,
      message: "Item berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menghapus item",
    });
  }
};

/**
 * DELETE /cart
 * Kosongkan keranjang user
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await cartService.clearCart(userId);

    return res.status(200).json({
      success: true,
      message: "Keranjang berhasil dikosongkan",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengosongkan keranjang",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
