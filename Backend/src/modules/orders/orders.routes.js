const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authenticate, requireStaff, requireCustomer } = require('../../middleware/auth');
const controller = require('./orders.controller');
const {
  addCartItemSchema,
  updateCartItemSchema,
  checkoutSchema,
  listOrdersQuerySchema,
  updateStatusSchema,
  idParamSchema,
  variantIdParamSchema,
} = require('./orders.validators');

// ---- Cart — customer only ----
router.get('/cart', authenticate(), requireCustomer, controller.getCart);
router.post('/cart/items', authenticate(), requireCustomer, validate({ body: addCartItemSchema }), controller.addToCart);
router.patch(
  '/cart/items/:variantId',
  authenticate(),
  requireCustomer,
  validate({ params: variantIdParamSchema, body: updateCartItemSchema }),
  controller.updateCartItem
);
router.delete(
  '/cart/items/:variantId',
  authenticate(),
  requireCustomer,
  validate({ params: variantIdParamSchema }),
  controller.removeCartItem
);

// ---- Checkout — customer only ----
router.post('/checkout', authenticate(), requireCustomer, validate({ body: checkoutSchema }), controller.checkout);

// ---- Order history — customer's own orders ----
router.get(
  '/mine',
  authenticate(),
  requireCustomer,
  validate({ query: listOrdersQuerySchema }),
  controller.listMyOrders
);

// ---- Sales / order management — staff only (sales.html) ----
router.get(
  '/',
  authenticate(),
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ query: listOrdersQuerySchema }),
  controller.listAllOrders
);
router.patch(
  '/:id/fulfill',
  authenticate(),
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ params: idParamSchema }),
  controller.fulfillOrder
);
router.patch(
  '/:id/status',
  authenticate(),
  requireStaff('OWNER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateOrderStatus
);

// ---- Shared: view a single order (staff, or the owning customer) ----
router.get('/:id', authenticate(), validate({ params: idParamSchema }), controller.getOrder);

module.exports = router;
