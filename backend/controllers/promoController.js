const promoService = require("../services/promoService");

/**
 * POST /promo/validate
 * Body: { code, order_total }
 */
const validatePromo = async (req, res) => {
  try {
    const { code, order_total } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Kode promo wajib diisi",
      });
    }

    // delegasi ke service (tidak ada logika DB di controller)
    const result = await promoService.validatePromo(code, order_total);

    return res.status(200).json({
      success: true,
      message: "Promo berhasil divalidasi",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

module.exports = { validatePromo };
