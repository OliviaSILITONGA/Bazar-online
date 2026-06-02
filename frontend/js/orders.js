// ============================================================
// orders.js — Render daftar pesanan dari backend
// Tombol "Tulis Ulasan" otomatis diarahkan ke
// review.html?order_item_id=<ID> yang benar
// ============================================================

// ============================================================
// LOAD ORDERS SAAT HALAMAN DIBUKA
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  await loadOrders();
});

// ============================================================
// AMBIL SEMUA PESANAN DARI BACKEND
// ============================================================
async function loadOrders() {
  try {
    const res    = await authenticatedFetch(`${API_URL}/orders?role=buyer`);
    const result = await res.json();

    if (!res.ok) throw new Error(result.message);

    const orders = result.data?.orders || result.data || [];

    // Ambil juga daftar order_item yang sudah direview
    // (supaya tombol ulasan bisa di-disable kalau sudah)
    const pendingRes    = await authenticatedFetch(`${API_URL}/reviews/pending`);
    const pendingResult = await pendingRes.json();
    const pendingIds    = new Set(
      (pendingResult.data || []).map(item => String(item.id))
    );

    renderSemuaOrder(orders, pendingIds);
    updateStatCards(orders);

  } catch (err) {
    console.error(err);
    tampilkanKosong('pane-semua', 'Gagal memuat pesanan: ' + err.message);
  }
}

// ============================================================
// RENDER SEMUA ORDER KE TAB "SEMUA"
// Dan distribusikan ke tab per-status
// ============================================================
function renderSemuaOrder(orders, pendingIds) {
  const panes = {
    semua:  document.getElementById('pane-semua'),
    belum:  document.getElementById('pane-belum'),
    proses: document.getElementById('pane-proses'),
    kirim:  document.getElementById('pane-kirim'),
    selesai:document.getElementById('pane-selesai'),
    batal:  document.getElementById('pane-batal'),
  };

  // Kosongkan semua pane
  Object.values(panes).forEach(p => { if (p) p.innerHTML = ''; });

  if (!orders.length) {
    tampilkanKosong('pane-semua', 'Kamu belum punya pesanan.');
    return;
  }

  orders.forEach(order => {
    const card       = buatKartuOrder(order, pendingIds);
    const cardClone  = card.cloneNode(true);

    panes.semua?.appendChild(card);

    // Distribusi ke tab status
    const statusPane = getStatusPane(order.status);
    if (statusPane && panes[statusPane]) {
      panes[statusPane].appendChild(cardClone);
    }
  });
}

// ============================================================
// MAPPING STATUS -> PANE
// ============================================================
function getStatusPane(status) {
  const map = {
    'menunggu_pembayaran':    'belum',
    'menunggu_verifikasi':    'belum',
    'diproses':               'proses',
    'dikirim':                'kirim',
    'selesai':                'selesai',
    'dibatalkan':             'batal',
  };
  return map[status] || null;
}

// ============================================================
// BUAT KARTU ORDER (HTML Element)
// ============================================================
function buatKartuOrder(order, pendingIds) {
  const card = document.createElement('div');
  card.className = 'order-card';
  card.id        = `order-${order.id}`;

  const tanggal  = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const jam      = new Date(order.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  });
  const total    = Number(order.total_price || 0).toLocaleString('id-ID');

  card.innerHTML = `
    <div class="order-top">
      <div>
        <div class="order-id">#${order.order_code || order.id}</div>
        <div class="order-date">${tanggal} · ${jam}</div>
      </div>
      ${renderBadge(order.status)}
    </div>

    ${renderProgress(order.status)}

    <div class="order-items">
      ${renderOrderItems(order.order_items || [], order, pendingIds)}
    </div>

    <div class="order-footer">
      <div class="order-total-wrap">
        <div class="order-total-lbl">Total pembayaran</div>
        <div class="order-total-val">Rp ${total}</div>
      </div>
      <div class="order-actions">
        ${renderTombolAksi(order, pendingIds)}
      </div>
    </div>
  `;

  return card;
}

// ============================================================
// RENDER ITEM-ITEM PRODUK DI DALAM ORDER
// ============================================================
function renderOrderItems(items, order, pendingIds) {
  if (!items.length) return '<div class="oi"><div class="oi-info">Tidak ada item</div></div>';

  return items.map(item => {
    const harga     = Number(item.subtotal || item.price || 0).toLocaleString('id-ID');
    const sudahDireview = !pendingIds.has(String(item.id));
    const linkUlasan = order.status === 'selesai' && !sudahDireview
      ? `<a class="btn-action btn-ulasan" href="review.html?order_item_id=${item.id}" style="font-size:11px;padding:4px 10px;margin-top:6px;display:inline-flex;">
           ✍️ Tulis Ulasan
         </a>`
      : order.status === 'selesai' && sudahDireview
        ? `<span style="font-size:11px;color:var(--gray-400);margin-top:6px;display:block;">✅ Sudah diulas</span>`
        : '';

    return `
      <div class="oi">
        <div class="oi-img">📦</div>
        <div class="oi-info" style="flex:1;">
          <div class="oi-name">${item.product_name || 'Produk'}</div>
          <div class="oi-meta">× ${item.quantity || 1}</div>
          ${linkUlasan}
        </div>
        <span class="oi-price">Rp ${harga}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// RENDER BADGE STATUS
// ============================================================
function renderBadge(status) {
  const map = {
    'menunggu_pembayaran': '<span class="badge badge-belum">⏳ Belum Dibayar</span>',
    'menunggu_verifikasi': '<span class="badge badge-sudah">✅ Menunggu Verifikasi</span>',
    'diproses':            '<span class="badge badge-sudah">⚙️ Diproses</span>',
    'dikirim':             '<span class="badge badge-sudah">🚚 Dikirim</span>',
    'selesai':             '<span class="badge badge-selesai">🏁 Selesai</span>',
    'dibatalkan':          '<span class="badge badge-batal">❌ Dibatalkan</span>',
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

// ============================================================
// RENDER PROGRESS STEPS
// ============================================================
function renderProgress(status) {
  const steps = ['Pesan', 'Bayar', 'Proses', 'Terima'];
  const doneCount = {
    'menunggu_pembayaran': 1,
    'menunggu_verifikasi': 2,
    'diproses':            2,
    'dikirim':             3,
    'selesai':             4,
    'dibatalkan':          0,
  }[status] ?? 1;

  let dots = '';
  steps.forEach((label, i) => {
    const isDone   = i < doneCount;
    const isActive = i === doneCount - 1;
    const dotClass = isDone ? 'done' : isActive ? 'active' : 'idle';
    dots += `<div class="ps-dot ${dotClass}">${isDone ? '✓' : i + 1}</div>`;
    if (i < steps.length - 1) {
      dots += `<div class="ps-line ${isDone ? 'done' : ''}"></div>`;
    }
  });

  const labels = steps.map((label, i) => {
    const isActive = i === doneCount - 1;
    return `<span class="ps-label ${isActive ? 'active' : ''}">${label}</span>`;
  }).join('');

  return `
    <div class="progress-wrap">
      <div class="progress-steps">${dots}</div>
      <div class="ps-labels">${labels}</div>
    </div>
  `;
}

// ============================================================
// RENDER TOMBOL AKSI (per status order)
// ============================================================
function renderTombolAksi(order, pendingIds) {
  const id = order.id;

  switch (order.status) {
    case 'menunggu_pembayaran':
      return `
        <button class="btn-action btn-red" onclick="batalPesanan(${id})">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          Batalkan
        </button>
        <button class="btn-action btn-primary" onclick="bukaModalBukti(${id})">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload Bukti Bayar
        </button>`;

    case 'menunggu_verifikasi':
      return `<a class="btn-action btn-outline" href="messages.html">Chat Penjual</a>`;

    case 'diproses':
      return `<a class="btn-action btn-outline" href="messages.html">Chat Penjual</a>`;

    case 'dikirim':
      return `
        <a class="btn-action btn-outline" href="messages.html">Chat Penjual</a>
        <button class="btn-action btn-primary" onclick="konfirmasiTerima(${id})">
          Sudah Diterima
        </button>`;

    case 'selesai':
      return `
        <button class="btn-action btn-outline" onclick="beliLagi(${id})">Beli Lagi</button>`;

    case 'dibatalkan':
      return `<span style="font-size:12px;color:var(--gray-400);">Pesanan telah dibatalkan</span>`;

    default:
      return '';
  }
}

// ============================================================
// UPDATE STAT CARDS (angka di atas tab)
// ============================================================
function updateStatCards(orders) {
  const count = {
    semua:   orders.length,
    belum:   orders.filter(o => ['menunggu_pembayaran','menunggu_verifikasi'].includes(o.status)).length,
    proses:  orders.filter(o => o.status === 'diproses').length,
    kirim:   orders.filter(o => o.status === 'dikirim').length,
    selesai: orders.filter(o => o.status === 'selesai').length,
  };

  Object.entries(count).forEach(([key, val]) => {
    const el = document.getElementById(`sc-count-${key}`);
    if (el) el.textContent = val;
  });
}

// ============================================================
// TAMPILKAN PESAN KOSONG
// ============================================================
function tampilkanKosong(paneId, pesan) {
  const pane = document.getElementById(paneId);
  if (!pane) return;
  pane.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:var(--gray-400);">
      <div style="font-size:48px;margin-bottom:12px;">📭</div>
      <div style="font-size:14px;">${pesan}</div>
    </div>`;
}

// ============================================================
// AKSI: BATALKAN PESANAN
// ============================================================
async function batalPesanan(orderId) {
  if (!confirm('Yakin mau batalkan pesanan ini?')) return;
  try {
    const res = await authenticatedFetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    toast('🗑️ Pesanan berhasil dibatalkan');
    await loadOrders();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================
// AKSI: KONFIRMASI SUDAH TERIMA
// ============================================================
async function konfirmasiTerima(orderId) {
  if (!confirm('Pastikan kamu sudah benar-benar menerima barangnya ya!')) return;
  try {
    const res = await authenticatedFetch(`${API_URL}/orders/${orderId}/received`, {
      method: 'PUT',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    toast('🎉 Pesanan dikonfirmasi! Yuk kasih ulasan untuk penjual.');
    await loadOrders();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================
// AKSI: BELI LAGI
// ============================================================
function beliLagi(orderId) {
  toast('🛒 Mengarahkan ke keranjang...');
  setTimeout(() => window.location.href = 'cart.html', 1200);
}

// ============================================================
// AKSI: UPLOAD BUKTI BAYAR (pakai modal yang sudah ada)
// ============================================================
let targetOrderId = null;

function bukaModalBukti(id) {
  targetOrderId = id;
  const modal = document.getElementById('modalBukti');
  if (modal) {
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    modal.classList.add('show');
  }
}

async function kirimBukti() {
  const fileInput = document.querySelector('#uploadArea input[type=file]');
  const file      = fileInput?.files?.[0];

  if (!file) { toast('⚠️ Pilih file bukti bayar dulu ya!'); return; }
  if (!targetOrderId)  { toast('⚠️ Order tidak ditemukan'); return; }

  try {
    const formData = new FormData();
    formData.append('payment_proof', file);

    const res = await authenticatedFetch(`${API_URL}/orders/${targetOrderId}/pay`, {
      method: 'PUT',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    document.getElementById('modalBukti').classList.remove('show');
    toast('✅ Bukti bayar terkirim! Penjual akan verifikasi segera.');
    await loadOrders();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================
// TOAST
// ============================================================
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
