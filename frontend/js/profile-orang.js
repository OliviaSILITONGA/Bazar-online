const params = new URLSearchParams(window.location.search);
const profileId = params.get("id");

let profile = null;
let isFollowing = false;
let followerCount = 0;

window.onload = async () => {
  if (!profileId) {
    toast("Profil tidak ditemukan");
    return;
  }

  await loadProfile();
  await loadProducts();
  await loadReviews();
};

async function loadProfile() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/${profileId}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    profile = result.data;

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
    avatar.textContent = profile.name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  renderStats();
  renderFollowButton();
}

function renderStats() {
  document.getElementById("productCount").textContent = profile.product_count;

  document.getElementById("likeCount").textContent = profile.total_likes;

  document.getElementById("followerNum").textContent = profile.follower_count;

  document.getElementById("followingCount").textContent =
    profile.following_count;
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

    if (isFollowing) {
      followerCount++;
    } else {
      followerCount--;
    }

    profile.follower_count = followerCount;

    renderFollowButton();
    renderStats();
  } catch (err) {
    console.error(err);
    toast(err.message);
  }
}

async function loadProducts() {
  try {
    const response = await authenticatedFetch(
      `${API_URL}/users/${profileId}/products`,
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    renderProducts(result.data);
  } catch (err) {
    console.error(err);
  }
}

function renderProducts(products) {
  const container = document.getElementById("productGrid");

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p>Belum ada produk.</p>";
    return;
  }

  products.forEach((product) => {
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
            ${product.name}
          </div>

          <div class="prod-cat">
            ${product.category || ""}
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
  try {
    const response = await authenticatedFetch(
      `${API_URL}/users/${profileId}/reviews`,
    );

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

  data.reviews.forEach((review) => {
    const initials = review.reviewer.name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("");

    container.innerHTML += `
      <div class="rev-card">
        <div class="rev-header">
          <div class="rev-avatar">
            ${initials}
          </div>

          <div>
            <div class="rev-name">
              ${review.reviewer.name}
            </div>

            <div class="rev-date">
              ${new Date(review.created_at).toLocaleDateString("id-ID")}
            </div>
          </div>
        </div>

        <span class="rev-product">
          ${review.product.name}
        </span>

        <p class="rev-text">
          ${review.body || ""}
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

function shareProfile() {
  if (navigator.share) {
    navigator.share({
      title: "BazarUSU — Olivia Gabriella",
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    toast("🔗 Link profil disalin!");
  }
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
