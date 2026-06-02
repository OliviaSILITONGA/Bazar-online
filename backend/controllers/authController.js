const supabase = require("../config/supabase"); // ← tambahkan ini
const authService = require("../services/authService");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      accessToken,
      user,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

// LOGOUT
const logout = async (req, res) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({
    success: true,
    message: "Logout berhasil",
  });
};

// REFRESH TOKEN
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token)
    return res.status(401).json({
      success: false,
      message: "No token",
    });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const accessToken = generateAccessToken({ id: decoded.id });
    return res.status(200).json({
      success: true,
      message: "Token berhasil diperbarui",
      accessToken,
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
};
