const API_URL = "http://localhost:3000";

function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}

function requireLogin() {
  if (!localStorage.getItem("accessToken")) {
    window.location.href = "landing.html";
    return false;
  }
  return true;
}

async function loadCurrentUserData() {
  if (!requireLogin()) throw new Error("User belum login");
  const res = await authenticatedFetch(`${API_URL}/users/me`);
  if (!res.ok) throw new Error("Gagal memuat profil user");
  const result = await res.json();
  return result.data;
}

function getUserInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .filter((part) => part)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
