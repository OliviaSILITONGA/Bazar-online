// =============================================
// ENCAPSULATION - JavaScript
// Bazar Online: Class Product & User
// =============================================

class Product {
  // Private fields (disembunyikan dari luar)
  #id;
  #name;
  #price;
  #stock;
  #category;

  constructor(id, name, price, stock, category) {
    // Validasi sebelum disimpan
    this.#id = id;
    this.setName(name);
    this.setPrice(price);
    this.setStock(stock);
    this.setCategory(category);
  }

  // --- Setter dengan validasi ---
  setName(name) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Nama produk tidak boleh kosong.");
    }
    this.#name = name.trim();
  }

  setPrice(price) {
    if (typeof price !== "number" || price < 0) {
      throw new Error("Harga produk harus angka positif.");
    }
    this.#price = price;
  }

  setStock(stock) {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("Stok harus bilangan bulat non-negatif.");
    }
    this.#stock = stock;
  }

  setCategory(category) {
    const validCategories = ["elektronik", "pakaian", "makanan", "lainnya"];
    if (!validCategories.includes(category.toLowerCase())) {
      throw new Error(`Kategori tidak valid. Pilih: ${validCategories.join(", ")}`);
    }
    this.#category = category.toLowerCase();
  }

  // --- Getter ---
  getId()       { return this.#id; }
  getName()     { return this.#name; }
  getPrice()    { return this.#price; }
  getStock()    { return this.#stock; }
  getCategory() { return this.#category; }

  // Method tambahan
  isAvailable() {
    return this.#stock > 0;
  }

  getInfo() {
    return {
      id: this.#id,
      nama: this.#name,
      harga: `Rp${this.#price.toLocaleString("id-ID")}`,
      stok: this.#stock,
      kategori: this.#category,
      tersedia: this.isAvailable(),
    };
  }
}

// =============================================

class User {
  // Private fields
  #id;
  #username;
  #email;
  #password;
  #role;

  constructor(id, username, email, password, role = "pembeli") {
    this.#id = id;
    this.setUsername(username);
    this.setEmail(email);
    this.setPassword(password);
    this.setRole(role);
  }

  // --- Setter dengan validasi ---
  setUsername(username) {
    if (typeof username !== "string" || username.trim().length < 3) {
      throw new Error("Username minimal 3 karakter.");
    }
    this.#username = username.trim();
  }

  setEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Format email tidak valid.");
    }
    this.#email = email.toLowerCase();
  }

  setPassword(password) {
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }
    // Simulasi hashing (di production pakai bcrypt)
    this.#password = `hashed_${password}`;
  }

  setRole(role) {
    const validRoles = ["pembeli", "penjual", "admin"];
    if (!validRoles.includes(role)) {
      throw new Error(`Role tidak valid. Pilih: ${validRoles.join(", ")}`);
    }
    this.#role = role;
  }

  // --- Getter ---
  getId()       { return this.#id; }
  getUsername() { return this.#username; }
  getEmail()    { return this.#email; }
  getRole()     { return this.#role; }
  // Password TIDAK punya getter (sengaja disembunyikan)

  checkPassword(inputPassword) {
    return this.#password === `hashed_${inputPassword}`;
  }

  getProfile() {
    return {
      id: this.#id,
      username: this.#username,
      email: this.#email,
      role: this.#role,
      // password tidak ditampilkan!
    };
  }
}

// =============================================
// CONTOH PENGGUNAAN
// =============================================

// --- Product ---
try {
  const produk1 = new Product(1, "Kemeja Batik", 150000, 20, "pakaian");
  console.log(produk1.getInfo());

  produk1.setPrice(175000); // update harga
  console.log("Harga baru:", produk1.getPrice());

  // Contoh error validasi
  const produkError = new Product(2, "", -5000, 10, "pakaian"); // akan throw error
} catch (err) {
  console.error("Error Product:", err.message);
}

// --- User ---
try {
  const user1 = new User(1, "budi123", "budi@email.com", "rahasia123", "pembeli");
  console.log(user1.getProfile());
  console.log("Password benar?", user1.checkPassword("rahasia123")); // true
  console.log("Password salah?", user1.checkPassword("salah"));      // false

  // Contoh error validasi
  const userError = new User(2, "ab", "bukan-email", "123"); // akan throw error
} catch (err) {
  console.error("Error User:", err.message);
}