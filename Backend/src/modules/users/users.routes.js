const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authenticate, requireStaff, requireStaffPasswordReset, requireCustomer } = require('../../middleware/auth');
const { uploadAvatar } = require('../../middleware/upload');
const controller = require('./users.controller');
const {
  updateStaffProfileSchema,
  changeStaffPasswordSchema,
  connectBankSchema,
  changePasswordSchema,
  addAddressSchema,
} = require('./users.validators');

router.use(authenticate());

// Works for either account type — returns whichever profile matches the token.
router.get('/me', controller.getMe);

// ---- Staff (account-settings.html) ----
router.patch('/staff/me', requireStaff(), validate({ body: updateStaffProfileSchema }), controller.updateStaffProfile);
router.post(
  '/staff/me/bank-account',
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ body: connectBankSchema }),
  controller.connectBankAccount
);
router.post(
  '/staff/me/password',
  requireStaffPasswordReset,
  validate({ body: changeStaffPasswordSchema }),
  controller.changeStaffPassword
);
router.post('/staff/me/avatar', requireStaff(), uploadAvatar.single('avatar'), controller.uploadAvatar);

// ---- Customers ----
router.post('/customer/me/addresses', requireCustomer, validate({ body: addAddressSchema }), controller.addAddress);
router.post(
  '/customer/me/password',
  requireCustomer,
  validate({ body: changePasswordSchema }),
  controller.changeCustomerPassword
);

module.exports = router;
