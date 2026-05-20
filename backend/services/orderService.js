const supabase = require("../config/supabase");
const path = require("path");
const { createPayment } = require("../classes/Payment"); // ← Polymorphism

// =====================================================
// GET ORDERS (BUYER / SELLER)
// =====================================================
const getOrders = async ({ userId, role, status, page }) => {
  const limit = 10;
  const offset = (page - 1) * limit;

  let orderIds = null;

  if (role === "seller") {
    const { data: items, error: itemError } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("seller_id", userId);

    if (itemError) throw new Error(itemError.message);

    orderIds = [...new Set(items.map((i) => i.order_id))];
  }

  let query = supabase
    .from("orders")
    .select(`*, order_items (*)`, { count: "exact" });

  if (role === "buyer") {
    query = query.eq("buyer_id", userId);
  }

  if (role === "seller" && orderIds.length > 0) {
    query = query.in("id", orderIds);
  }

  if (status) {
    query = query.eq("status", status);
  }

  query = query
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data,
    pagination: { page, limit, total: count },
  };
};

// =====================================================
// GET ORDER BY ID
// =====================================================
const getOrderById = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items (*)`)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  if (data.buyer_id !== userId) {
    const sellerCheck = data.order_items?.some(
      (item) => item.seller_id === userId,
    );
    if (!sellerCheck) {
      throw new Error("Unauthorized access to order");
    }
  }

  return data;
};

// =====================================================
// CREATE ORDER (CHECKOUT)
// Polymorphism: createPayment() mengembalikan objek berbeda
// (TransferPayment / CODPayment / WalletPayment) tapi semua
// punya method .process() yang dipanggil dengan cara sama
// =====================================================
const createOrder = async ({ userId, payload }) => {
  const {
    promo_code_id,
    delivery_building,
    delivery_detail,
    phone,
    payment_method,
    items,
  } = payload;

  // Polymorphism: satu perintah .process() → hasil berbeda tiap metode bayar
  const payment = createPayment(payment_method, null, 0);
  const paymentResult = payment.process();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: userId,
      promo_code_id,
      delivery_building,
      delivery_detail,
      phone,
      payment_method,
      status: paymentResult.status, // ← status otomatis dari class Payment
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    product_name: item.product_name,
    product_price: item.product_price,
    quantity: item.quantity,
    note: item.note || "",
    subtotal: item.product_price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw new Error(itemsError.message);

  // Kembalikan order + info pembayaran dari class Payment
  return {
    ...order,
    paymentInfo: {
      method: paymentResult.method,
      message: paymentResult.message,
      description: payment.getDescription(),
    },
  };
};

// =====================================================
// UPLOAD PAYMENT PROOF
// =====================================================
const uploadPaymentProof = async ({ orderId, userId, file }) => {
  if (!file) {
    throw new Error("Payment proof file is required");
  }

  const extension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${extension}`;
  const filePath = `${orderId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("payment_proofs")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = supabase.storage
    .from("payment_proofs")
    .getPublicUrl(uploadData.path);

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_proof_url: publicUrlData.publicUrl,
      status: "menunggu_verifikasi",
    })
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

// =====================================================
// CONFIRM RECEIVED (BUYER)
// =====================================================
const confirmReceived = async ({ orderId, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "selesai" })
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// CANCEL ORDER
// =====================================================
const cancelOrder = async ({ orderId, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "dibatalkan" })
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// SELLER: MARK AS PROCESSED
// =====================================================
const markAsProcessed = async ({ orderId, sellerId }) => {
  const { data: items, error: checkError } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("seller_id", sellerId);

  if (checkError) throw new Error(checkError.message);
  if (!items || items.length === 0) {
    throw new Error("Unauthorized seller for this order");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "diproses" })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// SELLER: MARK AS SHIPPED
// =====================================================
const markAsShipped = async ({ orderId, sellerId }) => {
  const { data: items, error: checkError } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .eq("seller_id", sellerId);

  if (checkError) throw new Error(checkError.message);
  if (!items || items.length === 0) {
    throw new Error("Unauthorized seller for this order");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "dikirim" })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  uploadPaymentProof,
  confirmReceived,
  cancelOrder,
  markAsProcessed,
  markAsShipped,
};