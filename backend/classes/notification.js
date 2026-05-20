const supabase = require("../config/supabase");

class Notification {
  constructor(user_id, type, title, body, ref_id = null) {
    this.user_id = user_id;
    this.type = type;
    this.title = title;
    this.body = body;
    this.ref_id = ref_id;
    this.is_read = false;
  }

  // abstraction:
  // service lain tidak perlu tahu detail query Supabase
  async save() {
    const payload = {
      user_id: this.user_id,
      type: this.type,
      title: this.title,
      body: this.body,
      ref_id: this.ref_id,
      is_read: this.is_read,
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // factory abstraction untuk order
  static order(user_id, order_id, status) {
    let body = "";

    switch (status) {
      case "menunggu_verifikasi":
        body = "Pesanan sedang menunggu verifikasi.";
        break;
      case "diproses":
        body = "Pesanan sedang diproses.";
        break;
      case "dikirim":
        body = "Pesanan sedang dikirim.";
        break;
      case "selesai":
        body = "Pesanan selesai.";
        break;
      case "dibatalkan":
        body = "Pesanan dibatalkan.";
        break;
      default:
        body = "Status pesanan diperbarui.";
    }

    return new Notification(
      user_id,
      "order_status",
      "Update Pesanan",
      body,
      order_id,
    );
  }

  // factory abstraction chat
  static message(user_id, conversation_id, sender_name) {
    return new Notification(
      user_id,
      "new_message",
      "Pesan Baru",
      `${sender_name} mengirim pesan baru.`,
      conversation_id,
    );
  }

  // factory abstraction review
  static review(user_id, review_id, buyer_name) {
    return new Notification(
      user_id,
      "new_review",
      "Review Baru",
      `${buyer_name} memberikan review pada produk kamu.`,
      review_id
    );
  }

  // factory abstraction promo
  static promo(user_id, promo_code) {
    return new Notification(
      user_id,
      "promo",
      "Promo Baru",
      `Gunakan kode ${promo_code} untuk mendapat diskon.`,
      null,
    );
  }
}

module.exports = Notification;
