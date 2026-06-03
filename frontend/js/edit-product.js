// ======================================================
// EDIT PRODUCT
// ======================================================

const productSelector = document.getElementById("productSelector");

const urlParams = new URLSearchParams(window.location.search);

const productId = urlParams.get("id");

let currentProduct = null;

let newImages = [];
let existingImages = [];
let deletedImageIds = [];

// ======================================================
// INIT
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadMyProducts();

  if (productId) {
    productSelector.value = productId;
    productSelector.disabled = true;

    await loadProduct(productId);
  }
});

// ======================================================
// LOAD MY PRODUCTS
// ======================================================

async function loadMyProducts() {
  try {
    const response = await authenticatedFetch(`${API_URL}/products/me`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    const products = result.data;

    productSelector.innerHTML = '<option value="">Pilih Produk</option>';

    products.forEach((product) => {
      productSelector.insertAdjacentHTML(
        "beforeend",
        `<option value="${product.id}">
          ${product.name}
        </option>`,
      );
    });
  } catch (err) {
    console.error(err);

    toast(err.message || "Gagal memuat daftar produk");
  }
}

// ======================================================
// PRODUCT SELECT
// ======================================================

productSelector?.addEventListener("change", async (e) => {
  const id = e.target.value;

  if (!id) return;

  await loadProduct(id);
});

// ======================================================
// LOAD PRODUCT
// ======================================================

async function loadProduct(id) {
  try {
    const response = await authenticatedFetch(`${API_URL}/products/${id}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    const product = result.data;

    currentProduct = product;

    existingImages = product.product_images || [];

    newImages = [];

    populateForm(product);

    renderExistingImages(existingImages);

    setPreviewImage(existingImages?.[0]?.image_url);
  } catch (err) {
    console.error(err);

    toast(err.message || "Produk tidak ditemukan");
  }
}

// ======================================================
// POPULATE FORM
// ======================================================

function populateForm(product) {
  document.getElementById("prodNama").value = product.name || "";

  document.getElementById("prodDesc").value = product.description || "";

  document.getElementById("prodHarga").value = product.price || "";

  document.getElementById("prodStok").value = product.stock || "";

  document.getElementById("prodMinOrder").value = product.min_order || "";

  document.getElementById("prodLokasi").value = product.location || "";

  document.getElementById("prodJam").value = product.schedule || "";

  document.getElementById("prodTags").value = product.tags || "";

  // kategori
  document
    .querySelectorAll(".cat-chip")
    .forEach((el) => el.classList.remove("on"));

  const categoryChip = [...document.querySelectorAll(".cat-chip")].find(
    (chip) => chip.getAttribute("onclick")?.includes(product.category),
  );

  pilihKat(categoryChip, product.category);

  // availability
  document
    .querySelectorAll(".avail-opt")
    .forEach((el) => el.classList.remove("on"));

  const avail = [...document.querySelectorAll(".avail-opt")].find((el) =>
    el.getAttribute("onclick")?.includes(product.availability),
  );

  pilihAvail(avail, product.availability);

  // payment
  const methods = Array.isArray(product.product_payment_methods)
    ? product.product_payment_methods.map((m) => m.method)
    : [];
  document.querySelectorAll(".payment-chip").forEach((chip) => {
    const method = chip.dataset.method;

    chip.classList.toggle("on", methods.includes(method));
  });

  updatePreview();

  hitungDesc(document.getElementById("prodDesc"));
}

function renderExistingImages(images = []) {
  const slots = document.querySelectorAll("[id^='slot-']");

  slots.forEach((slot) => {
    slot.classList.remove("has-img");

    delete slot.dataset.imageId;
    delete slot.dataset.filePath;

    Array.from(slot.children).forEach((c) => {
      if (c.tagName !== "INPUT") c.remove();
    });
  });

  images.forEach((img, idx) => {
    const slot = slots[idx];

    if (!slot) return;

    slot.classList.add("has-img");

    slot.dataset.imageId = img.id;

    const imageEl = document.createElement("img");

    imageEl.src = img.image_url;

    imageEl.style.cssText =
      "width:100%;height:100%;object-fit:cover;position:absolute;inset:0;";

    slot.appendChild(imageEl);

    if (idx === 0) {
      const lbl = document.createElement("span");

      lbl.className = "photo-main-label";
      lbl.textContent = "Utama";

      slot.appendChild(lbl);
    }

    const rm = document.createElement("div");

    rm.className = "remove";
    rm.textContent = "×";

    rm.onclick = (e) => {
      e.stopPropagation();

      deletedImageIds.push(img.id);

      slot.style.display = "none";
    };

    slot.appendChild(rm);
  });
}

function onEditImageChange(e, idx) {
  const file = e.target.files[0];

  if (!file) return;

  const slot = document.getElementById(`slot-${idx}`);

  const oldImageId = slot.dataset.imageId;

  if (oldImageId) {
    deletedImageIds.push(Number(oldImageId));
  }

  newImages[idx] = file;

  // render preview lokal
}

async function deleteMarkedImages(productId) {
  if (!deletedImageIds.length) return;

  await Promise.all(
    deletedImageIds.map((imageId) =>
      authenticatedFetch(`${API_URL}/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      }),
    ),
  );

  deletedImageIds = [];
}

async function uploadNewImages(productId) {
  const files = newImages.filter(Boolean);

  console.log("Files to upload:", files);

  if (!files.length) return;

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  for (const pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const res = await authenticatedFetch(
    `${API_URL}/products/${productId}/images`,
    {
      method: "POST",
      body: formData,
    },
  );

  const result = await res.json();
  if (!res.ok) throw new Error(result.message);

  return result.data;
}

function removeNewImage(idx) {
  newImages[idx] = null;

  const slot = document.getElementById(`slot-${idx}`);

  slot.classList.remove("has-img");

  Array.from(slot.children).forEach((c) => {
    if (c.tagName !== "INPUT") c.remove();
  });

  if (idx === 0) {
    document.getElementById("prevImgReal").style.display = "none";

    document.getElementById("prevImg").style.fontSize = "56px";
  }
}

async function deleteExistingImage(imgId) {
  try {
    const res = await authenticatedFetch(
      `${API_URL}/products/${currentProduct.id}/images/${imgId}`,
      {
        method: "DELETE",
      },
    );

    const result = await res.json();

    if (!res.ok) throw new Error(result.message);

    toast("Gambar dihapus");

    // reload product biar sinkron
    await loadProduct(currentProduct.id);
  } catch (err) {
    console.error(err);
    toast(err.message || "Gagal hapus gambar");
  }
}

// ======================================================
// SAVE
// ======================================================

async function saveProductChanges() {
  try {
    const payload = collectFormData();

    const response = await authenticatedFetch(
      `${API_URL}/products/${currentProduct.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    await deleteMarkedImages(currentProduct.id);

    await uploadNewImages(currentProduct.id);

    toast("Produk berhasil diperbarui");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  } catch (err) {
    console.error(err);

    toast(err.message || "Gagal update produk");
  }
}

// ======================================================
// DELETE
// ======================================================

async function deleteProduct() {
  if (!currentProduct) return;

  const confirmed = confirm("Yakin ingin menghapus produk ini?");

  if (!confirmed) return;

  try {
    if (currentProduct.product_images?.length) {
      await Promise.all(
        currentProduct.product_images.map((img) =>
          authenticatedFetch(
            `${API_URL}/products/${currentProduct.id}/images/${img.id}`,
            {
              method: "DELETE",
            },
          ),
        ),
      );
    }

    const response = await authenticatedFetch(
      `${API_URL}/products/${currentProduct.id}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    toast("Produk berhasil dihapus");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error(error);

    toast(error.message || "Gagal menghapus produk");
  }
}

// ======================================================
// COLLECT FORM DATA
// ======================================================

function collectFormData() {
  const paymentMethods = [...document.querySelectorAll(".payment-chip.on")].map(
    (el) => el.dataset.method,
  );

  return {
    name: document.getElementById("prodNama").value,

    description: document.getElementById("prodDesc").value,

    price: Number(document.getElementById("prodHarga").value),

    stock: Number(document.getElementById("prodStok").value),

    min_order: Number(document.getElementById("prodMinOrder").value),

    location: document.getElementById("prodLokasi").value,

    schedule: document.getElementById("prodJam").value,

    tags: document.getElementById("prodTags").value,

    payment_methods: paymentMethods,
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  updatePreview();
});
