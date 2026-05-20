const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.use(authMiddleware);

// Ambil semua notifikasi milik user
router.get("/", authMiddleware, notificationController.getNotifications);

// Tandai 1 notifikasi sebagai sudah dibaca
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

// Tandai semua notifikasi sebagai sudah dibaca
router.put("/read-all", authMiddleware, notificationController.markAllAsRead);

module.exports = router;
