const { Schema, model } = require('mongoose');

const bankAccountSchema = new Schema(
  {
    provider: { type: String, required: true }, // e.g. "stripe", "paystack"
    providerAccountId: { type: String, required: true }, // tokenized reference, never a raw account number
    bankName: String,
    accountLast4: String,
    isVerified: { type: Boolean, default: false },
  },
  { _id: false, timestamps: true }
);

const staffSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    username: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['OWNER', 'ADMIN', 'SELLER'], default: 'SELLER' },
    avatarUrl: String,
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    // Payout details entered in account-settings.html ("Connect bank account").
    bankAccount: { type: bankAccountSchema, default: null },
  },
  { timestamps: true }
);

staffSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ versionKey: false });
  delete obj.passwordHash;
  return obj;
};

module.exports = model('Staff', staffSchema);
