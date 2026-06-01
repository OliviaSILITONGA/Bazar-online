const supabase = require("../config/supabase");

/**
 * GET CART
 */
const getCart = async (userId) => {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        user_id,
        product_id,
        quantity,
        note,
        created_at,
        updated_at,
        products (
          id,
          seller_id,
          name,
          description,
          price,
          stock,
          min_order,
          category,
          tags,
          location,
          availability,
          schedule,
          like_count,
          is_active,
          seller:users!fk_product_seller (
            id,
            name,
            avatar_url
          ),
          product_images (
            image_url
          )
        )
      `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * ADD TO CART
 */
const addToCart = async ({ userId, product_id, quantity = 1, note }) => {
  if (quantity < 1) {
    throw new Error("Quantity minimal 1");
  }

  // cek produk
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock, is_active")
    .eq("id", product_id)
    .single();

  if (productError || !product) {
    throw new Error("Produk tidak ditemukan");
  }

  if (!product.is_active) {
    throw new Error("Produk tidak aktif");
  }

  if (quantity > product.stock) {
    throw new Error("Stok tidak mencukupi");
  }

  // cek item existing
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  // jika sudah ada → update quantity
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new Error("Total quantity melebihi stok");
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity: newQuantity,
        note: note ?? existingItem.note,
      })
      .eq("id", existingItem.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // insert baru
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      user_id: userId,
      product_id,
      quantity,
      note,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * UPDATE CART ITEM
 */
const updateCartItem = async ({ userId, itemId, quantity, note }) => {
  const { data: item, error: itemError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (itemError || !item) {
    throw new Error("Item keranjang tidak ditemukan");
  }

  // ambil product untuk validasi stock
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock, is_active")
    .eq("id", item.product_id)
    .single();

  if (productError || !product) {
    throw new Error("Produk tidak ditemukan");
  }

  if (!product.is_active) {
    throw new Error("Produk tidak aktif");
  }

  const payload = {};

  if (quantity !== undefined) {
    if (quantity < 1) {
      throw new Error("Quantity minimal 1");
    }

    if (quantity > product.stock) {
      throw new Error("Stok tidak mencukupi");
    }

    payload.quantity = quantity;
  }

  if (note !== undefined) {
    payload.note = note;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update(payload)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * REMOVE ITEM
 */
const removeCartItem = async (userId, itemId) => {
  const { data: item, error } = await supabase
    .from("cart_items")
    .select("id")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (error || !item) {
    throw new Error("Item keranjang tidak ditemukan");
  }

  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return true;
};

/**
 * CLEAR CART
 */
const clearCart = async (userId) => {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};