const { Product, InventoryMovement } = require('../../models');
const ApiError = require('../../utils/ApiError');

const LOW_STOCK_THRESHOLD = 5;

/** Finds the product owning a given variant subdocument id. */
async function findProductByVariantId(variantId) {
  const product = await Product.findOne({ 'variants._id': variantId });
  if (!product) throw ApiError.notFound('Product variant not found');
  return product;
}

/**
 * Applies a signed quantity delta to a variant's embedded stock count with a
 * conditional positional update (sales cannot take stock below zero), then
 * records the movement. This powers the "Add Stock" modal and adjustments.
 */
async function applyStockDelta({ variantId, quantity, type, reason, staffId }) {
  const product = await findProductByVariantId(variantId);
  const variant = product.variants.id(variantId);

  const newStock = variant.stock + quantity;
  if (newStock < 0) throw ApiError.badRequest('This change would result in negative stock');

  const variantMatch = { _id: variantId };
  if (quantity < 0) variantMatch.stock = { $gte: -quantity };
  const filter = { _id: product._id, variants: { $elemMatch: variantMatch } };

  const updated = await Product.findOneAndUpdate(
    filter,
    { $inc: { 'variants.$.stock': quantity } },
    { new: true }
  );
  if (!updated) throw ApiError.badRequest('Not enough stock available');

  await InventoryMovement.create({
    product: product._id,
    variantId,
    type,
    quantity,
    reason,
    staff: staffId,
  });

  return updated.variants.id(variantId);
}

async function restock({ variantId, quantity, reason, staffId }) {
  return applyStockDelta({ variantId, quantity, type: 'RESTOCK', reason, staffId });
}

async function adjustStock({ variantId, quantity, reason, staffId }) {
  return applyStockDelta({ variantId, quantity, type: 'ADJUSTMENT', reason, staffId });
}

/** Called by the orders module when a sale is placed, to decrement stock. */
async function recordSale({ variantId, quantity, staffId }) {
  return applyStockDelta({ variantId, quantity: -Math.abs(quantity), type: 'SALE', staffId });
}

async function listMovements({ productId, page = 1, pageSize = 25 } = {}) {
  const where = productId ? { product: productId } : {};
  const [items, total] = await Promise.all([
    InventoryMovement.find(where)
      .populate('product', 'name sku')
      .populate('staff', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    InventoryMovement.countDocuments(where),
  ]);
  return { items, total, page, pageSize };
}

async function lowStockReport() {
  const products = await Product.find({ 'variants.stock': { $lte: LOW_STOCK_THRESHOLD } }).select(
    'name sku variants'
  );

  // Flatten to one row per low-stock variant, since that's what the
  // dashboard's low-stock widget actually lists.
  const rows = [];
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.stock <= LOW_STOCK_THRESHOLD) {
        rows.push({
          productId: product._id,
          productName: product.name,
          variantId: variant._id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        });
      }
    }
  }
  rows.sort((a, b) => a.stock - b.stock);
  return rows;
}

module.exports = {
  restock,
  adjustStock,
  recordSale,
  listMovements,
  lowStockReport,
  findProductByVariantId,
  LOW_STOCK_THRESHOLD,
};
