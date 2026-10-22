const asyncHandler = require('../../utils/asyncHandler');
const cartService = require('./cart.service');
const ordersService = require('./orders.service');

// ---- Cart (customer) ----

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.sub);
  res.json({ success: true, data: cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user.sub, req.body);
  res.status(201).json({ success: true, data: cart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user.sub, req.params.variantId, req.body.quantity);
  res.json({ success: true, data: cart });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.sub, req.params.variantId);
  res.json({ success: true, data: cart });
});

// ---- Orders ----

const checkout = asyncHandler(async (req, res) => {
  const order = await ordersService.checkout(req.user.sub, req.body);
  res.status(201).json({ success: true, data: order });
});

/** Customer viewing their own order history. */
const listMyOrders = asyncHandler(async (req, res) => {
  const result = await ordersService.listOrders({ ...req.query, customerId: req.user.sub });
  res.json({ success: true, data: result });
});

/** Staff viewing all sales — powers sales.html. */
const listAllOrders = asyncHandler(async (req, res) => {
  const result = await ordersService.listOrders(req.query);
  res.json({ success: true, data: result });
});

const getOrder = asyncHandler(async (req, res) => {
  const scopeToSelf = req.user.type === 'CUSTOMER';
  const order = await ordersService.getOrderById(req.params.id, {
    customerId: scopeToSelf ? req.user.sub : undefined,
  });
  res.json({ success: true, data: order });
});

const fulfillOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.fulfillOrder(req.params.id, req.user.sub);
  res.json({ success: true, data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await ordersService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, data: order });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  checkout,
  listMyOrders,
  listAllOrders,
  getOrder,
  fulfillOrder,
  updateOrderStatus,
};
