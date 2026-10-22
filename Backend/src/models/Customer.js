const { Schema, model } = require('mongoose');

const addressSchema = new Schema(
  {
    label: String, // "Home", "Work"...
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const customerSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

customerSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ versionKey: false });
  delete obj.passwordHash;
  return obj;
};

module.exports = model('Customer', customerSchema);
