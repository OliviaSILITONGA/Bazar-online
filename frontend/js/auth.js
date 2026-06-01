<<<<<<< HEAD
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
=======
const API_URL = "http://127.0.0.1:3000";

async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Session expired");
  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
}

async function authenticatedFetch(url, options = {}) {
  let token = localStorage.getItem("accessToken");
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Token expired
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "login.html";
      throw err;
    }
  }

  return response;
>>>>>>> 5db52e0a23aaa4407c6f469124cf120284be8c50
}
