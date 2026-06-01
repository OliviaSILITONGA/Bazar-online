let currentModal = "";
let currentUser = null;

/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    currentUser = user;

    document.getElementById("displayName").textContent = user.name;
    document.getElementById("displayUsername").textContent = user.username;
    document.getElementById("displayBio").textContent =
      user.bio || "Belum ada bio";

    const avatarCircle = document.getElementById("avatarCircle");
    avatarCircle.innerHTML = user.avatar_url
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
  } catch (err) {
    showToast("❌", err.message);
  }
}

/* ── Tab switching ── */
function switchTab(tab) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("content-" + tab).classList.add("active");
}

/* ── Avatar ── */
async function changeAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await authenticatedFetch(`${API_URL}/users/me/avatar`, {
      method: "PUT",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    const avatarUrl = result.data.avatar_url;

    document.getElementById("avatarCircle").innerHTML =
      `<img src="${avatarUrl}" alt="Avatar">`;
    showToast("📸 Foto profil diperbarui!");
    await loadCurrentUser();
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function loadMyProducts() {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/users/${currentUser.id}/products`,
    );
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    renderProducts(data.data || []);
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  document.getElementById("statProduk").textContent = products.length;
  document.getElementById("count-produk").textContent = products.length;
  let html = "";
  if (products.length) {
    html = products
      .map(
        (product) => `
      <a class="prod-card" href="product.html?id=${product.id}">
        <div class="prod-img">
          <img src="${
            product.product_images?.[0]?.image_url ||
            "https://placehold.co/400x400?text=No+Image\\nAvailable"
          }">
          <span class="prod-badge-sold">
            ${product.sold_count || 0} terjual
          </span>
          <span class="prod-like-badge">
            ❤️ ${product.like_count || 0}
          </span>
        </div>
        <div class="prod-info">
          <div class="prod-name">${product.name}</div>
          <div class="prod-cat">${product.category || "-"}</div>
          <div class="prod-price">
            Rp ${Number(product.price).toLocaleString("id-ID")}
          </div>
        </div>
      </a>
    `,
      )
      .join("");
  }
  html += `
    <a class="prod-card-add" href="add-product.html">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <span>Tambah Produk</span>
    </a>
  `;
  grid.innerHTML = html;
}

async function loadLikedProducts() {
  const res = await authenticatedFetch(`${API_URL}/products/liked`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message);
  renderLikedProducts(data.data || []);
}

function renderLikedProducts(products) {
  const grid = document.querySelector(".liked-grid");
  document.getElementById("statSuka").textContent = products.length;
  const likeCount = document.querySelector("#tab-disukai .tab-count");
  likeCount.textContent = products.length;

  if (!products.length) {
    grid.style.display = "block";
    grid.innerHTML = `
      <div class="empty-state">
        <div class="emoji">❤️</div>
        <p>Belum ada produk disukai</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products
    .map(
      (product) => `
      <a class="liked-card" href="product.html?id=${product.id}">
        <div class="liked-img">
          <img src="${
            product.product_images?.[0]?.image_url ||
            "https://placehold.co/400x400?text=No+Image\\nAvailable"
          }">
        </div>
        <div class="liked-info">
          <div class="liked-seller">${product.seller.name || "-"}</div>
          <div class="liked-name">${product.name}</div>
          <div class="liked-price">
            Rp ${Number(product.price).toLocaleString("id-ID")}
          </div>
        </div>
      </a>
    `,
    )
    .join("");
}

async function loadMyReviews() {
  const res = await authenticatedFetch(`${API_URL}/users/${currentUser.id}/reviews`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message);
  renderReviews(data.data || []);
}

function renderReviews(reviews) {
  const container = document.getElementById("reviewsContainer");
  const reviewCount = document.querySelector("#tab-ulasan .tab-count");
  reviewCount.textContent = reviews.length;
  if (!reviews.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">✍️</div>
        <p>Belum ada ulasan</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews
    .map(
      (review) => `
      <div style="
        background:var(--white);
        border:1px solid var(--gray-200);
        border-radius:var(--radius-lg);
        padding:14px 16px;
        margin-bottom:12px;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:8px;
        ">
          <div style="font-size:28px;">📦</div>
          <div>
            <div style="
              font-family:'Nunito',sans-serif;
              font-weight:700;
              font-size:13px;
              color:var(--gray-800);
            ">${review.products.name || "Produk"}</div>
            <div style="font-size:11px;color:var(--gray-400);">
              ${review.product.seller.name} · ${
                review.created_at
                  ? new Date(review.created_at).toLocaleDateString("id-ID")
                  : ""
              }
            </div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--gray-600);line-height:1.6;">
          ${review.body || ""}
        </p>
      </div>
    `,
    )
    .join("");
}

/* ── Modal edit nama/bio ── */
function openModal(type) {
  currentModal = type;
  const overlay = document.getElementById("modalOverlay");
  const nameIn = document.getElementById("modalNameInput");
  const userIn = document.getElementById("modalUsernameInput");
  const bioIn = document.getElementById("modalBioInput");
  const title = document.getElementById("modalTitle");

  nameIn.style.display = "none";
  userIn.style.display = "none";
  bioIn.style.display = "none";

  if (type === "name") {
    title.textContent = "✏️ Edit Nama & Username";
    nameIn.style.display = "block";
    userIn.style.display = "block";
    nameIn.value = document.getElementById("displayName").textContent;
    userIn.value = document.getElementById("displayUsername").textContent;
  } else {
    title.textContent = "✏️ Edit Bio";
    bioIn.style.display = "block";
    bioIn.value = document.getElementById("displayBio").textContent;
  }
  overlay.classList.add("show");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modalOverlay")) {
    document.getElementById("modalOverlay").classList.remove("show");
  }
}

async function saveModal() {
  try {
    const payload = {};
    if (currentModal === "name") {
      const name = document.getElementById("modalNameInput").value.trim();
      const username = document
        .getElementById("modalUsernameInput")
        .value.trim();
      if (!name) throw new Error("Nama tidak boleh kosong");
      if (!username) throw new Error("Username tidak boleh kosong");
      payload.name = name;
      payload.username = username;
    } else {
      const bio = document.getElementById("modalBioInput").value.trim();
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
    document.getElementById("modalOverlay").classList.remove("show");
    showToast("✅ Profil berhasil diperbarui!");
    await loadCurrentUser();
  } catch (err) {
    showToast("❌", err.message);
  }
}

/* ── Share ── */
function shareProfile() {
  if (navigator.share) {
    navigator.share({
      title: `BazarUSU — ${user.name}`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast("🔗 Link profil disalin!");
  }
}

function openFollowers() {
  showToast("👥 20 followers");
}
function openFollowing() {
  showToast("👣 13 following");
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  await loadMyProducts();
  await loadLikedProducts();
  await loadMyReviews();
});
