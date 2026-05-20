const { supabase } = require("../config/supabase");

// =====================================================
// GET ORDERS (BUYER / SELLER) - FIXED VERSION
// =====================================================
const getOrders = async ({ userId, role, status, page }) => {
  const limit = 10;
  const offset = (page - 1) * limit;

  let orderIds = null;

  // =========================
  // SELLER FLOW (FIXED .in())
  // =========================
  if (role === "seller") {
    const { data: items, error: itemError } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("seller_id", userId);

    if (itemError) throw new Error(itemError.message);

    orderIds = [...new Set(items.map((i) => i.order_id))];
  }

  // =========================
  // BASE QUERY
  // =========================
  let query = supabase.from("orders").select(
    `
      *,
      order_items (*)
    `,
    { count: "exact" },
  );

  // buyer filter
  if (role === "buyer") {
    query = query.eq("buyer_id", userId);
  }

  // seller filter (FIXED)
  if (role === "seller" && orderIds.length > 0) {
    query = query.in("id", orderIds);
  }

  // status filter
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
    pagination: {
      page,
      limit,
      total: count,
    },
  };
};

// =====================================================
// GET ORDER BY ID
// =====================================================
const getOrderById = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        *,
        order_items (*)
      `,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  // basic ownership check
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

  // 1. insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: userId,
      promo_code_id,
      delivery_building,
      delivery_detail,
      phone,
      payment_method,
      status: "belum_dibayar",
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // 2. insert order items
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

  return order;
};

// =====================================================
// UPLOAD PAYMENT PROOF
// =====================================================
exports.uploadPaymentProof = async ({ orderId, userId, file }) => {
  if (!file) {
    throw new Error("Payment proof file is required");
  }

  const fileExt = file.originalname.split(".").pop();

  const filePath = `${orderId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  // upload ke Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("payment_proofs")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // ambil public URL
  const { data: publicUrlData } = supabase.storage
    .from("payment_proofs")
    .getPublicUrl(uploadData.path);

  const paymentProofUrl = publicUrlData.publicUrl;

  // update order
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_proof_url: paymentProofUrl,
      status: "menunggu_verifikasi",
    })
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// =====================================================
// CONFIRM RECEIVED (BUYER)
// =====================================================
const confirmReceived = async ({ orderId, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "selesai",
    })
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
    .update({
      status: "dibatalkan",
    })
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
  // pastikan seller memiliki item di order ini
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
    .update({
      status: "diproses",
    })
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
    .update({
      status: "dikirim",
    })
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
