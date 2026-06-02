const express = require("express");
const router = express.Router();
const multer = require("multer");
const authController = require("../controllers/authController");

// multer — simpan di memori, maks 5MB, hanya gambar
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format KTM harus JPG, PNG, atau WebP"));
  },
});

// register — opsional upload KTM (field name: "ktm")
router.post("/register", upload.single("ktm"), authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken);

module.exports = router;
