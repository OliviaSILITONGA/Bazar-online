const productId = new URLSearchParams(window.location.search).get("id");

let qty = 1;
let liked = false;
let likeCount = 0;
let selectedFiles = [];

/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    const avatar = document.querySelector(".avatar-placeholder");
    if (avatar) {
      avatar.innerHTML = user.avatar_url
        ? `<img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover;">`
        : user.name
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }
  } catch (err) {
    console.error(err);
  }
}

// =========================
// PRODUCT
// =========================

async function loadProduct() {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    renderProduct(result.data);
  } catch (error) {
    console.error(error);
    showToast("Gagal memuat produk");
  }
}

function renderProduct(product) {
  document.getElementById("productTitle").textContent = product.name || "-";
  document.getElementById("productSubtitle").textContent =
    product.short_description || "";
  document.getElementById("productPrice").textContent =
    `Rp ${Number(product.price || 0).toLocaleString("id-ID")}`;
  document.getElementById("deliveryFee").textContent =
    `Rp ${Number(product.delivery_fee || 0).toLocaleString("id-ID")}`;
  document.getElementById("productDescription").textContent =
    product.description || "-";
  document.getElementById("sellerName").textContent =
    product.seller?.name || "-";
  document.getElementById("sellerUsername").textContent =
    product.seller?.username || "-";
  document.getElementById("sellerLocation").textContent =
    product.seller?.location || "-";
  likeCount = product.like_count || 0;
  document.getElementById("likeCountDisplay").textContent = likeCount;
  renderImages(product.product_images);
  renderTags(product.tags);
}

function renderImages(images = []) {
  const mainImg = document.getElementById("mainImg");
  const thumbRow = document.querySelector(".thumb-row");

  if (!images || images.length === 0) {
    mainImg.innerHTML = "📦";
    thumbRow.innerHTML = "";
    return;
  }

  mainImg.innerHTML = `
    <img
      src="${images[0].image_url}"
      style="width:100%;height:100%;object-fit:cover;">
  `;

  thumbRow.innerHTML = "";

  images.forEach((image, index) => {
    const thumb = document.createElement("div");
    thumb.className = `thumb ${index === 0 ? "active" : ""}`;
    thumb.innerHTML = `
      <img
        src="${image.image_url}"
        style="width:100%;height:100%;object-fit:cover;">
    `;
    thumb.onclick = () => {
      mainImg.innerHTML = `
        <img
          src="${image.image_url}"
          style="width:100%;height:100%;object-fit:cover;">
      `;
      document
        .querySelectorAll(".thumb")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    };

    thumbRow.appendChild(thumb);
  });
}

function renderTags(tags) {
  const container = document.querySelector(".desc-tags");
  if (!container) return;
  container.innerHTML = "";

  if (!tags) return;
  tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const span = document.createElement("span");
      span.className = "desc-tag";
      span.textContent = tag;

      container.appendChild(span);
    });
}

// =========================
// REVIEWS
// =========================

async function loadReviews() {
  try {
    const response = await fetch(`${API_URL}/reviews/product/${productId}`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    renderReviews(result.data);
  } catch (error) {
    console.error(error);
  }
}

function renderReviews(reviews = []) {
  const reviewList = document.getElementById("reviewList");
  reviewList.innerHTML = "";

  reviews.forEach((review) => {
    const userName = review.user_name || "Anonim";
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-header">
        <div class="reviewer-avatar">
          ${userName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div class="reviewer-name">${userName}</div>
          <div class="reviewer-date">
            ${new Date(review.created_at).toLocaleDateString("id-ID")}
          </div>
        </div>
        <div
          class="review-liked"
          style="${review.rating >= 4 ? "" : "color:var(--gray-400);"}">
          ${review.rating >= 4 ? "❤️ Suka" : "🤍 Kurang"}
        </div>
      </div>
      <p class="review-text">${review.comment || "Tidak ada komentar"}</p>
    `;

    reviewList.appendChild(card);
  });
}

function renderReviewSummary(reviews) {
  const totalReviews = reviews.length;
  const positiveReviews = reviews.filter((review) => review.rating >= 4).length;
  const negativeReviews = totalReviews - positiveReviews;
  const positivePercentage =
    totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;
  const negativePercentage =
    totalReviews > 0 ? (negativeReviews / totalReviews) * 100 : 0;
  document.getElementById("reviewLikeCount").textContent = positiveReviews;
  document.getElementById("positiveReviewCount").textContent = positiveReviews;
  document.getElementById("negativeReviewCount").textContent = negativeReviews;
  document.getElementById("positiveReviewBar").style.width =
    `${positivePercentage}%`;
  document.getElementById("negativeReviewBar").style.width =
    `${negativePercentage}%`;
  document.getElementById("reviewCount").textContent = totalReviews;
  document.getElementById("reviewSummaryCount").textContent = totalReviews;
}

// =========================
// SIMILAR PRODUCTS
// =========================

async function loadSimilarProducts() {
  try {
    const response = await fetch(`${API_URL}/products/${productId}/similar`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    renderSimilarProducts(result.data);
  } catch (error) {
    console.error(error);
  }
}

function renderSimilarProducts(products = []) {
  const container = document.querySelector(".similar-row");
  container.innerHTML = "";

  products.forEach((product) => {
    const imageUrl =
      product.product_images?.[0]?.image_url || "https://placehold.co/400x400";
    container.innerHTML += `
      <a class="sim-card" href="product.html?id=${product.id}">
        <div class="sim-img">
          <img
            src="${imageUrl}"
            style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="sim-name">${product.name}</div>
        <div class="sim-price">
          Rp ${Number(product.price || 0).toLocaleString("id-ID")}
        </div>
      </a>
    `;
  });
}

// =========================
// QTY
// =========================

function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById("qtyNum").textContent = qty;
}

// =========================
// CART
// =========================

async function addToCart() {
  try {
    const response = await authenticatedFetch(`${API_URL}/cart/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        quantity: qty,
      }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    showToast("Produk ditambahkan ke keranjang");
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

// =========================
// LIKE REVIEW
// =========================

function toggleLike() {
  liked = !liked;
  const btn = document.getElementById("likeToggleBtn");
  btn.classList.toggle("liked", liked);
  btn.innerHTML = liked
    ? `
      <svg viewBox="0 0 24 24"
        style="width:16px;height:16px;
        stroke:var(--red);
        fill:var(--red);
        stroke-width:2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      Sudah like!
    `
    : `
      <svg viewBox="0 0 24 24"
        style="width:16px;height:16px;
        stroke:var(--gray-400);
        fill:none;
        stroke-width:2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      Berikan like
    `;
}

// =========================
// REVIEW FILES
// =========================

function handleFiles(e) {
  const files = Array.from(e.target.files);
  const preview = document.getElementById("previewArea");
  files.forEach((f) => {
    selectedFiles.push(f);
    const item = document.createElement("div");
    item.className = "wr-preview-item";
    if (f.type.startsWith("image/")) {
      const img = document.createElement("img");
      const url = URL.createObjectURL(f);
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
      };
      item.appendChild(img);
    } else {
      item.textContent = "🎬";
    }
    const rm = document.createElement("div");
    rm.className = "remove-img";
    rm.textContent = "×";
    rm.onclick = () => {
      selectedFiles = selectedFiles.filter((file) => file !== f);
      item.remove();
    };
    item.appendChild(rm);
    preview.appendChild(item);
  });
}

// =========================
// SUBMIT REVIEW
// =========================

async function kirimUlasan() {
  const comment = document.getElementById("reviewText").value.trim();
  if (!comment) {
    return showToast("Isi ulasan terlebih dahulu");
  }
  try {
    const response = await authenticatedFetch(`${API_URL}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        comment,
        rating: liked ? 5 : 2,
      }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    showToast("Ulasan berhasil dikirim");

    document.getElementById("reviewText").value = "";
    document.getElementById("previewArea").innerHTML = "";
    selectedFiles = [];
    liked = false;

    await loadReviews();
    await loadProduct();
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

// =========================
// TOAST
// =========================

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", async () => {
  if (!productId) {
    showToast("Produk tidak ditemukan");
    return;
  }

  await loadCurrentUser();
  await loadProduct();
  await loadReviews();
  await loadSimilarProducts();
});