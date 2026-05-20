const supabase = require("../config/supabase");

/**
 * Validasi & hitung promo
 * @param {string} code
 * @param {number} order_total
 */
const validatePromo = async (code, order_total = 0) => {
  if (!code) {
    const err = new Error("Kode promo tidak boleh kosong");
    err.statusCode = 400;
    throw err;
  }

  // ambil data promo dari Supabase
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !promo) {
    const err = new Error("Kode promo tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }

  // cek status aktif
  if (!promo.is_active) {
    const err = new Error("Kode promo sudah tidak aktif");
    err.statusCode = 400;
    throw err;
  }

  // cek expired
  if (promo.expired_at) {
    const now = new Date();
    const expired = new Date(promo.expired_at);

    if (now > expired) {
      const err = new Error("Kode promo sudah kedaluwarsa");
      err.statusCode = 400;
      throw err;
    }
  }

  // cek usage limit
  if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
    const err = new Error("Kode promo sudah mencapai batas penggunaan");
    err.statusCode = 400;
    throw err;
  }

  // validasi order total
  if (order_total <= 0) {
    const err = new Error("Total order tidak valid");
    err.statusCode = 400;
    throw err;
  }

  // hitung diskon
  let discount = 0;

  if (promo.discount_pct > 0) {
    discount = Math.floor((order_total * promo.discount_pct) / 100);
  } else if (promo.discount_amount > 0) {
    discount = promo.discount_amount;
  }

  // pastikan diskon tidak melebihi total
  if (discount > order_total) {
    discount = order_total;
  }

  const final_total = order_total - discount;

  return {
    code: promo.code,
    original_total: order_total,
    discount,
    final_total,
    discount_pct: promo.discount_pct,
    discount_amount: promo.discount_amount,
  };
};

module.exports = { validatePromo };
