const orderService = require("../services/orderService");

// =========================
// GET ALL ORDERS
// =========================
const getOrders = async (req, res) => {
  try {
    const { role, status, page } = req.query;
    const userId = req.user?.id;

    const result = await orderService.getOrders({
      userId,
      role,
      status,
      page: Number(page) || 1,
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// =========================
// GET ORDER BY ID
// =========================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await orderService.getOrderById({ id, userId });

    return res.status(200).json({
      success: true,
      message: "Order detail fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order detail",
    });
  }
};

// =========================
// CREATE ORDER
// =========================
const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const payload = req.body;

    const result = await orderService.createOrder({
      userId,
      payload,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// =========================
// UPLOAD PAYMENT PROOF
// =========================
const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { payment_proof_url } = req.body;

    const result = await orderService.uploadPaymentProof({
      orderId: id,
      userId,
      payment_proof_url,
    });

    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload payment proof",
    });
  }
};

// =========================
// CONFIRM RECEIVED (BUYER)
// =========================
const confirmReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await orderService.confirmReceived({
      orderId: id,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Order marked as received",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to confirm order",
    });
  }
};

// =========================
// CANCEL ORDER
// =========================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await orderService.cancelOrder({
      orderId: id,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

// =========================
// SELLER: MARK AS PROCESSED
// =========================
const markAsProcessed = async (req, res) => {
  try {
    const { id } = req.params;

    // sellerMiddleware sudah memastikan user adalah seller
    const sellerId = req.user?.id;

    const result = await orderService.markAsProcessed({
      orderId: id,
      sellerId,
    });

    return res.status(200).json({
      success: true,
      message: "Order marked as processed",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// =========================
// SELLER: MARK AS SHIPPED
// =========================
const markAsShipped = async (req, res) => {
  try {
    const { id } = req.params;

    // sellerMiddleware sudah memastikan user adalah seller
    const sellerId = req.user?.id;

    const result = await orderService.markAsShipped({
      orderId: id,
      sellerId,
    });

    return res.status(200).json({
      success: true,
      message: "Order marked as shipped",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
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
