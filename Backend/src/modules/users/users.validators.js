const { z } = require('zod');

const updateStaffProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_-]+$/).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  phone: z.string().min(7).max(20).optional(),
});

const connectBankSchema = z.object({
  provider: z.string().min(2).max(40),
  providerAccountId: z.string().min(4).max(200), // token/reference from the payments provider's client SDK
  bankName: z.string().max(100).optional(),
  accountLast4: z.string().length(4).optional(),
});

const changeStaffPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(72),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

const addAddressSchema = z.object({
  label: z.string().max(30).optional(),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  isDefault: z.coerce.boolean().optional(),
});

module.exports = {
  updateStaffProfileSchema,
  changeStaffPasswordSchema,
  connectBankSchema,
  changePasswordSchema,
  addAddressSchema,
};
