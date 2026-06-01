const supabase = require("../config/supabase");
const Auth = require("../classes/Auth"); // ← Encapsulation

/* =========================
   REGISTER USER (DB users)
========================= */
const register = async (userData) => {
  const { name, email, password } = userData;

  // cek email sudah dipakai
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    throw new Error("Email atau username sudah digunakan");
  }

  // ambil nama pertama → lowercase
  const firstName = name
    .trim()
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // cari username yang sudah ada
  const { data: usernames } = await supabase
    .from("users")
    .select("username")
    .ilike("username", `${firstName}%`);

  // default mulai dari 1
  let usernameNumber = 1;

  if (usernames && usernames.length > 0) {
    const usedNumbers = usernames
      .map((u) => {
        const match = u.username.match(new RegExp(`^${firstName}(\\d+)$`));
        return match ? parseInt(match[1]) : null;
      })
      .filter(Boolean);

    while (usedNumbers.includes(usernameNumber)) {
      usernameNumber++;
    }
  }

  const username = `${firstName}${usernameNumber}`;

  // Encapsulation: password di-handle oleh class Auth
  // password asli tidak pernah diakses langsung dari luar class
  const auth = new Auth(email, password);
  const hashedPassword = await auth.hashPassword();

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        username,
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

  // Encapsulation: verifikasi password lewat method class Auth
  // logic bcrypt tersembunyi di dalam class, tidak terekspos keluar
  const auth = new Auth(email, password);
  const isMatch = await auth.verifyPassword(data.password);
  if (!isMatch) {
    throw new Error("Password salah");
  }

  return data;
};

module.exports = {
  register,
  login,
};
