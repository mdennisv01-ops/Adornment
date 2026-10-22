const asyncHandler = require('../../utils/asyncHandler');
const productsService = require('./products.service');

const isStaff = (req) => req.user && req.user.type === 'STAFF';

const listCategories = asyncHandler(async (req, res) => {
  const categories = await productsService.listCategories();
  res.json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await productsService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

const listProducts = asyncHandler(async (req, res) => {
  const result = await productsService.listProducts(req.query, { publishedOnly: !isStaff(req) });
  res.json({ success: true, data: result });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productsService.getProductById(req.params.id, { publishedOnly: !isStaff(req) });
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(req.params.id, req.body);
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productsService.deleteProduct(req.params.id);
  res.status(204).send();
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded' });
  const url = `/uploads/products/${req.file.filename}`;
  const image = await productsService.addProductImage(req.params.id, url, {
    isPrimary: req.body.isPrimary === 'true',
  });
  res.status(201).json({ success: true, data: image });
});

module.exports = {
  listCategories,
  createCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
