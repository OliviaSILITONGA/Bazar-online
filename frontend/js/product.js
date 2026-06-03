const productId = new URLSearchParams(window.location.search).get("id");

let qty = 1;
let liked = false;
let likeCount = 0;
let selectedFiles = [];
let currentProduct = null;

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
  currentProduct = product;

  document.getElementById("productTitle").textContent = product.name || "-";

  document.getElementById("productPrice").textContent = `Rp ${Number(
    product.price || 0,
  ).toLocaleString("id-ID")}`;

  document.getElementById("deliveryFee").textContent = `Rp ${Number(
    product.delivery_fee || 0,
  ).toLocaleString("id-ID")}`;

  document.getElementById("productDescription").textContent =
    product.description || "-";

  document.getElementById("sellerName").textContent =
    product.seller?.name || "-";

  document.getElementById("sellerUsername").textContent =
    product.seller?.username || "-";

  document.getElementById("sellerLocation").textContent =
    product.seller?.location || "Tidak diketahui";

  // =========================
  // PROFILE LINK
  // =========================

  document.getElementById("sellerProfileLink").href =
    `profile-orang.html?id=${product.seller.id}`;

  // =========================
  // SELLER AVATAR
  // =========================

  const avatar = document.getElementById("sellerAvatar");

  if (product.seller?.avatar_url) {
    avatar.innerHTML = `
      <img
        src="${product.seller.avatar_url}"
        alt="${product.seller.name}">
    `;
  } else {
    avatar.textContent =
      product.seller?.name
        ?.split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";
  }

  // =========================
  // CATEGORY
  // =========================

  document.getElementById("productCategory").textContent =
    product.category || "lainnya";

  // =========================
  // BADGE BARU
  // =========================

  const newBadge = document.getElementById("newBadge");

  const createdAt = new Date(product.created_at);

  const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  newBadge.style.display = diffDays <= 7 ? "inline-flex" : "none";

  // =========================
  // STOCK
  // =========================

  const stockBadge = document.getElementById("stockBadge");

  if ((product.stock || 0) <= 0) {
    stockBadge.textContent = "stok habis";
    stockBadge.classList.add("badge-out-stock");
  } else {
    stockBadge.textContent = `stok ${product.stock}`;
  }

  likeCount = product.like_count || 0;

  document.getElementById("likeCountDisplay").textContent = likeCount;

  const whatsappBtn = document.querySelector(".btn-chat");

  if (!product.seller?.phone) {
    whatsappBtn.disabled = true;
    whatsappBtn.textContent = "WhatsApp tidak tersedia";
  }

  renderImages(product.product_images);
  renderTags(product.tags);

  updateActionButtons(product);
}

function renderImages(images = []) {
  const mainImg = document.getElementById("mainImg");
  const thumbRow = document.querySelector(".thumb-row");

  if (!images || images.length === 0) {
    mainImg.innerHTML = `
      <img src="https://placehold.co/400x400?text=No+Image\\nAvailable">
    `;
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

  renderReviewSummary(reviews);

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

  if (!products.length) {
    container.innerHTML = `
      <div style="
        color:var(--gray-400);
        padding:12px;
        font-size:13px;
        text-align:center;
        width:100%;">
        Belum ada produk serupa.
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const imageUrl =
      product.product_images?.[0]?.image_url ||
      "https://placehold.co/400x400?text=No+Image\\nAvailable";
    container.innerHTML += `
      <a class="sim-card" href="product.html?id=${product.id}">
        <div class="sim-img">
          <img src="${imageUrl}" alt="${product.name}">
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
  if (!currentProduct) return;

  qty += delta;

  if (qty < 1) qty = 1;

  if (currentProduct.stock && qty > currentProduct.stock) {
    qty = currentProduct.stock;
  }

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

function updateActionButtons(product) {
  const cartBtn = document.querySelector(".btn-cart");

  if ((product.stock || 0) <= 0) {
    cartBtn.textContent = "Stok Habis";
    cartBtn.classList.add("btn-disabled");
  }
}

function normalizeWhatsapp(phone) {
  phone = phone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
    return "62" + phone.slice(1);
  }

  return phone;
}

function openWhatsappSeller() {
  if (!currentProduct?.seller?.phone) {
    showToast("Nomor WhatsApp penjual tidak tersedia");
    return;
  }

  const phone = normalizeWhatsapp(currentProduct.seller.phone);

  const message =
    "Halo kak.\n\nSaya tertarik dengan produk:\n\n" +
    currentProduct.name +
    "\n\nHarga:\nRp " +
    Number(currentProduct.price).toLocaleString("id-ID") +
    "\n\nApakah produk ini masih tersedia?";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
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

async function checkReviewPermission() {
  try {
    const response = await authenticatedFetch(
      `${API_URL}/reviews/can-review/${productId}`,
    );

    if (!response.ok) return;

    const result = await response.json();

    document.getElementById("writeReviewPanel").style.display = result.data
      .canReview
      ? "block"
      : "none";
  } catch (err) {
    console.error(err);
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
  await checkReviewPermission();
  await loadSimilarProducts();
});
