const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { authenticate, requireStaff } = require('../../middleware/auth');
const controller = require('./auth.controller');
const {
  staffRegisterSchema,
  staffLoginSchema,
  customerRegisterSchema,
  customerLoginSchema,
} = require('./auth.validators');

// Staff accounts can only be provisioned by an authenticated owner.
router.post(
  '/staff/register',
  authenticate(),
  requireStaff('OWNER'),
  authLimiter,
  validate({ body: staffRegisterSchema }),
  controller.staffRegister
);
router.post('/staff/login', authLimiter, validate({ body: staffLoginSchema }), controller.staffLogin);

// Customer (storefront) auth
router.post(
  '/customer/register',
  authLimiter,
  validate({ body: customerRegisterSchema }),
  controller.customerRegister
);
router.post('/customer/login', authLimiter, validate({ body: customerLoginSchema }), controller.customerLogin);

// Shared
router.post('/refresh', authLimiter, controller.refresh);
router.post('/logout', controller.logout);

module.exports = router;
