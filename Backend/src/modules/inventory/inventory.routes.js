const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authenticate, requireStaff } = require('../../middleware/auth');
const controller = require('./inventory.controller');
const { stockChangeSchema, listMovementsQuerySchema } = require('./inventory.validators');

router.use(authenticate(), requireStaff('OWNER', 'ADMIN', 'SELLER'));

router.post('/restock', validate({ body: stockChangeSchema }), controller.restock);
router.post('/adjust', validate({ body: stockChangeSchema }), controller.adjustStock);
router.get('/movements', validate({ query: listMovementsQuerySchema }), controller.listMovements);
router.get('/low-stock', controller.lowStock);

module.exports = router;
