const bcrypt = require("bcrypt");

class Auth {
  #password; // private field = encapsulation

  constructor(email, password) {
    this.email = email;
    this.#password = password;
  }

  async hashPassword() {
    return await bcrypt.hash(this.#password, 10);
  }

  async verifyPassword(hashedPassword) {
    return await bcrypt.compare(this.#password, hashedPassword);
  }

  getEmail() {
    return this.email; // akses email lewat method, bukan langsung
  }
}

module.exports = Auth;