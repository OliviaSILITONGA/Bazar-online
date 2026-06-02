const express = require("express");
const router = express.Router();

const conversationController = require("../controllers/conversationController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
// upload sudah dikonfigurasi untuk Supabase bucket: "messages"

// semua route butuh auth
router.use(authMiddleware);

// GET /conversations
router.get("/", conversationController.getConversations);

// GET /conversations/:id/messages
router.get("/:id/messages", conversationController.getMessages);

// POST /conversations
router.post("/", conversationController.createConversation);

// POST /conversations/:id/messages
// pesan bisa berupa text + media
router.post(
  "/:id/messages",
  upload.single("media"), // field form-data untuk file
  conversationController.sendMessage,
);

// PUT /conversations/:id/read
router.put("/:id/read", conversationController.markAsRead);

module.exports = router;
