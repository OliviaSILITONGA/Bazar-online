const { supabase } = require("../config/supabase");
const bcrypt = require("bcrypt");

/* =========================
   REGISTER USER (DB users)
========================= */
const register = async (userData) => {
  const { name, email, password } = userData;

  // cek email/username sudah dipakai
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${email}`)
    .single();

  if (existing) {
    throw new Error("Email atau username sudah digunakan");
  }

  // hash password sebelum simpan
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        email,
        password: hashedPassword,
        is_seller: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/* =========================
   LOGIN USER
========================= */
const login = async (email, password) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error("Email tidak ditemukan");
  }

  const isMatch = await bcrypt.compare(password, data.password);
  if (!isMatch) {
    throw new Error("Password salah");
  }

  return data;
};

module.exports = {
  register,
  login,
};
