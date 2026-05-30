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
}
