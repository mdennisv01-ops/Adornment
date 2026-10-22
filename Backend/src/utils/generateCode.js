const { v4: uuidv4 } = require('uuid');

/** Human-facing order number, e.g. ADN-7F3C1A9B. */
function generateOrderNumber() {
  return `ADN-${uuidv4().split('-')[0].toUpperCase()}`;
}

/** SKU from a category slug + short random suffix, e.g. GOWNS-4B9E1C. */
function generateSku(categorySlug) {
  const suffix = uuidv4().split('-')[0].toUpperCase();
  return `${categorySlug.toUpperCase()}-${suffix}`;
}

module.exports = { generateOrderNumber, generateSku };
