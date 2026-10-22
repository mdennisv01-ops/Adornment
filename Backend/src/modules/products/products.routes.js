const router = require('express').Router();
const validate = require('../../middleware/validate');
const { authenticate, requireStaff } = require('../../middleware/auth');
const { uploadProductImage } = require('../../middleware/upload');
const controller = require('./products.controller');
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  idParamSchema,
  createCategorySchema,
} = require('./products.validators');

// Categories
router.get('/categories', controller.listCategories);
router.post(
  '/categories',
  authenticate(),
  requireStaff('OWNER', 'ADMIN'),
  validate({ body: createCategorySchema }),
  controller.createCategory
);

// Products — public storefront browsing (optional auth so staff also see unpublished items)
router.get(
  '/',
  authenticate({ optional: true }),
  validate({ query: listProductsQuerySchema }),
  controller.listProducts
);
router.get(
  '/:id',
  authenticate({ optional: true }),
  validate({ params: idParamSchema }),
  controller.getProduct
);

// Products — staff management
router.post(
  '/',
  authenticate(),
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ body: createProductSchema }),
  controller.createProduct
);
router.patch(
  '/:id',
  authenticate(),
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ params: idParamSchema, body: updateProductSchema }),
  controller.updateProduct
);
router.delete(
  '/:id',
  authenticate(),
  requireStaff('OWNER', 'ADMIN'),
  validate({ params: idParamSchema }),
  controller.deleteProduct
);
router.post(
  '/:id/images',
  authenticate(),
  requireStaff('OWNER', 'ADMIN', 'SELLER'),
  validate({ params: idParamSchema }),
  uploadProductImage.single('image'),
  controller.uploadImage
);

module.exports = router;
