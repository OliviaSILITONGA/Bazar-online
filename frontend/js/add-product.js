let katerpilih = "";
let availability = "setiap-hari";

const selectedImages = [];
const DRAFT_KEY = "add_product_draft";

/* -- Tampilkan user yang sedang login -- */
async function loadCurrentUser() {
  try {
    const response = await authenticatedFetch(`${API_URL}/users/me`);
    if (!response.ok) return;

    const result = await response.json();
    const user = result.data;

    const previewName = document.querySelector(".preview-pname");
    previewName.innerHTML = `<span class="preview-cat-dot"></span>${user.name}`;
  } catch (err) {
    console.error(err);
  }
}

function pilihKat(el, kat) {
  document.querySelectorAll(".cat-chip").forEach((c) => {
    if (
      ["makanan", "minuman", "jajanan", "kue", "lainnya"].includes(
        c.getAttribute("onclick")?.match(/'(\w+)'/)?.[1],
      )
    )
      c.classList.remove("on");
  });
  el.classList.add("on");
  katerpilih = kat;
}

function pilihAvail(el, val) {
  document
    .querySelectorAll(".avail-opt")
    .forEach((a) => a.classList.remove("on"));
  el.classList.add("on");
  el.querySelector("input").checked = true;
  availability = val;
}

function uploadFoto(e, idx) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("⚠️ Foto maks 5MB ya!");
    return;
  }
  selectedImages[idx] = file;
  const url = URL.createObjectURL(file);
  const slot = document.getElementById(`slot-${idx}`);
  slot.classList.add("has-img");
  // hapus konten lama kecuali input
  Array.from(slot.children).forEach((c) => {
    if (c.tagName !== "INPUT") c.remove();
  });
  const img = document.createElement("img");
  img.src = url;
  img.style.cssText =
    "width:100%;height:100%;object-fit:cover;position:absolute;inset:0;";
  slot.appendChild(img);
  if (idx === 0) {
    const lbl = document.createElement("span");
    lbl.className = "photo-main-label";
    lbl.textContent = "Utama";
    slot.appendChild(lbl);
    // update preview
    const pr = document.getElementById("prevImgReal");
    pr.src = url;
    pr.style.display = "block";
    document.getElementById("prevImg").style.fontSize = "0";
  }
  const rm = document.createElement("div");
  rm.className = "remove";
  rm.textContent = "×";
  rm.onclick = (ev) => {
    ev.stopPropagation();
    hapusFoto(idx);
  };
  slot.appendChild(rm);
}

function hapusFoto(idx) {
  selectedImages[idx] = null;
  const slot = document.getElementById(`slot-${idx}`);
  slot.classList.remove("has-img");
  Array.from(slot.children).forEach((c) => {
    if (c.tagName !== "INPUT") c.remove();
  });
  const icons = [
    '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--gray-400)" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    '<svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--gray-400)" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  ];
  slot.insertAdjacentHTML("beforeend", idx === 0 ? icons[0] : icons[1]);
  const lbl = document.createElement("span");
  lbl.className = "slot-num";
  lbl.textContent = idx === 0 ? "Foto Utama" : "Foto " + (idx + 1);
  slot.appendChild(lbl);
  if (idx === 0) {
    document.getElementById("prevImgReal").style.display = "none";
    document.getElementById("prevImg").style.fontSize = "56px";
  }
}

function updatePreview() {
  const nama = document.getElementById("prodNama").value;
  const harga = document.getElementById("prodHarga").value;
  document.getElementById("prevNama").textContent = nama || "Nama produk...";
  document.getElementById("prevHarga").textContent = harga
    ? "Rp " + Number(harga).toLocaleString("id")
    : "Rp —";
  document.getElementById("namaCount").textContent = nama.length;
}

function hitungDesc(el) {
  if (el.value.length > 300) el.value = el.value.slice(0, 300);
  document.getElementById("descCount").textContent = el.value.length;
}

function showErr(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}

async function submitProduk() {
  const nama = document.getElementById("prodNama").value.trim();
  const harga = document.getElementById("prodHarga").value;
  const lokasi = document.getElementById("prodLokasi").value.trim();
  let ok = true;
  if (!nama) {
    showErr("errNama", true);
    ok = false;
  } else showErr("errNama", false);
  if (!katerpilih) {
    showErr("errKat", true);
    ok = false;
  } else showErr("errKat", false);
  if (!harga) {
    showErr("errHarga", true);
    ok = false;
  } else showErr("errHarga", false);
  if (!lokasi) {
    showErr("errLokasi", true);
    ok = false;
  } else showErr("errLokasi", false);
  if (!ok) {
    toast("⚠️ Lengkapi dulu field yang wajib ya!");
    return;
  }

  try {
    const paymentMethods = Array.from(
      document.querySelectorAll(".payment-chip.on"),
    ).map((chip) => chip.dataset.method);

    const payload = {
      name: nama,
      description: document.getElementById("prodDesc").value.trim(),
      price: Number(harga),
      stock: document.getElementById("prodStok").value
        ? Number(document.getElementById("prodStok").value)
        : null,
      min_order: Number(document.getElementById("prodMinOrder").value) || 1,
      category: katerpilih,
      tags: document.getElementById("prodTags").value.trim(),
      location: lokasi,
      availability,
      schedule: document.getElementById("prodJam").value.trim(),
      payment_methods: paymentMethods,
    };

    const response = await authenticatedFetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    const productId = result.data.id;
    await uploadProductImages(productId);
    localStorage.removeItem(DRAFT_KEY);
    document.getElementById("modalSukses").classList.add("show");
  } catch (error) {
    console.error(error);
    toast(error.message);
  }
}

async function uploadProductImages(productId) {
  const images = selectedImages.filter(Boolean);
  if (!images.length) return;

  const formData = new FormData();
  images.forEach((file) => {
    formData.append("images", file);
  });

  const response = await authenticatedFetch(
    `${API_URL}/products/${productId}/images`,
    {
      method: "POST",
      body: formData,
    },
  );
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Gagal upload gambar");
  return result.data;
}

function simpanDraft() {
  const paymentMethods = Array.from(
    document.querySelectorAll(".payment-chip.on"),
  ).map((chip) => chip.dataset.method);

  const draft = {
    name: document.getElementById("prodNama").value,
    description: document.getElementById("prodDesc").value,
    price: document.getElementById("prodHarga").value,
    stock: document.getElementById("prodStok").value,
    minOrder: document.getElementById("prodMinOrder").value,
    category: katerpilih,
    tags: document.getElementById("prodTags").value,
    location: document.getElementById("prodLokasi").value,
    availability,
    schedule: document.getElementById("prodJam").value,
    paymentMethods,
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

  toast("📋 Produk disimpan sebagai draft!");
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;

  try {
    const draft = JSON.parse(raw);

    document.getElementById("prodNama").value = draft.name || "";
    document.getElementById("prodDesc").value = draft.description || "";
    document.getElementById("prodHarga").value = draft.price || "";
    document.getElementById("prodStok").value = draft.stock || "";
    document.getElementById("prodMinOrder").value = draft.minOrder || "1";
    document.getElementById("prodTags").value = draft.tags || "";
    document.getElementById("prodLokasi").value = draft.location || "";
    document.getElementById("prodJam").value = draft.schedule || "";

    if (draft.category) {
      const chip = [...document.querySelectorAll(".cat-chip")].find((el) =>
        el.getAttribute("onclick")?.includes(`'${draft.category}'`),
      );
      if (chip) pilihKat(chip, draft.category);
    }

    if (draft.availability) {
      const avail = [...document.querySelectorAll(".avail-opt")].find((el) =>
        el.getAttribute("onclick")?.includes(`'${draft.availability}'`),
      );

      if (avail) pilihAvail(avail, draft.availability);
    }

    if (draft.paymentMethods?.length) {
      document.querySelectorAll(".payment-chip").forEach((chip) => {
        if (draft.paymentMethods.includes(chip.dataset.method))
          chip.classList.add("on");
      });
    }

    updatePreview();
    hitungDesc(document.getElementById("prodDesc"));

    toast("📋 Draft ditemukan dan dimuat!");
  } catch (error) {
    console.error(error);
    localStorage.removeItem(DRAFT_KEY);
  }
}

function tambahLagi() {
  document.getElementById("modalSukses").classList.remove("show");
  document.getElementById("prodNama").value = "";
  document.getElementById("prodHarga").value = "";
  document.getElementById("prodDesc").value = "";
  document.getElementById("prodLokasi").value = "";
  updatePreview();
  document.getElementById("prevImgReal").style.display = "none";
  document.getElementById("prevImg").style.fontSize = "56px";
  toast("✅ Form direset, siap tambah produk baru!");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  loadDraft();
  updatePreview();
});
