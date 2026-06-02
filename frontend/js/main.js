let currentCategory = "semua";
let currentSearch = "";
let currentUser = null;
let searchTimeout;

/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    currentUser = user;

    const avatar = document.querySelector(".avatar-btn");
    if (avatar) {
      avatar.innerHTML = user.avatar_url
        ? `<img src="${user.avatar_url}">`
        : `<div class="avatar-placeholder">
          ${user.name
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
          </div>`;
    }

    const greetingText = document.querySelector(".greeting-text");
    greetingText.innerHTML = `
      <h2>Halo, ${user.name.split(" ")[0]}! 👋</h2>
      <p>Memuat produk terbaru...</p>
    `;
  } catch (err) {
    console.error(err);
  }
}

/* -- Format uang dalam Rupiah -- */
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

/* ── Kategori filter ── */
function setCategory(btn, cat) {
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = cat;
  loadProducts();
}

/* ── Search filter ── */
function filterProducts() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = document.getElementById("searchInput").value.trim();
    loadProducts();
  }, 400);
}

/* ── Scroll arrows + state ── */
const row = document.getElementById("productsRow");
const arrowL = document.getElementById("arrowLeft");
const arrowR = document.getElementById("arrowRight");

function updateArrows() {
  arrowL.classList.toggle("disabled", row.scrollLeft <= 0);
  arrowR.classList.toggle(
    "disabled",
    row.scrollLeft >= row.scrollWidth - row.clientWidth - 2,
  );
}

function scrollRow(amount) {
  row.scrollBy({ left: amount, behavior: "smooth" });
  setTimeout(updateArrows, 350);
}

row.addEventListener("scroll", updateArrows);

/* -- Tampilkan produk yang direkomendasikan -- */
function renderRecommendationProducts(products) {
  const container = document.getElementById("productsRow");
  container.innerHTML = "";

  products.forEach((product) => {
    const image =
      product.product_images?.[0]?.image_url ||
      "https://placehold.co/400x400?text=No+Image\\nAvailable";
    container.innerHTML += `
      <div class="product-card" onclick="openProduct(${product.id})">
        <div class="product-img">
          <img src="${image}" alt="${product.name}">
        </div>
        <div class="product-likes">❤️ ${product.like_count || 0}</div>
        <div class="product-name">
          <span class="product-dot"></span>
          ${product.name}
        </div>
        <div class="product-price">${formatRupiah(product.price)}</div>
      </div>
    `;
  });
}

/* -- Tampilkan produk dari seller -- */
function renderProducts(products) {
  const grid = document.getElementById("sellersGrid");
  grid.innerHTML = "";

  products.forEach((product) => {
    const image =
      product.product_images?.[0]?.image_url ||
      "https://placehold.co/400x400?text=No+Image\\nAvailable";
    grid.innerHTML += `
      <div class="seller-card" onclick="openProduct(${product.id})">
        <div class="seller-img">
          <img src="${image}" alt="${product.name}">
        </div>
        <div class="seller-info">
          <div class="seller-header">
            <div class="seller-avatar"></div>
            <span class="seller-name" title="${product.seller.name}">${product.seller.name}</span>
          </div>
          <div class="seller-loc">${product.location || "-"}</div>
          <div class="seller-product">${product.name}</div>
          <div class="seller-price">${formatRupiah(product.price)}</div>
        </div>
      </div>
    `;
  });
}

/* -- Ambil produk yang direkomendasikan */
async function loadRecommendedProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    const products = result.data.items;

    /* =========================
       Greeting jumlah produk teman
    ========================= */
    if (currentUser) {
      const friendProducts = products.filter(
        (product) => product.seller_id !== currentUser.id,
      );

      const greetingText = document.querySelector(".greeting-text");
      greetingText.innerHTML = `
        <h2>Halo, ${currentUser.name.split(" ")[0]}! 👋</h2>
        <p>
          ${
            friendProducts.length
              ? `Ada ${friendProducts.length} produk baru dari temanmu hari ini`
              : "Belum ada produk baru dari temanmu hari ini"
          }
        </p>
      `;
    }

    const recommended = products
      .filter((product) => product.seller_id !== currentUser?.id)
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, 10);

    renderRecommendationProducts(recommended);
  } catch (err) {
    console.error(err);
  }
}

/* -- Ambil produk dari backend -- */
async function loadProducts() {
  try {
    const params = new URLSearchParams();
    if (currentSearch) params.append("q", currentSearch);
    if (currentCategory && currentCategory !== "semua")
      params.append("category", currentCategory);

    params.append("sort", "newest");

    const response = await fetch(`${API_URL}/products?${params}`);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    const products = result.data.items;
    renderProducts(products);
  } catch (err) {
    console.error(err);
  }
}

/* -- Navigasi ke detail produk -- */
function openProduct(productId) {
  localStorage.setItem("selectedProductId", productId);
  window.location.href = `product.html?id=${productId}`;
}

/* ── Mouse drag to scroll ── */
let isDown = false,
  startX,
  scrollLeft;

row.addEventListener("mousedown", (e) => {
  isDown = true;
  row.style.cursor = "grabbing";
  startX = e.pageX - row.offsetLeft;
  scrollLeft = row.scrollLeft;
});
row.addEventListener("mouseleave", () => {
  isDown = false;
  row.style.cursor = "grab";
});
row.addEventListener("mouseup", () => {
  isDown = false;
  row.style.cursor = "grab";
});
row.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - row.offsetLeft;
  row.scrollLeft = scrollLeft - (x - startX) * 1.2;
  updateArrows();
});

row.style.cursor = "grab";

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  await loadRecommendedProducts();
  await loadProducts();
});
