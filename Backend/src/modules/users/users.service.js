const { Staff, Customer, RefreshToken } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { hashPassword, comparePassword } = require('../../utils/password');

async function getStaffProfile(id) {
  const staff = await Staff.findById(id);
  if (!staff) throw ApiError.notFound('Staff not found');
  return staff.toSafeJSON();
}

async function updateStaffProfile(id, patch) {
  const staff = await Staff.findById(id);
  if (!staff) throw ApiError.notFound('Staff not found');

  if (patch.email || patch.username) {
    const conflicts = await Staff.findOne({
      _id: { $ne: staff._id },
      $or: [
        ...(patch.email ? [{ email: patch.email.toLowerCase() }] : []),
        ...(patch.username ? [{ username: patch.username.toLowerCase() }] : []),
      ],
    });
    if (conflicts) throw ApiError.conflict('Email or username is already in use');
  }

  if (patch.email) patch.email = patch.email.toLowerCase();
  if (patch.username) patch.username = patch.username.toLowerCase();
  Object.assign(staff, patch);
  await staff.save();
  return staff.toSafeJSON();
}

/**
 * Stores only a provider token/reference and last 4 digits — the "Connect
 * bank account" action in account-settings.html should hand off to the
 * payments provider's own hosted/tokenized flow (e.g. Stripe Connect,
 * Paystack), never collect a raw account number directly.
 */
async function connectBankAccount(staffId, { provider, providerAccountId, bankName, accountLast4 }) {
  const staff = await Staff.findById(staffId);
  if (!staff) throw ApiError.notFound('Staff not found');

  staff.bankAccount = { provider, providerAccountId, bankName, accountLast4, isVerified: false };
  await staff.save();
  return staff.toSafeJSON().bankAccount;
}

async function changeStaffPassword(staffId, { currentPassword, newPassword }) {
  const staff = await Staff.findById(staffId).select('+passwordHash');
  if (!staff) throw ApiError.notFound('Staff not found');

  const valid = await comparePassword(currentPassword, staff.passwordHash);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  staff.passwordHash = await hashPassword(newPassword);
  staff.mustChangePassword = false;
  await staff.save();
  await RefreshToken.updateMany(
    { ownerType: 'STAFF', staffId: staff._id, revokedAt: null },
    { revokedAt: new Date() }
  );
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

async function getCustomerProfile(id) {
  const customer = await Customer.findById(id);
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer.toSafeJSON();
}

async function addCustomerAddress(customerId, address) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw ApiError.notFound('Customer not found');

  if (address.isDefault) customer.addresses.forEach((a) => (a.isDefault = false));
  customer.addresses.push(address);
  await customer.save();
  return customer.toSafeJSON().addresses;
}

async function changeCustomerPassword(customerId, { currentPassword, newPassword }) {
  const customer = await Customer.findById(customerId).select('+passwordHash');
  if (!customer) throw ApiError.notFound('Customer not found');

  const valid = await comparePassword(currentPassword, customer.passwordHash);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  customer.passwordHash = await hashPassword(newPassword);
  await customer.save();
}

module.exports = {
  getStaffProfile,
  updateStaffProfile,
  connectBankAccount,
  changeStaffPassword,
  getCustomerProfile,
  addCustomerAddress,
  changeCustomerPassword,
};
