function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("btnLogin").classList.add("active");
  document.getElementById("btnRegister").classList.remove("active");
  document.getElementById("formTitle").textContent = "Selamat datang! 👋";
  document.getElementById("formSub").textContent = "Masuk ke akun BazarUSU-mu";
}

function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.getElementById("btnRegister").classList.add("active");
  document.getElementById("btnLogin").classList.remove("active");
  document.getElementById("formTitle").textContent = "Buat akun baru 🌿";
  document.getElementById("formSub").textContent =
    "Daftar dan mulai jualan atau jajan!";
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  const isText = input.type === "text";
  input.type = isText ? "password" : "text";
  btn.querySelector("svg").innerHTML = isText
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
}

function checkStrength(pw) {
  const el = document.getElementById("pwStrength");
  el.classList.add("show");
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const colors = ["", "#e53e3e", "#ed8936", "#ecc94b", "#7aab22"];
  const labels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  for (let i = 1; i <= 4; i++) {
    document.getElementById("bar" + i).style.background =
      i <= score ? colors[score] : "var(--gray-200)";
  }
  document.getElementById("pwLabel").textContent =
    labels[score] || "Kekuatan password";
  document.getElementById("pwLabel").style.color =
    colors[score] || "var(--gray-400)";
}

function showErr(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}

// =============================================
// ENCAPSULATION — Validasi User (dari models/encapsulation.js)
// Data disembunyikan & divalidasi sebelum dikirim ke backend
// =============================================
const UserValidator = {
  validateName(name) {
    if (typeof name !== "string" || name.length <= 0)
      throw new Error("Nama tidak boleh kosong");
  },
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Format email tidak valid.");
    return email.toLowerCase();
  },
  validatePassword(password) {
    if (typeof password !== "string" || password.length < 8)
      throw new Error("Password minimal 8 karakter.");
  },
};

async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const pw = document.getElementById("loginPw").value;
  let ok = true;

  // Validasi menggunakan UserValidator (encapsulation)
  try {
    UserValidator.validateEmail(email);
    showErr("loginEmailErr", false);
  } catch (e) {
    showErr("loginEmailErr", true);
    ok = false;
  }

  try {
    UserValidator.validatePassword(pw);
    showErr("loginPwErr", false);
  } catch (e) {
    showErr("loginPwErr", true);
    ok = false;
  }

  if (!ok) return;

  const btn = document.getElementById("btnSubmitLogin");
  btn.disabled = true;
  btn.textContent = "Memproses...";

  try {
    // Kirim ke backend /auth/login
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login gagal");

    // Simpan accessToken
    localStorage.setItem("accessToken", data.accessToken);

    // Tampilkan sukses
    document.getElementById("formArea").style.display = "none";
    document.getElementById("successBox").style.display = "block";
    document.getElementById("successTitle").textContent = "Berhasil Masuk! 🎉";
    document.getElementById("successSub").textContent =
      `Halo kembali! Yuk jelajahi produk seru di BazarUSU.`;

    toast("✅ Login berhasil");

    // Redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    toast("❌ " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk ke BazarUSU";
  }
}

async function doRegister() {
  const nama = document
    .getElementById("regNama")
    .value.trim()
    .replace(/\s+/g, " ");
  const email = document.getElementById("regEmail").value.trim();
  const pw = document.getElementById("regPw").value;
  const pw2 = document.getElementById("regPw2").value;
  const terms = document.getElementById("termsCheck").checked;
  let ok = true;

  // Validasi menggunakan UserValidator (encapsulation)
  try {
    UserValidator.validateName(nama);
    showErr("regNamaErr", false);
  } catch (e) {
    showErr("regNamaErr", true);
    ok = false;
  }

  try {
    UserValidator.validateEmail(email);
    showErr("regEmailErr", false);
  } catch (e) {
    showErr("regEmailErr", true);
    ok = false;
  }

  try {
    UserValidator.validatePassword(pw);
    showErr("regPwErr", false);
  } catch (e) {
    showErr("regPwErr", true);
    ok = false;
  }

  if (pw !== pw2) {
    showErr("regPw2Err", true);
    ok = false;
  } else showErr("regPw2Err", false);

  if (!terms) {
    toast("⚠️ Centang dulu syarat & ketentuannya ya!");
    ok = false;
  }
  if (!ok) return;

  const btn = document.getElementById("btnSubmitRegister");
  btn.disabled = true;
  btn.textContent = "Memproses...";

  try {
    // Kirim ke backend /auth/register
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nama, email, password: pw }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Registrasi gagal");

    // Tampilkan sukses
    document.getElementById("formArea").style.display = "none";
    document.getElementById("successBox").style.display = "block";
    document.getElementById("successTitle").textContent =
      "Akun Berhasil Dibuat! 🌿";
    document.getElementById("successSub").textContent =
      `Halo ${nama}! Selamat bergabung di BazarUSU. Yuk mulai jelajahi!`;
  } catch (err) {
    toast("❌ " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Buat Akun Sekarang";
  }
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("accessToken");
  if (token) window.location.href = "index.html";
});
