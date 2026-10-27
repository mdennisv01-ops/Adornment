const { z } = require('zod');

const normalizeOptionalString = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const staffRegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.preprocess(normalizeOptionalString, z.string().email()),
  phone: z.preprocess(normalizeOptionalString, z.string().min(7).max(20).optional()),
  password: z.string().trim().min(12).max(72),
});

const staffLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(254).optional(),
  email: z.preprocess(normalizeOptionalString, z.string().email().optional()),
  password: z.string().trim().min(1),
}).refine((body) => body.identifier || body.email, { message: 'Username or email is required' });

// Mirrors login.html: username + password + phone number.
const customerRegisterSchema = z.object({
  username: z.string().trim().min(3).max(40),
  phone: z.string().trim().min(7).max(20),
  password: z.string().trim().min(12).max(72),
  email: z.preprocess(normalizeOptionalString, z.string().email().optional()),
});

const customerLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

module.exports = {
  staffRegisterSchema,
  staffLoginSchema,
  customerRegisterSchema,
  customerLoginSchema,
  refreshSchema,
};
