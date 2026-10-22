const { Cart, Product } = require('../../models');
const ApiError = require('../../utils/ApiError');

async function getOrCreateCart(customerId) {
  let cart = await Cart.findOne({ customer: customerId });
  if (!cart) cart = await Cart.create({ customer: customerId, items: [] });
  return cart;
}

async function getCart(customerId) {
  const cart = await getOrCreateCart(customerId);
  return populateCart(cart);
}

/** Attaches live product/variant details (name, price, image, stock) to each cart line. */
async function populateCart(cart) {
  const productIds = [...new Set(cart.items.map((i) => i.product.toString()))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  const items = cart.items
    .map((item) => {
      const product = productById.get(item.product.toString());
      const variant = product && product.variants.id(item.variantId);
      if (!product || !variant) return null; // product/variant was deleted since being added
      return {
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        size: variant.size,
        color: variant.color,
        unitPrice: parseFloat(product.price.toString()),
        quantity: item.quantity,
        availableStock: variant.stock,
        image: product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || null,
      };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return { id: cart._id, items, subtotal: Math.round(subtotal * 100) / 100 };
}

async function addItem(customerId, { productId, variantId, quantity }) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  const variant = product.variants.id(variantId);
  if (!variant) throw ApiError.notFound('Product variant not found');
  if (variant.stock < quantity) throw ApiError.badRequest('Not enough stock available');

  const cart = await getOrCreateCart(customerId);
  const existing = cart.items.find((i) => i.variantId.toString() === variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, variantId, quantity });
  }
  await cart.save();
  return populateCart(cart);
}

async function updateItemQuantity(customerId, variantId, quantity) {
  const cart = await getOrCreateCart(customerId);
  const item = cart.items.find((i) => i.variantId.toString() === variantId);
  if (!item) throw ApiError.notFound('Item not in cart');

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.variantId.toString() !== variantId);
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  return populateCart(cart);
}

async function removeItem(customerId, variantId) {
  return updateItemQuantity(customerId, variantId, 0);
}

async function clearCart(customerId) {
  const cart = await getOrCreateCart(customerId);
  cart.items = [];
  await cart.save();
  return cart;
}

module.exports = { getCart, getOrCreateCart, addItem, updateItemQuantity, removeItem, clearCart };
