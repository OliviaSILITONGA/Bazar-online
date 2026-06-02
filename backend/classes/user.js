// Base class
class User {
  constructor({ id, name, email, is_seller }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = is_seller ? "seller" : "buyer";
  }

  getInfo() {
    return `${this.name} (${this.role})`;
  }

  canBuy() { return true; }
  canSell() { return false; }
}

// Child class 1 - mewarisi User
class Buyer extends User {
  constructor(data) {
    super(data);
    this.cart = [];
  }

  addToCart(product) {
    this.cart.push(product);
    return `${product} ditambahkan ke keranjang`;
  }
}

// Child class 2 - mewarisi User
class Seller extends User {
  constructor(data) {
    super(data);
    this.products = [];
  }

  canSell() { return true; } // override method parent

  addProduct(product) {
    this.products.push(product);
    return `${product} ditambahkan ke toko`;
  }
}

module.exports = { User, Buyer, Seller };