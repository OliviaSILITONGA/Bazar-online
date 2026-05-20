// Base class
class Payment {
  constructor(orderId, amount) {
    this.orderId = orderId;
    this.amount = amount;
  }

  // method yang akan di-override (polymorphism)
  process() {
    throw new Error("Method process() harus diimplementasikan");
  }

  getDescription() {
    throw new Error("Method getDescription() harus diimplementasikan");
  }
}

// Setiap child class punya implementasi process() yang BERBEDA = polymorphism
class TransferPayment extends Payment {
  process() {
    return {
      status: "menunggu_verifikasi",
      message: "Silakan upload bukti transfer",
      method: "transfer"
    };
  }
  getDescription() { return "Transfer Bank Manual"; }
}

class CODPayment extends Payment {
  process() {
    return {
      status: "dikirim",
      message: "Bayar saat barang tiba di tangan kamu",
      method: "cod"
    };
  }
  getDescription() { return "Cash on Delivery (COD)"; }
}

class WalletPayment extends Payment {
  process() {
    return {
      status: "lunas",
      message: "Pembayaran e-wallet berhasil diproses",
      method: "wallet"
    };
  }
  getDescription() { return "E-Wallet (GoPay/OVO/Dana)"; }
}

// Factory function - pilih class berdasarkan metode pembayaran
const createPayment = (method, orderId, amount) => {
  switch (method) {
    case "transfer": return new TransferPayment(orderId, amount);
    case "cod":      return new CODPayment(orderId, amount);
    case "wallet":   return new WalletPayment(orderId, amount);
    default: throw new Error(`Metode pembayaran '${method}' tidak dikenal`);
  }
};

module.exports = { Payment, TransferPayment, CODPayment, WalletPayment, createPayment };