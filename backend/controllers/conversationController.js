const conversationService = require("../services/conversationService");

// =====================================================
// GET /conversations
// =====================================================
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await conversationService.getConversations(userId);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil daftar percakapan",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET /conversations/:id/messages
// =====================================================
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const result = await conversationService.getMessages(
      conversationId,
      userId,
    );

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil pesan",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// POST /conversations
// =====================================================
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_b_id } = req.body;
    const result = await conversationService.createConversation(
      userId,
      user_b_id,
    );

    return res.status(201).json({
      success: true,
      message: "Percakapan berhasil dibuat",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// POST /conversations/:id/messages
// =====================================================
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const messageData = {
      body: req.body.body || null,
      file: req.file || null,
    };

    const result = await conversationService.sendMessage(
      conversationId,
      userId,
      messageData,
    );

    return res.status(201).json({
      success: true,
      message: "Pesan berhasil dikirim",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// PUT /conversations/:id/read
// =====================================================
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const result = await conversationService.markAsRead(conversationId, userId);

    return res.status(200).json({
      success: true,
      message: "Pesan ditandai sudah dibaca",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markAsRead,
};
