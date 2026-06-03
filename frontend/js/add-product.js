const DRAFT_KEY = "add_product_draft";

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
  setPreviewImage(null);
  toast("✅ Form direset, siap tambah produk baru!");
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  loadDraft();
  updatePreview();
});
