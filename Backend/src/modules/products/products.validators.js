const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const variantInput = z.object({
  size: z.string().max(20).optional(),
  color: z.string().max(30).optional(),
  stock: z.coerce.number().int().min(0).default(0),
});

const createProductSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive(),
  currency: z.string().length(3).default('USD'),
  categorySlug: z.string().min(1),
  variants: z.array(variantInput).min(1),
});

const updateProductSchema = createProductSchema.partial().extend({
  isPublished: z.coerce.boolean().optional(),
});

const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

const idParamSchema = z.object({ id: objectIdSchema });

const restockSchema = z.object({
  variantId: objectIdSchema,
  quantity: z.coerce.number().int().positive(),
  reason: z.string().max(200).optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  idParamSchema,
  restockSchema,
  createCategorySchema,
};
