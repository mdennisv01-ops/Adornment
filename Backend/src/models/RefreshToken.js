const { Schema, model } = require('mongoose');

// Refresh tokens are stored hashed (see utils/jwt.hashToken) so a leaked DB
// dump can't be replayed directly. ownerType + owner lets Staff and Customer
// share one rotation/revocation table.
const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    ownerType: { type: String, enum: ['STAFF', 'CUSTOMER'], required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    revokedAt: Date,
    replacedBy: String,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ ownerType: 1, staffId: 1 });
refreshTokenSchema.index({ ownerType: 1, customerId: 1 });
// Mongo TTL index: once a token is past expiry, let the DB garbage-collect it.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('RefreshToken', refreshTokenSchema);
