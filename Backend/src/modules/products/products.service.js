const { Product, Category } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { generateSku } = require('../../utils/generateCode');

async function listCategories() {
  return Category.find().sort({ name: 1 });
}

async function createCategory({ name, slug }) {
  const existing = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existing) throw ApiError.conflict('A category with this name or slug already exists');
  return Category.create({ name, slug });
}

/** Storefront + admin product listing with pagination and basic filters. */
async function listProducts({ category, q, page, pageSize, minPrice, maxPrice }, { publishedOnly }) {
  const where = {};
  if (publishedOnly) where.isPublished = true;
  if (q) where.$text = { $search: q };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.$gte = minPrice;
    if (maxPrice) where.price.$lte = maxPrice;
  }

  if (category) {
    const cat = await Category.findOne({ slug: category });
    // No matching category → short-circuit to an empty page rather than
    // throwing, since "no results" is the correct answer to an unknown filter.
    if (!cat) return { items: [], total: 0, page, pageSize, totalPages: 1 };
    where.category = cat._id;
  }

  const [items, total] = await Promise.all([
    Product.find(where)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(where),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function getProductById(id, { publishedOnly } = {}) {
  const where = { _id: id };
  if (publishedOnly) where.isPublished = true;
  const product = await Product.findOne(where).populate('category');
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function createProduct({ name, description, price, currency, categorySlug, variants }) {
  const category = await Category.findOne({ slug: categorySlug });
  if (!category) throw ApiError.badRequest(`Unknown category slug: ${categorySlug}`);

  const product = await Product.create({
    name,
    description,
    price,
    currency,
    category: category._id,
    sku: generateSku(category.slug),
    variants: variants.map((v) => ({
      size: v.size,
      color: v.color,
      stock: v.stock,
      sku: generateSku(`${category.slug}-${v.size || 'os'}-${v.color || 'std'}`),
    })),
  });

  return product.populate('category');
}

async function updateProduct(id, patch) {
  const product = await getProductById(id);

  const { variants, categorySlug, ...rest } = patch; // eslint-disable-line no-unused-vars
  // Variant stock is only ever changed via inventory movements, never a
  // generic PATCH, so it's intentionally excluded here.

  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) throw ApiError.badRequest(`Unknown category slug: ${categorySlug}`);
    rest.category = category._id;
  }

  Object.assign(product, rest);
  await product.save();
  return product.populate('category');
}

async function deleteProduct(id) {
  const product = await getProductById(id);
  await product.deleteOne();
}

async function addProductImage(productId, url, { isPrimary = false } = {}) {
  const product = await getProductById(productId);
  if (isPrimary) product.images.forEach((img) => (img.isPrimary = false));
  product.images.push({ url, isPrimary, position: product.images.length });
  await product.save();
  return product.images[product.images.length - 1];
}

module.exports = {
  listCategories,
  createCategory,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
};
