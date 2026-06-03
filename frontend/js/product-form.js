// ======================================================
// SHARED PRODUCT FORM
// ======================================================

let katerpilih = "";
let availability = "setiap-hari";

const selectedImages = [];

// ======================================================
// USER
// ======================================================

async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);

    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    const previewName = document.querySelector(".preview-pname");

    if (previewName) {
      previewName.innerHTML = `<span class="preview-cat-dot"></span>${user.name}`;
    }
  } catch (err) {
    console.error(err);
  }
}

// ======================================================
// CATEGORY
// ======================================================

function pilihKat(el, kat) {
  document.querySelectorAll(".cat-chip").forEach((c) => {
    const value = c.dataset.category;

    if (value) c.classList.remove("on");
  });

  el.classList.add("on");
  katerpilih = kat;
}

// ======================================================
// AVAILABILITY
// ======================================================

function pilihAvail(el, val) {
  document
    .querySelectorAll(".avail-opt")
    .forEach((a) => a.classList.remove("on"));

  el.classList.add("on");

  const radio = el.querySelector("input");

  if (radio) radio.checked = true;

  availability = val;
}

// ======================================================
// IMAGE
// ======================================================

function uploadFoto(e, idx) {
  const file = e.target.files[0];

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast("⚠️ Foto maksimal 5MB");
    return;
  }

  selectedImages[idx] = file;

  const url = URL.createObjectURL(file);

  renderImageSlot(idx, url);
}

function renderImageSlot(idx, imageUrl) {
  const slot = document.getElementById(`slot-${idx}`);

  slot.classList.add("has-img");

  Array.from(slot.children).forEach((c) => {
    if (c.tagName !== "INPUT") c.remove();
  });

  const img = document.createElement("img");

  img.src = imageUrl;

  slot.appendChild(img);

  if (idx === 0) {
    const lbl = document.createElement("span");

    lbl.className = "photo-main-label";
    lbl.textContent = "Utama";

    slot.appendChild(lbl);

    setPreviewImage(imageUrl);
  }

  const removeBtn = document.createElement("div");

  removeBtn.className = "remove";
  removeBtn.textContent = "×";

  removeBtn.onclick = (ev) => {
    ev.stopPropagation();
    hapusFoto(idx);
  };

  slot.appendChild(removeBtn);
}

function hapusFoto(idx) {
  selectedImages[idx] = null;

  const slot = document.getElementById(`slot-${idx}`);

  slot.classList.remove("has-img");

  Array.from(slot.children).forEach((c) => {
    if (c.tagName !== "INPUT") c.remove();
  });

  const isMain = idx === 0;

  slot.insertAdjacentHTML(
    "beforeend",
    isMain
      ? `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
      : `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  );

  const label = document.createElement("span");

  label.className = "slot-num";
  label.textContent = isMain ? "Foto Utama" : `Foto ${idx + 1}`;

  slot.appendChild(label);

  if (isMain) {
    setPreviewImage(null);
  }
}

// ======================================================
// PREVIEW
// ======================================================

function formatRupiah(value) {
  if (!value) return "Rp —";

  return "Rp " + Number(value).toLocaleString("id-ID");
}

function updatePreview() {
  const nama =
    document.getElementById("prodNama")?.value.trim() || "Nama produk...";

  const harga = document.getElementById("prodHarga")?.value;

  document.getElementById("prevNama").textContent = nama;
  document.getElementById("prevHarga").textContent = formatRupiah(harga);

  const namaCount = document.getElementById("namaCount");

  if (namaCount) {
    namaCount.textContent = document.getElementById("prodNama").value.length;
  }
}

function hitungDesc(el) {
  if (!el) return;

  if (el.value.length > 300) {
    el.value = el.value.slice(0, 300);
  }

  document.getElementById("descCount").textContent = el.value.length;
}

function setPreviewImage(url) {
  const img = document.getElementById("prevImgReal");
  const placeholder = document.getElementById("prevImg");

  if (!url) {
    img.src = "";
    img.style.display = "none";
    placeholder.style.fontSize = "56px";
    return;
  }

  img.src = url;
  img.style.display = "block";
  placeholder.style.fontSize = "0";
}

// ======================================================
// FORM HELPERS
// ======================================================

function showErr(id, show) {
  const el = document.getElementById(id);

  if (!el) return;

  el.classList.toggle("show", show);
}

// ======================================================
// TOAST
// ======================================================

function toast(message) {
  const el = document.getElementById("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}
