const router = require('express').Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/products', require('../modules/products/products.routes'));
router.use('/inventory', require('../modules/inventory/inventory.routes'));
router.use('/orders', require('../modules/orders/orders.routes'));
router.use('/ai-studio', require('../modules/aiStudio/aiStudio.routes'));
router.use('/users', require('../modules/users/users.routes'));
router.use('/dashboard', require('../modules/dashboard/dashboard.routes'));
router.use('/contact', require('../modules/contact/contact.routes'));

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date() } }));

module.exports = router;
