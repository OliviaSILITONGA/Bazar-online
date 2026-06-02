const supabase = require("../config/supabase");
const Auth = require("../classes/Auth");
const sharp = require("sharp");

/* =========================
   REGISTER USER (DB users)
========================= */
const register = async (userData, ktmFile) => {
  const { name, email, password } = userData;

  // cek email sudah dipakai
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    throw new Error("Email sudah digunakan");
  }

  // ambil nama pertama → lowercase → buat username unik
  const firstName = name
    .trim()
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const { data: usernames } = await supabase
    .from("users")
    .select("username")
    .ilike("username", `${firstName}%`);

  let usernameNumber = 1;
  if (usernames && usernames.length > 0) {
    const usedNumbers = usernames
      .map((u) => {
        const match = u.username.match(new RegExp(`^${firstName}(\\d+)$`));
        return match ? parseInt(match[1]) : null;
      })
      .filter(Boolean);
    while (usedNumbers.includes(usernameNumber)) usernameNumber++;
  }
  const username = `${firstName}${usernameNumber}`;

  // hash password
  const auth = new Auth(email, password);
  const hashedPassword = await auth.hashPassword();

  // ────────────────────────────────────────────────
  // Jika ada KTM → is_seller = true, upload fotonya
  // ────────────────────────────────────────────────
  let isSeller = false;
  let ktmUrl = null;

  if (ktmFile) {
    isSeller = true;

    // compress & convert ke webp
    const optimizedBuffer = await sharp(ktmFile.buffer)
      .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // nama file sementara pakai email hash supaya unik sebelum insert
    const tempName = `ktm-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("ktm") // ← buat bucket "ktm" di Supabase Storage (public/private)
      .upload(tempName, optimizedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) throw new Error("Gagal upload KTM: " + uploadError.message);

    const { data: publicData } = supabase.storage
      .from("ktm")
      .getPublicUrl(tempName);
    ktmUrl = publicData.publicUrl;
  }

  // insert user ke database
  const insertPayload = {
    name,
    username,
    email,
    password: hashedPassword,
    is_seller: isSeller,
  };

  // simpan ktm_url jika kolomnya ada di tabel users
  if (ktmUrl) insertPayload.ktm_url = ktmUrl;

  const { data, error } = await supabase
    .from("users")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;

  // rename file KTM pakai user id yang baru dapat
  if (ktmFile && ktmUrl) {
    const oldName = ktmUrl.split("/").pop();
    const newName = `ktm-user-${data.id}.webp`;
    await supabase.storage.from("ktm").move(oldName, newName);

    const { data: renamed } = supabase.storage.from("ktm").getPublicUrl(newName);
    await supabase
      .from("users")
      .update({ ktm_url: renamed.publicUrl })
      .eq("id", data.id);

    data.ktm_url = renamed.publicUrl;
  }

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

  if (error || !data) throw new Error("Email tidak ditemukan");

  const auth = new Auth(email, password);
  const isMatch = await auth.verifyPassword(data.password);
  if (!isMatch) throw new Error("Password salah");

  return data;
};

module.exports = { register, login };
