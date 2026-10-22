const { Schema, model } = require('mongoose');

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    position: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Size / color combinations — each variant carries its own stock count and
// SKU. Subdocuments get their own _id, so a variantId is addressable
// independently of the parent product (used by cart items, order items,
// and inventory movements).
const variantSchema = new Schema(
  {
    size: String,
    color: String,
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, maxlength: 2000 },
    price: { type: Schema.Types.Decimal128, required: true },
    currency: { type: String, default: 'USD', minlength: 3, maxlength: 3 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    sku: { type: String, required: true, unique: true },
    isPublished: { type: Boolean, default: true },
    images: { type: [imageSchema], default: [] },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A product needs at least one variant',
      },
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ name: 'text' });

/** Serializes Decimal128 price fields to plain numbers for JSON responses. */
productSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    if (ret.price != null) ret.price = parseFloat(ret.price.toString());
    return ret;
  },
});

module.exports = model('Product', productSchema);
