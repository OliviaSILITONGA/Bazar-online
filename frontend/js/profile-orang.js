const params = new URLSearchParams(window.location.search);

const profileId = Number(params.get("id"));

let profile = null;
let isFollowing = false;
let followerCount = 0;
let followLoading = false;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInitials(name = "U") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeWhatsapp(phone) {
  phone = phone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
    return "62" + phone.slice(1);
  }

  return phone;
}

window.onload = async () => {
  if (!Number.isInteger(profileId) || profileId <= 0) {
    toast("Profil tidak ditemukan");
    return;
  }

  await loadProfile();
  await Promise.all([loadProducts(), loadReviews()]);
};

async function loadProfile() {
  const container = document.getElementById("productGrid");

  container.innerHTML = `
    <div class="loading-state">
      Memuat produk...
    </div>
  `;
  try {
    const response = await authenticatedFetch(`${API_URL}/users/${profileId}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    profile = result.data;
    console.log(profile);

    isFollowing = profile.is_following;
    followerCount = profile.follower_count;

    renderProfile();
  } catch (err) {
    console.error(err);
    toast(err.message);
  }
}

function renderProfile() {
  document.querySelector(".profile-name").textContent = profile.name;

  document.querySelector(".profile-username").textContent =
    `@${profile.username}`;

  document.querySelector(".bio-text").textContent =
    profile.bio || "Belum ada bio";

  const avatar = document.querySelector(".avatar-circle");

  if (profile.avatar_url) {
    avatar.innerHTML = `
      <img
        src="${profile.avatar_url}"
        alt="${profile.name}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:50%;
        "
      >
    `;
  } else {
    avatar.textContent = avatar.textContent = getInitials(profile.name);
  }

  document.getElementById("profileLocation").textContent =
    profile.location || "Belum diisi";

  document.getElementById("whatsappMessage").href = `https://wa.me/${normalizeWhatsapp(profile.phone)}`;
  document.getElementById("whatsappMessage").setAttribute("target", "_blank");

  renderStats();
  renderFollowButton();
}

function renderStats() {
  document.getElementById("productCount").textContent = profile.product_count;

  document.getElementById("likeCount").textContent = profile.total_likes;

  document.getElementById("followerNum").textContent = profile.follower_count;

  document.getElementById("followingCount").textContent =
    profile.following_count;

  document.getElementById("profileLikeCount").textContent = profile.total_likes;

  document.getElementById("profileCreationDate").textContent =
    new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(profile.created_at));
}

function renderFollowButton() {
  const btn = document.getElementById("btnFollow");

  if (isFollowing) {
    btn.className = "btn-follow following";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
      Following
    `;
  } else {
    btn.className = "btn-follow";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
      Follow
    `;
  }
}

async function toggleFollow() {
  if (followLoading) return;

  followLoading = true;

  try {
    const response = await authenticatedFetch(
      `${API_URL}/users/${profileId}/follow`,
      {
        method: "POST",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    isFollowing = result.data.following;

    if (typeof result.data.follower_count === "number") {
      profile.follower_count = result.data.follower_count;
    } else {
      profile.follower_count = Math.max(
        0,
        profile.follower_count + (isFollowing ? 1 : -1),
      );
    }

    renderFollowButton();
    renderStats();
  } catch (err) {
    console.error(err);
    toast(err.message);
  } finally {
    followLoading = false;
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/users/${profileId}/products`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    renderProducts(result.data);
  } catch (err) {
    console.error(err);
  }
}

function renderProducts(products = []) {
  const container = document.getElementById("productGrid");

  container.innerHTML = "";

  document.getElementById("produkCount").textContent = products.length;

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        Belum ada produk yang dijual.
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const safeName = escapeHtml(product.name);
    const safeCategory = escapeHtml(product.category || "");

    const image = product.product_images?.[0]?.image_url || "";

    container.innerHTML += `
      <a
        class="prod-card"
        href="product.html?id=${product.id}"
      >
        <div class="prod-img">
          ${
            image
              ? `<img
                   src="${image}"
                   style="
                     width:100%;
                     height:100%;
                     object-fit:cover;
                   "
                 >`
              : "📦"
          }

          <span class="prod-like">
            ❤️ ${product.like_count}
          </span>
        </div>

        <div class="prod-info">
          <div class="prod-name">
            ${safeName}
          </div>

          <div class="prod-cat">
            ${safeCategory}
          </div>

          <div class="prod-price">
            Rp ${Number(product.price).toLocaleString("id-ID")}
          </div>
        </div>
      </a>
    `;
  });
}

async function loadReviews() {
  const container = document.getElementById("reviewList");

  container.innerHTML = `
    <div class="loading-state">
      Memuat ulasan...
    </div>
  `;
  try {
    const response = await fetch(`${API_URL}/users/${profileId}/reviews`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    renderReviews(result.data);
  } catch (err) {
    console.error(err);
  }
}

function renderReviews(data) {
  const container = document.getElementById("reviewList");

  container.innerHTML = "";

  document.getElementById("reviewCount").textContent = data.reviews.length;

  if (!data.reviews?.length) {
    container.innerHTML = `
      <div class="empty-state">
        Belum ada ulasan.
      </div>
    `;
    return;
  }

  data.reviews.forEach((review) => {
    const reviewerName = review.reviewer?.name || "Anonim";

    const initials = getInitials(reviewerName);

    const reviewBody = escapeHtml(review.body || "");

    const productName = escapeHtml(review.product?.name || "Produk");

    container.innerHTML += `
      <div class="rev-card">
        <div class="rev-header">

          <div class="rev-avatar">
            ${initials}
          </div>

          <div>
            <div class="rev-name">
              ${escapeHtml(reviewerName)}
            </div>

            <div class="rev-date">
              ${new Date(review.created_at).toLocaleDateString("id-ID")}
            </div>
          </div>

        </div>

        <span class="rev-product">
          ${productName}
        </span>

        <p class="rev-text">
          ${reviewBody}
        </p>

      </div>
    `;
  });
}

function switchTab(tab) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-pane")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("pane-" + tab).classList.add("active");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
