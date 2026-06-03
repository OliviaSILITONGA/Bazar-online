const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");

// multer — simpan di memori (untuk upload ke Supabase Storage)
const upload = multer({ storage: multer.memoryStorage() });
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const promoRoutes = require("./routes/promoRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const configRoutes = require("./routes/configRoutes");

const app = express();
app._upload = upload; // expose supaya bisa dipakai di route

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/reviews", reviewRoutes);
app.use("/promos", promoRoutes);
app.use("/notifications", notificationRoutes);
app.use("/config", configRoutes);

module.exports = app;
