const { Staff, Customer, RefreshToken } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { hashPassword, comparePassword } = require('../../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../utils/jwt');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // fallback if env parsing ever fails

/** Issues a fresh access+refresh pair and persists the refresh token's hash. */
async function issueTokens({ id, type, role, mustChangePassword = false }) {
  const payload = { sub: id.toString(), type, ...(role ? { role } : {}), ...(type === 'STAFF' ? { mustChangePassword } : {}) };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    ownerType: type,
    staffId: type === 'STAFF' ? id : undefined,
    customerId: type === 'CUSTOMER' ? id : undefined,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// Staff (admin dashboard)
// ---------------------------------------------------------------------------

async function registerStaff({ name, email, phone, password }) {
  const existing = await Staff.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const staff = await Staff.create({
    name,
    email,
    phone,
    passwordHash: await hashPassword(password),
    role: 'SELLER',
  });
  const tokens = await issueTokens({ id: staff._id, type: 'STAFF', role: staff.role });
  return { staff: staff.toSafeJSON(), ...tokens };
}

async function loginStaff({ identifier, email, password }) {
  const loginName = (identifier || email || '').trim().toLowerCase();
  const staff = await Staff.findOne({ $or: [{ email: loginName }, { username: loginName }] }).select('+passwordHash');
  if (!staff || !staff.isActive) throw ApiError.unauthorized('Invalid username or password');

  const valid = await comparePassword(password, staff.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid username or password');

  const tokens = await issueTokens({ id: staff._id, type: 'STAFF', role: staff.role, mustChangePassword: staff.mustChangePassword });
  return { staff: staff.toSafeJSON(), ...tokens };
}

// ---------------------------------------------------------------------------
// Customers (storefront)
// ---------------------------------------------------------------------------

async function registerCustomer({ username, phone, password, email }) {
  const existing = await Customer.findOne({
    $or: [{ username }, { phone }, ...(email ? [{ email }] : [])],
  });
  if (existing) throw ApiError.conflict('Username, phone, or email already in use');

  const customer = await Customer.create({
    username,
    phone,
    email,
    passwordHash: await hashPassword(password),
  });

  const tokens = await issueTokens({ id: customer._id, type: 'CUSTOMER' });
  return { customer: customer.toSafeJSON(), ...tokens };
}

async function loginCustomer({ username, password, phone }) {
  const customer = await Customer.findOne({ username }).select('+passwordHash');
  if (!customer || !customer.isActive || customer.phone !== phone) {
    throw ApiError.unauthorized('Invalid username, phone, or password');
  }

  const valid = await comparePassword(password, customer.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid username, phone, or password');

  const tokens = await issueTokens({ id: customer._id, type: 'CUSTOMER' });
  return { customer: customer.toSafeJSON(), ...tokens };
}

// ---------------------------------------------------------------------------
// Shared: refresh rotation + logout
// ---------------------------------------------------------------------------

/**
 * Rotates a refresh token: verifies the JWT signature, confirms the token's
 * hash is still active (not revoked/reused) in the DB, revokes it, and
 * issues a brand new pair. This lets us detect token-reuse (a revoked
 * token being replayed) as a signal of theft.
 */
async function refreshTokens(rawRefreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const tokens = await issueTokens({ id: payload.sub, type: payload.type, role: payload.role, mustChangePassword: payload.mustChangePassword });

  stored.revokedAt = new Date();
  stored.replacedBy = hashToken(tokens.refreshToken);
  await stored.save();

  return tokens;
}

async function logout(rawRefreshToken) {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateMany({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}

module.exports = {
  registerStaff,
  loginStaff,
  registerCustomer,
  loginCustomer,
  refreshTokens,
  logout,
};
