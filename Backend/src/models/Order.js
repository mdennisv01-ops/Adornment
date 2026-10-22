const { Schema, model } = require('mongoose');

// Line items are a point-in-time snapshot (name/price at purchase) so later
// edits to a Product never rewrite the history of a past order.
const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    size: String,
    color: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    provider: { type: String, required: true }, // e.g. "stripe", "paystack"
    providerRef: { type: String, required: true }, // charge/session id from the provider
    status: { type: String, enum: ['INITIATED', 'SUCCEEDED', 'FAILED', 'REFUNDED'], default: 'INITIATED' },
    amount: { type: Schema.Types.Decimal128, required: true },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true, _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // human-facing, e.g. ADN-7F3C1A9B
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
    },
    items: { type: [orderItemSchema], required: true, validate: (a) => a.length > 0 },
    subtotal: { type: Schema.Types.Decimal128, required: true },
    shippingFee: { type: Schema.Types.Decimal128, default: 0 },
    total: { type: Schema.Types.Decimal128, required: true },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
    },
    fulfilledBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
    fulfilledAt: Date,
    payment: { type: paymentSchema, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });

function decimalToNumber(v) {
  return v == null ? v : parseFloat(v.toString());
}

orderSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    ret.subtotal = decimalToNumber(ret.subtotal);
    ret.shippingFee = decimalToNumber(ret.shippingFee);
    ret.total = decimalToNumber(ret.total);
    if (ret.items) ret.items.forEach((it) => (it.unitPrice = decimalToNumber(it.unitPrice)));
    if (ret.payment) ret.payment.amount = decimalToNumber(ret.payment.amount);
    return ret;
  },
});

module.exports = model('Order', orderSchema);
