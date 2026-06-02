// ============================================================
// review.js — Sambungkan halaman review.html ke backend
// Alur: ambil order_item_id dari URL → validasi pesanan selesai
//       → isi info produk → submit review ke POST /reviews/
// ============================================================

// Ambil query param dari URL: review.html?order_item_id=123
const params      = new URLSearchParams(window.location.search);
const orderItemId = params.get('order_item_id');

// State lokal
let pilihanLike = '';   // 'suka' | 'kurang'
let mediaFiles  = [];   // File[] untuk upload
let orderItem   = null; // Data order item dari backend

// ============================================================
// 1. INIT — dipanggil saat DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Pastikan user sudah login
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Pastikan ada order_item_id di URL
  if (!orderItemId) {
    tampilkanError(
      'Link review tidak valid.',
      'Silakan kembali ke halaman pesanan dan pilih produk yang ingin diulas.'
    );
    return;
  }

  await muatDataOrderItem();
});

// ============================================================
// 2. MUAT DATA ORDER ITEM (dari endpoint GET /reviews/pending)
//    Backend sudah memvalidasi: hanya order berstatus "selesai"
//    yang belum direview yang muncul di sini.
// ============================================================
async function muatDataOrderItem() {
  try {
    const res    = await authenticatedFetch(`${API_URL}/reviews/pending`);
    const result = await res.json();

    if (!res.ok) throw new Error(result.message);

    // Cari order item yang diminta
    const item = result.data.find(d => String(d.id) === String(orderItemId));

    if (!item) {
      // Order item tidak ditemukan: belum selesai, sudah direview, atau bukan milik user
      tampilkanError(
        'Tidak bisa membuat ulasan.',
        'Kamu hanya bisa mengulas produk dari pesanan yang sudah selesai dan belum pernah diulas. ' +
        'Pastikan status pesanan sudah "Selesai".'
      );
      return;
    }

    orderItem = item;
    isiInfoProduk(item);

  } catch (err) {
    console.error(err);
    tampilkanError('Gagal memuat data pesanan.', err.message);
  }
}

// ============================================================
// 3. ISI INFO PRODUK di bagian atas halaman
// ============================================================
function isiInfoProduk(item) {
  const order = item.orders;

  // Nama produk
  const elNama = document.querySelector('.prod-name');
  if (elNama) elNama.textContent = item.product_name || 'Produk';

  // Kode order
  const elOrderId = document.querySelector('.order-id');
  if (elOrderId) elOrderId.textContent = `#${order?.order_code || order?.id || '-'}`;

  // Tombol "Beli Lagi" arahkan ke halaman produk
  const elBeliLagi = document.querySelector('.btn-beli-lagi');
  if (elBeliLagi && item.product_id) {
    elBeliLagi.href = `product.html?id=${item.product_id}`;
  }
}

// ============================================================
// 4. PILIH LIKE / KURANG — dipanggil dari onclick HTML
// ============================================================
function pilihLike(pilihan) {
  pilihanLike = pilihan;

  const btnSuka   = document.getElementById('btnSuka');
  const btnKurang = document.getElementById('btnKurang');
  const desc      = document.getElementById('likeDesc');

  btnSuka.classList.remove('on');
  btnKurang.classList.remove('on');

  if (pilihan === 'suka') {
    btnSuka.classList.add('on');
    desc.textContent = 'Yeay! Senang kamu suka produknya 😊';
    desc.style.color = 'var(--red)';
  } else {
    btnKurang.classList.add('on');
    desc.textContent = 'Sayang sekali, semoga penjual bisa memperbaikinya ya!';
    desc.style.color = 'var(--gray-600)';
  }
}

// ============================================================
// 5. FRASA CEPAT — tambah teks ke textarea
// ============================================================
function tambahFrasa(frasa) {
  const ta    = document.getElementById('reviewText');
  const spasi = ta.value.length > 0 && !ta.value.endsWith(' ') ? ' ' : '';
  ta.value   += spasi + frasa;
  hitungChar(ta);
  ta.focus();
}

function hitungChar(el) {
  const el2 = document.getElementById('charNum');
  if (el2) el2.textContent = el.value.length;
}

// ============================================================
// 6. HANDLE UPLOAD MEDIA (foto/video)
// ============================================================
function handleMedia(e) {
  const files   = Array.from(e.target.files);
  const preview = document.getElementById('mediaPreview');

  files.forEach(file => {
    if (mediaFiles.length >= 5) { toast('⚠️ Maksimal 5 file ya!'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('⚠️ Ukuran file maks 10MB'); return; }

    mediaFiles.push(file);

    const item = document.createElement('div');
    item.className = 'media-item';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src   = URL.createObjectURL(file);
      item.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const vid = document.createElement('video');
      vid.src   = URL.createObjectURL(file);
      vid.muted = true;
      item.appendChild(vid);
      const badge       = document.createElement('div');
      badge.className   = 'vid-badge';
      badge.textContent = '▶ Video';
      item.appendChild(badge);
    }

    const rm       = document.createElement('div');
    rm.className   = 'rm';
    rm.textContent = '×';
    rm.onclick     = () => {
      const idx = Array.from(preview.children).indexOf(item);
      mediaFiles.splice(idx, 1);
      item.remove();
    };
    item.appendChild(rm);
    preview.appendChild(item);
  });

  // Reset input supaya file yang sama bisa diupload ulang
  e.target.value = '';
}

// ============================================================
// 7. KIRIM ULASAN — submit ke backend POST /reviews/
// ============================================================
async function kirimUlasan() {
  // Validasi: harus sudah ada data order item (membuktikan pesanan selesai)
  if (!orderItem) {
    toast('⚠️ Data pesanan belum siap atau tidak valid.');
    return;
  }

  // Validasi: pilih suka/kurang
  if (!pilihanLike) {
    toast('⚠️ Pilih dulu suka atau kurang suka ya!');
    return;
  }

  // Validasi: teks ulasan wajib diisi
  const teks = document.getElementById('reviewText').value.trim();
  if (!teks) {
    toast('⚠️ Tulis ulasanmu dulu ya, minimal beberapa kata!');
    return;
  }

  // Konversi pilihan ke rating angka (sesuai backend: 1-5)
  // 'suka' → rating 5, 'kurang' → rating 2
  const rating = pilihanLike === 'suka' ? 5 : 2;

  // Siapkan FormData (karena ada kemungkinan upload media)
  const formData = new FormData();
  formData.append('order_item_id', orderItem.id);
  formData.append('product_id',    orderItem.product_id);
  formData.append('rating',        rating);
  formData.append('body',          teks);

  // Lampirkan file media jika ada
  mediaFiles.forEach(file => formData.append('media', file));

  // Nonaktifkan tombol submit selama proses
  const btnSubmit = document.querySelector('.btn-submit');
  if (btnSubmit) {
    btnSubmit.disabled     = true;
    btnSubmit.textContent  = 'Mengirim...';
  }

  try {
    // Gunakan authenticatedFetch dari auth.js (sudah handle token refresh)
    // Catatan: JANGAN set Content-Type header — biarkan browser set boundary FormData otomatis
    const res    = await authenticatedFetch(`${API_URL}/reviews/`, {
      method: 'POST',
      body:   formData,
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.message);

    // Tampilkan modal sukses
    const modal = document.getElementById('modalSukses');
    if (modal) modal.classList.add('show');

  } catch (err) {
    console.error(err);
    toast(`❌ ${err.message}`);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled    = false;
      btnSubmit.innerHTML   = `
        <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Kirimkan Ulasan
      `;
    }
  }
}

// ============================================================
// 8. HELPER — tampilkan error state di halaman
// ============================================================
function tampilkanError(judul, pesan) {
  const main = document.querySelector('.main');
  if (!main) return;

  // Sembunyikan form, tampilkan pesan error
  main.innerHTML = `
    <div class="topbar">
      <a class="back-btn" href="orders.html">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </a>
      <span class="page-title">✍️ Tulis Ulasan</span>
    </div>
    <div style="
      background:#fff;
      border:1px solid #ddddd4;
      border-radius:20px;
      padding:40px 24px;
      text-align:center;
      margin-top:24px;
    ">
      <div style="font-size:48px;margin-bottom:16px;">🔒</div>
      <div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:18px;color:#333330;margin-bottom:10px;">
        ${judul}
      </div>
      <div style="font-size:14px;color:#666660;line-height:1.6;margin-bottom:24px;">
        ${pesan}
      </div>
      <a href="orders.html" style="
        display:inline-block;
        padding:12px 28px;
        background:#7aab22;
        color:#fff;
        border-radius:99px;
        font-family:'Nunito',sans-serif;
        font-weight:700;
        font-size:14px;
        text-decoration:none;
      ">Lihat Pesananku</a>
    </div>
  `;
}

// ============================================================
// 9. TOAST NOTIFIKASI
// ============================================================
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) { alert(msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
