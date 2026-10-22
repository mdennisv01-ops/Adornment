const { Order } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { generateOrderNumber } = require('../../utils/generateCode');
const cartService = require('./cart.service');
const inventoryService = require('../inventory/inventory.service');
const env = require('../../config/env');

const SHIPPING_FEE = 0; // flat/free shipping for now — swap in real rate calculation here

/**
 * Turns the customer's current cart into an Order: snapshots product
 * name/price at time of purchase, decrements stock for each line (which
 * also writes the SALE inventory movement), and empties the cart.
 *
 * Note: this runs as a sequence of awaited steps rather than a Mongo
 * multi-document transaction, since transactions require a replica-set
 * deployment. In production, wrap this in a `mongoose.startSession()`
 * transaction once running against a replica set / Atlas cluster.
 */
async function checkout(customerId, { shippingAddress }) {
  if (env.nodeEnv === 'production') {
    throw ApiError.unavailable('Checkout is not enabled until payment processing is configured.');
  }
  const cart = await cartService.getCart(customerId);
  if (!cart.items.length) throw ApiError.badRequest('Cart is empty');

  // Validate stock for every line up front so we fail before touching anything.
  for (const item of cart.items) {
    if (item.availableStock < item.quantity) {
      throw ApiError.badRequest(`Not enough stock for ${item.name}`);
    }
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = subtotal + SHIPPING_FEE;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    items: cart.items.map((i) => ({
      product: i.productId,
      variantId: i.variantId,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    subtotal,
    shippingFee: SHIPPING_FEE,
    total,
    shippingAddress,
  });

  for (const item of cart.items) {
    await inventoryService.recordSale({ variantId: item.variantId, quantity: item.quantity });
  }

  await cartService.clearCart(customerId);
  return order;
}

async function listOrders({ status, customerId, page = 1, pageSize = 20 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customer = customerId;

  const [items, total] = await Promise.all([
    Order.find(where)
      .populate('customer', 'username phone email')
      .populate('fulfilledBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Order.countDocuments(where),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function getOrderById(id, { customerId } = {}) {
  const where = { _id: id };
  if (customerId) where.customer = customerId; // scope to the requesting customer's own orders
  const order = await Order.findOne(where).populate('customer', 'username phone email').populate(
    'fulfilledBy',
    'name'
  );
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

/** Matches the "Fulfill" action button on sales.html. */
async function fulfillOrder(id, staffId) {
  const order = await getOrderById(id);
  if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
    throw ApiError.badRequest(`Cannot fulfill an order that is ${order.status}`);
  }
  order.status = 'FULFILLED';
  order.fulfilledBy = staffId;
  order.fulfilledAt = new Date();
  await order.save();
  return order;
}

async function updateStatus(id, status) {
  const order = await getOrderById(id);
  order.status = status;
  await order.save();
  return order;
}

module.exports = { checkout, listOrders, getOrderById, fulfillOrder, updateStatus };
