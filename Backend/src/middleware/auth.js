const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Reads "Authorization: Bearer <token>", verifies it, and attaches
 * req.user = { id, type: 'STAFF' | 'CUSTOMER', role? }.
 * Use `optional: true` for routes that behave differently when logged in
 * but don't require it (e.g. product listing).
 */
function authenticate({ optional = false } = {}) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (optional) return next();
      return next(ApiError.unauthorized('Missing access token'));
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload; // { sub, type, role }
      next();
    } catch (err) {
      if (optional) return next();
      next(ApiError.unauthorized('Invalid or expired access token'));
    }
  };
}

/** Restrict to staff accounts, optionally to specific roles (e.g. ADMIN, OWNER). */
function requireStaff(...roles) {
  return (req, res, next) => {
    if (!req.user || req.user.type !== 'STAFF') {
      return next(ApiError.forbidden('Staff access required'));
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role for this action'));
    }
    if (req.user.mustChangePassword) {
      return next(ApiError.forbidden('Change your temporary password before using the admin dashboard'));
    }
    next();
  };
}

function requireStaffPasswordReset(req, res, next) {
  if (!req.user || req.user.type !== 'STAFF') return next(ApiError.forbidden('Staff access required'));
  next();
}

/** Restrict to customer (storefront) accounts. */
function requireCustomer(req, res, next) {
  if (!req.user || req.user.type !== 'CUSTOMER') {
    return next(ApiError.forbidden('Customer access required'));
  }
  next();
}

module.exports = { authenticate, requireStaff, requireStaffPasswordReset, requireCustomer };
