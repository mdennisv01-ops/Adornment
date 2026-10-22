const router = require('express').Router();
const { authenticate, requireStaff } = require('../../middleware/auth');
const controller = require('./dashboard.controller');

router.get('/overview', authenticate(), requireStaff('OWNER', 'ADMIN', 'SELLER'), controller.getOverview);

module.exports = router;
