const { Schema, model } = require('mongoose');

// Matches the storefront nav: Gowns, Suits, Jumpsuit, 2-piece, Summer,
// Collars & Ties, plus whatever categories are added later.
const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
  },
  { timestamps: true }
);

module.exports = model('Category', categorySchema);
