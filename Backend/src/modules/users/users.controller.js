const asyncHandler = require('../../utils/asyncHandler');
const usersService = require('./users.service');

const getMe = asyncHandler(async (req, res) => {
  const profile =
    req.user.type === 'STAFF'
      ? await usersService.getStaffProfile(req.user.sub)
      : await usersService.getCustomerProfile(req.user.sub);
  res.json({ success: true, data: profile });
});

const updateStaffProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.updateStaffProfile(req.user.sub, req.body);
  res.json({ success: true, data: profile });
});

const connectBankAccount = asyncHandler(async (req, res) => {
  const bankAccount = await usersService.connectBankAccount(req.user.sub, req.body);
  res.status(201).json({ success: true, data: bankAccount });
});

const changeStaffPassword = asyncHandler(async (req, res) => {
  await usersService.changeStaffPassword(req.user.sub, req.body);
  res.json({ success: true, data: { message: 'Password updated' } });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No avatar file uploaded' });
  const profile = await usersService.updateStaffProfile(req.user.sub, {
    avatarUrl: `/uploads/avatars/${req.file.filename}`,
  });
  res.status(201).json({ success: true, data: profile });
});

const addAddress = asyncHandler(async (req, res) => {
  const addresses = await usersService.addCustomerAddress(req.user.sub, req.body);
  res.status(201).json({ success: true, data: addresses });
});

const changeCustomerPassword = asyncHandler(async (req, res) => {
  await usersService.changeCustomerPassword(req.user.sub, req.body);
  res.json({ success: true, data: { message: 'Password updated' } });
});

module.exports = {
  getMe,
  updateStaffProfile,
  connectBankAccount,
  changeStaffPassword,
  uploadAvatar,
  addAddress,
  changeCustomerPassword,
};
