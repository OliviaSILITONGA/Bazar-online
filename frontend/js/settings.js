/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    const userAvatar = document.querySelector(".user-avatar");
    const userName = document.querySelector(".user-name");
    const userEmail = document.querySelector(".user-email");
    userAvatar.innerHTML = user.avatar_url
      ? `<img
        src=${user.avatar_url}
        alt="Avatar"
        style="width:100%;height:100%;object-fit:cover;">
      `
      : user.name
          .split(" ")
          .map((x) => x[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
    userName.textContent = user.name;
    userEmail.textContent = user.email;

    document.getElementById("settingEmail").textContent = user.email;
    document.getElementById("settingPhone").textContent = user.phone
      ? user.phone
      : "Belum diisi";

    document.getElementById("inputEmail").value = user.email;
    document.getElementById("inputNoHP").value = user.phone ? user.phone : "";
  } catch (err) {
    console.error(err);
  }
}

function bukaModal(id) {
  document.getElementById("modal-" + id).classList.add("show");
}
function tutupModal(e, id) {
  if (!e || e.target.id === id)
    document.getElementById(id).classList.remove("show");
}
async function simpan(id, msg) {
  try {
    const payload = {};
    switch (id) {
      case "email":
        payload.email = document.getElementById("inputEmail").value.trim();
        payload.currentPassword = document.getElementById(
          "inputPasswordKonfirmasi",
        ).value;
        break;
      case "password":
        const oldPw = document.getElementById("inputPassword1").value;
        const newPw = document.getElementById("inputPassword2").value;
        const confirmPw = document.getElementById(
          "inputPassword2Konfirmasi",
        ).value;

        if (newPw !== confirmPw)
          return toast("❌ Konfirmasi password tidak cocok");

        if (newPw.length < 8) return toast("❌ Password minimal 8 karakter");

        payload.currentPassword = oldPw;
        payload.password = newPw;
        break;
      case "nohp":
        payload.phone = document.getElementById("inputNoHP").value.trim();
        break;
      default:
        throw new Error("Field tidak dikenali");
    }

    const response = await authenticatedFetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    document.getElementById(`modal-${id}`).classList.remove("show");
    toast(msg);
    window.location.reload();
  } catch (err) {
    console.error(err);
    toast(err.message || "Gagal menyimpan perubahan");
  }
}
function toggleSwitch(el) {
  el.classList.toggle("on");
  toast(
    el.classList.contains("on")
      ? "🔔 Notifikasi diaktifkan"
      : "🔕 Notifikasi dinonaktifkan",
  );
}
async function doLogout() {
  try {
    const response = await authenticatedFetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    document.getElementById("modal-logout").classList.remove("show");
    toast("👋 Sampai jumpa! Kamu berhasil keluar.");
    localStorage.removeItem("accessToken");
    setTimeout(() => (window.location.href = "login.html"), 1800);
  } catch (err) {
    console.error(err);
  }
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
});
