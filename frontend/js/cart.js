// ============================================================
// cart.js — Menghubungkan cart.html ke backend API
// ============================================================

// State lokal: { [itemId]: { price, qty, on, stock } }
const data = {};

// ── Helpers ─────────────────────────────────────────────────

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

function showEmpty() {
  document.querySelectorAll(".seller-group").forEach((g) => (g.style.display = "none"));
  const listHeader = document.getElementById("listHeader");
  const emptyState = document.getElementById("emptyState");
  const bottomBar = document.getElementById("bottomBar");
  if (listHeader) listHeader.style.display = "none";
  if (emptyState) emptyState.style.display = "block";
  if (bottomBar) bottomBar.style.display = "none";
}

function hitung() {
  let total = 0, cnt = 0;
  Object.values(data).forEach((d) => {
    if (!d.on) return;
    total += d.price * d.qty;
    cnt += d.qty;
  });
  // Update semua sub-total per item
  Object.entries(data).forEach(([id, d]) => {
    const subEl = document.getElementById("sub-" + id);
    if (subEl) subEl.textContent = "× " + d.qty + " = " + formatRupiah(d.price * d.qty);
  });
  const totalVal = document.getElementById("totalVal");
  const cntVal = document.getElementById("cntVal");
  const btnCO = document.getElementById("btnCO");
  if (totalVal) totalVal.textContent = formatRupiah(total);
  if (cntVal) cntVal.textContent = cnt + " item dipilih";
  if (btnCO) btnCO.disabled = cnt === 0;
}

function syncAll() {
  const all = document.querySelectorAll(".item-check");
  const chk = document.querySelectorAll(".item-check:checked");
  const selectAll = document.getElementById("selectAll");
  if (selectAll) selectAll.checked = all.length > 0 && all.length === chk.length;
}

// ── API Calls ────────────────────────────────────────────────

async function apiCart(method, path = "", body = null) {
  let token = localStorage.getItem("accessToken");
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(API_URL + "/cart" + path, opts);

  // Coba refresh token kalau expired
  if (res.status === 401) {
    try {
      const r = await fetch(API_URL + "/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) throw new Error();
      localStorage.setItem("accessToken", d.accessToken);
      token = d.accessToken;
      opts.headers.Authorization = "Bearer " + token;
      res = await fetch(API_URL + "/cart" + path, opts);
    } catch {
      localStorage.removeItem("accessToken");
      window.location.href = "login.html";
      return null;
    }
  }
  return res;
}

// ── Render ───────────────────────────────────────────────────

function renderCart(items) {
  const container = document.querySelector(".main");

  // Hapus semua seller-group lama + listHeader lama
  document.querySelectorAll(".seller-group").forEach((g) => g.remove());
  const oldHeader = document.getElementById("listHeader");
  if (oldHeader) oldHeader.remove();

  const emptyState = document.getElementById("emptyState");
  const bottomBar = document.getElementById("bottomBar");

  if (!items || items.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (bottomBar) bottomBar.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (bottomBar) bottomBar.style.display = "flex";

  // Buat list header
  const listHeader = document.createElement("div");
  listHeader.className = "list-header";
  listHeader.id = "listHeader";
  listHeader.innerHTML = `
    <span class="section-label">Keranjang kamu</span>
    <label class="select-all">
      <input type="checkbox" id="selectAll" onchange="toggleAll(this)" checked> Pilih semua
    </label>
  `;

  // Grup item berdasarkan seller
  const groups = {};
  items.forEach((item) => {
    const sellerId = item.products?.seller_id || "unknown";
    const sellerName = item.products?.seller?.name || "Penjual";
    const sellerLoc = item.products?.location || "-";
    if (!groups[sellerId]) {
      groups[sellerId] = { name: sellerName, loc: sellerLoc, items: [] };
    }
    groups[sellerId].items.push(item);
  });

  // Render tiap grup seller
  const groupEls = Object.entries(groups).map(([sellerId, group]) => {
    const initials = group.name
      .split(" ")
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const itemsHTML = group.items
      .map((item) => {
        const product = item.products || {};
        const itemId = String(item.id);
        const price = product.price || 0;
        const qty = item.quantity || 1;
        const stock = product.stock || 99;
        const imageUrl = product.product_images?.[0]?.image_url || "https://placehold.co/400x400?text=No+Image\\nAvailable";

        // Simpan ke state lokal
        data[itemId] = {
          price,
          qty,
          on: true,
          stock,
          note: item.note || ""
        };

        return `
          <div class="cart-item selected" id="item-${itemId}">
            <input class="item-check" type="checkbox" checked
              onchange="cekItem(this,'${itemId}')">
            <a class="item-img" href="product.html?id=${product.id}">
              <img src="${imageUrl}" alt="${product.name}"
                style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">
            </a>
            <div class="item-body">
              <div class="item-name">${product.name || "Produk"}</div>
              <div class="item-desc">${product.category || ""} ${item.note ? "· " + item.note : ""}</div>
              <div class="item-bottom">
                <span class="item-price">${formatRupiah(price)}</span>
                <span class="item-sub" id="sub-${itemId}">× ${qty} = ${formatRupiah(price * qty)}</span>
              </div>
            </div>
            <div class="item-right">
              <button class="btn-del" onclick="hapus('${itemId}')">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
              <div class="qty-wrap">
                <button class="qty-btn" onclick="ubahQty('${itemId}',-1)">−</button>
                <span class="qty-num" id="qty-${itemId}">${qty}</span>
                <button class="qty-btn" onclick="ubahQty('${itemId}',1)">+</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    const groupEl = document.createElement("div");
    groupEl.className = "seller-group";
    groupEl.id = "group-" + sellerId;
    groupEl.innerHTML = `
      <div class="group-header">
        <div class="group-avatar">${initials}</div>
        <div style="flex:1">
          <div class="group-name">${group.name}</div>
          <div class="group-loc">📍 ${group.loc}</div>
        </div>
        <a class="btn-chat" href="messages.html">💬 Chat</a>
      </div>
      <div class="cart-list">${itemsHTML}</div>
      <input
        type="text"
        class="note-input"
        data-cart-id="${group.items[0].id}"
        value="${group.items[0].note || ""}"
        placeholder="📝 Catatan untuk ${group.name} (opsional)"
        onblur="updateNote(this)">
    `;
    return groupEl;
  });

  // Masukkan ke DOM sebelum emptyState
  container.insertBefore(listHeader, emptyState);
  groupEls.forEach((el) => container.insertBefore(el, emptyState));

  hitung();
  syncAll();
}

// ── Load Cart dari Backend ───────────────────────────────────

async function loadCart() {
  // Tampilkan loading
  const emptyState = document.getElementById("emptyState");
  if (emptyState) {
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <div class="e-emoji">⏳</div>
      <p>Memuat keranjang...</p>
    `;
  }

  const res = await apiCart("GET");
  if (!res) return;

  const result = await res.json();
  if (!res.ok) {
    toast("❌ Gagal memuat keranjang: " + result.message);
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="e-emoji">🛒</div>
        <p>Keranjangmu masih kosong</p>
        <small>Yuk lihat-lihat dulu, banyak yang enak!</small><br>
        <a class="btn-jelajah" href="index.html">Jelajahi Produk</a>
      `;
    }
    return;
  }

  // Reset empty state HTML
  if (emptyState) {
    emptyState.style.display = "none";
    emptyState.innerHTML = `
      <div class="e-emoji">🛒</div>
      <p>Keranjangmu masih kosong</p>
      <small>Yuk lihat-lihat dulu, banyak yang enak!</small><br>
      <a class="btn-jelajah" href="index.html">Jelajahi Produk</a>
    `;
  }

  renderCart(result.data || []);
}

// ── Aksi User ────────────────────────────────────────────────

function cekItem(cb, id) {
  if (!data[id]) return;
  data[id].on = cb.checked;
  const el = document.getElementById("item-" + id);
  if (el) el.classList.toggle("selected", cb.checked);
  hitung();
  syncAll();
}

function toggleAll(cb) {
  document.querySelectorAll(".item-check").forEach((el) => {
    el.checked = cb.checked;
    const id = el.closest(".cart-item").id.replace("item-", "");
    if (data[id]) data[id].on = cb.checked;
    el.closest(".cart-item").classList.toggle("selected", cb.checked);
  });
  hitung();
}

async function ubahQty(id, delta) {
  if (!data[id]) return;
  const newQty = Math.max(1, data[id].qty + delta);

  // Cek stok
  if (newQty > data[id].stock) {
    toast("⚠️ Stok tidak mencukupi");
    return;
  }

  // Update lokal dulu (biar responsif)
  data[id].qty = newQty;
  const qtyEl = document.getElementById("qty-" + id);
  if (qtyEl) qtyEl.textContent = newQty;
  hitung();

  // Kirim ke backend
  const res = await apiCart("PUT", "/" + id, { quantity: newQty });
  if (!res) return;
  const result = await res.json();
  if (!res.ok) {
    toast("❌ " + result.message);
    // Rollback
    data[id].qty = newQty - delta;
    if (qtyEl) qtyEl.textContent = data[id].qty;
    hitung();
  }
}

async function hapus(id) {
  const el = document.getElementById("item-" + id);
  if (el) {
    el.classList.add("removing");
    setTimeout(async () => {
      const res = await apiCart("DELETE", "/" + id);
      if (!res) return;
      const result = await res.json();
      if (!res.ok) {
        toast("❌ " + result.message);
        el.classList.remove("removing");
        return;
      }
      el.remove();
      delete data[id];
      hitung();

      // Cek apakah masih ada item
      if (document.querySelectorAll(".cart-item").length === 0) {
        showEmpty();
      }
    }, 300);
  }
  toast("🗑️ Item dihapus");
}

function keCheckout() {
  const sel = Object.entries(data)
    .filter(([, d]) => d.on)
    .map(([id, d]) => ({ id, ...d }));

  if (sel.length === 0) {
    toast("⚠️ Pilih item dulu!");
    return;
  }
  sessionStorage.setItem("checkoutItems", JSON.stringify(sel));
  window.location.href = "checkout.html";
}

async function updateNote(input) {
  const cartId = input.dataset.cartId;
  const note = input.value.trim();

  const res = await apiCart("PUT", "/note" + cartId, { note });
  if (!res) return;

  const result = await res.json();
  if (!res.ok) {
    toast("❌ " + result.message);
    return;
  }

  toast("📝 Catatan tersimpan");
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Redirect ke login kalau belum login
  if (!localStorage.getItem("accessToken")) {
    window.location.href = "login.html";
    return;
  }
  loadCart();
});