const { Schema, model } = require('mongoose');

// Every stock change is logged here (audit trail for the "Add Stock" modal
// on dashboard.html / Inventory.html), rather than mutating stock silently.
const inventoryMovementSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true }, // id of the subdocument in Product.variants
    type: { type: String, enum: ['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN'], required: true },
    quantity: { type: Number, required: true }, // positive for restock/return, negative for sale/adjustment-down
    reason: String,
    staff: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = model('InventoryMovement', inventoryMovementSchema);
